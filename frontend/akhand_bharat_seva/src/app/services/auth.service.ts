import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';

export interface OfficerUser {
  name: string;
  email: string;
  role: string;
  department: string;
  employeeId: string;
  token: string;
  loginTime: string;
}

const OFFICER_SESSION_KEY = 'abs_officer_session';

export const AUTHORIZED_ROSTER: Record<string, { code: string; name: string; role: string; department: string; empId: string }> = {
  'commissioner@ghmc.gov.in': {
    code: 'GHMC-IAS-2026',
    name: 'K. Rajeshwar Rao, IAS',
    role: 'Zonal Commissioner',
    department: 'Greater Hyderabad Municipal Corporation (GHMC)',
    empId: 'GHMC-EXEC-001'
  },
  'k.rajeshwar@ghmc.gov.in': {
    code: 'GHMC-IAS-2026',
    name: 'K. Rajeshwar Rao, IAS',
    role: 'Zonal Commissioner',
    department: 'Greater Hyderabad Municipal Corporation (GHMC)',
    empId: 'GHMC-EXEC-001'
  },
  'engineer@hmwssb.gov.in': {
    code: 'HMWSSB-ENG-2026',
    name: 'V. Sharma',
    role: 'Superintending Engineer',
    department: 'Sewage & Water Supply (HMWSSB)',
    empId: 'HMWSSB-SE-104'
  },
  'v.sharma@hmwssb.gov.in': {
    code: 'HMWSSB-ENG-2026',
    name: 'V. Sharma',
    role: 'Superintending Engineer',
    department: 'Sewage & Water Supply (HMWSSB)',
    empId: 'HMWSSB-SE-104'
  },
  'admin@akhandbharat.gov.in': {
    code: 'SEVA-ADMIN-2026',
    name: 'P. Venkat Reddy',
    role: 'Municipal Triage Director',
    department: 'Urban Development & Triage Command',
    empId: 'SEVA-ADM-007'
  }
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private officerSignal = signal<OfficerUser | null>(null);

  readonly officer = this.officerSignal.asReadonly();

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      const stored = localStorage.getItem(OFFICER_SESSION_KEY) || sessionStorage.getItem(OFFICER_SESSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email && parsed.name) {
          this.officerSignal.set(parsed);
        }
      }
    } catch (e) {
      console.warn('Failed to restore officer session', e);
    }
  }

  public isAuthenticated(): boolean {
    return this.officerSignal() !== null;
  }

  public async login(email: string, accessCode: string, rememberMe = true): Promise<{ success: boolean; message?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = accessCode.trim().toUpperCase();

    if (!cleanEmail || !cleanCode) {
      return { success: false, message: 'Please provide both municipal email and access code.' };
    }

    // Try backend verification first
    try {
      const res = await fetch('/api/civic/auth/officer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, access_code: cleanCode })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.officer) {
          this.persistSession(data.officer, rememberMe);
          return { success: true };
        }
      }
    } catch (e) {
      console.log('Backend auth offline fallback check...');
    }

    // Offline / Instant Fallback verification against local verified roster
    const officerMatch = AUTHORIZED_ROSTER[cleanEmail];
    if (officerMatch && officerMatch.code.toUpperCase() === cleanCode) {
      const officer: OfficerUser = {
        name: officerMatch.name,
        email: cleanEmail,
        role: officerMatch.role,
        department: officerMatch.department,
        employeeId: officerMatch.empId,
        token: 'auth-offline-' + Math.random().toString(36).substring(2, 10),
        loginTime: new Date().toISOString()
      };
      this.persistSession(officer, rememberMe);
      return { success: true };
    }

    // Generic .gov.in wildcard with standard passkeys
    if (
      (cleanEmail.endsWith('.gov.in') || cleanEmail.endsWith('.nic.in') || cleanEmail.includes('admin')) &&
      ['MUNICIPAL-2026', 'GHMC-2026', 'SEVA-2026'].includes(cleanCode)
    ) {
      const prefix = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const officer: OfficerUser = {
        name: `Officer ${prefix}`,
        email: cleanEmail,
        role: 'Authorized Municipal Personnel',
        department: 'Municipal Operations & Field Triage',
        employeeId: 'GOV-EMP-' + Math.floor(1000 + Math.random() * 9000),
        token: 'auth-offline-' + Math.random().toString(36).substring(2, 10),
        loginTime: new Date().toISOString()
      };
      this.persistSession(officer, rememberMe);
      return { success: true };
    }

    return {
      success: false,
      message: 'Access Denied: Invalid official email or unique municipal access code.'
    };
  }

  private persistSession(user: OfficerUser, rememberMe: boolean): void {
    this.officerSignal.set(user);
    const json = JSON.stringify(user);
    if (rememberMe) {
      localStorage.setItem(OFFICER_SESSION_KEY, json);
    } else {
      sessionStorage.setItem(OFFICER_SESSION_KEY, json);
    }
  }

  public logout(): void {
    this.officerSignal.set(null);
    localStorage.removeItem(OFFICER_SESSION_KEY);
    sessionStorage.removeItem(OFFICER_SESSION_KEY);
    this.router.navigate(['/admin/login']);
  }
}
