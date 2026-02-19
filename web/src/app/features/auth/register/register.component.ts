import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { Select } from 'primeng/select';
import { InputMask } from 'primeng/inputmask';
import { AuthService } from '../../../core/services';
import { RegisterRequest, UserRole } from '../../../core/models';

interface RoleOption {
  label: string;
  value: UserRole;
}

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
    Select,
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

  readonly roleOptions: RoleOption[] = [
    { label: 'Administrador', value: UserRole.ADMIN },
    { label: 'Síndico', value: UserRole.SINDICO },
    { label: 'Morador', value: UserRole.MORADOR }
  ];

  constructor() {
    this.registerForm = this.fb.group({
      tenant_id: [1, [Validators.required, Validators.min(1)]],
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: [UserRole.MORADOR, [Validators.required]],
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

    const formValue = this.registerForm.value;
    const registerData: RegisterRequest = {
      tenant_id: formValue.tenant_id,
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      role: formValue.role,
      phone: formValue.phone || undefined,
      cpf: formValue.cpf || undefined
    };

    this.authService.register(registerData).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
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
