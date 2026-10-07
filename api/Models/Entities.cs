using System.ComponentModel.DataAnnotations;

namespace EmployeeApi.Models;

public class Department
{
    public int Id { get; set; }
    [Required, MaxLength(80)] public string Name { get; set; } = "";
    [MaxLength(300)] public string? Description { get; set; }
}

public class Employee
{
    public int Id { get; set; }
    [Required, MaxLength(100)] public string FullName { get; set; } = "";
    [Required, MaxLength(150)] public string Email { get; set; } = "";
    public int DepartmentId { get; set; }
    public Department? Department { get; set; }
    public decimal Salary { get; set; }
    public DateTime HireDate { get; set; }
    [MaxLength(100)] public string? PhotoPath { get; set; }   // file name inside wwwroot/uploads
    public bool IsDeleted { get; set; }                        // soft delete flag
    public DateTime? DeletedAt { get; set; }
}

public class AppUser
{
    public int Id { get; set; }
    [Required, MaxLength(50)] public string Username { get; set; } = "";
    [Required] public string PasswordHash { get; set; } = "";
    [Required, MaxLength(20)] public string Role { get; set; } = "User";   // "Admin" or "User"
}

public class AuditLog
{
    public int Id { get; set; }
    public DateTime Timestamp { get; set; }
    [MaxLength(50)] public string UserName { get; set; } = "";
    [MaxLength(30)] public string Action { get; set; } = "";
    [MaxLength(50)] public string EntityName { get; set; } = "";
    public int EntityId { get; set; }
    [MaxLength(500)] public string Details { get; set; } = "";
}
