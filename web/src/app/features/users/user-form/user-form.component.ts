import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { Select } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { UserService, UnitService } from '../../../core/services';
import { UserListItem, Unit } from '../../../core/models';

@Component({
  selector: 'app-user-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    CheckboxModule,
    ButtonModule,
    MessageModule,
    ToastModule,
    Select
  ],
  providers: [MessageService],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.css'
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userService = inject(UserService);
  private readonly unitService = inject(UnitService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);

  readonly membershipForm: FormGroup;
  readonly loading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly user = signal<UserListItem | null>(null);
  readonly units = signal<Unit[]>([]);

  userId: number | null = null;

  constructor() {
    this.membershipForm = this.fb.group({
      is_active: [true],
      unit_id: [null]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.userId = parseInt(id, 10);
      this.loadUser(this.userId);
      this.loadUnits();
    } else {
      this.router.navigate(['/users']);
    }
  }

  loadUser(id: number): void {
    this.loading.set(true);

    this.userService.getUserById(id).subscribe({
      next: (userData) => {
        this.user.set(userData);
        this.membershipForm.patchValue({
          is_active: userData.is_active,
          unit_id: userData.unit_id
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

  loadUnits(): void {
    this.unitService.getUnits(1, 1000).subscribe({
      next: (response) => {
        this.units.set(response.data);
      },
      error: (error) => {
        console.error('Error loading units:', error);
      }
    });
  }

  onSubmit(): void {
    if (!this.userId) return;

    this.loading.set(true);
    this.errorMessage.set(null);

    const formValue = this.membershipForm.value;

    this.userService.updateMembership(this.userId, {
      is_active: formValue.is_active,
      unit_id: formValue.unit_id || null
    }).subscribe({
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
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }
}
