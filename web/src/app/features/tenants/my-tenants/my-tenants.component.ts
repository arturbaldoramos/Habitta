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
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-800">Meus Condomínios</h1>
        <p class="text-gray-600 mt-2">Gerencie seus condomínios e alterne entre eles</p>
      </div>

      @if (errorMessage()) {
        <p-message severity="error" [text]="errorMessage()!" styleClass="w-full mb-4" />
      }

      @if (loading()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (item of [1,2,3]; track item) {
            <p-card>
              <p-skeleton width="100%" height="2rem" styleClass="mb-2" />
              <p-skeleton width="80%" height="1rem" styleClass="mb-2" />
              <p-skeleton width="60%" height="1rem" />
            </p-card>
          }
        </div>
      } @else {
        @if (tenants().length === 0) {
          <p-card>
            <div class="text-center py-8">
              <i class="pi pi-building text-6xl text-gray-400 mb-4"></i>
              <h3 class="text-xl font-semibold text-gray-700 mb-2">
                Nenhum condomínio encontrado
              </h3>
              <p class="text-gray-600 mb-4">
                Você ainda não pertence a nenhum condomínio
              </p>
              <p-button
                label="Criar Condomínio"
                icon="pi pi-plus"
                (onClick)="goToCreateTenant()"
                severity="primary" />
            </div>
          </p-card>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (userTenant of tenants(); track userTenant.id) {
              <p-card>
                <div class="flex flex-col h-full">
                  <!-- Header -->
                  <div class="mb-4">
                    <div class="flex justify-between items-start mb-2">
                      <h3 class="text-xl font-semibold text-gray-800">
                        {{ userTenant.tenant?.name || 'Sem nome' }}
                      </h3>
                      @if (isActiveTenant(userTenant.tenant_id)) {
                        <p-tag value="Ativo" severity="success" />
                      }
                    </div>

                    <p-tag
                      [value]="getRoleLabel(userTenant.role)"
                      [severity]="getRoleSeverity(userTenant.role)" />
                  </div>

                  <!-- Info -->
                  <div class="flex-grow mb-4">
                    <div class="text-sm text-gray-600 space-y-1">
                      <p>
                        <i class="pi pi-calendar mr-2"></i>
                        Entrou em {{ formatDate(userTenant.joined_at) }}
                      </p>
                      @if (!userTenant.is_active) {
                        <p class="text-orange-600">
                          <i class="pi pi-exclamation-triangle mr-2"></i>
                          Acesso desativado
                        </p>
                      }
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex gap-2">
                    @if (!isActiveTenant(userTenant.tenant_id) && userTenant.is_active) {
                      <p-button
                        label="Acessar"
                        icon="pi pi-sign-in"
                        (onClick)="switchToTenant(userTenant.tenant_id)"
                        [loading]="switchingTenantId() === userTenant.tenant_id"
                        styleClass="flex-1"
                        severity="primary" />
                    }
                    @if (isActiveTenant(userTenant.tenant_id)) {
                      <p-button
                        label="Painel"
                        icon="pi pi-home"
                        (onClick)="goToDashboard()"
                        styleClass="flex-1"
                        severity="success" />
                    }
                  </div>
                </div>
              </p-card>
            }
          </div>

          <!-- Create New Tenant Button -->
          <div class="mt-6 text-center">
            <p-button
              label="Criar Novo Condomínio"
              icon="pi pi-plus"
              (onClick)="goToCreateTenant()"
              severity="secondary"
              [outlined]="true" />
          </div>
        }
      }
    </div>
  `,
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
