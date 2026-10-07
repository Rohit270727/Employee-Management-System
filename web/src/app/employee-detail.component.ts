import { Component, OnInit, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from './api.service';
import { AuthService } from './auth';
import { Employee, initials, photoUrl } from './models';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [CurrencyPipe, DatePipe, RouterLink],
  template: `
    <a routerLink="/employees">Back to employees</a>
    @if (error()) { <p class="err">{{ error() }}</p> }
    @if (emp(); as e) {
      <section class="card profile">
        <div class="photo">
          @if (photo(e.photoUrl); as src) { <img class="av big" [src]="src" alt="Photo of {{ e.fullName }}" /> }
          @else { <span class="av big">{{ initials(e.fullName) }}</span> }
          @if (auth.isAdmin() && !e.isDeleted) {
            <label class="btn ghost sm">Upload photo
              <input type="file" hidden accept="image/png,image/jpeg,image/webp" (change)="upload($event)" /></label>
          }
        </div>
        <div>
          <h1>{{ e.fullName }} @if (e.isDeleted) { <em class="tag">Deleted</em> }</h1>
          <dl>
            <dt>Email</dt><dd>{{ e.email }}</dd>
            <dt>Department</dt><dd>{{ e.departmentName }}</dd>
            <dt>Salary</dt><dd>{{ e.salary | currency:'USD':'symbol':'1.0-0' }}</dd>
            <dt>Hire date</dt><dd>{{ e.hireDate | date:'longDate' }}</dd>
          </dl>
          @if (auth.isAdmin()) {
            <div class="row">
              @if (e.isDeleted) { <button (click)="restore()">Restore employee</button> }
              @else {
                <a class="btn" [routerLink]="['/employees', e.id, 'edit']">Edit</a>
                <button class="danger" (click)="remove(e)">Delete</button>
              }
            </div>
          }
        </div>
      </section>
    }`,
})
export class EmployeeDetailComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  auth = inject(AuthService);
  photo = photoUrl; initials = initials;
  id = Number(inject(ActivatedRoute).snapshot.paramMap.get('id'));
  emp = signal<Employee | null>(null);
  error = signal('');

  ngOnInit() { this.load(); }
  load() {
    this.api.employee(this.id).subscribe({
      next: e => this.emp.set(e),
      error: () => this.error.set('Employee not found.'),
    });
  }

  upload(ev: Event) {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.error.set('');
    this.api.uploadPhoto(this.id, file).subscribe({
      next: () => { input.value = ''; this.load(); },
      error: err => this.error.set(err.error?.message ?? 'Upload failed.'),
    });
  }
  remove(e: Employee) {
    if (confirm(`Delete ${e.fullName}? You can restore them later.`))
      this.api.deleteEmployee(e.id).subscribe(() => this.router.navigate(['/employees']));
  }
  restore() {
    this.api.restoreEmployee(this.id).subscribe({
      next: () => this.load(),
      error: err => this.error.set(err.error?.message ?? 'Could not restore.'),
    });
  }
}
