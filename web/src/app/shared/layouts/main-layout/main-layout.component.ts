import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Drawer } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { MenuItem } from 'primeng/api';
import { AuthService } from '../../../core/services';
import { UserRole } from '../../../core/models';

@Component({
  selector: 'app-main-layout',
  imports: [
    CommonModule,
    RouterModule,
    Drawer,
    ButtonModule,
    MenuModule,
    AvatarModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly sidebarVisible = signal(false);
  readonly currentUser = this.authService.currentUser;
  readonly userRole = this.authService.userRole;

  readonly menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      routerLink: '/dashboard'
    },
    {
      label: 'Usuários',
      icon: 'pi pi-users',
      routerLink: '/users',
      visible: this.isAdminOrSindico()
    },
    {
      label: 'Unidades',
      icon: 'pi pi-building',
      routerLink: '/units',
      visible: this.isAdminOrSindico()
    },
    {
      separator: true
    },
    {
      label: 'Perfil',
      icon: 'pi pi-user',
      command: () => this.goToProfile()
    },
    {
      label: 'Sair',
      icon: 'pi pi-sign-out',
      command: () => this.logout()
    }
  ];

  toggleSidebar(): void {
    this.sidebarVisible.update(visible => !visible);
  }

  closeSidebar(): void {
    this.sidebarVisible.set(false);
  }

  logout(): void {
    this.authService.logout();
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
    this.closeSidebar();
  }

  isAdminOrSindico(): boolean {
    const role = this.userRole();
    return role === UserRole.ADMIN || role === UserRole.SINDICO;
  }

  getUserInitials(): string {
    const user = this.currentUser();
    if (!user?.name) return 'U';

    const names = user.name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  }

  getRoleBadgeClass(): string {
    const role = this.userRole();
    switch (role) {
      case UserRole.ADMIN:
        return 'role-badge role-admin';
      case UserRole.SINDICO:
        return 'role-badge role-sindico';
      case UserRole.MORADOR:
        return 'role-badge role-morador';
      default:
        return 'role-badge';
    }
  }

  getRoleLabel(): string {
    const role = this.userRole();
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrador';
      case UserRole.SINDICO:
        return 'Síndico';
      case UserRole.MORADOR:
        return 'Morador';
      default:
        return '';
    }
  }
}
