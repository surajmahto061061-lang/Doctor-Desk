import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Appointment } from '../../../core/models';
import { AvatarUploadComponent } from 'src/app/shared/components/AvatarUploadComponent';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, AvatarUploadComponent],
  template: `
    <div class="page-container">
      <div class="page-header" style="display:flex;align-items:center;gap:14px">
        <app-avatar-upload [imageUrl]="auth.user()?.profileImageUrl" [name]="auth.getUserName()" size="lg" [editable]="true"></app-avatar-upload>
        <div>
          <h2>My appointments</h2>
          <p>Welcome back, {{ auth.user()?.name || auth.user()?.email }}</p>
        </div>
      </div>

      <div class="grid-4 mb-24">
        <div class="stat-card"><div class="stat-label">Total booked</div><div class="stat-value">{{ total }}</div></div>
        <div class="stat-card primary"><div class="stat-label">Upcoming</div><div class="stat-value">{{ upcoming }}</div></div>
        <div class="stat-card"><div class="stat-label">Completed</div><div class="stat-value">{{ completed }}</div></div>
        <div class="stat-card"><div class="stat-label">Cancelled</div><div class="stat-value">{{ cancelled }}</div></div>
      </div>

      <div class="action-bar mb-24">
        <h3>Appointments</h3>
        <a class="btn btn-primary btn-sm" routerLink="/doctors">+ Book new</a>
      </div>

      @if (loading) {
        <div class="loading-wrap"><div class="spinner spinner-lg"></div><p>Loading…</p></div>
      } @else if (appointments.length) {
        <div class="appt-list">
          @for (a of appointments; track a.id) {
            <div class="appt-item">
              <div class="avatar avatar-sm">{{ doctorInitials(a) }}</div>
              <div class="appt-item-info">
                <div class="appt-item-name">{{ a.doctorName || 'Doctor' }}</div>
                <div class="appt-item-meta">
                  📅 {{ apptDateTime(a) | date:'dd MMM yyyy, hh:mm a' }}
                </div>
                <div class="appt-item-sub">
                  @if (a.specialization) { <span class="chip">{{ a.specialization }}</span> }
                  @if (a.fee)            { <span class="chip chip-green">₹{{ a.fee }}</span> }
                  @if (a.patientDisease) { <span class="chip chip-blue">{{ a.patientDisease }}</span> }
                  @if (a.paymentStatus)  { <span class="chip" [class.chip-green]="a.paymentStatus==='PAID'" [class.chip-amber]="a.paymentStatus==='PENDING'">💳 {{ a.paymentStatus }}</span> }
                </div>
              </div>
              <span class="badge" [class]="statusClass(a.status)">{{ a.status.replace('_',' ') }}</span>
              <div class="appt-item-actions">
                @if (a.status === 'PENDING_PAYMENT') {
                  <button class="btn btn-primary btn-sm" (click)="payNow(a)" [disabled]="actionId===a.id">
                    @if (actionId===a.id) { <span class="spinner spinner-sm"></span> } @else { Pay now }
                  </button>
                }
                @if (a.status !== 'CANCELLED' && a.status !== 'COMPLETED') {
                  <button class="btn btn-danger btn-sm" (click)="cancelAppt(a)" [disabled]="actionId===a.id">Cancel</button>
                }
              </div>
            </div>
          }
        </div>
        @if (totalPages > 1) {
          <div class="pagination">
            <button class="btn btn-ghost btn-sm" [disabled]="page===0" (click)="load(page-1)">← Prev</button>
            <span class="text-sm text-muted">{{ page+1 }} / {{ totalPages }}</span>
            <button class="btn btn-ghost btn-sm" [disabled]="page>=totalPages-1" (click)="load(page+1)">Next →</button>
          </div>
        }
      } @else {
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <h3>No appointments yet</h3>
          <p>Book your first appointment with a doctor today</p>
          <a class="btn btn-primary" routerLink="/doctors">Find a doctor</a>
        </div>
      }

      <!-- Cancel modal -->
      @if (cancelTarget) {
        <div class="modal-overlay" (click)="cancelTarget=null">
          <div class="modal-box" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="cancelTarget=null">✕</button>
            <h3>Cancel appointment?</h3>
            <p style="margin:12px 0 16px">Provide a reason for cancellation.</p>
            <textarea class="form-control" [(ngModel)]="cancelReason" placeholder="Reason…" rows="3"></textarea>
            <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
              <button class="btn btn-ghost" (click)="cancelTarget=null">Keep it</button>
              <!-- FIX: removed ?. — cancelTarget is narrowed to non-null inside @if block -->
              <button class="btn btn-danger" (click)="submitCancel()" [disabled]="actionId===cancelTarget.id">
                @if (actionId===cancelTarget.id) { <span class="spinner spinner-sm"></span> } @else { Yes, cancel }
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .mb-24 { margin-bottom: 24px; }
    .action-bar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; }
    .appt-list { display:flex; flex-direction:column; gap:10px; }
    .appt-item-actions { display:flex; gap:8px; }
    .pagination { display:flex; align-items:center; justify-content:center; gap:16px; margin-top:28px; }
    .appt-item-sub { display:flex; gap:6px; flex-wrap:wrap; margin-top:4px; }
    .chip { font-size:11px; padding:2px 8px; border-radius:12px; background:var(--surface-2); color:var(--text-2); border:1px solid var(--border); }
    .chip-green { background:#EAF3DE; color:#3B6D11; border-color:#C0DD97; }
    .chip-blue  { background:#EBF4FF; color:#1A56DB; border-color:#BDD7F5; }
    .chip-amber { background:#FAEEDA; color:#854F0B; border-color:#FAC775; }

    @media (max-width: 640px) {
      /* Page header — avatar + name stack nicely */
      .page-header > div:first-child { display: flex; align-items: center; gap: 12px; flex: 1; }

      /* Stat cards — 2x2 grid */
      .grid-4 { grid-template-columns: repeat(2, 1fr) !important; gap: 10px; }

      /* Appointment item — full column layout */
      .appt-item {
        flex-direction: column !important;
        gap: 10px !important;
        padding: 12px !important;
        align-items: flex-start !important;
      }
      .appt-item-actions {
        width: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
      }
      .appt-item-actions .btn { flex: 1; justify-content: center; min-width: 100px; }

      /* Action bar — stack on small screens */
      .action-bar { flex-direction: column; align-items: stretch; }
      .action-bar h3 { margin-bottom: 4px; }
      .action-bar a { text-align: center; }

      /* Pagination compact */
      .pagination { gap: 10px; }
      .pagination .btn { padding: 7px 12px; font-size: 13px; }
    }
  `]
})
export class PatientDashboardComponent implements OnInit {
  auth               = inject(AuthService);
  private bookingSvc = inject(BookingService);
  private toast      = inject(ToastService);

  appointments: Appointment[] = [];
  loading = true;
  page = 0; totalPages = 0; totalElements = 0;

  // FIX: number | null — Appointment.id is number, null = idle (no string sentinel)
  actionId: number | null = null;
  cancelTarget: Appointment | null = null;
  cancelReason = '';

  get total()     { return this.totalElements || this.appointments.length; }
  get upcoming()  { return this.appointments.filter(a => a.status === 'CONFIRMED').length; }
  get completed() { return this.appointments.filter(a => a.status === 'COMPLETED').length; }
  get cancelled() { return this.appointments.filter(a => a.status === 'CANCELLED').length; }

  ngOnInit() { this.load(0); }

  load(p: number) {
    this.loading = true; this.page = p;
    this.bookingSvc.getMyAppointments(p).subscribe({
      next: res => {
        if (!res.success) { this.loading = false; return; }
        this.appointments  = res.data?.content || [];
        this.totalElements = res.data?.totalElements || 0;
        this.totalPages    = res.data?.totalPages || 1;
        this.loading = false;
      },
      error: () => { this.appointments = []; this.loading = false; }
    });
  }

  payNow(a: Appointment) {
    this.actionId = a.id;
    // First create Razorpay order then verify, or use confirm-payment for manual flow
    this.bookingSvc.confirmPayment(a.id).subscribe({
      next: res => {
        if (res.success) this.toast.success('Payment confirmed!');
        // FIX: reset to null not ''
        this.actionId = null;
        this.load(this.page);
      },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Payment failed'); this.actionId = null; }
    });
  }

  cancelAppt(a: Appointment) { this.cancelTarget = a; this.cancelReason = ''; }

  submitCancel() {
    if (!this.cancelTarget) return;
    this.actionId = this.cancelTarget.id;
    this.bookingSvc.cancelAppointment(this.cancelTarget.id).subscribe({
      next: res => {
        if (res.success) this.toast.success('Appointment cancelled');
        // FIX: reset to null not ''
        this.actionId = null; this.cancelTarget = null;
        this.load(this.page);
      },
      error: () => { this.toast.error('Cancellation failed'); this.actionId = null; }
    });
  }

  statusClass(s: string): string {
    return ({ CONFIRMED:'badge-green', PENDING_PAYMENT:'badge-amber', CANCELLED:'badge-red', COMPLETED:'badge-gray' } as any)[s] || 'badge-gray';
  }

  doctorInitials(a: Appointment): string {
    return (a.doctorName || 'DR').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  // Backend appointmentDate + startTime alag-alag bhejta hai (koi combined
  // "appointmentTime" field nahi hai) — display ke liye combine karo.
  apptDateTime(a: any): Date | null {
    if (!a?.appointmentDate) return null;
    return new Date(`${a.appointmentDate}T${a.startTime || '00:00'}`);
  }
}