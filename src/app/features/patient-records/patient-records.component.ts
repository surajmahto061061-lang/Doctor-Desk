import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PatientRecordService } from '../../core/services/patient-record.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { PatientRecordResponse, PatientRecordRequest } from '../../core/models';

@Component({
  selector: 'app-patient-records',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>📋 Patient Records</h2>
        <p>Clinical visit history and medical records</p>
      </div>

      <div class="tab-nav">
        <button class="tab-btn" [class.active]="tab==='list'" (click)="tab='list'">Records</button>
        @if (auth.isDoctor()) {
          <button class="tab-btn" [class.active]="tab==='add'" (click)="tab='add'">+ Add Record</button>
        }
      </div>

      @if (tab === 'list') {
        <div class="toolbar">
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
            <div style="display:flex;gap:8px;align-items:center">
              <label style="font-size:13px;white-space:nowrap">Patient ID:</label>
              <input class="form-control" style="width:120px" type="number" [(ngModel)]="searchId" placeholder="ID">
            </div>
            <select class="form-control" style="width:auto" [(ngModel)]="typeFilter">
              <option value="">All types</option>
              <option value="CONSULTATION">Consultation</option>
              <option value="FOLLOW_UP">Follow-up</option>
              <option value="PROCEDURE">Procedure</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
            <button class="btn btn-primary btn-sm" (click)="loadRecords()">Search</button>
          </div>
        </div>

        @if (loading) {
          <div class="loading-wrap"><div class="spinner spinner-lg"></div><p>Loading records…</p></div>
        } @else if (records.length) {
          <div class="records-list">
            @for (r of records; track r.id) {
              <div class="record-card card">
                <div class="record-top">
                  <div>
                    <div class="record-name">{{ r.patientName }}</div>
                    <div class="text-sm text-muted">
                      Visit: {{ r.visitDate | date:'mediumDate' }}
                      @if (r.patientAge) { · Age {{ r.patientAge }} }
                      @if (r.patientGender) { · {{ r.patientGender }} }
                    </div>
                  </div>
                  <div style="display:flex;gap:8px;align-items:center">
                    <span class="text-sm text-muted">#{{ r.id }}</span>
                    @if (auth.isDoctor()) {
                      <button class="btn btn-danger btn-sm" (click)="deleteRecord(r.id)"
                        [disabled]="actionId===r.id">🗑</button>
                    }
                  </div>
                </div>

                <div class="record-body">
                  @if (r.chiefComplaint) {
                    <div class="rec-field">
                      <span class="rec-label">Chief Complaint</span>
                      <span>{{ r.chiefComplaint }}</span>
                    </div>
                  }
                  @if (r.clinicalNotes) {
                    <div class="rec-field">
                      <span class="rec-label">Clinical Notes</span>
                      <span style="white-space:pre-line">{{ r.clinicalNotes }}</span>
                    </div>
                  }
                  @if (r.diagnosis) {
                    <div class="rec-field">
                      <span class="rec-label">Diagnosis</span>
                      <span style="font-weight:500;color:var(--primary)">{{ r.diagnosis }}</span>
                    </div>
                  }
                  @if (r.prescription) {
                    <div class="rec-field">
                      <span class="rec-label">Prescription</span>
                      <span style="white-space:pre-line">{{ r.prescription }}</span>
                    </div>
                  }
                  @if (r.labTests) {
                    <div class="rec-field">
                      <span class="rec-label">Lab Tests</span>
                      <span>{{ r.labTests }}</span>
                    </div>
                  }
                  @if (r.followUpDate) {
                    <div class="rec-field">
                      <span class="rec-label">Follow-up</span>
                      <span>{{ r.followUpDate | date:'mediumDate' }}</span>
                      @if (r.followUpInstructions) { <span class="text-muted"> — {{ r.followUpInstructions }}</span> }
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3>No records found</h3>
            <p>Enter a patient ID and click Search</p>
          </div>
        }
      }

      @if (tab === 'add' && auth.isDoctor()) {
        <div class="form-card">
          <h3 style="margin-bottom:20px">Add Patient Record</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Patient ID *</label>
              <input class="form-control" type="number" [(ngModel)]="form.patientId" placeholder="Patient ID">
            </div>
            <div class="form-group">
              <label>Patient Name *</label>
              <input class="form-control" [(ngModel)]="form.patientName" placeholder="Full name">
            </div>
            <div class="form-group">
              <label>Age</label>
              <input class="form-control" type="number" [(ngModel)]="form.patientAge" placeholder="Age">
            </div>
            <div class="form-group">
              <label>Gender</label>
              <select class="form-control" [(ngModel)]="form.patientGender">
                <option value="">Select</option>
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label>Visit Date</label>
              <input class="form-control" type="date" [(ngModel)]="form.visitDate">
            </div>
            <div class="form-group">
              <label>Phone</label>
              <input class="form-control" [(ngModel)]="form.patientPhone" placeholder="+91 9876543210">
            </div>
          </div>
          <div class="form-group">
            <label>Chief Complaint</label>
            <input class="form-control" [(ngModel)]="form.chiefComplaint" placeholder="Main reason for visit">
          </div>
          <div class="form-group">
            <label>Clinical Notes</label>
            <textarea class="form-control" [(ngModel)]="form.clinicalNotes" rows="3" placeholder="Examination findings, vitals, observations…"></textarea>
          </div>
          <div class="form-group">
            <label>Diagnosis</label>
            <input class="form-control" [(ngModel)]="form.diagnosis" placeholder="ICD diagnosis or clinical impression">
          </div>
          <div class="form-group">
            <label>Prescription / Treatment</label>
            <textarea class="form-control" [(ngModel)]="form.prescription" rows="3" placeholder="Medicines and dosage…"></textarea>
          </div>
          <div class="form-group">
            <label>Lab Tests Ordered</label>
            <input class="form-control" [(ngModel)]="form.labTests" placeholder="CBC, LFT, Chest X-ray…">
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>Follow-up Date</label>
              <input class="form-control" type="date" [(ngModel)]="form.followUpDate">
            </div>
            <div class="form-group">
              <label>Follow-up Instructions</label>
              <input class="form-control" [(ngModel)]="form.followUpInstructions" placeholder="Instructions for follow-up">
            </div>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
            <button class="btn btn-ghost" (click)="resetForm()">Clear</button>
            <button class="btn btn-primary" (click)="submit()" [disabled]="saving || !form.patientId || !form.patientName">
              @if (saving) { <span class="spinner spinner-sm"></span> } @else { 💾 Save Record }
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .tab-nav { display:flex; gap:4px; border-bottom:1px solid var(--border); margin-bottom:20px; }
    .tab-btn { padding:10px 16px; font-size:14px; background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; color:var(--text-2); font-family:inherit; margin-bottom:-1px; &.active { color:var(--primary); border-bottom-color:var(--primary); font-weight:500; } }
    .toolbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:16px; }
    .records-list { display:flex; flex-direction:column; gap:12px; }
    .record-card { padding:0; overflow:hidden; }
    .record-top { display:flex; justify-content:space-between; align-items:flex-start; padding:14px 16px; border-bottom:1px solid var(--border); }
    .record-name { font-weight:600; font-size:15px; }
    .record-body { padding:16px; display:flex; flex-direction:column; gap:10px; }
    .rec-field { display:flex; gap:12px; font-size:14px; flex-wrap:wrap; }
    .rec-label { font-weight:600; color:var(--text-2); min-width:130px; flex-shrink:0; }
    .form-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:24px; max-width:700px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  `]
})
export class PatientRecordsComponent implements OnInit {
  private svc   = inject(PatientRecordService);
  auth          = inject(AuthService);
  private toast = inject(ToastService);

  tab = 'list';
  loading = false;
  saving = false;
  actionId: number | null = null;
  searchId: number | null = null;
  typeFilter = '';
  records: PatientRecordResponse[] = [];
  form: PatientRecordRequest = { patientId: 0, patientName: '', visitDate: new Date().toISOString().split('T')[0] };

  ngOnInit() {
    const uid = this.auth.getUserId();
    if (uid && this.auth.isPatient()) { this.searchId = uid; this.loadRecords(); }
  }

  loadRecords() {
    if (!this.searchId) return;
    this.loading = true;
    const obs = this.typeFilter
      ? this.svc.getPatientHistoryByType(this.searchId, this.typeFilter)
      : this.svc.getPatientHistory(this.searchId);
    obs.subscribe({
      next: r => { this.records = r.data || []; this.loading = false; },
      error: () => { this.records = []; this.loading = false; }
    });
  }

  deleteRecord(id: number) {
    if (!confirm('Delete this record?')) return;
    this.actionId = id;
    this.svc.deleteRecord(id).subscribe({
      next: () => { this.toast.success('Record deleted'); this.actionId = null; this.loadRecords(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Delete failed'); this.actionId = null; }
    });
  }

  submit() {
    if (!this.form.patientId || !this.form.patientName) return;
    this.saving = true;
    this.svc.addRecord(this.form).subscribe({
      next: () => { this.toast.success('Record saved!'); this.saving = false; this.tab = 'list'; this.resetForm(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.saving = false; }
    });
  }

  resetForm() { this.form = { patientId: 0, patientName: '', visitDate: new Date().toISOString().split('T')[0] }; }
}
