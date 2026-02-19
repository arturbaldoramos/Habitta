import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services';

/**
 * Auth Interceptor - Adds JWT token to requests and handles 401 errors
 * Automatically registered in app.config.ts with provideHttpClient(withInterceptors([authInterceptor]))
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token();

  // Clone the request and add authorization header if token exists
  // Skip adding token for auth endpoints (login, register)
  const isAuthEndpoint = req.url.includes('/auth/login') || req.url.includes('/auth/register');

  let authReq = req;
  if (token && !isAuthEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Handle the request and catch errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // If we get a 401 Unauthorized error, logout the user
      if (error.status === 401 && !isAuthEndpoint) {
        console.error('Unauthorized request - logging out');
        authService.logout();
      }

      return throwError(() => error);
    })
  );
};
