import { Component, OnInit, inject, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { ComplaintService } from '../../services/complaint.service';
import { LanguageService } from '../../services/language.service';
import { Complaint, ComplaintStatus } from '../../models/complaint.model';
import { PriorityBadgeComponent } from '../../components/priority-badge/priority-badge.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';

@Component({
  selector: 'app-track',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PriorityBadgeComponent, StatusBadgeComponent],
  template: `
    <div class="track-page">
      <!-- Banner -->
      <section class="track-banner">
        <div class="container">
          <div class="breadcrumb-trail">
            <a routerLink="/"><i class="bi bi-house"></i> Home</a>
            <i class="bi bi-chevron-right separator"></i>
            <span>Track Grievance</span>
          </div>
          <h1 class="page-title">Track Complaint Status</h1>
          <p class="page-subtitle">
            Enter your unique Complaint Tracking ID (e.g., ABS-2026-0001) to view real-time municipal inspection progress and resolution timeline.
          </p>

          <!-- Search Bar -->
          <div class="track-search-card">
            <div class="search-input-group">
              <i class="bi bi-search search-icon"></i>
              <input
                type="text"
                [(ngModel)]="searchId"
                (keyup.enter)="onSearch()"
                placeholder="Enter Complaint ID (e.g. ABS-2026-0001)"
                class="search-input"
              />
              <button (click)="onSearch()" class="btn btn-saffron btn-lg search-btn">
                <i class="bi bi-crosshair2"></i> Track Grievance
              </button>
            </div>

            <!-- Quick Demo ID Chips -->
            <div class="quick-chips">
              <span class="chips-label">Quick Demo IDs:</span>
              <button (click)="loadDemoId('ABS-2026-0001')" class="chip chip-p0">
                <span class="chip-dot dot-red"></span> ABS-2026-0001 (P0 Live Wire Emergency)
              </button>
              <button (click)="loadDemoId('ABS-2026-0003')" class="chip chip-p1">
                <span class="chip-dot dot-orange"></span> ABS-2026-0003 (P1 Sewage in Drinking Water)
              </button>
              <button (click)="loadDemoId('ABS-2026-0005')" class="chip chip-p2">
                <span class="chip-dot dot-yellow"></span> ABS-2026-0005 (P2 7-Day-Old Charminar Waste)
              </button>
              <button (click)="loadDemoId('ABS-2026-0014')" class="chip chip-p3">
                <span class="chip-dot dot-green"></span> ABS-2026-0014 (Resolved Sulabh Toilet)
              </button>
              <button (click)="loadDemoId('ABS-2026-0009')" class="chip chip-p3">
                <span class="chip-dot dot-blue"></span> ABS-2026-0009 (P3 Low Park Bench)
              </button>
            </div>
          </div>
        </div>
      </section>

      <div class="container track-content">
        <!-- Error / Not Found State -->
        <div class="card not-found-card" *ngIf="searched && !complaint">
          <div class="not-found-icon">
            <i class="bi bi-search text-muted"></i>
          </div>
          <h3>No Complaint Found</h3>
          <p>
            We could not locate any grievance with ID <strong>"{{ searchId }}"</strong>. Please verify the ID format (e.g. ABS-2026-0001) or pick one of the demo IDs above.
          </p>
        </div>

        <!-- Complaint Details Card -->
        <div class="complaint-tracking-view" *ngIf="complaint">
          <!-- Top Overview Bar -->
          <div class="card tracking-header-card">
            <div class="header-main-info">
              <div class="id-prio-row">
                <span class="complaint-id-badge">{{ complaint.id }}</span>
                <app-priority-badge
                  [priority]="complaint.priority"
                  [label]="complaint.priority"
                  [score]="complaint.priorityScore"
                  [showScore]="true"
                ></app-priority-badge>
                <app-status-badge [status]="complaint.status"></app-status-badge>
                <span class="hotspot-badge" *ngIf="complaint.hotspotClusterId">
                  <i class="bi bi-fire text-danger"></i> {{ complaint.hotspotCount }} Nearby Clustered Reports
                </span>
              </div>
              <h2 class="complaint-title">{{ complaint.title }}</h2>
              <div class="header-meta-row">
                <span><i class="bi bi-folder-fill"></i> {{ complaint.category }} &bull; {{ complaint.subcategory }}</span>
                <span><i class="bi bi-building"></i> {{ complaint.department }}</span>
                <span><i class="bi bi-geo-alt-fill text-saffron"></i> {{ complaint.location.area }}</span>
                <span><i class="bi bi-calendar3"></i> Submitted {{ complaint.submittedAt | date:'mediumDate' }}</span>
              </div>
            </div>
          </div>

          <!-- STATUS PROGRESS TIMELINE -->
          <div class="card timeline-card">
            <h3 class="card-section-title">
              <i class="bi bi-diagram-3-fill text-saffron"></i> Redressal Progress Timeline
            </h3>

            <div class="timeline-stepper">
              <div
                class="step-node"
                *ngFor="let s of allStatuses; let i = index"
                [class.completed]="isStepCompleted(s)"
                [class.current]="complaint.status === s"
              >
                <div class="step-circle">
                  <i class="bi bi-check" *ngIf="isStepCompleted(s)"></i>
                  <span *ngIf="!isStepCompleted(s)">{{ i + 1 }}</span>
                </div>
                <span class="step-title">{{ s }}</span>
              </div>
            </div>

            <!-- Detailed Event Logs -->
            <div class="event-logs-list">
              <div class="event-log-item" *ngFor="let log of complaint.statusTimeline">
                <div class="event-marker">
                  <i class="bi bi-clock-history"></i>
                </div>
                <div class="event-body">
                  <div class="event-header">
                    <span class="event-status-label">{{ log.status }}</span>
                    <span class="event-time">{{ log.timestamp | date:'medium' }}</span>
                  </div>
                  <p class="event-remarks">{{ log.remarks }}</p>
                  <span class="event-actor"><i class="bi bi-person-badge"></i> Handled by: {{ log.updatedBy }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- TWO-COLUMN DETAIL GRID -->
          <div class="grid-2 tracking-details-grid">
            <!-- Left: Grievance Info -->
            <div class="card detail-card">
              <h3 class="card-section-title">
                <i class="bi bi-card-text text-navy"></i> Grievance Particulars
              </h3>

              <!-- Dual-Language Indic AI Translation Pill -->
              <div class="indic-translation-card" *ngIf="complaint.detectedLanguage && complaint.detectedLanguage !== 'en'">
                <div class="indic-badge-row">
                  <span class="badge badge-indic">
                    <i class="bi bi-translate"></i> Gemma 4 Indic NLU Verified ({{ complaint.detectedLanguage.toUpperCase() }})
                  </span>
                  <span class="indic-accuracy-tag"><i class="bi bi-shield-check"></i> Citizen Vernacular Preserved</span>
                </div>
                <div class="indic-split-view">
                  <div class="indic-lang-col">
                    <span class="col-title"><i class="bi bi-chat-quote-fill"></i> Original Citizen Report ({{ complaint.detectedLanguage === 'te' ? 'Telugu' : complaint.detectedLanguage === 'hi' ? 'Hindi' : complaint.detectedLanguage === 'mr' ? 'Marathi' : complaint.detectedLanguage === 'ta' ? 'Tamil' : 'Vernacular' }})</span>
                    <p class="indic-text">{{ complaint.originalText || complaint.description }}</p>
                  </div>
                  <div class="indic-lang-col translated-col">
                    <span class="col-title"><i class="bi bi-globe2"></i> Gemma 4 Verified English Summary</span>
                    <p class="translated-text">{{ complaint.translatedEnglishReport || complaint.staffSummary || complaint.description }}</p>
                  </div>
                </div>
              </div>

              <div class="details-table">
                <div class="detail-row">
                  <span class="dt-label">Problem Description:</span>
                  <p class="dt-val description-text">{{ complaint.description }}</p>
                </div>
                <div class="detail-row">
                  <span class="dt-label">Reported Issue Age:</span>
                  <span class="dt-val">{{ complaint.issueAge }}</span>
                </div>
                <div class="detail-row">
                  <span class="dt-label">Public Impact Level:</span>
                  <span class="dt-val">{{ complaint.publicImpact }}</span>
                </div>
                <div class="detail-row">
                  <span class="dt-label">Smart Priority Score:</span>
                  <span class="dt-val font-semibold">
                    {{ complaint.priorityScore }} points ({{ complaint.priority }})
                  </span>
                </div>
                <div class="detail-row">
                  <span class="dt-label">Priority Engine Reason:</span>
                  <div class="dt-val priority-reason-box">
                    <i class="bi bi-cpu-fill text-saffron"></i>
                    <span>{{ complaint.priorityReason }}</span>
                  </div>
                </div>
                <div class="detail-row">
                  <span class="dt-label">Citizen Attribution:</span>
                  <span class="dt-val">
                    {{ complaint.citizen.isAnonymous ? 'Anonymous Citizen' : complaint.citizen.name }}
                    <span class="privacy-guarantee-pill"><i class="bi bi-shield-lock-fill"></i> Phone & Email Hidden</span>
                  </span>
                </div>
              </div>

              <!-- Photo If Available -->
              <div class="attached-photo-box" *ngIf="complaint.photoUrl">
                <h4 class="photo-box-title"><i class="bi bi-camera"></i> Attached On-Site Photo Evidence</h4>
                <img [src]="complaint.photoUrl" [alt]="complaint.title" class="attached-img" />
              </div>

              <!-- Citizen Satisfaction Rating for Resolved complaints -->
              <div class="card rating-box" *ngIf="complaint.status === 'Resolved' || complaint.status === 'Closed'">
                <h4 class="rating-title"><i class="bi bi-star-fill text-warning"></i> Citizen Satisfaction Feedback</h4>
                <p class="rating-subtitle">Has this civic grievance been resolved satisfactorily?</p>
                <div class="star-row">
                  <button
                    *ngFor="let star of [1, 2, 3, 4, 5]"
                    (click)="selectedRating = star"
                    class="star-btn"
                    [class.filled]="star <= selectedRating"
                  >
                    ★
                  </button>
                  <span class="rating-label" *ngIf="selectedRating > 0">
                    {{ selectedRating }} / 5 Stars {{ selectedRating >= 4 ? '— Satisfied!' : '— Needs follow-up' }}
                  </span>
                </div>
                <p class="rating-ack" *ngIf="selectedRating > 0">
                  <i class="bi bi-check-circle-fill text-green"></i> Thank you! Your feedback has been recorded for the zonal municipal commissioner.
                </p>
              </div>
            </div>

            <!-- Right: Interactive Leaflet Map Preview -->
            <div class="card detail-card map-card">
              <h3 class="card-section-title">
                <i class="bi bi-geo-alt-fill text-danger"></i> Pinned Incident Location
              </h3>

              <div class="location-summary-bar">
                <div class="loc-pin-icon"><i class="bi bi-geo-alt"></i></div>
                <div>
                  <strong>{{ complaint.location.address }}</strong>
                  <div class="loc-sub">
                    {{ complaint.location.area }} &bull; Lat: {{ complaint.location.latitude.toFixed(4) }}, Lng: {{ complaint.location.longitude.toFixed(4) }}
                  </div>
                </div>
              </div>

              <div class="tracking-map-container">
                <div #trackMapContainer class="leaflet-track-map"></div>
              </div>

              <div class="dept-action-box">
                <div class="dept-badge-header">
                  <i class="bi bi-building-check text-navy"></i>
                  <strong>Handling Department</strong>
                </div>
                <p class="dept-name">{{ complaint.department }}</p>
                <p class="dept-desc">
                  Jurisdiction: GHMC West/Central Circle & Associated Municipal Engineering Divisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .track-banner {
      background: linear-gradient(135deg, var(--navy-950) 0%, var(--navy-900) 100%);
      color: #ffffff;
      padding: 3rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .breadcrumb-trail {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #94a3b8;
      margin-bottom: 0.75rem;
    }
    .breadcrumb-trail a { color: #cbd5e1; }
    .page-title {
      font-size: 2.25rem;
      color: #ffffff;
      margin-bottom: 0.5rem;
    }
    .page-subtitle {
      color: #cbd5e1;
      font-size: 1rem;
      max-width: 680px;
      margin-bottom: 2rem;
    }

    .track-search-card {
      background: #ffffff;
      padding: 1.5rem;
      border-radius: var(--radius-lg);
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
      max-width: 820px;
    }
    .search-input-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .search-icon {
      font-size: 1.5rem;
      color: var(--navy-700);
      margin-left: 0.5rem;
    }
    .search-input {
      flex: 1;
      border: none;
      font-size: 1.1rem;
      font-family: monospace;
      color: var(--navy-900);
      font-weight: 600;
      outline: none;
    }
    .quick-chips {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--border-light);
    }
    .chips-label {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.3rem 0.65rem;
      border-radius: var(--radius-full);
      font-size: 0.75rem;
      cursor: pointer;
      background: var(--navy-50);
      border: 1px solid var(--border-medium);
      color: var(--navy-900);
      transition: all 0.15s ease;
    }
    .chip:hover {
      background: var(--navy-100);
      border-color: var(--navy-700);
    }
    .chip-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .dot-red { background: #dc2626; }
    .dot-orange { background: #ea580c; }
    .dot-yellow { background: #d97706; }
    .dot-green { background: #16a34a; }
    .dot-blue { background: #0284c7; }

    .track-content {
      padding: 3rem 1.25rem;
    }
    .not-found-card {
      text-align: center;
      padding: 4rem 2rem;
      max-width: 600px;
      margin: 0 auto;
    }
    .not-found-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .tracking-header-card {
      padding: 2rem;
      margin-bottom: 2rem;
    }
    .id-prio-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .complaint-id-badge {
      font-family: monospace;
      font-size: 1.1rem;
      font-weight: 800;
      background: var(--navy-900);
      color: #ffffff;
      padding: 0.25rem 0.75rem;
      border-radius: var(--radius-sm);
      letter-spacing: 0.05em;
    }
    .hotspot-badge {
      font-size: 0.75rem;
      font-weight: 700;
      color: #991b1b;
      background: #fee2e2;
      border: 1px solid #f87171;
      padding: 0.25rem 0.65rem;
      border-radius: 999px;
    }
    .complaint-title {
      font-size: 1.6rem;
      color: var(--navy-900);
      margin-bottom: 0.75rem;
      line-height: 1.3;
    }
    .header-meta-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .header-meta-row span {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .timeline-card {
      padding: 2rem;
      margin-bottom: 2rem;
    }
    .card-section-title {
      font-size: 1.25rem;
      color: var(--navy-900);
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .timeline-stepper {
      display: flex;
      justify-content: space-between;
      position: relative;
      margin-bottom: 2.5rem;
    }
    .timeline-stepper::before {
      content: '';
      position: absolute;
      top: 18px;
      left: 30px;
      right: 30px;
      height: 3px;
      background: var(--border-medium);
      z-index: 1;
    }
    .step-node {
      position: relative;
      z-index: 2;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      width: 100px;
      text-align: center;
    }
    .step-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #ffffff;
      border: 3px solid var(--border-medium);
      color: var(--text-muted);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.875rem;
    }
    .step-title {
      font-size: 0.775rem;
      color: var(--text-muted);
      font-weight: 600;
    }
    .step-node.completed .step-circle {
      background: #16a34a;
      border-color: #16a34a;
      color: #ffffff;
    }
    .step-node.completed .step-title {
      color: #16a34a;
    }
    .step-node.current .step-circle {
      border-color: var(--saffron-500);
      color: var(--saffron-600);
      box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.2);
    }
    .step-node.current .step-title {
      color: var(--navy-900);
      font-weight: 700;
    }

    .event-logs-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      border-left: 2px solid var(--border-medium);
      padding-left: 1.5rem;
      margin-left: 1rem;
    }
    .event-log-item {
      position: relative;
    }
    .event-marker {
      position: absolute;
      left: -2rem;
      top: 0;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--navy-100);
      color: var(--navy-800);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
    }
    .event-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.25rem;
    }
    .event-status-label {
      font-weight: 700;
      color: var(--navy-900);
      font-size: 0.9rem;
    }
    .event-time {
      font-size: 0.775rem;
      color: var(--text-light);
    }
    .event-remarks {
      font-size: 0.85rem;
      color: var(--text-main);
      margin: 0 0 0.3rem;
      line-height: 1.45;
    }
    .event-actor {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .tracking-details-grid {
      gap: 2rem;
    }
    .detail-card {
      padding: 2rem;
    }
    .indic-translation-card {
      background: linear-gradient(135deg, rgba(255, 153, 51, 0.08) 0%, rgba(19, 136, 8, 0.06) 100%);
      border: 1px solid rgba(255, 153, 51, 0.35);
      border-radius: var(--radius-md, 8px);
      padding: 1rem;
      margin-bottom: 1.25rem;
    }
    .indic-badge-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .badge-indic {
      background: #ea580c;
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      letter-spacing: 0.02em;
    }
    .indic-accuracy-tag {
      font-size: 0.75rem;
      color: #15803d;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }
    .indic-split-view {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    @media (max-width: 640px) {
      .indic-split-view {
        grid-template-columns: 1fr;
      }
    }
    .indic-lang-col {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 6px;
      padding: 0.75rem;
    }
    .indic-lang-col .col-title {
      display: block;
      font-size: 0.72rem;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 0.35rem;
    }
    .indic-text {
      font-size: 0.92rem;
      line-height: 1.5;
      color: #1e293b;
      font-weight: 500;
      margin: 0;
    }
    .translated-text {
      font-size: 0.875rem;
      line-height: 1.45;
      color: #0f172a;
      margin: 0;
    }

    .details-table {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .detail-row {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 0.75rem;
      font-size: 0.875rem;
    }
    .dt-label {
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.8125rem;
    }
    .dt-val {
      color: var(--navy-900);
    }
    .description-text {
      line-height: 1.5;
      margin: 0;
    }
    .priority-reason-box {
      display: flex;
      align-items: flex-start;
      gap: 0.4rem;
      background: #fff7ed;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      border: 1px solid #ffedd5;
      color: #9a3412;
      font-size: 0.8125rem;
    }
    .privacy-guarantee-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      background: #e0f2fe;
      color: #0369a1;
      padding: 1px 6px;
      border-radius: 999px;
      font-size: 0.7rem;
      margin-left: 0.5rem;
    }

    .attached-photo-box {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-light);
    }
    .photo-box-title {
      font-size: 0.875rem;
      color: var(--navy-900);
      margin-bottom: 0.75rem;
    }
    .attached-img {
      width: 100%;
      height: 240px;
      object-fit: cover;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-medium);
    }

    .rating-box {
      margin-top: 1.5rem;
      padding: 1.25rem;
      background: #fafaf9;
      border: 1px dashed var(--border-medium);
    }
    .rating-title {
      font-size: 0.95rem;
      margin: 0 0 0.25rem;
      color: var(--navy-900);
    }
    .rating-subtitle {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
    }
    .star-row {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      margin-bottom: 0.5rem;
    }
    .star-btn {
      background: none;
      border: none;
      font-size: 1.6rem;
      color: #cbd5e1;
      cursor: pointer;
      line-height: 1;
      transition: color 0.15s;
    }
    .star-btn.filled {
      color: #f59e0b;
    }
    .rating-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--navy-900);
      margin-left: 0.5rem;
    }
    .rating-ack {
      font-size: 0.8rem;
      color: #15803d;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    /* Map Box */
    .location-summary-bar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
      background: var(--bg-page);
      padding: 0.85rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-light);
    }
    .loc-pin-icon {
      font-size: 1.5rem;
      color: #dc2626;
    }
    .loc-sub {
      font-size: 0.775rem;
      color: var(--text-muted);
      margin-top: 2px;
    }
    .tracking-map-container {
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--border-medium);
      margin-bottom: 1.25rem;
    }
    .leaflet-track-map {
      width: 100%;
      height: 300px;
    }
    .dept-action-box {
      background: #f1f5f9;
      padding: 1rem;
      border-radius: var(--radius-md);
      font-size: 0.85rem;
    }
    .dept-badge-header {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--navy-900);
      margin-bottom: 0.25rem;
    }
    .dept-name {
      font-weight: 700;
      color: var(--navy-900);
      margin: 0 0 0.25rem;
    }
    .dept-desc {
      color: var(--text-muted);
      font-size: 0.775rem;
      margin: 0;
    }

    @media (max-width: 960px) {
      .tracking-details-grid { grid-template-columns: 1fr; }
      .timeline-stepper { flex-wrap: wrap; gap: 1rem; }
      .timeline-stepper::before { display: none; }
      .step-node { width: calc(50% - 0.5rem); }
      .search-input-group { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class TrackComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('trackMapContainer') trackMapContainerRef!: ElementRef;

  route = inject(ActivatedRoute);
  complaintService = inject(ComplaintService);
  langService = inject(LanguageService);

  searchId = '';
  complaint: Complaint | null = null;
  searched = false;

  map!: L.Map;
  marker!: L.Marker;

  selectedRating = 0;

  allStatuses: ComplaintStatus[] = [
    'Submitted',
    'Under Review',
    'Assigned',
    'In Progress',
    'Resolved',
    'Closed'
  ];

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['id']) {
        this.searchId = params['id'];
        this.onSearch();
      } else {
        // Default load first complaint for instant demo
        this.loadDemoId('ABS-2026-0001');
      }
    });
  }

  ngAfterViewInit(): void {
    if (this.complaint) {
      setTimeout(() => this.initMap(), 200);
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  onSearch(): void {
    this.searched = true;
    if (!this.searchId || !this.searchId.trim()) return;

    const found = this.complaintService.getComplaintById(this.searchId.trim());
    this.complaint = found || null;

    if (this.complaint) {
      setTimeout(() => this.initMap(), 200);
    }
  }

  loadDemoId(id: string): void {
    this.searchId = id;
    this.onSearch();
  }

  isStepCompleted(status: ComplaintStatus): boolean {
    if (!this.complaint) return false;
    const currentIndex = this.allStatuses.indexOf(this.complaint.status);
    const targetIndex = this.allStatuses.indexOf(status);
    return targetIndex <= currentIndex;
  }

  initMap(): void {
    if (!this.trackMapContainerRef || !this.complaint) return;

    if (this.map) {
      this.map.remove();
    }

    const lat = this.complaint.location.latitude;
    const lng = this.complaint.location.longitude;

    const iconMarker = L.icon({
      iconUrl: '/leaflet/marker-icon.png',
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      shadowUrl: '/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.map = L.map(this.trackMapContainerRef.nativeElement).setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(this.map);

    this.marker = L.marker([lat, lng], { icon: iconMarker }).addTo(this.map);
    this.marker.bindPopup(`<b>${this.complaint.id}</b><br>${this.complaint.location.address}`).openPopup();
  }
}
