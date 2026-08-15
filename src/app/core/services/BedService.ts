import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BedRequest, BedAssignRequest, ExpectedDischargeRequest,
  BedResponse, BedStatsResponse, ApiResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class BedService {
  private base = `${environment.apiUrl}/beds`;
  constructor(private http: HttpClient) {}

  // POST /api/beds
  addBed(data: BedRequest): Observable<ApiResponse<BedResponse>> {
    return this.http.post<ApiResponse<BedResponse>>(this.base, data);
  }

  // GET /api/beds/clinic/{clinicId}
  getClinicBeds(clinicId: number): Observable<ApiResponse<BedResponse[]>> {
    return this.http.get<ApiResponse<BedResponse[]>>(`${this.base}/clinic/${clinicId}`);
  }

  // GET /api/beds/clinic/{clinicId}/stats
  getBedStats(clinicId: number): Observable<ApiResponse<BedStatsResponse>> {
    return this.http.get<ApiResponse<BedStatsResponse>>(`${this.base}/clinic/${clinicId}/stats`);
  }

  // PUT /api/beds/{bedId}/admit
  admitPatient(bedId: number, data: BedAssignRequest): Observable<ApiResponse<BedResponse>> {
    return this.http.put<ApiResponse<BedResponse>>(`${this.base}/${bedId}/admit`, data);
  }

  // PUT /api/beds/{bedId}/expected-discharge
  updateExpectedDischarge(bedId: number, data: ExpectedDischargeRequest): Observable<ApiResponse<BedResponse>> {
    return this.http.put<ApiResponse<BedResponse>>(`${this.base}/${bedId}/expected-discharge`, data);
  }

  // PUT /api/beds/{bedId}/discharge
  dischargePatient(bedId: number): Observable<ApiResponse<BedResponse>> {
    return this.http.put<ApiResponse<BedResponse>>(`${this.base}/${bedId}/discharge`, {});
  }
}