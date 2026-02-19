// Generic API Response wrapper
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

// Error Response
export interface ApiError {
  error: string;
  message: string;
  errors?: Record<string, string[]>;
}

// Paginated Response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Success Response (for delete operations, etc)
export interface SuccessResponse {
  message: string;
}
