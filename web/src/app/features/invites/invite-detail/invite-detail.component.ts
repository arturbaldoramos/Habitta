import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InviteService } from '../../../core/services';
import { InviteListItem, InviteStatus, UserRole } from '../../../core/models';

@Component({
  selector: 'app-invite-detail',
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './invite-detail.component.html',
  styleUrl: './invite-detail.component.css'
})
export class InviteDetailComponent implements OnInit {
  private readonly inviteService = inject(InviteService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly invite = signal<InviteListItem | null>(null);
  readonly loading = signal(true);

  readonly InviteStatus = InviteStatus;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/invites']);
      return;
    }

    // Try to get invite from navigation state first
    const stateInvite = history.state?.invite as InviteListItem | undefined;
    if (stateInvite && stateInvite.id === id) {
      this.invite.set(stateInvite);
      this.loading.set(false);
    } else {
      this.loadInvite(id);
    }
  }

  private loadInvite(id: number): void {
    this.loading.set(true);
    this.inviteService.getTenantInvites().subscribe({
      next: (invites) => {
        const found = invites.find(i => i.id === id);
        if (found) {
          this.invite.set(found);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail: 'Convite não encontrado'
          });
          this.router.navigate(['/invites']);
        }
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar convite'
        });
        this.loading.set(false);
        this.router.navigate(['/invites']);
      }
    });
  }

  copyInviteLink(): void {
    const invite = this.invite();
    if (!invite) return;

    const link = `${window.location.origin}/invite/${invite.token}`;

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

  confirmCancel(): void {
    const invite = this.invite();
    if (!invite) return;

    this.confirmationService.confirm({
      message: `Deseja cancelar o convite para ${invite.email}?`,
      header: 'Confirmar Cancelamento',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim, cancelar',
      rejectLabel: 'Não',
      accept: () => {
        this.inviteService.cancelInvite(invite.id).subscribe({
          next: () => {
            this.invite.update(current => current ? { ...current, status: InviteStatus.CANCELLED } : null);
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
    });
  }

  goBack(): void {
    this.router.navigate(['/invites']);
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      [UserRole.ADMIN]: 'Admin',
      [UserRole.SINDICO]: 'Síndico',
      [UserRole.MORADOR]: 'Morador'
    };
    return labels[role] || role;
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      [UserRole.ADMIN]: 'danger',
      [UserRole.SINDICO]: 'warn',
      [UserRole.MORADOR]: 'info'
    };
    return severities[role] || 'secondary';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      [InviteStatus.PENDING]: 'Pendente',
      [InviteStatus.ACCEPTED]: 'Aceito',
      [InviteStatus.EXPIRED]: 'Expirado',
      [InviteStatus.CANCELLED]: 'Cancelado'
    };
    return labels[status] || status;
  }

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const severities: Record<string, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
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
