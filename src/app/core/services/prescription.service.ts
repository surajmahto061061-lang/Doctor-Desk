// ─────────────────────────────────────────────────────────────
// prescription.service.ts — NEW service
// Backend PrescriptionController (/api/prescriptions/*):
//   POST /api/prescriptions
//   GET  /api/prescriptions/patient/{patientId}
//   GET  /api/prescriptions/doctor/{doctorId}
//   PUT  /api/prescriptions/{prescriptionId}/follow-up-done
// ─────────────────────────────────────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PrescriptionRequest, PrescriptionResponse, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class PrescriptionService {
  private base = `${environment.apiUrl}/prescriptions`;

  constructor(private http: HttpClient) {}

  create(req: PrescriptionRequest): Observable<ApiResponse<PrescriptionResponse>> {
    return this.http.post<ApiResponse<PrescriptionResponse>>(`${this.base}`, req);
  }

  getPatientPrescriptions(patientId: number): Observable<ApiResponse<PrescriptionResponse[]>> {
    return this.http.get<ApiResponse<PrescriptionResponse[]>>(`${this.base}/patient/${patientId}`);
  }

  getDoctorPrescriptions(doctorId: number): Observable<ApiResponse<PrescriptionResponse[]>> {
    return this.http.get<ApiResponse<PrescriptionResponse[]>>(`${this.base}/doctor/${doctorId}`);
  }

  markFollowUpDone(prescriptionId: number): Observable<ApiResponse<PrescriptionResponse>> {
    return this.http.put<ApiResponse<PrescriptionResponse>>(
      `${this.base}/${prescriptionId}/follow-up-done`, {}
    );
  }
}
