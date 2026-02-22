import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { Select } from 'primeng/select';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UserService, UnitService } from '../../../core/services';
import { UserListItem, UserRole, Unit } from '../../../core/models';

interface UnitOption {
  label: string;
  value: number | null;
}

@Component({
  selector: 'app-user-detail',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    CheckboxModule,
    Select,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './user-detail.component.html',
  styleUrl: './user-detail.component.css'
})
export class UserDetailComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly unitService = inject(UnitService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly user = signal<UserListItem | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly unitOptions = signal<UnitOption[]>([]);

  editForm!: FormGroup;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/users']);
      return;
    }

    this.editForm = this.fb.group({
      is_active: [true],
      unit_id: [null as number | null]
    });

    this.loadUser(id);
    this.loadUnits();
  }

  private loadUser(id: number): void {
    this.loading.set(true);
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.user.set(user);
        this.editForm.patchValue({
          is_active: user.is_active,
          unit_id: user.unit_id
        });
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar usuário'
        });
        this.loading.set(false);
        this.router.navigate(['/users']);
      }
    });
  }

  private loadUnits(): void {
    this.unitService.getUnits(1, 1000).subscribe({
      next: (response) => {
        const options: UnitOption[] = [
          { label: 'Nenhuma', value: null },
          ...response.data.map((u: Unit) => ({
            label: u.block ? `${u.number} - Bloco ${u.block}` : u.number,
            value: u.id
          }))
        ];
        this.unitOptions.set(options);
      }
    });
  }

  startEdit(): void {
    const user = this.user();
    if (user) {
      this.editForm.patchValue({
        is_active: user.is_active,
        unit_id: user.unit_id
      });
    }
    this.editing.set(true);
  }

  cancelEdit(): void {
    const user = this.user();
    if (user) {
      this.editForm.patchValue({
        is_active: user.is_active,
        unit_id: user.unit_id
      });
    }
    this.editing.set(false);
  }

  saveEdit(): void {
    const user = this.user();
    if (!user) return;

    this.saving.set(true);
    const data = {
      is_active: this.editForm.value.is_active,
      unit_id: this.editForm.value.unit_id
    };

    this.userService.updateMembership(user.id, data).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Usuário atualizado com sucesso'
        });
        this.saving.set(false);
        this.editing.set(false);
        this.loadUser(user.id);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || 'Erro ao atualizar usuário'
        });
        this.saving.set(false);
      }
    });
  }

  confirmDelete(): void {
    const user = this.user();
    if (!user) return;

    this.confirmationService.confirm({
      message: `Tem certeza que deseja remover ${user.name} do condomínio?`,
      header: 'Confirmar Remoção',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.userService.removeFromTenant(user.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Usuário removido do condomínio com sucesso'
            });
            setTimeout(() => this.router.navigate(['/users']), 1000);
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Erro ao remover usuário do condomínio'
            });
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/users']);
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warn' {
    switch (role) {
      case UserRole.ADMIN: return 'warn';
      case UserRole.SINDICO: return 'info';
      case UserRole.MORADOR: return 'success';
      default: return 'info';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case UserRole.ADMIN: return 'Administrador';
      case UserRole.SINDICO: return 'Síndico';
      case UserRole.MORADOR: return 'Morador';
      default: return role;
    }
  }

  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Ativo' : 'Inativo';
  }

  getUnitLabel(unitId: number | null): string {
    if (!unitId) return '-';
    const option = this.unitOptions().find(o => o.value === unitId);
    return option ? option.label : `Unidade ${unitId}`;
  }
}
