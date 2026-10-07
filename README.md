# Employee Management System
ASP.NET Core 8 Web API + EF Core + SQL Server + Angular 20

## Features
Pagination, sorting, advanced filters (department, salary range, hire-date range), employee details page,
department management, dashboard, JWT login, role-based authorization (Admin / User), CSV export (opens in Excel),
profile photos, audit log, soft delete with restore.

## Demo accounts (created automatically)
| User  | Password  | Role  | Can do |
|-------|-----------|-------|--------|
| admin | Admin@123 | Admin | everything |
| user  | User@123  | User  | view, search, filter, export |

## 1. Run the API
Requires .NET 9 SDK and SQL Server (LocalDB works). Edit `api/appsettings.json` if you use another server.
```
cd api
dotnet tool install --global dotnet-ef      # once
dotnet ef migrations add Init
dotnet run --urls http://localhost:5000
```
The database `EmployeeMgmtDb` is created and seeded (4 departments, 12 employees, 2 users) on first start.
Swagger: http://localhost:5000/swagger  (log in, then use the Authorize button with the token).

## 2. Run the Angular app
Requires Node.js 20.19+ or 22.12+.
```
cd web
npm install
npm start          # http://localhost:4200
```
The API address is in `web/src/app/config.ts`.

## API summary
| Method | Route | Access |
|--------|-------|--------|
| POST | /api/auth/login | public |
| GET | /api/employees (search, departmentId, minSalary, maxSalary, hiredFrom, hiredTo, sortBy, sortDir, page, pageSize, includeDeleted) | any user |
| GET | /api/employees/export (same filters) | any user |
| GET | /api/employees/{id} | any user |
| POST / PUT / DELETE | /api/employees, /api/employees/{id} | Admin |
| POST | /api/employees/{id}/restore, /api/employees/{id}/photo | Admin |
| GET | /api/departments | any user |
| POST / PUT / DELETE | /api/departments | Admin |
| GET | /api/dashboard | any user |
| GET | /api/audit | Admin |

## Notes for production
Replace `Jwt:Key` with a secret from environment variables or a vault, serve over HTTPS, and restrict CORS to your real domain.
