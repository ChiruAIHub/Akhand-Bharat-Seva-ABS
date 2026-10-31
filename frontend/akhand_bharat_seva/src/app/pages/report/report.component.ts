import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  ElementRef,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators
} from '@angular/forms';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import * as L from 'leaflet';
import { ComplaintService } from '../../services/complaint.service';
import { LanguageService } from '../../services/language.service';
import {
  ComplaintCategory,
  IssueAge,
  PublicImpact,
  Complaint
} from '../../models/complaint.model';
import { PriorityBadgeComponent } from '../../components/priority-badge/priority-badge.component';

// Sample photos for quick demo testing
const SAMPLE_PHOTOS = [
  { label: 'Exposed Electrical Hazard', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80' },
  { label: 'Deep Dangerous Pothole', url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80' },
  { label: 'Overflowing Garbage Pile', url: 'https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&w=600&q=80' },
  { label: 'Drainage Waterlog / Sewage', url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80' }
];

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PriorityBadgeComponent],
  template: `
    <div class="report-page">
      <!-- Top Title Header -->
      <section class="report-header-banner">
        <div class="container">
          <div class="breadcrumb-trail">
            <a routerLink="/"><i class="bi bi-house"></i> Home</a>
            <i class="bi bi-chevron-right separator"></i>
            <span>Lodge Civic Grievance</span>
          </div>
          <h1 class="page-title">Report a Civic Problem</h1>
          <p class="page-subtitle">
            Provide accurate details, pin the exact location on OpenStreetMap, and attach photos to trigger transparent rules-based prioritization.
          </p>
        </div>
      </section>

      <div class="container report-container">
        <!-- SUCCESS CONFIRMATION VIEW -->
        <div class="card confirmation-card" *ngIf="submittedComplaint">
          <div class="confirmation-icon">
            <i class="bi bi-check-circle-fill"></i>
          </div>
          <div class="confirmation-badge">
            <i class="bi bi-shield-check"></i> GRIEVANCE REGISTERED SUCCESSFULLY
          </div>
          <h2 class="confirmation-title">Thank You, Citizen!</h2>
          <p class="confirmation-desc">
            Your civic complaint has been recorded and submitted to municipal officers. The Smart Rules Engine has assigned it an initial triage priority.
          </p>

          <div class="complaint-id-box">
            <span class="id-label">YOUR UNIQUE COMPLAINT TRACKING ID</span>
            <div class="id-code-row">
              <span class="id-code">{{ submittedComplaint.id }}</span>
              <button class="btn btn-secondary btn-sm" (click)="copyId(submittedComplaint.id)">
                <i class="bi" [ngClass]="copied ? 'bi-check' : 'bi-clipboard'"></i>
                {{ copied ? 'Copied!' : 'Copy ID' }}
              </button>
            </div>
          </div>

          <div class="confirmation-summary-grid">
            <div class="summary-item">
              <span class="label">Priority Assigned:</span>
              <app-priority-badge [priority]="submittedComplaint.priority" [label]="submittedComplaint.priority"></app-priority-badge>
            </div>
            <div class="summary-item">
              <span class="label">Priority Reason:</span>
              <span class="value">{{ submittedComplaint.priorityReason }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Assigned Department:</span>
              <span class="value font-semibold">{{ submittedComplaint.department }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Location Pinned:</span>
              <span class="value">{{ submittedComplaint.location.address }} ({{ submittedComplaint.location.area }})</span>
            </div>
            <div class="summary-item">
              <span class="label">Submitted At:</span>
              <span class="value">{{ submittedComplaint.submittedAt | date:'medium' }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Reported Issue Age:</span>
              <span class="value">{{ submittedComplaint.issueAge }}</span>
            </div>
          </div>

          <div class="confirmation-actions">
            <a [routerLink]="['/track']" [queryParams]="{id: submittedComplaint.id}" class="btn btn-saffron btn-lg">
              <i class="bi bi-crosshair2"></i> Track Complaint Status
            </a>
            <button (click)="resetForm()" class="btn btn-secondary btn-lg">
              <i class="bi bi-plus-circle"></i> Lodge Another Grievance
            </button>
            <a routerLink="/public-issues" class="btn btn-outline-navy btn-lg">
              <i class="bi bi-globe2"></i> View on Public Board
            </a>
          </div>
        </div>

        <!-- MAIN REPORTING FORM (If not yet submitted) -->
        <div class="report-layout" *ngIf="!submittedComplaint">
          <form [formGroup]="reportForm" (ngSubmit)="onOpenReview()" class="report-form card">
            
            <!-- SECTION 1: CATEGORY & SUBCATEGORY -->
            <div class="form-section">
              <div class="section-title-wrap">
                <span class="section-number">1</span>
                <div>
                  <h3 class="form-section-title">Issue Classification</h3>
                  <p class="form-section-desc">Choose the civic department and specific subcategory</p>
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label" for="category">
                    Civic Category <span class="required">*</span>
                  </label>
                  <select
                    id="category"
                    formControlName="category"
                    (change)="onCategoryChange()"
                    class="form-control"
                    [class.is-invalid]="f['category'].touched && f['category'].invalid"
                  >
                    <option value="" disabled>-- Select Civic Category --</option>
                    <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
                  </select>
                  <div class="invalid-feedback" *ngIf="f['category'].touched && f['category'].invalid">
                    Please select a civic category.
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label" for="subcategory">
                    Subcategory <span class="required">*</span>
                  </label>
                  <select
                    id="subcategory"
                    formControlName="subcategory"
                    class="form-control"
                    [class.is-invalid]="f['subcategory'].touched && f['subcategory'].invalid"
                  >
                    <option value="" disabled>-- Select Subcategory --</option>
                    <option *ngFor="let sub of currentSubcategories" [value]="sub">{{ sub }}</option>
                  </select>
                  <div class="invalid-feedback" *ngIf="f['subcategory'].touched && f['subcategory'].invalid">
                    Please select a subcategory.
                  </div>
                </div>
              </div>

              <!-- Issue Age Selection -->
              <div class="form-group">
                <label class="form-label">
                  How long has this issue existed? <span class="required">*</span>
                </label>
                <div class="age-pills-row">
                  <label
                    *ngFor="let age of issueAgeOptions"
                    class="age-pill-label"
                    [class.selected]="reportForm.get('issueAge')?.value === age"
                  >
                    <input
                      type="radio"
                      formControlName="issueAge"
                      [value]="age"
                      class="sr-only"
                    />
                    <span>{{ age }}</span>
                  </label>
                </div>
                <small class="text-muted help-text">
                  <i class="bi bi-hourglass"></i> Unresolved older complaints receive automatic aging points in the Smart Priority Queue.
                </small>
              </div>
            </div>

            <!-- SECTION 2: TITLE & DESCRIPTION -->
            <div class="form-section">
              <div class="section-title-wrap">
                <span class="section-number">2</span>
                <div>
                  <h3 class="form-section-title">Problem Description</h3>
                  <p class="form-section-desc">Provide a clear title and detailed context for municipal inspection</p>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="title">
                  Complaint Title / Summary <span class="required">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  formControlName="title"
                  placeholder="e.g. Broken water pipe leaking black sludge into drinking line"
                  class="form-control"
                  [class.is-invalid]="f['title'].touched && f['title'].invalid"
                />
                <div class="invalid-feedback" *ngIf="f['title'].touched && f['title'].invalid">
                  Title is required (at least 8 characters).
                </div>
              </div>

              <div class="form-group">
                <div class="label-with-counter">
                  <label class="form-label" for="description">
                    Detailed Description <span class="required">*</span>
                  </label>
                  <span class="char-counter" [class.text-danger]="f['description'].value?.length > 1000">
                    {{ f['description'].value?.length || 0 }} / 1000
                  </span>
                </div>
                <textarea
                  id="description"
                  formControlName="description"
                  rows="4"
                  placeholder="Describe the severity, exact location landmarks, potential hazards to children/elderly, and whether water or power is affected..."
                  class="form-control"
                  [class.is-invalid]="f['description'].touched && f['description'].invalid"
                ></textarea>
                <div class="invalid-feedback" *ngIf="f['description'].touched && f['description'].invalid">
                  Please provide a detailed description (minimum 20 characters).
                </div>
              </div>

              <!-- Danger & Impact Toggles -->
              <div class="grid-2 danger-impact-box">
                <div class="danger-toggle-card" [class.danger-active]="reportForm.get('immediateDanger')?.value">
                  <label class="checkbox-container">
                    <input type="checkbox" formControlName="immediateDanger" />
                    <span class="checkmark"></span>
                    <div class="checkbox-text">
                      <span class="danger-label">
                        <i class="bi bi-exclamation-octagon-fill"></i> Immediate Life Hazard / Danger
                      </span>
                      <span class="danger-sub">Exposed live high-voltage wire, open deep manhole, toxic gas or structural cave-in</span>
                    </div>
                  </label>
                </div>

                <div class="form-group">
                  <label class="form-label">Location Traffic / Public Impact</label>
                  <select formControlName="publicImpact" class="form-control">
                    <option *ngFor="let imp of publicImpactOptions" [value]="imp">{{ imp }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- SECTION 3: LOCATION & INTERACTIVE LEAFLET MAP -->
            <div class="form-section">
              <div class="section-title-wrap">
                <span class="section-number">3</span>
                <div>
                  <h3 class="form-section-title">Exact Location on OpenStreetMap</h3>
                  <p class="form-section-desc">Click on the map or drag the marker. Coordinates are verified and never invented.</p>
                </div>
              </div>

              <!-- Map Toolbar -->
              <div class="map-toolbar">
                <button
                  type="button"
                  class="btn btn-secondary btn-sm"
                  (click)="locateUser()"
                  [disabled]="isLocating"
                >
                  <i class="bi" [ngClass]="isLocating ? 'bi-arrow-clockwise bi-spin' : 'bi-geo-alt-fill'"></i>
                  {{ isLocating ? 'Detecting Location...' : 'Use My Current GPS' }}
                </button>

                <div class="quick-areas-dropdown">
                  <span>Quick Hyderabad Hubs:</span>
                  <button type="button" class="btn btn-sm btn-outline-navy" (click)="jumpToLocation(17.4435, 78.4682, 'Begumpet Main Road', 'Begumpet')">Begumpet</button>
                  <button type="button" class="btn btn-sm btn-outline-navy" (click)="jumpToLocation(17.3616, 78.4747, 'Charminar Heritage Area', 'Charminar')">Charminar</button>
                  <button type="button" class="btn btn-sm btn-outline-navy" (click)="jumpToLocation(17.4498, 78.3789, 'Cyber Towers / Shilparamam', 'Madhapur')">Madhapur</button>
                  <button type="button" class="btn btn-sm btn-outline-navy" (click)="jumpToLocation(17.4933, 78.3914, 'KPHB Colony Phase 3', 'Kukatpally')">Kukatpally</button>
                </div>
              </div>

              <!-- The Leaflet Map Container -->
              <div class="map-wrapper">
                <div #mapContainer class="leaflet-map-box"></div>
                <div class="map-badge-coords">
                  <i class="bi bi-crosshair"></i>
                  Lat: {{ currentLat.toFixed(4) }} | Lng: {{ currentLng.toFixed(4) }}
                </div>
              </div>

              <!-- Address Details Fields -->
              <div class="grid-2 location-fields-row">
                <div class="form-group">
                  <label class="form-label">
                    Street Address / Landmark <span class="required">*</span>
                  </label>
                  <input
                    type="text"
                    formControlName="address"
                    placeholder="e.g. Road No 36, opposite Metro Pillar 42"
                    class="form-control"
                    [class.is-invalid]="f['address'].touched && f['address'].invalid"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">
                    Locality / Area <span class="required">*</span>
                  </label>
                  <input
                    type="text"
                    formControlName="area"
                    placeholder="e.g. Jubilee Hills, Charminar, Madhapur"
                    class="form-control"
                    [class.is-invalid]="f['area'].touched && f['area'].invalid"
                  />
                </div>
              </div>
            </div>

            <!-- SECTION 4: PHOTOGRAPH UPLOAD & VALIDATION -->
            <div class="form-section">
              <div class="section-title-wrap">
                <span class="section-number">4</span>
                <div>
                  <h3 class="form-section-title">Photograph Evidence (Optional)</h3>
                  <p class="form-section-desc">Attach an on-site photo for faster verification. Max 5MB (JPG, PNG, WebP)</p>
                </div>
              </div>

              <div class="photo-upload-zone" *ngIf="!photoPreview">
                <input
                  type="file"
                  #fileInput
                  accept="image/jpeg,image/png,image/webp"
                  (change)="onFileSelected($event)"
                  class="file-input-hidden"
                  id="photoFile"
                />
                <label for="photoFile" class="file-drop-label">
                  <i class="bi bi-cloud-arrow-up-fill upload-icon"></i>
                  <span class="upload-text">Click to upload photo or drag & drop</span>
                  <span class="upload-sub">Supports JPEG, PNG, WebP (Max 5MB)</span>
                </label>
              </div>

              <div *ngIf="fileError" class="alert-box alert-box-danger mb-3">
                <i class="bi bi-exclamation-triangle-fill"></i>
                <span>{{ fileError }}</span>
              </div>

              <!-- Quick Demo Samples -->
              <div class="quick-samples-box" *ngIf="!photoPreview">
                <span class="samples-title"><i class="bi bi-stars"></i> Or choose a quick demo photo:</span>
                <div class="samples-grid">
                  <button
                    type="button"
                    *ngFor="let sample of samplePhotos"
                    (click)="selectSamplePhoto(sample.url)"
                    class="sample-photo-btn"
                  >
                    <img [src]="sample.url" [alt]="sample.label" />
                    <span>{{ sample.label }}</span>
                  </button>
                </div>
              </div>

              <!-- Photo Preview Card -->
              <div class="photo-preview-card" *ngIf="photoPreview">
                <img [src]="photoPreview" alt="Grievance evidence" class="preview-img" />
                <div class="preview-meta-bar">
                  <span class="preview-label"><i class="bi bi-image-fill"></i> Image attached</span>
                  <button type="button" class="btn btn-sm btn-danger" (click)="removePhoto()">
                    <i class="bi bi-trash"></i> Remove Photo
                  </button>
                </div>
              </div>
            </div>

            <!-- SECTION 5: CITIZEN CONTACT & PRIVACY -->
            <div class="form-section">
              <div class="section-title-wrap">
                <span class="section-number">5</span>
                <div>
                  <h3 class="form-section-title">Citizen Contact & Privacy Notice</h3>
                  <p class="form-section-desc">Strict privacy guarantee: Phone and email are never shown publicly.</p>
                </div>
              </div>

              <div class="privacy-alert-box alert-box alert-box-info">
                <i class="bi bi-shield-lock-fill privacy-icon"></i>
                <div>
                  <strong>Citizen Privacy Protection:</strong>
                  Your personal phone number and email address will strictly be kept confidential for municipal verification and status SMS/updates. They will <strong>never</strong> appear on the public grievance portal.
                </div>
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label class="form-label" for="citizenName">
                    Citizen Name <span class="required">*</span>
                  </label>
                  <input
                    id="citizenName"
                    type="text"
                    formControlName="citizenName"
                    placeholder="e.g. Ramesh Kumar"
                    class="form-control"
                    [class.is-invalid]="f['citizenName'].touched && f['citizenName'].invalid"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label" for="citizenPhone">
                    Mobile Number <span class="required">*</span>
                  </label>
                  <input
                    id="citizenPhone"
                    type="tel"
                    formControlName="citizenPhone"
                    placeholder="e.g. 9849012345 (10 digits)"
                    class="form-control"
                    [class.is-invalid]="f['citizenPhone'].touched && f['citizenPhone'].invalid"
                  />
                  <div class="invalid-feedback" *ngIf="f['citizenPhone'].touched && f['citizenPhone'].invalid">
                    Valid 10-digit mobile number required.
                  </div>
                </div>

                <div class="form-group">
                  <label class="form-label">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    formControlName="citizenEmail"
                    placeholder="e.g. ramesh@example.com"
                    class="form-control"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">
                    Preferred Communication Language / भाषा
                  </label>
                  <select formControlName="preferredLanguage" class="form-control">
                    <option *ngFor="let l of langService.languages" [value]="l.name">
                      {{ l.nativeName }} ({{ l.name }})
                    </option>
                  </select>
                  <small class="text-muted help-text">
                    <i class="bi bi-chat-dots"></i> SMS updates and inspection phone inquiries will be delivered in this language.
                  </small>
                </div>

                <div class="form-group anonymous-toggle-wrap">
                  <label class="checkbox-container">
                    <input type="checkbox" formControlName="isAnonymous" />
                    <span class="checkmark"></span>
                    <div class="checkbox-text">
                      <span class="font-semibold">Display as "Anonymous Citizen" on Public Board</span>
                      <span class="text-muted text-xs">Name will still be preserved in administrative audit trail</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <!-- SUBMIT BUTTONS -->
            <div class="form-actions-bar">
              <button
                type="submit"
                [disabled]="reportForm.invalid"
                class="btn btn-saffron btn-lg"
              >
                <i class="bi bi-clipboard-check-fill"></i> Review & Submit Grievance
              </button>
              <button type="button" (click)="resetForm()" class="btn btn-secondary btn-lg">
                <i class="bi bi-x-circle"></i> Reset Form
              </button>
            </div>
          </form>

          <!-- SIDEBAR TIPS -->
          <div class="report-sidebar">
            <div class="card sidebar-card">
              <div class="sidebar-header">
                <i class="bi bi-shield-check text-saffron"></i>
                <h4>Grievance Checklist</h4>
              </div>
              <ul class="checklist">
                <li><i class="bi bi-check2 text-green"></i> <strong>Pin Location Accurately:</strong> Move map marker to the exact spot.</li>
                <li><i class="bi bi-check2 text-green"></i> <strong>Clear Photos:</strong> Shows depth of pothole or water leak.</li>
                <li><i class="bi bi-check2 text-green"></i> <strong>Emergency Warning:</strong> Check "Immediate Hazard" only if there is real danger of electrocution, drowning, or cave-in.</li>
                <li><i class="bi bi-check2 text-green"></i> <strong>SMS Updates:</strong> You will receive a unique ABS tracking code immediately.</li>
              </ul>
            </div>

            <div class="card sidebar-card emergency-card">
              <div class="sidebar-header">
                <i class="bi bi-telephone-fill text-danger"></i>
                <h4 class="text-danger">Critical Emergency?</h4>
              </div>
              <p class="emergency-desc">
                If someone is injured or in immediate life danger, call state emergency dispatch immediately:
              </p>
              <div class="emergency-quick-dial">
                <a href="tel:100" class="dial-btn"><strong>100</strong> Police</a>
                <a href="tel:108" class="dial-btn"><strong>108</strong> Ambulance</a>
                <a href="tel:101" class="dial-btn"><strong>101</strong> Fire</a>
              </div>
            </div>
          </div>
        </div>

        <!-- REVIEW BEFORE SUBMIT MODAL -->
        <div class="modal-overlay" *ngIf="showReviewModal">
          <div class="modal-content review-modal">
            <div class="review-modal-header">
              <div class="modal-title-wrap">
                <i class="bi bi-card-checklist text-saffron"></i>
                <h3>Review Grievance Before Lodging</h3>
              </div>
              <button class="close-modal-btn" (click)="showReviewModal = false">&times;</button>
            </div>

            <div class="review-modal-body">
              <div class="priority-preview-box" [ngClass]="previewPriority === 'P0' ? 'p0-preview' : 'std-preview'">
                <div class="preview-prio-top">
                  <span class="preview-tag">ESTIMATED ENGINE PRIORITY</span>
                  <app-priority-badge [priority]="previewPriority" [label]="previewPriority" [score]="previewScore" [showScore]="true"></app-priority-badge>
                </div>
                <p class="preview-prio-reason">{{ previewReason }}</p>
              </div>

              <div class="review-details-list">
                <div class="review-row">
                  <span class="r-label">Category:</span>
                  <span class="r-val"><strong>{{ reportForm.get('category')?.value }}</strong> &bull; {{ reportForm.get('subcategory')?.value }}</span>
                </div>
                <div class="review-row">
                  <span class="r-label">Title:</span>
                  <span class="r-val">{{ reportForm.get('title')?.value }}</span>
                </div>
                <div class="review-row">
                  <span class="r-label">Description:</span>
                  <span class="r-val">{{ reportForm.get('description')?.value }}</span>
                </div>
                <div class="review-row">
                  <span class="r-label">Issue Age:</span>
                  <span class="r-val">{{ reportForm.get('issueAge')?.value }}</span>
                </div>
                <div class="review-row">
                  <span class="r-label">Location:</span>
                  <span class="r-val">{{ reportForm.get('address')?.value }}, {{ reportForm.get('area')?.value }} ({{ currentLat.toFixed(4) }}, {{ currentLng.toFixed(4) }})</span>
                </div>
                <div class="review-row">
                  <span class="r-label">Public Impact:</span>
                  <span class="r-val">{{ reportForm.get('publicImpact')?.value }}</span>
                </div>
                <div class="review-row">
                  <span class="r-label">Citizen:</span>
                  <span class="r-val">{{ reportForm.get('citizenName')?.value }} ({{ reportForm.get('citizenPhone')?.value }}) &bull; {{ reportForm.get('isAnonymous')?.value ? 'Anonymous in public' : 'Public attribution' }}</span>
                </div>
                <div class="review-row" *ngIf="photoPreview">
                  <span class="r-label">Photo Attached:</span>
                  <span class="r-val"><img [src]="photoPreview" class="review-thumb" alt="Preview" /></span>
                </div>
              </div>

              <div class="review-disclaimer">
                <i class="bi bi-info-circle"></i>
                By submitting, you certify that this civic report is filed in good faith. False emergency reports are flagged by the audit engine.
              </div>
            </div>

            <div class="review-modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showReviewModal = false">
                <i class="bi bi-pencil"></i> Make Changes
              </button>
              <button id="confirmLodgeBtn" type="button" class="btn btn-saffron btn-lg" (click)="confirmAndSubmit()">
                <i class="bi bi-send-check-fill"></i> Confirm & Lodge Grievance
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .report-header-banner {
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
    }

    .report-container {
      padding: 3rem 1.25rem;
    }
    .report-layout {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 2rem;
      align-items: start;
    }

    .report-form {
      padding: 2.5rem;
    }
    .form-section {
      padding-bottom: 2rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--border-light);
    }
    .section-title-wrap {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .section-number {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--navy-900);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
      flex-shrink: 0;
    }
    .form-section-title {
      font-size: 1.2rem;
      color: var(--navy-900);
      margin: 0;
    }
    .form-section-desc {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin: 0;
    }

    .age-pills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.4rem;
    }
    .age-pill-label {
      padding: 0.5rem 1rem;
      border: 1px solid var(--border-medium);
      border-radius: var(--radius-full);
      font-size: 0.8125rem;
      cursor: pointer;
      background: #ffffff;
      transition: all 0.15s ease;
    }
    .age-pill-label:hover {
      border-color: var(--navy-700);
      background: var(--navy-50);
    }
    .age-pill-label.selected {
      background: var(--navy-900);
      color: #ffffff;
      border-color: var(--navy-900);
    }
    .sr-only {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }
    .help-text {
      display: block;
      margin-top: 0.4rem;
      font-size: 0.775rem;
    }

    .label-with-counter {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .char-counter {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .danger-impact-box {
      margin-top: 1.25rem;
      padding: 1.25rem;
      background: #fafafa;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-md);
    }
    .danger-toggle-card {
      border: 1px dashed #fca5a5;
      background: #fff5f5;
      padding: 0.85rem;
      border-radius: var(--radius-md);
      transition: all 0.2s;
    }
    .danger-toggle-card.danger-active {
      border-color: #dc2626;
      background: #fee2e2;
    }
    .danger-label {
      display: block;
      font-weight: 700;
      color: #dc2626;
      font-size: 0.875rem;
    }
    .danger-sub {
      display: block;
      font-size: 0.75rem;
      color: #991b1b;
      margin-top: 2px;
    }

    /* Map Box */
    .map-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .quick-areas-dropdown {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
    .map-wrapper {
      position: relative;
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--border-medium);
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
      margin-bottom: 1.25rem;
    }
    .leaflet-map-box {
      width: 100%;
      height: 380px;
      z-index: 1;
    }
    .map-badge-coords {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background: rgba(15, 23, 42, 0.85);
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.75rem;
      font-family: monospace;
      z-index: 1000;
      backdrop-filter: blur(4px);
    }
    .location-fields-row {
      margin-top: 0.5rem;
    }

    /* Photo Upload */
    .photo-upload-zone {
      margin-bottom: 1rem;
    }
    .file-input-hidden {
      display: none;
    }
    .file-drop-label {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 2px dashed var(--border-medium);
      border-radius: var(--radius-md);
      padding: 2rem;
      cursor: pointer;
      background: #fafafa;
      transition: all 0.2s ease;
    }
    .file-drop-label:hover {
      border-color: var(--navy-700);
      background: var(--navy-50);
    }
    .upload-icon {
      font-size: 2.5rem;
      color: var(--navy-600);
      margin-bottom: 0.5rem;
    }
    .upload-text {
      font-weight: 600;
      color: var(--navy-900);
      font-size: 0.95rem;
    }
    .upload-sub {
      font-size: 0.775rem;
      color: var(--text-muted);
      margin-top: 0.25rem;
    }
    .quick-samples-box {
      margin-top: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-light);
    }
    .samples-title {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--navy-900);
      margin-bottom: 0.75rem;
    }
    .samples-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }
    .sample-photo-btn {
      background: #ffffff;
      border: 1px solid var(--border-light);
      border-radius: var(--radius-sm);
      padding: 4px;
      cursor: pointer;
      text-align: center;
      transition: all 0.15s;
    }
    .sample-photo-btn:hover {
      border-color: var(--saffron-500);
      transform: translateY(-2px);
    }
    .sample-photo-btn img {
      width: 100%;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
      margin-bottom: 4px;
    }
    .sample-photo-btn span {
      display: block;
      font-size: 0.7rem;
      color: var(--text-main);
      font-weight: 500;
    }
    .photo-preview-card {
      border-radius: var(--radius-md);
      overflow: hidden;
      border: 1px solid var(--border-medium);
      max-width: 400px;
    }
    .preview-img {
      width: 100%;
      height: 220px;
      object-fit: cover;
    }
    .preview-meta-bar {
      padding: 0.75rem 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #ffffff;
    }
    .preview-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--navy-900);
    }

    .privacy-alert-box {
      margin-bottom: 1.25rem;
    }
    .privacy-icon {
      font-size: 1.5rem;
      color: #0284c7;
    }
    .anonymous-toggle-wrap {
      display: flex;
      align-items: center;
      padding-top: 1.5rem;
    }

    .form-actions-bar {
      display: flex;
      gap: 1rem;
      padding-top: 1rem;
    }

    /* Sidebar Tips */
    .report-sidebar {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .sidebar-card {
      padding: 1.5rem;
    }
    .sidebar-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      font-size: 1rem;
    }
    .sidebar-header h4 { margin: 0; font-size: 1rem; }
    .checklist {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
    .checklist li {
      display: flex;
      gap: 0.5rem;
      line-height: 1.45;
    }
    .text-green { color: #16a34a; }
    .emergency-card {
      border-color: #fee2e2;
      background: #fff8f8;
    }
    .emergency-desc {
      font-size: 0.8125rem;
      color: #7f1d1d;
      margin-bottom: 1rem;
    }
    .emergency-quick-dial {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
    }
    .dial-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.5rem 0.25rem;
      background: #ffffff;
      border: 1px solid #fecaca;
      border-radius: var(--radius-sm);
      color: #991b1b;
      font-size: 0.75rem;
      text-decoration: none;
    }
    .dial-btn strong {
      font-size: 1.1rem;
      color: #dc2626;
    }

    /* Review Modal */
    .review-modal {
      max-width: 650px;
    }
    .review-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.75rem;
      border-bottom: 1px solid var(--border-light);
    }
    .modal-title-wrap {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .modal-title-wrap h3 { margin: 0; font-size: 1.25rem; }
    .close-modal-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--text-muted);
    }
    .review-modal-body {
      padding: 1.5rem 1.75rem;
    }
    .priority-preview-box {
      padding: 1rem 1.25rem;
      border-radius: var(--radius-md);
      margin-bottom: 1.25rem;
    }
    .p0-preview {
      background: #fef2f2;
      border: 1px solid #f87171;
    }
    .std-preview {
      background: #f0fdf4;
      border: 1px solid #86efac;
    }
    .preview-prio-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.4rem;
    }
    .preview-tag {
      font-size: 0.725rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: var(--navy-900);
    }
    .preview-prio-reason {
      font-size: 0.8125rem;
      color: var(--text-main);
      margin: 0;
    }
    .review-details-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
      font-size: 0.875rem;
      margin-bottom: 1.25rem;
    }
    .review-row {
      display: grid;
      grid-template-columns: 130px 1fr;
      gap: 0.5rem;
    }
    .r-label {
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.8125rem;
    }
    .r-val {
      color: var(--navy-900);
    }
    .review-thumb {
      width: 70px;
      height: 50px;
      object-fit: cover;
      border-radius: 4px;
    }
    .review-disclaimer {
      font-size: 0.75rem;
      color: var(--text-muted);
      background: #f8fafc;
      padding: 0.65rem;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }
    .review-modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.25rem 1.75rem;
      background: #f8fafc;
      border-top: 1px solid var(--border-light);
    }

    /* Confirmation Card */
    .confirmation-card {
      text-align: center;
      padding: 4rem 2rem;
      max-width: 800px;
      margin: 0 auto;
    }
    .confirmation-icon {
      font-size: 4rem;
      color: #16a34a;
      margin-bottom: 1rem;
    }
    .confirmation-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.35rem 0.85rem;
      background: #dcfce7;
      color: #15803d;
      font-weight: 700;
      font-size: 0.8rem;
      border-radius: 999px;
      margin-bottom: 1rem;
    }
    .confirmation-title {
      font-size: 2.25rem;
      color: var(--navy-900);
      margin-bottom: 0.5rem;
    }
    .confirmation-desc {
      color: var(--text-muted);
      max-width: 580px;
      margin: 0 auto 2rem;
    }
    .complaint-id-box {
      background: var(--navy-900);
      color: #ffffff;
      padding: 1.5rem;
      border-radius: var(--radius-md);
      max-width: 480px;
      margin: 0 auto 2rem;
    }
    .id-label {
      display: block;
      font-size: 0.75rem;
      letter-spacing: 0.05em;
      color: var(--saffron-400);
      font-weight: 700;
      margin-bottom: 0.4rem;
    }
    .id-code-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
    }
    .id-code {
      font-size: 2rem;
      font-weight: 800;
      font-family: monospace;
      letter-spacing: 0.05em;
    }
    .confirmation-summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      text-align: left;
      background: #f8fafc;
      padding: 1.5rem;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-light);
      max-width: 680px;
      margin: 0 auto 2.5rem;
    }
    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }
    .summary-item .label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--text-muted);
    }
    .summary-item .value {
      font-size: 0.875rem;
      color: var(--navy-900);
    }
    .confirmation-actions {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 1rem;
    }

    /* Checkbox Styles */
    .checkbox-container {
      display: flex;
      align-items: flex-start;
      gap: 0.65rem;
      cursor: pointer;
    }
    .font-semibold { font-weight: 600; }
    .text-xs { font-size: 0.75rem; }

    @media (max-width: 960px) {
      .report-layout { grid-template-columns: 1fr; }
      .samples-grid { grid-template-columns: repeat(2, 1fr); }
      .confirmation-summary-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .report-form { padding: 1.5rem; }
      .quick-areas-dropdown { display: none; }
      .form-actions-bar { flex-direction: column; }
    }
  `]
})
export class ReportComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapContainer') mapContainerRef!: ElementRef;

  fb = inject(FormBuilder);
  route = inject(ActivatedRoute);
  router = inject(Router);
  complaintService = inject(ComplaintService);
  langService = inject(LanguageService);

  reportForm!: FormGroup;
  map!: L.Map;
  marker!: L.Marker;
  isLocating = false;

  // Hyderabad center default
  currentLat = 17.3850;
  currentLng = 78.4867;

  photoPreview: string | null = null;
  fileError: string | null = null;
  samplePhotos = SAMPLE_PHOTOS;

  showReviewModal = false;
  previewPriority: 'P0' | 'P1' | 'P2' | 'P3' = 'P3';
  previewScore = 0;
  previewReason = '';

  submittedComplaint: Complaint | null = null;
  copied = false;

  categories: ComplaintCategory[] = [
    'Roads & Potholes',
    'Garbage & Sanitation',
    'Sewage & Drainage',
    'Water Supply',
    'Streetlights & Electricity',
    'Parks & Gardens',
    'Footpaths',
    'Public Toilets',
    'Stray Animals',
    'Other Issues'
  ];

  subcategoriesMap: Record<ComplaintCategory, string[]> = {
    'Roads & Potholes': [
      'Severe Pothole / Road Cave-in',
      'Asphalt Peeling / Uneven Surface',
      'Damaged Speed Breaker / Rumble Strips',
      'Trench Dug for Cables Not Filled'
    ],
    'Garbage & Sanitation': [
      'Garbage Dump Overflow',
      'Commercial Food Waste Accumulation',
      'Dead Animal Carcass Removal',
      'Community Dustbin Missing or Damaged'
    ],
    'Sewage & Drainage': [
      'Missing Manhole Cover',
      'Blocked Drain / Overflow',
      'Stagnant Stormwater Inundation',
      'Cracked Underground Sewer Pipe'
    ],
    'Water Supply': [
      'Contaminated Water',
      'Main Water Line Burst',
      'Low Water Pressure',
      'Supply Cutoff (> 3 Days)'
    ],
    'Streetlights & Electricity': [
      'Exposed Live Wire / Hazard',
      'Streetlight Not Working',
      'Sparking Transformer / Pole',
      'Broken Pole / Dangling Cable'
    ],
    'Parks & Gardens': [
      'Broken Bench / Equipment',
      'Overgrown Weed / Tree Falling Threat',
      'Damaged Playground Swings',
      'Irrigation / Fountain Failure'
    ],
    'Footpaths': [
      'Broken Pavement / Pavers',
      'Illegal Encroachment on Walkway',
      'Missing Wheelchair / Pedestrian Ramp',
      'Open Cable Trench on Sidewalk'
    ],
    'Public Toilets': [
      'Sanitary Maintenance',
      'Choked Toilet / No Water',
      'Broken Door / Missing Latches',
      'Foul Smell / Sludge Leakage'
    ],
    'Stray Animals': [
      'Stray Dogs / Animal Threat',
      'Aggressive Dog Pack Chasing School Children',
      'Stray Cattle Traffic Obstruction',
      'Monkey Menace'
    ],
    'Other Issues': [
      'Illegal Commercial Hoarding',
      'Noise Pollution / DG Set Violation',
      'Unauthorized Construction',
      'Lake Encroachment / Dumping'
    ]
  };

  currentSubcategories: string[] = [];

  issueAgeOptions: IssueAge[] = [
    'Just happened (< 2 hours)',
    '1-2 days',
    '3-7 days',
    '1-2 weeks',
    'Over a month'
  ];

  publicImpactOptions: PublicImpact[] = [
    'Critical - Hospital / School / High Traffic Arterial',
    'High - Commercial Hub / Main Transit Road',
    'Medium - Residential Colony / Sector Road',
    'Low - Isolated Lane / Local Park'
  ];

  ngOnInit(): void {
    this.buildForm();

    // Check query params for preselected category
    this.route.queryParams.subscribe(params => {
      if (params['cat'] && this.categories.includes(params['cat'])) {
        this.reportForm.patchValue({ category: params['cat'] });
        this.onCategoryChange();
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initLeafletMap();
    }, 200);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  buildForm(): void {
    this.reportForm = this.fb.group({
      category: ['', Validators.required],
      subcategory: ['', Validators.required],
      title: ['', [Validators.required, Validators.minLength(8)]],
      description: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
      issueAge: ['1-2 days', Validators.required],
      address: ['Opposite St. Mary School, Begumpet Main Road', Validators.required],
      area: ['Begumpet', Validators.required],
      immediateDanger: [false],
      publicImpact: ['Medium - Residential Colony / Sector Road', Validators.required],
      citizenName: ['Venkata Rao', [Validators.required, Validators.minLength(3)]],
      citizenPhone: ['9849011223', [Validators.required, Validators.pattern('^[6-9][0-9]{9}$')]],
      citizenEmail: [''],
      preferredLanguage: ['English'],
      isAnonymous: [false]
    });

    this.onCategoryChange();
  }

  get f() {
    return this.reportForm.controls;
  }

  onCategoryChange(): void {
    const cat = this.reportForm.get('category')?.value as ComplaintCategory;
    if (cat && this.subcategoriesMap[cat]) {
      this.currentSubcategories = this.subcategoriesMap[cat];
      if (!this.currentSubcategories.includes(this.reportForm.get('subcategory')?.value)) {
        this.reportForm.patchValue({ subcategory: this.currentSubcategories[0] });
      }
    } else {
      this.currentSubcategories = [];
    }
  }

  initLeafletMap(): void {
    if (!this.mapContainerRef) return;

    // Fix leaflet marker asset paths in Angular (Offline-bundled)
    const iconDefault = L.icon({
      iconUrl: '/leaflet/marker-icon.png',
      iconRetinaUrl: '/leaflet/marker-icon-2x.png',
      shadowUrl: '/leaflet/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    this.map = L.map(this.mapContainerRef.nativeElement).setView([this.currentLat, this.currentLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &bull; Akhand Bharat Seva'
    }).addTo(this.map);

    this.marker = L.marker([this.currentLat, this.currentLng], {
      draggable: true,
      icon: iconDefault
    }).addTo(this.map);

    this.marker.bindPopup(`<b>Selected Grievance Location</b><br>Lat: ${this.currentLat.toFixed(4)}, Lng: ${this.currentLng.toFixed(4)}`).openPopup();

    // Map Click Listener
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.updateCoordinates(e.latlng.lat, e.latlng.lng);
    });

    // Marker Drag Listener
    this.marker.on('dragend', () => {
      const pos = this.marker.getLatLng();
      this.updateCoordinates(pos.lat, pos.lng);
    });
  }

  updateCoordinates(lat: number, lng: number): void {
    this.currentLat = lat;
    this.currentLng = lng;
    this.marker.setLatLng([lat, lng]);
    this.marker.setPopupContent(`<b>Selected Grievance Location</b><br>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`).openPopup();
  }

  locateUser(): void {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    this.isLocating = true;
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.isLocating = false;
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        this.updateCoordinates(lat, lng);
        this.map.setView([lat, lng], 16);
      },
      err => {
        this.isLocating = false;
        console.warn('Geolocation permission error, falling back to Hyderabad center', err);
        // Fallback to Hyderabad Begumpet center
        this.jumpToLocation(17.4435, 78.4682, 'Begumpet Main Road', 'Begumpet');
        alert('Could not access GPS. Centered on Hyderabad Begumpet hub.');
      },
      { timeout: 7000 }
    );
  }

  jumpToLocation(lat: number, lng: number, address: string, area: string): void {
    this.updateCoordinates(lat, lng);
    this.map.setView([lat, lng], 15);
    this.reportForm.patchValue({
      address,
      area
    });
  }

  onFileSelected(event: Event): void {
    this.fileError = null;
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

      if (!validTypes.includes(file.type)) {
        this.fileError = 'Invalid file type. Please upload a JPEG, PNG, or WebP image.';
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        this.fileError = 'File size exceeds 5MB limit. Please upload a smaller image.';
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.photoPreview = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  selectSamplePhoto(url: string): void {
    this.photoPreview = url;
    this.fileError = null;
  }

  removePhoto(): void {
    this.photoPreview = null;
    this.fileError = null;
  }

  onOpenReview(): void {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    const val = this.reportForm.value;
    const breakdown = this.complaintService.calculateSmartPriority(
      val.category,
      val.subcategory,
      val.description,
      val.immediateDanger,
      val.publicImpact,
      val.issueAge
    );

    this.previewPriority = breakdown.priority;
    this.previewScore = breakdown.score;
    this.previewReason = breakdown.reason;
    this.showReviewModal = true;
  }

  confirmAndSubmit(): void {
    const val = this.reportForm.value;

    const newComplaint = this.complaintService.submitComplaint({
      category: val.category,
      subcategory: val.subcategory,
      title: val.title,
      description: val.description,
      issueAge: val.issueAge,
      location: {
        address: val.address,
        area: val.area,
        latitude: this.currentLat,
        longitude: this.currentLng
      },
      photoUrl: this.photoPreview || undefined,
      citizen: {
        name: val.citizenName,
        phone: val.citizenPhone,
        email: val.citizenEmail || '',
        isAnonymous: val.isAnonymous
      },
      immediateDanger: val.immediateDanger,
      publicImpact: val.publicImpact
    });

    this.showReviewModal = false;
    this.submittedComplaint = newComplaint;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  copyId(id: string): void {
    navigator.clipboard.writeText(id).then(() => {
      this.copied = true;
      setTimeout(() => this.copied = false, 2500);
    });
  }

  resetForm(): void {
    this.submittedComplaint = null;
    this.reportForm.reset({
      issueAge: '1-2 days',
      address: 'Opposite St. Mary School, Begumpet Main Road',
      area: 'Begumpet',
      immediateDanger: false,
      publicImpact: 'Medium - Residential Colony / Sector Road',
      preferredLanguage: 'English',
      isAnonymous: false
    });
    this.photoPreview = null;
    this.fileError = null;
    this.currentLat = 17.3850;
    this.currentLng = 78.4867;
    if (this.map) {
      this.updateCoordinates(17.3850, 78.4867);
      this.map.setView([17.3850, 78.4867], 13);
    }
  }
}
