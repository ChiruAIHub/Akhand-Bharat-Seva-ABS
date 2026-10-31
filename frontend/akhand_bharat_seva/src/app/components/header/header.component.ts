import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';
import { ComplaintService } from '../../services/complaint.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <!-- Top Tricolor Accent Line -->
    <div class="tricolor-stripe"></div>

    <!-- Official Government & Language Top Bar -->
    <div class="gov-topbar">
      <div class="container topbar-content">
        <!-- Gov Emblem & Department Title -->
        <div class="topbar-left">
          <span class="nat-emblem-icon">🏛️</span>
          <div class="nat-titles">
            <span class="gov-text-hi">भारत सरकार / Government of India</span>
            <span class="gov-text-sub">आवासन और शहरी कार्य मंत्रालय &bull; Ministry of Housing and Urban Affairs</span>
          </div>
        </div>

        <!-- Language Select Bar (Neat & Clean Spacing) -->
        <div class="topbar-right">
          <!-- Accessible Compact 22+1 Indian Language Selector -->
          <div class="language-input-wrapper">
            <label for="langSelector" class="lang-label">
              <i class="bi bi-translate"></i>
              <span class="lang-label-text">Language / भाषा:</span>
            </label>
            <select
              id="langSelector"
              class="gov-lang-select"
              [ngModel]="langService.lang()"
              (ngModelChange)="onLanguageChange($event)"
              aria-label="Select Official Indian Language"
            >
              <option *ngFor="let lang of langService.languages" [value]="lang.code">
                {{ lang.nativeName }} ({{ lang.name }})
              </option>
            </select>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Navigation Bar -->
    <header class="main-header">
      <div class="container header-container">
        <!-- Logo & Simplified Akhand Bharat Seva Branding -->
        <a routerLink="/" class="brand-link" (click)="isMobileMenuOpen = false">
          <div class="brand-emblem-badge">
            <div class="chakra-circle">
              <span class="emblem-glyph">☸</span>
            </div>
          </div>
          <div class="brand-text-col">
            <h1 class="brand-title">Akhand Bharat Seva</h1>
            <p class="brand-tagline">{{ langService.t('app.tagline') }}</p>
          </div>
        </a>

        <!-- Desktop Navigation Links -->
        <nav class="desktop-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <i class="bi bi-house-door"></i> {{ langService.t('nav.home') }}
          </a>
          <a routerLink="/report" routerLinkActive="active" class="nav-item highlight-report">
            <i class="bi bi-plus-circle-fill"></i> {{ langService.t('nav.report') }}
          </a>
          <a routerLink="/track" routerLinkActive="active" class="nav-item">
            <i class="bi bi-crosshair2"></i> {{ langService.t('nav.track') }}
          </a>
          <a routerLink="/public-issues" routerLinkActive="active" class="nav-item">
            <i class="bi bi-globe2"></i> {{ langService.t('nav.public') }}
          </a>
          <a routerLink="/help" routerLinkActive="active" class="nav-item">
            <i class="bi bi-question-circle"></i> {{ langService.t('nav.faq') }}
          </a>
          <a routerLink="/admin" routerLinkActive="active" class="nav-item admin-portal-btn">
            <i class="bi bi-shield-lock-fill"></i> {{ langService.t('nav.admin') }}
            <span class="admin-dot" *ngIf="hasEmergency()"></span>
          </a>
        </nav>

        <!-- Mobile Menu Toggle Button -->
        <button
          class="mobile-menu-toggle"
          (click)="isMobileMenuOpen = !isMobileMenuOpen"
          aria-label="Toggle Navigation Menu"
        >
          <i class="bi" [ngClass]="isMobileMenuOpen ? 'bi-x-lg' : 'bi-list'"></i>
        </button>
      </div>

      <!-- Mobile Navigation Drawer -->
      <div class="mobile-drawer" *ngIf="isMobileMenuOpen">
        <!-- Mobile Indian Language Selector -->
        <div class="mobile-lang-box">
          <label for="mobileLangSelector" class="mobile-lang-title">
            <i class="bi bi-translate"></i> Choose Language / भाषा चुनें:
          </label>
          <select
            id="mobileLangSelector"
            class="gov-lang-select-mobile"
            [ngModel]="langService.lang()"
            (ngModelChange)="onLanguageChange($event); isMobileMenuOpen = false"
          >
            <option *ngFor="let lang of langService.languages" [value]="lang.code">
              {{ lang.nativeName }} ({{ lang.name }})
            </option>
          </select>
        </div>

        <div class="mobile-drawer-links">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" (click)="isMobileMenuOpen = false" class="mobile-nav-item">
            <i class="bi bi-house-door"></i> {{ langService.t('nav.home') }}
          </a>
          <a routerLink="/report" routerLinkActive="active" (click)="isMobileMenuOpen = false" class="mobile-nav-item highlight">
            <i class="bi bi-plus-circle-fill"></i> {{ langService.t('nav.report') }}
          </a>
          <a routerLink="/track" routerLinkActive="active" (click)="isMobileMenuOpen = false" class="mobile-nav-item">
            <i class="bi bi-crosshair2"></i> {{ langService.t('nav.track') }}
          </a>
          <a routerLink="/public-issues" routerLinkActive="active" (click)="isMobileMenuOpen = false" class="mobile-nav-item">
            <i class="bi bi-globe2"></i> {{ langService.t('nav.public') }}
          </a>
          <a routerLink="/help" routerLinkActive="active" (click)="isMobileMenuOpen = false" class="mobile-nav-item">
            <i class="bi bi-question-circle"></i> {{ langService.t('nav.faq') }}
          </a>
          <a routerLink="/admin" routerLinkActive="active" (click)="isMobileMenuOpen = false" class="mobile-nav-item admin-item">
            <i class="bi bi-shield-lock-fill"></i> {{ langService.t('nav.admin') }}
            <span *ngIf="hasEmergency()" class="badge badge-p0">P0 Active</span>
          </a>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .gov-topbar {
      background-color: #071324;
      color: #cbd5e1;
      font-size: 0.75rem;
      padding: 0.35rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    }
    .topbar-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .topbar-left {
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }
    .nat-emblem-icon {
      font-size: 1.25rem;
    }
    .nat-titles {
      display: flex;
      flex-direction: column;
      line-height: 1.2;
    }
    .gov-text-hi {
      font-weight: 700;
      color: #ffffff;
      font-size: 0.75rem;
      letter-spacing: 0.01em;
    }
    .gov-text-sub {
      color: #94a3b8;
      font-size: 0.65rem;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    /* COMPACT ACCESSIBLE LANGUAGE SELECTOR */
    .language-input-wrapper {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 2px 7px;
      border-radius: var(--radius-sm);
    }
    .lang-label {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      color: #fed7aa;
      font-size: 0.725rem;
      font-weight: 600;
      cursor: pointer;
    }
    .lang-label i {
      color: var(--saffron-400);
      font-size: 0.8rem;
    }
    .gov-lang-select {
      background: #0d2346;
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 4px;
      padding: 2px 5px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      outline: none;
      max-width: 175px;
    }
    .gov-lang-select:focus {
      border-color: var(--saffron-400);
      box-shadow: 0 0 0 2px rgba(249, 115, 22, 0.3);
    }

    /* Main Navigation Header */
    .main-header {
      background-color: var(--navy-900);
      border-bottom: 1px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 2px 8px rgba(7, 19, 36, 0.2);
      position: sticky;
      top: 0;
      z-index: 1000;
    }
    .header-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 68px;
    }
    .brand-link {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
    }
    .brand-emblem-badge {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      background: linear-gradient(135deg, #003399 0%, #0a1b33 100%);
      border: 1.5px solid rgba(255, 255, 255, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
    }
    .chakra-circle {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .emblem-glyph {
      font-size: 1.5rem;
      color: #eab308;
      line-height: 1;
    }
    .brand-text-col {
      display: flex;
      flex-direction: column;
    }
    .brand-title {
      font-size: 1.25rem;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: -0.01em;
      margin: 0;
      line-height: 1.2;
    }
    .brand-tagline {
      font-size: 0.725rem;
      color: #94a3b8;
      margin: 0;
      letter-spacing: 0.01em;
    }

    .desktop-nav {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .nav-item {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.45rem 0.75rem;
      color: #cbd5e1;
      font-size: 0.825rem;
      font-weight: 500;
      border-radius: var(--radius-md);
      transition: all 0.15s ease;
      text-decoration: none;
    }
    .nav-item:hover {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.08);
    }
    .nav-item.active {
      color: #ffffff;
      background: rgba(255, 255, 255, 0.16);
      font-weight: 600;
    }
    .nav-item.highlight-report {
      background: var(--saffron-600);
      color: #ffffff;
      font-weight: 600;
    }
    .nav-item.highlight-report:hover {
      background: var(--saffron-700);
    }
    .nav-item.admin-portal-btn {
      border: 1px solid rgba(255, 255, 255, 0.25);
      background: rgba(255, 255, 255, 0.06);
      position: relative;
    }
    .nav-item.admin-portal-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }
    .admin-dot {
      width: 7px;
      height: 7px;
      background: #dc2626;
      border-radius: 50%;
      position: absolute;
      top: 5px;
      right: 5px;
      animation: pulse-ring 1.5s infinite;
    }

    .mobile-menu-toggle {
      display: none;
      background: none;
      border: none;
      color: #ffffff;
      font-size: 1.6rem;
      cursor: pointer;
      padding: 0.25rem;
    }

    .mobile-drawer {
      display: none;
      background: #071324;
      border-top: 1px solid rgba(255, 255, 255, 0.12);
      padding: 1rem;
    }
    .mobile-lang-box {
      background: rgba(255, 255, 255, 0.06);
      padding: 0.75rem;
      border-radius: var(--radius-md);
      margin-bottom: 0.75rem;
    }
    .mobile-lang-title {
      display: block;
      font-size: 0.75rem;
      color: var(--saffron-400);
      font-weight: 600;
      margin-bottom: 0.4rem;
    }
    .gov-lang-select-mobile {
      width: 100%;
      background: #0d2346;
      color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 4px;
      padding: 6px 8px;
      font-size: 0.825rem;
      font-weight: 600;
    }

    .mobile-drawer-links {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .mobile-nav-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.65rem 0.85rem;
      color: #cbd5e1;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: var(--radius-md);
      text-decoration: none;
    }
    .mobile-nav-item.active {
      background: rgba(255, 255, 255, 0.12);
      color: #ffffff;
    }
    .mobile-nav-item.highlight {
      background: var(--saffron-600);
      color: #ffffff;
      font-weight: 600;
    }
    .mobile-nav-item.admin-item {
      border: 1px solid rgba(255, 255, 255, 0.2);
      margin-top: 0.4rem;
    }

    @media (max-width: 1024px) {
      .desktop-nav { display: none; }
      .mobile-menu-toggle { display: block; }
      .mobile-drawer { display: block; }
      .lang-label-text { display: none; }
    }
    @media (max-width: 640px) {
      .nat-titles { display: none; }
    }
  `]
})
export class HeaderComponent {
  langService = inject(LanguageService);
  complaintService = inject(ComplaintService);

  isMobileMenuOpen = false;

  onLanguageChange(langCode: string): void {
    this.langService.setLanguage(langCode);
  }

  hasEmergency(): boolean {
    return this.complaintService.complaints().some(
      c => c.priority === 'P0' && c.status !== 'Resolved' && c.status !== 'Closed'
    );
  }
}
