// ─────────────────────────────────────────────────────────────
// public-booking.service.ts — NEW service (was missing entirely)
// Backend PublicBookingController (/api/public/*) — no auth needed
//   POST /api/public/bookings/appointment
//   GET  /api/public/bookings/appointment/{id}/track?phone=
//   POST /api/public/bookings/appointment/{id}/razorpay/order?phone=
//   POST /api/public/bookings/appointment/{id}/razorpay/verify
//   GET  /api/public/doctors/{doctorId}/qrcode          (returns PNG)
//   GET  /api/public/doctors/{doctorId}/qrcode/link
// ─────────────────────────────────────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  GuestAppointmentRequest, GuestBookingResponse,
  RazorpayOrderResponse, RazorpayVerifyRequest, AppointmentResponse,
  GuestOrderRequest, GuestBookingVerifyRequest,
  ApiResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class PublicBookingService {
  private base = `${environment.apiUrl}/public`;

  constructor(private http: HttpClient) {}

  // ── POST /api/public/bookings/appointment ─────────────────
  bookGuestAppointment(req: GuestAppointmentRequest): Observable<ApiResponse<GuestBookingResponse>> {
    return this.http.post<ApiResponse<GuestBookingResponse>>(
      `${this.base}/bookings/appointment`, req
    );
  }

  // ── GET /api/public/bookings/appointment/{id}/track?phone= ─
  trackGuestAppointment(id: number, phone: string): Observable<ApiResponse<GuestBookingResponse>> {
    const params = new HttpParams().set('phone', phone);
    return this.http.get<ApiResponse<GuestBookingResponse>>(
      `${this.base}/bookings/appointment/${id}/track`, { params }
    );
  }

  // ── POST /api/public/bookings/appointment/{id}/razorpay/order?phone= ─
  createGuestRazorpayOrder(id: number, phone: string): Observable<ApiResponse<RazorpayOrderResponse>> {
    const params = new HttpParams().set('phone', phone);
    return this.http.post<ApiResponse<RazorpayOrderResponse>>(
      `${this.base}/bookings/appointment/${id}/razorpay/order`, null, { params }
    );
  }

  // ── POST /api/public/bookings/appointment/{id}/razorpay/verify ─
  verifyGuestRazorpayPayment(
    id: number,
    body: RazorpayVerifyRequest
  ): Observable<ApiResponse<AppointmentResponse>> {
    return this.http.post<ApiResponse<AppointmentResponse>>(
      `${this.base}/bookings/appointment/${id}/razorpay/verify`, body
    );
  }

  // ── NEW pay-first flow — POST /api/public/bookings/order (no appointmentId yet) ─
  createGuestOrder(req: GuestOrderRequest): Observable<ApiResponse<RazorpayOrderResponse>> {
    return this.http.post<ApiResponse<RazorpayOrderResponse>>(
      `${this.base}/bookings/order`, req
    );
  }

  // ── NEW pay-first flow — POST /api/public/bookings/verify (creates appointment now) ─
  verifyGuestBooking(req: GuestBookingVerifyRequest): Observable<ApiResponse<AppointmentResponse>> {
    return this.http.post<ApiResponse<AppointmentResponse>>(
      `${this.base}/bookings/verify`, req
    );
  }

  // ── GET /api/public/doctors/{doctorId}/qrcode/link ────────
  getDoctorQrLink(doctorId: number): Observable<ApiResponse<{
    doctorId: string;
    bookingLink: string;
    qrImageUrl: string;
  }>> {
    return this.http.get<ApiResponse<any>>(
      `${this.base}/doctors/${doctorId}/qrcode/link`
    );
  }

  // ── QR code PNG URL (use in <img> src) ───────────────────
  getDoctorQrImageUrl(doctorId: number): string {
    return `${environment.apiUrl}/public/doctors/${doctorId}/qrcode`;
  }
}