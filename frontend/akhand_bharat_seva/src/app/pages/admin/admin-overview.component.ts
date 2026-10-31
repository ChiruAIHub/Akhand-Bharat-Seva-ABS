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
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { ComplaintService } from '../../services/complaint.service';
import { PriorityBadgeComponent } from '../../components/priority-badge/priority-badge.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';
import { Complaint } from '../../models/complaint.model';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-overview',
  standalone: true,
  imports: [CommonModule, RouterModule, PriorityBadgeComponent, StatusBadgeComponent],
  template: `
    <div class="admin-overview">
      <!-- Page Header -->
      <div class="overview-header">
        <div>
          <h1 class="page-title">Executive Command Dashboard</h1>
          <p class="page-subtitle">
            Municipal jurisdiction: Greater Hyderabad Municipal Corporation (GHMC) & HMWSSB / TSSPDCL
          </p>
        </div>
        <div class="header-actions">
          <a routerLink="/admin/priority-queue" class="btn btn-saffron">
            <i class="bi bi-lightning-charge-fill"></i> Smart Priority Queue ({{ pendingCount() }})
          </a>
          <button (click)="complaintService.exportComplaintsToCsv()" class="btn btn-secondary">
            <i class="bi bi-download"></i> Export CSV
          </button>
        </div>
      </div>

      <!-- ACTIVE EMERGENCY BANNER (If P0 exists) -->
      <div class="emergency-alert-card card" *ngIf="getActiveP0List().length > 0">
        <div class="alert-icon-box">
          <i class="bi bi-exclamation-octagon-fill"></i>
        </div>
        <div class="alert-body">
          <div class="alert-top">
            <span class="badge badge-p0">P0 EMERGENCY ALERT &bull; {{ getActiveP0List().length }} ACTIVE</span>
            <span class="alert-time">Dispatched to Ground Response Team</span>
          </div>
          <h3 class="alert-title">{{ getActiveP0List()[0].title }}</h3>
          <p class="alert-details">
            Location: <strong>{{ getActiveP0List()[0].location.address }} ({{ getActiveP0List()[0].location.area }})</strong> &bull;
            Department: <strong>{{ getActiveP0List()[0].department }}</strong> &bull;
            Reason: <em>{{ getActiveP0List()[0].priorityReason }}</em>
          </p>
        </div>
        <div class="alert-action">
          <a [routerLink]="['/admin/priority-queue']" [queryParams]="{id: getActiveP0List()[0].id}" class="btn btn-danger btn-sm">
            Triage Emergency &rarr;
          </a>
        </div>
      </div>

      <!-- LONG-WAITING COMPLAINTS ALERT -->
      <div class="long-waiting-banner card" *ngIf="getLongWaitingComplaints().length > 0">
        <div class="lw-icon"><i class="bi bi-hourglass-bottom text-warning"></i></div>
        <div class="lw-text">
          <strong>SLA Alert: {{ getLongWaitingComplaints().length }} complaints have been unresolved for over 5 days.</strong>
          <span>Aging boost has elevated their position in the Smart Priority Queue.</span>
        </div>
        <a routerLink="/admin/priority-queue" class="btn btn-sm btn-outline-navy">Inspect Aging Queue</a>
      </div>

      <!-- KPI METRIC CARDS -->
      <div class="metrics-grid">
        <div class="metric-card card">
          <div class="metric-top">
            <span class="metric-label">Total Grievances</span>
            <span class="metric-icon-wrap bg-blue"><i class="bi bi-folder2"></i></span>
          </div>
          <div class="metric-number">{{ totalCount() }}</div>
          <div class="metric-sub text-muted">Across 10 civic categories</div>
        </div>

        <div class="metric-card card border-red">
          <div class="metric-top">
            <span class="metric-label">Active Emergencies</span>
            <span class="metric-icon-wrap bg-red"><i class="bi bi-exclamation-octagon-fill"></i></span>
          </div>
          <div class="metric-number text-danger">{{ activeEmergencyCount() }}</div>
          <div class="metric-sub text-danger">P0 immediate life hazard</div>
        </div>

        <div class="metric-card card">
          <div class="metric-top">
            <span class="metric-label">Under Action</span>
            <span class="metric-icon-wrap bg-orange"><i class="bi bi-gear-wide-connected"></i></span>
          </div>
          <div class="metric-number text-warning">{{ inProgressCount() }}</div>
          <div class="metric-sub text-muted">Assigned to field crews</div>
        </div>

        <div class="metric-card card">
          <div class="metric-top">
            <span class="metric-label">Resolved Issues</span>
            <span class="metric-icon-wrap bg-green"><i class="bi bi-check2-circle"></i></span>
          </div>
          <div class="metric-number text-green">{{ resolvedCount() }}</div>
          <div class="metric-sub text-green">{{ resolutionRate() }}% resolution rate</div>
        </div>

        <div class="metric-card card">
          <div class="metric-top">
            <span class="metric-label">Monitored Hotspots</span>
            <span class="metric-icon-wrap bg-purple"><i class="bi bi-fire"></i></span>
          </div>
          <div class="metric-number">{{ hotspotCount() }}</div>
          <div class="metric-sub text-muted">Clustered complaints (350m)</div>
        </div>
      </div>

      <!-- CHARTS ROW -->
      <div class="grid-2 charts-grid">
        <!-- Chart 1: Priority Distribution -->
        <div class="card chart-card">
          <div class="chart-header">
            <h3 class="chart-title"><i class="bi bi-pie-chart-fill text-saffron"></i> Grievances by Priority Tier</h3>
            <span class="chart-badge">Smart Engine</span>
          </div>
          <div class="chart-canvas-wrap">
            <canvas #priorityChartRef></canvas>
          </div>
        </div>

        <!-- Chart 2: Status Breakdown -->
        <div class="card chart-card">
          <div class="chart-header">
            <h3 class="chart-title"><i class="bi bi-bar-chart-fill text-navy"></i> Workflow Status Breakdown</h3>
            <span class="chart-badge">Live Pipeline</span>
          </div>
          <div class="chart-canvas-wrap">
            <canvas #statusChartRef></canvas>
          </div>
        </div>
      </div>

      <!-- RECENT COMPLAINTS TABLE -->
      <div class="card table-card">
        <div class="table-card-header">
          <div>
            <h3 class="table-card-title"><i class="bi bi-clock-history"></i> Recent Incoming Complaints</h3>
            <p class="table-card-desc">Real-time grievances received and triaged by the rules engine</p>
          </div>
          <a routerLink="/admin/all-complaints" class="btn btn-outline-navy btn-sm">
            View All {{ totalCount() }} Grievances &rarr;
          </a>
        </div>

        <div class="table-responsive">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Priority</th>
                <th>Title & Category</th>
                <th>Location Area</th>
                <th>Department</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of recentComplaints()">
                <td>
                  <span class="table-id font-mono">{{ c.id }}</span>
                </td>
                <td>
                  <app-priority-badge [priority]="c.priority" [label]="c.priority"></app-priority-badge>
                </td>
                <td>
                  <div class="table-title-cell">
                    <span class="table-title">{{ c.title }}</span>
                    <span class="table-cat">{{ c.category }} &bull; {{ c.subcategory }}</span>
                  </div>
                </td>
                <td>
                  <span class="table-area"><i class="bi bi-geo-alt-fill text-saffron"></i> {{ c.location.area }}</span>
                </td>
                <td>
                  <span class="table-dept">{{ c.department.split('(')[0] }}</span>
                </td>
                <td>
                  <span class="table-date">{{ c.submittedAt | date:'shortDate' }}</span>
                </td>
                <td>
                  <app-status-badge [status]="c.status"></app-status-badge>
                </td>
                <td>
                  <a [routerLink]="['/admin/priority-queue']" [queryParams]="{id: c.id}" class="btn btn-sm btn-secondary">
                    Triage
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-overview {
      display: flex;
      flex-direction: column;
      gap: 1.75rem;
    }
    .overview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
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
    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    /* Emergency Alert Card */
    .emergency-alert-card {
      background: #fef2f2;
      border: 2px solid #ef4444;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.25rem;
      border-radius: var(--radius-lg);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.15);
    }
    .alert-icon-box {
      font-size: 2.25rem;
      color: #dc2626;
      animation: pulse-ring 2s infinite;
    }
    .alert-body { flex: 1; }
    .alert-top {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.35rem;
    }
    .alert-time { font-size: 0.75rem; color: #991b1b; font-weight: 600; }
    .alert-title {
      font-size: 1.15rem;
      color: #7f1d1d;
      margin: 0 0 0.25rem;
    }
    .alert-details {
      font-size: 0.825rem;
      color: #991b1b;
      margin: 0;
    }

    .long-waiting-banner {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      padding: 0.85rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .lw-icon { font-size: 1.5rem; }
    .lw-text { flex: 1; font-size: 0.85rem; color: #92400e; }
    .lw-text strong { display: block; }

    /* Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1.25rem;
    }
    .metric-card {
      padding: 1.25rem;
    }
    .border-red {
      border-left: 4px solid #ef4444;
    }
    .metric-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .metric-label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .metric-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
    }
    .bg-blue { background: #e0f2fe; color: #0284c7; }
    .bg-red { background: #fee2e2; color: #dc2626; }
    .bg-orange { background: #ffedd5; color: #ea580c; }
    .bg-green { background: #dcfce7; color: #16a34a; }
    .bg-purple { background: #f3e8ff; color: #9333ea; }
    .metric-number {
      font-size: 2rem;
      font-weight: 800;
      color: var(--navy-900);
      font-family: var(--font-display);
      line-height: 1.1;
      margin-bottom: 0.25rem;
    }
    .text-green { color: #16a34a; }
    .text-warning { color: #d97706; }
    .metric-sub { font-size: 0.725rem; }

    /* Charts */
    .charts-grid {
      gap: 1.5rem;
    }
    .chart-card {
      padding: 1.5rem;
    }
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
    }
    .chart-title {
      font-size: 1.05rem;
      color: var(--navy-900);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .chart-badge {
      font-size: 0.7rem;
      padding: 2px 8px;
      background: var(--navy-50);
      border: 1px solid var(--border-medium);
      border-radius: 999px;
      color: var(--navy-900);
      font-weight: 600;
    }
    .chart-canvas-wrap {
      height: 260px;
      position: relative;
    }

    /* Table */
    .table-card {
      padding: 1.5rem;
    }
    .table-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
    }
    .table-card-title {
      font-size: 1.15rem;
      color: var(--navy-900);
      margin: 0 0 0.2rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .table-card-desc {
      font-size: 0.8rem;
      color: var(--text-muted);
      margin: 0;
    }
    .table-responsive {
      overflow-x: auto;
    }
    .admin-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.85rem;
    }
    .admin-table th {
      padding: 0.75rem 1rem;
      background: var(--navy-50);
      color: var(--navy-900);
      font-weight: 700;
      font-size: 0.775rem;
      border-bottom: 2px solid var(--border-medium);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .admin-table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid var(--border-light);
      vertical-align: middle;
    }
    .font-mono { font-family: monospace; }
    .table-id { font-weight: 700; color: var(--navy-900); }
    .table-title-cell { display: flex; flex-direction: column; gap: 2px; }
    .table-title { font-weight: 600; color: var(--navy-900); line-height: 1.3; }
    .table-cat { font-size: 0.725rem; color: var(--text-muted); }
    .table-area { font-size: 0.8rem; color: var(--text-main); }
    .table-dept { font-size: 0.8rem; color: var(--navy-700); font-weight: 500; }
    .table-date { font-size: 0.75rem; color: var(--text-muted); }

    @media (max-width: 1024px) {
      .metrics-grid { grid-template-columns: repeat(3, 1fr); }
      .charts-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 640px) {
      .metrics-grid { grid-template-columns: 1fr; }
      .emergency-alert-card { flex-direction: column; text-align: center; }
    }
  `]
})
export class AdminOverviewComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('priorityChartRef') priorityChartRef!: ElementRef;
  @ViewChild('statusChartRef') statusChartRef!: ElementRef;

  complaintService = inject(ComplaintService);

  priorityChart?: Chart;
  statusChart?: Chart;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initCharts();
    }, 200);
  }

  ngOnDestroy(): void {
    if (this.priorityChart) this.priorityChart.destroy();
    if (this.statusChart) this.statusChart.destroy();
  }

  initCharts(): void {
    const list = this.complaintService.complaints();

    // 1. Priority Counts
    const p0 = list.filter(c => c.priority === 'P0').length;
    const p1 = list.filter(c => c.priority === 'P1').length;
    const p2 = list.filter(c => c.priority === 'P2').length;
    const p3 = list.filter(c => c.priority === 'P3').length;

    if (this.priorityChartRef) {
      this.priorityChart = new Chart(this.priorityChartRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: ['P0 Emergency', 'P1 High', 'P2 Medium', 'P3 Low'],
          datasets: [{
            data: [p0, p1, p2, p3],
            backgroundColor: ['#dc2626', '#ea580c', '#d97706', '#0284c7'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom' }
          }
        }
      });
    }

    // 2. Status Counts
    const statuses = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
    const statusCounts = statuses.map(s => list.filter(c => c.status === s).length);

    if (this.statusChartRef) {
      this.statusChart = new Chart(this.statusChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: statuses,
          datasets: [{
            label: 'Complaints',
            data: statusCounts,
            backgroundColor: ['#64748b', '#0284c7', '#6366f1', '#d97706', '#16a34a', '#475569'],
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { stepSize: 1 }
            }
          }
        }
      });
    }
  }

  totalCount(): number {
    return this.complaintService.complaints().length;
  }

  pendingCount(): number {
    return this.complaintService.complaints().filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length;
  }

  activeEmergencyCount(): number {
    return this.complaintService.complaints().filter(c => c.priority === 'P0' && c.status !== 'Resolved' && c.status !== 'Closed').length;
  }

  inProgressCount(): number {
    return this.complaintService.complaints().filter(c => c.status === 'In Progress' || c.status === 'Assigned').length;
  }

  resolvedCount(): number {
    return this.complaintService.complaints().filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
  }

  resolutionRate(): number {
    const total = this.totalCount();
    if (!total) return 0;
    return Math.round((this.resolvedCount() / total) * 100);
  }

  hotspotCount(): number {
    const list = this.complaintService.complaints();
    const clusters = new Set(list.filter(c => c.hotspotClusterId).map(c => c.hotspotClusterId));
    return Math.max(clusters.size, 3);
  }

  getActiveP0List(): Complaint[] {
    return this.complaintService.complaints().filter(c => c.priority === 'P0' && c.status !== 'Resolved' && c.status !== 'Closed');
  }

  getLongWaitingComplaints(): Complaint[] {
    const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
    return this.complaintService.complaints().filter(c => {
      if (c.status === 'Resolved' || c.status === 'Closed') return false;
      const ageMs = Date.now() - new Date(c.submittedAt).getTime();
      return ageMs > fiveDaysMs;
    });
  }

  recentComplaints(): Complaint[] {
    return this.complaintService.complaints().slice(0, 6);
  }
}
