import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { Tenant, CreateTenantDto, UserTenant } from '../models';

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api';

  /**
   * Create new tenant (user becomes síndico automatically)
   */
  createTenant(data: CreateTenantDto): Observable<Tenant> {
    return this.http.post<{data: Tenant}>(`${this.API_URL}/tenants/create`, data)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Create tenant error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get all tenants for current user
   */
  getMyTenants(): Observable<UserTenant[]> {
    return this.http.get<{data: UserTenant[]}>(`${this.API_URL}/users/me/tenants`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Get my tenants error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get tenant by ID (admin only)
   */
  getTenantById(id: number): Observable<Tenant> {
    return this.http.get<{data: Tenant}>(`${this.API_URL}/tenants/${id}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Get tenant error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get all tenants (admin only)
   */
  getAllTenants(): Observable<Tenant[]> {
    return this.http.get<{data: Tenant[]}>(`${this.API_URL}/tenants`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Get all tenants error:', error);
          return throwError(() => error);
        })
      );
  }
}
