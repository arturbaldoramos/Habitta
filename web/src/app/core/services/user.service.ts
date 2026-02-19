import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  User,
  CreateUserDto,
  UpdateUserDto,
  UpdatePasswordDto,
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
   * Get paginated list of users
   */
  getUsers(page: number = 1, perPage: number = 10, search?: string): Observable<PaginatedResponse<User>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedResponse<User>>(`${this.API_URL}/users`, { params });
  }

  /**
   * Get user by ID
   */
  getUserById(id: number): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/users/${id}`);
  }

  /**
   * Create new user
   */
  createUser(data: CreateUserDto): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/users`, data);
  }

  /**
   * Update user
   */
  updateUser(id: number, data: UpdateUserDto): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/users/${id}`, data);
  }

  /**
   * Update user password
   */
  updatePassword(id: number, data: UpdatePasswordDto): Observable<SuccessResponse> {
    return this.http.put<SuccessResponse>(`${this.API_URL}/users/${id}/password`, data);
  }

  /**
   * Delete user
   */
  deleteUser(id: number): Observable<SuccessResponse> {
    return this.http.delete<SuccessResponse>(`${this.API_URL}/users/${id}`);
  }

  /**
   * Get users by unit
   */
  getUsersByUnit(unitId: number): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/units/${unitId}/users`);
  }
}
