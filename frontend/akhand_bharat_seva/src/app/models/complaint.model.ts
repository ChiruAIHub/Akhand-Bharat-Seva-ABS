export type PriorityLevel = 'P0' | 'P1' | 'P2' | 'P3';

export type ComplaintStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Closed';

export type ComplaintCategory =
  | 'Roads & Potholes'
  | 'Garbage & Sanitation'
  | 'Sewage & Drainage'
  | 'Water Supply'
  | 'Streetlights & Electricity'
  | 'Parks & Gardens'
  | 'Footpaths'
  | 'Public Toilets'
  | 'Stray Animals'
  | 'Other Issues';

export type DepartmentType =
  | 'Roads & Bridges (GHMC)'
  | 'Solid Waste & Sanitation (GHMC)'
  | 'Sewage & Drainage (HMWSSB)'
  | 'Water Supply (HMWSSB)'
  | 'Electricity & Streetlights (TSSPDCL)'
  | 'Urban Forestry & Parks (GHMC)'
  | 'General Civic Services';

export type IssueAge =
  | 'Just happened (< 2 hours)'
  | '1-2 days'
  | '3-7 days'
  | '1-2 weeks'
  | 'Over a month';

export type PublicImpact =
  | 'Critical - Hospital / School / High Traffic Arterial'
  | 'High - Commercial Hub / Main Transit Road'
  | 'Medium - Residential Colony / Sector Road'
  | 'Low - Isolated Lane / Local Park';

export interface LocationInfo {
  address: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  area: string;
  pincode?: string;
}

export interface CitizenInfo {
  name: string;
  phone: string;
  email: string;
  isAnonymous: boolean;
}

export interface AdminNote {
  id: string;
  author: string;
  note: string;
  timestamp: string;
}

export interface StatusHistoryItem {
  status: ComplaintStatus;
  timestamp: string;
  remarks: string;
  updatedBy: string;
}

export interface PriorityOverride {
  originalPriority: PriorityLevel;
  newPriority: PriorityLevel;
  overriddenBy: string;
  reason: string;
  timestamp: string;
}

export interface Complaint {
  id: string;
  title: string;
  category: ComplaintCategory;
  subcategory: string;
  description: string;
  issueAge: IssueAge;
  submittedAt: string; // ISO timestamp
  updatedAt: string;   // ISO timestamp
  location: LocationInfo;
  photoUrl?: string;
  citizen: CitizenInfo;
  
  // Smart Priority Engine
  priority: PriorityLevel;
  priorityScore: number;
  priorityReason: string;
  immediateDanger: boolean;
  publicImpact: PublicImpact;
  priorityOverride?: PriorityOverride;
  
  // Workflow
  status: ComplaintStatus;
  department: DepartmentType;
  adminNotes: AdminNote[];
  statusTimeline: StatusHistoryItem[];

  // Hotspot & Duplicate Flags
  duplicateAlert?: string;
  hotspotClusterId?: string;
  hotspotCount?: number;

  // Multilingual / Gemma Indic NLU Translation
  detectedLanguage?: string;
  originalText?: string;
  translatedEnglishReport?: string;
  staffSummary?: string;
}

export interface DepartmentSummary {
  name: DepartmentType;
  shortName: string;
  totalComplaints: number;
  activeComplaints: number;
  resolvedComplaints: number;
  emergencyCount: number;
  avgResolutionDays: number;
  staffAssigned: number;
  capacityStatus: 'Normal' | 'Moderate' | 'Overloaded';
}

export interface PriorityScoreBreakdown {
  score: number;
  priority: PriorityLevel;
  reason: string;
  dangerBonus: number;
  severityBonus: number;
  impactBonus: number;
  ageBonus: number;
}
