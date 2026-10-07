import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './auth';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (auth.user(); as u) {
      <header class="top">
        <strong class="brand">Employee Manager</strong>
        <nav>
          <a routerLink="/dashboard" routerLinkActive="on">Dashboard</a>
          <a routerLink="/employees" routerLinkActive="on">Employees</a>
          @if (auth.isAdmin()) {
            <a routerLink="/departments" routerLinkActive="on">Departments</a>
            <a routerLink="/audit" routerLinkActive="on">Audit log</a>
          }
        </nav>
        <div class="who">
          <span>{{ u.username }} ({{ u.role }})</span>
          <button class="ghost sm" (click)="auth.logout()">Sign out</button>
        </div>
      </header>
    }
    <main><router-outlet /></main>`,
})
export class AppComponent {
  auth = inject(AuthService);
}
