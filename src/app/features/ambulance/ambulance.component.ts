import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AmbulanceService } from '../../core/services/ambulance.service';
import { BookingService } from '../../core/services/booking.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { RouterLink } from '@angular/router';
import { Ambulance, AmbulanceBooking, AmbulanceLocation } from '../../core/models';
import { WebSocketService } from '../../core/services/websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-ambulance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-container">

      <!-- Header -->
      <div class="page-header">
        <h2>🚑 Emergency Ambulance</h2>
        <p>Request immediate medical transport or find the nearest available unit</p>
      </div>

      <!-- Emergency CTA -->
      <div class="emergency-banner">
        <div class="emergency-left">
          <div class="emergency-icon">🆘</div>
          <div>
            <div class="emergency-title">Need emergency help?</div>
            <div class="emergency-sub">Our dispatchers are available 24/7. Request an ambulance instantly.</div>
          </div>
        </div>
        <button class="btn btn-danger btn-lg" (click)="openRequestModal()" style="background:#E24B4A;border-color:#E24B4A;color:#fff">
          Request ambulance now
        </button>
      </div>

      <!-- Tabs -->
      <div class="tab-nav">
        <button class="tab-btn" [class.active]="tab==='available'" (click)="tab='available'">Available units</button>
        <button class="tab-btn" [class.active]="tab==='nearest'"   (click)="findNearest()">Find nearest</button>
        @if (auth.isLoggedIn()) {
          <button class="tab-btn" [class.active]="tab==='history'"  (click)="loadHistory(); tab='history'">My bookings</button>
        }
      </div>

      <!-- Available units -->
      @if (tab === 'available') {
        <div class="tab-toolbar">
          <span class="text-sm text-muted">{{ ambulances.length }} units available</span>
          <button class="btn btn-ghost btn-sm" (click)="loadAvailable()">↻ Refresh</button>
        </div>
        @if (loading) {
          <div class="loading-wrap"><div class="spinner spinner-lg"></div><p>Scanning nearby units…</p></div>
        } @else if (ambulances.length) {
          <div class="grid-2">
            @for (a of ambulances; track a.id) {
              <div class="amb-card card">
                <div class="amb-top">
                  <div class="amb-icon">🚑</div>
                  <div class="amb-info">
                    <div class="amb-number">{{ a.vehicleNumber || 'AMB-' + a.id }}</div>
                    <div class="amb-driver text-sm text-muted">{{ a.driverName || 'Driver' }}</div>
                  </div>
                  <span class="badge" [class]="a.status === 'AVAILABLE' ? 'badge-green' : 'badge-amber'">
                    {{ a.status }}
                  </span>
                </div>
                <div class="amb-details">
                  <span class="detail-chip">{{ a.type || 'Basic Life Support' }}</span>
                  @if (a.distanceKm) {
                    <span class="detail-chip">📍 {{ (a.distanceKm).toFixed(1) }} km away</span>
                  }
                  @if (a.driverPhone) {
                    <span class="detail-chip">📞 {{ a.driverPhone }}</span>
                  }
                </div>
                <button class="btn btn-primary btn-block" (click)="requestSpecific(a)"
                  [disabled]="a.status !== 'AVAILABLE' || requestingId === a.id">
                  @if (requestingId === a.id) { <span class="spinner spinner-sm"></span> Requesting… }
                  @else { Request this unit }
                </button>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-icon">🚑</div>
            <h3>No units available right now</h3>
            <p>All ambulances are currently busy. Please call emergency services or try again shortly.</p>
            <a class="btn btn-danger" href="tel:102">📞 Call 102 (Emergency)</a>
          </div>
        }
      }

      <!-- Nearest -->
      @if (tab === 'nearest') {
        @if (locationLoading) {
          <div class="loading-wrap"><div class="spinner spinner-lg"></div><p>Getting your location…</p></div>
        } @else if (locationError) {
          <div class="alert alert-error">{{ locationError }}</div>
        } @else if (ambulances.length) {
          <div class="location-info text-sm text-muted mb-16">
            📍 Showing nearest units to your location ({{ userLat?.toFixed(4) }}, {{ userLng?.toFixed(4) }})
          </div>
          <div class="grid-2">
            @for (a of ambulances; track a.id) {
              <div class="amb-card card">
                <div class="amb-top">
                  <div class="amb-icon">🚑</div>
                  <div class="amb-info">
                    <div class="amb-number">{{ a.vehicleNumber || 'AMB-' + a.id }}</div>
                    <div class="amb-driver text-sm text-muted">{{ a.driverName || 'Driver' }}</div>
                  </div>
                  <span class="badge badge-green">{{ a.distanceKm ? (a.distanceKm).toFixed(1) + ' km' : 'Nearby' }}</span>
                </div>
                <button class="btn btn-primary btn-block" (click)="requestSpecific(a)" [disabled]="requestingId === a.id">
                  @if (requestingId === a.id) { <span class="spinner spinner-sm"></span> } @else { Request }
                </button>
              </div>
            }
          </div>
        }
      }

      <!-- History -->
      @if (tab === 'history') {
        @if (historyLoading) {
          <div class="loading-wrap"><div class="spinner spinner-lg"></div><p>Loading history…</p></div>
        } @else if (history.length) {
          <div class="appt-list">
            @for (b of history; track b.id) {
              <div class="appt-item">
                <div class="amb-icon-sm">🚑</div>
                <div class="appt-item-info">
                  <div class="appt-item-name">Booking #{{ b.id }}</div>
                  <div class="appt-item-meta">
                    {{ b.createdAt | date:'medium' }}
                    @if (b.pickupAddress) { · {{ b.pickupAddress }} }
                  </div>
                </div>
                <span class="badge badge-gray">{{ b.status || 'REQUESTED' }}</span>
              </div>
            }
          </div>
        } @else {
          <div class="empty-state">
            <div class="empty-icon">🚑</div>
            <h3>No ambulance bookings</h3>
            <p>Your ambulance request history will appear here</p>
          </div>
        }
      }
    </div>

    <!-- Request modal -->
    @if (showModal) {
      <div class="modal-overlay" (click)="showModal=false">
        <div class="modal-box" (click)="$event.stopPropagation()">
          <button class="modal-close" (click)="showModal=false">✕</button>
          <h3>Request ambulance</h3>
          <p style="margin-bottom:20px">Fill in your pickup details for fastest dispatch</p>

          @if (!auth.isLoggedIn()) {
            <div class="alert alert-warning">
              Please <a routerLink="/auth/login">sign in</a> to request an ambulance, or call 102 directly.
            </div>
          }

          <div class="form-group">
            <label>Pickup address</label>
            <input class="form-control" [(ngModel)]="pickupAddress" placeholder="Full address with landmark…">
          </div>
          <div class="form-group">
            <label>Emergency description</label>
            <textarea class="form-control" [(ngModel)]="emergencyDesc" rows="3" placeholder="Describe the emergency briefly…"></textarea>
          </div>
          <div class="form-group">
            <label>
              <input type="checkbox" [(ngModel)]="useGps" (change)="getLocation()">
              Use my GPS location
            </label>
          </div>
          @if (userLat) {
            <div class="alert alert-info text-sm">📍 Location captured: {{ userLat.toFixed(5) }}, {{ userLng?.toFixed(5) }}</div>
          }

          <div class="modal-footer" style="margin-top:20px">
            <button class="btn btn-ghost" (click)="showModal=false">Cancel</button>
            <button class="btn btn-primary" style="background:#E24B4A;border-color:#E24B4A"
              (click)="submitRequest()" [disabled]="!auth.isLoggedIn() || requestingId === -1">
              @if (requestingId === -1) { <span class="spinner spinner-sm"></span> Dispatching… }
              @else { 🚑 Request now }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .emergency-banner {
      background: linear-gradient(135deg,#FCEBEB,#FDE8E8);
      border:1px solid #F7C1C1; border-radius:var(--radius-lg);
      padding:20px 24px; display:flex; align-items:center;
      justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:28px;
    }
    .emergency-left { display:flex; align-items:center; gap:16px; }
    .emergency-icon { font-size:36px; }
    .emergency-title { font-size:16px; font-weight:600; color:#A32D2D; margin-bottom:4px; }
    .emergency-sub   { font-size:14px; color:#C0444C; }
    .tab-nav { display:flex; gap:4px; border-bottom:1px solid var(--border); margin-bottom:20px; flex-wrap:wrap; }
    .tab-btn {
      padding:10px 16px; font-size:14px; background:none; border:none;
      border-bottom:2px solid transparent; cursor:pointer; color:var(--text-2); font-family:inherit; margin-bottom:-1px;
      &.active { color:var(--primary); border-bottom-color:var(--primary); font-weight:500; }
      &:hover:not(.active) { color:var(--text); background:var(--surface-2); }
    }
    .tab-toolbar { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
    .mb-16 { margin-bottom:16px; }
    .amb-card { display:flex; flex-direction:column; gap:12px; }
    .amb-top  { display:flex; align-items:center; gap:12px; }
    .amb-icon { font-size:28px; }
    .amb-info { flex:1; }
    .amb-number { font-size:15px; font-weight:600; }
    .amb-details { display:flex; gap:8px; flex-wrap:wrap; }
    .detail-chip { font-size:12px; padding:3px 10px; border-radius:20px; background:var(--surface-2); color:var(--text-2); border:1px solid var(--border); }
    .appt-list { display:flex; flex-direction:column; gap:10px; }
    .amb-icon-sm { font-size:22px; }
    .modal-footer { display:flex; gap:10px; justify-content:flex-end; }
  `]
})
export class AmbulanceComponent implements OnInit, OnDestroy {
  auth               = inject(AuthService);
  private ambSvc     = inject(AmbulanceService);
  private bookingSvc = inject(BookingService);
  private toast      = inject(ToastService);

  tab = 'available';
  ambulances: Ambulance[] = [];
  loading = false;

  // FIX: number | null instead of string. -1 = "any/modal request", null = idle
  requestingId: number | null = null;

  // FIX: added missing wsSub property
  private wsSub?: Subscription;

  history: AmbulanceBooking[] = [];
  historyLoading = false;

  locationLoading = false;
  locationError = '';
  userLat: number | null = null;
  userLng: number | null = null;

  showModal = false;
  pickupAddress = '';
  emergencyDesc = '';
  useGps = false;

  ngOnInit() { this.loadAvailable(); }

  typeLabel(t: string): string {
    const map: Record<string, string> = {
      BASIC: '🚑 Basic Life Support',
      ALS:   '🚨 Advanced Life Support',
      BLS:   '🚑 Basic Life Support',
      ICU:   '🏥 Mobile ICU',
      NEONATAL: '👶 Neonatal',
      AIR:   '✈️ Air Ambulance',
      ADVANCED_LIFE_SUPPORT: '🚨 ALS'
    };
    return map[t] || t || 'Ambulance';
  }

  ngOnDestroy() {
    // FIX: wsSub now exists on the class
    this.wsSub?.unsubscribe();
  }

  loadAvailable() {
    this.loading = true;
    this.ambSvc.getAvailable().subscribe({
      next: a  => { this.ambulances = a.data || []; this.loading = false; },
      error: () => { this.ambulances = this.demoAmbs(); this.loading = false; }
    });
  }

  findNearest() {
    this.tab = 'nearest';
    this.locationLoading = true;
    this.locationError = '';
    if (!navigator.geolocation) { this.locationError = 'Geolocation not supported by this browser.'; this.locationLoading = false; return; }
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.userLat = pos.coords.latitude;
        this.userLng = pos.coords.longitude;
        // Monolith: no /nearest endpoint — get all available, sort by proximity client-side
        this.ambSvc.getAvailable().subscribe({
          next: a  => {
            this.ambulances = (a.data || []).map((amb: any) => ({
              ...amb,
              distanceKm: this.calcDist(this.userLat!, this.userLng!,
                amb.currentLatitude ?? 0, amb.currentLongitude ?? 0)
            })).sort((x: any, y: any) => (x.distanceKm ?? 999) - (y.distanceKm ?? 999));
            this.locationLoading = false;
          },
          error: () => { this.ambulances = this.demoAmbs(); this.locationLoading = false; }
        });
      },
      err => { this.locationError = 'Could not get location: ' + err.message; this.locationLoading = false; }
    );
  }

  getLocation() {
    if (!this.useGps) { this.userLat = null; this.userLng = null; return; }
    navigator.geolocation?.getCurrentPosition(pos => {
      this.userLat = pos.coords.latitude;
      this.userLng = pos.coords.longitude;
    });
  }

  loadHistory() {
    this.historyLoading = true;
    this.bookingSvc.getMyAmbulanceBookings().subscribe({
      next: res => { this.history = res.data?.content || []; this.historyLoading = false; },
      error: () => { this.history = []; this.historyLoading = false; }
    });
  }

  openRequestModal() { this.showModal = true; }

  requestSpecific(a: Ambulance) {
    if (!this.auth.isLoggedIn()) { this.toast.error('Please sign in first'); return; }
    // FIX: a.id is number, requestingId is now number | null
    this.requestingId = a.id;
    this.bookingSvc.requestAmbulance({
      patientName: this.auth.user()?.name || 'Patient',
      patientPhone: this.auth.user()?.phone || '',
      // FIX: required fields added with safe fallbacks
      pickupLatitude: this.userLat ?? 0,
      pickupLongitude: this.userLng ?? 0
    }).subscribe({
      next: () => {
        this.toast.success('Ambulance requested! Dispatch team will contact you.');
        this.requestingId = null;
        this.loadAvailable();
      },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Request failed'); this.requestingId = null; }
    });
  }

  submitRequest() {
    if (!this.auth.isLoggedIn()) return;
    this.requestingId = -1;
    this.bookingSvc.requestAmbulance({
      patientName:     this.auth.user()?.name || 'Patient',
      patientPhone:    this.auth.user()?.phone || '',
      pickupAddress:   this.pickupAddress,
      pickupLatitude:  this.userLat ?? 0,
      pickupLongitude: this.userLng ?? 0
    }).subscribe({
      next: () => {
        this.toast.success('🚑 Ambulance dispatched! Help is on the way.');
        this.showModal = false;
        this.requestingId = null;
        this.tab = 'history';
        this.loadHistory();
      },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Request failed'); this.requestingId = null; }
    });
  }

  calcDist(lat1: number, lng1: number, lat2: number, lng2: number): number {
    if (!lat2 || !lng2) return 999;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
            + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
            * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  demoAmbs(): Ambulance[] {
    return [
      { id: 1, vehicleNumber: 'BH-01-AMB-2024', driverName: 'Rajesh Kumar', driverPhone: '', type: 'ADVANCED_LIFE_SUPPORT', status: 'AVAILABLE', distanceKm: 2.1 },
      { id: 2, vehicleNumber: 'BH-02-AMB-2024', driverName: 'Suresh Pal',   driverPhone: '', type: 'BASIC',                 status: 'AVAILABLE', distanceKm: 3.8 },
      { id: 3, vehicleNumber: 'BH-03-AMB-2024', driverName: 'Mohan Das',    driverPhone: '', type: 'BASIC',                 status: 'AVAILABLE', distanceKm: 5.2 }
    ];
  }
}