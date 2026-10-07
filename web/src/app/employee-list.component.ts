import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from './api.service';
import { AuthService } from './auth';
import { Department, Employee, Paged, Query, initials, photoUrl } from './models';

const emptyFilters = () => ({
  search: '', departmentId: null as number | null,
  minSalary: null as number | null, maxSalary: null as number | null,
  hiredFrom: '', hiredTo: '', includeDeleted: false,
});

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [FormsModule, RouterLink, CurrencyPipe, DatePipe],
  template: `
    <div class="head">
      <h1>Employees</h1>
      <div class="row">
        <button class="ghost" (click)="export()">Export CSV</button>
        @if (auth.isAdmin()) { <a class="btn" routerLink="/employees/new">Add employee</a> }
      </div>
    </div>

    <section class="card filters">
      <input name="s" placeholder="Search name, email or department" [(ngModel)]="f.search" (ngModelChange)="filterChanged()" />
      <select name="d" [(ngModel)]="f.departmentId" (ngModelChange)="filterChanged()">
        <option [ngValue]="null">All departments</option>
        @for (d of departments(); track d.id) { <option [ngValue]="d.id">{{ d.name }}</option> }
      </select>
      <input name="min" type="number" min="0" placeholder="Min salary" [(ngModel)]="f.minSalary" (ngModelChange)="filterChanged()" />
      <input name="max" type="number" min="0" placeholder="Max salary" [(ngModel)]="f.maxSalary" (ngModelChange)="filterChanged()" />
      <label>Hired from <input name="hf" type="date" [(ngModel)]="f.hiredFrom" (ngModelChange)="filterChanged()" /></label>
      <label>Hired to <input name="ht" type="date" [(ngModel)]="f.hiredTo" (ngModelChange)="filterChanged()" /></label>
      @if (auth.isAdmin()) {
        <label class="check"><input name="del" type="checkbox" [(ngModel)]="f.includeDeleted" (ngModelChange)="filterChanged()" /> Show deleted</label>
      }
      <button class="ghost sm" (click)="clear()">Clear filters</button>
    </section>

    @if (message()) { <p class="err">{{ message() }}</p> }

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th></th>
            <th><button class="th" (click)="sort('name')">Name {{ arrow('name') }}</button></th>
            <th><button class="th" (click)="sort('department')">Department {{ arrow('department') }}</button></th>
            <th class="num"><button class="th" (click)="sort('salary')">Salary {{ arrow('salary') }}</button></th>
            <th><button class="th" (click)="sort('hiredate')">Hired {{ arrow('hiredate') }}</button></th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (e of result().items; track e.id) {
            <tr [class.gone]="e.isDeleted">
              <td>
                @if (photo(e.photoUrl); as src) { <img class="av" [src]="src" alt="" /> }
                @else { <span class="av">{{ initials(e.fullName) }}</span> }
              </td>
              <td>
                <a [routerLink]="['/employees', e.id]">{{ e.fullName }}</a>
                @if (e.isDeleted) { <em class="tag">Deleted</em> }
                <small>{{ e.email }}</small>
              </td>
              <td>{{ e.departmentName }}</td>
              <td class="num">{{ e.salary | currency:'USD':'symbol':'1.0-0' }}</td>
              <td>{{ e.hireDate | date:'mediumDate' }}</td>
              <td class="actions">
                <a class="btn ghost sm" [routerLink]="['/employees', e.id]">View</a>
                @if (auth.isAdmin()) {
                  @if (e.isDeleted) { <button class="sm" (click)="restore(e)">Restore</button> }
                  @else {
                    <a class="btn ghost sm" [routerLink]="['/employees', e.id, 'edit']">Edit</a>
                    <button class="danger sm" (click)="remove(e)">Delete</button>
                  }
                }
              </td>
            </tr>
          } @empty {
            <tr><td colspan="6" class="muted">{{ loading() ? 'Loading…' : 'No employees match these filters.' }}</td></tr>
          }
        </tbody>
      </table>
    </div>

    <div class="pager">
      <span class="muted">{{ from() }}–{{ to() }} of {{ result().total }}</span>
      <div class="row">
        <button class="ghost sm" [disabled]="page <= 1" (click)="go(page - 1)">Previous</button>
        <span>Page {{ page }} of {{ pages() }}</span>
        <button class="ghost sm" [disabled]="page >= pages()" (click)="go(page + 1)">Next</button>
        <select name="ps" [ngModel]="pageSize" (ngModelChange)="pageSize = $event; go(1)">
          @for (n of [5, 10, 25, 50]; track n) { <option [ngValue]="n">{{ n }} per page</option> }
        </select>
      </div>
    </div>`,
})
export class EmployeeListComponent implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  photo = photoUrl;
  initials = initials;

  departments = signal<Department[]>([]);
  result = signal<Paged<Employee>>({ items: [], total: 0, page: 1, pageSize: 10 });
  loading = signal(false);
  message = signal('');
  f = emptyFilters();
  sortBy = signal('name');
  sortDir = signal<'asc' | 'desc'>('asc');
  page = 1;
  pageSize = 10;
  private timer: ReturnType<typeof setTimeout> | undefined;

  pages = computed(() => Math.max(1, Math.ceil(this.result().total / this.result().pageSize)));
  from = computed(() => (this.result().total === 0 ? 0 : (this.result().page - 1) * this.result().pageSize + 1));
  to = computed(() => Math.min(this.result().total, this.result().page * this.result().pageSize));

  ngOnInit() {
    this.api.departments().subscribe(d => this.departments.set(d));
    this.load();
  }

  private query(): Query {
    return { ...this.f, sortBy: this.sortBy(), sortDir: this.sortDir(), page: this.page, pageSize: this.pageSize };
  }

  load() {
    this.loading.set(true); this.message.set('');
    this.api.employees(this.query()).subscribe({
      next: r => { this.result.set(r); this.loading.set(false); },
      error: () => { this.loading.set(false); this.message.set('Could not load employees.'); },
    });
  }

  filterChanged() {
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { this.page = 1; this.load(); }, 300);
  }
  clear() { this.f = emptyFilters(); this.filterChanged(); }

  sort(col: string) {
    if (this.sortBy() === col) this.sortDir.set(this.sortDir() === 'asc' ? 'desc' : 'asc');
    else { this.sortBy.set(col); this.sortDir.set('asc'); }
    this.go(1);
  }
  arrow(col: string) { return this.sortBy() === col ? (this.sortDir() === 'asc' ? '▲' : '▼') : ''; }
  go(p: number) { this.page = p; this.load(); }

  remove(e: Employee) {
    if (confirm(`Delete ${e.fullName}? You can restore them later.`))
      this.api.deleteEmployee(e.id).subscribe(() => this.load());
  }
  restore(e: Employee) {
    this.api.restoreEmployee(e.id).subscribe({
      next: () => this.load(),
      error: err => this.message.set(err.error?.message ?? 'Could not restore.'),
    });
  }

  export() {
    this.api.exportCsv(this.query()).subscribe(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'employees.csv';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }
}
