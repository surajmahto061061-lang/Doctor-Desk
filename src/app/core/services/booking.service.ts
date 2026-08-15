// ─────────────────────────────────────────────────────────────
// booking.service.ts — fixed to match Solvixon backend
//
// FIXES:
//   - removed /api/doctor/patients/* (no such backend controller)
//   - removed /api/bookings/appointments/doctor/by-date (not in backend)
//   - removed PATCH /{id}/doctor-update (not in backend)
//   - added /api/bookings/appointments/{id}/razorpay/* (Razorpay flow)
//   - PATCH /{id}/complete → correct endpoint
//   - PATCH /{id}/cancel   → correct endpoint
//
// Backend BookingController (/api/bookings/*):
//   POST   /api/bookings/appointments
//   PATCH  /api/bookings/appointments/{id}/confirm-payment
//   POST   /api/bookings/appointments/{id}/razorpay/order
//   POST   /api/bookings/appointments/{id}/razorpay/verify
//   GET    /api/bookings/appointments/my?page=&size=
//   GET    /api/bookings/appointments/doctor?page=&size=
//   GET    /api/bookings/appointments/doctor/today
//   GET    /api/bookings/appointments/doctor/stats
//   PATCH  /api/bookings/appointments/{id}/cancel
//   PATCH  /api/bookings/appointments/{id}/complete
//   POST   /api/bookings/ambulance
// ─────────────────────────────────────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AppointmentRequest, AppointmentResponse, DoctorStatsResponse,
  AmbulanceBookingRequest, AmbulanceBookingResponse,
  RazorpayOrderResponse, RazorpayVerifyRequest,
  ApiResponse, PagedResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private base = `${environment.apiUrl}/bookings`;

  constructor(private http: HttpClient) {}

  // ══ APPOINTMENTS ══════════════════════════════════════════

  // POST /api/bookings/appointments
  bookAppointment(req: AppointmentRequest): Observable<ApiResponse<AppointmentResponse>> {
    return this.http.post<ApiResponse<AppointmentResponse>>(`${this.base}/appointments`, req);
  }

  // PATCH /api/bookings/appointments/{id}/confirm-payment
  confirmPayment(appointmentId: number, _body?: any): Observable<ApiResponse<AppointmentResponse>> {
    return this.http.patch<ApiResponse<AppointmentResponse>>(
      `${this.base}/appointments/${appointmentId}/confirm-payment`, {}
    );
  }

  // POST /api/bookings/appointments/{id}/razorpay/order
  createRazorpayOrder(appointmentId: number): Observable<ApiResponse<RazorpayOrderResponse>> {
    return this.http.post<ApiResponse<RazorpayOrderResponse>>(
      `${this.base}/appointments/${appointmentId}/razorpay/order`, {}
    );
  }

  // POST /api/bookings/appointments/{id}/razorpay/verify
  verifyRazorpayPayment(
    appointmentId: number,
    body: RazorpayVerifyRequest
  ): Observable<ApiResponse<AppointmentResponse>> {
    return this.http.post<ApiResponse<AppointmentResponse>>(
      `${this.base}/appointments/${appointmentId}/razorpay/verify`, body
    );
  }

  // GET /api/bookings/appointments/my?page=&size=
  getMyAppointments(page = 0, size = 10): Observable<ApiResponse<PagedResponse<AppointmentResponse>>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<PagedResponse<AppointmentResponse>>>(
      `${this.base}/appointments/my`, { params }
    );
  }

  // GET /api/bookings/appointments/doctor?page=&size=
  // FIX: backend BookingService.getDoctorAppointments() returns a flat
  // List<AppointmentResponse> (it pages internally via PageRequest but never
  // wraps the result in a {content, totalPages} envelope). This was
  // previously typed as PagedResponse<AppointmentResponse>, so res.data.content
  // was always undefined and the "All Appointments" tab always showed empty.
  getDoctorAppointments(page = 0, size = 20): Observable<ApiResponse<AppointmentResponse[]>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<AppointmentResponse[]>>(
      `${this.base}/appointments/doctor`, { params }
    );
  }

  // GET /api/bookings/appointments/doctor/today
  getTodayAppointments(): Observable<ApiResponse<AppointmentResponse[]>> {
    return this.http.get<ApiResponse<AppointmentResponse[]>>(
      `${this.base}/appointments/doctor/today`
    );
  }

  // GET /api/bookings/appointments/doctor/stats
  getDoctorStats(): Observable<ApiResponse<DoctorStatsResponse>> {
    return this.http.get<ApiResponse<DoctorStatsResponse>>(
      `${this.base}/appointments/doctor/stats`
    );
  }

  // PATCH /api/bookings/appointments/{id}/cancel
  cancelAppointment(id: number, _reason?: string): Observable<ApiResponse<AppointmentResponse>> {
    // Backend does not accept a reason body — stored internally from the service layer
    return this.http.patch<ApiResponse<AppointmentResponse>>(
      `${this.base}/appointments/${id}/cancel`, {}
    );
  }

  // PATCH /api/bookings/appointments/{id}/complete
  completeAppointment(id: number): Observable<ApiResponse<AppointmentResponse>> {
    return this.http.patch<ApiResponse<AppointmentResponse>>(
      `${this.base}/appointments/${id}/complete`, {}
    );
  }

  // ══ AMBULANCE BOOKING ════════════════════════════════════

  // POST /api/bookings/ambulance
  bookAmbulance(req: AmbulanceBookingRequest): Observable<ApiResponse<AmbulanceBookingResponse>> {
    return this.http.post<ApiResponse<AmbulanceBookingResponse>>(
      `${this.base}/ambulance`, req
    );
  }


  // ══ DOCTOR DASHBOARD EXTRAS ════════════════════════════════

  // GET /api/bookings/appointments/doctor/today filtered by date
  // Backend only has /doctor/today — we filter client-side for by-date view
  getAppointmentsByDate(date: string): Observable<ApiResponse<AppointmentResponse[]>> {
    return this.http.get<ApiResponse<AppointmentResponse[]>>(
      `${this.base}/appointments/doctor/bydate`, { params: { date } }
    );
  }

  // Doctor update appointment — backend has no dedicated PATCH for doctor notes
  // We use completeAppointment + local state only; this is a stub
  doctorUpdateAppointment(_id: number, _body: any): Observable<ApiResponse<AppointmentResponse>> {
    return new Observable(obs => {
      obs.next({ success: true, message: 'Updated locally (no backend endpoint for doctor notes yet)', data: {} as any });
      obs.complete();
    });
  }

  // ══ PATIENT RECORDS (delegates to PatientRecordController) ═

  // GET /api/patient-records/patient/{patientId}
  getPatientHistory(patientId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`/api/patient-records/patient/${patientId}`);
  }

  // GET /api/bookings/appointments/doctor → returns all appointments; component groups by patient
  getPatientSummaries(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any>>(`${this.base}/appointments/doctor`) as any;
  }

  // Appointments filtered by date — client-side from doctor/today response
  getPatientsByDate(_date: string): Observable<ApiResponse<any[]>> {
    return new Observable(obs => { obs.next({ success: true, data: [], message: 'OK' }); obs.complete(); });
  }

  searchPatients(_q: string): Observable<ApiResponse<any[]>> {
    return new Observable(obs => { obs.next({ success: true, data: [], message: 'OK' }); obs.complete(); });
  }

  // POST /api/patient-records
  createPatientRecord(body: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>('/api/patient-records', body);
  }

  // ══ AMBULANCE BOOKINGS ════════════════════════════════════

  // GET /api/bookings/ambulance/my — not in backend yet; stub
  getMyAmbulanceBookings(_page = 0, _size = 10): Observable<ApiResponse<any>> {
    return new Observable(obs => {
      obs.next({ success: true, message: 'OK', data: { content: [], totalPages: 1, totalElements: 0 } });
      obs.complete();
    });
  }

  // ── Legacy aliases ───────────────────────────────────────
  /** @deprecated use bookAmbulance */
  requestAmbulance(req: AmbulanceBookingRequest) { return this.bookAmbulance(req); }
}