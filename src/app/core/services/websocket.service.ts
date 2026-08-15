// ─────────────────────────────────────────────────────────────
// websocket.service.ts — fixed for Solvixon backend
// Single STOMP/SockJS endpoint: ws://localhost:8080/ws
// Backend LocationController topics:
//   /app/ambulance/{id}/location       (client → server SEND)
//   /topic/ambulances/all              (broadcast all ambulances)
//   /topic/ambulance/{id}/location     (per-ambulance location)
//   /topic/booking/{id}/ambulance-location
//   /app/ambulance/{id}/broadcast      (trigger server broadcast)
// ─────────────────────────────────────────────────────────────
import { Injectable, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AmbulanceLocationMsg {
  ambulanceId: number;
  vehicleNumber?: string;
  latitude: number;
  longitude: number;
  status?: string;
  timestamp?: number;
}

export interface DoctorLocationMsg {
  doctorId: number;
  latitude: number;
  longitude: number;
  timestamp?: number;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private client: Client | null = null;
  private connected = false;
  private subscriptions: StompSubscription[] = [];

  private locationSubject = new Subject<AmbulanceLocationMsg>();
  readonly locationUpdates$: Observable<AmbulanceLocationMsg> = this.locationSubject.asObservable();

  private doctorLocationSubject = new Subject<DoctorLocationMsg>();
  readonly doctorLocationUpdates$: Observable<DoctorLocationMsg> = this.doctorLocationSubject.asObservable();

  connect(): void {
    if (this.connected || this.client?.active) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS(environment.wsUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected = true;
        // Subscribe to all-ambulance broadcast
        const sub = this.client!.subscribe('/topic/ambulances/all', (msg: IMessage) => {
          try { this.locationSubject.next(JSON.parse(msg.body)); } catch {}
        });
        this.subscriptions.push(sub);
      },
      onDisconnect: () => { this.connected = false; },
      onStompError: (frame) => console.error('[WS] STOMP error', frame)
    });

    this.client.activate();
  }

  // Track a specific ambulance
  subscribeToAmbulance(ambulanceId: number): Observable<AmbulanceLocationMsg> {
    const subject = new Subject<AmbulanceLocationMsg>();
    if (this.client?.connected) {
      const sub = this.client.subscribe(
        `/topic/ambulance/${ambulanceId}/location`,
        (msg: IMessage) => { try { subject.next(JSON.parse(msg.body)); } catch {} }
      );
      this.subscriptions.push(sub);
    }
    return subject.asObservable();
  }

  // Track ambulance for a booking
  subscribeToBookingAmbulance(bookingId: number): Observable<AmbulanceLocationMsg> {
    const subject = new Subject<AmbulanceLocationMsg>();
    if (this.client?.connected) {
      const sub = this.client.subscribe(
        `/topic/booking/${bookingId}/ambulance-location`,
        (msg: IMessage) => { try { subject.next(JSON.parse(msg.body)); } catch {} }
      );
      this.subscriptions.push(sub);
    }
    return subject.asObservable();
  }

  // Ambulance driver pushes location via WebSocket
  // Sends to /app/ambulance/{id}/location → backend LocationService.broadcastLocation
  publishAmbulanceLocation(loc: {
    ambulanceId: number;
    latitude: number;
    longitude: number;
  }): void {
    if (this.client?.connected) {
      this.client.publish({
        destination: `/app/ambulance/${loc.ambulanceId}/location`,
        body: JSON.stringify(loc)
      });
    }
  }

  isConnected(): boolean { return this.connected; }

  disconnect(): void {
    this.subscriptions.forEach(s => { try { s.unsubscribe(); } catch {} });
    this.subscriptions = [];
    this.client?.deactivate();
    this.connected = false;
  }

  ngOnDestroy(): void { this.disconnect(); }
}
