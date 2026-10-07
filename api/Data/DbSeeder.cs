using EmployeeApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace EmployeeApi.Data;

public static class DbSeeder
{
    public static void Seed(AppDbContext db, IPasswordHasher<AppUser> hasher)
    {
        if (!db.Departments.Any())
        {
            db.Departments.AddRange(
                new Department { Name = "Engineering", Description = "Software and infrastructure" },
                new Department { Name = "Human Resources", Description = "People and culture" },
                new Department { Name = "Finance", Description = "Accounting and payroll" },
                new Department { Name = "Sales", Description = "Customer acquisition" });
            db.SaveChanges();
        }

        if (!db.Users.Any())
        {
            var admin = new AppUser { Username = "admin", Role = "Admin" };
            admin.PasswordHash = hasher.HashPassword(admin, "Admin@123");
            var user = new AppUser { Username = "user", Role = "User" };
            user.PasswordHash = hasher.HashPassword(user, "User@123");
            db.Users.AddRange(admin, user);
            db.SaveChanges();
        }

        if (!db.Employees.IgnoreQueryFilters().Any())
        {
            var deptIds = db.Departments.OrderBy(d => d.Id).Select(d => d.Id).ToList();
            string[] names = { "Ava Johnson", "Liam Smith", "Noah Brown", "Emma Davis", "Olivia Wilson", "Mason Taylor",
                               "Sophia Moore", "Lucas Clark", "Mia Lewis", "Ethan Walker", "Isabella Hall", "James Young" };
            for (var i = 0; i < names.Length; i++)
            {
                db.Employees.Add(new Employee
                {
                    FullName = names[i],
                    Email = names[i].ToLower().Replace(' ', '.') + "@example.com",
                    DepartmentId = deptIds[i % deptIds.Count],
                    Salary = 45000 + i * 3500,
                    HireDate = DateTime.Today.AddDays(-(i * 75 + 20)),
                });
            }
            db.SaveChanges();
        }
    }
}
