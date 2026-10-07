import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';
import { API } from './config';

interface Session { token: string; username: string; role: string; expiresAt: string; }

function load(): Session | null {
  try {
    const s: Session | null = JSON.parse(localStorage.getItem('session') ?? 'null');
    return s && new Date(s.expiresAt) > new Date() ? s : null;
  } catch { return null; }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private session = signal<Session | null>(load());

  user = computed(() => this.session());
  isAdmin = computed(() => this.session()?.role === 'Admin');
  get token() { return this.session()?.token ?? null; }

  login(username: string, password: string) {
    return this.http.post<Session>(`${API}/api/auth/login`, { username, password }).pipe(
      tap(s => { localStorage.setItem('session', JSON.stringify(s)); this.session.set(s); }));
  }

  logout() {
    localStorage.removeItem('session');
    this.session.set(null);
    this.router.navigate(['/login']);
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const t = auth.token;
  const r = t ? req.clone({ setHeaders: { Authorization: `Bearer ${t}` } }) : req;
  return next(r).pipe(catchError(e => {
    if (e.status === 401 && !req.url.endsWith('/auth/login')) auth.logout();
    return throwError(() => e);
  }));
};

export const authGuard: CanActivateFn = () =>
  inject(AuthService).user() ? true : inject(Router).createUrlTree(['/login']);

export const adminGuard: CanActivateFn = () =>
  inject(AuthService).isAdmin() ? true : inject(Router).createUrlTree(['/']);
