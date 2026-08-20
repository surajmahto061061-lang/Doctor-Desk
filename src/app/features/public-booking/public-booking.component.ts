import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PublicBookingService } from '../../core/services/public-booking.service';
import { ToastService } from '../../core/services/toast.service';
import { SlotService } from '../../core/services/slot.service';
import { SlotResponse, GuestBookingVerifyRequest } from '../../core/models';
import { WhatsappConfirmModalComponent } from 'src/app/shared/components/whatsapp-confirm-modal/whatsapp-confirm-modal.component';


declare var Razorpay: any;

@Component({
  selector: 'app-public-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, WhatsappConfirmModalComponent],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>📅 Book Appointment (Guest)</h2>
        <p>Book a doctor appointment without signing in</p>
      </div>

      <div class="tab-nav">
        <button class="tab-btn" [class.active]="tab==='book'" (click)="tab='book'">Book Now</button>
        <button class="tab-btn" [class.active]="tab==='track'" (click)="tab='track'">Track Booking</button>
        <button class="tab-btn" [class.active]="tab==='qr'" (click)="tab='qr'">Doctor QR</button>
      </div>

      @if (tab === 'book') {
        <div class="booking-layout">
          <div class="form-card">
            <h3 style="margin-bottom:20px">Patient Details</h3>
            <div class="form-grid">
              <div class="form-group">
                <label>Patient Name *</label>
                <input class="form-control" [(ngModel)]="form.patientName" placeholder="Full name">
              </div>
              <div class="form-group">
                <label>Phone *</label>
                <input class="form-control" [(ngModel)]="form.patientPhone" placeholder="+91 9876543210">
              </div>
              <div class="form-group">
                <label>Age</label>
                <input class="form-control" type="number" [(ngModel)]="form.patientAge">
              </div>
              <div class="form-group">
                <label>Email</label>
                <input class="form-control" type="email" [(ngModel)]="form.patientEmail" placeholder="optional">
              </div>
            </div>
            <div class="form-group">
              <label>Notes / Symptoms</label>
              <textarea class="form-control" [(ngModel)]="form.notes" rows="2" placeholder="Describe your symptoms…"></textarea>
            </div>
          </div>

          <div class="form-card">
            <h3 style="margin-bottom:16px">Choose Doctor & Slot</h3>
            <div style="display:flex;gap:8px;margin-bottom:16px">
              @if (!doctorIdLockedFromQr) {
                <input class="form-control" type="number" [(ngModel)]="form.doctorId" placeholder="Doctor ID">
              } @else {
                <div class="alert alert-info" style="flex:1">✅ Doctor selected via QR (ID #{{ form.doctorId }})</div>
              }
              <input class="form-control" type="date" [(ngModel)]="slotDate" (change)="loadSlots()">
              <button class="btn btn-outline btn-sm" (click)="loadSlots()" [disabled]="!form.doctorId||!slotDate">Load Slots</button>
            </div>

            @if (slotsLoading) { <div class="loading-wrap"><div class="spinner spinner-lg"></div></div> }
            @else if (slots.length) {
              <div class="slots-grid">
                @for (s of slots; track s.time) {
                  <button class="slot-btn" [class.selected]="form.slotTime===s.time" [class.booked]="!s.available"
                    (click)="s.available && selectSlot(s)" [disabled]="!s.available">
                    {{ s.time }}
                    @if (!s.available) { <span style="font-size:10px;display:block">Booked</span> }
                  </button>
                }
              </div>
              @if (form.slotTime) {
                <div class="alert alert-info" style="margin-top:12px">
                  Selected: <strong>{{ form.slotTime }}</strong>
                </div>
              }
            }

            <button class="btn btn-primary btn-block" style="margin-top:20px"
              (click)="submit()" [disabled]="saving||!form.patientName||!form.patientPhone||!form.doctorId||!form.slotTime">
              @if (saving) { <span class="spinner spinner-sm"></span> Processing… } @else { 💳 Book & Pay }
            </button>
            <p style="font-size:12px;color:var(--text-2);margin-top:8px">
              Aapki booking sirf payment safal hone ke baad confirm hogi.
            </p>
          </div>
        </div>

        @if (paymentDone && confirmedAppt) {
          <div class="success-card card">
            <div class="success-icon">✅</div>
            <h3>Appointment Confirmed!</h3>
            <div class="booking-details">
              <div class="bd-row"><span>Token Number</span><strong style="font-size:22px;color:var(--primary)">#{{ confirmedAppt.tokenNumber }}</strong></div>
              <div class="bd-row"><span>Booking ID</span><strong>#{{ confirmedAppt.id }}</strong></div>
              <div class="bd-row"><span>Doctor</span><strong>{{ confirmedAppt.doctorName }}</strong></div>
              <div class="bd-row"><span>Date & Time</span><strong>{{ confirmedApptDateTime | date:'dd MMM yyyy, hh:mm a' }}</strong></div>
              <div class="bd-row"><span>Amount Paid</span><strong>₹{{ confirmedAppt.fee }}</strong></div>
            </div>
            <p style="font-size:13px;color:var(--text-2);margin-top:12px">
              Show <strong>Token #{{ confirmedAppt.tokenNumber }}</strong> at reception.
            </p>
          </div>
        }
      }

      @if (showWhatsappModal && confirmedAppt) {
        <app-whatsapp-confirm-modal
          [appointment]="confirmedAppt"
          (close)="showWhatsappModal = false">
        </app-whatsapp-confirm-modal>
      }

      @if (tab === 'track') {
        <div class="form-card">
          <h3 style="margin-bottom:20px">Track Your Appointment</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Booking ID *</label>
              <input class="form-control" type="number" [(ngModel)]="trackId" placeholder="Booking ID">
            </div>
            <div class="form-group">
              <label>Phone *</label>
              <input class="form-control" [(ngModel)]="trackPhone" placeholder="Registered phone">
            </div>
          </div>
          <button class="btn btn-primary" (click)="trackBooking()" [disabled]="tracking||!trackId||!trackPhone">
            @if (tracking) { <span class="spinner spinner-sm"></span> } @else { 🔍 Track }
          </button>

          @if (tracked) {
            <div class="track-result card" style="margin-top:20px">
              <div class="booking-details">
                <div class="bd-row"><span>Booking ID</span><strong>#{{ tracked.id }}</strong></div>
                <div class="bd-row"><span>Patient</span><strong>{{ tracked.patientName }}</strong></div>
                <div class="bd-row"><span>Doctor</span><strong>{{ tracked.doctorName }}</strong></div>
                <div class="bd-row"><span>Time</span><strong>{{ trackedDateTime | date:'medium' }}</strong></div>
                <div class="bd-row"><span>Status</span><span class="badge" [class]="trackBadge(tracked.status)">{{ tracked.status }}</span></div>
                @if (tracked.tokenNumber) { <div class="bd-row"><span>Token</span><strong>#{{ tracked.tokenNumber }}</strong></div> }
              </div>
            </div>
          }
        </div>
      }

      @if (tab === 'qr') {
        <div class="form-card">
          <h3 style="margin-bottom:16px">Doctor Booking QR Code</h3>
          <div style="display:flex;gap:10px;margin-bottom:20px">
            <input class="form-control" type="number" [(ngModel)]="qrDoctorId" placeholder="Doctor ID">
            <button class="btn btn-primary btn-sm" (click)="loadQr()" [disabled]="!qrDoctorId">Get QR</button>
          </div>
          @if (qrImageUrl) {
            <div class="qr-container">
              <img [src]="qrImageUrl" alt="Doctor Booking QR" class="qr-image">
              @if (qrLink) {
                <div style="margin-top:12px">
                  <div class="text-sm text-muted">Booking link:</div>
                  <a [href]="qrLink" target="_blank" class="qr-link">{{ qrLink }}</a>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .tab-nav { display:flex; gap:4px; border-bottom:1px solid var(--border); margin-bottom:20px; }
    .tab-btn { padding:10px 16px; font-size:14px; background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; color:var(--text-2); font-family:inherit; margin-bottom:-1px; }
    .tab-btn.active { color:var(--primary); border-bottom-color:var(--primary); font-weight:500; }
    .booking-layout { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
    @media(max-width:680px) { .booking-layout { grid-template-columns:1fr; } }
    .form-card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:20px; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    .slots-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(90px,1fr)); gap:8px; }
    .slot-btn { padding:8px 4px; border-radius:8px; border:1px solid var(--border); background:var(--surface); cursor:pointer; font-size:13px; transition:all .15s; }
    .slot-btn.selected { border-color:var(--primary); background:var(--primary-light); color:var(--primary-dark); font-weight:600; }
    .slot-btn.booked { opacity:.5; cursor:not-allowed; background:#f5f5f5; }
    .success-card { padding:24px; text-align:center; }
    .success-icon { font-size:40px; margin-bottom:12px; }
    .booking-details { text-align:left; max-width:380px; margin:16px auto 0; display:flex; flex-direction:column; gap:10px; }
    .bd-row { display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border); font-size:14px; }
    .bd-row:last-child { border:none; }
    .qr-container { display:flex; flex-direction:column; align-items:flex-start; gap:12px; }
    .qr-image { width:220px; height:220px; border:1px solid var(--border); border-radius:8px; }
    .qr-link { font-size:13px; color:var(--primary); word-break:break-all; }
    .track-result { padding:16px; }
  `]
})
export class PublicBookingComponent implements OnInit {
  private svc     = inject(PublicBookingService);
  private slotSvc = inject(SlotService);
  private toast   = inject(ToastService);
  private route   = inject(ActivatedRoute);

  tab = 'book';
  saving = false;
  confirmedAppt: any = null;
  paymentDone = false;
  showWhatsappModal = false;
  doctorIdLockedFromQr = false;

  form: any = { patientName: '', patientPhone: '', patientAge: null, patientEmail: '', doctorId: null, slotTime: '', slotId: null, notes: '' };
  slotDate = new Date().toISOString().split('T')[0];
  slots: SlotResponse[] = [];
  slotsLoading = false;

  trackId: number | null = null;
  trackPhone = '';
  tracking = false;
  tracked: any = null;

  qrDoctorId: number | null = null;
  qrImageUrl: string | null = null;
  qrLink: string | null = null;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['doctorId']) {
        this.form.doctorId = Number(params['doctorId']);
        this.doctorIdLockedFromQr = true;
        this.loadSlots();
      }
    });
  }

  // Backend appointmentDate + startTime alag-alag bhejta hai — display ke liye combine karo
  get confirmedApptDateTime(): Date | null {
    const a: any = this.confirmedAppt;
    if (!a?.appointmentDate) return null;
    return new Date(`${a.appointmentDate}T${a.startTime || '00:00'}`);
  }

  get trackedDateTime(): Date | null {
    const a: any = this.tracked;
    if (!a?.appointmentDate) return null;
    return new Date(`${a.appointmentDate}T${a.startTime || '00:00'}`);
  }

  loadSlots() {
    if (!this.form.doctorId || !this.slotDate) return;
    this.slotsLoading = true;
    this.slotSvc.getFreeSlots(this.form.doctorId, this.slotDate).subscribe({
      next: r => { this.slots = r.data || []; this.slotsLoading = false; },
      error: () => { this.slots = []; this.slotsLoading = false; }
    });
  }

  selectSlot(s: SlotResponse) {
    this.form.slotTime = `${this.slotDate}T${s.time}:00`;
    this.form.slotId = (s as any).id || null;
  }

  // ── FIX: Booking ab sirf payment safal hone ke BAAD banti hai ──────────────
  // Pehle yahan bookGuestAppointment() call hota tha jo turant ek Appointment
  // row PENDING_PAYMENT status ke saath DB mein bana deta tha — payment se
  // pehle hi. Ab Step 1 (order create) mein koi DB row nahi banti; Appointment
  // sirf Step 2 (verify, payment success ke baad) mein banti hai — seedha
  // CONFIRMED status ke saath.
  submit() {
    if (!this.form.patientName || !this.form.patientPhone || !this.form.doctorId || !this.form.slotTime) return;
    this.saving = true;

    // Step 1: Razorpay order banao — DB mein abhi kuch save NAHI hota
    this.svc.createGuestOrder(this.form).subscribe({
      next: orderRes => {
        if (!orderRes.success || !orderRes.data) {
          this.toast.error('Payment initiate nahi ho saka.');
          this.saving = false;
          return;
        }
        const order = orderRes.data;

        const options = {
          key:         order.razorpayKeyId,
          amount:      order.amountInPaise,
          currency:    order.currency || 'INR',
          name:        order.name || 'Solvixon Healthcare',
          description: order.description || 'Doctor Appointment',
          order_id:    order.razorpayOrderId,
          prefill: {
            name:    order.prefillName    || this.form.patientName  || '',
            contact: order.prefillContact || this.form.patientPhone || '',
            email:   order.prefillEmail   || this.form.patientEmail || '',
          },
          theme: { color: '#1D9E75' },
          handler: (response: any) => {
            // Step 2: Payment safal — AB Appointment backend par banegi (CONFIRMED)
            const verifyReq: GuestBookingVerifyRequest = {
              razorpayOrderId:   response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              patientName:  this.form.patientName,
              patientPhone: this.form.patientPhone,
              patientEmail: this.form.patientEmail,
              slotId:       this.form.slotId,
              notes:        this.form.notes,
            };
            this.svc.verifyGuestBooking(verifyReq).subscribe({
              next: vRes => {
                if (vRes.success && vRes.data) {
                  this.confirmedAppt = vRes.data;
                  this.paymentDone = true;
                  this.showWhatsappModal = true;
                  this.toast.success('✅ Booked! Token #' + vRes.data.tokenNumber);
                } else {
                  this.toast.error('Payment verify nahi ho saka.');
                }
                this.saving = false;
              },
              error: (e: any) => {
                this.toast.error(e?.error?.message || 'Verification failed. Agar paisa kata hai to support se contact karein.');
                this.saving = false;
              }
            });
          },
          modal: { ondismiss: () => { this.saving = false; } }
        };

        const rzp = new Razorpay(options);
        rzp.on('payment.failed', (r: any) => {
          this.toast.error('Payment failed: ' + (r?.error?.description || 'Unknown'));
          this.saving = false;
        });
        rzp.open();
      },
      error: (e: any) => {
        this.toast.error(e?.error?.message || 'Order create failed.');
        this.saving = false;
      }
    });
  }

  trackBooking() {
    if (!this.trackId || !this.trackPhone) return;
    this.tracking = true;
    this.svc.trackGuestAppointment(this.trackId, this.trackPhone).subscribe({
      next: r => { this.tracked = r.data?.appointment || null; this.tracking = false; },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Not found'); this.tracking = false; }
    });
  }

  loadQr() {
    if (!this.qrDoctorId) return;
    this.qrImageUrl = this.svc.getDoctorQrImageUrl(this.qrDoctorId);
    this.qrLink = `${window.location.origin}/book?doctorId=${this.qrDoctorId}`;
  }

  trackBadge(s: string): string {
    return ({ CONFIRMED: 'badge-green', PENDING: 'badge-amber', PENDING_PAYMENT: 'badge-amber', CANCELLED: 'badge-red', COMPLETED: 'badge-green' } as any)[s] || 'badge-gray';
  }
}