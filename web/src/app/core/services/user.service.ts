import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  UserListItem,
  UpdateMembershipDto,
  PaginatedResponse,
  SuccessResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api';

  /**
   * Get paginated list of users (flat format)
   */
  getUsers(page: number = 1, perPage: number = 10, search?: string): Observable<PaginatedResponse<UserListItem>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedResponse<UserListItem>>(`${this.API_URL}/users`, { params });
  }

  /**
   * Get user by ID (returns flat UserListItem, unwraps { data: ... } wrapper)
   */
  getUserById(id: number): Observable<UserListItem> {
    return this.http.get<{ data: UserListItem }>(`${this.API_URL}/users/${id}`).pipe(
      map(res => res.data)
    );
  }

  /**
   * Update user membership (is_active, unit_id)
   */
  updateMembership(id: number, data: UpdateMembershipDto): Observable<SuccessResponse> {
    return this.http.patch<SuccessResponse>(`${this.API_URL}/users/${id}/membership`, data);
  }

  /**
   * Remove user from tenant
   */
  removeFromTenant(id: number): Observable<SuccessResponse> {
    return this.http.delete<SuccessResponse>(`${this.API_URL}/users/${id}`);
  }

  /**
   * Get users by unit
   */
  getUsersByUnit(unitId: number): Observable<UserListItem[]> {
    return this.http.get<UserListItem[]>(`${this.API_URL}/units/${unitId}/users`);
  }
}
