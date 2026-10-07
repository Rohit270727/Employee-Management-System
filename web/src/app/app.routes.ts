import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './auth';
import { LoginComponent } from './login.component';
import { DashboardComponent } from './dashboard.component';
import { EmployeeListComponent } from './employee-list.component';
import { EmployeeFormComponent } from './employee-form.component';
import { EmployeeDetailComponent } from './employee-detail.component';
import { DepartmentsComponent } from './departments.component';
import { AuditComponent } from './audit.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '', canActivate: [authGuard], children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'employees', component: EmployeeListComponent },
      { path: 'employees/new', component: EmployeeFormComponent, canActivate: [adminGuard] },
      { path: 'employees/:id/edit', component: EmployeeFormComponent, canActivate: [adminGuard] },
      { path: 'employees/:id', component: EmployeeDetailComponent },
      { path: 'departments', component: DepartmentsComponent, canActivate: [adminGuard] },
      { path: 'audit', component: AuditComponent, canActivate: [adminGuard] },
    ],
  },
  { path: '**', redirectTo: '' },
];
