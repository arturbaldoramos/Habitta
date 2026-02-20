import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services';

/**
 * Guard that requires user to NOT have an active tenant (orphan user)
 * Redirects to dashboard if user already has an active tenant
 */
export const orphanUserGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.hasActiveTenant()) {
    // User already has active tenant - redirect to dashboard
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};
