import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComplaintStatus } from '../../models/complaint.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge-status" [ngClass]="getStatusClass()">
      <i class="bi" [ngClass]="getIconClass()"></i>
      {{ status }}
    </span>
  `,
  styles: [`
    .badge-status {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
  `]
})
export class StatusBadgeComponent {
  @Input() status: ComplaintStatus = 'Submitted';

  getStatusClass(): string {
    switch (this.status) {
      case 'Submitted': return 'submitted';
      case 'Under Review': return 'under-review';
      case 'Assigned': return 'assigned';
      case 'In Progress': return 'in-progress';
      case 'Resolved': return 'resolved';
      case 'Closed': return 'closed';
      default: return 'submitted';
    }
  }

  getIconClass(): string {
    switch (this.status) {
      case 'Submitted': return 'bi-envelope';
      case 'Under Review': return 'bi-search';
      case 'Assigned': return 'bi-person-check';
      case 'In Progress': return 'bi-gear-wide-connected bi-spin';
      case 'Resolved': return 'bi-check2-circle';
      case 'Closed': return 'bi-archive';
      default: return 'bi-circle';
    }
  }
}
