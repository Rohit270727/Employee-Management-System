import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from './api.service';
import { Department } from './models';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [FormsModule],
  template: `
    <h1>Departments</h1>
    <form class="card filters" #f="ngForm" (ngSubmit)="save()">
      <input name="n" required maxlength="80" placeholder="Department name" [(ngModel)]="editing.name" />
      <input name="d" maxlength="300" placeholder="Description (optional)" [(ngModel)]="editing.description" />
      <button type="submit" [disabled]="f.invalid">{{ editing.id ? 'Save changes' : 'Add department' }}</button>
      @if (editing.id) { <button type="button" class="ghost" (click)="reset()">Cancel</button> }
    </form>
    @if (error()) { <p class="err">{{ error() }}</p> }
    <div class="table-wrap">
      <table>
        <thead><tr><th>Name</th><th>Description</th><th class="num">Employees</th><th></th></tr></thead>
        <tbody>
          @for (d of list(); track d.id) {
            <tr>
              <td>{{ d.name }}</td><td>{{ d.description }}</td><td class="num">{{ d.employeeCount }}</td>
              <td class="actions">
                <button class="ghost sm" (click)="edit(d)">Edit</button>
                <button class="danger sm" (click)="remove(d)">Delete</button>
              </td>
            </tr>
          } @empty { <tr><td colspan="4" class="muted">No departments yet. Add the first one above.</td></tr> }
        </tbody>
      </table>
    </div>`,
})
export class DepartmentsComponent implements OnInit {
  private api = inject(ApiService);
  list = signal<Department[]>([]);
  error = signal('');
  editing: Department = { id: 0, name: '', description: '' };

  ngOnInit() { this.load(); }
  load() { this.api.departments().subscribe(d => this.list.set(d)); }
  edit(d: Department) { this.editing = { ...d }; }
  reset() { this.editing = { id: 0, name: '', description: '' }; this.error.set(''); }

  save() {
    this.error.set('');
    const req = this.editing.id ? this.api.updateDepartment(this.editing) : this.api.createDepartment(this.editing);
    req.subscribe({
      next: () => { this.reset(); this.load(); },
      error: e => this.error.set(e.error?.message ?? 'Could not save the department.'),
    });
  }
  remove(d: Department) {
    this.error.set('');
    if (confirm(`Delete department ${d.name}?`))
      this.api.deleteDepartment(d.id).subscribe({
        next: () => this.load(),
        error: e => this.error.set(e.error?.message ?? 'Could not delete the department.'),
      });
  }
}
