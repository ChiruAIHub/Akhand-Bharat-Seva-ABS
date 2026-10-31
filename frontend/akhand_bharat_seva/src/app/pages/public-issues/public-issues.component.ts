import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import * as L from 'leaflet';
import { ComplaintService } from '../../services/complaint.service';
import { LanguageService } from '../../services/language.service';
import {
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  PriorityLevel
} from '../../models/complaint.model';
import { PriorityBadgeComponent } from '../../components/priority-badge/priority-badge.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';

@Component({
  selector: 'app-public-issues',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PriorityBadgeComponent, StatusBadgeComponent],
  template: `
    <div class="public-issues-page">
      <!-- Banner -->
      <section class="public-banner">
        <div class="container">
          <div class="breadcrumb-trail">
            <a routerLink="/"><i class="bi bi-house"></i> Home</a>
            <i class="bi bi-chevron-right separator"></i>
            <span>Public Grievances</span>
          </div>
          <div class="banner-title-row">
            <div>
              <h1 class="page-title">Public Grievances Transparency Board</h1>
              <p class="page-subtitle">
                Explore real-time civic issues across Hyderabad wards. All personal telephone numbers and emails are strictly withheld under privacy rules.
              </p>
            </div>
            <div class="privacy-seal">
              <i class="bi bi-shield-check text-green"></i>
              <div>
                <strong>Privacy Guaranteed</strong>
                <span>No citizen PII displayed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="container public-content">
        <!-- FILTER BAR -->
        <div class="card filter-card">
          <div class="filter-top-row">
            <div class="search-box">
              <i class="bi bi-search"></i>
              <input
                type="text"
                [(ngModel)]="searchTerm"
                placeholder="Search by keyword, landmark, area or ID..."
                class="form-control"
              />
            </div>

            <!-- View Switcher -->
            <div class="view-toggle">
              <button
                class="view-btn"
                [class.active]="viewMode === 'grid'"
                (click)="switchView('grid')"
              >
                <i class="bi bi-grid-fill"></i> Card Grid ({{ filteredComplaints.length }})
              </button>
              <button
                class="view-btn"
                [class.active]="viewMode === 'map'"
                (click)="switchView('map')"
              >
                <i class="bi bi-map-fill"></i> Interactive Map
              </button>
            </div>
          </div>

          <!-- Multi-Dropdown Filters -->
          <div class="filters-grid">
            <div class="filter-item">
              <label class="filter-label">Civic Category</label>
              <select [(ngModel)]="selectedCategory" class="form-control">
                <option value="">All Categories</option>
                <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
              </select>
            </div>

            <div class="filter-item">
              <label class="filter-label">Priority</label>
              <select [(ngModel)]="selectedPriority" class="form-control">
                <option value="">All Priorities</option>
                <option value="P0">P0 — Emergency</option>
                <option value="P1">P1 — High</option>
                <option value="P2">P2 — Medium</option>
                <option value="P3">P3 — Low</option>
              </select>
            </div>

            <div class="filter-item">
              <label class="filter-label">Status</label>
              <select [(ngModel)]="selectedStatus" class="form-control">
                <option value="">All Statuses</option>
                <option *ngFor="let st of statuses" [value]="st">{{ st }}</option>
              </select>
            </div>

            <div class="filter-item">
              <label class="filter-label">Sort By</label>
              <select [(ngModel)]="sortBy" class="form-control">
                <option value="score">Smart Priority (Highest First)</option>
                <option value="newest">Submission Date (Newest First)</option>
                <option value="oldest">Submission Date (Oldest First)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- VIEW 1: INTERACTIVE MAP -->
        <div class="public-map-wrapper" *ngIf="viewMode === 'map'">
          <div class="card map-card-full">
            <div class="map-legend">
              <span class="legend-title">Map Legend:</span>
              <span class="legend-item"><span class="badge badge-p0">P0</span> Emergency</span>
              <span class="legend-item"><span class="badge badge-p1">P1</span> High</span>
              <span class="legend-item"><span class="badge badge-p2">P2</span> Medium</span>
              <span class="legend-item"><span class="badge badge-p3">P3</span> Low</span>
              <span class="legend-info"><i class="bi bi-info-circle"></i> Click marker to inspect details</span>
            </div>
            <div #publicMapContainer class="leaflet-public-map"></div>
          </div>
        </div>

        <!-- VIEW 2: CARD GRID -->
        <div class="public-grid" *ngIf="viewMode === 'grid'">
          <div class="no-results card" *ngIf="filteredComplaints.length === 0">
            <i class="bi bi-folder-x"></i>
            <h3>No Complaints Found</h3>
            <p>Try clearing or adjusting your search filters to view more grievances.</p>
            <button class="btn btn-secondary btn-sm" (click)="resetFilters()">Clear Filters</button>
          </div>

          <div
            class="public-issue-card card card-hover"
            *ngFor="let item of filteredComplaints"
            [class.border-emergency]="item.priority === 'P0'"
          >
            <!-- Card Header -->
            <div class="card-head">
              <div class="head-badges">
                <app-priority-badge
                  [priority]="item.priority"
                  [label]="item.priority"
                  [score]="item.priorityScore"
                  [showScore]="true"
                ></app-priority-badge>
                <app-status-badge [status]="item.status"></app-status-badge>
                <span class="hotspot-flag" *ngIf="item.hotspotClusterId">
                  <i class="bi bi-fire"></i> Hotspot
                </span>
              </div>
              <span class="complaint-id-tag">{{ item.id }}</span>
            </div>

            <!-- Optional Image -->
            <div class="card-photo-box" *ngIf="item.photoUrl">
              <img [src]="item.photoUrl" [alt]="item.title" class="card-photo" loading="lazy" />
            </div>

            <!-- Card Body -->
            <div class="card-body">
              <div class="cat-trans-row">
                <span class="issue-cat-tag">{{ item.category }} &bull; {{ item.subcategory }}</span>
                <span class="badge badge-indic-sm" *ngIf="item.detectedLanguage && item.detectedLanguage !== 'en'">
                  <i class="bi bi-translate"></i> {{ item.detectedLanguage.toUpperCase() }} Translated
                </span>
              </div>
              <h3 class="issue-title">{{ item.title }}</h3>
              <p class="issue-desc">{{ item.description }}</p>

              <!-- Vernacular snippet preview if present -->
              <div class="indic-preview-chip" *ngIf="item.originalText && item.detectedLanguage && item.detectedLanguage !== 'en'">
                <i class="bi bi-chat-quote"></i> <em>"{{ item.originalText }}"</em>
              </div>

              <div class="priority-reason-strip">
                <i class="bi bi-cpu text-saffron"></i>
                <span>{{ item.priorityReason }}</span>
              </div>
            </div>

            <!-- Meta & Footprint -->
            <div class="card-meta">
              <div class="meta-item">
                <i class="bi bi-geo-alt-fill text-saffron"></i>
                <span class="meta-val">{{ item.location.address }} ({{ item.location.area }})</span>
              </div>
              <div class="meta-item">
                <i class="bi bi-building"></i>
                <span class="meta-val">{{ item.department }}</span>
              </div>
              <div class="meta-item">
                <i class="bi bi-calendar3"></i>
                <span class="meta-val">Submitted {{ item.submittedAt | date:'mediumDate' }} &bull; Age: {{ item.issueAge }}</span>
              </div>
            </div>

            <!-- Card Footer: Citizen Attribution & Track Action -->
            <div class="card-footer">
              <div class="citizen-attribution">
                <i class="bi bi-person-circle"></i>
                <span>{{ getMaskedCitizen(item) }}</span>
                <span class="privacy-lock" title="Phone & Email protected"><i class="bi bi-lock-fill"></i></span>
              </div>
              <a [routerLink]="['/track']" [queryParams]="{id: item.id}" class="btn btn-sm btn-outline-navy">
                <i class="bi bi-crosshair2"></i> Track Timeline &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .public-banner {
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
    .banner-title-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }
    .page-title {
      font-size: 2.25rem;
      color: #ffffff;
      margin-bottom: 0.5rem;
    }
    .page-subtitle {
      color: #cbd5e1;
      font-size: 1rem;
      max-width: 680px;
      margin: 0;
    }
    .privacy-seal {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.2);
      padding: 0.75rem 1.25rem;
      border-radius: var(--radius-md);
    }
    .privacy-seal i { font-size: 1.75rem; }
    .privacy-seal strong { display: block; color: #ffffff; font-size: 0.85rem; }
    .privacy-seal span { font-size: 0.75rem; color: #94a3b8; }
    .text-green { color: #22c55e; }

    .public-content {
      padding: 2.5rem 1.25rem;
    }

    .filter-card {
      padding: 1.5rem;
      margin-bottom: 2rem;
    }
    .filter-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }
    .search-box {
      position: relative;
      flex: 1;
      min-width: 280px;
    }
    .search-box i {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
    }
    .search-box input {
      padding-left: 2.25rem;
    }

    .view-toggle {
      display: flex;
      background: var(--navy-50);
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .view-btn {
      border: none;
      background: none;
      padding: 0.5rem 1rem;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.15s;
    }
    .view-btn.active {
      background: var(--navy-900);
      color: #ffffff;
    }

    .filters-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-light);
    }
    .filter-label {
      display: block;
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--navy-900);
      margin-bottom: 0.35rem;
    }

    /* Map View */
    .map-card-full {
      overflow: hidden;
      border-radius: var(--radius-lg);
    }
    .map-legend {
      padding: 0.85rem 1.25rem;
      background: #ffffff;
      border-bottom: 1px solid var(--border-light);
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.8125rem;
    }
    .legend-title { font-weight: 700; color: var(--navy-900); }
    .legend-item { display: inline-flex; align-items: center; gap: 0.35rem; }
    .legend-info { margin-left: auto; color: var(--text-muted); }
    .leaflet-public-map {
      width: 100%;
      height: 580px;
    }

    /* Card Grid View */
    .public-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
    .no-results {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
    }
    .no-results i { font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem; }

    .public-issue-card {
      display: flex;
      flex-direction: column;
    }
    .border-emergency {
      border: 2px solid #ef4444 !important;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
    }
    .card-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid var(--border-light);
    }
    .head-badges {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      flex-wrap: wrap;
    }
    .hotspot-flag {
      background: #fee2e2;
      color: #991b1b;
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 999px;
      font-weight: 700;
    }
    .complaint-id-tag {
      font-family: monospace;
      font-weight: 700;
      color: var(--navy-900);
      font-size: 0.8125rem;
    }
    .card-photo-box {
      height: 180px;
      overflow: hidden;
      background: #000;
    }
    .card-photo {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s;
    }
    .public-issue-card:hover .card-photo {
      transform: scale(1.04);
    }
    .card-body {
      padding: 1.25rem;
      flex-grow: 1;
    }
    .cat-trans-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.35rem;
      gap: 0.5rem;
    }
    .badge-indic-sm {
      background: #fff7ed;
      color: #c2410c;
      border: 1px solid #fed7aa;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.15rem 0.5rem;
      border-radius: 9999px;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      white-space: nowrap;
    }
    .indic-preview-chip {
      background: #f8fafc;
      border-left: 3px solid #ea580c;
      padding: 0.4rem 0.6rem;
      margin-bottom: 0.65rem;
      font-size: 0.8125rem;
      color: #475569;
      border-radius: 0 4px 4px 0;
    }
    .issue-cat-tag {
      font-size: 0.75rem;
      color: var(--saffron-600);
      font-weight: 700;
      text-transform: uppercase;
      display: block;
      margin-bottom: 0.35rem;
    }
    .issue-title {
      font-size: 1.05rem;
      color: var(--navy-900);
      margin-bottom: 0.5rem;
      line-height: 1.35;
    }
    .issue-desc {
      font-size: 0.825rem;
      color: var(--text-muted);
      line-height: 1.5;
      margin-bottom: 1rem;
    }
    .priority-reason-strip {
      background: #f8fafc;
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-light);
      font-size: 0.775rem;
      color: #475569;
      display: flex;
      align-items: flex-start;
      gap: 0.4rem;
    }

    .card-meta {
      padding: 0.85rem 1.25rem;
      background: #fafaf9;
      border-top: 1px solid var(--border-light);
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.775rem;
      color: var(--text-muted);
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .meta-val {
      color: var(--text-main);
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1.25rem;
      border-top: 1px solid var(--border-light);
      font-size: 0.8125rem;
    }
    .citizen-attribution {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      color: var(--text-muted);
      font-size: 0.775rem;
    }
    .privacy-lock {
      color: #0284c7;
      font-size: 0.75rem;
    }

    @media (max-width: 1024px) {
      .public-grid { grid-template-columns: repeat(2, 1fr); }
      .filters-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 640px) {
      .public-grid { grid-template-columns: 1fr; }
      .filters-grid { grid-template-columns: 1fr; }
      .banner-title-row { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class PublicIssuesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('publicMapContainer') publicMapContainerRef!: ElementRef;

  complaintService = inject(ComplaintService);
  langService = inject(LanguageService);

  searchTerm = '';
  selectedCategory = '';
  selectedPriority = '';
  selectedStatus = '';
  sortBy = 'score';

  viewMode: 'grid' | 'map' = 'grid';
  map!: L.Map;
  markersLayer = L.layerGroup();

  categories: ComplaintCategory[] = [
    'Roads & Potholes',
    'Garbage & Sanitation',
    'Sewage & Drainage',
    'Water Supply',
    'Streetlights & Electricity',
    'Parks & Gardens',
    'Footpaths',
    'Public Toilets',
    'Stray Animals',
    'Other Issues'
  ];

  statuses: ComplaintStatus[] = [
    'Submitted',
    'Under Review',
    'Assigned',
    'In Progress',
    'Resolved',
    'Closed'
  ];

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (this.viewMode === 'map') {
      setTimeout(() => this.initMap(), 200);
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  get filteredComplaints(): Complaint[] {
    let list = [...this.complaintService.complaints()];

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase().trim();
      list = list.filter(
        c =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.subcategory.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q) ||
          c.location.area.toLowerCase().includes(q) ||
          c.location.address.toLowerCase().includes(q)
      );
    }

    if (this.selectedCategory) {
      list = list.filter(c => c.category === this.selectedCategory);
    }

    if (this.selectedPriority) {
      list = list.filter(c => c.priority === this.selectedPriority);
    }

    if (this.selectedStatus) {
      list = list.filter(c => c.status === this.selectedStatus);
    }

    // Sort
    if (this.sortBy === 'score') {
      list.sort((a, b) => b.priorityScore - a.priorityScore);
    } else if (this.sortBy === 'newest') {
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    } else if (this.sortBy === 'oldest') {
      list.sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
    }

    return list;
  }

  switchView(mode: 'grid' | 'map'): void {
    this.viewMode = mode;
    if (mode === 'map') {
      setTimeout(() => {
        this.initMap();
      }, 200);
    }
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedCategory = '';
    this.selectedPriority = '';
    this.selectedStatus = '';
    this.sortBy = 'score';
  }

  getMaskedCitizen(c: Complaint): string {
    if (c.citizen.isAnonymous) {
      return 'Anonymous Citizen';
    }
    const parts = c.citizen.name.split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    }
    return c.citizen.name;
  }

  initMap(): void {
    if (!this.publicMapContainerRef) return;
    if (this.map) {
      this.map.remove();
    }

    // Centered on Hyderabad
    this.map = L.map(this.publicMapContainerRef.nativeElement).setView([17.4200, 78.4500], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &bull; Akhand Bharat Seva'
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);
    this.renderMapMarkers();
  }

  renderMapMarkers(): void {
    this.markersLayer.clearLayers();
    const items = this.filteredComplaints;

    items.forEach(c => {
      let color = '#0284c7';
      if (c.priority === 'P0') color = '#dc2626';
      else if (c.priority === 'P1') color = '#ea580c';
      else if (c.priority === 'P2') color = '#d97706';

      const circle = L.circleMarker([c.location.latitude, c.location.longitude], {
        radius: c.priority === 'P0' ? 10 : 8,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
        className: c.priority === 'P0' ? 'p0-pulse-marker' : ''
      });

      const popupHtml = `
        <div style="min-width: 220px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="font-family: monospace; color: #0f2347;">${c.id}</strong>
            <span style="background: ${color}; color: #fff; padding: 2px 6px; border-radius: 999px; font-size: 10px; font-weight: bold;">${c.priority}</span>
          </div>
          <h4 style="margin: 0 0 4px; font-size: 13px; color: #0f2347;">${c.title}</h4>
          <p style="margin: 0 0 6px; font-size: 11px; color: #64748b;">${c.location.address}</p>
          <a href="/track?id=${c.id}" style="display: inline-block; background: #0f2347; color: #fff; padding: 3px 8px; border-radius: 4px; font-size: 11px; text-decoration: none;">Track Grievance &rarr;</a>
        </div>
      `;

      circle.bindPopup(popupHtml);
      this.markersLayer.addLayer(circle);
    });
  }
}
