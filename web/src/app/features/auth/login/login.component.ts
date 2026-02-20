import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { AuthService } from '../../../core/services';
import { LoginRequest, TenantSelectionInfo } from '../../../core/models';
import { TenantSelectorComponent } from '../../../shared/components/tenant-selector/tenant-selector.component';

@Component({
  selector: 'app-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CardModule,
    MessageModule,
    TenantSelectorComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loginForm: FormGroup;
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showTenantSelector = signal(false);
  readonly tenants = signal<TenantSelectionInfo[]>([]);

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const credentials: LoginRequest = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: (data) => {
        if (data.token) {
          // User has single tenant or no tenant - redirect
          this.handleSuccessfulLogin();
        } else if (data.tenants && data.tenants.length > 0) {
          // User has multiple tenants - show selector
          this.loading.set(false);
          this.tenants.set(data.tenants);
          this.showTenantSelector.set(true);
        } else {
          // Shouldn't happen, but handle gracefully
          this.loading.set(false);
          this.errorMessage.set('Erro inesperado. Tente novamente.');
        }
      },
      error: (error) => {
        this.loading.set(false);

        if (error.status === 401) {
          this.errorMessage.set('Email ou senha inválidos');
        } else if (error.status === 0) {
          this.errorMessage.set('Erro de conexão. Verifique sua internet.');
        } else {
          this.errorMessage.set(
            error.error?.message || 'Erro ao fazer login. Tente novamente.'
          );
        }
      }
    });
  }

  onTenantSelected(tenantId: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    const credentials: LoginRequest = this.loginForm.value;

    this.authService.loginWithTenant(credentials, tenantId).subscribe({
      next: () => {
        this.handleSuccessfulLogin();
      },
      error: (error) => {
        this.loading.set(false);
        this.showTenantSelector.set(false);
        this.errorMessage.set(
          error.error?.message || 'Erro ao selecionar condomínio. Tente novamente.'
        );
      }
    });
  }

  private handleSuccessfulLogin(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    this.router.navigate([returnUrl]);
  }

  get emailControl() {
    return this.loginForm.get('email');
  }

  get passwordControl() {
    return this.loginForm.get('password');
  }

  get isEmailInvalid(): boolean {
    const control = this.emailControl;
    return !!(control && control.invalid && control.touched);
  }

  get isPasswordInvalid(): boolean {
    const control = this.passwordControl;
    return !!(control && control.invalid && control.touched);
  }
}
