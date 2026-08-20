import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

// Payment successful ho jaane ke baad patient ko WhatsApp par bhi appointment
// confirmation bhejne ka option — koi WhatsApp Business API, SMS gateway, ya
// DLT registration NAHI use hoti. Sirf wa.me Click-to-Chat link banta hai
// (100% free), jo naye tab me khulta hai aur message pre-filled kar deta hai —
// patient khud "Send" dabata hai WhatsApp app/web me.
//
// Reusable hai — dono booking flows (QR/guest booking aur login karke booking)
// se same component use hota hai, bas alag-alag jagah se appointment data pass
// hoti hai.
@Component({
  selector: 'app-whatsapp-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="close.emit()">
      <div class="modal-box" (click)="$event.stopPropagation()" style="max-width:420px; text-align:center;">
        <button class="modal-close" (click)="close.emit()" aria-label="Close">&times;</button>

        <div style="font-size:48px; margin-bottom:8px;">✅</div>
        <h3 style="margin:0 0 8px;">Appointment Confirmed</h3>
        <p style="color:var(--text-2,#6b7280); margin:0 0 20px; font-size:14px;">
          Your payment was successful and your appointment has been confirmed.
        </p>

        <div style="display:flex; flex-direction:column; gap:10px;">
          <button
            type="button"
            class="btn btn-primary"
            style="background:#25D366; border-color:#25D366; display:flex; align-items:center; justify-content:center; gap:8px; width:100%;"
            (click)="sendOnWhatsApp()">
            <span aria-hidden="true">📲</span> Send Confirmation on WhatsApp
          </button>
          <button type="button" class="btn btn-outline" style="width:100%;" (click)="close.emit()">
            Close
          </button>
        </div>
      </div>
    </div>
  `
})
export class WhatsappConfirmModalComponent {
  // Component ke andar hi minimal shape rakha hai (poora AppointmentResponse
  // model force nahi karte) — dono flows (guest booking ka GuestBookingResponse
  // aur logged-in booking ka AppointmentResponse) is shape se compatible hain.
  @Input({ required: true }) appointment!: {
    patientName?: string;
    patientPhone?: string;
    doctorName?: string;
    appointmentDate?: string; // "yyyy-MM-dd"
    startTime?: string;       // "HH:mm:ss"
    tokenNumber?: number;
    fee?: number;
  };

  @Output() close = new EventEmitter<void>();

  constructor(private toastService: ToastService) {}

  sendOnWhatsApp(): void {
    const a = this.appointment;
    if (!a) {
      return;
    }

    // Number normalize: +, spaces, hyphens hatao. India ke liye 91 prefix —
    // agar 10-digit number hai to prefix lagao, agar already country code
    // ke saath hai (11+ digits) to as-is chhod do (duplicate na ho).
    const rawPhone = (a.patientPhone || '').replace(/[+\s-]/g, '');
    if (!rawPhone) {
      this.toastService.error('Patient ka phone number available nahi hai — WhatsApp link nahi ban saka.');
      return;
    }
    const phone = rawPhone.length === 10 ? '91' + rawPhone : rawPhone;

    // Backend date/time alag-alag bhejta hai ("appointmentDate" + "startTime")
    // — combine karke display-friendly format banate hain (jaise email
    // template me hai: "19 Aug", "04:30 PM").
    const dateObj = a.appointmentDate
      ? new Date(`${a.appointmentDate}T${a.startTime || '00:00'}`)
      : null;
    const dateStr = dateObj && !isNaN(dateObj.getTime()) ? formatDate(dateObj, 'dd MMM', 'en-US') : '';
    const timeStr = dateObj && !isNaN(dateObj.getTime()) ? formatDate(dateObj, 'hh:mm a', 'en-US') : '';
    const amountStr = (a.fee ?? 0).toFixed(2);

    const message =
      `Namaste ${a.patientName || 'Patient'},\n\n` +
      `Aapki appointment successfully confirm ho gayi hai. Details neeche hain:\n\n` +
      `Doctor:        Dr. ${a.doctorName || ''}\n` +
      `Date:          ${dateStr}\n` +
      `Time:          ${timeStr}\n` +
      `Token Number:  ${a.tokenNumber ?? ''}\n` +
      `Amount Paid:   Rs. ${amountStr}\n\n` +
      `Kripya apne token number/time se thoda pehle clinic pahunch jaayein.\n\n` +
      `Dhanyavaad,\nMediConnect Team`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    // Naye tab/window me khulta hai — koi backend call nahi, koi auto-send nahi.
    window.open(url, '_blank');
  }
}