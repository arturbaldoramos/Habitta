import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services';

/**
 * Guard that requires an active tenant
 * Redirects to tenant selection if user doesn't have an active tenant
 */
export const tenantRequiredGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.hasActiveTenant()) {
    // User doesn't have active tenant - redirect to tenant selection
    router.navigate(['/my-tenants']);
    return false;
  }

  return true;
};
