import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { Select } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { InviteService, AuthService } from '../../../core/services';
import { Invite, CreateInviteDto, UserRole, InviteStatus } from '../../../core/models';

interface RoleOption {
  label: string;
  value: UserRole;
}

@Component({
  selector: 'app-invite-management',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    MessageModule,
    TableModule,
    TagModule,
    Select,
    DialogModule,
    ConfirmDialogModule,
    ToastModule,
    TooltipModule
  ],
  providers: [ConfirmationService, MessageService],
  template: `
    <div class="container mx-auto px-4 py-8">
      <div class="mb-6 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-800">Gerenciar Convites</h1>
          <p class="text-gray-600 mt-2">Convide novos moradores para o condomínio</p>
        </div>
        <p-button
          label="Novo Convite"
          icon="pi pi-plus"
          (onClick)="showCreateDialog()"
          severity="primary" />
      </div>

      @if (errorMessage()) {
        <p-message severity="error" [text]="errorMessage()!" styleClass="w-full mb-4" />
      }

      <!-- Invites Table -->
      <p-card>
        <p-table
          [value]="invites()"
          [loading]="loading()"
          [paginator]="true"
          [rows]="10"
          [showCurrentPageReport]="true"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} convites"
          [rowsPerPageOptions]="[10, 25, 50]"
          styleClass="p-datatable-sm">

          <ng-template #header>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Convidado por</th>
              <th>Expira em</th>
              <th>Ações</th>
            </tr>
          </ng-template>

          <ng-template #body let-invite>
            <tr>
              <td>{{ invite.email }}</td>
              <td>
                <p-tag
                  [value]="getRoleLabel(invite.role)"
                  [severity]="getRoleSeverity(invite.role)" />
              </td>
              <td>
                <p-tag
                  [value]="getStatusLabel(invite.status)"
                  [severity]="getStatusSeverity(invite.status)" />
              </td>
              <td>{{ invite.invited_by?.name }}</td>
              <td>{{ formatDate(invite.expires_at) }}</td>
              <td>
                <div class="flex gap-2">
                  @if (invite.status === 'pending') {
                    <p-button
                      icon="pi pi-copy"
                      (onClick)="copyInviteLink(invite.token)"
                      [text]="true"
                      severity="secondary"
                      [pTooltip]="'Copiar link'" />
                    <p-button
                      icon="pi pi-times"
                      (onClick)="confirmCancel(invite)"
                      [text]="true"
                      severity="danger"
                      [pTooltip]="'Cancelar convite'" />
                  }
                </div>
              </td>
            </tr>
          </ng-template>

          <ng-template #emptymessage>
            <tr>
              <td colspan="6" class="text-center py-8 text-gray-500">
                Nenhum convite encontrado
              </td>
            </tr>
          </ng-template>
        </p-table>
      </p-card>
    </div>

    <!-- Create Invite Dialog -->
    <p-dialog
      header="Criar Novo Convite"
      [(visible)]="showDialog"
      [modal]="true"
      [style]="{ width: '500px' }">

      <form [formGroup]="inviteForm" (ngSubmit)="onSubmit()" class="flex flex-col gap-4">
        @if (dialogError()) {
          <p-message severity="error" [text]="dialogError()!" styleClass="w-full" />
        }

        <div class="flex flex-col gap-2">
          <label for="email">Email *</label>
          <input
            pInputText
            id="email"
            formControlName="email"
            placeholder="email@exemplo.com"
            [class.ng-invalid]="isFieldInvalid('email')"
            [class.ng-dirty]="isFieldInvalid('email')" />
          @if (isFieldInvalid('email')) {
            <small class="text-red-500">Email válido é obrigatório</small>
          }
        </div>

        <div class="flex flex-col gap-2">
          <label for="role">Permissão *</label>
          <p-select
            id="role"
            formControlName="role"
            [options]="roleOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Selecione uma permissão"
            styleClass="w-full" />
          @if (isFieldInvalid('role')) {
            <small class="text-red-500">Permissão é obrigatória</small>
          }
        </div>

        <div class="flex justify-end gap-2 mt-4">
          <p-button
            type="button"
            label="Cancelar"
            (onClick)="closeDialog()"
            [text]="true"
            severity="secondary" />
          <p-button
            type="submit"
            label="Criar Convite"
            [loading]="creating()"
            [disabled]="inviteForm.invalid || creating()"
            severity="primary" />
        </div>
      </form>
    </p-dialog>

    <!-- Confirm Dialog -->
    <p-confirmDialog />

    <!-- Toast -->
    <p-toast />
  `
})
export class InviteManagementComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly inviteService = inject(InviteService);
  private readonly authService = inject(AuthService);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly invites = signal<Invite[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly dialogError = signal<string | null>(null);
  readonly creating = signal(false);

  showDialog = false;
  readonly inviteForm: FormGroup;

  readonly roleOptions: RoleOption[] = [
    { label: 'Administrador', value: UserRole.ADMIN },
    { label: 'Síndico', value: UserRole.SINDICO },
    { label: 'Morador', value: UserRole.MORADOR }
  ];

  constructor() {
    this.inviteForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      role: [UserRole.MORADOR, [Validators.required]]
    });
  }

  ngOnInit(): void {
    // Check if user has permission
    if (!this.authService.isSindicoOrAdmin()) {
      this.errorMessage.set('Você não tem permissão para acessar esta página');
      return;
    }

    this.loadInvites();
  }

  loadInvites(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.inviteService.getTenantInvites().subscribe({
      next: (invites) => {
        this.invites.set(invites);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Erro ao carregar convites. Tente novamente.'
        );
      }
    });
  }

  showCreateDialog(): void {
    this.showDialog = true;
    this.inviteForm.reset({ role: UserRole.MORADOR });
    this.dialogError.set(null);
  }

  closeDialog(): void {
    this.showDialog = false;
    this.inviteForm.reset();
    this.dialogError.set(null);
  }

  onSubmit(): void {
    if (this.inviteForm.invalid) {
      this.inviteForm.markAllAsTouched();
      return;
    }

    this.creating.set(true);
    this.dialogError.set(null);

    const data: CreateInviteDto = {
      email: this.inviteForm.value.email,
      role: this.inviteForm.value.role
    };

    this.inviteService.createInvite(data).subscribe({
      next: (invite) => {
        this.creating.set(false);
        this.closeDialog();
        this.loadInvites();

        this.messageService.add({
          severity: 'success',
          summary: 'Convite Criado',
          detail: `Convite enviado para ${invite.email}`,
          life: 3000
        });

        // Auto-copy invite link
        this.copyInviteLink(invite.token);
      },
      error: (error) => {
        this.creating.set(false);
        this.dialogError.set(
          error.error?.message || 'Erro ao criar convite. Tente novamente.'
        );
      }
    });
  }

  confirmCancel(invite: Invite): void {
    this.confirmationService.confirm({
      message: `Deseja cancelar o convite para ${invite.email}?`,
      header: 'Confirmar Cancelamento',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, cancelar',
      rejectLabel: 'Não',
      accept: () => {
        this.cancelInvite(invite.id);
      }
    });
  }

  cancelInvite(inviteId: number): void {
    this.inviteService.cancelInvite(inviteId).subscribe({
      next: () => {
        this.loadInvites();
        this.messageService.add({
          severity: 'success',
          summary: 'Convite Cancelado',
          detail: 'O convite foi cancelado com sucesso',
          life: 3000
        });
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || 'Erro ao cancelar convite',
          life: 3000
        });
      }
    });
  }

  copyInviteLink(token: string): void {
    const link = `${window.location.origin}/invite/${token}`;

    navigator.clipboard.writeText(link).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Link Copiado',
        detail: 'Link do convite copiado para a área de transferência',
        life: 3000
      });
    }).catch(() => {
      this.messageService.add({
        severity: 'warn',
        summary: 'Erro ao Copiar',
        detail: `Link: ${link}`,
        life: 5000
      });
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.inviteForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  getRoleLabel(role: UserRole): string {
    const labels: Record<UserRole, string> = {
      [UserRole.ADMIN]: 'Admin',
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

  getStatusLabel(status: InviteStatus): string {
    const labels: Record<InviteStatus, string> = {
      [InviteStatus.PENDING]: 'Pendente',
      [InviteStatus.ACCEPTED]: 'Aceito',
      [InviteStatus.EXPIRED]: 'Expirado',
      [InviteStatus.CANCELLED]: 'Cancelado'
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: InviteStatus): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<InviteStatus, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      [InviteStatus.PENDING]: 'warn',
      [InviteStatus.ACCEPTED]: 'success',
      [InviteStatus.EXPIRED]: 'secondary',
      [InviteStatus.CANCELLED]: 'danger'
    };
    return severities[status] || 'secondary';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
