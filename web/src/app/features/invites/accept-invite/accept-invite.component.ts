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
  templateUrl: './accept-invite.component.html'
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
