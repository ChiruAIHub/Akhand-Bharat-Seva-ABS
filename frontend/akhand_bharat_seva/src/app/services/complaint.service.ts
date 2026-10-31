import { Injectable, signal } from '@angular/core';
import {
  Complaint,
  ComplaintCategory,
  ComplaintStatus,
  DepartmentType,
  IssueAge,
  PriorityLevel,
  PublicImpact,
  DepartmentSummary,
  PriorityScoreBreakdown,
  LocationInfo,
  CitizenInfo
} from '../models/complaint.model';

const STORAGE_KEY = 'abs_civic_complaints_v3';

@Injectable({
  providedIn: 'root'
})
export class ComplaintService {
  private complaintsSignal = signal<Complaint[]>([]);

  readonly complaints = this.complaintsSignal.asReadonly();

  constructor() {
    this.initData();
  }

  private initData(): void {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.complaintsSignal.set(this.recalculateAndDetect(parsed));
          return;
        }
      } catch (e) {
        console.error('Failed to parse stored complaints', e);
      }
    }
    // Seed initial dataset
    this.resetToSeedData();
  }

  private saveToStorage(list: Complaint[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    this.complaintsSignal.set(list);
  }

  /**
   * Smart Priority Engine: Rules-based calculation
   * Priorities:
   * P0 - Emergency (Immediate danger, exposed wires, open manholes, hazardous flooding)
   * P1 - High (Major sewage contamination, dangerous deep road potholes, critical water loss)
   * P2 - Medium (Blocked drains, repeated garbage collection failure, broken streetlights)
   * P3 - Low (Minor footpath damage, damaged park bench, cosmetic maintenance)
   *
   * Older unresolved complaints rank ahead of newer comparable ones.
   * A new emergency will still outrank an old routine complaint!
   */
  public calculateSmartPriority(
    category: ComplaintCategory,
    subcategory: string,
    description: string,
    immediateDanger: boolean,
    publicImpact: PublicImpact,
    issueAge: IssueAge,
    submittedAt?: string
  ): PriorityScoreBreakdown {
    let score = 0;
    const lowerDesc = (description + ' ' + subcategory).toLowerCase();

    // 1. Immediate Danger Check (Guaranteed P0 boost)
    let dangerBonus = 0;
    const hasEmergencyKeywords =
      immediateDanger ||
      lowerDesc.includes('live wire') ||
      lowerDesc.includes('electric shock') ||
      lowerDesc.includes('open manhole') ||
      lowerDesc.includes('sinkhole') ||
      lowerDesc.includes('electrocution') ||
      lowerDesc.includes('wall collapse') ||
      lowerDesc.includes('gas leak') ||
      lowerDesc.includes('hazardous flood');

    if (hasEmergencyKeywords) {
      dangerBonus = 1000;
      score += dangerBonus;
    }

    // 2. Category & Subcategory Base Severity
    let severityBonus = 0;
    if (category === 'Streetlights & Electricity') {
      if (hasEmergencyKeywords || lowerDesc.includes('sparking') || lowerDesc.includes('wire')) {
        severityBonus = 500;
      } else {
        severityBonus = 180;
      }
    } else if (category === 'Sewage & Drainage') {
      if (lowerDesc.includes('overflow into drinking') || lowerDesc.includes('hospital') || lowerDesc.includes('manhole')) {
        severityBonus = 420;
      } else {
        severityBonus = 220;
      }
    } else if (category === 'Water Supply') {
      if (lowerDesc.includes('contaminated') || lowerDesc.includes('toxic') || lowerDesc.includes('no water 5 days')) {
        severityBonus = 400;
      } else {
        severityBonus = 200;
      }
    } else if (category === 'Roads & Potholes') {
      if (lowerDesc.includes('crater') || lowerDesc.includes('accident prone') || lowerDesc.includes('highway')) {
        severityBonus = 380;
      } else {
        severityBonus = 210;
      }
    } else if (category === 'Stray Animals') {
      if (lowerDesc.includes('biting') || lowerDesc.includes('aggressive pack') || lowerDesc.includes('rabies')) {
        severityBonus = 350;
      } else {
        severityBonus = 150;
      }
    } else if (category === 'Garbage & Sanitation') {
      if (lowerDesc.includes('hospital waste') || lowerDesc.includes('carcass') || lowerDesc.includes('disease outbreak')) {
        severityBonus = 360;
      } else {
        severityBonus = 190;
      }
    } else if (category === 'Public Toilets') {
      severityBonus = 140;
    } else if (category === 'Footpaths') {
      severityBonus = 120;
    } else if (category === 'Parks & Gardens') {
      severityBonus = 80;
    } else {
      severityBonus = 100;
    }
    score += severityBonus;

    // 3. Public Impact Bonus
    let impactBonus = 0;
    if (publicImpact.startsWith('Critical')) {
      impactBonus = 180;
    } else if (publicImpact.startsWith('High')) {
      impactBonus = 120;
    } else if (publicImpact.startsWith('Medium')) {
      impactBonus = 60;
    } else {
      impactBonus = 20;
    }
    score += impactBonus;

    // 4. Waiting Time & Issue Age Bonus
    // This ensures older unresolved complaints rank higher than comparable newer ones
    let ageBonus = 0;
    switch (issueAge) {
      case 'Just happened (< 2 hours)':
        ageBonus = 10;
        break;
      case '1-2 days':
        ageBonus = 30;
        break;
      case '3-7 days':
        ageBonus = 80; // 7-day-old medium gets +80 pts boost
        break;
      case '1-2 weeks':
        ageBonus = 140;
        break;
      case 'Over a month':
        ageBonus = 220;
        break;
    }

    // Additional elapsed days bonus if submitted earlier
    if (submittedAt) {
      const elapsedDays = Math.max(0, (Date.now() - new Date(submittedAt).getTime()) / (1000 * 60 * 60 * 24));
      ageBonus += Math.min(100, Math.floor(elapsedDays * 12));
    }
    score += ageBonus;

    // Determine Priority Level
    let priority: PriorityLevel = 'P3';
    let reason = '';

    if (score >= 950 || hasEmergencyKeywords) {
      priority = 'P0';
      reason = 'Immediate Danger / Life-Safety Hazard detected. Immediate response team dispatched.';
    } else if (score >= 480) {
      priority = 'P1';
      reason = 'High civic disruption or major public health impact on arterial transit route.';
    } else if (score >= 230) {
      priority = 'P2';
      reason = 'Standard neighborhood service defect affecting local residents and hygiene.';
    } else {
      priority = 'P3';
      reason = 'Minor maintenance or cosmetic civic issue with low immediate safety risk.';
    }

    return {
      score,
      priority,
      reason,
      dangerBonus,
      severityBonus,
      impactBonus,
      ageBonus
    };
  }

  /**
   * Recalculates scores, identifies duplicates and nearby hotspots
   */
  private recalculateAndDetect(list: Complaint[]): Complaint[] {
    // 1. Recalculate priority scores
    const updated = list.map(c => {
      if (c.priorityOverride) {
        // Keep override priority but maintain score sorting
        const breakdown = this.calculateSmartPriority(
          c.category,
          c.subcategory,
          c.description,
          c.immediateDanger,
          c.publicImpact,
          c.issueAge,
          c.submittedAt
        );
        return {
          ...c,
          priority: c.priorityOverride.newPriority,
          priorityScore: breakdown.score,
          priorityReason: `[Admin Override]: ${c.priorityOverride.reason} (Rule score: ${breakdown.score})`
        };
      }

      const breakdown = this.calculateSmartPriority(
        c.category,
        c.subcategory,
        c.description,
        c.immediateDanger,
        c.publicImpact,
        c.issueAge,
        c.submittedAt
      );

      return {
        ...c,
        priority: breakdown.priority,
        priorityScore: breakdown.score,
        priorityReason: breakdown.reason
      };
    });

    // 2. Detect duplicate reports and hotspots (within ~350m radius)
    for (let i = 0; i < updated.length; i++) {
      let nearbyCount = 0;
      let duplicateCandidate = '';

      for (let j = 0; j < updated.length; j++) {
        if (i === j) continue;
        const distMeters = this.getHaversineDistance(
          updated[i].location.latitude,
          updated[i].location.longitude,
          updated[j].location.latitude,
          updated[j].location.longitude
        );

        if (distMeters <= 400) {
          nearbyCount++;
          if (
            updated[i].category === updated[j].category &&
            (updated[i].subcategory === updated[j].subcategory ||
             updated[i].title.toLowerCase().includes(updated[j].title.toLowerCase().slice(0, 10)))
          ) {
            duplicateCandidate = `Potential duplicate of ${updated[j].id} (${Math.round(distMeters)}m away)`;
          }
        }
      }

      updated[i].hotspotCount = nearbyCount;
      if (nearbyCount >= 2) {
        updated[i].hotspotClusterId = `CLUSTER-${updated[i].location.area.replace(/\s+/g, '').toUpperCase()}`;
      } else {
        updated[i].hotspotClusterId = undefined;
      }
      updated[i].duplicateAlert = duplicateCandidate || undefined;
    }

    return updated;
  }

  // Calculate Haversine distance in meters
  private getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  public getDepartmentForCategory(category: ComplaintCategory): DepartmentType {
    switch (category) {
      case 'Roads & Potholes':
      case 'Footpaths':
        return 'Roads & Bridges (GHMC)';
      case 'Garbage & Sanitation':
      case 'Public Toilets':
        return 'Solid Waste & Sanitation (GHMC)';
      case 'Sewage & Drainage':
        return 'Sewage & Drainage (HMWSSB)';
      case 'Water Supply':
        return 'Water Supply (HMWSSB)';
      case 'Streetlights & Electricity':
        return 'Electricity & Streetlights (TSSPDCL)';
      case 'Parks & Gardens':
        return 'Urban Forestry & Parks (GHMC)';
      case 'Stray Animals':
      case 'Other Issues':
      default:
        return 'General Civic Services';
    }
  }

  public generateNextId(): string {
    const year = new Date().getFullYear();
    const existing = this.complaintsSignal();
    const count = existing.length + 1;
    return `ABS-${year}-${count.toString().padStart(4, '0')}`;
  }

  public submitComplaint(data: {
    category: ComplaintCategory;
    subcategory: string;
    title: string;
    description: string;
    issueAge: IssueAge;
    location: LocationInfo;
    photoUrl?: string;
    citizen: CitizenInfo;
    immediateDanger?: boolean;
    publicImpact?: PublicImpact;
  }): Complaint {
    const id = this.generateNextId();
    const now = new Date().toISOString();
    const immediateDanger = data.immediateDanger || false;
    const publicImpact = data.publicImpact || 'Medium - Residential Colony / Sector Road';
    const department = this.getDepartmentForCategory(data.category);

    const breakdown = this.calculateSmartPriority(
      data.category,
      data.subcategory,
      data.description,
      immediateDanger,
      publicImpact,
      data.issueAge,
      now
    );

    const textToCheck = `${data.title} ${data.description}`;
    let detectedLang = 'en';
    if (/[\u0C00-\u0C7F]/.test(textToCheck)) detectedLang = 'te';
    else if (/[\u0900-\u097F]/.test(textToCheck)) detectedLang = 'hi';
    else if (/[\u0B80-\u0BFF]/.test(textToCheck)) detectedLang = 'ta';
    else if (/[\u0980-\u09FF]/.test(textToCheck)) detectedLang = 'bn';

    const newComplaint: Complaint = {
      id,
      title: data.title,
      category: data.category,
      subcategory: data.subcategory,
      description: data.description,
      detectedLanguage: detectedLang,
      originalText: data.description,
      translatedEnglishReport: detectedLang !== 'en' ? `${data.title}: ${data.description}` : undefined,
      issueAge: data.issueAge,
      submittedAt: now,
      updatedAt: now,
      location: data.location,
      photoUrl: data.photoUrl,
      citizen: data.citizen,
      priority: breakdown.priority,
      priorityScore: breakdown.score,
      priorityReason: breakdown.reason,
      immediateDanger,
      publicImpact,
      status: 'Submitted',
      department,
      adminNotes: [],
      statusTimeline: [
        {
          status: 'Submitted',
          timestamp: now,
          remarks: 'Grievance lodged digitally via Citizen Web Portal. Assigned initial priority via Smart Engine.',
          updatedBy: 'Citizen Self-Service'
        }
      ]
    };

    const currentList = this.complaintsSignal();
    const updatedList = this.recalculateAndDetect([newComplaint, ...currentList]);
    this.saveToStorage(updatedList);

    // Asynchronously dispatch to Gemma 4 Civic AI & GIS Backend
    try {
      fetch('/api/civic/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${data.title}. ${data.description}`.trim(),
          citizen_name: data.citizen?.name || 'Anonymous Resident',
          citizen_phone: data.citizen?.phone || '+91 98000 00000',
          latitude: data.location?.latitude || 17.3850,
          longitude: data.location?.longitude || 78.4867,
          locality_hint: `${data.location?.area || ''} ${data.location?.address || ''}`.trim(),
          image_name_or_url: data.photoUrl || undefined
        })
      })
      .then(res => res.json())
      .then(gemma => {
        console.log('[Gemma 4 Backend Triage]', gemma);
        if (gemma && gemma.case_id) {
          (newComplaint as any).gemmaCaseId = gemma.case_id;
          (newComplaint as any).gemmaTriage = gemma;
          if (gemma.detected_language) newComplaint.detectedLanguage = gemma.detected_language;
          if (gemma.original_text) newComplaint.originalText = gemma.original_text;
          if (gemma.translated_english_report) newComplaint.translatedEnglishReport = gemma.translated_english_report;
          if (gemma.staff_summary) newComplaint.staffSummary = gemma.staff_summary;
          this.saveToStorage(this.complaintsSignal());
        }
      })
      .catch(err => console.warn('[Gemma Backend Sync Error]', err));
    } catch (e) {
      // Graceful offline fallback
    }

    return newComplaint;
  }

  public updateStatus(id: string, newStatus: ComplaintStatus, remarks: string, officerName: string): boolean {
    const list = this.complaintsSignal();
    const index = list.findIndex(c => c.id === id);
    if (index === -1) return false;

    const c = list[index];
    const now = new Date().toISOString();
    const updatedItem: Complaint = {
      ...c,
      status: newStatus,
      updatedAt: now,
      statusTimeline: [
        ...c.statusTimeline,
        {
          status: newStatus,
          timestamp: now,
          remarks: remarks || `Status updated to ${newStatus}`,
          updatedBy: officerName || 'Municipal Officer'
        }
      ]
    };

    const updatedList = [...list];
    updatedList[index] = updatedItem;
    this.saveToStorage(this.recalculateAndDetect(updatedList));

    // Asynchronously synchronize status update with backend
    try {
      const caseIdToSync = (c as any).gemmaCaseId || id;
      fetch(`/api/civic/complaints/${encodeURIComponent(caseIdToSync)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus.toUpperCase().replace(/\s+/g, '_'),
          remarks: remarks || `Status updated to ${newStatus}`,
          officer_name: officerName || 'Municipal Officer'
        })
      }).catch(err => console.warn('[Backend Status Sync Error]', err));
    } catch (e) {
      // Graceful offline fallback
    }

    return true;
  }

  public reassignDepartment(id: string, department: DepartmentType, remarks: string, officerName: string): boolean {
    const list = this.complaintsSignal();
    const index = list.findIndex(c => c.id === id);
    if (index === -1) return false;

    const c = list[index];
    const now = new Date().toISOString();
    const updatedItem: Complaint = {
      ...c,
      department,
      updatedAt: now,
      adminNotes: [
        ...c.adminNotes,
        {
          id: 'note-' + Date.now(),
          author: officerName,
          note: `Department reassigned to ${department}. Reason: ${remarks}`,
          timestamp: now
        }
      ]
    };

    const updatedList = [...list];
    updatedList[index] = updatedItem;
    this.saveToStorage(updatedList);
    return true;
  }

  public overridePriority(id: string, newPriority: PriorityLevel, reason: string, officerName: string): boolean {
    const list = this.complaintsSignal();
    const index = list.findIndex(c => c.id === id);
    if (index === -1) return false;

    const c = list[index];
    const now = new Date().toISOString();
    const updatedItem: Complaint = {
      ...c,
      priority: newPriority,
      updatedAt: now,
      priorityOverride: {
        originalPriority: c.priority,
        newPriority,
        overriddenBy: officerName,
        reason,
        timestamp: now
      },
      priorityReason: `[Admin Override by ${officerName}]: ${reason}`,
      adminNotes: [
        ...c.adminNotes,
        {
          id: 'note-' + Date.now(),
          author: officerName,
          note: `Priority manually overridden from ${c.priority} to ${newPriority}. Reason: ${reason}`,
          timestamp: now
        }
      ]
    };

    const updatedList = [...list];
    updatedList[index] = updatedItem;
    this.saveToStorage(this.recalculateAndDetect(updatedList));

    return true;
  }

  public addAdminNote(id: string, note: string, author: string): boolean {
    const list = this.complaintsSignal();
    const index = list.findIndex(c => c.id === id);
    if (index === -1) return false;

    const c = list[index];
    const now = new Date().toISOString();
    const updatedItem: Complaint = {
      ...c,
      updatedAt: now,
      adminNotes: [
        ...c.adminNotes,
        {
          id: 'note-' + Date.now(),
          author,
          note,
          timestamp: now
        }
      ]
    };

    const updatedList = [...list];
    updatedList[index] = updatedItem;
    this.saveToStorage(updatedList);
    return true;
  }

  public getComplaintById(id: string): Complaint | undefined {
    return this.complaintsSignal().find(c => c.id.toUpperCase() === id.trim().toUpperCase());
  }

  public getDepartmentsSummary(): DepartmentSummary[] {
    const list = this.complaintsSignal();
    const departments: { name: DepartmentType; short: string; staff: number }[] = [
      { name: 'Roads & Bridges (GHMC)', short: 'Roads & Bridges', staff: 42 },
      { name: 'Solid Waste & Sanitation (GHMC)', short: 'Sanitation', staff: 65 },
      { name: 'Sewage & Drainage (HMWSSB)', short: 'Sewage & Drainage', staff: 34 },
      { name: 'Water Supply (HMWSSB)', short: 'Water Supply', staff: 38 },
      { name: 'Electricity & Streetlights (TSSPDCL)', short: 'Electricity', staff: 28 },
      { name: 'Urban Forestry & Parks (GHMC)', short: 'Parks & Greenery', staff: 20 },
      { name: 'General Civic Services', short: 'General Civic', staff: 15 }
    ];

    return departments.map(d => {
      const deptComplaints = list.filter(c => c.department === d.name);
      const total = deptComplaints.length;
      const active = deptComplaints.filter(c => c.status !== 'Resolved' && c.status !== 'Closed').length;
      const resolved = deptComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length;
      const emergency = deptComplaints.filter(c => c.priority === 'P0' && c.status !== 'Resolved' && c.status !== 'Closed').length;

      let capacity: 'Normal' | 'Moderate' | 'Overloaded' = 'Normal';
      if (active > 6 || emergency > 1) {
        capacity = 'Overloaded';
      } else if (active >= 3) {
        capacity = 'Moderate';
      }

      return {
        name: d.name,
        shortName: d.short,
        totalComplaints: total,
        activeComplaints: active,
        resolvedComplaints: resolved,
        emergencyCount: emergency,
        avgResolutionDays: 2.4,
        staffAssigned: d.staff,
        capacityStatus: capacity
      };
    });
  }

  public exportComplaintsToCsv(): void {
    const list = this.complaintsSignal();
    const headers = [
      'Complaint ID',
      'Title',
      'Category',
      'Subcategory',
      'Priority',
      'Score',
      'Status',
      'Department',
      'Area',
      'Latitude',
      'Longitude',
      'Submitted Date',
      'Issue Age',
      'Citizen Name (Masked)',
      'Public Impact'
    ];

    const rows = list.map(c => [
      `"${c.id}"`,
      `"${c.title.replace(/"/g, '""')}"`,
      `"${c.category}"`,
      `"${c.subcategory}"`,
      `"${c.priority}"`,
      c.priorityScore,
      `"${c.status}"`,
      `"${c.department}"`,
      `"${c.location.area}"`,
      c.location.latitude,
      c.location.longitude,
      `"${new Date(c.submittedAt).toLocaleDateString()}"`,
      `"${c.issueAge}"`,
      `"${c.citizen.isAnonymous ? 'Anonymous' : c.citizen.name}"`,
      `"${c.publicImpact}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Akhand_Bharat_Seva_Complaints_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Complete Seed Data:
   * Satisfies all explicit hackathon rules:
   * 1. A new P0 emergency (exposed live wire / hazardous open manhole)
   * 2. A 7-day-old unresolved medium complaint ranked above a comparable 1-day-old complaint
   * 3. A serious public-health issue
   * 4. Repeated nearby complaints forming a potential hotspot
   * 5. A low-priority maintenance issue
   * Coordinates in Hyderabad (lat ~17.36 - 17.48, lng ~78.36 - 78.53)
   */
  public resetToSeedData(): void {
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;

    const seed: Complaint[] = [
      // 1. BRAND NEW P0 EMERGENCY (Exposed live wire, Begumpet) - Reported Today
      {
        id: 'ABS-2026-0001',
        title: 'Exposed live high-tension wire hanging near primary school gate',
        category: 'Streetlights & Electricity',
        subcategory: 'Exposed Live Wire / Hazard',
        description: 'Heavy wind snapped an overhead cable. High-voltage wire is dangling right opposite St. Mary Primary School gate, sparking periodically. High risk of electrocution for students and passersby.',
        issueAge: 'Just happened (< 2 hours)',
        submittedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(),
        location: {
          address: 'Plot 44, Begumpet Main Road, opposite St. Mary School',
          landmark: 'Near Prakash Nagar Metro Station',
          area: 'Begumpet',
          latitude: 17.4435,
          longitude: 78.4682,
          pincode: '500016'
        },
        photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
        citizen: {
          name: 'Venkata Rao',
          phone: '+91 98490 11223',
          email: 'venkat.rao@example.com',
          isAnonymous: false
        },
        priority: 'P0',
        priorityScore: 1250,
        priorityReason: 'Immediate Danger: Exposed high-voltage electric wire in heavy pedestrian school zone.',
        immediateDanger: true,
        publicImpact: 'Critical - Hospital / School / High Traffic Arterial',
        status: 'Assigned',
        department: 'Electricity & Streetlights (TSSPDCL)',
        adminNotes: [
          {
            id: 'n1',
            author: 'Chief Vigilance Officer',
            note: 'Emergency quick response team dispatched from Begumpet substation with bucket truck. Power isolated on feeder line 4.',
            timestamp: new Date(now.getTime() - 90 * 60 * 1000).toISOString()
          }
        ],
        statusTimeline: [
          {
            status: 'Submitted',
            timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            remarks: 'Citizen reported imminent danger with photo proof.',
            updatedBy: 'Citizen Portal'
          },
          {
            status: 'Assigned',
            timestamp: new Date(now.getTime() - 90 * 60 * 1000).toISOString(),
            remarks: 'Escalated to TSSPDCL Emergency Feeder Crew.',
            updatedBy: 'Triage System'
          }
        ]
      },

      // 2. OPEN DANGEROUS MANHOLE (P0 Emergency, Mehdipatnam) - Reported 4 hours ago
      {
        id: 'ABS-2026-0002',
        title: 'Dangerous deep open drainage manhole in waterlogged lane',
        category: 'Sewage & Drainage',
        subcategory: 'Missing Manhole Cover',
        description: 'Heavy rain washed away the concrete manhole slab. The 8-foot-deep manhole is completely submerged and invisible under floodwater. Two two-wheelers already skidded nearby.',
        issueAge: 'Just happened (< 2 hours)',
        submittedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(),
        location: {
          address: 'Rethibowli Ring Road Junction, near Pillar 42',
          landmark: 'Opposite Rhythu Bazaar',
          area: 'Mehdipatnam',
          latitude: 17.3916,
          longitude: 78.4357,
          pincode: '500028'
        },
        photoUrl: 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=600&q=80',
        citizen: {
          name: 'Mohammed Arshad',
          phone: '+91 97000 33445',
          email: 'arshad.hyd@example.com',
          isAnonymous: false
        },
        priority: 'P0',
        priorityScore: 1180,
        priorityReason: 'Immediate Danger: Submerged missing manhole cover on busy transit junction poses fatal drowning/accident risk.',
        immediateDanger: true,
        publicImpact: 'Critical - Hospital / School / High Traffic Arterial',
        status: 'In Progress',
        department: 'Sewage & Drainage (HMWSSB)',
        adminNotes: [
          {
            id: 'n2',
            author: 'HMWSSB Division 5 AE',
            note: 'Temporary barricades and red flags placed. Heavy-duty cast iron slab being transported.',
            timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
          }
        ],
        statusTimeline: [
          {
            status: 'Submitted',
            timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
            remarks: 'Report received with emergency location flag.',
            updatedBy: 'Citizen Portal'
          },
          {
            status: 'Under Review',
            timestamp: new Date(now.getTime() - 3.5 * 60 * 60 * 1000).toISOString(),
            remarks: 'Validated by Control Room CCTV feed.',
            updatedBy: 'GHMC Central Triage'
          },
          {
            status: 'In Progress',
            timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
            remarks: 'HMWSSB field vehicle on site. Warning signage erected.',
            updatedBy: 'AE Mehdipatnam'
          }
        ]
      },

      // 3. SERIOUS PUBLIC-HEALTH ISSUE (Contaminated drinking water mixed with sewage, Musheerabad) - P1 High
      {
        id: 'ABS-2026-0003',
        title: 'Sewage backflow contaminating municipal drinking water line',
        category: 'Water Supply',
        subcategory: 'Contaminated Water',
        description: 'Tap water has been foul-smelling, yellowish-black with visible sludge for 3 days. Cross-connection between cracked sewage line and drinking main pipe suspected. Multiple children reported fever and vomiting.',
        detectedLanguage: 'te',
        originalText: 'మంచినీటి పైప్‌లైన్‌లో మురుగునీరు కలుస్తోంది. దుర్వాసన వస్తోంది, వెంటనే మరమ్మతులు చేయాలి.',
        translatedEnglishReport: 'Sewage backflow contaminating municipal drinking water pipeline causing sludge and health hazards.',
        staffSummary: 'Water Supply (HMWSSB) emergency response initiated for drinking line contamination in Bholakpur.',
        issueAge: '3-7 days',
        submittedAt: new Date(now.getTime() - 3 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
        location: {
          address: 'Lane 7, Bholakpur, near Community Hall',
          landmark: 'Near Musheerabad Fish Market',
          area: 'Musheerabad',
          latitude: 17.4192,
          longitude: 78.4984,
          pincode: '500020'
        },
        photoUrl: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=600&q=80',
        citizen: {
          name: 'K. Sunitha Reddy',
          phone: '+91 94401 55667',
          email: 'sunitha.reddy@example.com',
          isAnonymous: false
        },
        priority: 'P1',
        priorityScore: 680,
        priorityReason: 'High Public Health Hazard: Contaminated drinking water supply affecting multiple families with waterborne illnesses.',
        immediateDanger: false,
        publicImpact: 'High - Commercial Hub / Main Transit Road',
        status: 'In Progress',
        department: 'Water Supply (HMWSSB)',
        adminNotes: [
          {
            id: 'n3',
            author: 'Chief Medical Officer (Health)',
            note: 'Water samples sent to state lab. Chlorine tablets distributed. Water supply tanker arranged temporarily for lane 7.',
            timestamp: new Date(now.getTime() - 1.5 * dayMs).toISOString()
          }
        ],
        statusTimeline: [
          {
            status: 'Submitted',
            timestamp: new Date(now.getTime() - 3 * dayMs).toISOString(),
            remarks: 'Complaint filed regarding foul drinking water.',
            updatedBy: 'Citizen Portal'
          },
          {
            status: 'Assigned',
            timestamp: new Date(now.getTime() - 2.5 * dayMs).toISOString(),
            remarks: 'Assigned to HMWSSB Quality Assurance Wing.',
            updatedBy: 'Triage System'
          },
          {
            status: 'In Progress',
            timestamp: new Date(now.getTime() - 1.5 * dayMs).toISOString(),
            remarks: 'Pipeline excavation initiated to locate breach.',
            updatedBy: 'HMWSSB Eng'
          }
        ]
      },

      // 4. ROAD CRATER ON ARTERIAL HIGHWAY (P1 High, Madhapur) - Part of Hotspot Cluster
      {
        id: 'ABS-2026-0004',
        title: 'Deep road crater causing bike skids on Cyber Towers flyover ramp',
        category: 'Roads & Potholes',
        subcategory: 'Severe Pothole / Road Cave-in',
        description: 'Large 4-foot wide, 8-inch deep crater on the ascending ramp of Cyber Towers flyover. Rush hour bottleneck and causing heavy vehicle brake failures.',
        issueAge: '1-2 days',
        submittedAt: new Date(now.getTime() - 1.8 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 0.5 * dayMs).toISOString(),
        location: {
          address: 'Hitec City Flyover Entry, Hitec City Main Road',
          landmark: 'Opposite Shilparamam Crafts Village',
          area: 'Madhapur',
          latitude: 17.4498,
          longitude: 78.3789,
          pincode: '500081'
        },
        photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
        citizen: {
          name: 'Rohit Verma',
          phone: '+91 99890 77889',
          email: 'rohit.verma@example.com',
          isAnonymous: false
        },
        priority: 'P1',
        priorityScore: 610,
        priorityReason: 'High Priority: Major road hazard on dense IT Corridor traffic artery.',
        immediateDanger: false,
        publicImpact: 'High - Commercial Hub / Main Transit Road',
        status: 'Assigned',
        department: 'Roads & Bridges (GHMC)',
        adminNotes: [
          {
            id: 'n4',
            author: 'GHMC West Zone EE',
            note: 'Cold-mix asphalt patch scheduled for night maintenance window (11:00 PM - 4:00 AM) to avoid traffic gridlock.',
            timestamp: new Date(now.getTime() - 0.5 * dayMs).toISOString()
          }
        ],
        statusTimeline: [
          {
            status: 'Submitted',
            timestamp: new Date(now.getTime() - 1.8 * dayMs).toISOString(),
            remarks: 'Lodged by daily commuter.',
            updatedBy: 'Citizen Portal'
          },
          {
            status: 'Assigned',
            timestamp: new Date(now.getTime() - 0.5 * dayMs).toISOString(),
            remarks: 'Assigned to GHMC Road Maintenance Division.',
            updatedBy: 'Central Triage'
          }
        ]
      },

      // 5. 7-DAY-OLD UNRESOLVED MEDIUM COMPLAINT (Charminar garbage pile)
      // MUST RANK ABOVE COMPARABLE 1-DAY-OLD MEDIUM COMPLAINT DUE TO AGING ENGINE
      {
        id: 'ABS-2026-0005',
        title: 'Repeated uncollected market garbage dumping behind Charminar',
        category: 'Garbage & Sanitation',
        subcategory: 'Garbage Dump Overflow',
        description: 'Vegetable and commercial waste has accumulated for over seven days near Lad Bazaar lane. The stench is unbearable, stray cattle are tearing bags, and flies are swarming food stalls.',
        detectedLanguage: 'hi',
        originalText: 'चारमीनार लाड बाजार के पास 7 दिनों से कूड़ा जमा है। बदबू असहनीय हो गई है और मक्खियां फैल रही हैं।',
        translatedEnglishReport: 'Uncollected market garbage accumulating for over 7 days near Charminar monument.',
        staffSummary: 'Solid Waste & Sanitation (GHMC) dispatched bobcat compactors for heritage area cleanup.',
        issueAge: '3-7 days',
        submittedAt: new Date(now.getTime() - 7.2 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
        location: {
          address: 'Lad Bazaar Crossing, 150m south of Charminar monument',
          landmark: 'Behind Mecca Masjid parking gate',
          area: 'Charminar',
          latitude: 17.3616,
          longitude: 78.4747,
          pincode: '500002'
        },
        photoUrl: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80',
        citizen: {
          name: 'Syed Qasim Ali',
          phone: '+91 98850 44556',
          email: 'qasim.traders@example.com',
          isAnonymous: false
        },
        priority: 'P2',
        priorityScore: 430, // Elevated medium score due to 7 days age bonus!
        priorityReason: 'Medium Priority with Long Waiting Time boost (+160 age points). Accumulated commercial waste near tourist heritage site.',
        immediateDanger: false,
        publicImpact: 'High - Commercial Hub / Main Transit Road',
        status: 'In Progress',
        department: 'Solid Waste & Sanitation (GHMC)',
        adminNotes: [
          {
            id: 'n5',
            author: 'Sanitation Supervisor Charminar',
            note: 'Compact tipper truck delayed due to narrow historic lanes. Scheduled morning manual cart clearing.',
            timestamp: new Date(now.getTime() - 2 * dayMs).toISOString()
          }
        ],
        statusTimeline: [
          {
            status: 'Submitted',
            timestamp: new Date(now.getTime() - 7.2 * dayMs).toISOString(),
            remarks: 'Complaint filed 7 days ago.',
            updatedBy: 'Citizen Portal'
          },
          {
            status: 'Under Review',
            timestamp: new Date(now.getTime() - 5 * dayMs).toISOString(),
            remarks: 'Forwarded to Charminar circle sanitation wing.',
            updatedBy: 'Circle Officer'
          },
          {
            status: 'In Progress',
            timestamp: new Date(now.getTime() - 2 * dayMs).toISOString(),
            remarks: 'Sanitation team notified for prioritized clearance.',
            updatedBy: 'Supervisor Ali'
          }
        ]
      },

      // 6. BLOCKED STORMWATER DRAIN (P2 Medium, Ameerpet)
      {
        id: 'ABS-2026-0006',
        title: 'Blocked stormwater culvert causing black water backflow in residential street',
        category: 'Sewage & Drainage',
        subcategory: 'Blocked Drain / Overflow',
        description: 'Culvert clogged with single-use plastic and construction debris. Stagnant drain water is seeping into apartment compound basements.',
        issueAge: '3-7 days',
        submittedAt: new Date(now.getTime() - 4.5 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1.2 * dayMs).toISOString(),
        location: {
          address: 'Road No 3, behind Mythrivanam Complex',
          landmark: 'Near Ameerpet Metro Pillar A-18',
          area: 'Ameerpet',
          latitude: 17.4374,
          longitude: 78.4482,
          pincode: '500038'
        },
        photoUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
        citizen: {
          name: 'Nagaraju Swamy',
          phone: '+91 97011 88990',
          email: 'nagaraju.s@example.com',
          isAnonymous: false
        },
        priority: 'P2',
        priorityScore: 370,
        priorityReason: 'Medium Priority: Clogged drainage with basement inundation risk in residential lane.',
        immediateDanger: false,
        publicImpact: 'Medium - Residential Colony / Sector Road',
        status: 'In Progress',
        department: 'Sewage & Drainage (HMWSSB)',
        adminNotes: [
          {
            id: 'n6',
            author: 'HMWSSB AE Ameerpet',
            note: 'Super-sucker de-silting machine requisitioned for tomorrow 10:00 AM.',
            timestamp: new Date(now.getTime() - 1.2 * dayMs).toISOString()
          }
        ],
        statusTimeline: [
          {
            status: 'Submitted',
            timestamp: new Date(now.getTime() - 4.5 * dayMs).toISOString(),
            remarks: 'Lodged with photos of clogged culvert.',
            updatedBy: 'Citizen Portal'
          },
          {
            status: 'In Progress',
            timestamp: new Date(now.getTime() - 1.2 * dayMs).toISOString(),
            remarks: 'De-silting machine deployment in progress.',
            updatedBy: 'Drainage Division'
          }
        ]
      },

      // 7. HOTSPOT COMPONENT A (Garbage dump, Madhapur 100ft Road)
      {
        id: 'ABS-2026-0007',
        title: 'Overflowing commercial waste dump and stench at 100ft road bend',
        category: 'Garbage & Sanitation',
        subcategory: 'Garbage Dump Overflow',
        description: 'Restaurants dumping food waste into the open corner. Stray cattle and crows spreading waste across road.',
        issueAge: '1-2 days',
        submittedAt: new Date(now.getTime() - 1.5 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 0.8 * dayMs).toISOString(),
        location: {
          address: 'Plot 18, 100 Feet Road, Ayyappa Society',
          landmark: 'Near YSR Statue Junction',
          area: 'Madhapur',
          latitude: 17.4485,
          longitude: 78.3802,
          pincode: '500081'
        },
        photoUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=600&q=80',
        citizen: {
          name: 'P. Sandeep Kumar',
          phone: '+91 91234 56789',
          email: 'sandeep.p@example.com',
          isAnonymous: true
        },
        priority: 'P2',
        priorityScore: 330,
        priorityReason: 'Medium Priority: Commercial waste accumulation in dense dining hub.',
        immediateDanger: false,
        publicImpact: 'High - Commercial Hub / Main Transit Road',
        status: 'Assigned',
        department: 'Solid Waste & Sanitation (GHMC)',
        adminNotes: [],
        statusTimeline: [
          {
            status: 'Submitted',
            timestamp: new Date(now.getTime() - 1.5 * dayMs).toISOString(),
            remarks: 'Submitted anonymously.',
            updatedBy: 'Citizen Portal'
          },
          {
            status: 'Assigned',
            timestamp: new Date(now.getTime() - 0.8 * dayMs).toISOString(),
            remarks: 'Assigned to Madhapur night sanitation squad.',
            updatedBy: 'GHMC Central'
          }
        ]
      },

      // 8. HOTSPOT COMPONENT B (Waterlogging & blocked drain, Madhapur 100ft Road - 120m from #0007)
      {
        id: 'ABS-2026-0008',
        title: 'Clogged roadside drain causing black water pooling at 100ft road',
        category: 'Sewage & Drainage',
        subcategory: 'Blocked Drain / Overflow',
        description: 'Water standing 1 foot deep right where garbage was dumped. Motorists cannot see road edges.',
        issueAge: '1-2 days',
        submittedAt: new Date(now.getTime() - 1.1 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 0.5 * dayMs).toISOString(),
        location: {
          address: 'Lane 4, 100 Feet Road, Ayyappa Society',
          landmark: '100m from YSR Statue towards Mega Hills',
          area: 'Madhapur',
          latitude: 17.4491,
          longitude: 78.3811,
          pincode: '500081'
        },
        photoUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80',
        citizen: {
          name: 'Deepika Rao',
          phone: '+91 98488 23456',
          email: 'deepika.r@example.com',
          isAnonymous: false
        },
        priority: 'P2',
        priorityScore: 320,
        priorityReason: 'Medium Priority: Drain overflow clustered with nearby garbage dumping hotspot.',
        immediateDanger: false,
        publicImpact: 'High - Commercial Hub / Main Transit Road',
        status: 'Under Review',
        department: 'Sewage & Drainage (HMWSSB)',
        adminNotes: [],
        statusTimeline: [
          {
            status: 'Submitted',
            timestamp: new Date(now.getTime() - 1.1 * dayMs).toISOString(),
            remarks: 'Report lodged with precise coordinates.',
            updatedBy: 'Citizen Portal'
          }
        ]
      },

      // 9. LOW-PRIORITY COSMETIC MAINTENANCE (Broken wooden park bench, KBR Park, Banjara Hills) - P3 Low
      {
        id: 'ABS-2026-0009',
        title: 'Two broken wooden slats on walkway resting bench in KBR Park',
        category: 'Parks & Gardens',
        subcategory: 'Broken Bench / Equipment',
        description: 'Two teak slats are cracked on bench #14 along the walking track near Gate 2. No sharp iron exposed, but senior citizens cannot sit comfortably.',
        issueAge: '1-2 weeks',
        submittedAt: new Date(now.getTime() - 10 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 6 * dayMs).toISOString(),
        location: {
          address: 'Kasunanda Brahmananda Reddy (KBR) National Park, Track Gate 2',
          landmark: 'Opposite TDP Office / Jubilee Hills Checkpost road',
          area: 'Banjara Hills',
          latitude: 17.4243,
          longitude: 78.4287,
          pincode: '500034'
        },
        photoUrl: 'https://images.unsplash.com/photo-1588880331179-bc9b93a8cb5e?auto=format&fit=crop&w=600&q=80',
        citizen: {
          name: 'Justice (Retd) K. Rama Rao',
          phone: '+91 98499 99887',
          email: 'k.ramarao.retd@example.com',
          isAnonymous: false
        },
        priority: 'P3',
        priorityScore: 165,
        priorityReason: 'P3 Low: Routine cosmetic park furniture maintenance with no immediate safety hazard.',
        immediateDanger: false,
        publicImpact: 'Low - Isolated Lane / Local Park',
        status: 'Assigned',
        department: 'Urban Forestry & Parks (GHMC)',
        adminNotes: [
          {
            id: 'n9',
            author: 'Horticulture Inspector',
            note: 'Added to weekly carpentry batch repair schedule.',
            timestamp: new Date(now.getTime() - 6 * dayMs).toISOString()
          }
        ],
        statusTimeline: [
          {
            status: 'Submitted',
            timestamp: new Date(now.getTime() - 10 * dayMs).toISOString(),
            remarks: 'Citizen suggested park furniture repair.',
            updatedBy: 'Citizen Portal'
          },
          {
            status: 'Assigned',
            timestamp: new Date(now.getTime() - 6 * dayMs).toISOString(),
            remarks: 'Queued in regular parks maintenance schedule.',
            updatedBy: 'Urban Biodiversity Wing'
          }
        ]
      },

      // 10. FADED ZEBRA CROSSING (P3 Low, Secunderabad Station)
      {
        id: 'ABS-2026-0010',
        title: 'Faded pedestrian zebra crossing paint outside Secunderabad Station',
        category: 'Footpaths',
        subcategory: 'Road Markings / Signage',
        description: 'White thermo-plastic paint has worn off due to bus braking tires. Pedestrians crossing towards Rathifile Bus Station need clear markings.',
        issueAge: 'Over a month',
        submittedAt: new Date(now.getTime() - 25 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 15 * dayMs).toISOString(),
        location: {
          address: 'Station Road, in front of Reservation Complex',
          landmark: 'Opposite Secunderabad Railway Station',
          area: 'Secunderabad',
          latitude: 17.4344,
          longitude: 78.5015,
          pincode: '500003'
        },
        photoUrl: 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=600&q=80',
        citizen: {
          name: 'Arun Kumar Saxena',
          phone: '+91 94411 22334',
          email: 'arun.saxena@example.com',
          isAnonymous: false
        },
        priority: 'P3',
        priorityScore: 195,
        priorityReason: 'P3 Low: Routine traffic marking renewal.',
        immediateDanger: false,
        publicImpact: 'Medium - Residential Colony / Sector Road',
        status: 'Submitted',
        department: 'Roads & Bridges (GHMC)',
        adminNotes: [],
        statusTimeline: [
          {
            status: 'Submitted',
            timestamp: new Date(now.getTime() - 25 * dayMs).toISOString(),
            remarks: 'Submitted for upcoming road resurfacing package.',
            updatedBy: 'Citizen Portal'
          }
        ]
      },

      // 11. BROKEN RESIDENTIAL STREETLIGHT (P2 Medium, Dilsukhnagar)
      {
        id: 'ABS-2026-0011',
        title: 'Dark residential lane due to 3 continuous broken LED streetlights',
        category: 'Streetlights & Electricity',
        subcategory: 'Streetlight Not Working',
        description: 'Three consecutive streetlights (Pole numbers DSN-102 to 104) are out. Lane is pitch dark, creating safety concerns for women and evening walkers.',
        issueAge: '3-7 days',
        submittedAt: new Date(now.getTime() - 5.5 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
        location: {
          address: 'Street 4, Shirdi Sai Colony',
          landmark: 'Near Rajadhani Theatre Backside',
          area: 'Dilsukhnagar',
          latitude: 17.3688,
          longitude: 78.5247,
          pincode: '500060'
        },
        photoUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=600&q=80',
        citizen: {
          name: 'B. Sravanthi',
          phone: '+91 98855 77661',
          email: 'sravanthi.b@example.com',
          isAnonymous: false
        },
        priority: 'P2',
        priorityScore: 345,
        priorityReason: 'Medium Priority: Dark residential stretch without live electrical wire hazard.',
        immediateDanger: false,
        publicImpact: 'Medium - Residential Colony / Sector Road',
        status: 'In Progress',
        department: 'Electricity & Streetlights (TSSPDCL)',
        adminNotes: [
          {
            id: 'n11',
            author: 'TSSPDCL Lineman Inspector',
            note: 'Choke and driver replaced on pole 102; LED fixtures requisitioned for 103 and 104.',
            timestamp: new Date(now.getTime() - 2 * dayMs).toISOString()
          }
        ],
        statusTimeline: [
          {
            status: 'Submitted',
            timestamp: new Date(now.getTime() - 5.5 * dayMs).toISOString(),
            remarks: 'Citizen grievance recorded.',
            updatedBy: 'Citizen Portal'
          },
          {
            status: 'In Progress',
            timestamp: new Date(now.getTime() - 2 * dayMs).toISOString(),
            remarks: 'Crew attended pole 102, completing remaining tomorrow.',
            updatedBy: 'TSSPDCL Line Wing'
          }
        ]
      },

      // 12. 1-DAY-OLD MEDIUM COMPLAINT (Jubilee Hills)
      // NOTE: Comparable to #0005 (Charminar garbage), but because it was submitted only 1 day ago,
      // the Smart Priority Queue will rank #0005 (7-day-old) HIGHER than #0012!
      {
        id: 'ABS-2026-0012',
        title: 'Single overflowing waste bin in residential by-lane',
        category: 'Garbage & Sanitation',
        subcategory: 'Garbage Dump Overflow',
        description: 'Green colony dustbin reached capacity yesterday evening after community function. Minor overflow onto curb.',
        issueAge: '1-2 days',
        submittedAt: new Date(now.getTime() - 1.2 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 0.9 * dayMs).toISOString(),
        location: {
          address: 'Road No 36, Lane 5, Jubilee Hills',
          landmark: 'Opposite Peddamma Temple arch lane',
          area: 'Jubilee Hills',
          latitude: 17.4326,
          longitude: 78.4071,
          pincode: '500033'
        },
        photoUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=600&q=80',
        citizen: {
          name: 'Vikramaditya Goud',
          phone: '+91 97000 88812',
          email: 'vikram.g@example.com',
          isAnonymous: false
        },
        priority: 'P2',
        priorityScore: 280, // Lower than #0005 (which has 430 pts due to 7 days age!)
        priorityReason: 'Medium Priority: Routine residential bin overflow (1 day old). Ranks behind older pending sanitation requests.',
        immediateDanger: false,
        publicImpact: 'Medium - Residential Colony / Sector Road',
        status: 'Submitted',
        department: 'Solid Waste & Sanitation (GHMC)',
        adminNotes: [],
        statusTimeline: [
          {
            status: 'Submitted',
            timestamp: new Date(now.getTime() - 1.2 * dayMs).toISOString(),
            remarks: 'Report received. Scheduled in daily morning route.',
            updatedBy: 'Citizen Portal'
          }
        ]
      },

      // 13. AGGRESSIVE STRAY DOG PACK (P1 High, Kukatpally)
      {
        id: 'ABS-2026-0013',
        title: 'Aggressive stray dog pack near primary school and vegetable market',
        category: 'Stray Animals',
        subcategory: 'Stray Dogs / Animal Threat',
        description: 'Pack of 7-8 dogs chasing school children on bicycles and biting pedestrians in the evening. Two people treated for bites at local clinic.',
        issueAge: '3-7 days',
        submittedAt: new Date(now.getTime() - 3.8 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * dayMs).toISOString(),
        location: {
          address: 'Phase 3, KPHB Colony, 5th Road',
          landmark: 'Near Forum Sujana Mall backside road',
          area: 'Kukatpally',
          latitude: 17.4933,
          longitude: 78.3914,
          pincode: '500072'
        },
        photoUrl: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80',
        citizen: {
          name: 'M. Haritha',
          phone: '+91 98480 33441',
          email: 'haritha.m@example.com',
          isAnonymous: false
        },
        priority: 'P1',
        priorityScore: 560,
        priorityReason: 'High Priority: Threat to school children and residents from aggressive stray pack.',
        immediateDanger: false,
        publicImpact: 'Critical - Hospital / School / High Traffic Arterial',
        status: 'In Progress',
        department: 'General Civic Services',
        adminNotes: [
          {
            id: 'n13',
            author: 'GHMC Veterinary Officer',
            note: 'Dog catching van deployed with net team. 4 dogs captured for Anti-Rabies Vaccination and ABC (Animal Birth Control) surgery.',
            timestamp: new Date(now.getTime() - 1 * dayMs).toISOString()
          }
        ],
        statusTimeline: [
          {
            status: 'Submitted',
            timestamp: new Date(now.getTime() - 3.8 * dayMs).toISOString(),
            remarks: 'Report filed with medical receipt copy.',
            updatedBy: 'Citizen Portal'
          },
          {
            status: 'In Progress',
            timestamp: new Date(now.getTime() - 1 * dayMs).toISOString(),
            remarks: 'Veterinary squad active in Sector 3.',
            updatedBy: 'Veterinary Wing'
          }
        ]
      },

      // 14. PUBLIC TOILET COMPLEX (Resolved Complaint, MGBS)
      {
        id: 'ABS-2026-0014',
        title: 'Choked pipelines and non-functional taps at public comfort station',
        category: 'Public Toilets',
        subcategory: 'Sanitary Maintenance',
        description: 'Toilet complex at Bus Terminal bay 4 was locked due to water pump failure and choked flush cistern.',
        issueAge: '1-2 days',
        submittedAt: new Date(now.getTime() - 6 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 1.5 * dayMs).toISOString(),
        location: {
          address: 'Mahatma Gandhi Bus Station (MGBS), Platform 4 Entry',
          landmark: 'Imlibun Island',
          area: 'Gowliguda',
          latitude: 17.3789,
          longitude: 78.4812,
          pincode: '500095'
        },
        photoUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
        citizen: {
          name: 'Chandra Sekhar',
          phone: '+91 99499 11002',
          email: 'chandu.s@example.com',
          isAnonymous: false
        },
        priority: 'P2',
        priorityScore: 310,
        priorityReason: 'Medium Priority: Essential public sanitation facility at high footfall interstate bus terminus.',
        immediateDanger: false,
        publicImpact: 'High - Commercial Hub / Main Transit Road',
        status: 'Resolved',
        department: 'Solid Waste & Sanitation (GHMC)',
        adminNotes: [
          {
            id: 'n14',
            author: 'Sulabh Sanitation Engineer',
            note: 'Pump motor replaced, flush cistern re-piped, deep chemical sanitization completed. Facility reopened.',
            timestamp: new Date(now.getTime() - 1.5 * dayMs).toISOString()
          }
        ],
        statusTimeline: [
          {
            status: 'Submitted',
            timestamp: new Date(now.getTime() - 6 * dayMs).toISOString(),
            remarks: 'Complaint lodged by traveler.',
            updatedBy: 'Citizen Portal'
          },
          {
            status: 'In Progress',
            timestamp: new Date(now.getTime() - 4 * dayMs).toISOString(),
            remarks: 'Plumbing contractor deployed.',
            updatedBy: 'Sanitation Wing'
          },
          {
            status: 'Resolved',
            timestamp: new Date(now.getTime() - 1.5 * dayMs).toISOString(),
            remarks: 'Repairs completed and certified by Station Manager.',
            updatedBy: 'Sanitation AE'
          }
        ]
      },

      // 15. LOW WATER PRESSURE (Resolved Complaint, Tarnaka)
      {
        id: 'ABS-2026-0015',
        title: 'Zero water pressure in tail-end residential houses of Street 12',
        category: 'Water Supply',
        subcategory: 'Low Water Pressure',
        description: 'Water supplied for only 15 minutes with trickle flow. Overhead tanks in 12 houses remained empty.',
        issueAge: '3-7 days',
        submittedAt: new Date(now.getTime() - 8 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * dayMs).toISOString(),
        location: {
          address: 'Street No 12, Kimtee Colony',
          landmark: 'Near Tarnaka Metro Station / Osmania University Gate',
          area: 'Tarnaka',
          latitude: 17.4285,
          longitude: 78.5381,
          pincode: '500017'
        },
        photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
        citizen: {
          name: 'Prof. R. V. Ramanujam',
          phone: '+91 94901 23456',
          email: 'rv.ramanujam@example.com',
          isAnonymous: false
        },
        priority: 'P2',
        priorityScore: 330,
        priorityReason: 'Medium Priority: Residential water supply line pressure valve obstruction.',
        immediateDanger: false,
        publicImpact: 'Medium - Residential Colony / Sector Road',
        status: 'Resolved',
        department: 'Water Supply (HMWSSB)',
        adminNotes: [
          {
            id: 'n15',
            author: 'HMWSSB Valve Operator',
            note: 'Air-lock cleared on distribution main line valve. Pressure normalized to 1.8 kg/cm2.',
            timestamp: new Date(now.getTime() - 2 * dayMs).toISOString()
          }
        ],
        statusTimeline: [
          {
            status: 'Submitted',
            timestamp: new Date(now.getTime() - 8 * dayMs).toISOString(),
            remarks: 'Grievance submitted with resident association sign-off.',
            updatedBy: 'Citizen Portal'
          },
          {
            status: 'Assigned',
            timestamp: new Date(now.getTime() - 6 * dayMs).toISOString(),
            remarks: 'Assigned to Tarnaka water line manager.',
            updatedBy: 'HMWSSB Control'
          },
          {
            status: 'Resolved',
            timestamp: new Date(now.getTime() - 2 * dayMs).toISOString(),
            remarks: 'Pressure testing passed at tail-end taps.',
            updatedBy: 'Inspector Naresh'
          }
        ]
      },

      // 16. UNEVEN FOOTPATH PAVERS (P3 Low, Banjara Hills Road 1)
      {
        id: 'ABS-2026-0016',
        title: 'Broken interlocking concrete pavers on pedestrian sidewalk',
        category: 'Footpaths',
        subcategory: 'Broken Pavement / Pavers',
        description: 'Ten pavers dislodged after telecom cable trenching. Uneven surface creates a tripping hazard for elderly walkers.',
        issueAge: '1-2 weeks',
        submittedAt: new Date(now.getTime() - 9 * dayMs).toISOString(),
        updatedAt: new Date(now.getTime() - 4 * dayMs).toISOString(),
        location: {
          address: 'Road No 1, opposite City Center Mall',
          landmark: 'Near Care Hospital junction',
          area: 'Banjara Hills',
          latitude: 17.4195,
          longitude: 78.4485,
          pincode: '500034'
        },
        photoUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
        citizen: {
          name: 'Ananya Deshmukh',
          phone: '+91 98492 88776',
          email: 'ananya.d@example.com',
          isAnonymous: false
        },
        priority: 'P3',
        priorityScore: 175,
        priorityReason: 'P3 Low: Footpath tile repair without road obstruction or emergency life danger.',
        immediateDanger: false,
        publicImpact: 'Medium - Residential Colony / Sector Road',
        status: 'Assigned',
        department: 'Roads & Bridges (GHMC)',
        adminNotes: [],
        statusTimeline: [
          {
            status: 'Submitted',
            timestamp: new Date(now.getTime() - 9 * dayMs).toISOString(),
            remarks: 'Complaint lodged.',
            updatedBy: 'Citizen Portal'
          },
          {
            status: 'Assigned',
            timestamp: new Date(now.getTime() - 4 * dayMs).toISOString(),
            remarks: 'Forwarded to utility restoration contractor.',
            updatedBy: 'GHMC Roads'
          }
        ]
      }
    ];

    const processed = this.recalculateAndDetect(seed);
    this.saveToStorage(processed);
  }
}
