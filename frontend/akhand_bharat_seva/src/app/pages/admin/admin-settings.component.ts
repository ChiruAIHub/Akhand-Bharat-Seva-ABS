import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplaintService } from '../../services/complaint.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-settings-page">
      <div class="page-header-row">
        <div>
          <h1 class="page-title">System Settings & Data Management</h1>
          <p class="page-subtitle">Configure demo parameters, reset seed state, and simulate live civic events</p>
        </div>
      </div>

      <!-- Quick Simulation Actions -->
      <div class="card settings-section-card">
        <h3 class="section-title"><i class="bi bi-play-circle-fill text-saffron"></i> Live Hackathon Simulation Tools</h3>
        <p class="section-desc">Test real-time prioritization and queue reactivity with single-click simulation actions:</p>

        <div class="sim-actions-grid">
          <div class="sim-action-card">
            <div class="sim-icon bg-red"><i class="bi bi-lightning-charge-fill"></i></div>
            <div class="sim-details">
              <h4>Simulate New P0 Emergency</h4>
              <p>Injects an urgent live wire electrocution incident in Ameerpet. Watch it instantly jump to Rank #1 in the queue!</p>
              <button (click)="simulateEmergency()" class="btn btn-sm btn-danger">
                Inject P0 Emergency
              </button>
            </div>
          </div>

          <div class="sim-action-card">
            <div class="sim-icon bg-blue"><i class="bi bi-arrow-counterclockwise"></i></div>
            <div class="sim-details">
              <h4>Reset to Default Seed Dataset</h4>
              <p>Restores the clean 16 realistic Hyderabad test complaints (P0 emergency, 7-day medium, health hazard, and hotspot clusters).</p>
              <button (click)="resetSeedData()" class="btn btn-sm btn-secondary">
                Reset Demo Dataset
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Data Persistence Info -->
      <div class="card settings-section-card">
        <h3 class="section-title"><i class="bi bi-database-fill-check text-navy"></i> Local Storage & State Info</h3>
        <div class="storage-info-grid">
          <div class="info-metric">
            <span class="info-k">Storage Key:</span>
            <span class="info-v font-mono">abs_civic_complaints_v3</span>
          </div>
          <div class="info-metric">
            <span class="info-k">Total Stored Records:</span>
            <span class="info-v font-mono font-bold">{{ complaintService.complaints().length }}</span>
          </div>
          <div class="info-metric">
            <span class="info-k">Geographic Coordinate Bounds:</span>
            <span class="info-v font-mono">Hyderabad Urban (17.36&deg;N - 17.50&deg;N)</span>
          </div>
          <div class="info-metric">
            <span class="info-k">Algorithm Version:</span>
            <span class="info-v font-mono">ABS Smart Rules Engine v2.6</span>
          </div>
        </div>

        <div class="mt-3">
          <button (click)="complaintService.exportComplaintsToCsv()" class="btn btn-outline-navy btn-sm">
            <i class="bi bi-file-earmark-arrow-down"></i> Backup Complete Records (CSV)
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-settings-page { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header-row { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 1.85rem; color: var(--navy-900); margin: 0 0 0.25rem; }
    .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
    .settings-section-card { padding: 1.75rem; }
    .section-title { font-size: 1.2rem; color: var(--navy-900); margin: 0 0 0.35rem; display: flex; align-items: center; gap: 0.5rem; }
    .section-desc { font-size: 0.825rem; color: var(--text-muted); margin: 0 0 1.25rem; }
    .sim-actions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
    .sim-action-card { display: flex; align-items: flex-start; gap: 1rem; padding: 1.25rem; background: var(--bg-page); border: 1px solid var(--border-light); border-radius: var(--radius-md); }
    .sim-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; flex-shrink: 0; }
    .bg-red { background: #fee2e2; color: #dc2626; }
    .bg-blue { background: #e0f2fe; color: #0284c7; }
    .sim-details h4 { font-size: 1rem; color: var(--navy-900); margin: 0 0 0.35rem; }
    .sim-details p { font-size: 0.8rem; color: var(--text-muted); margin: 0 0 0.75rem; line-height: 1.45; }
    .storage-info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; background: var(--bg-page); padding: 1.25rem; border-radius: var(--radius-md); border: 1px solid var(--border-light); font-size: 0.85rem; }
    .info-metric { display: flex; flex-direction: column; gap: 2px; }
    .info-k { font-size: 0.75rem; color: var(--text-muted); font-weight: 600; }
    .info-v { color: var(--navy-900); }
    .font-mono { font-family: monospace; }
    .font-bold { font-weight: 700; }
    .mt-3 { margin-top: 1rem; }
    @media (max-width: 960px) {
      .sim-actions-grid { grid-template-columns: 1fr; }
      .storage-info-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class AdminSettingsComponent {
  complaintService = inject(ComplaintService);

  resetSeedData(): void {
    if (confirm('Reset application to standard demo seed complaints? Any unsaved edits will be refreshed.')) {
      this.complaintService.resetToSeedData();
      alert('Application reset to clean seed dataset with all 16 realistic Hyderabad scenarios.');
    }
  }

  simulateEmergency(): void {
    const complaint = this.complaintService.submitComplaint({
      category: 'Streetlights & Electricity',
      subcategory: 'Exposed Live Wire / Hazard',
      title: 'CRITICAL: High-voltage cable snapped and sparking across pedestrian foot-over-bridge',
      description: 'Storm winds severed 11KV overhead line. Cable is touching steel railing of footbridge near Ameerpet Metro with continuous electrical arcing. Passersby trapped on platform.',
      issueAge: 'Just happened (< 2 hours)',
      immediateDanger: true,
      publicImpact: 'Critical - Hospital / School / High Traffic Arterial',
      location: {
        address: 'Foot Over Bridge, Ameerpet Metro Station North Exit',
        area: 'Ameerpet',
        latitude: 17.4374,
        longitude: 78.4482
      },
      citizen: {
        name: 'Control Room Officer',
        phone: '9849099881',
        email: 'triage@ghmc.gov.in',
        isAnonymous: false
      }
    });

    alert(`Emergency complaint ${complaint.id} injected with P0 Emergency status (${complaint.priorityScore} pts)!`);
  }
}
