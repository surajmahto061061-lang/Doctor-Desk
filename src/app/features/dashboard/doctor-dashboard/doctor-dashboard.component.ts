// ─────────────────────────────────────────────────────────────
// doctor-dashboard.component.ts — Monolith version
// Added: Patient Records tab (date-wise), Doctor Update Appointment,
//        Slot generation, updated API calls to monolith endpoints
// ─────────────────────────────────────────────────────────────
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { DoctorService } from '../../../core/services/doctor.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  Appointment, DoctorStats, Doctor, PatientRecord, PatientSummary, CreateRecordRequest,
  Clinic, BedResponse, BedStatsResponse
} from '../../../core/models';
import { BankDetailsService } from '../../../core/services/BankDetailsService';
import { BedService } from '../../../core/services/BedService';
import { environment } from '../../../../environments/environment';
import { AvatarUploadComponent } from 'src/app/shared/components/AvatarUploadComponent';

type DoctorProfile = Doctor;

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarUploadComponent],
  template: `
    <div class="page-container">

      <!-- ── PENDING APPROVAL SCREEN ── -->
      @if (isPending) {
        <div class="pending-wrap">
          <div class="pending-card">
            <div class="pending-icon">⏳</div>
            <h2>Account Under Review</h2>
            <p>Your doctor profile has been submitted and is currently being reviewed by our admin team.</p>
            <p>You will be able to access your dashboard and receive appointments once your account is approved.</p>
            <div class="pending-info">
              <span>📧 Registered as:</span>
              <strong>{{ auth.user()?.email }}</strong>
            </div>
            <div class="pending-info">
              <span>📋 Status:</span>
              <strong class="badge badge-amber">Pending Approval</strong>
            </div>
            <p class="pending-note">Please contact <a href="mailto:admin@solvixon.com">admin&#64;solvixon.com</a> if you have any questions.</p>
          </div>
        </div>

      } @else if (isRejected) {
        <div class="pending-wrap">
          <div class="pending-card rejected">
            <div class="pending-icon">❌</div>
            <h2>Application Rejected</h2>
            <p>Unfortunately your doctor application was not approved at this time.</p>
            <p>Please contact our admin team for more information.</p>
            <p class="pending-note">Email: <a href="mailto:admin@solvixon.com">admin&#64;solvixon.com</a></p>
          </div>
        </div>

      } @else {

      <div class="dash-header">
        <div style="display:flex;align-items:center;gap:14px">
          <app-avatar-upload [imageUrl]="auth.user()?.profileImageUrl" [name]="auth.getUserName()" size="lg" [editable]="false"></app-avatar-upload>
          <div>
            <h2>🩺 Doctor Dashboard</h2>
            <p>Welcome, Dr. {{ auth.user()?.name || auth.user()?.email }}</p>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline btn-sm" (click)="toggleAvailability()" [disabled]="togglingAvail">
            @if (togglingAvail) { <span class="spinner spinner-sm"></span> }
            @else { {{ profile?.available ? '🟢 Available' : '🔴 Unavailable' }} }
          </button>
          <button class="btn btn-ghost btn-sm" (click)="activeTab='profile'">Edit profile</button>
        </div>
      </div>

      <div class="tab-nav">
        <button class="tab-btn" [class.active]="activeTab==='overview'"   (click)="activeTab='overview'">Overview</button>
        <button class="tab-btn" [class.active]="activeTab==='today'"      (click)="activeTab='today'; loadToday()">Today</button>
        <button class="tab-btn" [class.active]="activeTab==='bydate'"     (click)="activeTab='bydate'">By Date</button>
        <button class="tab-btn" [class.active]="activeTab==='all'"        (click)="loadAll(); activeTab='all'">All Appointments</button>
        <button class="tab-btn" [class.active]="activeTab==='patients'"   (click)="loadPatients(); activeTab='patients'">Patient Records</button>
        <button class="tab-btn" [class.active]="activeTab==='slots'"      (click)="activeTab='slots'">Slots</button>
        <button class="tab-btn" [class.active]="activeTab==='beds'"       (click)="activeTab='beds'; openBedsTab()">🛏️ Beds</button>
        <button class="tab-btn" [class.active]="activeTab==='profile'"    (click)="activeTab='profile'">Profile</button>
        <button class="tab-btn" [class.active]="activeTab==='qr'"       (click)="activeTab='qr'; loadMyQr()">📲 My QR</button>
        <button class="tab-btn" [class.active]="activeTab==='bank'"      (click)="activeTab='bank'; loadBankDetails()">
          🏦 Bank KYC
          @if (kycDetails?.kycStatus === 'ACTIVATED') { <span class="kyc-dot kyc-active"></span> }
          @if (kycDetails?.kycStatus === 'PENDING' || kycDetails?.kycStatus === 'NEEDS_CLARIFICATION') { <span class="kyc-dot kyc-pending"></span> }
        </button>
      </div>

      <!-- ── OVERVIEW ── -->
      @if (activeTab === 'overview') {
        @if (statsLoading) {
          <div class="loading-wrap"><div class="spinner spinner-lg"></div><p>Loading stats…</p></div>
        } @else {
          <div class="grid-4 mb-24">
            <div class="stat-card primary">
              <div class="stat-label">Today's patients</div>
              <div class="stat-value">{{ stats?.todayAppointments ?? '—' }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total appointments</div>
              <div class="stat-value">{{ stats?.totalAppointments ?? '—' }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Confirmed</div>
              <div class="stat-value">{{ stats?.confirmedAppointments ?? '—' }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Monthly earnings</div>
              <div class="stat-value rev">₹{{ (stats?.monthlyEarnings ?? 0) | number }}</div>
            </div>
          </div>
          <h3 class="section-title">Today's schedule</h3>
          <ng-container *ngTemplateOutlet="apptList; context:{appts: todayAppts, loading: todayLoading}"></ng-container>
        }
      }

      <!-- ── TODAY ── -->
      @if (activeTab === 'today') {
        <div class="tab-toolbar">
          <h3>Today — {{ today }}</h3>
          <button class="btn btn-ghost btn-sm" (click)="loadToday()">↻ Refresh</button>
        </div>
        <ng-container *ngTemplateOutlet="apptList; context:{appts: todayAppts, loading: todayLoading}"></ng-container>
      }

      <!-- ── BY DATE ── -->
      @if (activeTab === 'bydate') {
        <div class="tab-toolbar">
          <div style="display:flex;gap:10px;align-items:center">
            <label style="font-weight:500">Select date:</label>
            <input type="date" [(ngModel)]="selectedDate" class="form-control" style="width:170px"
              (change)="loadByDate()" />
          </div>
          <button class="btn btn-ghost btn-sm" (click)="loadByDate()">↻ Load</button>
        </div>
        @if (byDateLoading) {
          <div class="loading-wrap"><div class="spinner spinner-lg"></div></div>
        } @else {
          <div class="text-sm text-muted mb-16">{{ byDateAppts.length }} appointment(s) on {{ selectedDate }}</div>
          <ng-container *ngTemplateOutlet="apptList; context:{appts: byDateAppts, loading: byDateLoading}"></ng-container>
        }
      }

      <!-- ── ALL APPOINTMENTS ── -->
      @if (activeTab === 'all') {
        <div class="tab-toolbar">
          <h3>All Appointments</h3>
          <button class="btn btn-ghost btn-sm" (click)="loadAll()">↻ Refresh</button>
        </div>
        <ng-container *ngTemplateOutlet="apptList; context:{appts: allAppts, loading: allLoading}"></ng-container>
        @if (allPage > 0 || allHasMore) {
          <div class="pagination">
            <button class="btn btn-ghost btn-sm" [disabled]="allPage===0" (click)="loadAll(allPage-1)">← Prev</button>
            <span class="text-sm text-muted">Page {{ allPage+1 }}</span>
            <button class="btn btn-ghost btn-sm" [disabled]="!allHasMore" (click)="loadAll(allPage+1)">Next →</button>
          </div>
        }
      }

      <!-- ── PATIENT RECORDS ── -->
      @if (activeTab === 'patients') {
        <div class="tab-toolbar">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <h3>Patient Records</h3>
            <span class="chip">{{ totalPatients }} patients</span>
          </div>
          <div style="display:flex;gap:8px">
            <input type="text" [(ngModel)]="patientSearch" placeholder="Search by name…"
              class="form-control" style="width:200px" (input)="onPatientSearch()" />
            <button class="btn btn-primary btn-sm" (click)="showCreateRecord=true">+ New Record</button>
            <button class="btn btn-ghost btn-sm" (click)="loadPatients()">↻</button>
          </div>
        </div>

        <!-- Date filter for records -->
        <div style="display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap">
          <label class="text-sm font-medium">Filter by date:</label>
          <input type="date" [(ngModel)]="recordDateFilter" class="form-control" style="width:160px"
            (change)="loadPatientsByDate()" />
          <button class="btn btn-ghost btn-sm" (click)="recordDateFilter=''; loadPatients()">Clear</button>
        </div>

        @if (patientsLoading) {
          <div class="loading-wrap"><div class="spinner spinner-lg"></div></div>
        } @else if (patientSummaries.length) {
          <div class="patient-grid">
            @for (p of patientSummaries; track p.patientId) {
              <div class="patient-card" (click)="loadPatientHistory(p.patientId)">
                <div class="patient-avatar">{{ (p.patientName || 'P').charAt(0).toUpperCase() }}</div>
                <div class="patient-info">
                  <div class="patient-name">{{ p.patientName }}</div>
                  @if (p.patientPhone) { <div class="text-sm text-muted">📞 {{ p.patientPhone }}</div> }
                  <div class="text-sm text-muted">{{ p.totalVisits }} visit(s) · Last: {{ p.lastVisit }}</div>
                  @if (p.lastDiagnosis) { <div class="chip chip-blue" style="margin-top:4px;display:inline-block">{{ p.lastDiagnosis }}</div> }
                </div>
                <button class="btn btn-ghost btn-sm">View →</button>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>No patient records</h3>
            <p>Add records after appointments</p>
            <button class="btn btn-primary btn-sm" (click)="showCreateRecord=true">+ Add First Record</button>
          </div>
        }

        <!-- Patient history panel -->
        @if (selectedPatientHistory.length) {
          <div class="history-panel">
            <div class="tab-toolbar">
              <h4>History for {{ selectedPatientHistory[0]?.patientName }}</h4>
              <button class="btn btn-ghost btn-sm" (click)="selectedPatientHistory=[]">✕ Close</button>
            </div>
            @for (r of selectedPatientHistory; track r.id) {
              <div class="record-card">
                <div class="record-header">
                  <span class="record-date">📅 {{ r.visitDate }}</span>
                  @if (r.appointmentId) { <span class="chip">Appt #{{ r.appointmentId }}</span> }
                  <button class="btn btn-ghost btn-sm" (click)="editRecord(r)">Edit</button>
                </div>
                @if (r.chiefComplaint) { <div class="record-field"><b>Complaint:</b> {{ r.chiefComplaint }}</div> }
                @if (r.diagnosis)      { <div class="record-field"><b>Diagnosis:</b> {{ r.diagnosis }}</div> }
                @if (r.prescription)   { <div class="record-field"><b>Rx:</b> {{ r.prescription }}</div> }
                @if (r.clinicalNotes)  { <div class="record-field"><b>Notes:</b> {{ r.clinicalNotes }}</div> }
                @if (r.bloodPressure || r.pulse || r.temperature) {
                  <div class="vitals-row">
                    @if (r.bloodPressure) { <span class="vital-chip">BP: {{ r.bloodPressure }}</span> }
                    @if (r.pulse)         { <span class="vital-chip">Pulse: {{ r.pulse }}</span> }
                    @if (r.temperature)   { <span class="vital-chip">Temp: {{ r.temperature }}</span> }
                    @if (r.oxygenSaturation) { <span class="vital-chip">SpO₂: {{ r.oxygenSaturation }}</span> }
                  </div>
                }
                @if (r.followUpDate) { <div class="record-field text-sm" style="color:#1D9E75">🗓 Follow-up: {{ r.followUpDate }}</div> }
              </div>
            }
          </div>
        }

        <!-- Create Record Modal -->
        @if (showCreateRecord) {
          <div class="modal-overlay" (click)="showCreateRecord=false">
            <div class="modal-box modal-wide" (click)="$event.stopPropagation()">
              <button class="modal-close" (click)="showCreateRecord=false">✕</button>
              <h3>New Patient Record</h3>
              <div class="form-grid">
                <div class="form-group">
                  <label>Patient ID *</label>
                  <input type="number" [(ngModel)]="newRecord.patientId" class="form-control" placeholder="Patient user ID" />
                </div>
                <div class="form-group">
                  <label>Patient Name *</label>
                  <input type="text" [(ngModel)]="newRecord.patientName" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Phone</label>
                  <input type="text" [(ngModel)]="newRecord.patientPhone" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Age</label>
                  <input type="number" [(ngModel)]="newRecord.patientAge" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Visit Date *</label>
                  <input type="date" [(ngModel)]="newRecord.visitDate" class="form-control" />
                </div>
                <div class="form-group">
                  <label>Appointment ID</label>
                  <input type="number" [(ngModel)]="newRecord.appointmentId" class="form-control" placeholder="Optional" />
                </div>
              </div>
              <div class="form-group">
                <label>Chief Complaint</label>
                <textarea [(ngModel)]="newRecord.chiefComplaint" class="form-control" rows="2"></textarea>
              </div>
              <div class="form-group">
                <label>Diagnosis</label>
                <textarea [(ngModel)]="newRecord.diagnosis" class="form-control" rows="2"></textarea>
              </div>
              <div class="form-group">
                <label>Prescription</label>
                <textarea [(ngModel)]="newRecord.prescription" class="form-control" rows="3"></textarea>
              </div>
              <div class="form-group">
                <label>Clinical Notes</label>
                <textarea [(ngModel)]="newRecord.clinicalNotes" class="form-control" rows="2"></textarea>
              </div>
              <div class="vitals-form">
                <h4>Vitals</h4>
                <div class="form-grid">
                  <div class="form-group"><label>BP</label><input type="text" [(ngModel)]="newRecord.bloodPressure" class="form-control" placeholder="120/80" /></div>
                  <div class="form-group"><label>Pulse</label><input type="text" [(ngModel)]="newRecord.pulse" class="form-control" placeholder="72 bpm" /></div>
                  <div class="form-group"><label>Temp</label><input type="text" [(ngModel)]="newRecord.temperature" class="form-control" placeholder="98.6°F" /></div>
                  <div class="form-group"><label>SpO₂</label><input type="text" [(ngModel)]="newRecord.oxygenSaturation" class="form-control" placeholder="98%" /></div>
                  <div class="form-group"><label>Weight</label><input type="text" [(ngModel)]="newRecord.weight" class="form-control" placeholder="70 kg" /></div>
                  <div class="form-group"><label>Height</label><input type="text" [(ngModel)]="newRecord.height" class="form-control" placeholder="170 cm" /></div>
                </div>
              </div>
              <div class="form-group">
                <label>Follow-up Date</label>
                <input type="date" [(ngModel)]="newRecord.followUpDate" class="form-control" style="width:200px" />
              </div>
              <div class="form-group">
                <label>Follow-up Instructions</label>
                <textarea [(ngModel)]="newRecord.followUpInstructions" class="form-control" rows="2"></textarea>
              </div>
              <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
                <button class="btn btn-ghost" (click)="showCreateRecord=false">Cancel</button>
                <button class="btn btn-primary" (click)="saveRecord()" [disabled]="savingRecord">
                  @if (savingRecord) { <span class="spinner spinner-sm"></span> } @else { Save Record }
                </button>
              </div>
            </div>
          </div>
        }
      }

      <!-- ── SLOTS ── -->
      @if (activeTab === 'slots') {
        <div class="tab-toolbar">
          <h3>Manage Slots</h3>
        </div>

        <div class="card mb-24">
          <h4 style="margin-bottom:14px">Generate Slots</h4>
          <div class="form-grid">
            <div class="form-group">
              <label>Start Date</label>
              <input type="date" [(ngModel)]="slotGen.startDate" class="form-control" />
            </div>
            <div class="form-group">
              <label>End Date</label>
              <input type="date" [(ngModel)]="slotGen.endDate" class="form-control" />
            </div>
            <div class="form-group">
              <label>Start Time</label>
              <input type="time" [(ngModel)]="slotGen.startTime" class="form-control" />
            </div>
            <div class="form-group">
              <label>End Time</label>
              <input type="time" [(ngModel)]="slotGen.endTime" class="form-control" />
            </div>
            <div class="form-group">
              <label>Duration (min)</label>
              <select [(ngModel)]="slotGen.slotDurationMinutes" class="form-control">
                <option [value]="15">15 min</option>
                <option [value]="20">20 min</option>
                <option [value]="30">30 min</option>
                <option [value]="45">45 min</option>
                <option [value]="60">60 min</option>
              </select>
            </div>
          </div>
          <button class="btn btn-primary" (click)="generateSlots()" [disabled]="generatingSlots">
            @if (generatingSlots) { <span class="spinner spinner-sm"></span> Generating… }
            @else { ⚡ Generate Slots }
          </button>
          @if (slotsGenerated !== null) {
            <div class="alert alert-success" style="margin-top:12px">✅ {{ slotsGenerated }} slots created!</div>
          }
        </div>

        <div class="card">
          <h4 style="margin-bottom:14px">Mark Unavailable Dates</h4>
          <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap">
            <div class="form-group" style="margin:0">
              <label>Date</label>
              <input type="date" [(ngModel)]="newUnavailDate" class="form-control" style="width:170px" />
            </div>
            <div class="form-group" style="margin:0;flex:1;min-width:150px">
              <label>Reason (optional)</label>
              <input type="text" [(ngModel)]="newUnavailReason" class="form-control" placeholder="e.g. Conference" />
            </div>
            <button class="btn btn-outline" (click)="addUnavail()">Mark Unavailable</button>
          </div>
          @if (unavailDates.length) {
            <div class="unavail-list">
              @for (d of unavailDates; track d.date) {
                <div class="unavail-item">
                  <span>{{ d.date }}</span>
                  <span class="text-muted text-sm">{{ d.reason || '—' }}</span>
                  <button class="btn btn-ghost btn-sm" style="color:var(--danger)"
                    (click)="removeUnavail(d.id!)">Remove</button>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- ── PROFILE ── -->
      @if (activeTab === 'profile') {
        <div class="card">
          <h3 style="margin-bottom:16px">Edit Profile</h3>

          <div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">
            <app-avatar-upload [imageUrl]="auth.user()?.profileImageUrl" [name]="auth.getUserName()" size="xl" [editable]="true"></app-avatar-upload>
            <div>
              <div style="font-weight:600;font-size:15px">{{ auth.getUserName() }}</div>
              <div style="font-size:13px;color:var(--text-2);margin-top:2px">Photo par 📷 icon click karke change karein</div>
            </div>
          </div>

          <div class="form-group">
            <label>Specialization</label>
            <input type="text" [(ngModel)]="editSpec" class="form-control" />
          </div>
          <div class="form-group">
            <label>Experience (years)</label>
            <input type="number" [(ngModel)]="editExp" class="form-control" />
          </div>
          <div class="form-group">
            <label>Consultation Fee (₹)</label>
            <input type="number" [(ngModel)]="editFee" class="form-control" />
          </div>
          <div class="form-group">
            <label>Bio</label>
            <textarea [(ngModel)]="editBio" class="form-control" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>Education</label>
            <input type="text" [(ngModel)]="editQual" class="form-control" />
          </div>
          <div class="form-group">
            <label>Languages</label>
            <input type="text" [(ngModel)]="editLangs" class="form-control" placeholder="Hindi, English" />
          </div>

          <h4 style="margin:16px 0 10px">📍 Location (Clinic GPS)</h4>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
            <div class="form-group" style="margin:0">
              <label>Latitude</label>
              <input type="number" step="0.0001" [(ngModel)]="locLat" class="form-control" style="width:160px" />
            </div>
            <div class="form-group" style="margin:0">
              <label>Longitude</label>
              <input type="number" step="0.0001" [(ngModel)]="locLng" class="form-control" style="width:160px" />
            </div>
            <button class="btn btn-outline btn-sm" (click)="detectLocation()" [disabled]="locLoading">
              🎯 Auto Detect
            </button>
            <button class="btn btn-primary btn-sm" (click)="updateLocation()" [disabled]="locLoading">
              {{ locLoading ? 'Updating…' : '📍 Save Location' }}
            </button>
          </div>
          @if (locStatus) { <p class="text-sm" style="color:var(--primary);margin-top:6px">{{ locStatus }}</p> }

          <div style="display:flex;gap:10px;margin-top:20px">
            <button class="btn btn-primary" (click)="saveProfile()" [disabled]="savingProfile">
              @if (savingProfile) { <span class="spinner spinner-sm"></span> } @else { Save changes }
            </button>
            <button class="btn btn-ghost" (click)="activeTab='overview'">Cancel</button>
          </div>
        </div>
      }

      <!-- ── MY QR TAB ── -->
      @if (activeTab === 'qr') {
        <div class="card">
          <div style="margin-bottom:20px">
            <h3 style="margin:0">📲 My Booking QR Code</h3>
            <p style="margin:6px 0 0;color:var(--text-2);font-size:13px">
              Is QR ko print karke reception par lagao — patient scan karke bina login appointment book kar payega
            </p>
          </div>
          @if (qrLoading) {
            <div class="loading-wrap"><div class="spinner spinner-lg"></div></div>
          } @else if (myQrUrl) {
            <div style="display:flex;gap:32px;flex-wrap:wrap;align-items:flex-start">
              <div style="text-align:center">
                <img [src]="myQrUrl" alt="My Booking QR"
                  style="width:220px;height:220px;border:1px solid var(--border);border-radius:10px;display:block">
                <button class="btn btn-outline btn-sm" style="margin-top:10px;width:220px" onclick="window.print()">
                  🖨️ Print QR
                </button>
              </div>
              <div style="flex:1;min-width:220px">
                <div style="font-weight:600;margin-bottom:12px">Patient kaise book karega?</div>
                <div class="qr-step"><span class="qr-num">1</span> Patient camera se QR scan kare</div>
                <div class="qr-step"><span class="qr-num">2</span> Booking page khulega (no login)</div>
                <div class="qr-step"><span class="qr-num">3</span> Name, phone, slot select kare</div>
                <div class="qr-step"><span class="qr-num">4</span> Online payment kare</div>
                <div class="qr-step"><span class="qr-num">5</span> Token number mile — reception par dikhaye</div>
                @if (myQrLink) {
                  <div style="margin-top:16px;padding:12px;background:var(--surface-2);border-radius:8px;border:1px solid var(--border)">
                    <div style="font-size:11px;color:var(--text-2);margin-bottom:4px">Direct booking link:</div>
                    <a [href]="myQrLink" target="_blank" style="font-size:12px;color:var(--primary);word-break:break-all">{{ myQrLink }}</a>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- ── BANK KYC TAB ── -->
      @if (activeTab === 'bank') {
        <div class="card">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:20px">
            <div>
              <h3 style="margin:0">🏦 Bank Account & KYC</h3>
              <p style="margin:4px 0 0;color:var(--text-2);font-size:13px">
                Apna bank account connect karo — payments automatically aapke account mein transfer honge
              </p>
            </div>
            @if (kycDetails) {
              <span class="badge" [class]="kycBadgeClass(kycDetails.kycStatus)">
                {{ kycStatusLabel(kycDetails.kycStatus) }}
              </span>
            }
          </div>

          <!-- KYC ACTIVATED state -->
          @if (kycDetails?.kycStatus === 'ACTIVATED') {
            <div class="kyc-success-banner">
              <span style="font-size:28px">✅</span>
              <div>
                <div style="font-weight:600;font-size:15px">Bank Account Verified!</div>
                <div style="font-size:13px;margin-top:2px">
                  {{ kycDetails.accountHolderName }} &nbsp;·&nbsp;
                  {{ kycDetails.maskedAccountNumber }} &nbsp;·&nbsp;
                  {{ kycDetails.ifscCode }}
                </div>
                <div style="font-size:12px;color:#3B6D11;margin-top:4px">
                  Ab har payment mein aapka hissa automatically aapke account mein transfer hoga
                </div>
              </div>
            </div>
            <button class="btn btn-ghost btn-sm" style="margin-top:12px"
              (click)="kycDetails=null">Bank details update karo</button>
          }

          <!-- ERROR state — sirf tab dikhao jab koi real error ho -->
          @if (kycDetails?.kycStatus === 'NEEDS_CLARIFICATION' || kycDetails?.kycStatus === 'REJECTED') {
            <div class="kyc-error-banner" style="margin-bottom:16px">
              <span style="font-size:22px">⚠️</span>
              <div style="flex:1">
                <div style="font-weight:600">Bank details verify nahi ho saki</div>
                @if (kycDetails.kycMessage) {
                  <div style="font-size:12px;margin-top:4px">{{ kycDetails.kycMessage }}</div>
                }
                <div style="font-size:12px;margin-top:4px;color:var(--text-2)">
                  Account number aur IFSC check karke dobara submit karein
                </div>
              </div>
            </div>
          }

          <!-- FORM — show when not activated -->
          @if (kycDetails?.kycStatus !== 'ACTIVATED') {
            <div style="margin-top:20px">
              <h4 style="margin-bottom:14px">
                {{ kycDetails ? 'Bank Details Update Karo' : 'Bank Account Details Bharo' }}
              </h4>

              <div class="form-row-2">
                <div class="form-group">
                  <label>Account Holder Name <span class="req">*</span></label>
                  <input type="text" [(ngModel)]="bankForm.accountHolderName" class="form-control"
                    placeholder="Jaise bank mein registered hai" />
                </div>
                <div class="form-group">
                  <label>Bank Name <span class="req">*</span></label>
                  <input type="text" [(ngModel)]="bankForm.bankName" class="form-control"
                    placeholder="e.g. State Bank of India" />
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label>Account Number <span class="req">*</span></label>
                  <input type="text" [(ngModel)]="bankForm.accountNumber" class="form-control"
                    placeholder="Bank account number" />
                </div>
                <div class="form-group">
                  <label>IFSC Code <span class="req">*</span></label>
                  <input type="text" [(ngModel)]="bankForm.ifscCode" class="form-control"
                    placeholder="e.g. SBIN0001234" style="text-transform:uppercase"
                    (input)="bankForm.ifscCode = bankForm.ifscCode.toUpperCase()" />
                </div>
              </div>

              <div class="form-row-2">
                <div class="form-group">
                  <label>Branch Name <span class="opt">(optional)</span></label>
                  <input type="text" [(ngModel)]="bankForm.branchName" class="form-control"
                    placeholder="e.g. Connaught Place Branch" />
                </div>
                <div class="form-group">
                  <label>UPI ID <span class="opt">(optional)</span></label>
                  <input type="text" [(ngModel)]="bankForm.upiId" class="form-control"
                    placeholder="e.g. doctor&#64;upi" />
                </div>
              </div>

              <div class="kyc-note">
                ℹ️ Sirf bank account details chahiye — PAN ya address ki zaroorat nahi hai.
                Razorpay penny-drop se automatically verify hoga.
              </div>

              <div style="display:flex;gap:10px;margin-top:16px">
                <button class="btn btn-primary" (click)="submitBankDetails()" [disabled]="kycLoading">
                  @if (kycLoading) { <span class="spinner spinner-sm"></span> Submitting… }
                  @else { Submit Bank Details }
                </button>

              </div>
            </div>
          }

        </div>
      }

      <!-- ── BED MANAGEMENT ── -->
      @if (activeTab === 'beds') {
        <div class="card" style="margin-bottom:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
            <div>
              <h3 style="margin:0">🛏️ Bed Management</h3>
              <p style="margin:4px 0 0;color:var(--text-2);font-size:13px">
                Admit, discharge aur bed occupancy track karo
              </p>
            </div>
            @if (myClinics.length > 1) {
              <select class="form-control" style="max-width:240px" [(ngModel)]="selectedClinicId"
                (ngModelChange)="onClinicChange()">
                @for (c of myClinics; track c.id) {
                  <option [value]="c.id">{{ c.name }}</option>
                }
              </select>
            }
          </div>
        </div>

        @if (bedsLoading) {
          <div class="loading-wrap"><div class="spinner spinner-lg"></div><p>Loading beds…</p></div>
        }

        @if (!bedsLoading && !myClinics.length) {
          <div class="card">
            <h4 style="margin:0 0 4px">🏥 Add Your Clinic First</h4>
            <p style="margin:0 0 14px;color:var(--text-2);font-size:13px">
              Beds ek clinic se judi hoti hain — pehle apni clinic add karo.
            </p>
            <div class="form-row-2">
              <div class="form-group">
                <label>Clinic Name *</label>
                <input type="text" [(ngModel)]="newClinic.name" class="form-control" placeholder="e.g. Sharma Nursing Home" />
              </div>
              <div class="form-group">
                <label>Address *</label>
                <input type="text" [(ngModel)]="newClinic.address" class="form-control" />
              </div>
            </div>
            <div class="form-row-2">
              <div class="form-group">
                <label>City</label>
                <input type="text" [(ngModel)]="newClinic.city" class="form-control" />
              </div>
              <div class="form-group">
                <label>Pincode</label>
                <input type="text" [(ngModel)]="newClinic.pincode" class="form-control" />
              </div>
            </div>
            <button class="btn btn-primary btn-sm" (click)="addClinic()"
              [disabled]="addingClinic || !newClinic.name || !newClinic.address">
              @if (addingClinic) { <span class="spinner spinner-sm"></span> } @else { + Add Clinic }
            </button>
          </div>
        }

        @if (!bedsLoading && myClinics.length > 0) {

          <!-- Stats cards -->
          @if (bedStats) {
            <div class="bed-stats-grid">
              <div class="bed-stat-card">
                <div class="bed-stat-num">{{ bedStats.totalBeds }}</div>
                <div class="bed-stat-label">Total Beds</div>
              </div>
              <div class="bed-stat-card occupied">
                <div class="bed-stat-num">{{ bedStats.occupiedCount }}</div>
                <div class="bed-stat-label">Occupied</div>
              </div>
              <div class="bed-stat-card available">
                <div class="bed-stat-num">{{ bedStats.availableCount }}</div>
                <div class="bed-stat-label">Available</div>
              </div>
              <div class="bed-stat-card leaving">
                <div class="bed-stat-num">{{ bedStats.leavingSoonCount }}</div>
                <div class="bed-stat-label">Leaving Soon</div>
              </div>
              <div class="bed-stat-card reserved">
                <div class="bed-stat-num">{{ bedStats.reservedCount }}</div>
                <div class="bed-stat-label">Reserved</div>
              </div>
              <div class="bed-stat-card maintenance">
                <div class="bed-stat-num">{{ bedStats.maintenanceCount }}</div>
                <div class="bed-stat-label">Maintenance</div>
              </div>
            </div>
            <div class="card" style="margin-bottom:16px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
                <span style="font-size:13px;color:var(--text-2)">Fill rate</span>
                <span style="font-weight:600">{{ bedStats.fillPercentage }}%</span>
              </div>
              <div class="fill-bar-track">
                <div class="fill-bar-fill" [style.width.%]="bedStats.fillPercentage"></div>
              </div>
            </div>
          }

          <!-- Add bed -->
          <div class="card" style="margin-bottom:16px">
            <h4 style="margin:0 0 12px">+ Add New Bed</h4>
            <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end">
              <div class="form-group" style="margin:0">
                <label>Bed Number *</label>
                <input type="text" [(ngModel)]="newBed.bedNumber" class="form-control" style="width:140px" placeholder="e.g. B-101" />
              </div>
              <div class="form-group" style="margin:0">
                <label>Ward</label>
                <input type="text" [(ngModel)]="newBed.ward" class="form-control" style="width:160px" placeholder="General Ward / ICU" />
              </div>
              <div class="form-group" style="margin:0">
                <label>Charge/Day (₹)</label>
                <input type="number" [(ngModel)]="newBed.chargePerDay" class="form-control" style="width:120px" />
              </div>
              <button class="btn btn-primary btn-sm" (click)="addBed()" [disabled]="addingBed || !newBed.bedNumber">
                @if (addingBed) { <span class="spinner spinner-sm"></span> } @else { + Add Bed }
              </button>
            </div>
          </div>

          <!-- Bed grid -->
          @if (!beds.length) {
            <div class="card" style="text-align:center;padding:30px">
              <div class="empty-icon">🛏️</div>
              <p style="margin-top:8px">Koi bed add nahi hui hai abhi is clinic mein.</p>
            </div>
          } @else {
            <div class="bed-grid">
              @for (bed of beds; track bed.id) {
                <div class="bed-card" [class]="'bed-' + bed.status.toLowerCase()">
                  <div class="bed-card-top">
                    <span class="bed-number">🛏️ {{ bed.bedNumber }}</span>
                    <span class="badge" [class]="bedStatusBadgeClass(bed.status)">{{ bedStatusLabel(bed.status) }}</span>
                  </div>
                  @if (bed.ward) { <div class="bed-ward">{{ bed.ward }}</div> }

                  @if (bed.status === 'OCCUPIED') {
                    <div class="bed-patient-info">
                      <div><strong>{{ bed.patientName }}</strong></div>
                      @if (bed.admittedAt) {
                        <div class="text-sm text-muted">Admitted: {{ bed.admittedAt | date:'d MMM, h:mm a' }}</div>
                      }
                      @if (bed.expectedDischargeDate) {
                        <div class="text-sm" [class.leaving-today]="isLeavingSoon(bed)">
                          Expected discharge: {{ bed.expectedDischargeDate | date:'d MMM' }}
                          @if (isLeavingSoon(bed)) { <span> — Leaving soon</span> }
                        </div>
                      } @else {
                        <div class="text-sm text-muted">No discharge date set</div>
                      }
                    </div>
                    <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
                      <button class="btn btn-outline btn-sm" (click)="openDischargeDateModal(bed)">📅 Set Discharge Date</button>
                      <button class="btn btn-danger btn-sm" (click)="dischargeBed(bed)" [disabled]="bedActionLoading === bed.id">
                        @if (bedActionLoading === bed.id) { <span class="spinner spinner-sm"></span> } @else { Discharge }
                      </button>
                    </div>
                  } @else if (bed.status === 'AVAILABLE') {
                    <div class="text-sm text-muted" style="margin:8px 0">Ready to admit</div>
                    <button class="btn btn-primary btn-sm" (click)="openAdmitModal(bed)">+ Admit Patient</button>
                  } @else {
                    <div class="text-sm text-muted" style="margin:8px 0">{{ bedStatusLabel(bed.status) }}</div>
                  }

                  @if (bed.chargePerDay) {
                    <div class="text-sm text-muted" style="margin-top:8px">₹{{ bed.chargePerDay }}/day</div>
                  }
                </div>
              }
            </div>
          }
        }

        <!-- Admit modal -->
        @if (admitModalBed) {
          <div class="modal-overlay" (click)="admitModalBed = null">
            <div class="modal" (click)="$event.stopPropagation()">
              <h3 style="margin-bottom:14px">Admit Patient — Bed {{ admitModalBed.bedNumber }}</h3>
              <div class="form-group">
                <label>Patient Name *</label>
                <input type="text" [(ngModel)]="admitForm.patientName" class="form-control" placeholder="Full name" />
              </div>
              <div class="form-group">
                <label>Expected Discharge Date</label>
                <input type="date" [(ngModel)]="admitForm.expectedDischargeDate" class="form-control" />
              </div>
              <div style="display:flex;gap:10px;margin-top:16px">
                <button class="btn btn-primary" (click)="admitPatient()" [disabled]="!admitForm.patientName || admitLoading">
                  @if (admitLoading) { <span class="spinner spinner-sm"></span> } @else { Admit }
                </button>
                <button class="btn btn-ghost" (click)="admitModalBed = null">Cancel</button>
              </div>
            </div>
          </div>
        }

        <!-- Discharge date modal -->
        @if (dischargeDateModalBed) {
          <div class="modal-overlay" (click)="dischargeDateModalBed = null">
            <div class="modal" (click)="$event.stopPropagation()">
              <h3 style="margin-bottom:14px">Set Discharge Date — Bed {{ dischargeDateModalBed.bedNumber }}</h3>
              <div class="form-group">
                <label>Expected Discharge Date</label>
                <input type="date" [(ngModel)]="dischargeDateForm" class="form-control" />
              </div>
              <div style="display:flex;gap:10px;margin-top:16px">
                <button class="btn btn-primary" (click)="saveDischargeDate()" [disabled]="!dischargeDateForm || dischargeDateLoading">
                  @if (dischargeDateLoading) { <span class="spinner spinner-sm"></span> } @else { Save }
                </button>
                <button class="btn btn-ghost" (click)="dischargeDateModalBed = null">Cancel</button>
              </div>
            </div>
          </div>
        }
      }


      <ng-template #apptList let-appts="appts" let-loading="loading">
        @if (loading) {
          <div class="loading-wrap"><div class="spinner spinner-lg"></div></div>
        } @else if (appts?.length) {
          <div class="appt-list">
            @for (a of appts; track a.id) {
              <div class="appt-item" [class.appt-completed]="a.status==='COMPLETED'">
                <div class="avatar avatar-sm" [style.background]="avatarColor(a.patientName)">
                  {{ patientInitials(a) }}
                </div>
                <div class="appt-item-info">
                  <div class="appt-item-name">{{ a.patientName }}</div>
                  <div class="appt-item-meta">
                    📅 {{ apptDateTime(a) | date:'dd MMM, hh:mm a' }}
                    @if (a.clinicAddress) { · 📍 {{ a.clinicAddress }} }
                  </div>
                  <div class="appt-item-sub">
                    @if (a.patientDisease) { <span class="chip chip-blue">{{ a.patientDisease }}</span> }
                    @if (a.fee)            { <span class="chip chip-green">₹{{ a.fee }}</span> }
                    @if (a.paymentStatus === 'PAID') { <span class="chip chip-green">💳 Paid</span> }
                    @if (a.paymentStatus === 'PENDING') { <span class="chip chip-amber">💳 Pending</span> }
                  </div>
                  @if (a.diagnosis) {
                    <div class="text-sm" style="margin-top:4px;color:#1D9E75">Dx: {{ a.diagnosis }}</div>
                  }
                </div>
                <span class="badge" [class]="statusClass(a.status)">{{ a.status.replace('_',' ') }}</span>
                <div class="appt-item-actions">
                  @if (a.status === 'CONFIRMED' || a.status === 'PENDING') {
                    <button class="btn btn-sm" style="background:#1D9E75;color:#fff"
                      (click)="openUpdateModal(a)" [disabled]="actionId===a.id">Update</button>
                    <button class="btn btn-sm btn-outline"
                      (click)="markComplete(a.id)" [disabled]="actionId===a.id">
                      @if (actionId===a.id) { <span class="spinner spinner-sm"></span> } @else { ✓ Complete }
                    </button>
                  }
                  @if (a.status !== 'CANCELLED' && a.status !== 'COMPLETED') {
                    <button class="btn btn-danger btn-sm"
                      (click)="cancelAppt(a)" [disabled]="actionId===a.id">Cancel</button>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-icon">📅</div>
            <h3>No appointments</h3>
            <p>Nothing scheduled here</p>
          </div>
        }
      </ng-template>

      <!-- Doctor Update Appointment Modal -->
      @if (updateTarget) {
        <div class="modal-overlay" (click)="updateTarget=null">
          <div class="modal-box modal-wide" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="updateTarget=null">✕</button>
            <h3>Update Appointment — {{ updateTarget.patientName }}</h3>
            <div class="form-group">
              <label>Doctor Notes</label>
              <textarea [(ngModel)]="updateForm.doctorNotes" class="form-control" rows="3" placeholder="Clinical observations…"></textarea>
            </div>
            <div class="form-group">
              <label>Diagnosis</label>
              <textarea [(ngModel)]="updateForm.diagnosis" class="form-control" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label>Prescription</label>
              <textarea [(ngModel)]="updateForm.prescription" class="form-control" rows="3" placeholder="Medicine, dosage…"></textarea>
            </div>
            <div class="form-group">
              <label>Follow-up Instructions</label>
              <textarea [(ngModel)]="updateForm.followUpInstructions" class="form-control" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label>Follow-up Date</label>
              <input type="date" [(ngModel)]="updateForm.followUpDate" class="form-control" style="width:200px" />
            </div>
            <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
              <button class="btn btn-ghost" (click)="updateTarget=null">Cancel</button>
              <button class="btn btn-primary" (click)="submitUpdate()" [disabled]="actionId===updateTarget.id">
                @if (actionId===updateTarget.id) { <span class="spinner spinner-sm"></span> } @else { Save }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Cancel Modal -->
      @if (cancelTarget) {
        <div class="modal-overlay" (click)="cancelTarget=null">
          <div class="modal-box" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="cancelTarget=null">✕</button>
            <h3>Cancel appointment?</h3>
            <p style="margin:12px 0 16px">Patient: <strong>{{ cancelTarget.patientName }}</strong></p>
            <textarea class="form-control" [(ngModel)]="cancelReason" placeholder="Reason for cancellation…" rows="3"></textarea>
            <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
              <button class="btn btn-ghost" (click)="cancelTarget=null">Back</button>
              <button class="btn btn-danger" (click)="submitCancel()" [disabled]="actionId===cancelTarget.id">
                @if (actionId===cancelTarget.id) { <span class="spinner spinner-sm"></span> } @else { Confirm cancel }
              </button>
            </div>
          </div>
        </div>
      }
      } <!-- end @else approved -->
    </div>
  `,
  styles: [`
    .pending-wrap { display:flex; justify-content:center; align-items:center; min-height:70vh; padding:24px; }
    .pending-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius-lg); padding:48px 40px; max-width:480px; width:100%; text-align:center; box-shadow:var(--shadow-md); }
    .pending-card.rejected { border-color:#fed7d7; background:#fff5f5; }
    .pending-icon { font-size:56px; margin-bottom:20px; }
    .pending-card h2 { font-size:22px; font-weight:700; margin-bottom:12px; color:var(--text); }
    .pending-card p { color:var(--text-2); font-size:14px; line-height:1.7; margin-bottom:12px; }
    .pending-info { display:flex; justify-content:space-between; align-items:center; background:var(--surface-2); border-radius:var(--radius); padding:10px 16px; margin:10px 0; font-size:14px; }
    .pending-note { font-size:13px; color:var(--text-3); margin-top:20px; }
    .pending-note a { color:var(--primary); text-decoration:none; }
    .dash-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:24px; }
    .header-actions { display:flex; gap:8px; flex-wrap:wrap; }
    .tab-nav { display:flex; gap:4px; border-bottom:1px solid var(--border); margin-bottom:24px; flex-wrap:wrap; }
    .tab-btn { padding:10px 16px; font-size:14px; background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; color:var(--text-2); font-family:inherit; transition:all .15s; margin-bottom:-1px; }
    .tab-btn.active { color:var(--primary); border-bottom-color:var(--primary); font-weight:500; }
    .tab-btn:hover:not(.active) { color:var(--text); background:var(--surface-2); }
    .tab-toolbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:16px; }
    .mb-24 { margin-bottom:24px; } .mb-16 { margin-bottom:16px; }
    .section-title { font-size:16px; font-weight:600; margin-bottom:14px; }
    .stat-card.primary .stat-value { color:var(--primary); }
    .rev { font-size:20px !important; }
    .appt-list { display:flex; flex-direction:column; gap:10px; }
    .appt-item { display:flex; align-items:flex-start; gap:12px; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:14px; transition:box-shadow .15s; }
    .appt-item:hover { box-shadow:var(--shadow-sm); }
    .appt-completed { opacity:.75; }
    /* ── Bank KYC styles ── */
    .form-row-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    @media(max-width:600px){ .form-row-2 { grid-template-columns:1fr; } }
    .req { color:#e53e3e; margin-left:2px; }
    .opt { font-size:11px; color:var(--text-2); font-weight:400; }
    .kyc-success-banner { display:flex;align-items:flex-start;gap:14px;padding:16px;background:#EAF3DE;border:1px solid #C0DD97;border-radius:10px; }
    .kyc-info-banner    { display:flex;align-items:center;gap:14px;padding:14px 16px;background:#FFF8E7;border:1px solid #FAC775;border-radius:10px; }
    .kyc-error-banner   { display:flex;align-items:flex-start;gap:14px;padding:14px 16px;background:#FEE;border:1px solid #FCA5A5;border-radius:10px; }
    .kyc-note { font-size:12px;color:var(--text-2);background:var(--surface-2);padding:10px 14px;border-radius:8px;border:1px solid var(--border);margin-top:4px; }
    .kyc-dot { display:inline-block;width:8px;height:8px;border-radius:50%;margin-left:6px;vertical-align:middle; }
    .kyc-active  { background:#3B6D11; }
    .kyc-pending { background:#d97706; }
    .appt-item-info { flex:1; min-width:0; }
    .appt-item-name { font-weight:600; font-size:15px; }
    .appt-item-meta { font-size:13px; color:var(--text-2); margin-top:2px; }
    .appt-item-sub { display:flex; gap:5px; flex-wrap:wrap; margin-top:6px; }
    .appt-item-actions { display:flex; gap:6px; flex-wrap:wrap; align-items:flex-start; }
    .chip { font-size:11px; padding:2px 8px; border-radius:12px; background:var(--surface-2); color:var(--text-2); border:1px solid var(--border); }
    .chip-green { background:#EAF3DE; color:#3B6D11; border-color:#C0DD97; }
    .chip-blue  { background:#EBF4FF; color:#1A56DB; border-color:#BDD7F5; }
    .chip-amber { background:#FAEEDA; color:#854F0B; border-color:#FAC775; }
    .pagination { display:flex; align-items:center; justify-content:center; gap:16px; margin-top:28px; }
    .card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:20px; margin-bottom:20px; }
    .form-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:14px; margin-bottom:14px; }
    .vitals-form { background:var(--surface-2); border-radius:var(--radius); padding:14px; margin-bottom:14px; }
    .vitals-form h4 { font-size:13px; font-weight:600; color:var(--text-2); margin-bottom:10px; }
    .vitals-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
    .vital-chip { font-size:12px; padding:2px 8px; background:#EBF4FF; color:#1A56DB; border-radius:12px; border:1px solid #BDD7F5; }
    .unavail-list { display:flex; flex-direction:column; gap:8px; border-top:1px solid var(--border); padding-top:14px; margin-top:12px; }
    .unavail-item { display:flex; align-items:center; gap:12px; font-size:14px; }
    .unavail-item span:first-child { font-weight:500; min-width:100px; }
    .patient-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:12px; margin-bottom:20px; }
    .patient-card { display:flex; align-items:flex-start; gap:12px; background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:14px; cursor:pointer; transition:box-shadow .15s; }
    .patient-card:hover { box-shadow:var(--shadow-sm); border-color:var(--primary); }
    .patient-avatar { width:40px; height:40px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:16px; flex-shrink:0; }
    .patient-info { flex:1; min-width:0; }
    .patient-name { font-weight:600; font-size:14px; }
    .history-panel { background:var(--surface-2); border:1px solid var(--border); border-radius:var(--radius); padding:20px; margin-top:20px; }
    .record-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:14px; margin-bottom:10px; }
    .record-header { display:flex; align-items:center; gap:10px; margin-bottom:10px; flex-wrap:wrap; }
    .record-date { font-weight:600; font-size:14px; color:var(--primary); }
    .record-field { font-size:13px; color:var(--text); margin-bottom:6px; line-height:1.5; }
    .modal-wide { width:min(680px, 95vw); }
    .alert-success { background:#EAF3DE; color:#3B6D11; border:1px solid #C0DD97; border-radius:var(--radius); padding:10px 14px; font-size:14px; }
    .qr-step { display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px; }
    .qr-step:last-child { border:none; }
    .qr-num { width:22px;height:22px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0; }

    /* ── Bed Management ── */
    .bed-stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(110px,1fr)); gap:12px; margin-bottom:16px; }
    .bed-stat-card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius); padding:14px; text-align:center; }
    .bed-stat-num { font-size:24px; font-weight:700; color:var(--text); }
    .bed-stat-label { font-size:12px; color:var(--text-2); margin-top:2px; }
    .bed-stat-card.occupied .bed-stat-num { color:#B42318; }
    .bed-stat-card.available .bed-stat-num { color:#3B6D11; }
    .bed-stat-card.leaving .bed-stat-num { color:#B54708; }
    .bed-stat-card.reserved .bed-stat-num { color:#0A6A8B; }
    .bed-stat-card.maintenance .bed-stat-num { color:var(--text-2); }
    .fill-bar-track { height:10px; background:var(--surface-2); border-radius:6px; overflow:hidden; }
    .fill-bar-fill { height:100%; background:var(--primary); border-radius:6px; transition:width .3s; }
    .bed-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:14px; }
    .bed-card { background:var(--surface); border:1px solid var(--border); border-left:4px solid var(--border); border-radius:var(--radius); padding:14px; }
    .bed-card.bed-occupied { border-left-color:#B42318; }
    .bed-card.bed-available { border-left-color:#3B6D11; }
    .bed-card.bed-reserved { border-left-color:#0A6A8B; }
    .bed-card.bed-maintenance { border-left-color:var(--text-2); }
    .bed-card-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:6px; }
    .bed-number { font-weight:600; font-size:14px; }
    .bed-ward { font-size:12px; color:var(--text-2); margin-bottom:6px; }
    .bed-patient-info { font-size:13px; margin-top:6px; }
    .leaving-today { color:#B54708; font-weight:600; }
    .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.4); display:flex; align-items:center; justify-content:center; z-index:1000; padding:16px; }
    .modal { background:var(--surface); border-radius:var(--radius); padding:24px; width:min(420px, 95vw); box-shadow:0 10px 40px rgba(0,0,0,.2); }
  `]
})
export class DoctorDashboardComponent implements OnInit {
  auth               = inject(AuthService);
  private bookingSvc = inject(BookingService);
  private doctorSvc  = inject(DoctorService);
  private bankSvc    = inject(BankDetailsService);
  private bedSvc     = inject(BedService);
  private toast      = inject(ToastService);

  // ── Bed Management state ──
  myClinics: Clinic[] = [];
  selectedClinicId: number | null = null;
  newClinic: { name: string; address: string; city: string; pincode: string } = { name: '', address: '', city: '', pincode: '' };
  addingClinic = false;
  beds: BedResponse[] = [];
  bedStats: BedStatsResponse | null = null;
  bedsLoading = false;
  newBed: { bedNumber: string; ward: string; chargePerDay: number | null } = { bedNumber: '', ward: '', chargePerDay: null };
  addingBed = false;
  admitModalBed: BedResponse | null = null;
  admitForm: { patientName: string; expectedDischargeDate: string } = { patientName: '', expectedDischargeDate: '' };
  admitLoading = false;
  dischargeDateModalBed: BedResponse | null = null;
  dischargeDateForm = '';
  dischargeDateLoading = false;
  bedActionLoading: number | null = null;

  activeTab = 'overview';
  today = new Date().toISOString().slice(0, 10);
  selectedDate = this.today;

  stats: DoctorStats | null = null;
  statsLoading = true;

  todayAppts: Appointment[] = [];
  todayLoading = true;

  byDateAppts: Appointment[] = [];
  byDateLoading = false;

  allAppts: Appointment[] = [];
  allLoading = false;
  allPage = 0;
  allPageSize = 20;
  allHasMore = false;

  // Patient records
  patientSummaries: PatientSummary[] = [];
  patientsLoading = false;
  totalPatients = 0;
  patientSearch = '';
  recordDateFilter = '';
  selectedPatientHistory: PatientRecord[] = [];
  showCreateRecord = false;
  savingRecord = false;
  newRecord: Partial<CreateRecordRequest> = { visitDate: this.today, patientId: undefined };

  // Slot generation
  slotGen = { startDate: this.today, endDate: this.today, startTime: '09:00', endTime: '17:00', slotDurationMinutes: 30 };
  generatingSlots = false;
  slotsGenerated: number | null = null;
  unavailDates: any[] = [];
  newUnavailDate = ''; newUnavailReason = '';

  // Profile
  profile: DoctorProfile | null = null;
  togglingAvail = false; savingProfile = false;
  editSpec = ''; editExp: number | null = null;
  editFee: number | null = null; editBio = ''; editQual = ''; editLangs = '';
  locLoading = false; locStatus = '';
  locLat: number | null = null; locLng: number | null = null;

  // Modals
  actionId: number | null = null;
  cancelTarget: Appointment | null = null; cancelReason = '';
  updateTarget: Appointment | null = null;
  updateForm = { doctorNotes: '', diagnosis: '', prescription: '', followUpInstructions: '', followUpDate: '' };

  isPending  = false;
  isRejected = false;
  kycDetails: any = null;
  kycLoading = false;
  myQrUrl: string | null = null;
  myQrLink: string | null = null;
  qrLoading = false;
  bankForm: any = {
    accountHolderName: '', accountNumber: '', ifscCode: '',
    bankName: '', branchName: '', upiId: ''
  };

  ngOnInit() {
    // Check approval status before loading anything
    const user = this.auth.user();
    const status = (user as any)?.approvalStatus;
    if (status === 'PENDING' || status === 'PENDING_APPROVAL') {
      this.isPending = true;
      return; // don't load dashboard data for unapproved doctors
    }
    if (status === 'REJECTED') {
      this.isRejected = true;
      return;
    }
    this.loadStats(); this.loadToday(); this.loadProfile(); this.loadUnavailDates();
  }

  loadStats() {
    this.statsLoading = true;
    this.bookingSvc.getDoctorStats().subscribe({
      next: s => { this.stats = s.data || null; this.statsLoading = false; },
      error: () => this.statsLoading = false
    });
  }

  loadToday() {
    this.todayLoading = true;
    this.bookingSvc.getTodayAppointments().subscribe({
      next: a => {
        // PENDING_PAYMENT filter karo — sirf CONFIRMED/COMPLETED/CANCELLED dikhao
        this.todayAppts = (a.data || []).filter((ap: any) => ap.status !== 'PENDING_PAYMENT');
        this.todayLoading = false;
      },
      error: () => { this.todayAppts = []; this.todayLoading = false; }
    });
  }

  loadByDate() {
    if (!this.selectedDate) return;
    this.byDateLoading = true;
    this.bookingSvc.getAppointmentsByDate(this.selectedDate).subscribe({
      next: a => {
        this.byDateAppts = (a.data || []).filter((ap: any) => ap.status !== 'PENDING_PAYMENT');
        this.byDateLoading = false;
      },
      error: () => { this.byDateAppts = []; this.byDateLoading = false; }
    });
  }

  loadAll(p = 0) {
    // FIX: backend GET /api/bookings/appointments/doctor returns a flat
    // List<AppointmentResponse> (see BookingService.getDoctorAppointments —
    // it pages internally via PageRequest but never wraps the result in a
    // {content, totalPages} envelope). This was previously read as
    // res.data?.content / res.data?.totalPages, which are undefined on a
    // plain array — so "All Appointments" always rendered empty regardless
    // of actual data. Now reads res.data directly as the appointment array.
    // Since the backend doesn't report total pages, "Next" is enabled only
    // when a full page came back (a good signal there may be more).
    this.allLoading = true; this.allPage = p;
    this.bookingSvc.getDoctorAppointments(p, this.allPageSize).subscribe({
      next: res => {
        const list = res.data || [];
        this.allAppts = list.filter((ap: any) => ap.status !== 'PENDING_PAYMENT');
        this.allHasMore = list.length === this.allPageSize;
        this.allLoading = false;
      },
      error: () => { this.allAppts = []; this.allHasMore = false; this.allLoading = false; }
    });
  }

  // ── Patient Records ──────────────────────────────────────────

  loadPatients() {
    this.patientsLoading = true;
    // getPatientSummaries returns doctor appointments — we group by patient client-side
    this.bookingSvc.getPatientSummaries().subscribe({
      next: (r: any) => {
        const appts: any[] = r.data?.content || r.data || [];
        // Group by patientId, build summaries
        const map = new Map<number, any>();
        for (const a of appts) {
          if (!a.patientId) continue;
          const existing = map.get(a.patientId);
          if (!existing) {
            map.set(a.patientId, { patientId: a.patientId, patientName: a.patientName, patientPhone: a.patientPhone, totalVisits: 1, lastVisit: a.appointmentDate || '', lastDiagnosis: a.patientDisease });
          } else {
            existing.totalVisits++;
          }
        }
        this.patientSummaries = Array.from(map.values());
        this.totalPatients = this.patientSummaries.length;
        this.patientsLoading = false;
      },
      error: () => { this.patientSummaries = []; this.patientsLoading = false; }
    });
  }

  loadPatientsByDate() {
    if (!this.recordDateFilter) { this.loadPatients(); return; }
    this.patientsLoading = true;
    this.bookingSvc.getPatientsByDate(this.recordDateFilter).subscribe({
      next: r => {
        const records = r.data || [];
        // Convert to summaries
        this.patientSummaries = records.map(rec => ({
          patientId: rec.patientId, patientName: rec.patientName,
          patientPhone: rec.patientPhone, totalVisits: 1,
          lastVisit: rec.visitDate, lastDiagnosis: rec.diagnosis
        }));
        this.patientsLoading = false;
      },
      error: () => { this.patientsLoading = false; }
    });
  }

  loadPatientHistory(patientId: number) {
    this.bookingSvc.getPatientHistory(patientId).subscribe({
      next: r => { this.selectedPatientHistory = r.data || []; },
      error: () => this.toast.error('Could not load history')
    });
  }

  onPatientSearch() {
    if (!this.patientSearch.trim()) { this.loadPatients(); return; }
    this.bookingSvc.searchPatients(this.patientSearch).subscribe({
      next: r => {
        const records = r.data || [];
        this.patientSummaries = records.map(rec => ({
          patientId: rec.patientId, patientName: rec.patientName,
          patientPhone: rec.patientPhone, totalVisits: 1,
          lastVisit: rec.visitDate, lastDiagnosis: rec.diagnosis
        }));
      },
      error: () => {}
    });
  }

  saveRecord() {
    if (!this.newRecord.patientId || !this.newRecord.patientName || !this.newRecord.visitDate) {
      this.toast.error('Patient ID, Name, and Visit Date are required');
      return;
    }
    this.savingRecord = true;
    this.bookingSvc.createPatientRecord(this.newRecord as CreateRecordRequest).subscribe({
      next: r => {
        if (r.success) { this.toast.success('Record saved!'); this.showCreateRecord = false; this.newRecord = { visitDate: this.today, patientId: undefined }; this.loadPatients(); }
        this.savingRecord = false;
      },
      error: () => { this.toast.error('Failed to save record'); this.savingRecord = false; }
    });
  }

  editRecord(r: PatientRecord) {
    this.toast.info('Edit functionality — open update modal');
  }

  // ── Slots ────────────────────────────────────────────────────

  generateSlots() {
    this.generatingSlots = true; this.slotsGenerated = null;
    this.doctorSvc.generateSlots(this.slotGen).subscribe({
      next: r => {
        if (!r.success) {
          this.toast.error(r.message || 'Slot generation not available');
          this.generatingSlots = false;
          return;
        }
        this.slotsGenerated = r.data?.slotsCreated ?? 0;
        this.toast.success(`${this.slotsGenerated} slots created!`);
        this.generatingSlots = false;
      },
      error: () => { this.toast.error('Slot generation failed'); this.generatingSlots = false; }
    });
  }

  // ── Profile ──────────────────────────────────────────────────

  loadProfile() {
    this.doctorSvc.getMyProfile().subscribe({
      next: p => {
        const prof = p.data;
        if (!prof) return;
        this.profile = prof;
        this.editSpec = prof.specialization || '';
        this.editExp = prof.experienceYears ?? null;
        this.editFee = prof.consultationFee ?? null;
        this.editBio = prof.bio || '';
        this.editQual = prof.education || '';
        this.editLangs = prof.languages || '';
        this.locLat = prof.latitude ?? null;
        this.locLng = prof.longitude ?? null;
      }
    });
  }

  loadUnavailDates() {
    this.doctorSvc.getUnavailableDates().subscribe({
      next: d => { this.unavailDates = d.data || []; }
    });
  }

  toggleAvailability() {
    this.togglingAvail = true;
    this.doctorSvc.toggleAvailability().subscribe({
      next: r => { if (this.profile) this.profile.available = !this.profile.available; this.toast.success('Availability updated'); this.togglingAvail = false; },
      error: () => { this.toast.error('Update failed'); this.togglingAvail = false; }
    });
  }

  saveProfile() {
    this.savingProfile = true;
    this.doctorSvc.updateProfile({ specialization: this.editSpec, experienceYears: this.editExp ?? undefined, consultationFee: this.editFee ?? undefined, bio: this.editBio, education: this.editQual, languages: this.editLangs }).subscribe({
      next: r => { if (r.data) this.profile = r.data; this.toast.success('Profile saved!'); this.savingProfile = false; this.activeTab = 'overview'; },
      error: () => { this.toast.error('Save failed'); this.savingProfile = false; }
    });
  }

  detectLocation() {
    if (!navigator.geolocation) {
      this.toast.error('Browser geolocation support nahi karta');
      return;
    }
    this.locLoading = true;
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.locLat = Math.round(pos.coords.latitude  * 10000) / 10000;
        this.locLng = Math.round(pos.coords.longitude * 10000) / 10000;
        this.locStatus = `Location detected: ${this.locLat}, ${this.locLng} — Save karne ke liye "Save Location" click karein`;
        this.locLoading = false;
      },
      err => {
        this.toast.error('Location detect nahi ho saki — manually enter karein');
        this.locLoading = false;
      }
    );
  }

  updateLocation() {
    if (!this.locLat || !this.locLng) { this.toast.error('Enter valid coordinates'); return; }
    this.locLoading = true;
    this.doctorSvc.updateLocation({ latitude: this.locLat!, longitude: this.locLng! }).subscribe({
      next: () => { this.locStatus = `Location updated: ${this.locLat}, ${this.locLng}`; this.locLoading = false; },
      error: () => { this.toast.error('Location update failed'); this.locLoading = false; }
    });
  }

  addUnavail() {
    if (!this.newUnavailDate) return;
    this.doctorSvc.markUnavailable(this.newUnavailDate).subscribe({
      next: r => { if (r.success) { this.toast.success('Date marked unavailable'); this.loadUnavailDates(); this.newUnavailDate = ''; this.newUnavailReason = ''; } },
      error: () => this.toast.error('Failed to mark date')
    });
  }

  removeUnavail(id: number) {
    this.doctorSvc.removeUnavailable(id).subscribe({
      next: r => { if (r.success) { this.toast.success('Date removed'); this.loadUnavailDates(); } },
      error: () => this.toast.error('Remove failed')
    });
  }

  // ── Appointment actions ───────────────────────────────────────

  openUpdateModal(a: Appointment) {
    this.updateTarget = a;
    this.updateForm = { doctorNotes: a.doctorNotes || '', diagnosis: a.diagnosis || '', prescription: a.prescription || '', followUpInstructions: a.followUpInstructions || '', followUpDate: a.followUpDate?.slice(0, 10) || '' };
  }

  submitUpdate() {
    if (!this.updateTarget) return;
    this.actionId = this.updateTarget.id;
    this.bookingSvc.doctorUpdateAppointment(this.updateTarget.id, this.updateForm).subscribe({
      next: r => { if (r.success) { this.toast.success('Appointment updated'); this.loadToday(); this.loadStats(); } this.actionId = null; this.updateTarget = null; },
      error: () => { this.toast.error('Update failed'); this.actionId = null; }
    });
  }

  markComplete(id: number) {
    this.actionId = id;
    this.bookingSvc.completeAppointment(id).subscribe({
      next: r => { if (r.success) this.toast.success('Marked as completed'); this.actionId = null; this.loadToday(); this.loadStats(); },
      error: () => { this.toast.error('Update failed'); this.actionId = null; }
    });
  }

  cancelAppt(a: Appointment) { this.cancelTarget = a; this.cancelReason = ''; }

  submitCancel() {
    if (!this.cancelTarget) return;
    this.actionId = this.cancelTarget.id;
    this.bookingSvc.cancelAppointment(this.cancelTarget.id, this.cancelReason || 'Cancelled by doctor').subscribe({
      next: r => { if (r.success) this.toast.success('Appointment cancelled'); this.actionId = null; this.cancelTarget = null; this.loadToday(); },
      error: () => { this.toast.error('Cancellation failed'); this.actionId = null; }
    });
  }

  statusClass(s: string): string {
    return ({ CONFIRMED: 'badge-green', PENDING_PAYMENT: 'badge-amber', CANCELLED: 'badge-red', COMPLETED: 'badge-gray', NO_SHOW: 'badge-red' } as any)[s] || 'badge-gray';
  }

  avatarColor(name: string): string {
    const colors = ['#1D9E75', '#0A6A8B', '#7B4EA6', '#C05621', '#2B6CB0'];
    return colors[(name || '').charCodeAt(0) % colors.length];
  }

  patientInitials(a: Appointment): string {
    return (a.patientName || 'PT').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  // Backend appointmentDate + startTime alag-alag bhejta hai (koi combined
  // "appointmentTime" field nahi hai) — display ke liye combine karo. Isse
  // pehle template seedha a.appointmentTime padhta tha jo backend kabhi
  // bhejta hi nahi, isliye date/time hamesha blank dikhta tha.
  apptDateTime(a: any): Date | null {
    if (!a?.appointmentDate) return null;
    return new Date(`${a.appointmentDate}T${a.startTime || '00:00'}`);
  }

  loadMyQr() {
    if (this.myQrUrl) return;
    if (!this.profile?.id) {
      this.qrLoading = true;
      this.doctorSvc.getMyProfile().subscribe({
        next: p => { this.profile = p.data; this.fetchQr(); },
        error: () => { this.qrLoading = false; }
      });
    } else {
      this.fetchQr();
    }
  }

  private fetchQr() {
    if (!this.profile?.id) return;
    const docId = this.profile.id;
    this.myQrUrl  = `${environment.apiUrl}/public/doctors/${docId}/qrcode`;
    this.myQrLink = `${window.location.origin}/book?doctorId=${docId}`;
    this.qrLoading = false;
  }

  kycBadgeClass(status: string): string {
    return ({
      ACTIVATED:           'badge-green',
      PENDING:             'badge-amber',
      NEEDS_CLARIFICATION: 'badge-amber',
      REJECTED:            'badge-red',
      NOT_STARTED:         'badge-gray',
    } as any)[status] || 'badge-gray';
  }

  kycStatusLabel(status: string): string {
    return ({
      ACTIVATED:           '✅ Verified & Active',
      PENDING:             '⏳ Verification Pending',
      NEEDS_CLARIFICATION: '⚠️ Action Required',
      REJECTED:            '❌ Rejected',
      NOT_STARTED:         'Not Started',
    } as any)[status] || status;
  }

  loadBankDetails() {
    this.kycLoading = true;
    this.bankSvc.getMyBankDetails().subscribe({
      next: r => {
        this.kycDetails = r.data;
        // Pre-fill form with existing submitted details
        if (r.data) {
          this.bankForm.accountHolderName = r.data.accountHolderName || '';
          this.bankForm.ifscCode          = r.data.ifscCode           || '';
          this.bankForm.bankName          = r.data.bankName           || '';
          this.bankForm.upiId             = r.data.upiId              || '';
          // accountNumber is masked from backend (e.g. ••••1234) — keep blank for security
          // doctor can re-enter only if they want to update
        }
        this.kycLoading = false;
      },
      error: () => { this.kycDetails = null; this.kycLoading = false; }
    });
  }

  submitBankDetails() {
    if (!this.bankForm.accountHolderName || !this.bankForm.accountNumber ||
        !this.bankForm.ifscCode || !this.bankForm.bankName) {
      this.toast.error('Account holder name, account number, IFSC aur bank name required hain');
      return;
    }
    this.kycLoading = true;
    this.bankSvc.submitBankDetails(this.bankForm).subscribe({
      next: r => {
        // BUG FIX: pehle yahan kycStatus hamesha 'ACTIVATED' hardcode ho jaata tha
        // (asli backend/Razorpay status ko ignore karke) — isliye screen par turant
        // "Activated" dikhta tha chahe Razorpay ne actually NEEDS_CLARIFICATION/PENDING
        // hi return kiya ho. Ab jo bhi asli status backend se aaya hai wahi dikhao.
        const merged = {
          ...(r.data || {}),
          accountHolderName: this.bankForm.accountHolderName,
          ifscCode:          this.bankForm.ifscCode,
          bankName:          this.bankForm.bankName,
          upiId:             this.bankForm.upiId || r.data?.upiId,
          // maskedAccountNumber — last 4 digits dikhao
          maskedAccountNumber: '••••' + this.bankForm.accountNumber.slice(-4),
        };
        this.kycDetails = merged;
        if (r.data?.kycStatus === 'ACTIVATED') {
          this.toast.success('✅ Bank account verified! Payments ab automatically aapke account mein aayenge.');
        } else {
          this.toast.info('Bank details submit ho gaye. Status: ' + (r.data?.kycStatus || 'PENDING') + ' — Razorpay review kar raha hai.');
          // Razorpay ka penny-drop verification submit ke exact response ke andar
          // turant complete nahi hota (thoda async hai) — isliye doctor ko manually
          // "Refresh" dabana padta tha. Ab background me khud hi kuch baar chup-chaap
          // retry karte hain taaki status ACTIVATED hote hi automatically dikh jaaye,
          // bina doctor ke kuch kiye.
          this.autoPollKycStatus();
        }
        this.kycLoading = false;
      },
      error: (e: any) => {
        this.toast.error(e?.error?.message || 'Submission failed — dobara try karein');
        this.kycLoading = false;
      }
    });
  }

  // Bank details submit hone ke baad Razorpay ka penny-drop verification thoda
  // async hai — submit ke response me turant "ACTIVATED" nahi aa sakta. Isliye
  // background me chup-chaap kuch baar (har 4 second pe, max 5 baar = ~20 second)
  // refresh-status try karte hain. ACTIVATED milte hi turant ruk jaate hain —
  // doctor ko manually "Refresh" button dabaane ki zaroorat nahi padti.
  private autoPollKycStatus(attempt: number = 1): void {
    const MAX_ATTEMPTS = 5;
    if (attempt > MAX_ATTEMPTS) return;

    setTimeout(() => {
      this.bankSvc.refreshKycStatus().subscribe({
        next: r => {
          if (r.data) {
            this.kycDetails = { ...this.kycDetails, ...r.data };
          }
          if (r.data?.kycStatus === 'ACTIVATED') {
            this.toast.success('✅ KYC Activated! Payments ab automatically aapke account mein aayenge.');
            return; // mil gaya — polling band
          }
          this.autoPollKycStatus(attempt + 1);
        },
        error: () => this.autoPollKycStatus(attempt + 1) // silent retry — user ko error nahi dikhate background poll me
      });
    }, 4000);
  }

  refreshKyc() {
    this.kycLoading = true;
    this.bankSvc.refreshKycStatus().subscribe({
      next: r => {
        this.kycDetails = r.data;
        if (r.data?.kycStatus === 'ACTIVATED') {
          this.toast.success('KYC Activated! Payments will now auto-split to your account.');
        } else {
          this.toast.success('Status: ' + r.data?.kycStatus);
        }
        this.kycLoading = false;
      },
      error: () => { this.toast.error('Refresh failed'); this.kycLoading = false; }
    });
  }

  // ══════════════════ BED MANAGEMENT ══════════════════

  openBedsTab() {
    if (this.myClinics.length) { this.loadBedsAndStats(); return; }
    this.bedsLoading = true;
    this.doctorSvc.getMyClinics().subscribe({
      next: r => {
        this.myClinics = r.data || [];
        if (this.myClinics.length) {
          this.selectedClinicId = this.myClinics[0].id!;
          this.loadBedsAndStats();
        } else {
          this.bedsLoading = false;
        }
      },
      error: () => { this.bedsLoading = false; this.toast.error('Clinics load nahi ho payi'); }
    });
  }

  onClinicChange() {
    this.loadBedsAndStats();
  }

  addClinic() {
    if (!this.newClinic.name || !this.newClinic.address) return;
    this.addingClinic = true;
    this.doctorSvc.addClinic({
      name: this.newClinic.name,
      address: this.newClinic.address,
      city: this.newClinic.city || undefined,
      pincode: this.newClinic.pincode || undefined
    }).subscribe({
      next: r => {
        this.toast.success('Clinic add ho gayi');
        this.addingClinic = false;
        this.newClinic = { name: '', address: '', city: '', pincode: '' };
        if (r.data) {
          this.myClinics = [...this.myClinics, r.data];
          this.selectedClinicId = r.data.id!;
          this.loadBedsAndStats();
        } else {
          this.openBedsTab();
        }
      },
      error: () => { this.toast.error('Clinic add nahi ho payi'); this.addingClinic = false; }
    });
  }

  loadBedsAndStats() {
    if (!this.selectedClinicId) return;
    this.bedsLoading = true;
    this.bedSvc.getClinicBeds(this.selectedClinicId).subscribe({
      next: r => { this.beds = r.data || []; this.bedsLoading = false; },
      error: () => { this.bedsLoading = false; this.toast.error('Beds load nahi ho payi'); }
    });
    this.bedSvc.getBedStats(this.selectedClinicId).subscribe({
      next: r => { this.bedStats = r.data || null; },
      error: () => { /* non-fatal — grid still shows without stats */ }
    });
  }

  addBed() {
    if (!this.selectedClinicId || !this.newBed.bedNumber) return;
    this.addingBed = true;
    this.bedSvc.addBed({
      clinicId: this.selectedClinicId,
      bedNumber: this.newBed.bedNumber,
      ward: this.newBed.ward || undefined,
      chargePerDay: this.newBed.chargePerDay || undefined
    }).subscribe({
      next: () => {
        this.toast.success('Bed add ho gaya');
        this.newBed = { bedNumber: '', ward: '', chargePerDay: null };
        this.addingBed = false;
        this.loadBedsAndStats();
      },
      error: () => { this.toast.error('Bed add nahi ho payi'); this.addingBed = false; }
    });
  }

  openAdmitModal(bed: BedResponse) {
    this.admitModalBed = bed;
    this.admitForm = { patientName: '', expectedDischargeDate: '' };
  }

  admitPatient() {
    if (!this.admitModalBed || !this.admitForm.patientName) return;
    this.admitLoading = true;
    this.bedSvc.admitPatient(this.admitModalBed.id, {
      patientName: this.admitForm.patientName,
      expectedDischargeDate: this.admitForm.expectedDischargeDate || undefined
    }).subscribe({
      next: () => {
        this.toast.success('Patient admit ho gaya');
        this.admitModalBed = null;
        this.admitLoading = false;
        this.loadBedsAndStats();
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Admit nahi ho paya');
        this.admitLoading = false;
      }
    });
  }

  openDischargeDateModal(bed: BedResponse) {
    this.dischargeDateModalBed = bed;
    this.dischargeDateForm = bed.expectedDischargeDate || '';
  }

  saveDischargeDate() {
    if (!this.dischargeDateModalBed || !this.dischargeDateForm) return;
    this.dischargeDateLoading = true;
    this.bedSvc.updateExpectedDischarge(this.dischargeDateModalBed.id, {
      expectedDischargeDate: this.dischargeDateForm
    }).subscribe({
      next: () => {
        this.toast.success('Discharge date update ho gayi');
        this.dischargeDateModalBed = null;
        this.dischargeDateLoading = false;
        this.loadBedsAndStats();
      },
      error: () => { this.toast.error('Update nahi ho paya'); this.dischargeDateLoading = false; }
    });
  }

  dischargeBed(bed: BedResponse) {
    this.bedActionLoading = bed.id;
    this.bedSvc.dischargePatient(bed.id).subscribe({
      next: () => {
        this.toast.success('Patient discharge ho gaya');
        this.bedActionLoading = null;
        this.loadBedsAndStats();
      },
      error: () => { this.toast.error('Discharge nahi ho paya'); this.bedActionLoading = null; }
    });
  }

  isLeavingSoon(bed: BedResponse): boolean {
    if (!bed.expectedDischargeDate) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const expected = new Date(bed.expectedDischargeDate); expected.setHours(0,0,0,0);
    return expected.getTime() === today.getTime() || expected.getTime() === tomorrow.getTime();
  }

  bedStatusLabel(status: string): string {
    return { AVAILABLE: 'Available', OCCUPIED: 'Occupied', RESERVED: 'Reserved', MAINTENANCE: 'Maintenance' }[status] || status;
  }

  bedStatusBadgeClass(status: string): string {
    return { AVAILABLE: 'badge-green', OCCUPIED: 'badge-red', RESERVED: 'badge-blue', MAINTENANCE: 'badge-gray' }[status] || 'badge-gray';
  }

}