import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="help-page">
      <!-- Banner -->
      <section class="help-banner">
        <div class="container">
          <div class="breadcrumb-trail">
            <a routerLink="/"><i class="bi bi-house"></i> Home</a>
            <i class="bi bi-chevron-right separator"></i>
            <span>Help & FAQ</span>
          </div>
          <h1 class="page-title">Citizen Help Center & FAQ</h1>
          <p class="page-subtitle">
            Understand how our Smart Rules Prioritization Engine operates, response target guidelines, photo evidence tips, and emergency contacts.
          </p>
        </div>
      </section>

      <div class="container help-content">
        <div class="help-layout">
          <!-- Main Content -->
          <div class="help-main">
            <!-- Demo Disclaimer Banner -->
            <div class="alert-box alert-box-warning mb-4">
              <i class="bi bi-exclamation-triangle-fill"></i>
              <div>
                <strong>Civic Hackathon Demo Platform:</strong>
                Akhand Bharat Seva is an academic prototype showcasing automated rules-based triage, GIS mapping, and transparent citizen grievance tracking. All priority definitions and response targets are simulated demo rules and do not constitute legal government commitments.
              </div>
            </div>

            <!-- Priority Explanations -->
            <div class="card help-card">
              <h2 class="card-title">
                <i class="bi bi-diagram-3-fill text-saffron"></i> Transparent Priority Engine Explained
              </h2>
              <p class="text-muted text-sm">
                How does Akhand Bharat Seva decide which complaint is handled first? Every report is evaluated through deterministic, transparent scoring rules:
              </p>

              <div class="priority-accordion">
                <div class="prio-info-row p0-row">
                  <div class="prio-tag-box">
                    <span class="badge badge-p0">P0 &bull; Emergency</span>
                    <span class="prio-target">Immediate Action Target</span>
                  </div>
                  <div class="prio-details">
                    <h4>Direct Threat to Human Life or Major Structural Collapse</h4>
                    <p>
                      <strong>Examples:</strong> Dangling live electric wires, submerged missing manhole covers during rain, collapsing boundary walls, dangerous gas leaks.
                    </p>
                    <div class="scoring-logic">
                      <strong>Scoring Rule:</strong> Automatic +1000 Emergency bonus. A brand-new P0 complaint will <em>always</em> outrank older routine complaints.
                    </div>
                  </div>
                </div>

                <div class="prio-info-row p1-row">
                  <div class="prio-tag-box">
                    <span class="badge badge-p1">P1 &bull; High</span>
                    <span class="prio-target">24-48 Hours Target</span>
                  </div>
                  <div class="prio-details">
                    <h4>Severe Public Health or High-Traffic Disruption</h4>
                    <p>
                      <strong>Examples:</strong> Sewage line backflow contaminating drinking water, major crater potholes on highway flyovers, aggressive stray dog packs near schools.
                    </p>
                    <div class="scoring-logic">
                      <strong>Scoring Rule:</strong> Base score 480-899 pts. Elevated by high public impact on transit corridors.
                    </div>
                  </div>
                </div>

                <div class="prio-info-row p2-row">
                  <div class="prio-tag-box">
                    <span class="badge badge-p2">P2 &bull; Medium</span>
                    <span class="prio-target">3-5 Days Target</span>
                  </div>
                  <div class="prio-details">
                    <h4>Neighborhood Civic Inconvenience & Hygiene Deficiencies</h4>
                    <p>
                      <strong>Examples:</strong> Blocked residential stormwater drains, uncollected community garbage dumps, broken residential streetlights.
                    </p>
                    <div class="scoring-logic">
                      <strong>Aging Rule:</strong> Unresolved P2 complaints accumulate aging points daily. A 7-day-old medium complaint will automatically outrank a comparable 1-day-old complaint.
                    </div>
                  </div>
                </div>

                <div class="prio-info-row p3-row">
                  <div class="prio-tag-box">
                    <span class="badge badge-p3">P3 &bull; Low</span>
                    <span class="prio-target">Scheduled Maintenance</span>
                  </div>
                  <div class="prio-details">
                    <h4>Cosmetic Repairs & Minor Non-Hazard Maintenance</h4>
                    <p>
                      <strong>Examples:</strong> Broken wooden slats on park benches, faded pedestrian crossing markings, loose sidewalk pavers without road obstruction.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Photo Guidelines -->
            <div class="card help-card">
              <h2 class="card-title">
                <i class="bi bi-camera-fill text-navy"></i> Photo Evidence Best Practices
              </h2>
              <div class="photo-tips-grid">
                <div class="tip-item">
                  <i class="bi bi-check-circle-fill text-green"></i>
                  <div>
                    <strong>Capture Wide Angle Context:</strong> Include recognizable landmarks or street signs so ground crews locate the defect quickly.
                  </div>
                </div>
                <div class="tip-item">
                  <i class="bi bi-check-circle-fill text-green"></i>
                  <div>
                    <strong>Show Defect Depth:</strong> For potholes or open drains, take a clear angle showing depth and hazard potential.
                  </div>
                </div>
                <div class="tip-item">
                  <i class="bi bi-check-circle-fill text-green"></i>
                  <div>
                    <strong>Good Lighting:</strong> Take daytime photos whenever possible. Use flashlight if reporting broken streetlights at night.
                  </div>
                </div>
                <div class="tip-item">
                  <i class="bi bi-x-circle-fill text-danger"></i>
                  <div>
                    <strong>Do Not Put Yourself in Danger:</strong> Never step into moving traffic or touch suspicious electrical equipment to take photos.
                  </div>
                </div>
              </div>
            </div>

            <!-- FAQs Accordion -->
            <div class="card help-card">
              <h2 class="card-title">
                <i class="bi bi-question-circle-fill text-saffron"></i> Frequently Asked Questions
              </h2>

              <div class="faq-list">
                <div class="faq-item" *ngFor="let faq of faqs; let i = index">
                  <button class="faq-question" (click)="toggleFaq(i)">
                    <span>{{ faq.q }}</span>
                    <i class="bi" [ngClass]="faq.open ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
                  </button>
                  <div class="faq-answer" *ngIf="faq.open">
                    <p>{{ faq.a }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Sidebar: Emergency Contacts -->
          <div class="help-sidebar">
            <div class="card emergency-sidebar-card">
              <div class="emergency-badge-tag">
                <i class="bi bi-shield-exclamation text-danger"></i>
                <span>24x7 EMERGENCY HELPLINES</span>
              </div>
              <p class="sidebar-sub">
                In case of immediate threat to human safety, dial toll-free government hotlines directly:
              </p>

              <div class="helpline-contact-list">
                <a href="tel:04021111111" class="helpline-row">
                  <div class="help-icon-box bg-navy"><i class="bi bi-building"></i></div>
                  <div>
                    <span class="help-title">GHMC Grievances</span>
                    <span class="help-number">040-21111111</span>
                  </div>
                </a>

                <a href="tel:100" class="helpline-row">
                  <div class="help-icon-box bg-red"><i class="bi bi-shield-fill"></i></div>
                  <div>
                    <span class="help-title">Police Control Room</span>
                    <span class="help-number">100 / 112</span>
                  </div>
                </a>

                <a href="tel:108" class="helpline-row">
                  <div class="help-icon-box bg-red"><i class="bi bi-heart-pulse-fill"></i></div>
                  <div>
                    <span class="help-title">Ambulance & Medical</span>
                    <span class="help-number">108</span>
                  </div>
                </a>

                <a href="tel:101" class="helpline-row">
                  <div class="help-icon-box bg-orange"><i class="bi bi-fire"></i></div>
                  <div>
                    <span class="help-title">Fire & Rescue Service</span>
                    <span class="help-number">101</span>
                  </div>
                </a>

                <a href="tel:1912" class="helpline-row">
                  <div class="help-icon-box bg-yellow"><i class="bi bi-lightning-charge-fill"></i></div>
                  <div>
                    <span class="help-title">TSSPDCL Power Emergency</span>
                    <span class="help-number">1912</span>
                  </div>
                </a>

                <a href="tel:181" class="helpline-row">
                  <div class="help-icon-box bg-purple"><i class="bi bi-person-heart"></i></div>
                  <div>
                    <span class="help-title">Women Safety Helpline</span>
                    <span class="help-number">181</span>
                  </div>
                </a>

                <a href="tel:1070" class="helpline-row">
                  <div class="help-icon-box bg-blue"><i class="bi bi-cloud-lightning-rain-fill"></i></div>
                  <div>
                    <span class="help-title">State Disaster Control</span>
                    <span class="help-number">1070</span>
                  </div>
                </a>
              </div>
            </div>

            <div class="card quick-actions-card">
              <h4>Need Immediate Help?</h4>
              <p class="text-sm text-muted">Lodge a complaint or check status of an existing ticket.</p>
              <div class="d-flex flex-column gap-2 mt-3">
                <a routerLink="/report" class="btn btn-saffron btn-sm">
                  <i class="bi bi-plus-circle-fill"></i> Report a Problem
                </a>
                <a routerLink="/track" class="btn btn-secondary btn-sm">
                  <i class="bi bi-search"></i> Track Existing Ticket
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .help-banner {
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

    .help-content {
      padding: 3rem 1.25rem;
    }
    .help-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 2rem;
      align-items: start;
    }

    .help-card {
      padding: 2rem;
      margin-bottom: 2rem;
    }
    .card-title {
      font-size: 1.35rem;
      color: var(--navy-900);
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .text-sm { font-size: 0.875rem; }
    .text-green { color: #16a34a; }
    .text-danger { color: #dc2626; }

    .priority-accordion {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-top: 1.5rem;
    }
    .prio-info-row {
      padding: 1.25rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-light);
    }
    .p0-row { background: #fef2f2; border-left: 5px solid #dc2626; }
    .p1-row { background: #fff7ed; border-left: 5px solid #ea580c; }
    .p2-row { background: #fffbeb; border-left: 5px solid #d97706; }
    .p3-row { background: #f0f9ff; border-left: 5px solid #0284c7; }

    .prio-tag-box {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }
    .prio-target {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--navy-900);
    }
    .prio-details h4 {
      font-size: 1rem;
      color: var(--navy-900);
      margin-bottom: 0.35rem;
    }
    .prio-details p {
      font-size: 0.825rem;
      color: var(--text-muted);
      margin: 0 0 0.5rem;
      line-height: 1.45;
    }
    .scoring-logic {
      font-size: 0.775rem;
      background: rgba(255, 255, 255, 0.6);
      padding: 0.4rem 0.65rem;
      border-radius: var(--radius-sm);
      color: var(--navy-900);
    }

    .photo-tips-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-top: 1.25rem;
    }
    .tip-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--bg-page);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-light);
      font-size: 0.8125rem;
      line-height: 1.45;
    }
    .tip-item i { font-size: 1.25rem; flex-shrink: 0; }

    .faq-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }
    .faq-item {
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
      overflow: hidden;
    }
    .faq-question {
      width: 100%;
      text-align: left;
      padding: 1rem 1.25rem;
      background: #ffffff;
      border: none;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      font-size: 0.95rem;
      color: var(--navy-900);
      cursor: pointer;
    }
    .faq-question:hover {
      background: var(--navy-50);
    }
    .faq-answer {
      padding: 1rem 1.25rem;
      background: var(--bg-page);
      border-top: 1px solid var(--border-light);
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    .help-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .emergency-sidebar-card {
      padding: 1.5rem;
      border: 1px solid #fee2e2;
      background: #ffffff;
    }
    .emergency-badge-tag {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-weight: 800;
      color: #dc2626;
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
      letter-spacing: 0.04em;
    }
    .sidebar-sub {
      font-size: 0.775rem;
      color: var(--text-muted);
      margin-bottom: 1.25rem;
    }
    .helpline-contact-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .helpline-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem;
      border-radius: var(--radius-sm);
      text-decoration: none;
      transition: background 0.15s;
    }
    .helpline-row:hover {
      background: var(--navy-50);
    }
    .help-icon-box {
      width: 34px;
      height: 34px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      color: #ffffff;
      flex-shrink: 0;
    }
    .bg-navy { background: #0f2347; }
    .bg-red { background: #dc2626; }
    .bg-orange { background: #ea580c; }
    .bg-yellow { background: #ca8a04; }
    .bg-purple { background: #7c3aed; }
    .bg-blue { background: #0284c7; }
    .help-title {
      display: block;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .help-number {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--navy-900);
    }
    .quick-actions-card {
      padding: 1.5rem;
    }
    .quick-actions-card h4 {
      margin: 0 0 0.25rem;
      font-size: 1rem;
      color: var(--navy-900);
    }

    @media (max-width: 960px) {
      .help-layout { grid-template-columns: 1fr; }
      .photo-tips-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class HelpComponent {
  langService = inject(LanguageService);

  faqs = [
    {
      q: 'Why did my complaint receive a P2 Medium priority instead of P0?',
      a: 'The Smart Priority Engine reserves P0 exclusively for immediate, severe physical threats to human life (such as dangling high-voltage wires, deep open manholes submerged in flood water, or structural collapse). Routine garbage overflow or broken streetlights without live wire hazards are classified as P2 Medium, but accumulate automatic aging points every day they remain unresolved.',
      open: true
    },
    {
      q: 'Will my phone number or email be made public?',
      a: 'Absolutely not. Akhand Bharat Seva enforces strict privacy masking. Your telephone number and email address are solely stored for municipal officer verification and status notification. On the Public Grievances Board, your identity is either displayed as "Citizen FirstName X." or "Anonymous Citizen" if you chose the anonymous toggle.',
      open: false
    },
    {
      q: 'What is a "Civic Hotspot"?',
      a: 'A hotspot is identified when 2 or more related complaints are lodged within a 350-meter radius (such as repeated waterlogging and pothole reports around Cyber Towers or Charminar). The engine groups these into a geographic cluster so engineers can resolve the underlying systemic infrastructure defect rather than treating isolated symptoms.',
      open: false
    },
    {
      q: 'Can administrators manually override the calculated priority?',
      a: 'Yes. An authorized municipal engineer can override priority (for instance, elevating a P2 streetlight issue if CCTV confirms a security hotspot). However, any manual override requires a mandatory recorded justification and timestamp that remains permanently logged in the audit trail.',
      open: false
    },
    {
      q: 'How do I reopen an issue if it was marked resolved prematurely?',
      a: 'Citizens can open the Track Complaint page, search their Complaint ID, and use the feedback / satisfaction section. Submitting a 1 or 2-star rating with remarks re-triggers an inspection alert for the zonal municipal commissioner.',
      open: false
    }
  ];

  toggleFaq(index: number): void {
    this.faqs[index].open = !this.faqs[index].open;
  }
}
