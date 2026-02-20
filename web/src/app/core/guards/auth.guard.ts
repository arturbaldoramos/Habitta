import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services';

/**
 * Auth Guard - Protects routes requiring authentication
 * Usage: canActivate: [authGuard]
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Store the attempted URL for redirecting after login
  const returnUrl = state.url;
  router.navigate(['/login'], {
    queryParams: { returnUrl }
  });

  return false;
};

/**
 * Guest Guard - Redirects authenticated users away from auth pages
 * Usage: canActivate: [guestGuard]
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Redirect authenticated users to dashboard
  router.navigate(['/dashboard']);
  return false;
};
