import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputMask } from 'primeng/inputmask';
import { PasswordModule } from 'primeng/password';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AccountService, AuthService } from '../../core/services';
import { User } from '../../core/models';

@Component({
  selector: 'app-account',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    InputMask,
    PasswordModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './account.component.html',
  styleUrl: './account.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountComponent implements OnInit {
  private readonly accountService = inject(AccountService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly messageService = inject(MessageService);

  readonly user = signal<User | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editing = signal(false);
  readonly changingPassword = signal(false);
  readonly savingPassword = signal(false);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['']
    });

    this.passwordForm = this.fb.group({
      old_password: ['', Validators.required],
      new_password: ['', [Validators.required, Validators.minLength(6)]]
    });

    this.loadAccount();
  }

  private loadAccount(): void {
    this.loading.set(true);
    this.accountService.getAccount().subscribe({
      next: (user) => {
        this.user.set(user);
        this.profileForm.patchValue({
          name: user.name,
          phone: user.phone || ''
        });
        this.loading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar dados da conta'
        });
        this.loading.set(false);
      }
    });
  }

  startEdit(): void {
    const user = this.user();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        phone: user.phone || ''
      });
    }
    this.editing.set(true);
  }

  cancelEdit(): void {
    const user = this.user();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        phone: user.phone || ''
      });
    }
    this.editing.set(false);
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;

    if (!this.profileForm.dirty) {
      this.editing.set(false);
      return;
    }

    this.saving.set(true);
    const data = this.profileForm.value;

    this.accountService.updateAccount(data).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.authService.updateCurrentUser(updatedUser);
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Perfil atualizado com sucesso'
        });
        this.saving.set(false);
        this.editing.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || 'Erro ao atualizar perfil'
        });
        this.saving.set(false);
      }
    });
  }

  togglePasswordForm(): void {
    this.changingPassword.update(v => !v);
    if (!this.changingPassword()) {
      this.passwordForm.reset();
    }
  }

  savePassword(): void {
    if (this.passwordForm.invalid) return;

    this.savingPassword.set(true);
    const data = this.passwordForm.value;

    this.accountService.updatePassword(data).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Senha alterada com sucesso'
        });
        this.savingPassword.set(false);
        this.changingPassword.set(false);
        this.passwordForm.reset();
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || 'Erro ao alterar senha'
        });
        this.savingPassword.set(false);
      }
    });
  }
}
