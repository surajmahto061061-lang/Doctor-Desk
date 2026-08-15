import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AmbulanceService } from '../../../core/services/ambulance.service';
import { BookingService } from '../../../core/services/booking.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { WebSocketService } from '../../../core/services/websocket.service';
import { Ambulance, AmbulanceBooking } from '../../../core/models';

@Component({
  selector: 'app-ambulance-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-container">

      <div class="page-header">
        <h2>🚑 Driver Dashboard</h2>
        <p>Welcome, {{ auth.user()?.name }}. Manage your ambulance status and active bookings.</p>
      </div>

      <!-- Status card -->
      <div class="status-card" *ngIf="ambulance">
        <div class="status-left">
          <div class="vehicle-num">{{ ambulance.vehicleNumber || '—' }}</div>
          <div class="vehicle-meta">
            <span class="vehicle-badge">{{ ambulance.type || 'Ambulance' }}</span>
            @if (ambulance.id) { <span class="vehicle-badge">ID #{{ ambulance.id }}</span> }
          </div>
          <div class="vehicle-driver">
            👤 {{ auth.user()?.name }}
            @if (ambulance.driverPhone) { · 📞 {{ ambulance.driverPhone }} }
          </div>
        </div>
        <div class="status-right">
          <span class="status-badge"
            [class.available]="ambulance.status === 'AVAILABLE'"
            [class.busy]="['DISPATCHED','EN_ROUTE','AT_SCENE','TRANSPORTING'].includes(ambulance.status)"
            [class.offline]="ambulance.status === 'OFFLINE'">
            {{ ambulance.status }}
          </span>
          <div class="status-actions">
            <button class="btn btn-sm btn-success" *ngIf="ambulance.status !== 'AVAILABLE'" [disabled]="updatingStatus" (click)="setStatus('AVAILABLE')">🟢 Go Online</button>
            <button class="btn btn-sm btn-danger"  *ngIf="ambulance.status === 'AVAILABLE'" [disabled]="updatingStatus" (click)="setStatus('OFFLINE')">⚫ Go Offline</button>
          </div>
        </div>
      </div>

      <div *ngIf="loadingAmbulance" class="loading-state">Loading ambulance info…</div>
      <div *ngIf="!loadingAmbulance && !ambulance" class="empty-state">
        <p>No ambulance assigned to your account. Contact admin.</p>
      </div>

      <!-- GPS location push -->
      <div class="section-card" *ngIf="ambulance">
        <div class="section-header">
          <h3>📍 Location</h3>
          <div class="ws-indicator" [class.connected]="wsConnected">
            <span class="ws-dot"></span>{{ wsConnected ? 'WebSocket connected' : 'WebSocket disconnected' }}
          </div>
        </div>
        <div class="location-row">
          <div class="loc-field">
            <label>Latitude</label>
            <input type="number" step="0.0001" [(ngModel)]="lat" class="form-control" placeholder="25.6093" />
          </div>
          <div class="loc-field">
            <label>Longitude</label>
            <input type="number" step="0.0001" [(ngModel)]="lng" class="form-control" placeholder="85.1376" />
          </div>
          <button class="btn btn-primary" [disabled]="pushingLoc" (click)="pushLocation()">
            {{ pushingLoc ? 'Sending…' : 'Push GPS' }}
          </button>
          <button class="btn btn-ghost" (click)="getGPS()">Use My Location</button>
        </div>
        <p class="hint" *ngIf="lastPushed">Last pushed: {{ lastPushed }}</p>
      </div>

      <!-- Active & history bookings -->
      <div class="section-card">
        <div class="section-header">
          <h3>📋 My Bookings</h3>
          <button class="btn btn-ghost btn-sm" (click)="loadBookings()">↻ Refresh</button>
        </div>

        <div *ngIf="loadingBookings" class="loading-state">Loading…</div>

        <div *ngIf="!loadingBookings && bookings.length === 0" class="empty-state">
          No bookings yet.
        </div>

        <div class="booking-list" *ngIf="!loadingBookings && bookings.length > 0">
          <div class="booking-item" *ngFor="let b of bookings">
            <div class="booking-info">
              <div class="booking-id">🆔 Booking #{{ b.id }}</div>
              <div class="booking-addr">👤 {{ b.patientName }} · 📞 {{ b.patientPhone }}</div>
              <div class="booking-addr">📍 {{ b.pickupAddress || 'No pickup address' }}</div>
              @if (b.dropAddress) { <div class="booking-addr text-sm">→ {{ b.dropAddress }}</div> }
              @if (b.emergencyType) { <div class="booking-coords">🚨 {{ b.emergencyType }}</div> }
              @if (b.estimatedArrivalMinutes) { <div class="booking-coords">⏱️ ETA: {{ b.estimatedArrivalMinutes }} min</div> }
              @if (b.fare) { <div class="booking-coords">💰 ₹{{ b.fare }}</div> }
            </div>
            <span class="status-badge" [class.available]="b.status === 'COMPLETED'" [class.busy]="b.status === 'DISPATCHED'" [class.offline]="b.status === 'CANCELLED'">
              {{ b.status || 'PENDING' }}
            </span>
          </div>
        </div>

        <!-- Pagination -->
        <div class="pagination" *ngIf="totalPages > 1">
          <button class="btn btn-ghost btn-sm" [disabled]="page === 0" (click)="loadBookings(page - 1)">← Prev</button>
          <span>{{ page + 1 }} / {{ totalPages }}</span>
          <button class="btn btn-ghost btn-sm" [disabled]="page >= totalPages - 1" (click)="loadBookings(page + 1)">Next →</button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .page-container { max-width: 860px; margin: 0 auto; padding: 2rem 1rem; }
    .page-header { margin-bottom: 1.5rem; }
    .page-header h2 { font-size: 22px; font-weight: 500; margin: 0 0 4px; }
    .page-header p { color: #666; margin: 0; }

    .status-card { background: #fff; border: 0.5px solid #ddd; border-radius: 12px; padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .vehicle-num { font-size: 20px; font-weight: 500; margin-bottom:4px; }
    .vehicle-meta { display:flex; gap:6px; margin-bottom:4px; }
    .vehicle-badge { font-size:11px; padding:2px 8px; border-radius:10px; background:#f5f5f5; color:#555; border:1px solid #e0e0e0; }
    .vehicle-driver { font-size:13px; color:#666; }
    .status-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
    .status-actions { display: flex; gap: 8px; }

    .status-badge { font-size: 12px; font-weight: 500; padding: 3px 10px; border-radius: 6px; }
    .available { background: #EAF3DE; color: #3B6D11; }
    .busy { background: #FAEEDA; color: #854F0B; }
    .offline { background: #F1EFE8; color: #5F5E5A; }

    .section-card { background: #fff; border: 0.5px solid #ddd; border-radius: 12px; padding: 1.25rem 1.5rem; margin-bottom: 1rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .section-header h3 { font-size: 16px; font-weight: 500; margin: 0; }

    .ws-indicator { font-size: 12px; color: #888; display: flex; align-items: center; gap: 6px; }
    .ws-dot { width: 8px; height: 8px; border-radius: 50%; background: #ccc; }
    .ws-indicator.connected .ws-dot { background: #3B6D11; }
    .ws-indicator.connected { color: #3B6D11; }

    .location-row { display: flex; gap: 10px; align-items: flex-end; flex-wrap: wrap; }
    .loc-field { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 120px; }
    .loc-field label { font-size: 13px; color: #666; }
    .hint { font-size: 12px; color: #888; margin: 8px 0 0; }
    .form-control { padding: 8px 10px; border: 0.5px solid #ddd; border-radius: 8px; font-size: 14px; width: 100%; box-sizing: border-box; }

    .booking-list { display: flex; flex-direction: column; gap: 8px; }
    .booking-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border: 0.5px solid #eee; border-radius: 8px; }
    .booking-id { font-weight: 500; font-size: 14px; }
    .booking-addr { font-size: 13px; color: #666; margin-top: 2px; }
    .booking-coords { font-size: 12px; color: #888; margin-top: 2px; }

    .pagination { display: flex; gap: 8px; align-items: center; justify-content: center; margin-top: 1rem; font-size: 14px; }
    .loading-state, .empty-state { text-align: center; padding: 2rem; color: #888; font-size: 14px; }

    .btn { padding: 8px 14px; border-radius: 8px; border: 0.5px solid #ddd; cursor: pointer; font-size: 14px; background: transparent; transition: background 0.15s; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-primary { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }
    .btn-primary:hover:not(:disabled) { background: #333; }
    .btn-ghost:hover:not(:disabled) { background: #f5f5f5; }
    .btn-success { background: #EAF3DE; color: #3B6D11; border-color: #C0DD97; }
    .btn-danger  { background: #FCEBEB; color: #A32D2D; border-color: #F7C1C1; }
    .btn-sm { padding: 5px 10px; font-size: 13px; }
  `]
})
export class AmbulanceDashboardComponent implements OnInit, OnDestroy {
  auth   = inject(AuthService);
  private ambSvc   = inject(AmbulanceService);
  private bookSvc  = inject(BookingService);
  private toast    = inject(ToastService);
  private wsSvc    = inject(WebSocketService);

  ambulance: Ambulance | null = null;
  loadingAmbulance = true;
  updatingStatus = false;

  lat: number | null = null;
  lng: number | null = null;
  pushingLoc = false;
  lastPushed = '';
  wsConnected = false;

  bookings: AmbulanceBooking[] = [];
  loadingBookings = true;
  page = 0;
  totalPages = 1;

  private wsSub?: Subscription;
  private wsCheckInterval?: Subscription;

  ngOnInit() {
    this.loadAmbulance();
    this.loadBookings();
    // Connect WebSocket for real-time location broadcast
    this.wsSvc.connect();
    // Poll WS connection status
    this.wsCheckInterval = interval(2000).subscribe(() => {
      this.wsConnected = this.wsSvc.isConnected();
    });
    // Subscribe to incoming location updates (useful when multiple drivers are visible)
    this.wsSub = this.wsSvc.locationUpdates$.subscribe(() => {
      // Could update a map marker here in future
    });
  }

  ngOnDestroy() {
    this.wsSub?.unsubscribe();
    this.wsCheckInterval?.unsubscribe();
    // Don't disconnect WS here — other components may use it
  }

  loadAmbulance() {
    this.loadingAmbulance = true;
    this.ambSvc.getMyAmbulance().subscribe({
      next: a  => { this.ambulance = a.data || null; this.loadingAmbulance = false; },
      error: () => { this.loadingAmbulance = false; }
    });
  }

  setStatus(status: 'AVAILABLE' | 'OFFLINE') {
    this.updatingStatus = true;
    this.ambSvc.updateMyStatus(status).subscribe({
      next: r => {
        // Backend returns ApiResponse<String> not AmbulanceResponse — update locally
        if (this.ambulance) this.ambulance = { ...this.ambulance, status };
        this.toast.success(`Status updated to ${status}`);
        this.updatingStatus = false;
      },
      error: e => { this.toast.error(e?.error?.message || 'Update failed'); this.updatingStatus = false; }
    });
  }

  getGPS() {
    navigator.geolocation?.getCurrentPosition(
      pos => { this.lat = +pos.coords.latitude.toFixed(6); this.lng = +pos.coords.longitude.toFixed(6); },
      () => this.toast.error('Could not get location. Enable GPS.')
    );
  }

  pushLocation() {
    if (this.lat == null || this.lng == null) { this.toast.error('Enter latitude and longitude first'); return; }
    if (!this.ambulance) return;
    this.pushingLoc = true;
    const loc = { latitude: this.lat, longitude: this.lng };

    // FIX: Push via PATCH /api/ambulance/my/location (REST — persisted to backend)
    this.ambSvc.updateMyLocation(loc).subscribe({
      next: () => {
        // Broadcast via WebSocket for real-time — ambulanceId is number (Long)
        this.wsSvc.publishAmbulanceLocation({ ...loc, ambulanceId: this.ambulance!.id });
        this.lastPushed = new Date().toLocaleTimeString();
        this.toast.success('Location pushed');
        this.pushingLoc = false;
      },
      error: e => { this.toast.error(e?.error?.message || 'Push failed'); this.pushingLoc = false; }
    });
  }

  loadBookings(p = 0) {
    this.loadingBookings = true;
    this.page = p;
    this.bookSvc.getMyAmbulanceBookings(p, 10).subscribe({
      next: res => {
        this.bookings    = res.data?.content || [];
        this.totalPages  = res.data?.totalPages || 1;
        this.loadingBookings = false;
      },
      error: () => { this.bookings = []; this.loadingBookings = false; }
    });
  }
}