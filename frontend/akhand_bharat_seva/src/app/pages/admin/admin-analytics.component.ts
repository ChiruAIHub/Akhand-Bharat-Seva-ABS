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
import { Chart, registerables } from 'chart.js';
import { ComplaintService } from '../../services/complaint.service';
import { ComplaintCategory } from '../../models/complaint.model';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="analytics-page">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">Reports & Geospatial Analytics</h1>
          <p class="page-subtitle">Civic grievance volume, resolution rates, and department performance</p>
        </div>
        <div class="header-actions">
          <button (click)="complaintService.exportComplaintsToCsv()" class="btn btn-saffron">
            <i class="bi bi-file-earmark-spreadsheet-fill"></i> Export All Records (CSV)
          </button>
        </div>
      </div>

      <!-- Quick KPI Stats -->
      <div class="analytics-kpi-row">
        <div class="kpi-box card">
          <span class="kpi-lbl">Total Logged Grievances</span>
          <span class="kpi-num">{{ totalCount() }}</span>
        </div>
        <div class="kpi-box card">
          <span class="kpi-lbl">Current Resolution Rate</span>
          <span class="kpi-num text-green">{{ resolutionRate() }}%</span>
        </div>
        <div class="kpi-box card">
          <span class="kpi-lbl">Active P0 Emergencies</span>
          <span class="kpi-num text-danger">{{ p0Count() }}</span>
        </div>
        <div class="kpi-box card">
          <span class="kpi-lbl">Avg Redressal SLA</span>
          <span class="kpi-num">2.4 Days</span>
        </div>
      </div>

      <!-- Charts Grid 1: Categories & Departments -->
      <div class="grid-2 analytics-charts-grid">
        <div class="card chart-card">
          <div class="chart-header">
            <h3 class="chart-title"><i class="bi bi-bar-chart-steps text-navy"></i> Complaints by Civic Category</h3>
          </div>
          <div class="chart-canvas-box">
            <canvas #categoryChartRef></canvas>
          </div>
        </div>

        <div class="card chart-card">
          <div class="chart-header">
            <h3 class="chart-title"><i class="bi bi-building text-saffron"></i> Department Caseload Allocation</h3>
          </div>
          <div class="chart-canvas-box">
            <canvas #deptChartRef></canvas>
          </div>
        </div>
      </div>

      <!-- Charts Grid 2: Timeline Trends -->
      <div class="card chart-card">
        <div class="chart-header">
          <h3 class="chart-title"><i class="bi bi-graph-up-arrow text-green"></i> 30-Day Grievance Trend: Logged vs Resolved</h3>
        </div>
        <div class="chart-canvas-box trend-height">
          <canvas #trendChartRef></canvas>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .analytics-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 1.85rem; color: var(--navy-900); margin: 0 0 0.25rem; }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
    .analytics-kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
    .kpi-box { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.25rem; }
    .kpi-lbl { font-size: 0.775rem; color: var(--text-muted); font-weight: 600; }
    .kpi-num { font-size: 2rem; font-weight: 800; color: var(--navy-900); font-family: var(--font-display); }
    .text-green { color: #16a34a; }
    .text-danger { color: #dc2626; }
    .analytics-charts-grid { gap: 1.5rem; }
    .chart-card { padding: 1.5rem; }
    .chart-header { margin-bottom: 1rem; }
    .chart-title { font-size: 1.1rem; color: var(--navy-900); margin: 0; display: flex; align-items: center; gap: 0.4rem; }
    .chart-canvas-box { position: relative; height: 300px; }
    .trend-height { height: 280px; }
    @media (max-width: 960px) {
      .analytics-kpi-row { grid-template-columns: repeat(2, 1fr); }
      .analytics-charts-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminAnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('categoryChartRef') categoryChartRef!: ElementRef;
  @ViewChild('deptChartRef') deptChartRef!: ElementRef;
  @ViewChild('trendChartRef') trendChartRef!: ElementRef;

  complaintService = inject(ComplaintService);

  categoryChart?: Chart;
  deptChart?: Chart;
  trendChart?: Chart;

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => this.initCharts(), 200);
  }

  ngOnDestroy(): void {
    if (this.categoryChart) this.categoryChart.destroy();
    if (this.deptChart) this.deptChart.destroy();
    if (this.trendChart) this.trendChart.destroy();
  }

  totalCount(): number {
    return this.complaintService.complaints().length;
  }

  p0Count(): number {
    return this.complaintService.complaints().filter(c => c.priority === 'P0').length;
  }

  resolutionRate(): number {
    const total = this.totalCount();
    if (!total) return 0;
    const resolved = this.complaintService.complaints().filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
    return Math.round((resolved / total) * 100);
  }

  initCharts(): void {
    const list = this.complaintService.complaints();

    // 1. Categories
    const categories: ComplaintCategory[] = [
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
    const catCounts = categories.map(cat => list.filter(c => c.category === cat).length);

    if (this.categoryChartRef) {
      this.categoryChart = new Chart(this.categoryChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: categories.map(c => c.split('&')[0]),
          datasets: [{
            label: 'Complaints',
            data: catCounts,
            backgroundColor: '#2563eb',
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    // 2. Department Workloads
    const depts = this.complaintService.getDepartmentsSummary();
    if (this.deptChartRef) {
      this.deptChart = new Chart(this.deptChartRef.nativeElement, {
        type: 'bar',
        data: {
          labels: depts.map(d => d.shortName),
          datasets: [
            {
              label: 'Active Pending',
              data: depts.map(d => d.activeComplaints),
              backgroundColor: '#ea580c'
            },
            {
              label: 'Resolved',
              data: depts.map(d => d.resolvedComplaints),
              backgroundColor: '#16a34a'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
        }
      });
    }

    // 3. Trends (Simulated 4 weeks data)
    if (this.trendChartRef) {
      this.trendChart = new Chart(this.trendChartRef.nativeElement, {
        type: 'line',
        data: {
          labels: ['Week 1 (Oct)', 'Week 2 (Oct)', 'Week 3 (Oct)', 'Week 4 (Current)'],
          datasets: [
            {
              label: 'Grievances Received',
              data: [12, 19, 15, list.length],
              borderColor: '#0f2347',
              backgroundColor: 'rgba(15, 35, 71, 0.1)',
              fill: true,
              tension: 0.3
            },
            {
              label: 'Grievances Resolved',
              data: [10, 14, 13, list.filter(c => c.status === 'Resolved' || c.status === 'Closed').length],
              borderColor: '#16a34a',
              backgroundColor: 'rgba(22, 163, 74, 0.1)',
              fill: true,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } }
        }
      });
    }
  }
}
