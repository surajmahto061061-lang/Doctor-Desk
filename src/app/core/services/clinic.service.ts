// ─────────────────────────────────────────────────────────────
// clinic.service.ts — NEW service aggregating clinic-scoped APIs
//
// Covers:
//   Beds        /api/beds/*
//   Inventory   /api/inventory/*
//   Staff       /api/staff/*
//   Invoices    /api/invoices/*
//   Dashboard   /api/dashboard/*
// ─────────────────────────────────────────────────────────────
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BedRequest, BedAssignRequest, BedResponse,
  InventoryItemRequest, InventoryItemResponse,
  StaffRequest, StaffResponse,
  InvoiceRequest, InvoicePaymentRequest, InvoiceResponse,
  ClinicDashboardResponse,
  ClinicRequest, ClinicResponse,
  ApiResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class ClinicService {
  private beds      = `${environment.apiUrl}/beds`;
  private inventory = `${environment.apiUrl}/inventory`;
  private staff     = `${environment.apiUrl}/staff`;
  private invoices  = `${environment.apiUrl}/invoices`;
  private dashboard = `${environment.apiUrl}/dashboard`;
  private clinics   = `${environment.apiUrl}/clinics`;

  constructor(private http: HttpClient) {}

  // ══ CLINICS (/api/clinics/*) — ClinicController had NO frontend coverage at all ══

  // GET /api/clinics/my — logged-in doctor's own clinics (for a clinic picker, instead of
  // making the user type a raw numeric clinic ID)
  getMyClinics(): Observable<ApiResponse<ClinicResponse[]>> {
    return this.http.get<ApiResponse<ClinicResponse[]>>(`${this.clinics}/my`);
  }

  // GET /api/clinics/doctor/{doctorId} — public, any doctor's clinics
  getDoctorClinics(doctorId: number): Observable<ApiResponse<ClinicResponse[]>> {
    return this.http.get<ApiResponse<ClinicResponse[]>>(`${this.clinics}/doctor/${doctorId}`);
  }

  // GET /api/clinics/{id} — full clinic detail (name/address/phone/etc.)
  getClinicById(id: number): Observable<ApiResponse<ClinicResponse>> {
    return this.http.get<ApiResponse<ClinicResponse>>(`${this.clinics}/${id}`);
  }

  // POST /api/clinics — create a new clinic
  addClinic(req: ClinicRequest): Observable<ApiResponse<ClinicResponse>> {
    return this.http.post<ApiResponse<ClinicResponse>>(`${this.clinics}`, req);
  }

  // PUT /api/clinics/{id} — full update (name, address, phone, etc.)
  updateClinic(id: number, req: ClinicRequest): Observable<ApiResponse<ClinicResponse>> {
    return this.http.put<ApiResponse<ClinicResponse>>(`${this.clinics}/${id}`, req);
  }

  // PATCH /api/clinics/{id}/location — location-only update
  updateClinicLocation(id: number, req: ClinicRequest): Observable<ApiResponse<ClinicResponse>> {
    return this.http.patch<ApiResponse<ClinicResponse>>(`${this.clinics}/${id}/location`, req);
  }

  // DELETE /api/clinics/{id} — deactivate/delete a clinic
  deleteClinic(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.clinics}/${id}`);
  }

  // ══ BEDS (/api/beds/*) ════════════════════════════════════

  // POST /api/beds
  addBed(req: BedRequest): Observable<ApiResponse<BedResponse>> {
    return this.http.post<ApiResponse<BedResponse>>(`${this.beds}`, req);
  }

  // GET /api/beds/clinic/{clinicId}
  getClinicBeds(clinicId: number): Observable<ApiResponse<BedResponse[]>> {
    return this.http.get<ApiResponse<BedResponse[]>>(`${this.beds}/clinic/${clinicId}`);
  }

  // PUT /api/beds/{bedId}/admit
  admitPatient(bedId: number, req: BedAssignRequest): Observable<ApiResponse<BedResponse>> {
    return this.http.put<ApiResponse<BedResponse>>(`${this.beds}/${bedId}/admit`, req);
  }

  // PUT /api/beds/{bedId}/discharge
  dischargePatient(bedId: number): Observable<ApiResponse<BedResponse>> {
    return this.http.put<ApiResponse<BedResponse>>(`${this.beds}/${bedId}/discharge`, {});
  }

  // ══ INVENTORY (/api/inventory/*) ══════════════════════════

  // POST /api/inventory
  addInventoryItem(req: InventoryItemRequest): Observable<ApiResponse<InventoryItemResponse>> {
    return this.http.post<ApiResponse<InventoryItemResponse>>(`${this.inventory}`, req);
  }

  // GET /api/inventory/clinic/{clinicId}
  getClinicInventory(clinicId: number): Observable<ApiResponse<InventoryItemResponse[]>> {
    return this.http.get<ApiResponse<InventoryItemResponse[]>>(`${this.inventory}/clinic/${clinicId}`);
  }

  // GET /api/inventory/clinic/{clinicId}/low-stock
  getLowStockItems(clinicId: number): Observable<ApiResponse<InventoryItemResponse[]>> {
    return this.http.get<ApiResponse<InventoryItemResponse[]>>(
      `${this.inventory}/clinic/${clinicId}/low-stock`
    );
  }

  // PUT /api/inventory/{itemId}/stock?change=N
  updateStock(itemId: number, change: number): Observable<ApiResponse<InventoryItemResponse>> {
    const params = new HttpParams().set('change', change);
    return this.http.put<ApiResponse<InventoryItemResponse>>(
      `${this.inventory}/${itemId}/stock`, null, { params }
    );
  }

  // ══ STAFF (/api/staff/*) ══════════════════════════════════

  // POST /api/staff
  addStaff(req: StaffRequest): Observable<ApiResponse<StaffResponse>> {
    return this.http.post<ApiResponse<StaffResponse>>(`${this.staff}`, req);
  }

  // GET /api/staff/clinic/{clinicId}
  getClinicStaff(clinicId: number): Observable<ApiResponse<StaffResponse[]>> {
    return this.http.get<ApiResponse<StaffResponse[]>>(`${this.staff}/clinic/${clinicId}`);
  }

  // PUT /api/staff/{staffId}
  updateStaff(staffId: number, req: StaffRequest): Observable<ApiResponse<StaffResponse>> {
    return this.http.put<ApiResponse<StaffResponse>>(`${this.staff}/${staffId}`, req);
  }

  // DELETE /api/staff/{staffId}
  deactivateStaff(staffId: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${this.staff}/${staffId}`);
  }

  // ══ INVOICES (/api/invoices/*) ════════════════════════════

  // POST /api/invoices
  createInvoice(req: InvoiceRequest): Observable<ApiResponse<InvoiceResponse>> {
    return this.http.post<ApiResponse<InvoiceResponse>>(`${this.invoices}`, req);
  }

  // GET /api/invoices/patient/{patientId}
  getPatientInvoices(patientId: number): Observable<ApiResponse<InvoiceResponse[]>> {
    return this.http.get<ApiResponse<InvoiceResponse[]>>(`${this.invoices}/patient/${patientId}`);
  }

  // GET /api/invoices/clinic/{clinicId}
  getClinicInvoices(clinicId: number): Observable<ApiResponse<InvoiceResponse[]>> {
    return this.http.get<ApiResponse<InvoiceResponse[]>>(`${this.invoices}/clinic/${clinicId}`);
  }

  // POST /api/invoices/{invoiceId}/pay
  recordPayment(invoiceId: number, req: InvoicePaymentRequest): Observable<ApiResponse<InvoiceResponse>> {
    return this.http.post<ApiResponse<InvoiceResponse>>(`${this.invoices}/${invoiceId}/pay`, req);
  }

  // ══ DASHBOARD (/api/dashboard/*) ══════════════════════════

  // GET /api/dashboard/clinic/{clinicId}
  getClinicDashboard(clinicId: number): Observable<ApiResponse<ClinicDashboardResponse>> {
    return this.http.get<ApiResponse<ClinicDashboardResponse>>(
      `${this.dashboard}/clinic/${clinicId}`
    );
  }
}
