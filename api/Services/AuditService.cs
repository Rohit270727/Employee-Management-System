using EmployeeApi.Data;
using EmployeeApi.Models;

namespace EmployeeApi.Services;

/// <summary>Adds an audit row to the current DbContext. The caller decides when to SaveChanges.</summary>
public class AuditService(AppDbContext db, IHttpContextAccessor http)
{
    public void Log(string action, string entity, int entityId, string details) =>
        db.AuditLogs.Add(new AuditLog
        {
            Timestamp = DateTime.UtcNow,
            UserName = http.HttpContext?.User.Identity?.Name ?? "system",
            Action = action,
            EntityName = entity,
            EntityId = entityId,
            Details = details.Length > 500 ? details[..500] : details,
        });
}
