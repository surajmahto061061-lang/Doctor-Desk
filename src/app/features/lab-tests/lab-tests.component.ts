import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LabTestService } from '../../core/services/lab-test.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LabTestResponse, LabTestRequest } from '../../core/models';

@Component({
  selector: 'app-lab-tests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>🧪 Lab Tests</h2>
        <p>Order and manage laboratory investigations</p>
      </div>

      <div class="tab-nav">
        <button class="tab-btn" [class.active]="tab==='list'" (click)="tab='list'">Test Results</button>
        @if (auth.isDoctor()) {
          <button class="tab-btn" [class.active]="tab==='order'" (click)="tab='order'">+ Order Test</button>
        }
      </div>

      @if (tab === 'list') {
        <div class="tab-toolbar">
          <div style="display:flex;gap:10px;align-items:center">
            <label style="font-size:13px;white-space:nowrap">Patient ID:</label>
            <input class="form-control" style="width:120px" type="number" [(ngModel)]="searchPatientId" placeholder="Patient ID">
            <button class="btn btn-primary btn-sm" (click)="loadTests()">Search</button>
          </div>
          <div style="display:flex;gap:8px">
            <select class="form-control" style="width:auto" [(ngModel)]="statusFilter" (change)="applyFilter()">
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        @if (loading) {
          <div class="loading-wrap"><div class="spinner spinner-lg"></div><p>Loading tests…</p></div>
        } @else if (filtered.length) {
          <div class="tests-list">
            @for (t of filtered; track t.id) {
              <div class="test-card card">
                <div class="test-header">
                  <div>
                    <div class="test-name">{{ t.testName }}</div>
                    @if (t.testType) { <div class="text-sm text-muted">{{ t.testType }}</div> }
                  </div>
                  <span class="badge" [class]="statusBadge(t.status)">{{ t.status.replace('_',' ') }}</span>
                </div>
                @if (t.notes) {
                  <div class="test-detail"><span class="detail-label">Notes:</span> {{ t.notes }}</div>
                }
                @if (t.resultText) {
                  <div class="test-result">
                    <div class="detail-label">📊 Result:</div>
                    <div class="result-text">{{ t.resultText }}</div>
                  </div>
                }
                <div class="test-footer">
                  <span>Ordered: {{ t.orderedAt | date:'mediumDate' }}</span>
                  @if (t.completedAt) { <span>Completed: {{ t.completedAt | date:'mediumDate' }}</span> }
                </div>
                @if (auth.isDoctor()) {
                  <div class="test-actions">
                    @if (t.status !== 'COMPLETED') {
                      <select class="form-control" style="width:auto;font-size:13px"
                        [(ngModel)]="statusUpdates[t.id]">
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                      <button class="btn btn-outline btn-sm" (click)="updateStatus(t)"
                        [disabled]="actionId===t.id">Update status</button>
                    }
                    @if (!t.resultText) {
                      <button class="btn btn-primary btn-sm" (click)="openResult(t)"
                        [disabled]="actionId===t.id">+ Add result</button>
                    }
                  </div>
                }
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-icon">🧪</div>
            <h3>No lab tests found</h3>
            <p>Enter a patient ID and search, or order a new test</p>
          </div>
        }
      }

      @if (tab === 'order' && auth.isDoctor()) {
        <div class="form-card">
          <h3 style="margin-bottom:20px">Order Lab Test</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Patient ID *</label>
              <input class="form-control" type="number" [(ngModel)]="orderForm.patientId" placeholder="Patient ID">
            </div>
            <div class="form-group">
              <label>Clinic ID</label>
              <input class="form-control" type="number" [(ngModel)]="orderForm.clinicId" placeholder="Clinic ID (optional)">
            </div>
          </div>
          <div class="form-group">
            <label>Test Name *</label>
            <input class="form-control" [(ngModel)]="orderForm.testName" placeholder="e.g. Complete Blood Count, HbA1c, Urine Culture…">
          </div>
          <div class="form-group">
            <label>Test Type</label>
            <select class="form-control" [(ngModel)]="orderForm.testType">
              <option value="">Select type</option>
              <option value="BLOOD">Blood</option>
              <option value="URINE">Urine</option>
              <option value="STOOL">Stool</option>
              <option value="IMAGING">Imaging</option>
              <option value="BIOPSY">Biopsy</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div class="form-group">
            <label>Notes</label>
            <textarea class="form-control" [(ngModel)]="orderForm.notes" rows="3" placeholder="Special instructions…"></textarea>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn btn-ghost" (click)="resetOrder()">Clear</button>
            <button class="btn btn-primary" (click)="submitOrder()" [disabled]="saving || !orderForm.patientId || !orderForm.testName">
              @if (saving) { <span class="spinner spinner-sm"></span> } @else { 🧪 Order Test }
            </button>
          </div>
        </div>
      }
    </div>

    @if (resultTarget) {
      <div class="modal-overlay" (click)="resultTarget=null">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="resultTarget=null">✕</button>
          <h3>Add Test Result</h3>
          <p style="margin-bottom:16px">Test: <strong>{{ resultTarget.testName }}</strong></p>
          <div class="form-group">
            <label>Result</label>
            <textarea class="form-control" [(ngModel)]="resultText" rows="4" placeholder="Enter test results…"></textarea>
          </div>
          <div class="form-group">
            <label>Result file URL (optional)</label>
            <input class="form-control" [(ngModel)]="resultFileUrl" placeholder="https://…">
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
            <button class="btn btn-ghost" (click)="resultTarget=null">Cancel</button>
            <button class="btn btn-primary" (click)="submitResult()" [disabled]="!resultText || actionId===resultTarget.id">
              Save Result
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tab-nav { display:flex; gap:4px; border-bottom:1px solid var(--border); margin-bottom:20px; }
    .tab-btn { padding:10px 16px; font-size:14px; background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; color:var(--text-2); font-family:inherit; margin-bottom:-1px; &.active { color:var(--primary); border-bottom-color:var(--primary); font-weight:500; } }
    .tab-toolbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:16px; }
    .tests-list { display:flex; flex-direction:column; gap:12px; }
    .test-card { padding:16px; }
    .test-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; }
    .test-name { font-weight:600; font-size:15px; }
    .test-detail { font-size:13px; color:var(--text-2); margin-bottom:6px; }
    .detail-label { font-weight:600; color:var(--text); }
    .test-result { background:var(--surface-2,#f8f9fa); border-radius:8px; padding:10px 12px; margin:8px 0; }
    .result-text { font-size:14px; white-space:pre-line; margin-top:4px; }
    .test-footer { display:flex; gap:16px; font-size:12px; color:var(--text-2); border-top:1px solid var(--border); padding-top:10px; margin-top:10px; }
    .test-actions { display:flex; gap:8px; align-items:center; margin-top:10px; flex-wrap:wrap; }
    .form-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:24px; max-width:600px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  `]
})
export class LabTestsComponent implements OnInit {
  private svc   = inject(LabTestService);
  auth          = inject(AuthService);
  private toast = inject(ToastService);

  tab = 'list';
  loading = false;
  saving = false;
  actionId: number | null = null;
  searchPatientId: number | null = null;
  statusFilter = '';
  tests: LabTestResponse[] = [];
  filtered: LabTestResponse[] = [];
  statusUpdates: Record<number, string> = {};

  orderForm: LabTestRequest = { patientId: 0, testName: '', testType: '', notes: '' };
  resultTarget: LabTestResponse | null = null;
  resultText = '';
  resultFileUrl = '';

  ngOnInit() {
    const uid = this.auth.getUserId();
    if (uid) { this.searchPatientId = uid; this.loadTests(); }
  }

  loadTests() {
    if (!this.searchPatientId) return;
    this.loading = true;
    this.svc.getPatientTests(this.searchPatientId).subscribe({
      next: r => {
        this.tests = r.data || [];
        this.tests.forEach(t => this.statusUpdates[t.id] = t.status);
        this.applyFilter();
        this.loading = false;
      },
      error: () => { this.tests = []; this.filtered = []; this.loading = false; }
    });
  }

  applyFilter() {
    this.filtered = this.statusFilter ? this.tests.filter(t => t.status === this.statusFilter) : [...this.tests];
  }

  updateStatus(t: LabTestResponse) {
    this.actionId = t.id;
    const newStatus = this.statusUpdates[t.id] || t.status;
    this.svc.updateStatus(t.id, newStatus).subscribe({
      next: () => { this.toast.success('Status updated'); this.actionId = null; this.loadTests(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.actionId = null; }
    });
  }

  openResult(t: LabTestResponse) { this.resultTarget = t; this.resultText = ''; this.resultFileUrl = ''; }

  submitResult() {
    if (!this.resultTarget || !this.resultText) return;
    this.actionId = this.resultTarget.id;
    this.svc.addResult(this.resultTarget.id, { resultText: this.resultText, resultFileUrl: this.resultFileUrl || undefined }).subscribe({
      next: () => { this.toast.success('Result added!'); this.actionId = null; this.resultTarget = null; this.loadTests(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.actionId = null; }
    });
  }

  submitOrder() {
    if (!this.orderForm.patientId || !this.orderForm.testName) return;
    this.saving = true;
    this.svc.orderTest(this.orderForm).subscribe({
      next: () => { this.toast.success('Lab test ordered!'); this.saving = false; this.tab = 'list'; this.resetOrder(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.saving = false; }
    });
  }

  resetOrder() { this.orderForm = { patientId: 0, testName: '', testType: '', notes: '' }; }

  statusBadge(s: string): string {
    return ({ PENDING: 'badge-amber', IN_PROGRESS: 'badge-blue', COMPLETED: 'badge-green' } as any)[s] || 'badge-gray';
  }
}
