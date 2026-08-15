import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin.service';
import { AdminDoctorEntry, AdminAmbulanceEntry } from '../../core/models';
import { AmbulanceService } from '../../core/services/ambulance.service';
import { NotificationService } from '../../core/services/notification.service';
import { ToastService } from '../../core/services/toast.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>⚙️ Admin Panel</h2>
        <p>Manage doctors, ambulances, and platform settings</p>
      </div>

      <!-- Tab nav -->
      <div class="tab-nav">
        <button class="tab-btn" [class.active]="tab==='doctors'"       (click)="tab='doctors'; loadDoctors()">Doctor approvals</button>
        <button class="tab-btn" [class.active]="tab==='ambulances'"    (click)="tab='ambulances'; loadAmbulances()">Ambulance drivers</button>
        <button class="tab-btn" [class.active]="tab==='notifications'" (click)="tab='notifications'; loadNotifStatus()">Notifications</button>
      </div>

      <!-- ── DOCTORS TAB ── -->
      @if (tab === 'doctors') {
        <div class="tab-toolbar">
          <div class="filter-row">
            <button class="filter-chip" [class.active]="statusFilter==='PENDING'"  (click)="statusFilter='PENDING';  loadDoctors()">Pending</button>
            <button class="filter-chip" [class.active]="statusFilter==='APPROVED'" (click)="statusFilter='APPROVED'; loadDoctors()">Approved</button>
            <button class="filter-chip" [class.active]="statusFilter==='REJECTED'" (click)="statusFilter='REJECTED'; loadDoctors()">Rejected</button>
            <button class="filter-chip" [class.active]="statusFilter===''"         (click)="statusFilter='';         loadDoctors()">All</button>
          </div>
          <button class="btn btn-ghost btn-sm" (click)="loadDoctors()">↻ Refresh</button>
        </div>

        @if (docLoading) {
          <div class="loading-wrap"><div class="spinner spinner-lg"></div><p>Loading doctors…</p></div>
        } @else if (doctors.length) {
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (d of doctors; track d.id) {
                  <tr>
                    <td>
                      <div style="font-weight:500">{{ d.name || '—' }}</div>
                      <div class="text-sm text-muted">{{ d.email || '—' }}</div>
                      <div class="text-sm text-muted">{{ d.phone || '' }}</div>
                    </td>
                    <td>
                      <div>{{ d.specialization || '—' }}</div>
                      @if (d.hospital) { <div class="text-sm text-muted">🏥 {{ d.hospital }}</div> }
                    </td>
                    <td>
                      <span class="badge" [class]="statusBadge(d.approvalStatus || 'PENDING')">{{ d.approvalStatus || 'PENDING' }}</span>
                      @if (d.rejectionReason) {
                        <div class="text-sm text-muted" style="margin-top:4px;color:#A32D2D">❌ {{ d.rejectionReason }}</div>
                      }
                    </td>
                    <td class="text-sm text-muted">{{ d.createdAt | date:'mediumDate' }}</td>
                    <td>
                      <div style="display:flex;gap:8px;flex-wrap:wrap">
                        @if (d.approvalStatus !== 'APPROVED') {
                          <button class="btn btn-sm" style="border:1px solid #1D9E75;color:#1D9E75;background:transparent"
                            (click)="approveDoctor(d)" [disabled]="actionId===d.id">
                            @if (actionId===d.id) { <span class="spinner spinner-sm"></span> } @else { ✓ Approve }
                          </button>
                        }
                        @if (d.approvalStatus !== 'REJECTED') {
                          <button class="btn btn-danger btn-sm" (click)="openRejectModal(d)" [disabled]="actionId===d.id">✗ Reject</button>
                        }
                        <button class="btn btn-ghost btn-sm" (click)="deleteDoctor(d)" [disabled]="actionId===d.id" title="Backend has no account-delete endpoint — this revokes approval instead">Revoke</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-icon">👨‍⚕️</div>
            <h3>No doctors found</h3>
            <p>No doctor registrations match this filter</p>
          </div>
        }
      }

      <!-- ── AMBULANCES TAB ── -->
      @if (tab === 'ambulances') {
        <div class="tab-toolbar">
          <h3 style="font-size:15px;font-weight:500">Registered ambulance drivers</h3>
          <div style="display:flex;gap:8px">
            <button class="btn btn-primary btn-sm" (click)="openRegisterAmb()">+ Register ambulance</button>
            <button class="btn btn-ghost btn-sm" (click)="loadAmbulances()">↻ Refresh</button>
          </div>
        </div>

        @if (ambLoading) {
          <div class="loading-wrap"><div class="spinner spinner-lg"></div><p>Loading ambulances…</p></div>
        } @else if (ambulances.length) {
          <div class="table-wrap">
            <table>
              <thead>
                <tr><th>Vehicle</th><th>Driver</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                @for (a of ambulances; track a.id) {
                  <tr>
                    <td>
                      <div style="font-weight:500">{{ a.vehicleNumber || '—' }}</div>
                      @if (a.vehicleType) { <div class="text-sm text-muted">{{ a.vehicleType }}</div> }
                    </td>
                    <td>{{ a.name || '—' }}</td>
                    <td><span class="badge" [class]="a.approvalStatus==='APPROVED'?'badge-green':'badge-gray'">{{ a.approvalStatus || 'REGISTERED' }}</span></td>
                    <td>
                      <div style="display:flex;gap:8px">
                        <!-- FIX: pass a.id (number) directly — no string conversion -->
                        <button class="btn btn-outline btn-sm" (click)="markAvailable(a.id)" disabled title="Backend gap: /api/ambulance/my/status only changes the JWT caller's own ambulance — there's no admin-targeted PATCH /api/ambulance/{id}/status yet. Needs a backend endpoint before this can work per-row.">Mark available</button>
                        <button class="btn btn-danger btn-sm"  (click)="deactivateAmb(a.id)" disabled title="Same backend gap — see tooltip on 'Mark available'.">Deactivate</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="empty-state"><div class="empty-icon">🚑</div><h3>No ambulances registered</h3></div>
        }
      }

      <!-- ── NOTIFICATIONS TAB ── -->
      @if (tab === 'notifications') {
        <div class="notif-section">
          @if (notifStatus) {
            <div class="card" style="max-width:480px;margin-bottom:20px">
              <div class="card-header"><h3>Service status</h3></div>
              <div class="status-row">
                <span>Mode</span>
                <span class="badge" [class]="notifStatus.mode==='live'?'badge-green':'badge-amber'">
                  {{ notifStatus.mode | titlecase }}
                </span>
              </div>
              <div class="status-row">
                <span>SMS</span>
                <span class="badge" [class]="notifStatus.smsEnabled?'badge-green':'badge-gray'">
                  {{ notifStatus.smsEnabled ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
              <div class="status-row">
                <span>Email</span>
                <span class="badge" [class]="notifStatus.emailEnabled?'badge-green':'badge-gray'">
                  {{ notifStatus.emailEnabled ? 'Enabled' : 'Disabled' }}
                </span>
              </div>
            </div>
          }

          <div class="card" style="max-width:480px">
            <div class="card-header"><h3>Test notification</h3></div>
            <div class="form-group">
              <label>Phone number</label>
              <input class="form-control" [(ngModel)]="testPhone" placeholder="+91 9876543210">
            </div>
            <button class="btn btn-primary" (click)="sendTestNotif()" [disabled]="!testPhone || testingNotif">
              @if (testingNotif) { <span class="spinner spinner-sm"></span> Sending… } @else { Send test SMS }
            </button>
          </div>
        </div>
      }
    </div>

    <!-- Reject modal -->
    @if (rejectTarget) {
      <div class="modal-overlay" (click)="rejectTarget=null">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="rejectTarget=null">✕</button>
          <h3>Reject doctor application</h3>
          <p style="margin:10px 0 16px">Rejecting <strong>{{ rejectTarget.name }}</strong>. Provide a reason.</p>
          <div class="form-group">
            <label>Rejection reason</label>
            <textarea class="form-control" [(ngModel)]="rejectReason"
              placeholder="e.g. Invalid license number, incomplete documents…" rows="3"></textarea>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
            <button class="btn btn-ghost" (click)="rejectTarget=null">Cancel</button>
            <button class="btn btn-danger" (click)="submitReject()" [disabled]="actionId===rejectTarget.id">
              Confirm rejection
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Register ambulance modal -->
    @if (showRegisterAmb) {
      <div class="modal-overlay" (click)="showRegisterAmb=false">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="showRegisterAmb=false">✕</button>
          <h3>Register new ambulance</h3>
          <p style="margin-bottom:20px">Add a new ambulance unit to the fleet</p>
          <div class="form-group">
            <label>Vehicle number</label>
            <input class="form-control" [(ngModel)]="newAmb.vehicleNumber" placeholder="BH-01-AMB-2024">
          </div>
          <div class="form-group">
            <label>Driver name</label>
            <input class="form-control" [(ngModel)]="newAmb.driverName" placeholder="Full name">
          </div>
          <div class="form-group">
            <label>Vehicle type</label>
            <select class="form-control" [(ngModel)]="newAmb.type">
              <option value="ALS">Advanced Life Support</option>
              <option value="BLS">Basic Life Support</option>
              <option value="PATIENT_TRANSPORT">Patient Transport</option>
            </select>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:20px">
            <button class="btn btn-ghost" (click)="showRegisterAmb=false">Cancel</button>
            <button class="btn btn-primary" (click)="registerAmbulance()" [disabled]="registeringAmb">
              @if (registeringAmb) { <span class="spinner spinner-sm"></span> } @else { Register }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tab-nav { display:flex; gap:4px; border-bottom:1px solid var(--border); margin-bottom:20px; flex-wrap:wrap; }
    .tab-btn {
      padding:10px 16px; font-size:14px; background:none; border:none;
      border-bottom:2px solid transparent; cursor:pointer; color:var(--text-2); font-family:inherit; margin-bottom:-1px;
      &.active { color:var(--primary); border-bottom-color:var(--primary); font-weight:500; }
      &:hover:not(.active) { background:var(--surface-2); color:var(--text); }
    }
    .tab-toolbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:16px; }
    .filter-row  { display:flex; gap:8px; flex-wrap:wrap; }
    .filter-chip {
      padding:5px 14px; border-radius:20px; border:1px solid var(--border); background:var(--surface);
      font-size:13px; cursor:pointer; transition:all .15s;
      &.active { border-color:var(--primary); background:var(--primary-light); color:var(--primary-dark); font-weight:500; }
      &:hover:not(.active) { border-color:var(--border-strong); }
    }
    .notif-section { display:flex; flex-direction:column; gap:20px; }
    .status-row {
      display:flex; align-items:center; justify-content:space-between;
      padding:10px 0; border-bottom:1px solid var(--border);
      font-size:14px; &:last-child { border:none; }
    }
  `]
})
export class AdminComponent implements OnInit {
  private adminSvc = inject(AdminService);
  private ambSvc   = inject(AmbulanceService);
  private notifSvc = inject(NotificationService);
  private toast    = inject(ToastService);

  tab = 'doctors';
  statusFilter: 'PENDING' | 'APPROVED' | 'REJECTED' | '' = 'PENDING';

  // Doctors
  doctors: AdminDoctorEntry[] = [];
  docLoading = false;
  // FIX: actionId is number | null — AdminDoctorEntry.id and AdminAmbulanceEntry.id are both number
  actionId: number | null = null;
  rejectTarget: AdminDoctorEntry | null = null;
  rejectReason = '';

  // Ambulances
  ambulances: AdminAmbulanceEntry[] = [];
  ambLoading = false;
  showRegisterAmb = false;
  registeringAmb = false;
  newAmb: { vehicleNumber: string; driverName: string; type: string } = { vehicleNumber: '', driverName: '', type: 'BLS' };

  // Notifications
  notifStatus: any = null;
  testPhone = '';
  testingNotif = false;

  ngOnInit() { this.loadDoctors(); }

  // ── Doctors ─────────────────────────────────────
  loadDoctors() {
    this.docLoading = true;
    this.adminSvc.getDoctors(this.statusFilter || undefined).subscribe({
      next: res => { this.doctors = res.data || []; this.docLoading = false; },
      error: ()  => { this.doctors = []; this.docLoading = false; }
    });
  }

  approveDoctor(d: AdminDoctorEntry) {
    // FIX: actionId is number — assign d.id directly (no string)
    this.actionId = d.id;
    this.adminSvc.updateDoctorApproval(d.id, { status: 'APPROVED' }).subscribe({
      next: () => { this.toast.success(`Dr. ${d.name} approved!`); this.actionId = null; this.loadDoctors(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Approval failed'); this.actionId = null; }
    });
  }

  openRejectModal(d: AdminDoctorEntry) { this.rejectTarget = d; this.rejectReason = ''; }

  submitReject() {
    if (!this.rejectTarget) return;
    this.actionId = this.rejectTarget.id;
    this.adminSvc.updateDoctorApproval(
      this.rejectTarget.id,
      { status: 'REJECTED', reason: this.rejectReason }
    ).subscribe({
      next: () => { this.toast.success('Doctor rejected'); this.actionId = null; this.rejectTarget = null; this.loadDoctors(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Rejection failed'); this.actionId = null; }
    });
  }

  // NOTE: backend has no DELETE /api/auth/admin/doctors/{userId} — AdminController only
  // exposes GET /doctors, PUT /doctors/{id}/approval and GET /ambulances. There is no way
  // to actually delete a user account today, so "Delete" is remapped to what the backend
  // can really do: revoke approval (same PUT .../approval endpoint, status=REJECTED),
  // which immediately blocks the doctor from receiving/managing appointments.
  deleteDoctor(d: AdminDoctorEntry) {
    if (!confirm(`Revoke Dr. ${d.name}'s approval? They will be blocked until re-approved. (Full account deletion isn't supported by the backend yet.)`)) return;
    this.actionId = d.id;
    this.adminSvc.updateDoctorApproval(d.id, { status: 'REJECTED', reason: 'Approval revoked by admin' }).subscribe({
      next: () => { this.toast.success('Doctor approval revoked'); this.actionId = null; this.loadDoctors(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Revoke failed'); this.actionId = null; }
    });
  }

  // ── Ambulances ─────────────────────────────────
  loadAmbulances() {
    this.ambLoading = true;
    this.adminSvc.getAmbulanceDrivers().subscribe({
      next: res => { this.ambulances = res.data || []; this.ambLoading = false; },
      error: ()  => { this.ambulances = []; this.ambLoading = false; }
    });
  }

  // FIX: id is number — matches AdminAmbulanceEntry.id and AdminService method signatures
  markAvailable(id: number) {
    this.actionId = id;
    this.adminSvc.markAmbulanceAvailable(id).subscribe({
      next: () => { this.toast.success('Marked as available'); this.actionId = null; this.loadAmbulances(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.actionId = null; }
    });
  }

  // FIX: id is number — matches AdminAmbulanceEntry.id and AdminService method signatures
  deactivateAmb(id: number) {
    if (!confirm('Deactivate this ambulance?')) return;
    this.actionId = id;
    this.adminSvc.deactivateAmbulance(id).subscribe({
      next: () => { this.toast.success('Ambulance deactivated'); this.actionId = null; this.loadAmbulances(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.actionId = null; }
    });
  }

  openRegisterAmb() {
    this.newAmb = { vehicleNumber: '', driverName: '', type: 'BLS' };
    this.showRegisterAmb = true;
  }

  registerAmbulance() {
    this.registeringAmb = true;
    this.adminSvc.registerAmbulance(this.newAmb).subscribe({
      next: () => { this.toast.success('Ambulance registered!'); this.registeringAmb = false; this.showRegisterAmb = false; this.loadAmbulances(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Registration failed'); this.registeringAmb = false; }
    });
  }

  // ── Notifications ───────────────────────────────
  loadNotifStatus() {
    this.notifSvc.getStatus().subscribe({
      next: s  => { this.notifStatus = s; },
      error: () => { this.notifStatus = null; }
    });
  }

  sendTestNotif() {
    this.testingNotif = true;
    this.notifSvc.testNotification(this.testPhone).subscribe({
      next: () => { this.toast.success('Test notification sent!'); this.testingNotif = false; },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Send failed'); this.testingNotif = false; }
    });
  }

  statusBadge(s?: string): string {
    return ({ APPROVED: 'badge-green', PENDING: 'badge-amber', REJECTED: 'badge-red' } as any)[s || 'PENDING'] || 'badge-gray';
  }
}