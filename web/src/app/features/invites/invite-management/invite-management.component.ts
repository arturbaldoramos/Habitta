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
  templateUrl: './invite-management.component.html'
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
