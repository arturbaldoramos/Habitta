import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { UserService } from '../../../core/services';
import { UserListItem, UserRole } from '../../../core/models';

@Component({
  selector: 'app-user-list',
  imports: [
    CommonModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    TagModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.css'
})
export class UserListComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  readonly users = signal<UserListItem[]>([]);
  readonly loading = signal(false);
  readonly totalRecords = signal(0);
  readonly searchTerm = signal('');

  currentPage = 1;
  rowsPerPage = 10;

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading.set(true);

    this.userService.getUsers(this.currentPage, this.rowsPerPage, this.searchTerm()).subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.totalRecords.set(response.total);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar usuários'
        });
        this.loading.set(false);
      }
    });
  }

  onPageChange(event: any): void {
    this.currentPage = event.page + 1;
    this.rowsPerPage = event.rows;
    this.loadUsers();
  }

  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
    this.currentPage = 1;
    this.loadUsers();
  }

  navigateToUser(user: UserListItem): void {
    this.router.navigate(['/users', user.id]);
  }

  getRoleSeverity(role: string): 'success' | 'info' | 'warn' {
    switch (role) {
      case UserRole.ADMIN:
        return 'warn';
      case UserRole.SINDICO:
        return 'info';
      case UserRole.MORADOR:
        return 'success';
      default:
        return 'info';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrador';
      case UserRole.SINDICO:
        return 'Síndico';
      case UserRole.MORADOR:
        return 'Morador';
      default:
        return role;
    }
  }

  getStatusSeverity(isActive: boolean): 'success' | 'danger' {
    return isActive ? 'success' : 'danger';
  }

  getStatusLabel(isActive: boolean): string {
    return isActive ? 'Ativo' : 'Inativo';
  }
}
