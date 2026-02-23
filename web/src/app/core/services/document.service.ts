import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  Folder,
  Document,
  CreateFolderDto,
  UpdateFolderDto,
  MoveDocumentDto,
  SuccessResponse
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:8080/api';

  // Folder operations

  getFolders(): Observable<Folder[]> {
    return this.http.get<{ data: Folder[] }>(`${this.API_URL}/folders`).pipe(
      map(response => response.data)
    );
  }

  createFolder(data: CreateFolderDto): Observable<Folder> {
    return this.http.post<{ data: Folder }>(`${this.API_URL}/folders`, data).pipe(
      map(response => response.data)
    );
  }

  updateFolder(id: number, data: UpdateFolderDto): Observable<Folder> {
    return this.http.put<{ data: Folder }>(`${this.API_URL}/folders/${id}`, data).pipe(
      map(response => response.data)
    );
  }

  deleteFolder(id: number): Observable<SuccessResponse> {
    return this.http.delete<SuccessResponse>(`${this.API_URL}/folders/${id}`);
  }

  // Document operations

  getDocuments(folderId?: number): Observable<Document[]> {
    let params = new HttpParams();
    if (folderId !== undefined) {
      params = params.set('folder_id', folderId.toString());
    }
    return this.http.get<{ data: Document[] }>(`${this.API_URL}/documents`, { params }).pipe(
      map(response => response.data)
    );
  }

  getDocument(id: number): Observable<Document> {
    return this.http.get<{ data: Document }>(`${this.API_URL}/documents/${id}`).pipe(
      map(response => response.data)
    );
  }

  uploadDocument(file: File, folderId?: number): Observable<Document> {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId !== undefined) {
      formData.append('folder_id', folderId.toString());
    }
    return this.http.post<{ data: Document }>(`${this.API_URL}/documents/upload`, formData).pipe(
      map(response => response.data)
    );
  }

  getDownloadUrl(id: number): Observable<string> {
    return this.http.get<{ data: { url: string } }>(`${this.API_URL}/documents/${id}/download`).pipe(
      map(response => response.data.url)
    );
  }

  deleteDocument(id: number): Observable<SuccessResponse> {
    return this.http.delete<SuccessResponse>(`${this.API_URL}/documents/${id}`);
  }

  moveDocument(id: number, data: MoveDocumentDto): Observable<SuccessResponse> {
    return this.http.patch<SuccessResponse>(`${this.API_URL}/documents/${id}/move`, data);
  }
}
