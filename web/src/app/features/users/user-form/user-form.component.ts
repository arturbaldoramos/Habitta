import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { Select } from 'primeng/select';
import { InputMask } from 'primeng/inputmask';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../core/services';
import { CreateUserDto, UpdateUserDto, UserRole } from '../../../core/models';

interface RoleOption {
  label: string;
  value: UserRole;
}

@Component({
  selector: 'app-user-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    Select,
    InputMask,
    CheckboxModule,
    ButtonModule,
    MessageModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css'
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);

  readonly userForm: FormGroup;
  readonly loading = signal(false);
  readonly isEditMode = signal(false);
  readonly errorMessage = signal<string | null>(null);

  userId: number | null = null;

  readonly roleOptions: RoleOption[] = [
    { label: 'Administrador', value: UserRole.ADMIN },
    { label: 'Síndico', value: UserRole.SINDICO },
    { label: 'Morador', value: UserRole.MORADOR }
  ];

  constructor() {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.minLength(6)]],
      role: [UserRole.MORADOR, [Validators.required]],
      phone: [''],
      cpf: [''],
      unit_id: [null],
      active: [true]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId = parseInt(id, 10);
      this.isEditMode.set(true);
      this.loadUser(this.userId);

      // Password is not required in edit mode
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
    } else {
      // Password is required in create mode
      this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
      this.userForm.get('password')?.updateValueAndValidity();
    }
  }

  loadUser(id: number): void {
    this.loading.set(true);

    this.userService.getUserById(id).subscribe({
      next: (user) => {
        this.userForm.patchValue({
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone || '',
          cpf: user.cpf || '',
          unit_id: user.unit_id || null,
          active: user.active
        });
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading user:', error);
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

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const formValue = this.userForm.value;

    if (this.isEditMode() && this.userId) {
      const updateData: UpdateUserDto = {
        name: formValue.name,
        email: formValue.email,
        role: formValue.role,
        phone: formValue.phone || undefined,
        cpf: formValue.cpf || undefined,
        unit_id: formValue.unit_id || undefined,
        active: formValue.active
      };

      this.userService.updateUser(this.userId, updateData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Usuário atualizado com sucesso'
          });
          setTimeout(() => this.router.navigate(['/users']), 1000);
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(error.error?.message || 'Erro ao atualizar usuário');
        }
      });
    } else {
      const createData: CreateUserDto = {
        name: formValue.name,
        email: formValue.email,
        password: formValue.password,
        role: formValue.role,
        phone: formValue.phone || undefined,
        cpf: formValue.cpf || undefined,
        unit_id: formValue.unit_id || undefined
      };

      this.userService.createUser(createData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Usuário criado com sucesso'
          });
          setTimeout(() => this.router.navigate(['/users']), 1000);
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(error.error?.message || 'Erro ao criar usuário');
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }

  getControl(name: string) {
    return this.userForm.get(name);
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.getControl(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
