import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map } from 'rxjs';
import { Invite, InviteListItem, CreateInviteDto, AcceptInviteDto, User } from '../models';

@Injectable({
  providedIn: 'root'
})
export class InviteService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api';

  /**
   * Create new invite (síndico/admin only)
   */
  createInvite(data: CreateInviteDto): Observable<Invite> {
    return this.http.post<{data: Invite}>(`${this.API_URL}/invites`, data)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Create invite error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get invite by token (public endpoint)
   */
  getInviteByToken(token: string): Observable<Invite> {
    return this.http.get<{data: Invite}>(`${this.API_URL}/invites/${token}`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Get invite error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Accept invite (public endpoint)
   */
  acceptInvite(token: string, data: AcceptInviteDto): Observable<User> {
    return this.http.post<{data: User}>(`${this.API_URL}/invites/${token}/accept`, data)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Accept invite error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get my pending invites
   */
  getMyPendingInvites(): Observable<Invite[]> {
    return this.http.get<{data: Invite[]}>(`${this.API_URL}/invites/me`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Get my invites error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get all invites for current tenant
   */
  getTenantInvites(): Observable<InviteListItem[]> {
    return this.http.get<{data: InviteListItem[]}>(`${this.API_URL}/tenants/invites`)
      .pipe(
        map(response => response.data),
        catchError(error => {
          console.error('Get tenant invites error:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Cancel invite
   */
  cancelInvite(inviteId: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/invites/${inviteId}`)
      .pipe(
        catchError(error => {
          console.error('Cancel invite error:', error);
          return throwError(() => error);
        })
      );
  }
}
