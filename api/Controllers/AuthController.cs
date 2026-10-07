using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EmployeeApi.Data;
using EmployeeApi.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace EmployeeApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AppDbContext db, IConfiguration cfg, IPasswordHasher<AppUser> hasher) : ControllerBase
{
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(LoginRequest req)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == req.Username);
        if (user is null ||
            hasher.VerifyHashedPassword(user, user.PasswordHash, req.Password) == PasswordVerificationResult.Failed)
            return Unauthorized(new { message = "Invalid username or password." });

        var expires = DateTime.UtcNow.AddMinutes(cfg.GetValue("Jwt:ExpiresMinutes", 120));
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!));
        var token = new JwtSecurityToken(
            issuer: cfg["Jwt:Issuer"],
            audience: cfg["Jwt:Audience"],
            claims: new[] { new Claim(ClaimTypes.Name, user.Username), new Claim(ClaimTypes.Role, user.Role) },
            expires: expires,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return new LoginResponse(new JwtSecurityTokenHandler().WriteToken(token), user.Username, user.Role, expires);
    }
}
