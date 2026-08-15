// ─────────────────────────────────────────────────────────────
// ambulance.service.ts — fixed to match Solvixon backend
//
// FIXES:
//   - was using /api/ambulance/driver/* → backend uses /api/ambulance/my/*
//   - status update: PATCH /api/ambulance/my/status?status= (query param)
//   - location: PATCH /api/ambulance/my/location (body: { latitude, longitude })
//   - nearest: GET /api/ambulance/nearest?lat=&lng=
//   - register: POST /api/ambulance/register (NOT POST /api/ambulance)
//
// Backend AmbulanceController (/api/ambulance/*):
//   GET   /api/ambulance/available
//   GET   /api/ambulance/nearest?lat=&lng=
//   GET   /api/ambulance
//   GET   /api/ambulance/{id}
//   GET   /api/ambulance/my               (driver's own)
//   PATCH /api/ambulance/my/location      (driver updates location)
//   PATCH /api/ambulance/my/status?status= (driver updates status)
//   POST  /api/ambulance/register
//   GET   /api/ambulance/location/{ambulanceId}
// ─────────────────────────────────────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AmbulanceResponse, AmbulanceLocationResponse,
  AmbulanceRegisterRequest, LocationUpdateRequest,
  ApiResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class AmbulanceService {
  private base = `${environment.apiUrl}/ambulance`;

  constructor(private http: HttpClient) {}

  // ══ PUBLIC ════════════════════════════════════════════════

  // GET /api/ambulance/available
  getAvailable(): Observable<ApiResponse<AmbulanceResponse[]>> {
    return this.http.get<ApiResponse<AmbulanceResponse[]>>(`${this.base}/available`);
  }

  // GET /api/ambulance/nearest?lat=&lng=
  getNearest(lat: number, lng: number): Observable<ApiResponse<AmbulanceResponse[]>> {
    const params = new HttpParams().set('lat', lat).set('lng', lng);
    return this.http.get<ApiResponse<AmbulanceResponse[]>>(`${this.base}/nearest`, { params });
  }

  // GET /api/ambulance
  getAll(): Observable<ApiResponse<AmbulanceResponse[]>> {
    return this.http.get<ApiResponse<AmbulanceResponse[]>>(`${this.base}`);
  }

  // GET /api/ambulance/{id}
  getById(id: number): Observable<ApiResponse<AmbulanceResponse>> {
    return this.http.get<ApiResponse<AmbulanceResponse>>(`${this.base}/${id}`);
  }

  // GET /api/ambulance/location/{ambulanceId}
  getLastLocation(ambulanceId: number): Observable<ApiResponse<AmbulanceLocationResponse>> {
    return this.http.get<ApiResponse<AmbulanceLocationResponse>>(
      `${this.base}/location/${ambulanceId}`
    );
  }

  // ══ AMBULANCE DRIVER (JWT required) ══════════════════════

  // GET /api/ambulance/my
  // FIX: was /api/ambulance/driver/my
  getMyAmbulance(): Observable<ApiResponse<AmbulanceResponse>> {
    return this.http.get<ApiResponse<AmbulanceResponse>>(`${this.base}/my`);
  }

  // PATCH /api/ambulance/my/location
  // FIX: was /api/ambulance/driver/location
  updateMyLocation(loc: LocationUpdateRequest): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(`${this.base}/my/location`, loc);
  }

  // PATCH /api/ambulance/my/status?status=
  // FIX: was /api/ambulance/driver/status with body; backend uses query param
  updateMyStatus(status: 'AVAILABLE' | 'OFFLINE'): Observable<ApiResponse<string>> {
    const params = new HttpParams().set('status', status);
    return this.http.patch<ApiResponse<string>>(`${this.base}/my/status`, null, { params });
  }

  // POST /api/ambulance/register
  // FIX: was POST /api/ambulance (bare) — backend uses /register path
  register(body: AmbulanceRegisterRequest): Observable<ApiResponse<AmbulanceResponse>> {
    return this.http.post<ApiResponse<AmbulanceResponse>>(`${this.base}/register`, body);
  }

  // ── Legacy aliases ────────────────────────────────────────
  /** @deprecated use getLastLocation */
  getLocation(ambulanceId: number) { return this.getLastLocation(ambulanceId); }
  /** @deprecated use updateMyLocation */
  updateMyLocationLegacy(loc: LocationUpdateRequest) { return this.updateMyLocation(loc); }
}
