import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { ConfirmationService, MessageService } from 'primeng/api';
import { UnitService } from '../../../core/services';
import { Unit } from '../../../core/models';

@Component({
  selector: 'app-unit-list',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ConfirmDialogModule,
    ToastModule
  ],
  providers: [ConfirmationService, MessageService],
  templateUrl: './unit-list.component.html',
  styleUrl: './unit-list.component.css'
})
export class UnitListComponent implements OnInit {
  private readonly unitService = inject(UnitService);
  private readonly router = inject(Router);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly messageService = inject(MessageService);

  readonly units = signal<Unit[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly searchTerm = signal('');

  currentPage = 1;
  rowsPerPage = 10;

  ngOnInit(): void {
    this.loadUnits();
  }

  loadUnits(): void {
    this.loading.set(true);

    this.unitService.getUnits(this.currentPage, this.rowsPerPage, this.searchTerm()).subscribe({
      next: (response) => {
        this.units.set(response.data);
        this.totalRecords.set(response.total);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading units:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar unidades'
        });
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: any): void {
    this.currentPage = event.page + 1;
    this.rowsPerPage = event.rows;
    this.loadUnits();
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.currentPage = 1;
    this.loadUnits();
  }

  createUnit(): void {
    this.router.navigate(['/units/new']);
  }

  editUnit(unit: Unit): void {
    this.router.navigate(['/units/edit', unit.id]);
  }

  deleteUnit(unit: Unit): void {
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
            this.loadUnits();
          },
          error: (error) => {
            console.error('Error deleting unit:', error);
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

  formatArea(area: number | undefined): string {
    return area ? `${area}m²` : '-';
  }
}
