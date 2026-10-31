import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ComplaintService } from '../../services/complaint.service';
import { LanguageService } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-shell">
      <!-- Admin Topbar -->
      <header class="admin-topbar">
        <div class="topbar-left">
          <button class="sidebar-toggle-btn" (click)="isSidebarOpen = !isSidebarOpen" aria-label="Toggle Sidebar">
            <i class="bi bi-list"></i>
          </button>
          <div class="admin-brand">
            <span class="admin-emblem">🏛️</span>
            <div>
              <span class="admin-title">Akhand Bharat Seva</span>
              <span class="admin-portal-tag">Municipal Command & Control</span>
            </div>
          </div>
        </div>

        <div class="topbar-right">
          <!-- Active Emergency Alert Pill -->
          <div class="emergency-pill" *ngIf="emergencyCount() > 0" routerLink="/admin/priority-queue">
            <span class="pulsing-dot"></span>
            <strong>{{ emergencyCount() }} Active P0 Emergencies</strong>
          </div>

          <a routerLink="/" class="btn btn-outline-white btn-sm">
            <i class="bi bi-box-arrow-up-right"></i> Citizen Portal
          </a>

          <div class="officer-profile">
            <div class="avatar-circle">{{ getInitials() }}</div>
            <div class="officer-info">
              <span class="officer-name">{{ currentOfficer()?.name || 'K. Rajeshwar Rao, IAS' }}</span>
              <span class="officer-role">{{ currentOfficer()?.role || 'Zonal Commissioner' }}</span>
            </div>
          </div>

          <button (click)="onLogout()" class="btn btn-signout btn-sm" title="Sign out of Municipal Portal">
            <i class="bi bi-box-arrow-right"></i> Sign Out
          </button>
        </div>
      </header>

      <div class="admin-body">
        <!-- Sidebar Navigation -->
        <aside class="admin-sidebar" [class.open]="isSidebarOpen">
          <div class="sidebar-section-title">CONTROL CENTER</div>
          <nav class="sidebar-nav">
            <a routerLink="/admin/overview" routerLinkActive="active" (click)="onNavClick()" class="sidebar-link">
              <i class="bi bi-speedometer2"></i> Overview
            </a>
            <a routerLink="/admin/priority-queue" routerLinkActive="active" (click)="onNavClick()" class="sidebar-link highlight-queue">
              <i class="bi bi-lightning-charge-fill text-warning"></i> Smart Priority Queue
              <span class="queue-badge">{{ pendingCount() }}</span>
            </a>
            <a routerLink="/admin/all-complaints" routerLinkActive="active" (click)="onNavClick()" class="sidebar-link">
              <i class="bi bi-folder2-open"></i> All Complaints
            </a>
            <a routerLink="/admin/map" routerLinkActive="active" (click)="onNavClick()" class="sidebar-link">
              <i class="bi bi-geo-alt-fill"></i> Map & Hotspots
            </a>
            <a routerLink="/admin/departments" routerLinkActive="active" (click)="onNavClick()" class="sidebar-link">
              <i class="bi bi-building"></i> Departments
            </a>
            <a routerLink="/admin/analytics" routerLinkActive="active" (click)="onNavClick()" class="sidebar-link">
              <i class="bi bi-bar-chart-line-fill"></i> Reports & Analytics
            </a>
            <a routerLink="/admin/settings" routerLinkActive="active" (click)="onNavClick()" class="sidebar-link">
              <i class="bi bi-gear-fill"></i> System & Seed Data
            </a>
          </nav>

          <div class="sidebar-footer">
            <div class="rules-engine-card">
              <div class="engine-indicator">
                <span class="status-live"></span>
                <span>Smart Engine Active</span>
              </div>
              <p class="engine-rules-info">
                Deterministic rules v2.6. P0 life-danger overrides age. Unresolved P2/P3 age weighted.
              </p>
            </div>
          </div>
        </aside>

        <!-- Main Workspace Router Outlet -->
        <main class="admin-main">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .admin-shell {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: #f1f5f9;
    }
    .admin-topbar {
      height: 64px;
      background: var(--navy-950);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 1.5rem;
      color: #ffffff;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .topbar-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .sidebar-toggle-btn {
      display: none;
      background: none;
      border: none;
      color: #ffffff;
      font-size: 1.5rem;
      cursor: pointer;
    }
    .admin-brand {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .admin-emblem { font-size: 1.4rem; }
    .admin-title {
      font-size: 1.05rem;
      font-weight: 700;
      color: #ffffff;
      display: block;
      line-height: 1.2;
    }
    .admin-portal-tag {
      font-size: 0.725rem;
      color: var(--saffron-400);
      font-weight: 600;
      display: block;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .emergency-pill {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(220, 38, 38, 0.2);
      border: 1px solid #ef4444;
      color: #fca5a5;
      padding: 0.35rem 0.85rem;
      border-radius: 999px;
      font-size: 0.75rem;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.15s;
    }
    .emergency-pill:hover {
      background: rgba(220, 38, 38, 0.3);
    }
    .pulsing-dot {
      width: 8px;
      height: 8px;
      background: #dc2626;
      border-radius: 50%;
      animation: pulse-ring 1.5s infinite;
    }
    .btn-outline-white {
      background: transparent;
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.25);
    }
    .btn-outline-white:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .officer-profile {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .avatar-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--navy-700);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.8125rem;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .officer-info {
      display: flex;
      flex-direction: column;
    }
    .officer-name {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #ffffff;
      line-height: 1.2;
    }
    .officer-role {
      font-size: 0.7rem;
      color: #94a3b8;
    }

    .admin-body {
      display: flex;
      flex: 1;
    }

    /* Sidebar */
    .admin-sidebar {
      width: 260px;
      background: var(--navy-900);
      color: #cbd5e1;
      display: flex;
      flex-direction: column;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      flex-shrink: 0;
    }
    .sidebar-section-title {
      font-size: 0.7rem;
      font-weight: 700;
      color: #64748b;
      padding: 1.25rem 1.25rem 0.5rem;
      letter-spacing: 0.06em;
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0 0.75rem;
      flex: 1;
    }
    .sidebar-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.7rem 1rem;
      color: #cbd5e1;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: var(--radius-md);
      text-decoration: none;
      transition: all 0.15s ease;
    }
    .sidebar-link:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
    }
    .sidebar-link.active {
      background: rgba(255, 255, 255, 0.15);
      color: #ffffff;
      font-weight: 600;
    }
    .sidebar-link.highlight-queue {
      background: rgba(234, 88, 12, 0.15);
      color: #fed7aa;
      border: 1px solid rgba(234, 88, 12, 0.3);
    }
    .queue-badge {
      margin-left: auto;
      background: var(--saffron-600);
      color: #ffffff;
      font-size: 0.7rem;
      padding: 1px 6px;
      border-radius: 999px;
      font-weight: 700;
    }

    .sidebar-footer {
      padding: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .rules-engine-card {
      background: rgba(0, 0, 0, 0.25);
      border-radius: var(--radius-md);
      padding: 0.75rem;
      font-size: 0.75rem;
    }
    .engine-indicator {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 600;
      color: #4ade80;
      margin-bottom: 0.25rem;
    }
    .status-live {
      width: 6px;
      height: 6px;
      background: #4ade80;
      border-radius: 50%;
    }
    .engine-rules-info {
      color: #94a3b8;
      font-size: 0.7rem;
      margin: 0;
      line-height: 1.4;
    }

    .admin-main {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
    }

    @media (max-width: 960px) {
      .sidebar-toggle-btn { display: block; }
      .admin-sidebar {
        position: fixed;
        top: 64px;
        left: -260px;
        bottom: 0;
        z-index: 999;
        transition: left 0.25s ease;
      }
      .admin-sidebar.open {
        left: 0;
        box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5);
      }
      .admin-main { padding: 1.25rem; }
      .officer-info { display: none; }
    }

    .btn-signout {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm, 6px);
      font-size: 0.775rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.2s;
    }
    .btn-signout:hover {
      background: #ef4444;
      color: #ffffff;
      border-color: #ef4444;
    }
  `]
})
export class AdminLayoutComponent {
  complaintService = inject(ComplaintService);
  langService = inject(LanguageService);
  private authService = inject(AuthService);

  currentOfficer = this.authService.officer;
  isSidebarOpen = false;

  getInitials(): string {
    const officer = this.currentOfficer();
    if (!officer || !officer.name) return 'KR';
    const parts = officer.name.split(' ').filter(p => p.length > 0 && !p.includes('.'));
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return officer.name.slice(0, 2).toUpperCase();
  }

  onLogout(): void {
    this.authService.logout();
  }

  emergencyCount(): number {
    return this.complaintService.complaints().filter(
      c => c.priority === 'P0' && c.status !== 'Resolved' && c.status !== 'Closed'
    ).length;
  }

  pendingCount(): number {
    return this.complaintService.complaints().filter(
      c => c.status !== 'Resolved' && c.status !== 'Closed'
    ).length;
  }

  onNavClick(): void {
    if (window.innerWidth <= 960) {
      this.isSidebarOpen = false;
    }
  }
}
