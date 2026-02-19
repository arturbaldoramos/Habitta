import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  JwtPayload,
  AuthState
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly API_URL = 'http://localhost:8080/api';
  private readonly TOKEN_KEY = 'habitta_token';
  private readonly USER_KEY = 'habitta_user';

  // Signals for reactive state
  private readonly tokenSignal = signal<string | null>(null);
  private readonly userSignal = signal<User | null>(null);

  // Public computed signals
  readonly token = this.tokenSignal.asReadonly();
  readonly currentUser = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal() && !!this.userSignal());
  readonly userRole = computed(() => this.userSignal()?.role ?? null);
  readonly tenantId = computed(() => this.userSignal()?.tenant_id ?? null);

  constructor() {
    // Initialize from localStorage on service creation
    this.initializeFromStorage();

    // Effect to sync token changes to localStorage
    effect(() => {
      const token = this.tokenSignal();
      if (token) {
        localStorage.setItem(this.TOKEN_KEY, token);
      } else {
        localStorage.removeItem(this.TOKEN_KEY);
      }
    });

    // Effect to sync user changes to localStorage
    effect(() => {
      const user = this.userSignal();
      if (user) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(this.USER_KEY);
      }
    });
  }

  /**
   * Initialize authentication state from localStorage
   */
  private initializeFromStorage(): void {
    const storedToken = localStorage.getItem(this.TOKEN_KEY);
    const storedUser = localStorage.getItem(this.USER_KEY);

    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;

        // Verify token is not expired
        if (this.isTokenValid(storedToken)) {
          this.tokenSignal.set(storedToken);
          this.userSignal.set(user);
        } else {
          // Token expired, clear storage
          this.clearStorage();
        }
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.clearStorage();
      }
    }
  }

  /**
   * Login with email and password
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        tap(response => {
          this.tokenSignal.set(response.token);
          this.userSignal.set(response.user);
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Register new user
   */
  register(data: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/auth/register`, data)
      .pipe(
        tap(response => {
          this.tokenSignal.set(response.token);
          this.userSignal.set(response.user);
        }),
        catchError(error => {
          console.error('Register error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Logout user and clear state
   */
  logout(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.clearStorage();
    this.router.navigate(['/login']);
  }

  /**
   * Get current authentication state
   */
  getAuthState(): AuthState {
    return {
      isAuthenticated: this.isAuthenticated(),
      user: this.currentUser(),
      token: this.token(),
      tenantId: this.tenantId()
    };
  }

  /**
   * Decode JWT token
   */
  decodeToken(token: string): JwtPayload | null {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload);
      return JSON.parse(decoded) as JwtPayload;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Check if token is valid (not expired)
   */
  isTokenValid(token: string): boolean {
    const decoded = this.decodeToken(token);
    if (!decoded) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp > currentTime;
  }

  /**
   * Check if current user has a specific role
   */
  hasRole(role: string): boolean {
    return this.userRole() === role;
  }

  /**
   * Check if current user has any of the specified roles
   */
  hasAnyRole(roles: string[]): boolean {
    const userRole = this.userRole();
    return userRole ? roles.includes(userRole) : false;
  }

  /**
   * Clear localStorage
   */
  private clearStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Refresh user data from API (optional - for future use)
   */
  refreshCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/auth/me`)
      .pipe(
        tap(user => {
          this.userSignal.set(user);
        }),
        catchError(error => {
          console.error('Error refreshing user data:', error);
          // If refresh fails, logout
          if (error.status === 401) {
            this.logout();
          }
          return throwError(() => error);
        })
      );
  }
}
