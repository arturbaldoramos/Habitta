import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError, map } from 'rxjs';
import {
  User,
  UserRole,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  JwtPayload,
  AuthState,
  TenantSelectionInfo
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
  private readonly ACTIVE_TENANT_KEY = 'habitta_active_tenant';
  private readonly ACTIVE_ROLE_KEY = 'habitta_active_role';

  // Signals for reactive state
  private readonly tokenSignal = signal<string | null>(null);
  private readonly userSignal = signal<User | null>(null);
  private readonly activeTenantIdSignal = signal<number | null>(null);
  private readonly activeRoleSignal = signal<UserRole | null>(null);

  // Public computed signals
  readonly token = this.tokenSignal.asReadonly();
  readonly currentUser = this.userSignal.asReadonly();
  readonly activeTenantId = this.activeTenantIdSignal.asReadonly();
  readonly activeRole = this.activeRoleSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.tokenSignal() && !!this.userSignal());
  readonly hasActiveTenant = computed(() => !!this.activeTenantIdSignal());

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

    // Effect to sync active tenant to localStorage
    effect(() => {
      const tenantId = this.activeTenantIdSignal();
      if (tenantId) {
        localStorage.setItem(this.ACTIVE_TENANT_KEY, tenantId.toString());
      } else {
        localStorage.removeItem(this.ACTIVE_TENANT_KEY);
      }
    });

    // Effect to sync active role to localStorage
    effect(() => {
      const role = this.activeRoleSignal();
      if (role) {
        localStorage.setItem(this.ACTIVE_ROLE_KEY, role);
      } else {
        localStorage.removeItem(this.ACTIVE_ROLE_KEY);
      }
    });
  }

  /**
   * Initialize authentication state from localStorage
   */
  private initializeFromStorage(): void {
    const storedToken = localStorage.getItem(this.TOKEN_KEY);
    const storedUser = localStorage.getItem(this.USER_KEY);
    const storedTenantId = localStorage.getItem(this.ACTIVE_TENANT_KEY);
    const storedRole = localStorage.getItem(this.ACTIVE_ROLE_KEY);

    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser) as User;

        // Verify token is not expired
        if (this.isTokenValid(storedToken)) {
          this.tokenSignal.set(storedToken);
          this.userSignal.set(user);

          if (storedTenantId) {
            this.activeTenantIdSignal.set(parseInt(storedTenantId));
          }

          if (storedRole) {
            this.activeRoleSignal.set(storedRole as UserRole);
          }
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
   * Returns token if user has single/no tenant, or tenant list if multiple
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<{data: LoginResponse}>(`${this.API_URL}/auth/login`, credentials)
      .pipe(
        map(response => response.data),
        tap(data => {
          this.userSignal.set(data.user);

          if (data.token) {
            // User has single tenant or no tenant - set token
            this.setTokenAndExtractTenantInfo(data.token);
          } else if (data.tenants && data.tenants.length > 0) {
            // User has multiple tenants - don't set token yet
            // Frontend should show tenant selector
          }
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Login with specific tenant selection
   */
  loginWithTenant(credentials: LoginRequest, tenantId: number): Observable<LoginResponse> {
    return this.http.post<{data: LoginResponse}>(`${this.API_URL}/auth/login/tenant/${tenantId}`, credentials)
      .pipe(
        map(response => response.data),
        tap(data => {
          this.userSignal.set(data.user);

          if (data.token) {
            this.setTokenAndExtractTenantInfo(data.token);
          }
        }),
        catchError(error => {
          console.error('Login with tenant error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Register new orphan user (without tenant)
   */
  register(data: RegisterRequest): Observable<User> {
    return this.http.post<{data: User}>(`${this.API_URL}/auth/register`, data)
      .pipe(
        map(response => response.data),
        tap(user => {
          // Registration creates orphan user - need to login after
          // Or we can auto-login here
          this.userSignal.set(user);
        }),
        catchError(error => {
          console.error('Register error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Switch active tenant
   */
  switchTenant(tenantId: number): Observable<{token: string}> {
    return this.http.post<{data: {token: string}}>(`${this.API_URL}/auth/switch-tenant/${tenantId}`, {})
      .pipe(
        map(response => response.data),
        tap(data => {
          this.setTokenAndExtractTenantInfo(data.token);
        }),
        catchError(error => {
          console.error('Switch tenant error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Set token and extract tenant info from JWT
   */
  private setTokenAndExtractTenantInfo(token: string): void {
    this.tokenSignal.set(token);
    const decoded = this.decodeToken(token);

    if (decoded) {
      this.activeTenantIdSignal.set(decoded.active_tenant_id ?? null);
      this.activeRoleSignal.set(decoded.active_role as UserRole ?? null);
    }
  }

  /**
   * Logout user and clear state
   */
  logout(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    this.activeTenantIdSignal.set(null);
    this.activeRoleSignal.set(null);
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
      activeTenantId: this.activeTenantId(),
      activeRole: this.activeRole()
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
   * Check if current user has a specific role in active tenant
   */
  hasRole(role: UserRole): boolean {
    return this.activeRole() === role;
  }

  /**
   * Check if current user has any of the specified roles in active tenant
   */
  hasAnyRole(roles: UserRole[]): boolean {
    const userRole = this.activeRole();
    return userRole ? roles.includes(userRole) : false;
  }

  /**
   * Check if user is síndico or admin in active tenant
   */
  isSindicoOrAdmin(): boolean {
    return this.hasAnyRole([UserRole.SINDICO, UserRole.ADMIN]);
  }

  /**
   * Clear localStorage
   */
  private clearStorage(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ACTIVE_TENANT_KEY);
    localStorage.removeItem(this.ACTIVE_ROLE_KEY);
  }

  /**
   * Check if user is orphan (no active tenant)
   */
  isOrphanUser(): boolean {
    return this.isAuthenticated() && !this.hasActiveTenant();
  }
}
