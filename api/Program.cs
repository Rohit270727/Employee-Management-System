using System.Text;
using EmployeeApi.Data;
using EmployeeApi.Models;
using EmployeeApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;

builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer(cfg.GetConnectionString("Default")));
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<AuditService>();
builder.Services.AddScoped<IPasswordHasher<AppUser>, PasswordHasher<AppUser>>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidIssuer = cfg["Jwt:Issuer"],
        ValidateAudience = true, ValidAudience = cfg["Jwt:Audience"],
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromMinutes(1),
    });
builder.Services.AddAuthorization();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization", Type = SecuritySchemeType.Http, Scheme = "bearer",
        BearerFormat = "JWT", In = ParameterLocation.Header,
        Description = "Log in via POST /api/auth/login, then paste the token here.",
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        { new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" } },
          Array.Empty<string>() },
    });
});
builder.Services.AddCors(o => o.AddPolicy("ng", p =>
    p.WithOrigins("http://localhost:4200").AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    DbSeeder.Seed(db, scope.ServiceProvider.GetRequiredService<IPasswordHasher<AppUser>>());
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseStaticFiles();      // serves wwwroot/uploads (employee photos)
app.UseCors("ng");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.Run();
