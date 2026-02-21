import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  Unit,
  UnitDetail,
  CreateUnitDto,
  UpdateUnitDto,
  PaginatedResponse,
  SuccessResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class UnitService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api';

  /**
   * Get paginated list of units
   */
  getUnits(page: number = 1, perPage: number = 10, search?: string): Observable<PaginatedResponse<Unit>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<PaginatedResponse<Unit>>(`${this.API_URL}/units`, { params });
  }

  /**
   * Get unit by ID
   */
  getUnitById(id: number): Observable<UnitDetail> {
    return this.http.get<{ data: UnitDetail }>(`${this.API_URL}/units/${id}`).pipe(
      map(response => response.data)
    );
  }

  /**
   * Create new unit
   */
  createUnit(data: CreateUnitDto): Observable<Unit> {
    return this.http.post<Unit>(`${this.API_URL}/units`, data);
  }

  /**
   * Update unit
   */
  updateUnit(id: number, data: UpdateUnitDto): Observable<Unit> {
    return this.http.put<Unit>(`${this.API_URL}/units/${id}`, data);
  }

  /**
   * Delete unit
   */
  deleteUnit(id: number): Observable<SuccessResponse> {
    return this.http.delete<SuccessResponse>(`${this.API_URL}/units/${id}`);
  }
}
