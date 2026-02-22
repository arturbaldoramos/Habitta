import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User, UpdateAccountDto, UpdatePasswordDto, SuccessResponse } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api';

  getAccount(): Observable<User> {
    return this.http.get<{ data: User }>(`${this.API_URL}/account`).pipe(
      map(res => res.data)
    );
  }

  updateAccount(data: UpdateAccountDto): Observable<User> {
    return this.http.patch<{ data: User }>(`${this.API_URL}/account`, data).pipe(
      map(res => res.data)
    );
  }

  updatePassword(data: UpdatePasswordDto): Observable<SuccessResponse> {
    return this.http.patch<SuccessResponse>(`${this.API_URL}/account/password`, data);
  }
}
