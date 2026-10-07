import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from './auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login">
      <form class="card stack" #f="ngForm" (ngSubmit)="submit()">
        <h1>Sign in</h1>
        <label>Username
          <input name="u" required autocomplete="username" [(ngModel)]="username" /></label>
        <label>Password
          <input name="p" type="password" required autocomplete="current-password" [(ngModel)]="password" /></label>
        @if (error()) { <p class="err">{{ error() }}</p> }
        <button type="submit" [disabled]="f.invalid || busy()">Sign in</button>
        <p class="muted">Demo accounts: <b>admin</b> / Admin&#64;123 (full access), <b>user</b> / User&#64;123 (view only).</p>
      </form>
    </div>`,
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);
  username = ''; password = '';
  error = signal(''); busy = signal(false);

  submit() {
    this.busy.set(true); this.error.set('');
    this.auth.login(this.username, this.password).subscribe({
      next: () => this.router.navigate(['/']),
      error: e => {
        this.busy.set(false);
        this.error.set(e.error?.message ?? 'Could not sign in. Check that the API is running.');
      },
    });
  }
}
