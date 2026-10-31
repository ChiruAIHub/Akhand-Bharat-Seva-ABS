import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="app-footer">
      <!-- Tricolor Accent Top -->
      <div class="tricolor-stripe"></div>

      <!-- Demo Disclaimer Callout -->
      <div class="footer-disclaimer-bar">
        <div class="container disclaimer-content">
          <i class="bi bi-shield-exclamation text-saffron"></i>
          <div>
            <strong>{{ langService.t('footer.disclaimer') }}</strong>
            <p>
              Triage priorities (P0/P1/P2/P3), response timelines, and emergency alerts are calculated via an automated, rules-based engine for demonstration. No real government dispatch is initiated.
            </p>
          </div>
        </div>
      </div>

      <!-- Main Footer Columns -->
      <div class="container footer-main">
        <div class="footer-grid">
          <!-- Col 1: Brand Info -->
          <div class="footer-col brand-col">
            <div class="footer-brand">
              <span class="footer-emblem">🏛️</span>
              <div>
                <h3 class="footer-title">{{ langService.t('app.title') }}</h3>
                <span class="footer-subtitle">అఖండ భారత్ సేవ &bull; Telangana & Pan-Bharat</span>
              </div>
            </div>
            <p class="footer-mission">
              Empowering citizens to report civic grievances with GPS precision and experiencing transparent, rules-based priority resolution that puts public safety and accountability first.
            </p>
            <div class="footer-social-badges">
              <span class="badge badge-secondary"><i class="bi bi-shield-check"></i> OpenStreetMap Powered</span>
              <span class="badge badge-secondary"><i class="bi bi-cpu"></i> Rules-Based Engine</span>
              <span class="badge badge-secondary"><i class="bi bi-lock-fill"></i> Privacy Safe</span>
            </div>
          </div>

          <!-- Col 2: Citizen Portals -->
          <div class="footer-col">
            <h4 class="col-heading">Citizen Services</h4>
            <ul class="footer-links">
              <li><a routerLink="/report"><i class="bi bi-chevron-right"></i> Lodge New Grievance</a></li>
              <li><a routerLink="/track"><i class="bi bi-chevron-right"></i> Track Complaint Status</a></li>
              <li><a routerLink="/public-issues"><i class="bi bi-chevron-right"></i> Public Grievance Transparency Board</a></li>
              <li><a routerLink="/help"><i class="bi bi-chevron-right"></i> Priority FAQ & Guidelines</a></li>
              <li><a routerLink="/admin"><i class="bi bi-chevron-right"></i> Officer Administration Dashboard</a></li>
            </ul>
          </div>

          <!-- Col 3: Key Civic Categories -->
          <div class="footer-col">
            <h4 class="col-heading">Civic Categories</h4>
            <ul class="footer-links">
              <li><a routerLink="/report" [queryParams]="{cat: 'Roads & Potholes'}"><i class="bi bi-cone-striped"></i> Roads & Potholes</a></li>
              <li><a routerLink="/report" [queryParams]="{cat: 'Garbage & Sanitation'}"><i class="bi bi-trash3"></i> Garbage & Sanitation</a></li>
              <li><a routerLink="/report" [queryParams]="{cat: 'Sewage & Drainage'}"><i class="bi bi-water"></i> Sewage & Drainage</a></li>
              <li><a routerLink="/report" [queryParams]="{cat: 'Water Supply'}"><i class="bi bi-droplet-half"></i> Water Supply</a></li>
              <li><a routerLink="/report" [queryParams]="{cat: 'Streetlights & Electricity'}"><i class="bi bi-lightning-charge"></i> Streetlights & Electricity</a></li>
              <li><a routerLink="/report" [queryParams]="{cat: 'Parks & Gardens'}"><i class="bi bi-tree"></i> Parks & Gardens</a></li>
            </ul>
          </div>

          <!-- Col 4: Emergency Contacts & Helplines -->
          <div class="footer-col">
            <h4 class="col-heading">Emergency Civic Helplines</h4>
            <div class="emergency-list">
              <div class="emergency-item">
                <i class="bi bi-telephone-outbound text-saffron"></i>
                <div>
                  <span class="helpline-name">GHMC Grievance Helpline:</span>
                  <a href="tel:04021111111" class="helpline-num">040-21111111</a>
                </div>
              </div>
              <div class="emergency-item">
                <i class="bi bi-shield-fill text-danger"></i>
                <div>
                  <span class="helpline-name">Police Emergency:</span>
                  <a href="tel:100" class="helpline-num">100 / 112</a>
                </div>
              </div>
              <div class="emergency-item">
                <i class="bi bi-heart-pulse-fill text-danger"></i>
                <div>
                  <span class="helpline-name">Medical & Ambulance:</span>
                  <a href="tel:108" class="helpline-num">108</a>
                </div>
              </div>
              <div class="emergency-item">
                <i class="bi bi-fire text-saffron"></i>
                <div>
                  <span class="helpline-name">Fire & Rescue Service:</span>
                  <a href="tel:101" class="helpline-num">101</a>
                </div>
              </div>
              <div class="emergency-item">
                <i class="bi bi-lightning text-warning"></i>
                <div>
                  <span class="helpline-name">TSSPDCL Power Emergency:</span>
                  <a href="tel:1912" class="helpline-num">1912</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p class="copyright-text">
            &copy; 2026 <strong>Akhand Bharat Seva</strong> &bull; {{ langService.t('footer.rights') }}
          </p>
          <div class="footer-meta">
            <span>Built with Angular 22 &bull; TypeScript &bull; Leaflet &bull; Chart.js</span>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .app-footer {
      background-color: var(--navy-950);
      color: #94a3b8;
      margin-top: auto;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
    .footer-disclaimer-bar {
      background-color: rgba(249, 115, 22, 0.08);
      border-bottom: 1px solid rgba(249, 115, 22, 0.2);
      padding: 0.85rem 0;
      color: #fed7aa;
      font-size: 0.8125rem;
    }
    .disclaimer-content {
      display: flex;
      align-items: center;
      gap: 0.85rem;
    }
    .disclaimer-content p {
      margin: 2px 0 0;
      color: #cbd5e1;
      font-size: 0.775rem;
    }
    .text-saffron {
      color: #f97316;
    }
    .text-danger {
      color: #ef4444;
    }
    .text-warning {
      color: #f59e0b;
    }

    .footer-main {
      padding: 3.5rem 1.25rem 2rem;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr 1fr 1.2fr;
      gap: 2.5rem;
      margin-bottom: 2.5rem;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    .footer-emblem {
      font-size: 1.75rem;
    }
    .footer-title {
      font-size: 1.25rem;
      color: #ffffff;
      margin: 0;
    }
    .footer-subtitle {
      font-size: 0.8rem;
      color: var(--saffron-400);
      font-weight: 500;
    }
    .footer-mission {
      font-size: 0.875rem;
      line-height: 1.6;
      color: #94a3b8;
      margin-bottom: 1.25rem;
    }
    .footer-social-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .badge-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #cbd5e1;
      border: 1px solid rgba(255, 255, 255, 0.15);
      font-size: 0.725rem;
      padding: 0.25rem 0.6rem;
    }

    .col-heading {
      color: #ffffff;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      margin-bottom: 1.25rem;
      position: relative;
      padding-bottom: 0.5rem;
    }
    .col-heading::after {
      content: '';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 28px;
      height: 2px;
      background: var(--saffron-500);
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .footer-links a {
      color: #94a3b8;
      font-size: 0.875rem;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.15s ease;
    }
    .footer-links a:hover {
      color: #ffffff;
      transform: translateX(3px);
    }

    .emergency-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .emergency-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.85rem;
    }
    .helpline-name {
      display: block;
      color: #94a3b8;
      font-size: 0.75rem;
    }
    .helpline-num {
      color: #f8fafc;
      font-weight: 700;
      font-size: 0.9rem;
      letter-spacing: 0.02em;
    }
    .helpline-num:hover {
      color: var(--saffron-400);
    }

    .footer-bottom {
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      font-size: 0.8125rem;
    }
    .copyright-text strong {
      color: #ffffff;
    }
    .footer-meta {
      color: #64748b;
    }

    @media (max-width: 1024px) {
      .footer-grid {
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
      }
    }
    @media (max-width: 640px) {
      .footer-grid {
        grid-template-columns: 1fr;
      }
      .footer-bottom {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class FooterComponent {
  langService = inject(LanguageService);
}
