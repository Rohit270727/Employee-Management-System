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
public class DepartmentsController(AppDbContext db, AuditService audit) : ControllerBase
{
    public record DepartmentDto(int Id, string Name, string? Description, int EmployeeCount);

    [HttpGet]
    public async Task<List<DepartmentDto>> GetAll() =>
        await db.Departments.AsNoTracking().OrderBy(d => d.Name)
            .Select(d => new DepartmentDto(d.Id, d.Name, d.Description,
                db.Employees.Count(e => e.DepartmentId == d.Id)))
            .ToListAsync();

    [HttpPost, Authorize(Roles = "Admin")]
    public async Task<ActionResult<DepartmentDto>> Create(Department input)
    {
        var name = input.Name.Trim();
        if (await db.Departments.AnyAsync(d => d.Name == name))
            return Conflict(new { message = "A department with this name already exists." });

        var dept = new Department { Name = name, Description = input.Description };
        db.Departments.Add(dept);
        await db.SaveChangesAsync();
        audit.Log("Create", "Department", dept.Id, $"Created department {dept.Name}");
        await db.SaveChangesAsync();
        return new DepartmentDto(dept.Id, dept.Name, dept.Description, 0);
    }

    [HttpPut("{id:int}"), Authorize(Roles = "Admin")]
    public async Task<ActionResult<DepartmentDto>> Update(int id, Department input)
    {
        var dept = await db.Departments.FindAsync(id);
        if (dept is null) return NotFound();
        var name = input.Name.Trim();
        if (await db.Departments.AnyAsync(d => d.Name == name && d.Id != id))
            return Conflict(new { message = "A department with this name already exists." });

        audit.Log("Update", "Department", id, $"Renamed {dept.Name} to {name}");
        dept.Name = name;
        dept.Description = input.Description;
        await db.SaveChangesAsync();
        return new DepartmentDto(dept.Id, dept.Name, dept.Description,
            await db.Employees.CountAsync(e => e.DepartmentId == id));
    }

    [HttpDelete("{id:int}"), Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var dept = await db.Departments.FindAsync(id);
        if (dept is null) return NotFound();
        if (await db.Employees.IgnoreQueryFilters().AnyAsync(e => e.DepartmentId == id))
            return Conflict(new { message = "This department still has employees (including deleted ones). Move them first." });

        audit.Log("Delete", "Department", id, $"Deleted department {dept.Name}");
        db.Departments.Remove(dept);
        await db.SaveChangesAsync();
        return NoContent();
    }
}
