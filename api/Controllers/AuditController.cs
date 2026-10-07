using EmployeeApi.Data;
using EmployeeApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AuditController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<PagedResult<AuditLog>> Get([FromQuery] int page = 1, [FromQuery] int pageSize = 15)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var total = await db.AuditLogs.CountAsync();
        var items = await db.AuditLogs.AsNoTracking()
            .OrderByDescending(a => a.Timestamp).ThenByDescending(a => a.Id)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();
        return new PagedResult<AuditLog>(items, total, page, pageSize);
    }
}
