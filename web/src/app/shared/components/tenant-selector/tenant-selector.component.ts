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
  templateUrl: './tenant-selector.component.html',
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
