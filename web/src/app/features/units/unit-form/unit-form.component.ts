import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UnitService } from '../../../core/services';
import { CreateUnitDto, UpdateUnitDto } from '../../../core/models';

@Component({
  selector: 'app-unit-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    ButtonModule,
    MessageModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './unit-form.component.html',
  styleUrl: './unit-form.component.css'
})
export class UnitFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly unitService = inject(UnitService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messageService = inject(MessageService);

  readonly unitForm: FormGroup;
  readonly loading = signal(false);
  readonly isEditMode = signal(false);
  readonly errorMessage = signal<string | null>(null);

  unitId: number | null = null;

  constructor() {
    this.unitForm = this.fb.group({
      number: ['', [Validators.required]],
      block: [''],
      floor: [null],
      area: [null],
      owner_name: [''],
      owner_email: ['', [Validators.email]],
      owner_phone: [''],
      occupied: [false],
      active: [true]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.unitId = parseInt(id, 10);
      this.isEditMode.set(true);
      this.loadUnit(this.unitId);
    }
  }

  loadUnit(id: number): void {
    this.loading.set(true);

    this.unitService.getUnitById(id).subscribe({
      next: (unit) => {
        this.unitForm.patchValue({
          number: unit.number,
          block: unit.block || '',
          floor: unit.floor || null,
          area: unit.area || null,
          owner_name: unit.owner_name || '',
          owner_email: unit.owner_email || '',
          owner_phone: unit.owner_phone || '',
          occupied: unit.occupied,
          active: unit.active
        });
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading unit:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar unidade'
        });
        this.loading.set(false);
        this.router.navigate(['/units']);
      }
    });
  }

  onSubmit(): void {
    if (this.unitForm.invalid) {
      this.unitForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set(null);

    const formValue = this.unitForm.value;

    if (this.isEditMode() && this.unitId) {
      const updateData: UpdateUnitDto = {
        number: formValue.number,
        block: formValue.block || undefined,
        floor: formValue.floor || undefined,
        area: formValue.area || undefined,
        owner_name: formValue.owner_name || undefined,
        owner_email: formValue.owner_email || undefined,
        owner_phone: formValue.owner_phone || undefined,
        occupied: formValue.occupied,
        active: formValue.active
      };

      this.unitService.updateUnit(this.unitId, updateData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Unidade atualizada com sucesso'
          });
          setTimeout(() => this.router.navigate(['/units']), 1000);
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(error.error?.message || 'Erro ao atualizar unidade');
        }
      });
    } else {
      const createData: CreateUnitDto = {
        number: formValue.number,
        block: formValue.block || undefined,
        floor: formValue.floor || undefined,
        area: formValue.area || undefined,
        owner_name: formValue.owner_name || undefined,
        owner_email: formValue.owner_email || undefined,
        owner_phone: formValue.owner_phone || undefined,
        occupied: formValue.occupied
      };

      this.unitService.createUnit(createData).subscribe({
        next: () => {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Unidade criada com sucesso'
          });
          setTimeout(() => this.router.navigate(['/units']), 1000);
        },
        error: (error) => {
          this.loading.set(false);
          this.errorMessage.set(error.error?.message || 'Erro ao criar unidade');
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/units']);
  }

  getControl(name: string) {
    return this.unitForm.get(name);
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.getControl(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
