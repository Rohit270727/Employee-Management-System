using System.Globalization;
using System.Linq.Expressions;
using System.Text;
using EmployeeApi.Data;
using EmployeeApi.Models;
using EmployeeApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class EmployeesController(AppDbContext db, AuditService audit, IWebHostEnvironment env) : ControllerBase
{
    static readonly Expression<Func<Employee, EmployeeDto>> Map = e => new EmployeeDto(
        e.Id, e.FullName, e.Email, e.DepartmentId, e.Department!.Name, e.Salary, e.HireDate,
        e.PhotoPath == null ? null : "/uploads/" + e.PhotoPath, e.IsDeleted);

    static readonly string[] AllowedPhotoTypes = { ".jpg", ".jpeg", ".png", ".webp" };

    // ---------- reading ----------

    IQueryable<Employee> Filtered(EmployeeQuery q)
    {
        IQueryable<Employee> query = db.Employees;
        if (q.IncludeDeleted && User.IsInRole("Admin")) query = query.IgnoreQueryFilters();
        query = query.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q.Search))
        {
            var s = q.Search.Trim();
            query = query.Where(e => e.FullName.Contains(s) || e.Email.Contains(s) || e.Department!.Name.Contains(s));
        }
        if (q.DepartmentId is int d) query = query.Where(e => e.DepartmentId == d);
        if (q.MinSalary is decimal min) query = query.Where(e => e.Salary >= min);
        if (q.MaxSalary is decimal max) query = query.Where(e => e.Salary <= max);
        if (q.HiredFrom is DateTime from) query = query.Where(e => e.HireDate >= from);
        if (q.HiredTo is DateTime to) query = query.Where(e => e.HireDate <= to);
        return query;
    }

    static IOrderedQueryable<Employee> Sorted(IQueryable<Employee> query, EmployeeQuery q)
    {
        var desc = string.Equals(q.SortDir, "desc", StringComparison.OrdinalIgnoreCase);
        IOrderedQueryable<Employee> ordered = (q.SortBy ?? "name").ToLowerInvariant() switch
        {
            "salary" => desc ? query.OrderByDescending(e => e.Salary) : query.OrderBy(e => e.Salary),
            "department" => desc ? query.OrderByDescending(e => e.Department!.Name) : query.OrderBy(e => e.Department!.Name),
            "hiredate" => desc ? query.OrderByDescending(e => e.HireDate) : query.OrderBy(e => e.HireDate),
            _ => desc ? query.OrderByDescending(e => e.FullName) : query.OrderBy(e => e.FullName),
        };
        return ordered.ThenBy(e => e.Id);   // stable order for paging
    }

    async Task<EmployeeDto?> Load(int id)
    {
        IQueryable<Employee> src = db.Employees;
        if (User.IsInRole("Admin")) src = src.IgnoreQueryFilters();
        return await src.AsNoTracking().Where(e => e.Id == id).Select(Map).FirstOrDefaultAsync();
    }

    [HttpGet]
    public async Task<PagedResult<EmployeeDto>> GetAll([FromQuery] EmployeeQuery q)
    {
        var page = Math.Max(1, q.Page);
        var size = Math.Clamp(q.PageSize, 1, 100);
        var query = Filtered(q);
        var total = await query.CountAsync();
        var items = await Sorted(query, q).Skip((page - 1) * size).Take(size).Select(Map).ToListAsync();
        return new PagedResult<EmployeeDto>(items, total, page, size);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<EmployeeDto>> Get(int id)
    {
        var dto = await Load(id);
        if (dto is null) return NotFound();
        return dto;
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export([FromQuery] EmployeeQuery q)
    {
        var rows = await Sorted(Filtered(q), q).Select(Map).ToListAsync();
        var sb = new StringBuilder("Id,Full name,Email,Department,Salary,Hire date,Deleted\r\n");
        foreach (var e in rows)
            sb.Append(string.Join(',', e.Id, Csv(e.FullName), Csv(e.Email), Csv(e.DepartmentName),
                e.Salary.ToString("0.00", CultureInfo.InvariantCulture),
                e.HireDate.ToString("yyyy-MM-dd"), e.IsDeleted)).Append("\r\n");

        // UTF-8 BOM so Excel reads accented characters correctly.
        var bytes = Encoding.UTF8.GetPreamble().Concat(Encoding.UTF8.GetBytes(sb.ToString())).ToArray();
        return File(bytes, "text/csv", "employees.csv");
    }

    // Quotes the value and neutralises spreadsheet formulas such as =CMD(...).
    static string Csv(string v)
    {
        if (v.Length > 0 && "=+-@".Contains(v[0])) v = "'" + v;
        return "\"" + v.Replace("\"", "\"\"") + "\"";
    }

    // ---------- writing (Admin only) ----------

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<ActionResult<EmployeeDto>> Create(EmployeeInput input)
    {
        if (!await db.Departments.AnyAsync(d => d.Id == input.DepartmentId))
            return BadRequest(new { message = "Department not found." });
        if (await db.Employees.AnyAsync(e => e.Email == input.Email))
            return Conflict(new { message = "An employee with this email already exists." });

        var emp = new Employee
        {
            FullName = input.FullName.Trim(), Email = input.Email.Trim(), DepartmentId = input.DepartmentId,
            Salary = input.Salary, HireDate = input.HireDate.Date,
        };
        db.Employees.Add(emp);
        await db.SaveChangesAsync();
        audit.Log("Create", "Employee", emp.Id, $"Created {emp.FullName} ({emp.Email})");
        await db.SaveChangesAsync();

        var dto = await Load(emp.Id);
        return CreatedAtAction(nameof(Get), new { id = emp.Id }, dto);
    }

    [HttpPut("{id:int}"), Authorize(Roles = "Admin")]
    public async Task<ActionResult<EmployeeDto>> Update(int id, EmployeeInput input)
    {
        var emp = await db.Employees.FirstOrDefaultAsync(e => e.Id == id);
        if (emp is null) return NotFound();
        if (!await db.Departments.AnyAsync(d => d.Id == input.DepartmentId))
            return BadRequest(new { message = "Department not found." });
        if (await db.Employees.AnyAsync(e => e.Email == input.Email && e.Id != id))
            return Conflict(new { message = "Another employee already uses this email." });

        var changes = new List<string>();
        void Diff(string name, object? oldValue, object? newValue)
        {
            if (!Equals(oldValue, newValue)) changes.Add($"{name}: {oldValue} -> {newValue}");
        }
        Diff("Name", emp.FullName, input.FullName.Trim());
        Diff("Email", emp.Email, input.Email.Trim());
        Diff("DepartmentId", emp.DepartmentId, input.DepartmentId);
        Diff("Salary", emp.Salary, input.Salary);
        Diff("Hire date", emp.HireDate.ToString("yyyy-MM-dd"), input.HireDate.ToString("yyyy-MM-dd"));

        emp.FullName = input.FullName.Trim();
        emp.Email = input.Email.Trim();
        emp.DepartmentId = input.DepartmentId;
        emp.Salary = input.Salary;
        emp.HireDate = input.HireDate.Date;

        audit.Log("Update", "Employee", id, changes.Count == 0 ? "No field changes" : string.Join("; ", changes));
        await db.SaveChangesAsync();

        var dto = await Load(id);
        if (dto is null) return NotFound();
        return dto;
    }

    // Soft delete: the row stays in the table with IsDeleted = true.
    [HttpDelete("{id:int}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var emp = await db.Employees.FirstOrDefaultAsync(e => e.Id == id);
        if (emp is null) return NotFound();
        emp.IsDeleted = true;
        emp.DeletedAt = DateTime.UtcNow;
        audit.Log("Delete", "Employee", id, $"Soft-deleted {emp.FullName}");
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/restore"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Restore(int id)
    {
        var emp = await db.Employees.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == id && e.IsDeleted);
        if (emp is null) return NotFound();
        if (await db.Employees.AnyAsync(e => e.Email == emp.Email))
            return Conflict(new { message = "Cannot restore: another active employee uses this email." });

        emp.IsDeleted = false;
        emp.DeletedAt = null;
        audit.Log("Restore", "Employee", id, $"Restored {emp.FullName}");
        await db.SaveChangesAsync();
        return NoContent();
    }

    [HttpPost("{id:int}/photo"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> UploadPhoto(int id, IFormFile file)
    {
        var emp = await db.Employees.FirstOrDefaultAsync(e => e.Id == id);
        if (emp is null) return NotFound();

        var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedPhotoTypes.Contains(ext))
            return BadRequest(new { message = "Only JPG, PNG or WEBP images are allowed." });
        if (file.Length is 0 or > 2 * 1024 * 1024)
            return BadRequest(new { message = "The image must be 2 MB or smaller." });

        var folder = Path.Combine(env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot"), "uploads");
        Directory.CreateDirectory(folder);
        var name = $"{Guid.NewGuid():N}{ext}";           // never trust the client's file name
        await using (var stream = System.IO.File.Create(Path.Combine(folder, name)))
            await file.CopyToAsync(stream);

        if (emp.PhotoPath is not null)
        {
            var old = Path.Combine(folder, emp.PhotoPath);
            if (System.IO.File.Exists(old)) System.IO.File.Delete(old);
        }
        emp.PhotoPath = name;
        audit.Log("Photo", "Employee", id, $"Updated photo for {emp.FullName}");
        await db.SaveChangesAsync();
        return Ok(new { photoUrl = "/uploads/" + name });
    }
}
