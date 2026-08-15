// ─────────────────────────────────────────────────────────────
// notification.service.ts — fixed to match Solvixon backend
// Backend NotificationController (/api/notifications/*):
//   POST /api/notifications/send
//   GET  /api/notifications/status
//   GET  /api/notifications/test?phone=
// ─────────────────────────────────────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { NotificationRequest, ApiResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private base = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  // POST /api/notifications/send
  send(payload: NotificationRequest): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${this.base}/send`, payload);
  }

  // GET /api/notifications/status
  getStatus(): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.base}/status`);
  }

  // GET /api/notifications/test?phone=
  testNotification(phone: string): Observable<ApiResponse<string>> {
    const params = new HttpParams().set('phone', phone);
    return this.http.get<ApiResponse<string>>(`${this.base}/test`, { params });
  }
}
