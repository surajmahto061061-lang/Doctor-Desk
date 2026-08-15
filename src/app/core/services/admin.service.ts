import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, AdminDoctorEntry, AdminAmbulanceEntry, ApprovalRequest } from '../models';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private admin = `${environment.apiUrl}/auth/admin`;
  private amb   = `${environment.apiUrl}/ambulance`;

  constructor(private http: HttpClient) {}

  getDoctors(status?: 'PENDING' | 'APPROVED' | 'REJECTED'): Observable<ApiResponse<AdminDoctorEntry[]>> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http.get<ApiResponse<AdminDoctorEntry[]>>(`${this.admin}/doctors`, { params });
  }

  updateDoctorApproval(userId: number, req: ApprovalRequest): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.admin}/doctors/${userId}/approval`, req);
  }

  // deleteDoctorByUserId was removed — AdminController has no DELETE /doctors/{userId}
  // endpoint on the backend. Use updateDoctorApproval(id, { status: 'REJECTED' }) instead,
  // which is what admin.component.ts's deleteDoctor() now does.

  getAmbulanceDrivers(): Observable<ApiResponse<AdminAmbulanceEntry[]>> {
    return this.http.get<ApiResponse<AdminAmbulanceEntry[]>>(`${this.admin}/ambulances`);
  }

  getAllAmbulances(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.amb}`);
  }

  registerAmbulance(data: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.amb}/register`, data);
  }

  markAmbulanceAvailable(id?: number): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(`${this.amb}/my/status`, null, { params: { status: 'AVAILABLE' } });
  }

  deactivateAmbulance(id?: number): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(`${this.amb}/my/status`, null, { params: { status: 'OFFLINE' } });
  }

  markAmbulanceOffline(): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(`${this.amb}/my/status`, null, { params: { status: 'OFFLINE' } });
  }
}
