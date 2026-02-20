import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { InputMask } from 'primeng/inputmask';
import { InviteService, AuthService } from '../../../core/services';
import { Invite, AcceptInviteDto } from '../../../core/models';

@Component({
  selector: 'app-accept-invite',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
    SkeletonModule,
    InputMask
  ],
  template: `
    <div class="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div class="w-full max-w-md">
        @if (loadingInvite()) {
          <p-card>
            <div class="space-y-4">
              <p-skeleton width="100%" height="3rem" />
              <p-skeleton width="80%" height="2rem" />
              <p-skeleton width="60%" height="1rem" />
            </div>
          </p-card>
        } @else if (inviteError()) {
          <p-card>
            <div class="text-center py-8">
              <i class="pi pi-times-circle text-6xl text-red-500 mb-4"></i>
              <h2 class="text-2xl font-bold text-gray-800 mb-2">Convite Inválido</h2>
              <p class="text-gray-600 mb-4">{{ inviteError() }}</p>
              <p-button
                label="Ir para Login"
                icon="pi pi-sign-in"
                (onClick)="goToLogin()"
                severity="primary" />
            </div>
          </p-card>
        } @else if (invite()) {
          <p-card>
            <!-- Invite Info -->
            <div class="mb-6 text-center">
              <i class="pi pi-envelope text-5xl text-blue-500 mb-4"></i>
              <h2 class="text-2xl font-bold text-gray-800 mb-2">Convite Recebido</h2>
              <p class="text-gray-600">
                Você foi convidado para o condomínio
              </p>
              <h3 class="text-xl font-semibold text-blue-600 mt-2">
                {{ invite()?.tenant?.name }}
              </h3>
              <p class="text-sm text-gray-500 mt-2">
                Como: <strong>{{ getRoleLabel(invite()?.role!) }}</strong>
              </p>

              @if (isExpired()) {
                <p-message
                  severity="warn"
                  text="Este convite expirou"
                  styleClass="mt-4 w-full" />
              }
            </div>

            @if (errorMessage()) {
              <p-message
                severity="error"
                [text]="errorMessage()!"
                styleClass="w-full mb-4" />
            }

            @if (successMessage()) {
              <p-message
                severity="success"
                [text]="successMessage()!"
                styleClass="w-full mb-4" />
            }

            <!-- Form for new users -->
            @if (!isAuthenticated() && !isExpired()) {
              <form [formGroup]="acceptForm" (ngSubmit)="onSubmit()" class="space-y-4">
                <p class="text-sm text-gray-600 mb-4">
                  Complete seu cadastro para aceitar o convite
                </p>

                <div class="flex flex-col gap-2">
                  <label for="name">Nome Completo *</label>
                  <input
                    pInputText
                    id="name"
                    formControlName="name"
                    placeholder="Seu nome completo"
                    [class.ng-invalid]="isFieldInvalid('name')"
                    [class.ng-dirty]="isFieldInvalid('name')" />
                  @if (isFieldInvalid('name')) {
                    <small class="text-red-500">Nome é obrigatório</small>
                  }
                </div>

                <div class="flex flex-col gap-2">
                  <label for="password">Senha *</label>
                  <p-password
                    id="password"
                    formControlName="password"
                    placeholder="Mínimo 6 caracteres"
                    [toggleMask]="true"
                    [feedback]="true"
                    styleClass="w-full"
                    inputStyleClass="w-full"
                    [class.ng-invalid]="isFieldInvalid('password')"
                    [class.ng-dirty]="isFieldInvalid('password')" />
                  @if (isFieldInvalid('password')) {
                    <small class="text-red-500">Senha deve ter no mínimo 6 caracteres</small>
                  }
                </div>

                <div class="flex flex-col gap-2">
                  <label for="phone">Telefone</label>
                  <p-inputmask
                    id="phone"
                    formControlName="phone"
                    mask="(99) 99999-9999"
                    placeholder="(00) 00000-0000" />
                </div>

                <div class="flex flex-col gap-2">
                  <label for="cpf">CPF</label>
                  <p-inputmask
                    id="cpf"
                    formControlName="cpf"
                    mask="999.999.999-99"
                    placeholder="000.000.000-00" />
                </div>

                <p-button
                  type="submit"
                  label="Aceitar Convite"
                  icon="pi pi-check"
                  [loading]="loading()"
                  [disabled]="acceptForm.invalid || loading()"
                  styleClass="w-full"
                  severity="success" />
              </form>
            }

            <!-- Button for authenticated users -->
            @if (isAuthenticated() && !isExpired()) {
              <div class="text-center">
                <p class="text-gray-600 mb-4">
                  Você já possui uma conta. Deseja aceitar este convite?
                </p>
                <p-button
                  label="Aceitar Convite"
                  icon="pi pi-check"
                  (onClick)="acceptInviteAsExistingUser()"
                  [loading]="loading()"
                  [disabled]="loading()"
                  styleClass="w-full"
                  severity="success" />
              </div>
            }

            <!-- Expired invite -->
            @if (isExpired()) {
              <div class="text-center mt-4">
                <p-button
                  label="Ir para Login"
                  icon="pi pi-sign-in"
                  (onClick)="goToLogin()"
                  severity="secondary" />
              </div>
            }
          </p-card>
        }
      </div>
    </div>
  `
})
export class AcceptInviteComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly inviteService = inject(InviteService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly invite = signal<Invite | null>(null);
  readonly loadingInvite = signal(true);
  readonly inviteError = signal<string | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly acceptForm: FormGroup;
  readonly token = signal<string>('');

  constructor() {
    this.acceptForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      phone: [''],
      cpf: ['']
    });
  }

  ngOnInit(): void {
    // Get token from route params
    const token = this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.inviteError.set('Token de convite não encontrado');
      this.loadingInvite.set(false);
      return;
    }

    this.token.set(token);
    this.loadInvite(token);
  }

  loadInvite(token: string): void {
    this.inviteService.getInviteByToken(token).subscribe({
      next: (invite) => {
        this.invite.set(invite);
        this.loadingInvite.set(false);

        // Pre-fill email if user is not authenticated
        if (!this.isAuthenticated() && invite.email) {
          // Email is readonly in the invite, so we don't add it to the form
        }
      },
      error: (error) => {
        this.loadingInvite.set(false);
        this.inviteError.set(
          error.error?.message || 'Convite não encontrado ou inválido'
        );
      }
    });
  }

  onSubmit(): void {
    if (this.acceptForm.invalid) {
      this.acceptForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const data: AcceptInviteDto = {
      name: this.acceptForm.value.name,
      password: this.acceptForm.value.password,
      phone: this.acceptForm.value.phone || undefined,
      cpf: this.acceptForm.value.cpf || undefined
    };

    this.inviteService.acceptInvite(this.token(), data).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Convite aceito com sucesso! Redirecionando para login...');

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Erro ao aceitar convite. Tente novamente.'
        );
      }
    });
  }

  acceptInviteAsExistingUser(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    // Empty data for existing user
    const data: AcceptInviteDto = {};

    this.inviteService.acceptInvite(this.token(), data).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Convite aceito! Você agora tem acesso ao condomínio.');

        setTimeout(() => {
          this.router.navigate(['/my-tenants']);
        }, 2000);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.error?.message || 'Erro ao aceitar convite. Tente novamente.'
        );
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.acceptForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  isExpired(): boolean {
    const invite = this.invite();
    if (!invite) return false;

    return invite.status === 'expired' || new Date(invite.expires_at) < new Date();
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      'admin': 'Administrador',
      'sindico': 'Síndico',
      'morador': 'Morador'
    };
    return labels[role] || role;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
