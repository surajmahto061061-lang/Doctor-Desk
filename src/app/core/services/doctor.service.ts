import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Doctor, DoctorProfileRequest, Clinic, ClinicRequest,
  UnavailableDate, LocationUpdateRequest,
  ApiResponse, PagedResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class DoctorService {
  private base = `${environment.apiUrl}/doctors`;
  constructor(private http: HttpClient) {}

  // ══ PUBLIC ═════════════════════════════════════════════════

  searchDoctors(params: {
    q?: string; specialization?: string; available?: boolean; sortBy?: string;
  } = {}): Observable<ApiResponse<Doctor[]>> {
    let p = new HttpParams();
    if (params.q)                 p = p.set('q', params.q);
    if (params.specialization)    p = p.set('specialization', params.specialization);
    if (params.available != null) p = p.set('available', String(params.available));
    if (params.sortBy)            p = p.set('sortBy', params.sortBy);
    return this.http.get<ApiResponse<Doctor[]>>(`${this.base}/search`, { params: p });
  }

  getSpecializations(): Observable<ApiResponse<string[]>> {
    return this.http.get<ApiResponse<string[]>>(`${this.base}/specializations`);
  }

  getDoctorById(id: number): Observable<ApiResponse<Doctor>> {
    return this.http.get<ApiResponse<Doctor>>(`${this.base}/${id}`);
  }

  getDoctorClinics(id: number): Observable<ApiResponse<Clinic[]>> {
    // FIX: clinic CRUD lives in ClinicController at /api/clinics, not /api/doctors —
    // this was hitting /api/doctors/{id}/clinics which doesn't exist (404), so patients
    // never actually saw a doctor's clinic list.
    const clinicBase = this.base.replace('/doctors', '/clinics');
    return this.http.get<ApiResponse<Clinic[]>>(`${clinicBase}/doctor/${id}`);
  }

  getDoctorLocation(doctorId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.base}/${doctorId}/location`);
  }

  // ══ AUTHENTICATED DOCTOR ═══════════════════════════════════

  createProfile(data: DoctorProfileRequest): Observable<ApiResponse<Doctor>> {
    return this.http.post<ApiResponse<Doctor>>(`${this.base}/profile`, data);
  }

  updateProfile(data: Partial<DoctorProfileRequest>): Observable<ApiResponse<Doctor>> {
    return this.http.put<ApiResponse<Doctor>>(`${this.base}/profile`, data);
  }

  getMyProfile(): Observable<ApiResponse<Doctor>> {
    return this.http.get<ApiResponse<Doctor>>(`${this.base}/profile/me`);
  }

  toggleAvailability(): Observable<ApiResponse<any>> {
    return this.http.patch<ApiResponse<any>>(`${this.base}/profile/availability`, {});
  }

  markUnavailable(date: string): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${this.base}/unavailable`, null, { params: { date } }
    );
  }

  updateLocation(loc: LocationUpdateRequest): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(`${this.base}/location`, loc);
  }

  // FIX: these three were calling /api/doctors/clinics/... which has no matching
  // controller (ClinicController is mapped at /api/clinics). Every "add clinic" and
  // "update clinic location" call was silently 404ing, so a doctor's location/clinic
  // never actually got saved even though the dashboard looked like it worked.
  addClinic(clinic: ClinicRequest): Observable<ApiResponse<any>> {
    const clinicBase = this.base.replace('/doctors', '/clinics');
    return this.http.post<ApiResponse<any>>(clinicBase, clinic);
  }

  getMyClinics(): Observable<ApiResponse<Clinic[]>> {
    const clinicBase = this.base.replace('/doctors', '/clinics');
    return this.http.get<ApiResponse<Clinic[]>>(`${clinicBase}/my`);
  }

  updateClinicLocation(clinicId: number, body: ClinicRequest): Observable<ApiResponse<any>> {
    const clinicBase = this.base.replace('/doctors', '/clinics');
    return this.http.patch<ApiResponse<any>>(`${clinicBase}/${clinicId}/location`, body);
  }

  // ── Stubs for features not in backend ─────────────────────

  getUnavailableDates(): Observable<ApiResponse<any[]>> {
    return new Observable(obs => {
      obs.next({ success: true, message: 'OK', data: [] });
      obs.complete();
    });
  }

  removeUnavailable(_id: number): Observable<ApiResponse<string>> {
    return new Observable(obs => {
      obs.next({ success: false, message: 'Not supported', data: '' });
      obs.complete();
    });
  }

  generateSlots(_params: any): Observable<ApiResponse<{ slotsCreated: number }>> {
    return new Observable(obs => {
      obs.next({ success: false, message: 'Slots are auto-generated when a booking is made.', data: { slotsCreated: 0 } });
      obs.complete();
    });
  }

  // Alias — use SlotService directly for slot fetching
  getDoctorSlots(doctorId: number, _days?: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.base}/${doctorId}/slots`);
  }

  // Legacy alias
  getById(id: number) { return this.getDoctorById(id); }

  // GET /api/public/doctors/{id}/qrcode/link
  getDoctorQrLink(doctorId: number): Observable<any> {
    const publicBase = this.base.replace('/doctors', '/public/doctors');
    return this.http.get<any>(`${publicBase}/${doctorId}/qrcode/link`);
  }
}