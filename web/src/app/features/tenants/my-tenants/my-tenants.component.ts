import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { TenantService, AuthService } from '../../../core/services';
import { UserTenant, UserRole } from '../../../core/models';

@Component({
  selector: 'app-my-tenants',
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    MessageModule,
    SkeletonModule,
    TagModule
  ],
  templateUrl: './my-tenants.component.html',
  styles: [`
    :host ::ng-deep .p-card {
      height: 100%;
    }

    :host ::ng-deep .p-card-body {
      height: 100%;
    }
  `]
})
export class MyTenantsComponent implements OnInit {
  private readonly tenantService = inject(TenantService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly tenants = signal<UserTenant[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly switchingTenantId = signal<number | null>(null);

  ngOnInit(): void {
    this.loadTenants();
  }

  loadTenants(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.tenantService.getMyTenants().subscribe({
      next: (tenants) => {
        this.tenants.set(tenants);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Erro ao carregar condomínios. Tente novamente.'
        );
      }
    });
  }

  switchToTenant(tenantId: number): void {
    this.switchingTenantId.set(tenantId);
    this.errorMessage.set(null);

    this.authService.switchTenant(tenantId).subscribe({
      next: () => {
        this.switchingTenantId.set(null);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.switchingTenantId.set(null);
        this.errorMessage.set(
          error.error?.message || 'Erro ao trocar condomínio. Tente novamente.'
        );
      }
    });
  }

  isActiveTenant(tenantId: number): boolean {
    return this.authService.activeTenantId() === tenantId;
  }

  getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      [UserRole.ADMIN]: 'Administrador',
      [UserRole.SINDICO]: 'Síndico',
      [UserRole.MORADOR]: 'Morador'
    };
    return labels[role] || role;
  }

  getRoleSeverity(role: UserRole): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<UserRole, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      [UserRole.ADMIN]: 'danger',
      [UserRole.SINDICO]: 'warn',
      [UserRole.MORADOR]: 'info'
    };
    return severities[role] || 'secondary';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  goToCreateTenant(): void {
    this.router.navigate(['/create-tenant']);
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }
}
