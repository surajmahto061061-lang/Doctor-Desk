// ─────────────────────────────────────────────────────────────
// lab-test.service.ts — NEW service
// Backend LabTestController (/api/lab-tests/*):
//   POST /api/lab-tests
//   GET  /api/lab-tests/patient/{patientId}
//   GET  /api/lab-tests/clinic/{clinicId}
//   PUT  /api/lab-tests/{testId}/status?status=
//   PUT  /api/lab-tests/{testId}/result
// ─────────────────────────────────────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LabTestRequest, LabTestResultRequest, LabTestResponse, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class LabTestService {
  private base = `${environment.apiUrl}/lab-tests`;

  constructor(private http: HttpClient) {}

  orderTest(req: LabTestRequest): Observable<ApiResponse<LabTestResponse>> {
    return this.http.post<ApiResponse<LabTestResponse>>(`${this.base}`, req);
  }

  getPatientTests(patientId: number): Observable<ApiResponse<LabTestResponse[]>> {
    return this.http.get<ApiResponse<LabTestResponse[]>>(`${this.base}/patient/${patientId}`);
  }

  getClinicTests(clinicId: number): Observable<ApiResponse<LabTestResponse[]>> {
    return this.http.get<ApiResponse<LabTestResponse[]>>(`${this.base}/clinic/${clinicId}`);
  }

  updateStatus(testId: number, status: string): Observable<ApiResponse<LabTestResponse>> {
    const params = new HttpParams().set('status', status);
    return this.http.put<ApiResponse<LabTestResponse>>(
      `${this.base}/${testId}/status`, null, { params }
    );
  }

  addResult(testId: number, req: LabTestResultRequest): Observable<ApiResponse<LabTestResponse>> {
    return this.http.put<ApiResponse<LabTestResponse>>(`${this.base}/${testId}/result`, req);
  }
}
