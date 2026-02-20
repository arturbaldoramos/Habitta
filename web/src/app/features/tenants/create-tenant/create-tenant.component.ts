import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { InputMask } from 'primeng/inputmask';
import { TenantService, AuthService } from '../../../core/services';
import { CreateTenantDto } from '../../../core/models';

@Component({
  selector: 'app-create-tenant',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CardModule,
    MessageModule,
    InputMask
  ],
  templateUrl: './create-tenant.component.html'
})
export class CreateTenantComponent {
  private readonly fb = inject(FormBuilder);
  private readonly tenantService = inject(TenantService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly createForm: FormGroup;
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    this.createForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      cnpj: ['', [Validators.required]],
      email: ['', [Validators.email]],
      phone: ['']
    });
  }

  onSubmit(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const data: CreateTenantDto = {
      name: this.createForm.value.name,
      cnpj: this.createForm.value.cnpj,
      email: this.createForm.value.email || undefined,
      phone: this.createForm.value.phone || undefined
    };

    this.tenantService.createTenant(data).subscribe({
      next: (tenant) => {
        // After creating tenant, switch to it
        this.authService.switchTenant(tenant.id).subscribe({
          next: () => {
            this.router.navigate(['/dashboard']);
          },
          error: (error) => {
            this.loading.set(false);
            this.errorMessage.set('Condomínio criado, mas erro ao ativar. Faça login novamente.');
          }
        });
      },
      error: (error) => {
        this.loading.set(false);

        if (error.status === 409) {
          this.errorMessage.set('CNPJ já cadastrado');
        } else {
          this.errorMessage.set(
            error.error?.message || 'Erro ao criar condomínio. Tente novamente.'
          );
        }
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.createForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
