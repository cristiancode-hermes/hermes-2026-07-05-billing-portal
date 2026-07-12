import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { User } from '../models/user.model';

const apiUrl = '/api';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'billing_token';
  private readonly userSignal = signal<User | null>(null);

  readonly user = this.userSignal.asReadonly();
  isAuthenticated(): boolean {
    return !!this.userSignal() || !!this.getToken();
  }

  constructor() {
    const token = this.getToken();
    if (token) {
      this.me().subscribe({
        next: (user) => this.userSignal.set(user),
        // Don't call logout() on transient me() failure — the token may still be
        // valid and the capturer or app flow depends on it being present.
        // Just leave userSignal null; isAuthenticated() still returns true via getToken().
        error: () => {},
      });
    }
  }

  login(email: string, password: string) {
    return this.http.post<{ token: string; user: User }>(`${apiUrl}/auth/login`, { email, password }).pipe(
      tap((res) => {
        localStorage.setItem(this.tokenKey, res.token);
        this.userSignal.set(res.user);
      }),
    );
  }

  register(orgName: string, email: string, password: string) {
    return this.http.post<{ token: string; user: User }>(`${apiUrl}/auth/register`, { orgName, email, password }).pipe(
      tap((res) => {
        localStorage.setItem(this.tokenKey, res.token);
        this.userSignal.set(res.user);
      }),
    );
  }

  me() {
    return this.http.get<User>(`${apiUrl}/auth/me`);
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.userSignal.set(null);
  }

  getToken(): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.tokenKey);
    }
    return null;
  }
}
