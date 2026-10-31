import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AuthService, AUTHORIZED_ROSTER } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="login-wrapper">
      <!-- Tricolor Top Accent -->
      <div class="tricolor-stripe"></div>

      <!-- Government Header Bar -->
      <div class="gov-top-strip">
        <div class="container strip-content">
          <div class="emblem-group">
            <span class="emblem-glyph">🏛️</span>
            <div>
              <span class="gov-heading">भारत सरकार &bull; Government of India</span>
              <span class="dept-subheading">Ministry of Housing and Urban Affairs &bull; Smart Cities Mission</span>
            </div>
          </div>
          <a routerLink="/" class="btn-citizen-back">
            <i class="bi bi-arrow-left"></i> Citizen Public Portal
          </a>
        </div>
      </div>

      <div class="login-container">
        <div class="login-card card">
          <!-- Card Header -->
          <div class="card-header-block">
            <div class="chakra-emblem">
              <span>☸</span>
            </div>
            <h1 class="portal-main-title">Akhand Bharat Seva</h1>
            <h2 class="portal-sub-title">Municipal Command & Control Portal</h2>
            <div class="security-shield-badge">
              <i class="bi bi-shield-lock-fill"></i>
              <span>RESTRICTED ACCESS &bull; AUTHORIZED PERSONNEL ONLY</span>
            </div>
          </div>

          <!-- Error Alert Banner -->
          <div class="alert-box alert-box-danger" *ngIf="errorMessage">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <span>{{ errorMessage }}</span>
          </div>

          <!-- Login Form -->
          <form (ngSubmit)="onLogin()" class="login-form">
            <div class="form-group">
              <label for="officerEmail" class="form-label">
                <i class="bi bi-envelope-fill"></i> Official Municipal Email Address
              </label>
              <div class="input-wrap">
                <input
                  id="officerEmail"
                  type="email"
                  [(ngModel)]="email"
                  name="email"
                  placeholder="e.g. commissioner@ghmc.gov.in"
                  class="form-control"
                  required
                  autocomplete="username"
                />
              </div>
              <small class="field-hint">Must be an authorized .gov.in or municipal corporation email address.</small>
            </div>

            <div class="form-group">
              <label for="accessCode" class="form-label">
                <i class="bi bi-key-fill"></i> Unique Security Access Code
              </label>
              <div class="input-wrap pass-wrap">
                <input
                  id="accessCode"
                  [type]="showCode ? 'text' : 'password'"
                  [(ngModel)]="accessCode"
                  name="accessCode"
                  placeholder="Enter unique municipal access code"
                  class="form-control font-mono"
                  required
                  autocomplete="current-password"
                />
                <button
                  type="button"
                  class="btn-toggle-eye"
                  (click)="showCode = !showCode"
                  tabindex="-1"
                  aria-label="Toggle password visibility"
                >
                  <i class="bi" [ngClass]="showCode ? 'bi-eye-slash-fill' : 'bi-eye-fill'"></i>
                </button>
              </div>
              <small class="field-hint">Your 12-character confidential departmental security credential.</small>
            </div>

            <div class="form-options">
              <label class="remember-label">
                <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" />
                <span>Remember this authorized terminal</span>
              </label>
            </div>

            <button
              type="submit"
              class="btn btn-saffron btn-login"
              [disabled]="isLoading || !email.trim() || !accessCode.trim()"
            >
              <span *ngIf="!isLoading">
                <i class="bi bi-box-arrow-in-right"></i> Verify Credentials & Enter Command Center
              </span>
              <span *ngIf="isLoading" class="loading-state">
                <span class="spinner-border spinner-border-sm" role="status"></span>
                <span>Authenticating with Municipal Triage Gateway...</span>
              </span>
            </button>
          </form>

          <!-- Quick Access Demo Roster -->
          <div class="demo-roster-box">
            <div class="roster-header">
              <i class="bi bi-person-badge-fill text-navy"></i>
              <strong>Quick Demo Access for Evaluators:</strong>
            </div>
            <p class="roster-desc">Click any authorized role below to auto-fill verified municipal credentials:</p>
            <div class="roster-chips">
              <button
                type="button"
                class="roster-chip chip-commissioner"
                (click)="loadCredentials('commissioner@ghmc.gov.in', 'GHMC-IAS-2026')"
              >
                <div class="chip-avatar">KR</div>
                <div class="chip-info">
                  <strong>Zonal Commissioner (GHMC)</strong>
                  <span>K. Rajeshwar Rao, IAS &bull; Code: GHMC-IAS-2026</span>
                </div>
              </button>

              <button
                type="button"
                class="roster-chip chip-engineer"
                (click)="loadCredentials('engineer@hmwssb.gov.in', 'HMWSSB-ENG-2026')"
              >
                <div class="chip-avatar">VS</div>
                <div class="chip-info">
                  <strong>Chief Water Engineer (HMWSSB)</strong>
                  <span>V. Sharma, SE &bull; Code: HMWSSB-ENG-2026</span>
                </div>
              </button>

              <button
                type="button"
                class="roster-chip chip-admin"
                (click)="loadCredentials('admin@akhandbharat.gov.in', 'SEVA-ADMIN-2026')"
              >
                <div class="chip-avatar">PV</div>
                <div class="chip-info">
                  <strong>Triage Command Director</strong>
                  <span>P. Venkat Reddy &bull; Code: SEVA-ADMIN-2026</span>
                </div>
              </button>
            </div>
          </div>

          <!-- Security Footer Notice -->
          <div class="card-security-footer">
            <i class="bi bi-shield-check text-green"></i>
            <span>Encrypted with SHA-256 TLS &bull; Activity logged for municipal accountability under IT Act 2000.</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-wrapper {
      min-height: 100vh;
      background: linear-gradient(135deg, #0b1120 0%, #0f172a 50%, #1e293b 100%);
      display: flex;
      flex-direction: column;
      font-family: var(--font-sans, system-ui, -apple-system, sans-serif);
    }
    .tricolor-stripe {
      height: 4px;
      width: 100%;
      background: linear-gradient(90deg, #FF9933 0%, #FF9933 33.3%, #FFFFFF 33.3%, #FFFFFF 66.6%, #138808 66.6%, #138808 100%);
    }
    .gov-top-strip {
      background: rgba(15, 23, 42, 0.85);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      padding: 0.75rem 0;
    }
    .strip-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1100px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }
    .emblem-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .emblem-glyph {
      font-size: 1.5rem;
    }
    .gov-heading {
      display: block;
      color: #f8fafc;
      font-size: 0.875rem;
      font-weight: 700;
    }
    .dept-subheading {
      display: block;
      color: #94a3b8;
      font-size: 0.75rem;
    }
    .btn-citizen-back {
      color: #cbd5e1;
      font-size: 0.8125rem;
      text-decoration: none;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.4rem 0.85rem;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.15);
      transition: all 0.2s;
    }
    .btn-citizen-back:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #ffffff;
      border-color: rgba(255, 255, 255, 0.3);
    }

    .login-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1.5rem;
    }
    .login-card {
      background: #ffffff;
      max-width: 580px;
      width: 100%;
      border-radius: 16px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      padding: 2.5rem;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }
    .card-header-block {
      text-align: center;
      margin-bottom: 2rem;
    }
    .chakra-emblem {
      width: 54px;
      height: 54px;
      background: linear-gradient(135deg, #FF9933 0%, #ea580c 100%);
      color: #ffffff;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      margin-bottom: 0.75rem;
      box-shadow: 0 4px 14px rgba(234, 88, 12, 0.35);
    }
    .portal-main-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.25rem;
      letter-spacing: -0.02em;
    }
    .portal-sub-title {
      font-size: 1.05rem;
      font-weight: 600;
      color: #475569;
      margin: 0 0 0.75rem;
    }
    .security-shield-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #fef2f2;
      color: #dc2626;
      border: 1px solid #fee2e2;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.05em;
    }

    .alert-box-danger {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 0.85rem 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .form-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .input-wrap {
      position: relative;
    }
    .pass-wrap {
      display: flex;
      align-items: center;
    }
    .pass-wrap input {
      padding-right: 2.75rem;
    }
    .btn-toggle-eye {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 0.25rem;
      line-height: 1;
    }
    .btn-toggle-eye:hover {
      color: #0f172a;
    }
    .field-hint {
      font-size: 0.75rem;
      color: #64748b;
    }
    .font-mono {
      font-family: monospace;
      letter-spacing: 0.05em;
    }
    .form-options {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .remember-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #475569;
      cursor: pointer;
    }

    .btn-login {
      width: 100%;
      padding: 0.85rem;
      font-size: 1rem;
      font-weight: 700;
      border-radius: 8px;
      background: linear-gradient(135deg, #FF9933 0%, #ea580c 100%);
      color: #ffffff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s ease;
      box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);
    }
    .btn-login:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(234, 88, 12, 0.4);
    }
    .btn-login:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .loading-state {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .demo-roster-box {
      margin-top: 1.75rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
    }
    .roster-header {
      font-size: 0.875rem;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      margin-bottom: 0.25rem;
    }
    .roster-desc {
      font-size: 0.785rem;
      color: #64748b;
      margin: 0 0 0.85rem;
    }
    .roster-chips {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }
    .roster-chip {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0.85rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      transition: all 0.15s ease;
    }
    .roster-chip:hover {
      background: #f1f5f9;
      border-color: #cbd5e1;
      transform: translateX(3px);
    }
    .chip-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #0f172a;
      color: #ffffff;
      font-size: 0.75rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .chip-info strong {
      display: block;
      font-size: 0.825rem;
      color: #1e293b;
    }
    .chip-info span {
      display: block;
      font-size: 0.725rem;
      color: #64748b;
    }

    .card-security-footer {
      margin-top: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.725rem;
      color: #64748b;
      justify-content: center;
      text-align: center;
      line-height: 1.4;
    }
  `]
})
export class AdminLoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  accessCode = '';
  rememberMe = true;
  showCode = false;
  isLoading = false;
  errorMessage: string | null = null;
  returnUrl = '/admin/overview';

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/admin/overview';

    // If already authenticated, redirect straight to returnUrl
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }

  loadCredentials(email: string, code: string): void {
    this.email = email;
    this.accessCode = code;
    this.errorMessage = null;
  }

  async onLogin(): Promise<void> {
    if (!this.email.trim() || !this.accessCode.trim()) return;

    this.isLoading = true;
    this.errorMessage = null;

    try {
      const result = await this.authService.login(this.email, this.accessCode, this.rememberMe);
      if (result.success) {
        this.router.navigateByUrl(this.returnUrl);
      } else {
        this.errorMessage = result.message || 'Authentication failed. Please verify credentials.';
      }
    } catch (e: any) {
      this.errorMessage = 'Network connection failed. Please check backend server.';
    } finally {
      this.isLoading = false;
    }
  }
}
