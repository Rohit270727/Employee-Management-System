using System.ComponentModel.DataAnnotations;

namespace EmployeeApi.Models;

public class LoginRequest
{
    [Required] public string Username { get; set; } = "";
    [Required] public string Password { get; set; } = "";
}

public record LoginResponse(string Token, string Username, string Role, DateTime ExpiresAt);

public class EmployeeInput
{
    [Required, MaxLength(100)] public string FullName { get; set; } = "";
    [Required, EmailAddress, MaxLength(150)] public string Email { get; set; } = "";
    [Range(1, int.MaxValue, ErrorMessage = "Choose a department.")] public int DepartmentId { get; set; }
    [Range(0, 10_000_000)] public decimal Salary { get; set; }
    public DateTime HireDate { get; set; }
}

public record EmployeeDto(int Id, string FullName, string Email, int DepartmentId, string DepartmentName,
    decimal Salary, DateTime HireDate, string? PhotoUrl, bool IsDeleted);

public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize);

public class EmployeeQuery
{
    public string? Search { get; set; }
    public int? DepartmentId { get; set; }
    public decimal? MinSalary { get; set; }
    public decimal? MaxSalary { get; set; }
    public DateTime? HiredFrom { get; set; }
    public DateTime? HiredTo { get; set; }
    public string? SortBy { get; set; } = "name";
    public string? SortDir { get; set; } = "asc";
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public bool IncludeDeleted { get; set; }
}
