import { Routes } from '@angular/router';
import { authGuard } from './core/guards';
import { tenantRequiredGuard } from './core/guards/tenant-required.guard';
import { orphanUserGuard } from './core/guards/orphan-user.guard';
import { sindicoOrAdminGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Redirect root to dashboard or login
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Public routes (no authentication required)
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'invite/:token',
    loadComponent: () => import('./features/invites/accept-invite/accept-invite.component').then(m => m.AcceptInviteComponent)
  },

  // Protected routes WITHOUT tenant context (orphan users can access)
  {
    path: 'create-tenant',
    canActivate: [authGuard, orphanUserGuard],
    loadComponent: () => import('./features/tenants/create-tenant/create-tenant.component').then(m => m.CreateTenantComponent)
  },
  {
    path: 'my-tenants',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tenants/my-tenants/my-tenants.component').then(m => m.MyTenantsComponent)
  },

  // Protected routes WITH tenant context (requires active tenant)
  {
    path: '',
    canActivate: [authGuard, tenantRequiredGuard],
    loadComponent: () => import('./shared/layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },

      // User routes (admin and síndico only)
      {
        path: 'users',
        canActivate: [sindicoOrAdminGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent)
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent)
          }
        ]
      },

      // Unit routes (admin and síndico only)
      {
        path: 'units',
        canActivate: [sindicoOrAdminGuard],
        children: [
          {
            path: '',
            loadComponent: () => import('./features/units/unit-list/unit-list.component').then(m => m.UnitListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/units/unit-form/unit-form.component').then(m => m.UnitFormComponent)
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./features/units/unit-form/unit-form.component').then(m => m.UnitFormComponent)
          }
        ]
      },

      // Invite management (síndico and admin only)
      {
        path: 'invites',
        canActivate: [sindicoOrAdminGuard],
        loadComponent: () => import('./features/invites/invite-management/invite-management.component').then(m => m.InviteManagementComponent)
      }
    ]
  },

  // Unauthorized page
  {
    path: 'unauthorized',
    loadComponent: () => import('./shared/components/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
  },

  // 404 page
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
