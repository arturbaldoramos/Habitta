import { Routes } from '@angular/router';
import { authGuard, guestGuard, roleGuard } from './core/guards';

export const routes: Routes = [
  // Redirect root to dashboard or login
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Auth routes (accessible only when not authenticated)
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },

  // Protected routes (require authentication)
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./shared/layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },

      // User routes (admin and sindico only)
      {
        path: 'users',
        canActivate: [roleGuard(['admin', 'sindico'])],
        children: [
          {
            path: '',
            loadComponent: () => import('./features/users/user-list/user-list.component').then(m => m.UserListComponent)
          },
          {
            path: 'new',
            loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent)
          },
          {
            path: 'edit/:id',
            loadComponent: () => import('./features/users/user-form/user-form.component').then(m => m.UserFormComponent)
          }
        ]
      },

      // Unit routes (admin and sindico only)
      {
        path: 'units',
        canActivate: [roleGuard(['admin', 'sindico'])],
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
