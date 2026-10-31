import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComplaintService } from '../../services/complaint.service';
import { DepartmentSummary } from '../../models/complaint.model';

@Component({
  selector: 'app-admin-departments',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="admin-depts-page">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Municipal Departments & Workload Management</h1>
          <p class="page-subtitle">Dynamic resource allocation and capacity monitoring across GHMC, HMWSSB, and TSSPDCL</p>
        </div>
      </div>

      <!-- Capacity Alert Strip if any overloaded -->
      <div class="card alert-box alert-box-warning" *ngIf="hasOverloadedDepts()">
        <i class="bi bi-exclamation-triangle-fill"></i>
        <div>
          <strong>Department Capacity Warning:</strong>
          <span>One or more departments have active emergency tickets or high caseload. Consider reassigning cross-zonal engineering squads.</span>
        </div>
      </div>

      <!-- Department Cards Grid -->
      <div class="depts-grid">
        <div
          class="dept-card card card-hover"
          *ngFor="let d of departmentsSummary"
          [class.overloaded-border]="d.capacityStatus === 'Overloaded'"
        >
          <div class="dept-card-top">
            <div class="dept-title-wrap">
              <span class="dept-badge">{{ d.capacityStatus }}</span>
              <h3 class="dept-name">{{ d.name }}</h3>
            </div>
            <span class="p0-counter" *ngIf="d.emergencyCount > 0">
              <i class="bi bi-exclamation-octagon-fill"></i> {{ d.emergencyCount }} P0
            </span>
          </div>

          <div class="dept-metrics-row">
            <div class="d-metric">
              <span class="dm-val">{{ d.totalComplaints }}</span>
              <span class="dm-lbl">Total Logged</span>
            </div>
            <div class="d-metric">
              <span class="dm-val text-warning">{{ d.activeComplaints }}</span>
              <span class="dm-lbl">Active Pending</span>
            </div>
            <div class="d-metric">
              <span class="dm-val text-green">{{ d.resolvedComplaints }}</span>
              <span class="dm-lbl">Resolved</span>
            </div>
            <div class="d-metric">
              <span class="dm-val">{{ d.staffAssigned }}</span>
              <span class="dm-lbl">Field Staff</span>
            </div>
          </div>

          <!-- Capacity Bar -->
          <div class="capacity-bar-wrap">
            <div class="cap-labels">
              <span>Workload Capacity Utilization</span>
              <strong>{{ getUtilizationPct(d) }}%</strong>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill"
                [style.width.%]="getUtilizationPct(d)"
                [ngClass]="getFillClass(d)"
              ></div>
            </div>
          </div>

          <div class="dept-card-footer">
            <a
              [routerLink]="['/admin/all-complaints']"
              [queryParams]="{dept: d.name}"
              class="btn btn-outline-navy btn-sm"
            >
              View Department Tickets &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-depts-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header-row { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 1.85rem; color: var(--navy-900); margin: 0 0 0.25rem; }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
    .depts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .dept-card { padding: 1.75rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .overloaded-border { border: 2px solid #ef4444 !important; }
    .dept-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
    .dept-badge { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 2px 7px; border-radius: 999px; background: #e0f2fe; color: #0369a1; display: inline-block; margin-bottom: 0.4rem; }
    .dept-name { font-size: 1.15rem; color: var(--navy-900); margin: 0; line-height: 1.3; }
    .p0-counter { background: #fee2e2; color: #dc2626; padding: 3px 8px; border-radius: 999px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem; }
    .dept-metrics-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; background: var(--bg-page); padding: 1rem; border-radius: var(--radius-md); text-align: center; }
    .d-metric { display: flex; flex-direction: column; }
    .dm-val { font-size: 1.35rem; font-weight: 800; color: var(--navy-900); font-family: var(--font-display); }
    .dm-lbl { font-size: 0.7rem; color: var(--text-muted); margin-top: 2px; }
    .text-green { color: #16a34a; }
    .text-warning { color: #ea580c; }
    .capacity-bar-wrap { display: flex; flex-direction: column; gap: 0.35rem; }
    .cap-labels { display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); }
    .progress-track { height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 999px; transition: width 0.3s ease; }
    .bg-green { background: #22c55e; }
    .bg-yellow { background: #f59e0b; }
    .bg-red { background: #ef4444; }
    .dept-card-footer { display: flex; justify-content: flex-end; padding-top: 0.5rem; }
    @media (max-width: 960px) { .depts-grid { grid-template-columns: 1fr; } }
  `]
})
export class AdminDepartmentsComponent implements OnInit {
  complaintService = inject(ComplaintService);

  departmentsSummary: DepartmentSummary[] = [];

  ngOnInit(): void {
    this.departmentsSummary = this.complaintService.getDepartmentsSummary();
  }

  hasOverloadedDepts(): boolean {
    return this.departmentsSummary.some(d => d.capacityStatus === 'Overloaded');
  }

  getUtilizationPct(d: DepartmentSummary): number {
    const raw = (d.activeComplaints / 8) * 100;
    return Math.min(100, Math.round(raw));
  }

  getFillClass(d: DepartmentSummary): string {
    const pct = this.getUtilizationPct(d);
    if (pct > 75 || d.emergencyCount > 0) return 'bg-red';
    if (pct > 40) return 'bg-yellow';
    return 'bg-green';
  }
}
