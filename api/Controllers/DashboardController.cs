using EmployeeApi.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DashboardController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var emps = db.Employees.AsNoTracking();   // query filter already hides soft-deleted rows

        var byDepartment = await emps
            .GroupBy(e => e.Department!.Name)
            .Select(g => new { Name = g.Key, Count = g.Count(), AverageSalary = g.Average(x => x.Salary) })
            .OrderByDescending(x => x.Count).ThenBy(x => x.Name)
            .ToListAsync();

        var recent = await emps.OrderByDescending(e => e.HireDate).ThenBy(e => e.Id).Take(5)
            .Select(e => new { e.Id, e.FullName, DepartmentName = e.Department!.Name, e.HireDate })
            .ToListAsync();

        return Ok(new
        {
            totalEmployees = await emps.CountAsync(),
            totalDepartments = await db.Departments.CountAsync(),
            deletedCount = await db.Employees.IgnoreQueryFilters().CountAsync(e => e.IsDeleted),
            averageSalary = await emps.AverageAsync(e => (decimal?)e.Salary) ?? 0,
            minSalary = await emps.MinAsync(e => (decimal?)e.Salary) ?? 0,
            maxSalary = await emps.MaxAsync(e => (decimal?)e.Salary) ?? 0,
            payroll = await emps.SumAsync(e => e.Salary),
            byDepartment,
            recentHires = recent,
        });
    }
}
