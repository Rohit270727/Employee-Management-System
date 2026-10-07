import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from './api.service';
import { Dashboard } from './models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
    <h1>Dashboard</h1>
    @if (data(); as d) {
      <section class="stats">
        <div class="stat"><b>{{ d.totalEmployees }}</b><span>Employees</span></div>
        <div class="stat"><b>{{ d.totalDepartments }}</b><span>Departments</span></div>
        <div class="stat"><b>{{ d.averageSalary | currency:'USD':'symbol':'1.0-0' }}</b><span>Average salary</span></div>
        <div class="stat"><b>{{ d.payroll | currency:'USD':'symbol':'1.0-0' }}</b><span>Total payroll</span></div>
        <div class="stat"><b>{{ d.maxSalary | currency:'USD':'symbol':'1.0-0' }}</b><span>Highest salary</span></div>
        <div class="stat"><b>{{ d.minSalary | currency:'USD':'symbol':'1.0-0' }}</b><span>Lowest salary</span></div>
      </section>

      <div class="two">
        <section class="card">
          <h2>Employees by department</h2>
          @if (d.byDepartment.length === 0) { <p class="muted">No employees yet.</p> }
          <ul class="bars">
            @for (x of d.byDepartment; track x.name) {
              <li>
                <span>{{ x.name }}</span>
                <div class="bar"><i [style.width.%]="x.count / max() * 100"></i></div>
                <span class="muted">{{ x.count }} · avg {{ x.averageSalary | currency:'USD':'symbol':'1.0-0' }}</span>
              </li>
            }
          </ul>
        </section>

        <section class="card">
          <h2>Recent hires</h2>
          <ul class="plain">
            @for (r of d.recentHires; track r.id) {
              <li><a [routerLink]="['/employees', r.id]">{{ r.fullName }}</a>
                <span class="muted">{{ r.departmentName }}, {{ r.hireDate | date:'mediumDate' }}</span></li>
            }
          </ul>
          @if (d.deletedCount > 0) { <p class="muted">{{ d.deletedCount }} employee(s) in soft-deleted state.</p> }
        </section>
      </div>
    } @else {
      <p class="muted">Loading…</p>
    }`,
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  data = signal<Dashboard | null>(null);
  max = computed(() => Math.max(1, ...(this.data()?.byDepartment.map(x => x.count) ?? [])));
  ngOnInit() { this.api.dashboard().subscribe(d => this.data.set(d)); }
}
