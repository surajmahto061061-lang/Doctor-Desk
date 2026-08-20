import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DoctorService } from '../../../core/services/doctor.service';
import { SlotService } from '../../../core/services/slot.service';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Doctor, TimeSlot } from '../../../core/models';
import { WhatsappConfirmModalComponent } from 'src/app/shared/components/whatsapp-confirm-modal/whatsapp-confirm-modal.component';


@Component({
  selector: 'app-doctor-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, WhatsappConfirmModalComponent],
  template: `
    <div class="page-container">
      <button class="btn btn-ghost btn-sm mb-16" (click)="router.navigate(['/doctors'])">← Back to doctors</button>

      @if (loading) {
        <div class="loading-wrap"><div class="spinner spinner-lg"></div><p>Loading profile…</p></div>

      } @else if (notAvailable) {
        <div class="empty-state">
          <div class="empty-icon">🚫</div>
          <h3>Profile not available</h3>
          <p>This doctor's profile is not currently accepting appointments.</p>
          <button class="btn btn-primary" (click)="router.navigate(['/doctors'])">Browse other doctors</button>
        </div>

      } @else if (loadError) {
        <div class="empty-state">
          <div class="empty-icon">⚠️</div>
          <h3>Could not load profile</h3>
          <p>There was a problem loading this doctor's profile. Please try again.</p>
          <button class="btn btn-outline" (click)="retryLoad()">Retry</button>
          <button class="btn btn-ghost" style="margin-left:8px" (click)="router.navigate(['/doctors'])">Back to search</button>
        </div>

      } @else if (doctor) {

        <div class="card doc-header mb-24">
          <div class="doc-hero">
            <div class="avatar avatar-lg" [style.background]="doctor.profileImageUrl ? 'transparent' : avatarBg">
              @if (doctor.profileImageUrl) {
                <img [src]="doctor.profileImageUrl" alt="{{ doctor.name }}"
                  style="width:100%;height:100%;border-radius:50%;object-fit:cover;">
              } @else {
                {{ initials }}
              }
            </div>
            <div class="doc-hero-info">
              <h2>{{ doctor.name }}</h2>
              <p class="spec">{{ doctor.specialization || 'General Physician' }}</p>
              <div class="doc-chips">
                @if (doctor.experienceYears) { <span class="badge badge-gray">{{ doctor.experienceYears }} yrs experience</span> }
                @if (doctor.consultationFee) { <span class="badge badge-green">₹{{ doctor.consultationFee }} fee</span> }
                @if (doctor.rating)          { <span class="badge badge-amber">★ {{ doctor.rating | number:'1.1-1' }}</span> }
                <span class="badge" [class]="doctor.available !== false ? 'badge-green' : 'badge-gray'">
                  {{ doctor.available !== false ? 'Available' : 'Unavailable' }}
                </span>
              </div>
            </div>
          </div>
          @if (doctor.bio) { <p class="doc-bio">{{ doctor.bio }}</p> }
          <div class="clinics">
            <strong style="font-size:13px">Clinic location</strong>
            @if (doctor.hospital) {
              <div class="clinic-item">🏥 {{ doctor.hospital }}</div>
            }
            @if (doctor.latitude && doctor.longitude) {
              <a [href]="mapLink" target="_blank" class="map-link">
                📍 View on Google Maps
              </a>
            } @else {
              <div class="map-link map-link-muted">📍 Location not shared by doctor yet</div>
            }
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Book an appointment</h3></div>

          <div class="section-label">Select date</div>
          <div class="date-tabs">
            @for (d of dates; track d.value) {
              <button class="date-tab" [class.active]="selectedDate === d.value" (click)="selectDate(d.value)">
                <span class="day-label">{{ d.label }}</span>
                <span class="day-date">{{ d.short }}</span>
              </button>
            }
          </div>

          <div class="section-label">Select time slot</div>
          @if (slotsLoading) {
            <div class="loading-wrap" style="padding:24px"><div class="spinner"></div></div>
          } @else if (slots.length) {
            <div class="slots-grid">
              @for (s of slots; track s.time) {
                <button class="slot-chip"
                  [class.selected]="selectedSlot === s.time"
                  [class.booked]="!s.available"
                  [disabled]="!s.available"
                  (click)="selectSlot(s)">
                  {{ s.time }}
                </button>
              }
            </div>
            <p class="slots-legend text-sm text-muted">
              <span class="legend-dot available"></span> Available &nbsp;
              <span class="legend-dot booked"></span> Booked
            </p>
          } @else {
            <div class="empty-state" style="padding:24px">
              <div class="empty-icon">📅</div>
              <p>No slots available for this date</p>
            </div>
          }

          @if (selectedSlot) {
            <div class="booking-form">
              <div class="booking-summary">
                <strong>Selected:</strong> {{ selectedDate }} at {{ selectedSlot }}
                @if (doctor.consultationFee) { · <strong>₹{{ doctor.consultationFee }}</strong> }
              </div>
              <div class="form-row-2">
                <div class="form-group">
                  <label>Your age</label>
                  <input class="form-control" type="number" [(ngModel)]="patientAge" placeholder="e.g. 30" min="1" max="120">
                </div>
                <div class="form-group">
                  <label>Chief complaint / disease</label>
                  <input class="form-control" [(ngModel)]="patientDisease" placeholder="e.g. Fever, back pain…">
                </div>
              </div>
              <div class="form-group">
                <label>Additional notes (optional)</label>
                <textarea class="form-control" [(ngModel)]="notes" placeholder="Describe your symptoms or concerns…" rows="3"></textarea>
              </div>
              <button class="btn btn-primary" (click)="confirmBooking()" [disabled]="bookingLoading">
                @if (bookingLoading) { <span class="spinner spinner-sm"></span> Booking… }
                @else { Confirm & pay ₹{{ doctor.consultationFee || '' }} }
              </button>
            </div>
          }
        </div>
      }
    </div>

    @if (showModal) {
      <div class="modal-overlay" (click)="showModal=false">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="showModal=false">✕</button>
          <h3>Confirm booking</h3>
          <p style="margin-bottom:20px">Review your appointment details before confirming</p>
          <div class="summary-card">
            <div class="summary-row"><span>Doctor</span><strong>{{ doctor?.name }}</strong></div>
            <div class="summary-row"><span>Date</span><strong>{{ selectedDate }}</strong></div>
            <div class="summary-row"><span>Time</span><strong>{{ selectedSlot }}</strong></div>
            <div class="summary-row"><span>Age</span><strong>{{ patientAge }}</strong></div>
            <div class="summary-row"><span>Complaint</span><strong>{{ patientDisease }}</strong></div>
            <div class="summary-row"><span>Fee</span><strong>₹{{ doctor?.consultationFee || 'N/A' }}</strong></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" (click)="showModal=false">Cancel</button>
            <button class="btn btn-primary" (click)="submitBooking()" [disabled]="bookingLoading">
              @if (bookingLoading) { <span class="spinner spinner-sm"></span> Processing… }
              @else { Pay & confirm }
            </button>
          </div>
        </div>
      </div>
    }

    @if (showWhatsappModal && confirmedAppt) {
      <app-whatsapp-confirm-modal
        [appointment]="confirmedAppt"
        (close)="closeWhatsappModal()">
      </app-whatsapp-confirm-modal>
    }
  `,
  styles: [`
    .mb-16 { margin-bottom: 16px; }
    .mb-24 { margin-bottom: 24px; }
    .doc-hero { display: flex; gap: 20px; align-items: flex-start; margin-bottom: 16px; flex-wrap: wrap; }
    .doc-hero-info h2 { margin-bottom: 4px; }
    .spec { color: var(--text-2); font-size: 15px; margin-bottom: 10px; }
    .doc-chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .doc-bio { color: var(--text-2); font-size: 14px; line-height: 1.7; border-top: 1px solid var(--border); padding-top: 16px; margin-top: 4px; }
    .clinics { margin-top: 14px; border-top: 1px solid var(--border); padding-top: 14px; }
    .map-link { display:inline-block; margin-top:6px; font-size:13px; color:var(--primary); text-decoration:none; font-weight:500; }
    .map-link:hover { text-decoration:underline; }
    .map-link-muted { color: var(--text-2); font-weight:400; cursor:default; }
    .clinic-item { font-size: 13px; color: var(--text-2); margin-top: 6px; }
    .section-label { font-size: 13px; font-weight: 600; color: var(--text-2); text-transform: uppercase; letter-spacing: .04em; margin-bottom: 12px; margin-top: 20px; }
    .booking-form { margin-top: 24px; border-top: 1px solid var(--border); padding-top: 20px; }
    .booking-summary { background: var(--primary-light); color: var(--primary-dark); border-radius: var(--radius); padding: 12px 16px; font-size: 14px; margin-bottom: 16px; }
    .summary-card { background: var(--surface-2); border-radius: var(--radius); padding: 16px; margin-bottom: 20px; }
    .summary-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border);
      &:last-child { border-bottom: none; }
      span { font-size: 14px; color: var(--text-2); }
      strong { font-size: 14px; }
    }
    .modal-footer { display: flex; gap: 10px; justify-content: flex-end; }
    .date-tab { flex-direction: column; gap: 2px; min-width: 72px; }
    .form-row-2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
    .day-label { font-size: 12px; color: var(--text-2); }
    .day-date  { font-size: 13px; font-weight: 500; }
    .date-tab.active .day-label { color: var(--primary-dark); }
    .slots-legend { display:flex; align-items:center; gap:4px; margin-top:12px; }
    .legend-dot { display:inline-block; width:10px; height:10px; border-radius:50%; }
    .legend-dot.available { background: var(--primary); }
    .legend-dot.booked    { background: var(--border-strong); }
  `]
})
export class DoctorDetailComponent implements OnInit {
  router           = inject(Router);
  private route    = inject(ActivatedRoute);
  private doctorSvc  = inject(DoctorService);
  private slotSvc    = inject(SlotService);
  private bookingSvc = inject(BookingService);
  private authSvc    = inject(AuthService);
  private toast      = inject(ToastService);

  doctor: Doctor | null = null;
  loading      = true;
  loadError    = false;
  notAvailable = false;
  slots: TimeSlot[] = [];
  slotsLoading = false;
  selectedDate = '';
  selectedSlot = '';
  notes          = '';
  patientAge     = '';
  patientDisease = '';
  showModal      = false;
  bookingLoading = false;
  showWhatsappModal = false;
  confirmedAppt: any = null;
  dates: { value: string; label: string; short: string }[] = [];
  private doctorId = 0;

  get avatarBg(): string {
    const colors = ['#1D9E75','#0A6A8B','#7B4EA6','#C05621','#2B6CB0'];
    const name = this.doctor?.name || '';
    return colors[name.charCodeAt(0) % colors.length];
  }

  get mapLink(): string {
    return `https://www.google.com/maps?q=${this.doctor?.latitude},${this.doctor?.longitude}`;
  }

  get initials(): string {
    const n = this.doctor?.name || 'DR';
    return n.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  }

  ngOnInit() {
    const idStr = this.route.snapshot.paramMap.get('id')!;
    this.doctorId = +idStr;
    if (!this.doctorId || isNaN(this.doctorId)) { this.loading = false; this.loadError = true; return; }
    this.buildDates();
    this.fetchDoctor();
  }

  fetchDoctor() {
    this.loading = true; this.loadError = false; this.notAvailable = false;
    this.doctorSvc.getDoctorById(this.doctorId).subscribe({
      next: d => {
        const doc = d.data || null;
        this.loading = false;
        if (!doc) { this.loadError = true; return; }
        if (doc.approvalStatus && doc.approvalStatus !== 'APPROVED') { this.notAvailable = true; return; }
        this.doctor = doc;
        this.loadSlots();
      },
      error: () => { this.loading = false; this.loadError = true; }
    });
  }

  retryLoad() { this.fetchDoctor(); }

  buildDates() {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today); d.setDate(today.getDate() + i);
      this.dates.push({
        value: d.toISOString().slice(0, 10),
        label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short' }),
        short: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      });
    }
    this.selectedDate = this.dates[0].value;
  }

  selectDate(date: string) { this.selectedDate = date; this.selectedSlot = ''; this.loadSlots(); }

  loadSlots() {
    if (!this.doctor) return;
    this.slotsLoading = true;
    this.slotSvc.getAllSlots(this.doctor.id, this.selectedDate).subscribe({
      next: s => {
        const raw: any[] = s.data || [];
        this.slots = raw.map(slot => ({
          ...slot,
          time:      slot.time || this.formatTime(slot.startTime),
          available: slot.available ?? (slot.isAvailable === true && slot.isBooked !== true)
        }));
        // FIX: previously fell back to demoSlots() (fake placeholder times with
        // no real `id`) whenever the doctor had zero real slots for the date.
        // Patient could select a fake slot and book it — slotId ended up
        // undefined, and the backend rejected with "Slot ID is required".
        // Now we just show the real empty state instead of fake bookable data.
        this.slotsLoading = false;
      },
      error: () => { this.slots = []; this.slotsLoading = false; }
    });
  }

  private formatTime(t: any): string {
    if (!t) return '';
    if (typeof t === 'object') {
      const h = t.hour ?? 0; const m = t.minute ?? 0;
      const mer = h >= 12 ? 'PM' : 'AM';
      const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${String(dh).padStart(2,'0')}:${String(m).padStart(2,'0')} ${mer}`;
    }
    const [hStr, mStr] = t.split(':');
    let h = parseInt(hStr, 10); const m = mStr || '00';
    const mer = h >= 12 ? 'PM' : 'AM';
    if (h > 12) h -= 12; if (h === 0) h = 12;
    return `${String(h).padStart(2,'0')}:${m} ${mer}`;
  }

  selectSlot(slot: TimeSlot) { if (!slot.available) return; this.selectedSlot = slot.time || ''; }

  confirmBooking() {
    if (!this.authSvc.isLoggedIn()) { this.toast.error('Please sign in to book an appointment'); this.router.navigate(['/auth/login']); return; }
    if (!this.patientAge || +this.patientAge < 1) { this.toast.error('Please enter your age'); return; }
    if (!this.patientDisease.trim()) { this.toast.error('Please describe your chief complaint'); return; }
    this.showModal = true;
  }

  submitBooking() {
    const user = this.authSvc.user();
    if (!user) { this.toast.error('Session expired. Please log in again.'); this.router.navigate(['/auth/login']); return; }

    const selectedSlotObj = this.slots.find(s => s.time === this.selectedSlot);

    this.bookingLoading = true;

    // Step 1: Book appointment
    this.bookingSvc.bookAppointment({
      doctorId:       this.doctor!.id,
      slotId:         (selectedSlotObj as any)?.id,
      slotTime:       this.buildAppointmentTime(this.selectedDate, this.selectedSlot),
      notes:          [this.notes, this.patientDisease].filter(Boolean).join(' | ') || undefined,
      patientName:    user.name,
      patientPhone:   user.phone || '',
      patientAge:     this.patientAge ? +this.patientAge : undefined,
      patientDisease: this.patientDisease || 'General Consultation',
    } as any).subscribe({
      next: res => {
        if (!res.success || !res.data) {
          this.toast.error(res.message || 'Booking failed');
          this.bookingLoading = false; this.showModal = false; return;
        }
        const appointmentId = res.data.id;

        // Step 2: Create Razorpay order
        this.bookingSvc.createRazorpayOrder(appointmentId).subscribe({
          next: orderRes => {
            if (!orderRes.success || !orderRes.data) {
              this.toast.error('Payment initiation failed');
              this.bookingLoading = false; return;
            }
            const order = orderRes.data;

            // Step 3: Open Razorpay checkout
            const options = {
              key:         order.razorpayKeyId,
              amount:      order.amountInPaise,
              currency:    order.currency || 'INR',
              name:        'MediConnect',
              description: `Appointment with Dr. ${this.doctor!.name}`,
              order_id:    order.razorpayOrderId,
              handler: (paymentResponse: any) => {
                // Step 4: Verify payment
                this.bookingSvc.verifyRazorpayPayment(appointmentId, {
                  razorpayOrderId:   paymentResponse.razorpay_order_id,
                  razorpayPaymentId: paymentResponse.razorpay_payment_id,
                  razorpaySignature: paymentResponse.razorpay_signature
                }).subscribe({
                  next: (res: any) => this.done(res?.data),
                  error: () => { this.toast.error('Payment verification failed'); this.bookingLoading = false; }
                });
              },
              modal: {
                ondismiss: () => {
                  // Cancel appointment so slot is released
                  this.bookingSvc.cancelAppointment(appointmentId).subscribe();
                  this.toast.error('Payment cancelled — appointment released');
                  this.bookingLoading = false;
                }
              },
              prefill: {
                name:    order.prefillName    || user.name    || '',
                email:   order.prefillEmail   || user.email   || '',
                contact: order.prefillContact || user.phone   || '',
              },
              theme: { color: '#10b981' }
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
            this.bookingLoading = false;
            this.showModal = false;
          },
          error: () => { this.toast.error('Payment initiation failed'); this.bookingLoading = false; }
        });
      },
      error: (e: any) => {
        this.toast.error(e?.error?.message || 'Booking failed');
        this.bookingLoading = false; this.showModal = false;
      }
    });
  }

  private buildAppointmentTime(date: string, timeLabel: string): string {
    const parts = timeLabel.trim().split(' ');
    const [timePart, meridiem] = [parts[0], parts[1]];
    let [hours, minutes] = timePart.split(':').map(Number);
    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return `${date}T${String(hours).padStart(2,'0')}:${String(minutes||0).padStart(2,'0')}:00`;
  }

  private done(appt?: any) {
    this.bookingLoading = false; this.showModal = false;
    this.toast.success('Appointment booked & payment successful!');

    // AppointmentResponse mil gaya to WhatsApp confirmation popup dikhao (dashboard
    // par navigate karne se pehle) — user WhatsApp pe bhejna chahe to bhej sake.
    if (appt) {
      this.confirmedAppt = appt;
      this.showWhatsappModal = true;
    } else {
      this.router.navigate(['/dashboard']);
    }
  }

  closeWhatsappModal() {
    this.showWhatsappModal = false;
    this.router.navigate(['/dashboard']);
  }
}