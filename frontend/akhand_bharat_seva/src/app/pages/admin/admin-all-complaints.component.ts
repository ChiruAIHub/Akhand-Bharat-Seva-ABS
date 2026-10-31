import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ComplaintService } from '../../services/complaint.service';
import {
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  DepartmentType,
  PriorityLevel
} from '../../models/complaint.model';
import { PriorityBadgeComponent } from '../../components/priority-badge/priority-badge.component';
import { StatusBadgeComponent } from '../../components/status-badge/status-badge.component';

@Component({
  selector: 'app-admin-all-complaints',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PriorityBadgeComponent, StatusBadgeComponent],
  template: `
    <div class="all-complaints-page">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">All Registered Complaints</h1>
          <p class="page-subtitle">Complete registry of citizen complaints across all municipal departments</p>
        </div>
        <div class="header-actions">
          <button (click)="complaintService.exportComplaintsToCsv()" class="btn btn-secondary btn-sm">
            <i class="bi bi-download"></i> Export CSV
          </button>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="card filters-card">
        <div class="search-wrap">
          <i class="bi bi-search"></i>
          <input
            type="text"
            [(ngModel)]="search"
            placeholder="Search by ID, citizen name, phone, area, title..."
            class="form-control"
          />
        </div>

        <div class="dropdowns-row">
          <select [(ngModel)]="categoryFilter" class="form-control">
            <option value="">All Categories</option>
            <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
          </select>

          <select [(ngModel)]="priorityFilter" class="form-control">
            <option value="">All Priorities</option>
            <option value="P0">P0 — Emergency</option>
            <option value="P1">P1 — High</option>
            <option value="P2">P2 — Medium</option>
            <option value="P3">P3 — Low</option>
          </select>

          <select [(ngModel)]="statusFilter" class="form-control">
            <option value="">All Statuses</option>
            <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
          </select>

          <select [(ngModel)]="deptFilter" class="form-control">
            <option value="">All Departments</option>
            <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
          </select>

          <button (click)="resetFilters()" class="btn btn-secondary btn-sm">Reset</button>
        </div>
      </div>

      <!-- Results Count -->
      <div class="results-meta">
        Showing <strong>{{ filteredList.length }}</strong> of {{ totalComplaints() }} total records
      </div>

      <!-- Data Table -->
      <div class="card table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Title & Subcategory</th>
                <th>Department</th>
                <th>Area / Landmark</th>
                <th>Citizen</th>
                <th>Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of filteredList">
                <td class="font-mono font-bold">{{ item.id }}</td>
                <td><app-priority-badge [priority]="item.priority" [label]="item.priority"></app-priority-badge></td>
                <td><app-status-badge [status]="item.status"></app-status-badge></td>
                <td>
                  <div class="title-cell">
                    <span class="table-item-title">{{ item.title }}</span>
                    <span class="table-item-sub">{{ item.category }} &bull; {{ item.subcategory }}</span>
                  </div>
                </td>
                <td class="dept-col">{{ item.department.split('(')[0] }}</td>
                <td>
                  <div class="loc-cell">
                    <span>{{ item.location.area }}</span>
                    <small class="text-muted">{{ item.location.address | slice:0:30 }}...</small>
                  </div>
                </td>
                <td>
                  <span class="citizen-name">{{ item.citizen.name }}</span>
                  <span class="citizen-phone font-mono">{{ item.citizen.phone }}</span>
                </td>
                <td>{{ item.submittedAt | date:'shortDate' }}</td>
                <td>
                  <div class="btn-group">
                    <a [routerLink]="['/admin/priority-queue']" [queryParams]="{id: item.id}" class="btn btn-sm btn-primary">
                      Manage
                    </a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .all-complaints-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header-row { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 1.85rem; color: var(--navy-900); margin: 0 0 0.25rem; }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
    .filters-card { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
    .search-wrap { position: relative; }
    .search-wrap i { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
    .search-wrap input { padding-left: 2.25rem; }
    .dropdowns-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0.75rem; }
    .results-meta { font-size: 0.85rem; color: var(--text-muted); }
    .table-card { overflow: hidden; }
    .data-table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.85rem; }
    .data-table th { padding: 0.85rem 1rem; background: var(--navy-50); color: var(--navy-900); font-weight: 700; border-bottom: 2px solid var(--border-medium); font-size: 0.75rem; text-transform: uppercase; white-space: nowrap; }
    .data-table td { padding: 0.85rem 1rem; border-bottom: 1px solid var(--border-light); vertical-align: middle; }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
    .title-cell { display: flex; flex-direction: column; gap: 2px; max-width: 280px; }
    .table-item-title { font-weight: 600; color: var(--navy-900); line-height: 1.3; }
    .table-item-sub { font-size: 0.725rem; color: var(--text-muted); }
    .loc-cell { display: flex; flex-direction: column; font-size: 0.8rem; }
    .citizen-name { display: block; font-weight: 600; color: var(--navy-900); }
    .citizen-phone { font-size: 0.725rem; color: var(--text-muted); }
    .dept-col { font-weight: 500; color: var(--navy-700); }
    @media (max-width: 960px) { .dropdowns-row { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class AdminAllComplaintsComponent implements OnInit {
  complaintService = inject(ComplaintService);
  private route = inject(ActivatedRoute);

  search = '';
  categoryFilter = '';
  priorityFilter = '';
  statusFilter = '';
  deptFilter = '';

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

  departments: DepartmentType[] = [
    'Roads & Bridges (GHMC)',
    'Solid Waste & Sanitation (GHMC)',
    'Sewage & Drainage (HMWSSB)',
    'Water Supply (HMWSSB)',
    'Electricity & Streetlights (TSSPDCL)',
    'Urban Forestry & Parks (GHMC)',
    'General Civic Services'
  ];

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['dept']) this.deptFilter = params['dept'];
      if (params['priority']) this.priorityFilter = params['priority'];
      if (params['status']) this.statusFilter = params['status'];
      if (params['search']) this.search = params['search'];
    });
  }

  get filteredList(): Complaint[] {
    let list = [...this.complaintService.complaints()];

    if (this.search.trim()) {
      const q = this.search.toLowerCase().trim();
      list = list.filter(
        c =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.location.area.toLowerCase().includes(q) ||
          c.citizen.name.toLowerCase().includes(q) ||
          c.citizen.phone.includes(q)
      );
    }

    if (this.categoryFilter) {
      list = list.filter(c => c.category === this.categoryFilter);
    }
    if (this.priorityFilter) {
      list = list.filter(c => c.priority === this.priorityFilter);
    }
    if (this.statusFilter) {
      list = list.filter(c => c.status === this.statusFilter);
    }
    if (this.deptFilter) {
      list = list.filter(c => c.department === this.deptFilter);
    }

    return list;
  }

  totalComplaints(): number {
    return this.complaintService.complaints().length;
  }

  resetFilters(): void {
    this.search = '';
    this.categoryFilter = '';
    this.priorityFilter = '';
    this.statusFilter = '';
    this.deptFilter = '';
  }
}
