import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { InputMask } from 'primeng/inputmask';
import { AuthService } from '../../../core/services';
import { RegisterRequest } from '../../../core/models';

@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    CardModule,
    MessageModule,
    InputMask
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly registerForm: FormGroup;
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  constructor() {
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      phone: [''],
      cpf: ['']
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formValue = this.registerForm.value;
    const registerData: RegisterRequest = {
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      phone: formValue.phone || undefined,
      cpf: formValue.cpf || undefined
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.loading.set(false);
        this.successMessage.set('Conta criada com sucesso! Redirecionando...');

        // After registration, user needs to login or create/join a tenant
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.loading.set(false);

        if (error.status === 409) {
          this.errorMessage.set('Email já cadastrado');
        } else if (error.status === 0) {
          this.errorMessage.set('Erro de conexão. Verifique sua internet.');
        } else {
          this.errorMessage.set(
            error.error?.message || 'Erro ao criar conta. Tente novamente.'
          );
        }
      }
    });
  }

  getControl(name: string) {
    return this.registerForm.get(name);
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.getControl(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  get passwordMismatch(): boolean {
    const form = this.registerForm;
    return !!(
      form.errors?.['passwordMismatch'] &&
      form.get('confirmPassword')?.touched
    );
  }
}
