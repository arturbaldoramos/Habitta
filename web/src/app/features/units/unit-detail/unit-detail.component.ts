import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UnitService } from '../../../core/services';
import { UnitDetail, UpdateUnitDto } from '../../../core/models';

@Component({
  selector: 'app-unit-detail',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    TagModule,
    InputTextModule,
    InputNumberModule,
    CheckboxModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './unit-detail.component.html',
  styleUrl: './unit-detail.component.css'
})
export class UnitDetailComponent implements OnInit {
  private readonly unitService = inject(UnitService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly unit = signal<UnitDetail | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editing = signal(false);

  editForm!: FormGroup;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      this.router.navigate(['/units']);
      return;
    }

    this.editForm = this.fb.group({
      number: ['', [Validators.required]],
      block: [''],
      floor: [null as number | null],
      area: [null as number | null],
      owner_name: [''],
      owner_email: ['', [Validators.email]],
      owner_phone: [''],
      occupied: [false],
      active: [true]
    });

    this.loadUnit(id);
  }

  private loadUnit(id: number): void {
    this.loading.set(true);
    this.unitService.getUnitById(id).subscribe({
      next: (unit) => {
        this.unit.set(unit);
        this.patchForm(unit);
        this.loading.set(false);
      },
      error: () => {
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

  private patchForm(unit: UnitDetail): void {
    this.editForm.patchValue({
      number: unit.number,
      block: unit.block || '',
      floor: unit.floor ?? null,
      area: unit.area ?? null,
      owner_name: unit.owner_name || '',
      owner_email: unit.owner_email || '',
      owner_phone: unit.owner_phone || '',
      occupied: unit.occupied,
      active: unit.active
    });
  }

  startEdit(): void {
    const unit = this.unit();
    if (unit) {
      this.patchForm(unit);
    }
    this.editing.set(true);
  }

  cancelEdit(): void {
    const unit = this.unit();
    if (unit) {
      this.patchForm(unit);
    }
    this.editing.set(false);
  }

  saveEdit(): void {
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const unit = this.unit();
    if (!unit) return;

    this.saving.set(true);
    const formValue = this.editForm.value;
    const data: UpdateUnitDto = {
      number: formValue.number,
      block: formValue.block || undefined,
      floor: formValue.floor ?? undefined,
      area: formValue.area ?? undefined,
      owner_name: formValue.owner_name || undefined,
      owner_email: formValue.owner_email || undefined,
      owner_phone: formValue.owner_phone || undefined,
      occupied: formValue.occupied,
      active: formValue.active
    };

    this.unitService.updateUnit(unit.id, data).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Unidade atualizada com sucesso'
        });
        this.saving.set(false);
        this.editing.set(false);
        this.loadUnit(unit.id);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || 'Erro ao atualizar unidade'
        });
        this.saving.set(false);
      }
    });
  }

  confirmDelete(): void {
    const unit = this.unit();
    if (!unit) return;

    this.confirmationService.confirm({
      message: `Tem certeza que deseja excluir a unidade ${unit.number}?`,
      header: 'Confirmar Exclusão',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sim',
      rejectLabel: 'Não',
      accept: () => {
        this.unitService.deleteUnit(unit.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Unidade excluída com sucesso'
            });
            setTimeout(() => this.router.navigate(['/units']), 1000);
          },
          error: () => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: 'Erro ao excluir unidade'
            });
          }
        });
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/units']);
  }

  getOccupiedSeverity(occupied: boolean): 'success' | 'warn' {
    return occupied ? 'success' : 'warn';
  }

  getOccupiedLabel(occupied: boolean): string {
    return occupied ? 'Ocupada' : 'Vaga';
  }

  getStatusSeverity(active: boolean): 'success' | 'danger' {
    return active ? 'success' : 'danger';
  }

  getStatusLabel(active: boolean): string {
    return active ? 'Ativa' : 'Inativa';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.editForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
