import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ComplaintService } from '../../services/complaint.service';
import {
  Complaint,
  ComplaintStatus,
  DepartmentType,
  PriorityLevel
} from '../../models/complaint.model';
import { PriorityBadgeComponent } from '../../components/priority-badge/priority-badge.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-priority-queue',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PriorityBadgeComponent, StatusBadgeComponent],
  template: `
    <div class="priority-queue-page">
      <!-- Header -->
      <div class="queue-header">
        <div>
          <div class="engine-badge-tag">
            <i class="bi bi-cpu-fill text-warning"></i>
            <span>RULES-BASED DETERMINISTIC ENGINE V2.6</span>
          </div>
          <h1 class="page-title">Smart Priority Queue</h1>
          <p class="page-subtitle">
            Ranked by Smart Score: Immediate danger & life-safety (P0) outranks all, followed by severity, public impact, and unresolved waiting time.
          </p>
        </div>
        <div class="header-btns">
          <button (click)="complaintService.exportComplaintsToCsv()" class="btn btn-secondary btn-sm">
            <i class="bi bi-download"></i> Export CSV
          </button>
        </div>
      </div>

      <!-- Engine Logic Alert Banner -->
      <div class="engine-rule-card card">
        <div class="rule-icon"><i class="bi bi-lightbulb-fill text-saffron"></i></div>
        <div class="rule-text">
          <strong>Key Ranking Verification:</strong>
          <span>
            Brand-new P0 emergencies (e.g. <strong>ABS-2026-0001</strong> live wire) score &ge; 1000 pts and rank at the very top.
            Notice how the 7-day-old unresolved medium complaint (<strong>ABS-2026-0005</strong> Charminar waste, 430 pts) ranks <em>above</em> the 1-day-old medium complaint (<strong>ABS-2026-0012</strong> Jubilee Hills, 280 pts) due to age weighting!
          </span>
        </div>
      </div>

      <!-- Quick Status Filter Chips -->
      <div class="quick-status-chips">
        <button
          class="status-chip"
          [class.active]="statusFilter === '' && priorityFilter === ''"
          (click)="resetFilters()"
        >
          All Grievances ({{ complaintService.complaints().length }})
        </button>
        <button
          class="status-chip chip-p0"
          [class.active]="priorityFilter === 'P0'"
          (click)="priorityFilter = 'P0'; statusFilter = ''"
        >
          <span class="pulse-dot-red"></span> P0 Emergencies ({{ getP0Count() }})
        </button>
        <button
          class="status-chip"
          [class.active]="statusFilter === 'active'"
          (click)="statusFilter = 'active'; priorityFilter = ''"
        >
          Active Unresolved ({{ getActiveCount() }})
        </button>
        <button
          class="status-chip"
          [class.active]="statusFilter === 'In Progress'"
          (click)="statusFilter = 'In Progress'; priorityFilter = ''"
        >
          In Progress ({{ getInProgressCount() }})
        </button>
        <button
          class="status-chip"
          [class.active]="statusFilter === 'Resolved'"
          (click)="statusFilter = 'Resolved'; priorityFilter = ''"
        >
          Resolved ({{ getResolvedCount() }})
        </button>
      </div>

      <!-- Filter & Search Toolbar -->
      <div class="card filter-bar">
        <div class="search-box">
          <i class="bi bi-search"></i>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search by ID, keyword, locality, or department..."
            class="form-control"
          />
        </div>

        <div class="filter-controls">
          <select [(ngModel)]="priorityFilter" class="form-control filter-select">
            <option value="">All Priorities</option>
            <option value="P0">P0 — Emergency Only</option>
            <option value="P1">P1 — High</option>
            <option value="P2">P2 — Medium</option>
            <option value="P3">P3 — Low</option>
          </select>

          <select [(ngModel)]="statusFilter" class="form-control filter-select">
            <option value="">All Statuses (Active First)</option>
            <option value="active">Active Only (Unresolved)</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select [(ngModel)]="departmentFilter" class="form-control filter-select">
            <option value="">All Departments</option>
            <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
          </select>

          <button (click)="resetFilters()" class="btn btn-secondary btn-sm">
            <i class="bi bi-arrow-counterclockwise"></i> Reset
          </button>
        </div>
      </div>

      <!-- THE PRIORITY QUEUE TABLE -->
      <div class="card queue-table-card">
        <div class="table-responsive">
          <table class="queue-table">
            <thead>
              <tr>
                <th style="width: 50px;">Rank</th>
                <th>Score</th>
                <th>ID</th>
                <th>Priority</th>
                <th>Title & Category</th>
                <th>Location / Area</th>
                <th>Waiting Time</th>
                <th>Public Impact</th>
                <th>Department</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                *ngFor="let item of sortedQueue; let idx = index"
                [class.row-emergency]="item.priority === 'P0'"
                [class.row-resolved]="item.status === 'Resolved' || item.status === 'Closed'"
                (click)="openTriage(item)"
              >
                <!-- Rank -->
                <td class="rank-cell">
                  <span class="rank-circle" [class.rank-top]="idx < 3">{{ idx + 1 }}</span>
                </td>

                <!-- Score -->
                <td>
                  <span class="score-tag font-mono">{{ item.priorityScore }} pts</span>
                </td>

                <!-- ID -->
                <td>
                  <span class="id-tag font-mono">{{ item.id }}</span>
                </td>

                <!-- Priority -->
                <td>
                  <app-priority-badge [priority]="item.priority" [label]="item.priority"></app-priority-badge>
                </td>

                <!-- Title & Category -->
                <td class="title-cell">
                  <span class="queue-title">{{ item.title }}</span>
                  <div class="queue-cat-row">
                    <span class="cat-pill">{{ item.category }}</span>
                    <span class="hotspot-pill" *ngIf="item.hotspotClusterId">
                      <i class="bi bi-fire"></i> Hotspot ({{ item.hotspotCount }})
                    </span>
                    <span class="duplicate-pill" *ngIf="item.duplicateAlert">
                      <i class="bi bi-copy"></i> Duplicate Alert
                    </span>
                  </div>
                </td>

                <!-- Location -->
                <td>
                  <span class="loc-text">{{ item.location.area }}</span>
                  <span class="loc-sub">{{ item.location.address | slice:0:35 }}...</span>
                </td>

                <!-- Waiting Time -->
                <td>
                  <span class="wait-time" [class.text-danger]="getWaitingDays(item) >= 5">
                    <i class="bi bi-clock"></i> {{ getWaitingTimeText(item) }}
                  </span>
                  <span class="age-reported">Reported: {{ item.issueAge }}</span>
                </td>

                <!-- Public Impact -->
                <td>
                  <span class="impact-text">{{ getShortImpact(item.publicImpact) }}</span>
                </td>

                <!-- Department -->
                <td>
                  <span class="dept-text">{{ item.department.split('(')[0] }}</span>
                </td>

                <!-- Status -->
                <td>
                  <app-status-badge [status]="item.status"></app-status-badge>
                </td>

                <!-- Actions Button -->
                <td>
                  <button
                    class="btn btn-sm btn-primary"
                    (click)="$event.stopPropagation(); openTriage(item)"
                  >
                    Triage &rarr;
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- TRIAGE & ACTION MODAL -->
      <div class="modal-overlay" *ngIf="activeComplaint" (click)="closeTriage()">
        <div class="modal-content triage-modal" (click)="$event.stopPropagation()">
          <div class="triage-modal-header">
            <div class="header-left-wrap">
              <span class="modal-id font-mono">{{ activeComplaint.id }}</span>
              <app-priority-badge [priority]="activeComplaint.priority" [label]="activeComplaint.priority" [score]="activeComplaint.priorityScore" [showScore]="true"></app-priority-badge>
              <app-status-badge [status]="activeComplaint.status"></app-status-badge>
            </div>
            <button class="close-btn" (click)="closeTriage()">&times;</button>
          </div>

          <div class="triage-modal-body">
            <h2 class="modal-complaint-title">{{ activeComplaint.title }}</h2>

            <!-- Hotspot / Duplicate Warnings -->
            <div class="alert-box alert-box-danger mb-3" *ngIf="activeComplaint.duplicateAlert">
              <i class="bi bi-exclamation-triangle-fill"></i>
              <div>
                <strong>Potential Duplicate Grievance Detected:</strong>
                <span>{{ activeComplaint.duplicateAlert }}</span>
              </div>
            </div>

            <div class="alert-box alert-box-warning mb-3" *ngIf="activeComplaint.hotspotClusterId">
              <i class="bi bi-fire"></i>
              <div>
                <strong>Geographic Cluster Hotspot:</strong>
                <span>{{ activeComplaint.hotspotCount }} related complaints detected within 350 meters in {{ activeComplaint.location.area }}.</span>
              </div>
            </div>

            <!-- Priority Reason Box -->
            <div class="priority-explanation-box">
              <div class="pe-head">
                <i class="bi bi-cpu-fill text-saffron"></i>
                <strong>Engine Priority Justification:</strong>
              </div>
              <p class="pe-reason">{{ activeComplaint.priorityReason }}</p>
            </div>

            <!-- Dual-Language Indic AI Translation Box if present -->
            <div class="indic-triage-card" *ngIf="activeComplaint.detectedLanguage && activeComplaint.detectedLanguage !== 'en'">
              <div class="indic-triage-header">
                <span class="badge-indic">
                  <i class="bi bi-translate"></i> Gemma 4 Indic NLU Verified ({{ activeComplaint.detectedLanguage.toUpperCase() }})
                </span>
                <span class="indic-triage-tag"><i class="bi bi-shield-check"></i> Citizen Vernacular Preserved</span>
              </div>
              <div class="indic-triage-body">
                <div class="triage-lang-col">
                  <span class="col-lbl">Original Citizen Report ({{ activeComplaint.detectedLanguage === 'te' ? 'Telugu' : activeComplaint.detectedLanguage === 'hi' ? 'Hindi' : 'Vernacular' }})</span>
                  <p class="triage-indic-text">{{ activeComplaint.originalText || activeComplaint.description }}</p>
                </div>
                <div class="triage-lang-col">
                  <span class="col-lbl">Gemma 4 Verified English Summary</span>
                  <p class="triage-trans-text">{{ activeComplaint.translatedEnglishReport || activeComplaint.staffSummary || activeComplaint.description }}</p>
                </div>
              </div>
            </div>

            <!-- Details Summary Grid -->
            <div class="triage-info-grid">
              <div class="info-row">
                <span class="info-label">Category:</span>
                <span class="info-val">{{ activeComplaint.category }} &bull; {{ activeComplaint.subcategory }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Location:</span>
                <span class="info-val">{{ activeComplaint.location.address }}, {{ activeComplaint.location.area }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">GPS Coordinates:</span>
                <span class="info-val font-mono">Lat {{ activeComplaint.location.latitude.toFixed(4) }}, Lng {{ activeComplaint.location.longitude.toFixed(4) }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Submission Date:</span>
                <span class="info-val">{{ activeComplaint.submittedAt | date:'medium' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Citizen Contact:</span>
                <span class="info-val font-semibold">
                  {{ activeComplaint.citizen.name }} ({{ activeComplaint.citizen.phone }})
                  <span class="badge badge-secondary" *ngIf="activeComplaint.citizen.isAnonymous">Masked in public view</span>
                </span>
              </div>
            </div>

            <!-- Photo Preview -->
            <div class="triage-photo-box" *ngIf="activeComplaint.photoUrl">
              <img [src]="activeComplaint.photoUrl" [alt]="activeComplaint.title" class="triage-photo" />
            </div>

            <!-- WORKFLOW ACTIONS ACCORDION -->
            <div class="triage-actions-section">
              <h3 class="section-heading"><i class="bi bi-tools"></i> Officer Actions & Triage</h3>

              <!-- 1. Change Status -->
              <div class="action-card">
                <label class="action-label">Update Status</label>
                <div class="status-action-row">
                  <select [(ngModel)]="newStatus" class="form-control select-compact">
                    <option *ngFor="let s of allStatuses" [value]="s">{{ s }}</option>
                  </select>
                  <input
                    type="text"
                    [(ngModel)]="statusRemarks"
                    placeholder="Status update remarks / ground report..."
                    class="form-control"
                  />
                  <button (click)="submitStatusUpdate()" class="btn btn-primary btn-sm">
                    Update Status
                  </button>
                </div>
              </div>

              <!-- 2. Reassign Department -->
              <div class="action-card">
                <label class="action-label">Reassign Department</label>
                <div class="status-action-row">
                  <select [(ngModel)]="newDepartment" class="form-control select-compact">
                    <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
                  </select>
                  <input
                    type="text"
                    [(ngModel)]="deptRemarks"
                    placeholder="Reason for reassignment..."
                    class="form-control"
                  />
                  <button (click)="submitDeptReassign()" class="btn btn-secondary btn-sm">
                    Reassign
                  </button>
                </div>
              </div>

              <!-- 3. Manual Priority Override -->
              <div class="action-card">
                <label class="action-label">Administrative Priority Override</label>
                <div class="status-action-row">
                  <select [(ngModel)]="newPriority" class="form-control select-compact">
                    <option value="P0">P0 — Emergency</option>
                    <option value="P1">P1 — High</option>
                    <option value="P2">P2 — Medium</option>
                    <option value="P3">P3 — Low</option>
                  </select>
                  <input
                    type="text"
                    [(ngModel)]="overrideReason"
                    placeholder="Mandatory justification for priority override..."
                    class="form-control"
                  />
                  <button (click)="submitPriorityOverride()" class="btn btn-danger btn-sm">
                    Override Priority
                  </button>
                </div>
              </div>

              <!-- 4. Internal Admin Notes -->
              <div class="action-card">
                <label class="action-label">Add Internal Officer Note (Private)</label>
                <div class="status-action-row">
                  <input
                    type="text"
                    [(ngModel)]="newNote"
                    placeholder="Internal note (only visible to municipal officers)..."
                    class="form-control"
                  />
                  <button (click)="submitAddNote()" class="btn btn-secondary btn-sm">
                    Add Note
                  </button>
                </div>

                <!-- Existing notes -->
                <div class="notes-list" *ngIf="activeComplaint.adminNotes.length > 0">
                  <div class="note-bubble" *ngFor="let note of activeComplaint.adminNotes">
                    <div class="note-top">
                      <strong>{{ note.author }}</strong>
                      <span>{{ note.timestamp | date:'short' }}</span>
                    </div>
                    <p class="note-body">{{ note.note }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="triage-modal-footer">
            <button class="btn btn-secondary" (click)="closeTriage()">Close</button>
            <a [routerLink]="['/track']" [queryParams]="{id: activeComplaint.id}" target="_blank" class="btn btn-outline-navy">
              Open Public Citizen View <i class="bi bi-box-arrow-up-right"></i>
            </a>
          </div>
        </div>
      </div>

      <!-- Floating Admin Toast Notification -->
      <div class="admin-toast-banner" *ngIf="toastMessage">
        <i class="bi bi-check-circle-fill"></i>
        <span>{{ toastMessage }}</span>
      </div>
    </div>
  `,
  styles: [`
    .priority-queue-page {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .queue-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .engine-badge-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 2px 8px;
      background: #1e293b;
      color: var(--saffron-400);
      font-size: 0.725rem;
      font-weight: 700;
      border-radius: 999px;
      margin-bottom: 0.4rem;
    }
    .page-title {
      font-size: 1.85rem;
      color: var(--navy-900);
      margin: 0 0 0.25rem;
    }
    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin: 0;
    }

    .engine-rule-card {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      padding: 1rem 1.25rem;
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      border-radius: var(--radius-md);
    }
    .rule-icon { font-size: 1.5rem; color: #16a34a; }
    .rule-text { font-size: 0.825rem; color: #166534; line-height: 1.5; }
    .rule-text strong { display: block; margin-bottom: 2px; }

    .filter-bar {
      padding: 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
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
    .filter-controls {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .filter-select {
      width: auto;
      min-width: 150px;
      font-size: 0.85rem;
    }

    /* Queue Table */
    .queue-table-card {
      overflow: hidden;
    }
    .queue-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.85rem;
    }
    .queue-table th {
      padding: 0.85rem 1rem;
      background: var(--navy-900);
      color: #ffffff;
      font-weight: 700;
      font-size: 0.775rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      white-space: nowrap;
    }
    .queue-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--border-light);
      vertical-align: middle;
      cursor: pointer;
    }
    .queue-table tr:hover {
      background: #f8fafc;
    }
    .row-emergency {
      background: #fff5f5 !important;
    }
    .row-emergency:hover {
      background: #fee2e2 !important;
    }
    .row-resolved {
      opacity: 0.65;
    }

    .rank-cell { text-align: center; }
    .rank-circle {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #475569;
      font-weight: 700;
      font-size: 0.75rem;
    }
    .rank-top {
      background: var(--saffron-500);
      color: #ffffff;
    }

    .font-mono { font-family: monospace; }
    .score-tag {
      font-weight: 800;
      color: var(--navy-900);
      background: var(--navy-50);
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.8rem;
    }
    .id-tag {
      font-weight: 700;
      color: var(--navy-900);
    }
    .title-cell {
      max-width: 280px;
    }
    .queue-title {
      display: block;
      font-weight: 600;
      color: var(--navy-900);
      line-height: 1.3;
      margin-bottom: 3px;
    }
    .queue-cat-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.35rem;
    }
    .cat-pill {
      font-size: 0.7rem;
      color: var(--text-muted);
      background: var(--bg-page);
      padding: 1px 6px;
      border-radius: 4px;
    }
    .hotspot-pill {
      background: #fee2e2;
      color: #991b1b;
      font-size: 0.65rem;
      padding: 1px 5px;
      border-radius: 999px;
      font-weight: 700;
    }
    .duplicate-pill {
      background: #fef3c7;
      color: #92400e;
      font-size: 0.65rem;
      padding: 1px 5px;
      border-radius: 999px;
      font-weight: 700;
    }
    .loc-text { display: block; font-weight: 600; font-size: 0.8rem; color: var(--navy-900); }
    .loc-sub { display: block; font-size: 0.725rem; color: var(--text-muted); }
    .wait-time { display: block; font-weight: 600; font-size: 0.8rem; }
    .age-reported { display: block; font-size: 0.7rem; color: var(--text-muted); }
    .impact-text { font-size: 0.775rem; color: var(--text-muted); }
    .dept-text { font-size: 0.8rem; font-weight: 500; color: var(--navy-700); }

    /* Triage Modal */
    .triage-modal {
      max-width: 820px;
    }
    .triage-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.75rem;
      background: var(--navy-900);
      color: #ffffff;
      border-top-left-radius: var(--radius-lg);
      border-top-right-radius: var(--radius-lg);
    }
    .header-left-wrap {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .modal-id { font-size: 1.1rem; font-weight: 800; }
    .close-btn {
      background: none;
      border: none;
      color: #ffffff;
      font-size: 1.75rem;
      cursor: pointer;
    }
    .triage-modal-body {
      padding: 1.75rem;
      max-height: 75vh;
      overflow-y: auto;
    }
    .modal-complaint-title {
      font-size: 1.4rem;
      color: var(--navy-900);
      margin: 0 0 1rem;
      line-height: 1.3;
    }
    .priority-explanation-box {
      background: #fff7ed;
      border: 1px solid #fed7aa;
      padding: 0.85rem 1.25rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.25rem;
    }
    .pe-head {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: #9a3412;
      margin-bottom: 0.25rem;
    }
    .pe-reason {
      font-size: 0.8125rem;
      color: #7c2d12;
      margin: 0;
    }
    .triage-info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      background: #f8fafc;
      padding: 1.25rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-light);
      margin-bottom: 1.25rem;
      font-size: 0.85rem;
    }
    .info-row { display: flex; flex-direction: column; gap: 2px; }
    .info-label { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }
    .info-val { color: var(--navy-900); }

    .triage-photo-box {
      margin-bottom: 1.5rem;
    }
    .triage-photo {
      width: 100%;
      height: 200px;
      object-fit: cover;
      border-radius: var(--radius-md);
    }

    .triage-actions-section {
      border-top: 1px solid var(--border-light);
      padding-top: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .section-heading {
      font-size: 1.1rem;
      color: var(--navy-900);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .action-card {
      background: #ffffff;
      border: 1px solid var(--border-medium);
      padding: 1rem;
      border-radius: var(--radius-md);
    }
    .action-label {
      display: block;
      font-size: 0.8rem;
      font-weight: 700;
      color: var(--navy-900);
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .status-action-row {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }
    .select-compact { width: 170px; flex-shrink: 0; }

    .notes-list {
      margin-top: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .note-bubble {
      background: #f1f5f9;
      padding: 0.65rem 0.85rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
    }
    .note-top {
      display: flex;
      justify-content: space-between;
      color: var(--navy-900);
      font-size: 0.75rem;
      margin-bottom: 2px;
    }
    .note-body { margin: 0; color: var(--text-main); }

    .triage-modal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.75rem;
      background: #f8fafc;
      border-top: 1px solid var(--border-light);
      border-bottom-left-radius: var(--radius-lg);
      border-bottom-right-radius: var(--radius-lg);
    }

    @media (max-width: 960px) {
      .triage-info-grid { grid-template-columns: 1fr; }
      .filter-controls { width: 100%; }
      .filter-select { flex: 1; }
    }

    .quick-status-chips {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      margin-bottom: 0.75rem;
    }
    .status-chip {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      padding: 0.35rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.15s ease;
    }
    .status-chip:hover {
      background: #e2e8f0;
    }
    .status-chip.active {
      background: var(--navy-900, #0f172a);
      color: #ffffff;
      border-color: var(--navy-900, #0f172a);
    }
    .status-chip.chip-p0.active {
      background: #dc2626;
      border-color: #dc2626;
      color: #ffffff;
    }
    .pulse-dot-red {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: #ef4444;
      display: inline-block;
      animation: pulse 1.5s infinite;
    }
    .indic-triage-card {
      background: linear-gradient(135deg, rgba(255, 153, 51, 0.08) 0%, rgba(19, 136, 8, 0.06) 100%);
      border: 1px solid rgba(255, 153, 51, 0.35);
      border-radius: var(--radius-md, 8px);
      padding: 1rem;
      margin: 1rem 0;
    }
    .indic-triage-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }
    .indic-triage-tag {
      font-size: 0.75rem;
      color: #15803d;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
    }
    .indic-triage-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }
    .triage-lang-col {
      background: #ffffff;
      border: 1px solid rgba(0, 0, 0, 0.08);
      border-radius: 6px;
      padding: 0.75rem;
    }
    .col-lbl {
      display: block;
      font-size: 0.72rem;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      margin-bottom: 0.35rem;
    }
    .triage-indic-text {
      font-size: 0.92rem;
      line-height: 1.5;
      color: #1e293b;
      font-weight: 500;
      margin: 0;
    }
    .triage-trans-text {
      font-size: 0.875rem;
      line-height: 1.45;
      color: #0f172a;
      margin: 0;
    }
    .admin-toast-banner {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background: #0f172a;
      color: #ffffff;
      padding: 0.85rem 1.35rem;
      border-radius: 8px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.9rem;
      font-weight: 600;
      z-index: 99999;
      border-left: 4px solid #10b981;
      animation: slideUp 0.3s ease;
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `]
})
export class AdminPriorityQueueComponent implements OnInit {
  complaintService = inject(ComplaintService);
  private route = inject(ActivatedRoute);

  searchQuery = '';
  priorityFilter = '';
  statusFilter = '';
  departmentFilter = '';

  activeComplaint: Complaint | null = null;
  toastMessage: string | null = null;
  toastTimer: any = null;

  // Modal Action Form States
  newStatus: ComplaintStatus = 'In Progress';
  statusRemarks = '';
  newDepartment: DepartmentType = 'Roads & Bridges (GHMC)';
  deptRemarks = '';
  newPriority: PriorityLevel = 'P1';
  overrideReason = '';
  newNote = '';

  departments: DepartmentType[] = [
    'Roads & Bridges (GHMC)',
    'Solid Waste & Sanitation (GHMC)',
    'Sewage & Drainage (HMWSSB)',
    'Water Supply (HMWSSB)',
    'Electricity & Streetlights (TSSPDCL)',
    'Urban Forestry & Parks (GHMC)',
    'General Civic Services'
  ];

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
      const id = params['id'];
      if (id) {
        const found = this.complaintService.getComplaintById(id);
        if (found) {
          this.openTriage(found);
        }
      }
      if (params['priority']) {
        this.priorityFilter = params['priority'];
      }
      if (params['status']) {
        this.statusFilter = params['status'];
      }
    });
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = null;
    }, 3500);
  }

  getP0Count(): number {
    return this.complaintService.complaints().filter(c => c.priority === 'P0').length;
  }
  getActiveCount(): number {
    return this.complaintService.complaints().filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length;
  }
  getInProgressCount(): number {
    return this.complaintService.complaints().filter(c => c.status === 'In Progress').length;
  }
  getResolvedCount(): number {
    return this.complaintService.complaints().filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
  }

  get sortedQueue(): Complaint[] {
    let list = [...this.complaintService.complaints()];

    // Filtering
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      list = list.filter(
        c =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.location.area.toLowerCase().includes(q) ||
          c.department.toLowerCase().includes(q)
      );
    }

    if (this.priorityFilter) {
      list = list.filter(c => c.priority === this.priorityFilter);
    }

    if (this.statusFilter) {
      if (this.statusFilter === 'active') {
        list = list.filter(c => c.status !== 'Resolved' && c.status !== 'Closed');
      } else {
        list = list.filter(c => c.status === this.statusFilter);
      }
    }

    if (this.departmentFilter) {
      list = list.filter(c => c.department === this.departmentFilter);
    }

    // Sort by Smart Priority Score (highest score first)
    list.sort((a, b) => b.priorityScore - a.priorityScore);

    return list;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.priorityFilter = '';
    this.statusFilter = '';
    this.departmentFilter = '';
  }

  getWaitingDays(c: Complaint): number {
    return Math.floor((Date.now() - new Date(c.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
  }

  getWaitingTimeText(c: Complaint): string {
    const hours = Math.floor((Date.now() - new Date(c.submittedAt).getTime()) / (1000 * 60 * 60));
    if (hours < 24) {
      return `${hours} hrs ago`;
    }
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }

  getShortImpact(impact: string): string {
    if (impact.startsWith('Critical')) return 'Critical Arterial';
    if (impact.startsWith('High')) return 'Commercial Hub';
    if (impact.startsWith('Medium')) return 'Residential';
    return 'Local Lane';
  }

  openTriage(c: Complaint): void {
    this.activeComplaint = c;
    this.newStatus = c.status;
    this.statusRemarks = '';
    this.newDepartment = c.department;
    this.deptRemarks = '';
    this.newPriority = c.priority;
    this.overrideReason = '';
    this.newNote = '';
  }

  closeTriage(): void {
    this.activeComplaint = null;
  }

  submitStatusUpdate(): void {
    if (!this.activeComplaint) return;
    this.complaintService.updateStatus(
      this.activeComplaint.id,
      this.newStatus,
      this.statusRemarks || `Status changed to ${this.newStatus}`,
      'Zonal Officer'
    );
    // Refresh modal
    this.activeComplaint = this.complaintService.getComplaintById(this.activeComplaint.id) || null;
    this.showToast(`Status updated to "${this.newStatus}" successfully.`);
  }

  submitDeptReassign(): void {
    if (!this.activeComplaint) return;
    this.complaintService.reassignDepartment(
      this.activeComplaint.id,
      this.newDepartment,
      this.deptRemarks || 'Reassigned to matching jurisdiction',
      'Zonal Officer'
    );
    this.activeComplaint = this.complaintService.getComplaintById(this.activeComplaint.id) || null;
    this.showToast(`Department reassigned to ${this.newDepartment}.`);
  }

  submitPriorityOverride(): void {
    if (!this.activeComplaint) return;
    if (!this.overrideReason.trim()) {
      this.showToast('Mandatory justification is required to override automated priority.');
      return;
    }
    this.complaintService.overridePriority(
      this.activeComplaint.id,
      this.newPriority,
      this.overrideReason.trim(),
      'Zonal Commissioner'
    );
    this.activeComplaint = this.complaintService.getComplaintById(this.activeComplaint.id) || null;
    this.showToast(`Priority overridden to ${this.newPriority}.`);
  }

  submitAddNote(): void {
    if (!this.activeComplaint || !this.newNote.trim()) return;
    this.complaintService.addAdminNote(
      this.activeComplaint.id,
      this.newNote.trim(),
      'Zonal Officer'
    );
    this.newNote = '';
    this.activeComplaint = this.complaintService.getComplaintById(this.activeComplaint.id) || null;
    this.showToast('Internal officer note recorded.');
  }
}
