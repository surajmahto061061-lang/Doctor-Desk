// ─────────────────────────────────────────────────────────────
// patient-record.service.ts — NEW service (was missing entirely)
// Backend PatientRecordController (/api/patient-records/*):
//   POST   /api/patient-records
//   GET    /api/patient-records/patient/{patientId}
//   GET    /api/patient-records/patient/{patientId}/type/{type}
//   DELETE /api/patient-records/{recordId}
// ─────────────────────────────────────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PatientRecordRequest, PatientRecordResponse, ApiResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class PatientRecordService {
  private base = `${environment.apiUrl}/patient-records`;

  constructor(private http: HttpClient) {}

  // ── POST /api/patient-records ─────────────────────────────
  addRecord(req: PatientRecordRequest): Observable<ApiResponse<PatientRecordResponse>> {
    return this.http.post<ApiResponse<PatientRecordResponse>>(`${this.base}`, req);
  }

  // ── GET /api/patient-records/patient/{patientId} ──────────
  getPatientHistory(patientId: number): Observable<ApiResponse<PatientRecordResponse[]>> {
    return this.http.get<ApiResponse<PatientRecordResponse[]>>(
      `${this.base}/patient/${patientId}`
    );
  }

  // ── GET /api/patient-records/patient/{patientId}/type/{type} ─
  getPatientHistoryByType(patientId: number, type: string): Observable<ApiResponse<PatientRecordResponse[]>> {
    return this.http.get<ApiResponse<PatientRecordResponse[]>>(
      `${this.base}/patient/${patientId}/type/${type}`
    );
  }

  // ── DELETE /api/patient-records/{recordId} ────────────────
  deleteRecord(recordId: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.base}/${recordId}`);
  }
}
