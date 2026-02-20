import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { AuthService } from '../../core/services';
import { UserRole } from '../../core/models';

interface DashboardCard {
  title: string;
  value: number;
  icon: string;
  color: string;
  bgColor: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    SkeletonModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly userRole = this.authService.activeRole;
  readonly loading = signal(true);

  readonly cards = signal<DashboardCard[]>([]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    setTimeout(() => {
      const role = this.userRole();

      if (role === UserRole.ADMIN || role === UserRole.SINDICO) {
        this.cards.set([
          {
            title: 'Total de Usuários',
            value: 48,
            icon: 'pi pi-users',
            color: '#3b82f6',
            bgColor: '#dbeafe'
          },
          {
            title: 'Unidades',
            value: 32,
            icon: 'pi pi-building',
            color: '#8b5cf6',
            bgColor: '#ede9fe'
          },
          {
            title: 'Unidades Ocupadas',
            value: 28,
            icon: 'pi pi-check-circle',
            color: '#10b981',
            bgColor: '#d1fae5'
          },
          {
            title: 'Unidades Vagas',
            value: 4,
            icon: 'pi pi-circle',
            color: '#f59e0b',
            bgColor: '#fef3c7'
          }
        ]);
      } else {
        this.cards.set([
          {
            title: 'Minha Unidade',
            value: 101,
            icon: 'pi pi-home',
            color: '#3b82f6',
            bgColor: '#dbeafe'
          },
          {
            title: 'Notificações',
            value: 3,
            icon: 'pi pi-bell',
            color: '#f59e0b',
            bgColor: '#fef3c7'
          }
        ]);
      }

      this.loading.set(false);
    }, 1000);
  }

  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  isAdminOrSindico(): boolean {
    const role = this.userRole();
    return role === UserRole.ADMIN || role === UserRole.SINDICO;
  }
}
