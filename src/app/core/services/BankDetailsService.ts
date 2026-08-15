import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, BankDetailsRequest, BankDetailsResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class BankDetailsService {
  private base = `${environment.apiUrl}/doctors/bank-details`;

  constructor(private http: HttpClient) {}

  submitBankDetails(req: BankDetailsRequest): Observable<ApiResponse<BankDetailsResponse>> {
    return this.http.post<ApiResponse<BankDetailsResponse>>(this.base, req);
  }

  getMyBankDetails(): Observable<ApiResponse<BankDetailsResponse>> {
    return this.http.get<ApiResponse<BankDetailsResponse>>(`${this.base}/me`);
  }

  refreshKycStatus(): Observable<ApiResponse<BankDetailsResponse>> {
    return this.http.post<ApiResponse<BankDetailsResponse>>(`${this.base}/refresh-status`, {});
  }
}