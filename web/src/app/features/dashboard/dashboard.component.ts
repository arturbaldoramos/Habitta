import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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

interface ActivityItem {
  icon: string;
  iconColor: string;
  iconBg: string;
  description: string;
  time: string;
}

@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    CardModule,
    ButtonModule,
    SkeletonModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);

  readonly currentUser = this.authService.currentUser;
  readonly userRole = this.authService.activeRole;
  readonly loading = signal(true);

  readonly cards = signal<DashboardCard[]>([]);
  readonly activities = signal<ActivityItem[]>([]);

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
          },
          {
            title: 'Convites Pendentes',
            value: 6,
            icon: 'pi pi-envelope',
            color: '#8b5cf6',
            bgColor: '#ede9fe'
          }
        ]);

        this.activities.set([
          {
            icon: 'pi pi-user-plus',
            iconColor: '#3b82f6',
            iconBg: '#dbeafe',
            description: 'Novo morador João Silva adicionado à unidade 204',
            time: 'Há 2 horas'
          },
          {
            icon: 'pi pi-wrench',
            iconColor: '#10b981',
            iconBg: '#d1fae5',
            description: 'Manutenção do elevador concluída com sucesso',
            time: 'Há 5 horas'
          },
          {
            icon: 'pi pi-megaphone',
            iconColor: '#f59e0b',
            iconBg: '#fef3c7',
            description: 'Novo anúncio publicado: Reunião de condomínio',
            time: 'Há 1 dia'
          },
          {
            icon: 'pi pi-envelope',
            iconColor: '#8b5cf6',
            iconBg: '#ede9fe',
            description: 'Convite enviado para maria@email.com',
            time: 'Há 2 dias'
          },
          {
            icon: 'pi pi-building',
            iconColor: '#ec4899',
            iconBg: '#fce7f3',
            description: 'Unidade 305 marcada como disponível',
            time: 'Há 3 dias'
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

        this.activities.set([
          {
            icon: 'pi pi-megaphone',
            iconColor: '#f59e0b',
            iconBg: '#fef3c7',
            description: 'Novo anúncio: Reunião de condomínio dia 25/02',
            time: 'Há 1 dia'
          },
          {
            icon: 'pi pi-wrench',
            iconColor: '#10b981',
            iconBg: '#d1fae5',
            description: 'Manutenção programada do elevador para amanhã',
            time: 'Há 2 dias'
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
