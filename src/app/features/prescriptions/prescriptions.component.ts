import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PrescriptionService } from '../../core/services/prescription.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { PrescriptionResponse, PrescriptionRequest } from '../../core/models';

@Component({
  selector: 'app-prescriptions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>💊 Prescriptions</h2>
        <p>View and manage patient prescriptions</p>
      </div>

      <div class="tab-nav">
        <button class="tab-btn" [class.active]="tab==='list'" (click)="tab='list'">My Prescriptions</button>
        @if (auth.isDoctor()) {
          <button class="tab-btn" [class.active]="tab==='create'" (click)="tab='create'">+ New Prescription</button>
        }
      </div>

      @if (tab === 'list') {
        <div class="tab-toolbar">
          <div class="form-group" style="margin:0;display:flex;gap:10px;align-items:center">
            <label style="white-space:nowrap;font-size:13px">Patient ID:</label>
            <input class="form-control" style="width:120px" type="number" [(ngModel)]="searchPatientId" placeholder="Patient ID">
            <button class="btn btn-primary btn-sm" (click)="loadPrescriptions()">Search</button>
          </div>
          <button class="btn btn-ghost btn-sm" (click)="loadPrescriptions()">↻ Refresh</button>
        </div>

        @if (loading) {
          <div class="loading-wrap"><div class="spinner spinner-lg"></div><p>Loading prescriptions…</p></div>
        } @else if (prescriptions.length) {
          <div class="presc-grid">
            @for (p of prescriptions; track p.id) {
              <div class="card presc-card">
                <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
                  <div>
                    <span style="font-weight:600;font-size:15px">Rx #{{ p.id }}</span>
                    <span class="text-sm text-muted" style="margin-left:10px">Patient #{{ p.patientId }}</span>
                  </div>
                  <span class="badge" [class]="p.followUpDone ? 'badge-green' : 'badge-amber'">
                    {{ p.followUpDone ? 'Follow-up done' : 'Pending follow-up' }}
                  </span>
                </div>
                <div class="presc-body">
                  <div class="presc-section">
                    <div class="presc-label">💊 Medicines</div>
                    <div class="presc-value">{{ p.medicines }}</div>
                  </div>
                  @if (p.instructions) {
                    <div class="presc-section">
                      <div class="presc-label">📋 Instructions</div>
                      <div class="presc-value">{{ p.instructions }}</div>
                    </div>
                  }
                  @if (p.followUpDate) {
                    <div class="presc-section">
                      <div class="presc-label">📅 Follow-up date</div>
                      <div class="presc-value">{{ p.followUpDate | date:'mediumDate' }}</div>
                    </div>
                  }
                  <div class="presc-meta">
                    <span>Doctor #{{ p.doctorId }}</span>
                    @if (p.createdAt) { <span>{{ p.createdAt | date:'medium' }}</span> }
                  </div>
                </div>
                @if (auth.isDoctor() && !p.followUpDone && p.followUpDate) {
                  <div style="padding:0 16px 16px">
                    <button class="btn btn-outline btn-sm btn-block" (click)="markFollowUp(p)"
                      [disabled]="actionId===p.id">
                      @if (actionId===p.id) { <span class="spinner spinner-sm"></span> } @else { ✓ Mark follow-up done }
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-icon">💊</div>
            <h3>No prescriptions found</h3>
            <p>Enter a patient ID above to search prescriptions</p>
          </div>
        }
      }

      @if (tab === 'create' && auth.isDoctor()) {
        <div class="form-card">
          <h3 style="margin-bottom:20px">Create New Prescription</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Patient ID *</label>
              <input class="form-control" type="number" [(ngModel)]="form.patientId" placeholder="Patient ID">
            </div>
            <div class="form-group">
              <label>Appointment ID (optional)</label>
              <input class="form-control" type="number" [(ngModel)]="form.appointmentId" placeholder="Appointment ID">
            </div>
          </div>
          <div class="form-group">
            <label>Medicines *</label>
            <textarea class="form-control" [(ngModel)]="form.medicines" rows="4"
              placeholder="e.g. Tab Paracetamol 500mg 1-0-1 x 5 days&#10;Syp Amoxicillin 125mg 5ml TDS x 7 days"></textarea>
          </div>
          <div class="form-group">
            <label>Instructions</label>
            <textarea class="form-control" [(ngModel)]="form.instructions" rows="3"
              placeholder="Take medicines after meals, drink plenty of water…"></textarea>
          </div>
          <div class="form-group">
            <label>Follow-up date</label>
            <input class="form-control" type="date" [(ngModel)]="form.followUpDate">
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:8px">
            <button class="btn btn-ghost" (click)="resetForm()">Clear</button>
            <button class="btn btn-primary" (click)="submit()" [disabled]="saving || !form.patientId || !form.medicines">
              @if (saving) { <span class="spinner spinner-sm"></span> Saving… } @else { 💊 Create Prescription }
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .presc-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(360px,1fr)); gap:16px; }
    .presc-card { padding:0; overflow:hidden; }
    .card-header { padding:14px 16px; border-bottom:1px solid var(--border); }
    .presc-body { padding:16px; display:flex; flex-direction:column; gap:12px; }
    .presc-section { display:flex; flex-direction:column; gap:4px; }
    .presc-label { font-size:12px; font-weight:600; color:var(--text-2); text-transform:uppercase; letter-spacing:.5px; }
    .presc-value { font-size:14px; color:var(--text); white-space:pre-line; }
    .presc-meta { display:flex; gap:12px; font-size:12px; color:var(--text-2); padding-top:8px; border-top:1px solid var(--border); flex-wrap:wrap; }
    .form-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:24px; max-width:600px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .tab-toolbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:16px; }
    .tab-nav { display:flex; gap:4px; border-bottom:1px solid var(--border); margin-bottom:20px; }
    .tab-btn { padding:10px 16px; font-size:14px; background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; color:var(--text-2); font-family:inherit; margin-bottom:-1px; &.active { color:var(--primary); border-bottom-color:var(--primary); font-weight:500; } }
  `]
})
export class PrescriptionsComponent implements OnInit {
  private svc   = inject(PrescriptionService);
  auth          = inject(AuthService);
  private toast = inject(ToastService);

  tab = 'list';
  loading = false;
  saving = false;
  actionId: number | null = null;
  searchPatientId: number | null = null;
  prescriptions: PrescriptionResponse[] = [];

  form: PrescriptionRequest = { patientId: 0, medicines: '', instructions: '', followUpDate: '' };

  ngOnInit() {
    const uid = this.auth.getUserId();
    if (uid) { this.searchPatientId = uid; this.loadPrescriptions(); }
  }

  loadPrescriptions() {
    if (!this.searchPatientId) return;
    this.loading = true;
    this.svc.getPatientPrescriptions(this.searchPatientId).subscribe({
      next: r => { this.prescriptions = r.data || []; this.loading = false; },
      error: () => { this.prescriptions = []; this.loading = false; }
    });
  }

  markFollowUp(p: PrescriptionResponse) {
    this.actionId = p.id;
    this.svc.markFollowUpDone(p.id).subscribe({
      next: () => { this.toast.success('Follow-up marked as done'); this.actionId = null; this.loadPrescriptions(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.actionId = null; }
    });
  }

  submit() {
    if (!this.form.patientId || !this.form.medicines) return;
    this.saving = true;
    this.svc.create(this.form).subscribe({
      next: () => { this.toast.success('Prescription created!'); this.saving = false; this.tab = 'list'; this.resetForm(); this.loadPrescriptions(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed to create'); this.saving = false; }
    });
  }

  resetForm() { this.form = { patientId: 0, medicines: '', instructions: '', followUpDate: '' }; }
}
