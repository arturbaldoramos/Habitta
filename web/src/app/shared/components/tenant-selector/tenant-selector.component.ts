import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TenantSelectionInfo } from '../../../core/models';

@Component({
  selector: 'app-tenant-selector',
  imports: [
    CommonModule,
    DialogModule,
    ButtonModule,
    CardModule
  ],
  template: `
    <p-dialog
      header="Selecione o Condomínio"
      [visible]="visible()"
      [modal]="true"
      [closable]="false"
      [draggable]="false"
      [style]="{ width: '500px' }">

      <div class="flex flex-col gap-4">
        <p class="text-gray-600">
          Você possui acesso a múltiplos condomínios. Selecione um para continuar.
        </p>

        <div class="flex flex-col gap-3">
          @for (tenant of tenants(); track tenant.tenant_id) {
            <p-card
              [class.border-2]="selectedTenantId() === tenant.tenant_id"
              [class.border-blue-500]="selectedTenantId() === tenant.tenant_id"
              class="cursor-pointer hover:bg-gray-50 transition-colors"
              (click)="selectTenant(tenant.tenant_id)">

              <div class="flex justify-between items-center">
                <div>
                  <h3 class="font-semibold text-lg">{{ tenant.tenant_name }}</h3>
                  <p class="text-sm text-gray-600">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {{ getRoleLabel(tenant.role) }}
                    </span>
                  </p>
                </div>

                @if (selectedTenantId() === tenant.tenant_id) {
                  <i class="pi pi-check-circle text-blue-500 text-2xl"></i>
                }
              </div>
            </p-card>
          }
        </div>

        <p-button
          label="Entrar"
          icon="pi pi-sign-in"
          [disabled]="!selectedTenantId() || loading()"
          [loading]="loading()"
          (onClick)="onConfirm()"
          styleClass="w-full" />
      </div>
    </p-dialog>
  `,
  styles: [`
    :host ::ng-deep .p-card {
      padding: 0.5rem;
    }

    :host ::ng-deep .p-card-body {
      padding: 1rem;
    }
  `]
})
export class TenantSelectorComponent {
  readonly tenants = input.required<TenantSelectionInfo[]>();
  readonly visible = input.required<boolean>();
  readonly loading = input<boolean>(false);

  readonly tenantSelected = output<number>();

  readonly selectedTenantId = signal<number | null>(null);

  selectTenant(tenantId: number): void {
    this.selectedTenantId.set(tenantId);
  }

  onConfirm(): void {
    const tenantId = this.selectedTenantId();
    if (tenantId) {
      this.tenantSelected.emit(tenantId);
    }
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'admin': 'Administrador',
      'sindico': 'Síndico',
      'morador': 'Morador'
    };
    return labels[role] || role;
  }
}
