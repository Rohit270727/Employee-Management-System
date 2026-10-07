import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from './api.service';
import { AuditEntry, Paged } from './models';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [DatePipe],
  template: `
    <h1>Audit log</h1>
    <div class="table-wrap">
      <table>
        <thead><tr><th>When</th><th>User</th><th>Action</th><th>Record</th><th>Details</th></tr></thead>
        <tbody>
          @for (a of result().items; track a.id) {
            <tr>
              <td>{{ utc(a.timestamp) | date:'medium' }}</td>
              <td>{{ a.userName }}</td>
              <td><em class="tag">{{ a.action }}</em></td>
              <td>{{ a.entityName }} #{{ a.entityId }}</td>
              <td>{{ a.details }}</td>
            </tr>
          } @empty { <tr><td colspan="5" class="muted">No activity recorded yet.</td></tr> }
        </tbody>
      </table>
    </div>
    <div class="pager">
      <span class="muted">{{ result().total }} entries</span>
      <div class="row">
        <button class="ghost sm" [disabled]="page <= 1" (click)="go(page - 1)">Previous</button>
        <span>Page {{ page }} of {{ pages() }}</span>
        <button class="ghost sm" [disabled]="page >= pages()" (click)="go(page + 1)">Next</button>
      </div>
    </div>`,
})
export class AuditComponent implements OnInit {
  private api = inject(ApiService);
  result = signal<Paged<AuditEntry>>({ items: [], total: 0, page: 1, pageSize: 15 });
  pages = computed(() => Math.max(1, Math.ceil(this.result().total / this.result().pageSize)));
  page = 1;

  ngOnInit() { this.go(1); }
  go(p: number) { this.page = p; this.api.audit(p, 15).subscribe(r => this.result.set(r)); }
  utc(t: string) { return t.endsWith('Z') ? t : t + 'Z'; }
}
