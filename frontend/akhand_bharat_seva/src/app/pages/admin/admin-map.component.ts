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
import {
  Complaint,
  DepartmentType,
  PriorityLevel
} from '../../models/complaint.model';

@Component({
  selector: 'app-admin-map',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="admin-map-page">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">GIS Incident Map & Hotspot Clustering</h1>
          <p class="page-subtitle">Interactive geospatial intelligence across Hyderabad zones</p>
        </div>
      </div>

      <!-- Filter Controls Bar -->
      <div class="card map-filter-card">
        <div class="filters-row">
          <div class="filter-item">
            <label class="filter-label">Priority Level</label>
            <select [(ngModel)]="priorityFilter" (change)="renderMarkers()" class="form-control">
              <option value="">All Priorities</option>
              <option value="P0">P0 — Emergency (Pulsing Red)</option>
              <option value="P1">P1 — High</option>
              <option value="P2">P2 — Medium</option>
              <option value="P3">P3 — Low</option>
            </select>
          </div>

          <div class="filter-item">
            <label class="filter-label">Department</label>
            <select [(ngModel)]="deptFilter" (change)="renderMarkers()" class="form-control">
              <option value="">All Departments</option>
              <option *ngFor="let d of departments" [value]="d">{{ d }}</option>
            </select>
          </div>

          <div class="filter-item">
            <label class="filter-label">Status</label>
            <select [(ngModel)]="statusFilter" (change)="renderMarkers()" class="form-control">
              <option value="">All Statuses</option>
              <option value="active">Active Only (Unresolved)</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>

          <div class="hotspot-toggle-item">
            <label class="checkbox-container">
              <input type="checkbox" [(ngModel)]="hotspotsOnly" (change)="renderMarkers()" />
              <span class="checkmark"></span>
              <span class="font-semibold text-danger"><i class="bi bi-fire"></i> Show Hotspots Only</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Map Card with Canvas -->
      <div class="card map-canvas-card">
        <div class="map-topbar">
          <div class="legend-pills">
            <span class="legend-pill"><span class="badge badge-p0">P0</span> Emergency ({{ countByPriority('P0') }})</span>
            <span class="legend-pill"><span class="badge badge-p1">P1</span> High ({{ countByPriority('P1') }})</span>
            <span class="legend-pill"><span class="badge badge-p2">P2</span> Medium ({{ countByPriority('P2') }})</span>
            <span class="legend-pill"><span class="badge badge-p3">P3</span> Low ({{ countByPriority('P3') }})</span>
            <span class="legend-pill"><span class="hotspot-dot"></span> Hotspot Radius (350m)</span>
          </div>
          <div class="map-meta">
            <span>Showing {{ currentFiltered.length }} Incidents</span>
          </div>
        </div>

        <div #adminMapContainer class="leaflet-admin-map"></div>
      </div>
    </div>
  `,
  styles: [`
    .admin-map-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header-row { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 1.85rem; color: var(--navy-900); margin: 0 0 0.25rem; }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
    .map-filter-card { padding: 1.25rem; }
    .filters-row { display: flex; align-items: flex-end; flex-wrap: wrap; gap: 1rem; }
    .filter-item { min-width: 180px; }
    .filter-label { display: block; font-size: 0.75rem; font-weight: 700; color: var(--navy-900); margin-bottom: 0.35rem; }
    .hotspot-toggle-item { display: flex; align-items: center; height: 38px; }
    .font-semibold { font-weight: 600; }
    .map-canvas-card { overflow: hidden; border-radius: var(--radius-lg); }
    .map-topbar { padding: 0.85rem 1.25rem; background: var(--navy-50); border-bottom: 1px solid var(--border-medium); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; font-size: 0.8rem; }
    .legend-pills { display: flex; align-items: center; flex-wrap: wrap; gap: 0.85rem; }
    .legend-pill { display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; }
    .hotspot-dot { width: 12px; height: 12px; border-radius: 50%; background: rgba(220, 38, 38, 0.3); border: 2px dashed #dc2626; display: inline-block; }
    .map-meta { font-weight: 600; color: var(--navy-900); }
    .leaflet-admin-map { width: 100%; height: 640px; }
    .checkbox-container { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.85rem; }
  `]
})
export class AdminMapComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('adminMapContainer') adminMapContainerRef!: ElementRef;

  complaintService = inject(ComplaintService);

  priorityFilter = '';
  deptFilter = '';
  statusFilter = '';
  hotspotsOnly = false;

  map!: L.Map;
  markersLayer = L.layerGroup();
  hotspotsLayer = L.layerGroup();

  departments: DepartmentType[] = [
    'Roads & Bridges (GHMC)',
    'Solid Waste & Sanitation (GHMC)',
    'Sewage & Drainage (HMWSSB)',
    'Water Supply (HMWSSB)',
    'Electricity & Streetlights (TSSPDCL)',
    'Urban Forestry & Parks (GHMC)',
    'General Civic Services'
  ];

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 200);
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  get currentFiltered(): Complaint[] {
    let list = [...this.complaintService.complaints()];

    if (this.priorityFilter) {
      list = list.filter(c => c.priority === this.priorityFilter);
    }
    if (this.deptFilter) {
      list = list.filter(c => c.department === this.deptFilter);
    }
    if (this.statusFilter) {
      if (this.statusFilter === 'active') {
        list = list.filter(c => c.status !== 'Resolved' && c.status !== 'Closed');
      } else {
        list = list.filter(c => c.status === this.statusFilter);
      }
    }
    if (this.hotspotsOnly) {
      list = list.filter(c => c.hotspotClusterId !== undefined);
    }

    return list;
  }

  countByPriority(p: PriorityLevel): number {
    return this.complaintService.complaints().filter(c => c.priority === p).length;
  }

  initMap(): void {
    if (!this.adminMapContainerRef) return;
    if (this.map) this.map.remove();

    this.map = L.map(this.adminMapContainerRef.nativeElement).setView([17.4200, 78.4500], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &bull; Akhand Bharat Seva Command'
    }).addTo(this.map);

    this.hotspotsLayer.addTo(this.map);
    this.markersLayer.addTo(this.map);

    this.renderMarkers();
  }

  renderMarkers(): void {
    if (!this.map) return;
    this.markersLayer.clearLayers();
    this.hotspotsLayer.clearLayers();

    const items = this.currentFiltered;

    // Draw hotspot circles around clustered complaints
    const clusterCenters = new Map<string, { lat: number; lng: number; count: number }>();
    items.forEach(c => {
      if (c.hotspotClusterId) {
        if (!clusterCenters.has(c.hotspotClusterId)) {
          clusterCenters.set(c.hotspotClusterId, { lat: c.location.latitude, lng: c.location.longitude, count: 1 });
        } else {
          const existing = clusterCenters.get(c.hotspotClusterId)!;
          existing.count++;
        }
      }
    });

    clusterCenters.forEach((val, key) => {
      const circle = L.circle([val.lat, val.lng], {
        radius: 350,
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.15,
        weight: 2,
        dashArray: '4, 4'
      });
      circle.bindTooltip(`<b>Hotspot Cluster</b><br>${key}: ${val.count} complaints within 350m`);
      this.hotspotsLayer.addLayer(circle);
    });

    // Render individual incident markers
    items.forEach(c => {
      let color = '#0284c7';
      if (c.priority === 'P0') color = '#dc2626';
      else if (c.priority === 'P1') color = '#ea580c';
      else if (c.priority === 'P2') color = '#d97706';

      const circle = L.circleMarker([c.location.latitude, c.location.longitude], {
        radius: c.priority === 'P0' ? 12 : 8,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.95,
        className: c.priority === 'P0' ? 'p0-pulse-marker' : ''
      });

      const popupHtml = `
        <div style="min-width: 240px; font-family: sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="font-family: monospace; color: #0f2347; font-size: 13px;">${c.id}</strong>
            <span style="background: ${color}; color: #fff; padding: 2px 7px; border-radius: 999px; font-size: 10px; font-weight: bold;">${c.priority} (${c.priorityScore} pts)</span>
          </div>
          <h4 style="margin: 0 0 4px; font-size: 13px; color: #0f2347; font-weight: 600;">${c.title}</h4>
          <p style="margin: 0 0 4px; font-size: 11px; color: #475569;"><strong>Dept:</strong> ${c.department.split('(')[0]}</p>
          <p style="margin: 0 0 4px; font-size: 11px; color: #64748b;">${c.location.address}</p>
          <p style="margin: 0 0 6px; font-size: 11px; color: #9a3412; background: #fff7ed; padding: 3px 5px; border-radius: 3px;">${c.priorityReason}</p>
          <div style="display: flex; gap: 6px;">
            <a href="/admin/priority-queue" style="background: #0f2347; color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 11px; text-decoration: none; font-weight: 600;">Triage in Queue &rarr;</a>
          </div>
        </div>
      `;

      circle.bindPopup(popupHtml);
      this.markersLayer.addLayer(circle);
    });
  }
}
