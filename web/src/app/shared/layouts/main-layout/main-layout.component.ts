import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Drawer } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { Tag } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { AuthService } from '../../../core/services';
import { UserRole } from '../../../core/models';

@Component({
  selector: 'app-main-layout',
  imports: [
    CommonModule,
    RouterModule,
    Drawer,
    ButtonModule,
    AvatarModule,
    Tag,
    TooltipModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly sidebarVisible = signal(false);
  readonly currentUser = this.authService.currentUser;
  readonly userRole = this.authService.activeRole;

  toggleSidebar(): void {
    this.sidebarVisible.update(visible => !visible);
  }

  closeSidebar(): void {
    this.sidebarVisible.set(false);
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
    this.closeSidebar();
  }

  logout(): void {
    this.authService.logout();
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

  getRoleSeverity(): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const role = this.userRole();
    switch (role) {
      case UserRole.ADMIN:
        return 'warn';
      case UserRole.SINDICO:
        return 'info';
      case UserRole.MORADOR:
        return 'secondary';
      default:
        return 'secondary';
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
