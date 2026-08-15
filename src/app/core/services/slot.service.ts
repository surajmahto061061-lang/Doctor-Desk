// ─────────────────────────────────────────────────────────────
// slot.service.ts — NEW service for /api/slots/* controller
// Backend SlotController:
//   GET /api/slots/{doctorId}/available?date=YYYY-MM-DD
//   GET /api/slots/{doctorId}/free?date=YYYY-MM-DD
//   GET /api/slots/{doctorId}/summary?date=YYYY-MM-DD
// ─────────────────────────────────────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, SlotResponse, SlotSummaryResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class SlotService {
  private base = `${environment.apiUrl}/slots`;

  constructor(private http: HttpClient) {}

  // BUG FIX: backend's SlotResponse actually returns { id, startTime, endTime,
  // isBooked, isAvailable, ... } — it has NO `time` or `available` field.
  // The UI reads `s.time` and `s.available`, which were always `undefined` on
  // real data → every slot button rendered blank + disabled, so a patient could
  // never actually select a real slot. We normalize the shape here, once, so
  // every caller gets the fields the UI actually expects.
  private normalize(raw: any): SlotResponse {
    return {
      id: raw.id,
      time: this.formatTime(raw.startTime),
      available: !!raw.isAvailable && !raw.isBooked,
      isBooked: !!raw.isBooked,
    };
  }

  private formatTime(hms: string): string {
    if (!hms) return '';
    const [hStr, mStr] = hms.split(':');
    let h = parseInt(hStr, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${mStr} ${suffix}`;
  }

  // GET /api/slots/{doctorId}/available?date=YYYY-MM-DD
  // Returns all slots (booked + free) for a doctor on a date
  getAllSlots(doctorId: number, date: string): Observable<ApiResponse<SlotResponse[]>> {
    const params = new HttpParams().set('date', date);
    return this.http.get<ApiResponse<any[]>>(
      `${this.base}/${doctorId}/available`, { params }
    ).pipe(map(res => ({ ...res, data: (res.data || []).map(s => this.normalize(s)) })));
  }

  // GET /api/slots/{doctorId}/free?date=YYYY-MM-DD
  // Returns only unbooked slots
  getFreeSlots(doctorId: number, date: string): Observable<ApiResponse<SlotResponse[]>> {
    const params = new HttpParams().set('date', date);
    return this.http.get<ApiResponse<any[]>>(
      `${this.base}/${doctorId}/free`, { params }
    ).pipe(map(res => ({ ...res, data: (res.data || []).map(s => this.normalize(s)) })));
  }

  // GET /api/slots/{doctorId}/summary?date=YYYY-MM-DD
  // Returns booked/free count per hour
  getSlotSummary(doctorId: number, date: string): Observable<ApiResponse<SlotSummaryResponse[]>> {
    const params = new HttpParams().set('date', date);
    return this.http.get<ApiResponse<SlotSummaryResponse[]>>(
      `${this.base}/${doctorId}/summary`, { params }
    );
  }
}