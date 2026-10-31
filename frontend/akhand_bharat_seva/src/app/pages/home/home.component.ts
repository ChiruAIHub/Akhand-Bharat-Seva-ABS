import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../services/language.service';
import { ComplaintService } from '../../services/complaint.service';
import { PriorityBadgeComponent } from '../../components/priority-badge/priority-badge.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { ComplaintCategory } from '../../models/complaint.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PriorityBadgeComponent, StatusBadgeComponent],
  template: `
    <div class="home-page">
      <!-- Emergency Warning Bar if P0 is active -->
      <div class="emergency-alert-strip" *ngIf="getActiveP0()">
        <div class="container emergency-flex">
          <div class="emergency-badge-pulse">
            <i class="bi bi-exclamation-octagon-fill"></i>
            <span>P0 ACTIVE CIVIC EMERGENCY IN HYDERABAD</span>
          </div>
          <div class="emergency-text">
            <strong>{{ getActiveP0()?.title }}</strong> — {{ getActiveP0()?.location?.area }} (Emergency Squad Dispatched)
          </div>
          <a [routerLink]="['/track']" [queryParams]="{id: getActiveP0()?.id}" class="btn btn-sm btn-danger">
            Track Emergency &rarr;
          </a>
        </div>
      </div>

      <!-- ========================================================== -->
      <!-- CLEAN, BALANCED HERO HEADER (Without Seva Paramodharma)     -->
      <!-- ========================================================== -->
      <section class="gov-hero-clean">
        <div class="container hero-container">
          <!-- Central Emblem Seal (Clean, without tagline) -->
          <div class="hero-emblem-wrap">
            <div class="central-emblem-seal">
              <div class="seal-inner-circle">
                <span class="seal-chakra">☸</span>
                <span class="seal-caption">भारत</span>
              </div>
            </div>
          </div>

          <!-- Clean, Balanced Bilingual Heading -->
          <div class="hero-titles-wrap">
            <h1 class="main-project-heading">Akhand Bharat Seva</h1>
            <p class="main-project-tagline">{{ langService.t('app.tagline') }}</p>
          </div>

          <!-- COMPACT INDIAN LANGUAGES SELECTOR STRIP -->
          <div class="home-lang-strip">
            <label for="homeLang" class="home-lang-label">
              <i class="bi bi-translate"></i>
              <span>Language / भाषा:</span>
            </label>
            <select
              id="homeLang"
              class="home-lang-select"
              [ngModel]="langService.lang()"
              (ngModelChange)="langService.setLanguage($event)"
              aria-label="Select Official Indian Language"
            >
              <option *ngFor="let l of langService.languages" [value]="l.code">
                {{ l.nativeName }} ({{ l.name }})
              </option>
            </select>
          </div>

          <!-- ========================================================== -->
          <!-- CLEAN, PLAIN MAIN ACTIONS LAYOUT (No Boxes / Cards)        -->
          <!-- ========================================================== -->
          <nav class="plain-actions-nav" aria-label="Main Actions">
            <!-- 1. House / Home Option -->
            <a routerLink="/" class="plain-action-link" title="Main Portal">
              <div class="plain-action-icon-circle">
                <i class="bi bi-house-door-fill"></i>
              </div>
              <div class="plain-action-content">
                <span class="plain-action-title">House</span>
                <span class="plain-action-sub">{{ langService.t('portal.main') }}</span>
              </div>
            </a>

            <span class="plain-action-divider" aria-hidden="true"></span>

            <!-- 2. Report a Problem Option -->
            <a routerLink="/report" class="plain-action-link plain-action-highlight" title="Report a Problem">
              <div class="plain-action-icon-circle action-icon-saffron">
                <i class="bi bi-camera-fill"></i>
              </div>
              <div class="plain-action-content">
                <span class="plain-action-title">Report a Problem</span>
                <span class="plain-action-sub">{{ langService.t('portal.reportSub') }}</span>
              </div>
            </a>

            <span class="plain-action-divider" aria-hidden="true"></span>

            <!-- 3. Track Complaint Option -->
            <a routerLink="/track" class="plain-action-link" title="Track Complaint">
              <div class="plain-action-icon-circle action-icon-blue">
                <i class="bi bi-crosshair2"></i>
              </div>
              <div class="plain-action-content">
                <span class="plain-action-title">{{ langService.t('nav.track') }}</span>
                <span class="plain-action-sub">{{ langService.t('portal.trackSub') }}</span>
              </div>
            </a>

            <span class="plain-action-divider" aria-hidden="true"></span>

            <!-- 4. Public Issues / Transparency Board -->
            <a routerLink="/public-issues" class="plain-action-link" title="Public Grievances">
              <div class="plain-action-icon-circle action-icon-teal">
                <i class="bi bi-globe2"></i>
              </div>
              <div class="plain-action-content">
                <span class="plain-action-title">{{ langService.t('nav.public') }}</span>
                <span class="plain-action-sub">Ward Transparency Feed</span>
              </div>
            </a>

            <span class="plain-action-divider" aria-hidden="true"></span>

            <!-- 5. Officer Portal Option -->
            <a routerLink="/admin" class="plain-action-link" title="Officer Portal">
              <div class="plain-action-icon-circle action-icon-navy">
                <i class="bi bi-shield-shaded"></i>
              </div>
              <div class="plain-action-content">
                <span class="plain-action-title">{{ langService.t('nav.admin') }}</span>
                <span class="plain-action-sub">Smart Priority Queue</span>
              </div>
            </a>
          </nav>

          <!-- Fast Track Search Input (Clean & Simple) -->
          <div class="clean-track-bar">
            <span class="clean-track-label">Have a Complaint Tracking ID?</span>
            <div class="clean-track-input-wrap">
              <i class="bi bi-search"></i>
              <input
                type="text"
                #trackInput
                placeholder="e.g. ABS-2026-0001, ABS-2026-0005..."
                (keyup.enter)="onTrackQuick(trackInput.value)"
                class="clean-track-input"
              />
              <button (click)="onTrackQuick(trackInput.value)" class="btn btn-primary btn-sm">
                {{ langService.t('nav.track') }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Live Statistics Counter -->
      <section class="stats-section">
        <div class="container">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon-wrap bg-blue">
                <i class="bi bi-folder2-open"></i>
              </div>
              <div class="stat-data">
                <span class="stat-number">{{ totalComplaints() }}</span>
                <span class="stat-label">{{ langService.t('stats.total') }}</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrap bg-green">
                <i class="bi bi-check2-circle"></i>
              </div>
              <div class="stat-data">
                <span class="stat-number">{{ resolvedComplaints() }}</span>
                <span class="stat-label">{{ langService.t('stats.resolved') }}</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrap bg-orange">
                <i class="bi bi-gear-wide-connected"></i>
              </div>
              <div class="stat-data">
                <span class="stat-number">{{ inProgressComplaints() }}</span>
                <span class="stat-label">{{ langService.t('stats.inProgress') }}</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrap bg-purple">
                <i class="bi bi-clock-history"></i>
              </div>
              <div class="stat-data">
                <span class="stat-number">2.4 Days</span>
                <span class="stat-label">{{ langService.t('stats.avgTime') }}</span>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-icon-wrap bg-red">
                <i class="bi bi-fire"></i>
              </div>
              <div class="stat-data">
                <span class="stat-number">{{ hotspotCount() }} Areas</span>
                <span class="stat-label">{{ langService.t('stats.hotspots') }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Civic Categories Grid -->
      <section class="categories-section">
        <div class="container">
          <div class="section-header text-center">
            <span class="section-tag">Citizen Reporting</span>
            <h2 class="section-title">Civic Complaint Categories</h2>
            <p class="section-desc">
              Select an issue category to initiate quick grievance reporting with GPS coordinates and photo evidence.
            </p>
          </div>

          <div class="categories-grid">
            <div
              class="category-card card card-hover"
              *ngFor="let cat of civicCategories"
              [routerLink]="['/report']"
              [queryParams]="{cat: cat.name}"
            >
              <div class="cat-icon-box" [style.background]="cat.bgColor">
                <i class="bi" [ngClass]="cat.icon" [style.color]="cat.iconColor"></i>
              </div>
              <h3 class="cat-title">{{ cat.displayName }}</h3>
              <p class="cat-desc">{{ cat.description }}</p>
              <div class="cat-action">
                <span>Report Issue</span>
                <i class="bi bi-arrow-right"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Smart Priority Engine Rules Banner -->
      <section class="priority-explanation-section">
        <div class="container">
          <div class="engine-banner-card">
            <div class="engine-header">
              <div class="engine-badge"><i class="bi bi-cpu-fill"></i> Transparent Triage Engine</div>
              <h2 class="engine-title">How Our Smart Rules-Based Priority Works</h2>
              <p class="engine-subtitle">
                Unlike opaque algorithms, our priority queue is strictly rules-based, deterministic, and balances life-safety emergencies against issue aging.
              </p>
            </div>

            <div class="priority-tiers-grid">
              <div class="tier-card tier-p0">
                <div class="tier-badge">P0 &bull; Emergency</div>
                <h4 class="tier-name">Immediate Danger</h4>
                <p class="tier-desc">
                  Exposed live wires, missing manhole covers in floodwater, hazardous wall collapse. Instant P0 boost (+1000 pts) outranks all other issues.
                </p>
                <div class="tier-metric"><i class="bi bi-lightning-charge"></i> Immediate Response Target</div>
              </div>

              <div class="tier-card tier-p1">
                <div class="tier-badge">P1 &bull; High Priority</div>
                <h4 class="tier-name">Severe Infrastructure</h4>
                <p class="tier-desc">
                  Drinking water sewage contamination, deep craters on highway flyovers, aggressive stray dog packs near schools.
                </p>
                <div class="tier-metric"><i class="bi bi-clock"></i> 24-48 Hour Window</div>
              </div>

              <div class="tier-card tier-p2">
                <div class="tier-badge">P2 &bull; Medium Priority</div>
                <h4 class="tier-name">Essential Services</h4>
                <p class="tier-desc">
                  Blocked residential drains, repeated uncollected garbage, broken streetlights. <em>Older unresolved complaints gain score boost over newer ones.</em>
                </p>
                <div class="tier-metric"><i class="bi bi-hourglass-split"></i> Age Boost Applied</div>
              </div>

              <div class="tier-card tier-p3">
                <div class="tier-badge">P3 &bull; Low Priority</div>
                <h4 class="tier-name">Cosmetic Maintenance</h4>
                <p class="tier-desc">
                  Damaged park bench slats, faded zebra crossing paint, minor footpath pavers with no direct danger to human life.
                </p>
                <div class="tier-metric"><i class="bi bi-tools"></i> Scheduled Batch Repair</div>
              </div>
            </div>

            <div class="demo-rule-note">
              <i class="bi bi-info-circle-fill"></i>
              <span>
                <strong>Demo Rules Engine Note:</strong> All scores and response targets are illustrative parameters for hackathon demonstration.
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- How It Works Step-by-Step -->
      <section class="how-it-works-section">
        <div class="container">
          <div class="section-header text-center">
            <span class="section-tag">Simple & Transparent</span>
            <h2 class="section-title">How Akhand Bharat Seva Works</h2>
            <p class="section-desc">
              Three streamlined steps from citizen reporting to municipal ground verification and closure.
            </p>
          </div>

          <div class="steps-grid">
            <div class="step-card">
              <div class="step-number">01</div>
              <div class="step-icon">
                <i class="bi bi-pin-map-fill"></i>
              </div>
              <h3 class="step-title">Pin & Report</h3>
              <p class="step-desc">
                Select category, upload photo, and pin exact location on OpenStreetMap.
              </p>
            </div>

            <div class="step-card">
              <div class="step-number">02</div>
              <div class="step-icon">
                <i class="bi bi-diagram-3-fill"></i>
              </div>
              <h3 class="step-title">Smart Triage & Routing</h3>
              <p class="step-desc">
                The engine calculates priority (P0-P3), alerts on nearby hotspots, and routes to respective departments.
              </p>
            </div>

            <div class="step-card">
              <div class="step-number">03</div>
              <div class="step-icon">
                <i class="bi bi-shield-check"></i>
              </div>
              <h3 class="step-title">Track to Resolution</h3>
              <p class="step-desc">
                Monitor status from Submitted &rarr; In Progress &rarr; Resolved with verified progress notes.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Issues Showcase -->
      <section class="recent-issues-section">
        <div class="container">
          <div class="section-header-flex">
            <div>
              <span class="section-tag">Public Transparency</span>
              <h2 class="section-title">Recent Civic Grievances</h2>
            </div>
            <a routerLink="/public-issues" class="btn btn-outline-navy btn-sm">
              View All Public Issues <i class="bi bi-arrow-right"></i>
            </a>
          </div>

          <div class="issues-grid">
            <div class="issue-card card card-hover" *ngFor="let item of getRecentPublicIssues()">
              <div class="issue-card-header">
                <app-priority-badge [priority]="item.priority" [label]="item.priority"></app-priority-badge>
                <app-status-badge [status]="item.status"></app-status-badge>
              </div>

              <div class="issue-img-box" *ngIf="item.photoUrl">
                <img [src]="item.photoUrl" [alt]="item.title" class="issue-img" loading="lazy" />
              </div>

              <div class="issue-card-body">
                <span class="issue-cat">{{ item.category }} &bull; {{ item.subcategory }}</span>
                <h3 class="issue-title">{{ item.title }}</h3>
                <p class="issue-desc">{{ item.description | slice:0:95 }}...</p>
                <div class="issue-meta">
                  <span><i class="bi bi-geo-alt-fill text-saffron"></i> {{ item.location.area }}</span>
                  <span><i class="bi bi-calendar3"></i> {{ item.submittedAt | date:'mediumDate' }}</span>
                </div>
              </div>

              <div class="issue-card-footer">
                <span class="complaint-id-tag">ID: {{ item.id }}</span>
                <a [routerLink]="['/track']" [queryParams]="{id: item.id}" class="track-link">
                  Track &rarr;
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .emergency-alert-strip {
      background-color: #dc2626;
      color: #ffffff;
      padding: 0.5rem 0;
      border-bottom: 2px solid #b91c1c;
    }
    .emergency-flex {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.8125rem;
    }
    .emergency-badge-pulse {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 700;
    }
    .emergency-text { flex: 1; min-width: 260px; }

    /* ========================================================== */
    /* CLEAN, BALANCED HERO HEADER SECTION                        */
    /* ========================================================== */
    .gov-hero-clean {
      background: #f0f7fc;
      padding: 2.5rem 0 3rem;
      text-align: center;
      border-bottom: 1px solid #e2e8f0;
    }
    .hero-container {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* Central Emblem Seal */
    .hero-emblem-wrap {
      margin-bottom: 0.85rem;
    }
    .central-emblem-seal {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: #ffffff;
      border: 3px solid #0284c7;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(2, 132, 199, 0.15);
    }
    .seal-inner-circle {
      width: 66px;
      height: 66px;
      border-radius: 50%;
      border: 1.5px dashed #0369a1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .seal-chakra {
      font-size: 1.6rem;
      color: #003399;
      line-height: 1;
      margin-bottom: 1px;
    }
    .seal-caption {
      font-size: 0.6rem;
      font-weight: 700;
      color: #0f172a;
    }

    /* Clean Heading Without Seva Paramodharma */
    .hero-titles-wrap {
      margin-bottom: 1.25rem;
      max-width: 720px;
    }
    .main-project-heading {
      font-size: 1.85rem;
      font-weight: 800;
      color: var(--navy-900);
      margin: 0 0 0.3rem;
      letter-spacing: -0.01em;
    }
    .main-project-tagline {
      font-size: 0.925rem;
      color: var(--text-muted);
      margin: 0;
      font-weight: 500;
    }

    /* Compact Language Strip */
    .home-lang-strip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      margin-bottom: 2rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    .home-lang-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--navy-900);
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    .home-lang-label i {
      color: var(--saffron-600);
    }
    .home-lang-select {
      background: transparent;
      border: none;
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--navy-900);
      cursor: pointer;
      outline: none;
    }

    /* ========================================================== */
    /* CLEAN, UNBOXED MAIN ACTIONS (NO BOXES, NO SHADOWS)         */
    /* ========================================================== */
    .plain-actions-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1.5rem;
      width: 100%;
      max-width: 1020px;
      margin-bottom: 2.25rem;
      padding: 0.75rem 0;
    }
    .plain-action-link {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: var(--navy-900);
      padding: 0.4rem 0.6rem;
      border-radius: var(--radius-sm);
      transition: all 0.15s ease;
      background: transparent !important;
      border: none !important;
      box-shadow: none !important;
    }
    .plain-action-link:hover {
      color: var(--saffron-600);
      transform: translateY(-1px);
    }
    .plain-action-icon-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e2e8f0;
      color: var(--navy-900);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
      transition: background 0.15s ease;
    }
    .plain-action-link:hover .plain-action-icon-circle {
      background: #cbd5e1;
    }
    .action-icon-saffron {
      background: #ffedd5;
      color: #ea580c;
    }
    .plain-action-link:hover .action-icon-saffron {
      background: #fed7aa;
    }
    .action-icon-blue {
      background: #e0f2fe;
      color: #0284c7;
    }
    .plain-action-link:hover .action-icon-blue {
      background: #bae6fd;
    }
    .action-icon-teal {
      background: #ccfbf1;
      color: #0f766e;
    }
    .action-icon-navy {
      background: #ede9fe;
      color: #5b21b6;
    }

    .plain-action-content {
      display: flex;
      flex-direction: column;
      text-align: left;
    }
    .plain-action-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: inherit;
      line-height: 1.25;
    }
    .plain-action-sub {
      font-size: 0.725rem;
      color: var(--text-muted);
      line-height: 1.3;
    }
    .plain-action-divider {
      width: 1px;
      height: 28px;
      background: #cbd5e1;
    }

    /* Clean Fast Track Bar */
    .clean-track-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.85rem;
      width: 100%;
      max-width: 600px;
      flex-wrap: wrap;
    }
    .clean-track-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--navy-900);
    }
    .clean-track-input-wrap {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: var(--radius-md);
      padding: 3px 5px 3px 10px;
    }
    .clean-track-input-wrap i {
      color: var(--text-muted);
      font-size: 0.85rem;
    }
    .clean-track-input {
      border: none;
      outline: none;
      font-size: 0.825rem;
      font-family: monospace;
      color: var(--text-main);
      width: 180px;
    }

    /* Stats Section */
    .stats-section {
      padding: 2rem 0;
      background: #ffffff;
      border-bottom: 1px solid var(--border-light);
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1rem;
    }
    .stat-card {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 1rem;
      background: var(--bg-page);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-light);
    }
    .stat-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    .bg-blue { background: #e0f2fe; color: #0284c7; }
    .bg-green { background: #dcfce7; color: #16a34a; }
    .bg-orange { background: #ffedd5; color: #ea580c; }
    .bg-purple { background: #ede9fe; color: #7c3aed; }
    .bg-red { background: #fee2e2; color: #dc2626; }
    .stat-data { display: flex; flex-direction: column; }
    .stat-number {
      font-size: 1.35rem;
      font-weight: 800;
      color: var(--navy-900);
      font-family: var(--font-display);
      line-height: 1.1;
    }
    .stat-label { font-size: 0.725rem; color: var(--text-muted); font-weight: 500; }

    /* Categories Grid */
    .categories-section {
      padding: 3.5rem 0;
      background: var(--bg-page);
    }
    .section-header { margin-bottom: 2.25rem; }
    .section-header-flex {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 1.75rem;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .section-tag {
      display: inline-block;
      font-size: 0.725rem;
      font-weight: 700;
      color: var(--saffron-600);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.35rem;
    }
    .section-title {
      font-size: 1.65rem;
      font-weight: 800;
      color: var(--navy-900);
      letter-spacing: -0.01em;
      margin-bottom: 0.35rem;
    }
    .section-desc {
      color: var(--text-muted);
      font-size: 0.875rem;
      max-width: 600px;
      margin: 0 auto;
    }
    .categories-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1rem;
    }
    .category-card {
      padding: 1.25rem;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      border: 1px solid var(--border-light);
    }
    .cat-icon-box {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.35rem;
      margin-bottom: 0.85rem;
    }
    .cat-title {
      font-size: 0.925rem;
      font-weight: 700;
      color: var(--navy-900);
      margin-bottom: 0.3rem;
      line-height: 1.3;
    }
    .cat-desc {
      font-size: 0.775rem;
      color: var(--text-muted);
      margin-bottom: 1rem;
      flex-grow: 1;
      line-height: 1.4;
    }
    .cat-action {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--navy-700);
      padding-top: 0.65rem;
      border-top: 1px solid #f1f5f9;
    }
    .category-card:hover .cat-action { color: var(--saffron-600); }

    /* Rules Banner */
    .priority-explanation-section {
      padding: 3rem 0;
      background: #ffffff;
      border-top: 1px solid var(--border-light);
      border-bottom: 1px solid var(--border-light);
    }
    .engine-banner-card {
      background: linear-gradient(145deg, #0f2347 0%, #16325c 100%);
      border-radius: var(--radius-lg);
      padding: 2.25rem;
      color: #ffffff;
    }
    .engine-header {
      text-align: center;
      max-width: 720px;
      margin: 0 auto 2rem;
    }
    .engine-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.75rem;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--saffron-400);
      margin-bottom: 0.5rem;
    }
    .engine-title { font-size: 1.55rem; color: #ffffff; margin-bottom: 0.35rem; }
    .engine-subtitle { color: #cbd5e1; font-size: 0.85rem; }
    .priority-tiers-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .tier-card {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: var(--radius-md);
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
    }
    .tier-p0 { border-top: 3px solid #ef4444; }
    .tier-p1 { border-top: 3px solid #f97316; }
    .tier-p2 { border-top: 3px solid #eab308; }
    .tier-p3 { border-top: 3px solid #0284c7; }
    .tier-badge { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; margin-bottom: 0.4rem; }
    .tier-p0 .tier-badge { color: #fca5a5; }
    .tier-p1 .tier-badge { color: #fdba74; }
    .tier-p2 .tier-badge { color: #fde047; }
    .tier-p3 .tier-badge { color: #7dd3fc; }
    .tier-name { font-size: 0.95rem; color: #ffffff; margin-bottom: 0.35rem; }
    .tier-desc { font-size: 0.775rem; color: #cbd5e1; line-height: 1.45; flex-grow: 1; margin-bottom: 0.85rem; }
    .tier-metric { font-size: 0.725rem; font-weight: 600; color: #ffffff; padding-top: 0.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; gap: 0.35rem; }
    .demo-rule-note {
      background: rgba(0, 0, 0, 0.25);
      border-radius: var(--radius-sm);
      padding: 0.65rem 0.85rem;
      font-size: 0.775rem;
      color: #cbd5e1;
      display: flex;
      align-items: center;
      gap: 0.45rem;
    }

    /* Steps */
    .how-it-works-section { padding: 3.5rem 0; background: var(--bg-page); }
    .steps-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .step-card {
      background: #ffffff;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      padding: 1.75rem 1.5rem;
      position: relative;
    }
    .step-number { position: absolute; top: 1rem; right: 1.25rem; font-size: 2rem; font-weight: 800; color: #f1f5f9; font-family: var(--font-display); }
    .step-icon { width: 44px; height: 44px; border-radius: 10px; background: var(--navy-100); color: var(--navy-800); display: flex; align-items: center; justify-content: center; font-size: 1.35rem; margin-bottom: 1rem; }
    .step-title { font-size: 1.1rem; color: var(--navy-900); margin-bottom: 0.45rem; }
    .step-desc { font-size: 0.825rem; color: var(--text-muted); line-height: 1.5; }

    /* Recent */
    .recent-issues-section { padding: 3.5rem 0; background: #ffffff; }
    .issues-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.25rem; }
    .issue-card { display: flex; flex-direction: column; }
    .issue-card-header { display: flex; justify-content: space-between; align-items: center; padding: 0.85rem 1.1rem; border-bottom: 1px solid var(--border-light); }
    .issue-img-box { height: 145px; overflow: hidden; background: #000; }
    .issue-img { width: 100%; height: 100%; object-fit: cover; }
    .issue-card-body { padding: 1.1rem; flex-grow: 1; }
    .issue-cat { display: block; font-size: 0.725rem; font-weight: 600; color: var(--saffron-600); margin-bottom: 0.35rem; text-transform: uppercase; }
    .issue-title { font-size: 0.95rem; color: var(--navy-900); margin-bottom: 0.45rem; line-height: 1.3; }
    .issue-desc { font-size: 0.775rem; color: var(--text-muted); line-height: 1.45; margin-bottom: 0.85rem; }
    .issue-meta { display: flex; justify-content: space-between; font-size: 0.725rem; color: var(--text-light); }
    .issue-card-footer { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1.1rem; background: var(--bg-page); border-top: 1px solid var(--border-light); font-size: 0.775rem; }
    .complaint-id-tag { font-family: monospace; font-weight: 700; color: var(--navy-800); }
    .track-link { font-weight: 600; color: var(--navy-700); }

    @media (max-width: 1024px) {
      .plain-actions-nav { gap: 1rem; }
      .plain-action-divider { display: none; }
      .stats-grid { grid-template-columns: repeat(3, 1fr); }
      .categories-grid { grid-template-columns: repeat(3, 1fr); }
      .priority-tiers-grid { grid-template-columns: repeat(2, 1fr); }
      .issues-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .main-project-heading { font-size: 1.55rem; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .categories-grid { grid-template-columns: repeat(2, 1fr); }
      .steps-grid { grid-template-columns: 1fr; }
      .issues-grid { grid-template-columns: 1fr; }
      .plain-actions-nav { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
    }
    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
      .categories-grid { grid-template-columns: 1fr; }
      .clean-track-bar { flex-direction: column; }
    }
  `]
})
export class HomeComponent {
  langService = inject(LanguageService);
  complaintService = inject(ComplaintService);

  civicCategories: Array<{
    name: ComplaintCategory;
    displayName: string;
    description: string;
    icon: string;
    bgColor: string;
    iconColor: string;
  }> = [
    {
      name: 'Roads & Potholes',
      displayName: 'Roads & Potholes',
      description: 'Craters, asphalt peeling, dangerous trenches, speed bump defects.',
      icon: 'bi-cone-striped',
      bgColor: '#fff7ed',
      iconColor: '#ea580c'
    },
    {
      name: 'Garbage & Sanitation',
      displayName: 'Garbage & Sanitation',
      description: 'Commercial waste heaps, missing dustbins, market rotting garbage.',
      icon: 'bi-trash3-fill',
      bgColor: '#f0fdf4',
      iconColor: '#16a34a'
    },
    {
      name: 'Sewage & Drainage',
      displayName: 'Sewage & Drainage',
      description: 'Missing manholes, black water overflow, choked culverts, inundation.',
      icon: 'bi-water',
      bgColor: '#eff6ff',
      iconColor: '#2563eb'
    },
    {
      name: 'Water Supply',
      displayName: 'Water Supply',
      description: 'Contaminated tap water, low pressure, main burst, supply cutoff.',
      icon: 'bi-droplet-half',
      bgColor: '#ecfeff',
      iconColor: '#0891b2'
    },
    {
      name: 'Streetlights & Electricity',
      displayName: 'Streetlights & Electricity',
      description: 'Exposed live cables, dark residential streets, sparking poles.',
      icon: 'bi-lightning-charge-fill',
      bgColor: '#fefce8',
      iconColor: '#ca8a04'
    },
    {
      name: 'Parks & Gardens',
      displayName: 'Parks & Gardens',
      description: 'Broken benches, playground swings, unpruned dangerous branches.',
      icon: 'bi-tree-fill',
      bgColor: '#f0fdf4',
      iconColor: '#15803d'
    },
    {
      name: 'Footpaths',
      displayName: 'Footpaths',
      description: 'Dislodged pavers, illegal encroachment, absent pedestrian ramps.',
      icon: 'bi-signpost-split-fill',
      bgColor: '#faf5ff',
      iconColor: '#9333ea'
    },
    {
      name: 'Public Toilets',
      displayName: 'Public Toilets',
      description: 'Sulabh / community complex choke, foul smell, broken cisterns.',
      icon: 'bi-badge-wc-fill',
      bgColor: '#fef2f2',
      iconColor: '#dc2626'
    },
    {
      name: 'Stray Animals',
      displayName: 'Stray Animals',
      description: 'Aggressive dog packs, cattle obstructing highways, rabies threat.',
      icon: 'bi-shield-shaded',
      bgColor: '#fff1f2',
      iconColor: '#e11d48'
    },
    {
      name: 'Other Issues',
      displayName: 'Other Civic Grievances',
      description: 'Illegal hoarding, noise pollution, building violations, encroachment.',
      icon: 'bi-grid-fill',
      bgColor: '#f8fafc',
      iconColor: '#475569'
    }
  ];

  getActiveP0() {
    return this.complaintService.complaints().find(
      c => c.priority === 'P0' && c.status !== 'Resolved' && c.status !== 'Closed'
    );
  }

  getRecentPublicIssues() {
    return this.complaintService.complaints().slice(0, 6);
  }

  totalComplaints(): number {
    return this.complaintService.complaints().length;
  }

  resolvedComplaints(): number {
    return this.complaintService.complaints().filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
  }

  inProgressComplaints(): number {
    return this.complaintService.complaints().filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
  }

  hotspotCount(): number {
    const list = this.complaintService.complaints();
    const clusters = new Set(list.filter(c => c.hotspotClusterId).map(c => c.hotspotClusterId));
    return Math.max(clusters.size, 3);
  }

  onTrackQuick(val: string): void {
    if (!val || !val.trim()) return;
    window.location.href = `/track?id=${encodeURIComponent(val.trim().toUpperCase())}`;
  }
}
