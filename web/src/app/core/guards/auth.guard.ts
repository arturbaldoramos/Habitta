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

/**
 * Role Guard Factory - Protects routes by user role
 * Usage: canActivate: [roleGuard(['admin', 'sindico'])]
 */
export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // First check if user is authenticated
    if (!authService.isAuthenticated()) {
      router.navigate(['/login'], {
        queryParams: { returnUrl: state.url }
      });
      return false;
    }

    // Check if user has required role
    if (authService.hasAnyRole(allowedRoles)) {
      return true;
    }

    // User doesn't have required role, redirect to unauthorized page
    router.navigate(['/unauthorized']);
    return false;
  };
};
