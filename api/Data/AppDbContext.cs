using EmployeeApi.Models;
using Microsoft.EntityFrameworkCore;

namespace EmployeeApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Employee>(e =>
        {
            e.Property(x => x.Salary).HasPrecision(18, 2);
            // Soft delete: deleted rows are hidden from every query unless IgnoreQueryFilters() is used.
            e.HasQueryFilter(x => !x.IsDeleted);
            // Email must be unique among active employees only, so a deleted email can be reused.
            e.HasIndex(x => x.Email).IsUnique().HasFilter("[IsDeleted] = 0");
            e.HasOne(x => x.Department).WithMany().HasForeignKey(x => x.DepartmentId).OnDelete(DeleteBehavior.Restrict);
        });
        b.Entity<Department>().HasIndex(x => x.Name).IsUnique();
        b.Entity<AppUser>().HasIndex(x => x.Username).IsUnique();
        b.Entity<AuditLog>().HasIndex(x => x.Timestamp);
    }
}
