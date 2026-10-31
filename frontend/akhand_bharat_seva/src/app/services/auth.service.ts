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

    // The server owns authentication and the signed HTTP-only session cookie.
    try {
      const res = await fetch('/api/civic/auth/officer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: cleanEmail, access_code: cleanCode })
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.officer) {
          this.persistSession(data.officer, rememberMe);
          return { success: true };
        }
      }
      return { success: false, message: 'Access Denied: Invalid official email or unique municipal access code.' };
    } catch (e) {
      return { success: false, message: 'Network connection failed. Please check the municipal server.' };
    }
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
    void fetch('/admin/logout', { credentials: 'same-origin' });
    this.router.navigate(['/admin/login']);
  }
}
