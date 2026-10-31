import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PriorityLevel } from '../../models/complaint.model';

@Component({
  selector: 'app-priority-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="getBadgeClass()" [title]="tooltipText">
      <i class="bi" [ngClass]="getIconClass()"></i>
      {{ label || priority }}
      <span *ngIf="showScore && score" class="score-pill">{{ score }} pts</span>
    </span>
  `,
  styles: [`
    .score-pill {
      margin-left: 4px;
      padding: 1px 5px;
      font-size: 0.65rem;
      border-radius: 999px;
      background: rgba(0, 0, 0, 0.08);
      font-weight: 700;
    }
  `]
})
export class PriorityBadgeComponent {
  @Input() priority: PriorityLevel = 'P3';
  @Input() label?: string;
  @Input() score?: number;
  @Input() showScore: boolean = false;
  @Input() tooltipText: string = '';

  getBadgeClass(): string {
    switch (this.priority) {
      case 'P0': return 'badge-p0';
      case 'P1': return 'badge-p1';
      case 'P2': return 'badge-p2';
      case 'P3': return 'badge-p3';
      default: return 'badge-p3';
    }
  }

  getIconClass(): string {
    switch (this.priority) {
      case 'P0': return 'bi-exclamation-octagon-fill text-danger';
      case 'P1': return 'bi-exclamation-triangle-fill';
      case 'P2': return 'bi-info-circle-fill';
      case 'P3': return 'bi-check-circle-fill';
      default: return 'bi-info-circle';
    }
  }
}
