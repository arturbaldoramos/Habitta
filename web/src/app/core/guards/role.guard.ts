import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services';
import { UserRole } from '../models';

/**
 * Factory function to create a role guard
 * Checks if user has required role in the active tenant
 */
export function roleGuard(allowedRoles: UserRole[]): CanActivateFn {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.hasAnyRole(allowedRoles)) {
      // User doesn't have required role - redirect to unauthorized
      router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  };
}

/**
 * Predefined guard for admin role only
 */
export const adminGuard: CanActivateFn = roleGuard([UserRole.ADMIN]);

/**
 * Predefined guard for síndico or admin roles
 */
export const sindicoOrAdminGuard: CanActivateFn = roleGuard([UserRole.SINDICO, UserRole.ADMIN]);
