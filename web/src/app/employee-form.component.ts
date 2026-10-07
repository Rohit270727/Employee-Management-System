import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from './api.service';
import { Department, EmployeeInput } from './models';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <h1>{{ id ? 'Edit employee' : 'Add employee' }}</h1>
    <form class="card stack narrow" #f="ngForm" (ngSubmit)="save()">
      <label>Full name
        <input name="n" required maxlength="100" [(ngModel)]="m.fullName" /></label>
      <label>Email
        <input name="e" type="email" required email maxlength="150" [(ngModel)]="m.email" /></label>
      <label>Department
        <select name="d" required [(ngModel)]="m.departmentId">
          @for (d of departments(); track d.id) { <option [ngValue]="d.id">{{ d.name }}</option> }
        </select></label>
      <label>Salary
        <input name="s" type="number" min="0" max="10000000" required [(ngModel)]="m.salary" /></label>
      <label>Hire date
        <input name="h" type="date" required [(ngModel)]="m.hireDate" /></label>
      @if (error()) { <p class="err">{{ error() }}</p> }
      <div class="row">
        <button type="submit" [disabled]="f.invalid || busy()">{{ id ? 'Save changes' : 'Add employee' }}</button>
        <a class="btn ghost" [routerLink]="id ? ['/employees', id] : ['/employees']">Cancel</a>
      </div>
    </form>`,
})
export class EmployeeFormComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id')) || 0;
  departments = signal<Department[]>([]);
  error = signal(''); busy = signal(false);
  m: EmployeeInput = {
    fullName: '', email: '', departmentId: 0, salary: 0,
    hireDate: new Date().toISOString().slice(0, 10),
  };

  ngOnInit() {
    this.api.departments().subscribe(d => {
      this.departments.set(d);
      if (!this.id && d.length) this.m.departmentId = d[0].id;
    });
    if (this.id) this.api.employee(this.id).subscribe(e => this.m = {
      fullName: e.fullName, email: e.email, departmentId: e.departmentId,
      salary: e.salary, hireDate: e.hireDate.slice(0, 10),
    });
  }

  save() {
    this.busy.set(true); this.error.set('');
    const req = this.id ? this.api.updateEmployee(this.id, this.m) : this.api.createEmployee(this.m);
    req.subscribe({
      next: e => this.router.navigate(['/employees', e.id]),
      error: err => {
        this.busy.set(false);
        this.error.set(err.error?.message ?? 'Could not save. Check the fields and try again.');
      },
    });
  }
}
