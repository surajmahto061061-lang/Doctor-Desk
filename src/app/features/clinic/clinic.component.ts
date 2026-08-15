import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { concatMap, from, toArray } from 'rxjs';
import { ClinicService } from '../../core/services/clinic.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import {
  BedResponse, InventoryItemResponse, StaffResponse, InvoiceResponse,
  ClinicDashboardResponse, Clinic, ClinicRequest
} from '../../core/models';

@Component({
  selector: 'app-clinic',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div>
          <h2>🏥 Clinic Management</h2>
          <p>Beds, inventory, staff and invoices</p>
        </div>
        <div style="display:flex;gap:10px;align-items:center">
          @if (myClinics.length) {
            <label style="font-size:13px">Clinic:</label>
            <select class="form-control" style="width:220px" [ngModel]="clinicId" (ngModelChange)="selectClinic($event)">
              @for (c of myClinics; track c.id) {
                <option [value]="c.id">{{ c.name }}</option>
              }
            </select>
            @if (currentClinic()) {
              <button class="btn btn-outline btn-sm" (click)="openEditClinicForm(currentClinic()!)">✎ Edit</button>
              <button class="btn btn-ghost btn-sm" (click)="deleteClinic(currentClinic()!)">🗑 Delete</button>
            }
          } @else if (!clinicsLoading) {
            <span style="font-size:13px;color:#666">No clinics yet.</span>
          }
          <button class="btn btn-primary btn-sm" (click)="openNewClinicForm()">+ New Clinic</button>
        </div>
      </div>

      <!-- Create/Edit clinic modal -->
      @if (showClinicForm) {
        <div class="modal-overlay" (click)="showClinicForm=false">
          <div class="modal" (click)="$event.stopPropagation()">
            <button class="modal-close" (click)="showClinicForm=false">✕</button>
            <h3>{{ editingClinicId ? 'Edit clinic' : 'New clinic' }}</h3>
            <div class="form-grid" style="margin-top:12px">
              <input class="form-control" [(ngModel)]="clinicForm.name" placeholder="Clinic name">
              <input class="form-control" [(ngModel)]="clinicForm.address" placeholder="Address">
              <input class="form-control" [(ngModel)]="clinicForm.city" placeholder="City">
              <input class="form-control" [(ngModel)]="clinicForm.pincode" placeholder="Pincode">
              <input class="form-control" [(ngModel)]="clinicForm.phone" placeholder="Phone">
              <input class="form-control" [(ngModel)]="clinicForm.timings" placeholder="Timings (e.g. 9am-6pm)">
              <input class="form-control" [(ngModel)]="clinicForm.workingDays" placeholder="Working days">
            </div>
            <div style="margin-top:16px;display:flex;gap:8px;justify-content:flex-end">
              <button class="btn btn-ghost" (click)="showClinicForm=false">Cancel</button>
              <button class="btn btn-primary" (click)="saveClinic()" [disabled]="clinicSaving || !clinicForm.name || !clinicForm.address">
                {{ editingClinicId ? 'Save changes' : 'Create clinic' }}
              </button>
            </div>
          </div>
        </div>
      }

      @if (dashboard) {
        <div class="stats-grid">
          <div class="stat-card card"><div class="stat-val">{{ dashboard.todayAppointments }}</div><div class="stat-lbl">Today's Appointments</div></div>
          <div class="stat-card card"><div class="stat-val">{{ dashboard.liveQueueSize }}</div><div class="stat-lbl">Live Queue</div></div>
          <div class="stat-card card"><div class="stat-val">{{ dashboard.newPatientsToday }}</div><div class="stat-lbl">New Patients Today</div></div>
          <div class="stat-card card"><div class="stat-val">₹{{ dashboard.todayRevenue | number }}</div><div class="stat-lbl">Today's Revenue</div></div>
        </div>
      }

      <div class="tab-nav" style="margin-top:20px">
        <button class="tab-btn" [class.active]="tab==='beds'"      (click)="tab='beds'">🛏 Beds ({{ beds.length }})</button>
        <button class="tab-btn" [class.active]="tab==='inventory'" (click)="tab='inventory'">📦 Inventory</button>
        <button class="tab-btn" [class.active]="tab==='staff'"     (click)="tab='staff'">👥 Staff</button>
        <button class="tab-btn" [class.active]="tab==='invoices'"  (click)="tab='invoices'">🧾 Invoices</button>
      </div>

      <!-- BEDS TAB -->
      @if (tab === 'beds') {
        <!-- Smart Bed Stats -->
        <div class="bed-stats-row">
          <div class="bed-stat-card total">
            <div class="bsc-icon">🛏</div>
            <div class="bsc-val">{{ beds.length }}</div>
            <div class="bsc-label">Total Beds</div>
          </div>
          <div class="bed-stat-card occupied">
            <div class="bsc-icon">🔴</div>
            <div class="bsc-val">{{ occupiedCount() }}</div>
            <div class="bsc-label">Occupied</div>
          </div>
          <div class="bed-stat-card available">
            <div class="bsc-icon">🟢</div>
            <div class="bsc-val">{{ beds.length - occupiedCount() }}</div>
            <div class="bsc-label">Available</div>
          </div>
          <div class="bed-stat-card pct">
            <div class="bsc-icon">📊</div>
            <div class="bsc-val">{{ beds.length ? ((occupiedCount() / beds.length) * 100 | number:'1.0-0') : 0 }}%</div>
            <div class="bsc-label">Occupancy</div>
          </div>
        </div>
        <!-- Occupancy bar -->
        @if (beds.length) {
          <div class="occ-bar-wrap">
            <div class="occ-bar">
              <div class="occ-bar-fill" [style.width]="((occupiedCount()/beds.length)*100)+'%'"></div>
            </div>
            <span class="text-sm text-muted">{{ occupiedCount() }}/{{ beds.length }} beds occupied</span>
          </div>
        }

        <div class="tab-toolbar">
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <input class="form-control" style="width:130px" [(ngModel)]="newBed.bedNumber" placeholder="Bed number">
            <select class="form-control" style="width:auto" [(ngModel)]="newBed.ward">
              <option value="">Ward type</option>
              <option value="GENERAL">General</option>
              <option value="ICU">ICU</option>
              <option value="PRIVATE">Private</option>
              <option value="SEMI_PRIVATE">Semi-Private</option>
              <option value="EMERGENCY">Emergency</option>
            </select>
            <label style="font-size:12px;color:var(--text-2);display:flex;align-items:center;gap:6px">
              Quantity
              <input class="form-control" style="width:70px" type="number" min="1" max="200"
                [(ngModel)]="newBedQty" placeholder="1">
            </label>
            <button class="btn btn-primary btn-sm" (click)="addBed()"
              [disabled]="!newBed.bedNumber || !clinicId || bedBulkAdding">
              @if (bedBulkAdding) { <span class="spinner spinner-sm"></span> Adding {{ bedBulkProgress }}/{{ newBedQty }}… }
              @else { + Add {{ newBedQty > 1 ? newBedQty + ' Beds' : 'Bed' }} }
            </button>
          </div>
          <span class="text-sm text-muted">{{ beds.length }} total · {{ occupiedCount() }} occupied</span>
        </div>
        @if (newBedQty > 1 && newBed.bedNumber && isNumeric(newBed.bedNumber)) {
          <div class="text-sm text-muted" style="margin-top:-8px;margin-bottom:12px">
            Will create beds numbered {{ newBed.bedNumber }} to {{ +newBed.bedNumber + newBedQty - 1 }}
          </div>
        }
        @if (bedLoading) { <div class="loading-wrap"><div class="spinner spinner-lg"></div></div> }
        @else if (beds.length) {
          <div class="bed-grid">
            @for (b of beds; track b.id) {
              <div class="bed-card" [class.occupied]="isOccupied(b)">
                <div class="bed-top">
                  <div class="bed-num">{{ b.bedNumber }}</div>
                  <span class="badge" [class]="isOccupied(b) ? 'badge-red' : 'badge-green'">{{ isOccupied(b) ? 'Occupied' : 'Available' }}</span>
                </div>
                @if (b.ward) { <div class="text-sm text-muted">{{ b.ward }}</div> }
                @if (isOccupied(b) && b.patientName) {
                  <div class="bed-patient">
                    <div class="bed-patient-name">👤 {{ b.patientName }}</div>
                    <span>👤 {{ b.patientName }}</span>
                    @if (b.admittedAt) {
                      <span class="text-sm text-muted">Since {{ b.admittedAt | date:'dd MMM yyyy' }}</span>
                      <span class="text-sm text-muted admit-days">{{ admitDays(b.admittedAt) }}</span>
                    }
                  </div>
                }
                @if (!isOccupied(b)) {
                  <div style="display:flex;gap:6px;margin-top:10px">
                    <input class="form-control" style="flex:1;font-size:12px" [(ngModel)]="admitNames[b.id]" placeholder="Patient name">
                    <button class="btn btn-outline btn-sm" (click)="admitPatient(b)" [disabled]="!admitNames[b.id]">Admit</button>
                  </div>
                } @else {
                  <button class="btn btn-ghost btn-sm btn-block" style="margin-top:10px" (click)="discharge(b)"
                    [disabled]="actionId===b.id">Discharge</button>
                }
              </div>
            }
          </div>
        } @else {
          <div class="empty-state"><div class="empty-icon">🛏</div><h3>No beds added yet</h3></div>
        }
      }

      <!-- INVENTORY TAB -->
      @if (tab === 'inventory') {
        <div class="tab-toolbar">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <input class="form-control" style="width:150px" [(ngModel)]="newItem.itemName" placeholder="Item name">
            <input class="form-control" style="width:80px" type="number" [(ngModel)]="newItem.quantity" placeholder="Qty">
            <input class="form-control" style="width:80px" [(ngModel)]="newItem.unit" placeholder="Unit">
            <select class="form-control" style="width:auto" [(ngModel)]="newItem.category">
              <option value="">Category</option>
              <option value="MEDICINE">Medicine</option>
              <option value="EQUIPMENT">Equipment</option>
              <option value="CONSUMABLE">Consumable</option>
              <option value="PPE">PPE</option>
            </select>
            <button class="btn btn-primary btn-sm" (click)="addItem()" [disabled]="!newItem.itemName">+ Add</button>
          </div>
          <button class="btn btn-ghost btn-sm" (click)="loadLowStock()">⚠ Low stock</button>
        </div>
        @if (invLoading) { <div class="loading-wrap"><div class="spinner spinner-lg"></div></div> }
        @else if (inventory.length) {
          <div class="table-wrap">
            <table>
              <thead><tr><th>Item</th><th>Category</th><th>Quantity</th><th>Unit</th><th>Low threshold</th><th>Actions</th></tr></thead>
              <tbody>
                @for (item of inventory; track item.id) {
                  <tr [class.low-stock]="item.lowStockThreshold && item.quantity <= item.lowStockThreshold">
                    <td style="font-weight:500">{{ item.itemName }}
                      @if (item.lowStockThreshold && item.quantity <= item.lowStockThreshold) {
                        <span class="badge badge-red" style="margin-left:6px;font-size:10px">Low</span>
                      }
                    </td>
                    <td>{{ item.category || '—' }}</td>
                    <td>{{ item.quantity }}</td>
                    <td>{{ item.unit || '—' }}</td>
                    <td>{{ item.lowStockThreshold || '—' }}</td>
                    <td>
                      <div style="display:flex;gap:6px">
                        <input class="form-control" style="width:70px;font-size:12px" type="number"
                          [(ngModel)]="stockChanges[item.id]" placeholder="±qty">
                        <button class="btn btn-outline btn-sm" (click)="updateStock(item)"
                          [disabled]="actionId===item.id">Update</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="empty-state"><div class="empty-icon">📦</div><h3>No inventory items</h3></div>
        }
      }

      <!-- STAFF TAB -->
      @if (tab === 'staff') {
        <div class="tab-toolbar">
          <button class="btn btn-primary btn-sm" (click)="showStaffForm=!showStaffForm">+ Add Staff</button>
          <button class="btn btn-ghost btn-sm" (click)="loadStaff()">↻ Refresh</button>
        </div>
        @if (showStaffForm) {
          <div class="inline-form card" style="margin-bottom:16px;padding:16px">
            <div class="form-grid">
              <div class="form-group"><label>Name *</label><input class="form-control" [(ngModel)]="newStaff.name" placeholder="Full name"></div>
              <div class="form-group"><label>Role *</label>
                <select class="form-control" [(ngModel)]="newStaff.role">
                  <option value="">Select role</option>
                  <option value="NURSE">Nurse</option><option value="RECEPTIONIST">Receptionist</option>
                  <option value="PHARMACIST">Pharmacist</option><option value="LAB_TECH">Lab Technician</option>
                  <option value="WARD_BOY">Ward Boy</option><option value="CLEANER">Cleaner</option>
                </select>
              </div>
              <div class="form-group"><label>Phone</label><input class="form-control" [(ngModel)]="newStaff.phone" placeholder="+91…"></div>
              <div class="form-group"><label>Shift</label>
                <select class="form-control" [(ngModel)]="newStaff.shift">
                  <option value="">Select shift</option>
                  <option value="MORNING">Morning</option><option value="AFTERNOON">Afternoon</option>
                  <option value="NIGHT">Night</option><option value="ROTATING">Rotating</option>
                </select>
              </div>
            </div>
            <div style="display:flex;gap:8px;margin-top:10px">
              <button class="btn btn-ghost btn-sm" (click)="showStaffForm=false">Cancel</button>
              <button class="btn btn-primary btn-sm" (click)="addStaff()" [disabled]="!newStaff.name||!newStaff.role||staffSaving">
                @if (staffSaving) { <span class="spinner spinner-sm"></span> } @else { Save }
              </button>
            </div>
          </div>
        }
        @if (staffLoading) { <div class="loading-wrap"><div class="spinner spinner-lg"></div></div> }
        @else if (staff.length) {
          <div class="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Role</th><th>Phone</th><th>Shift</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                @for (s of staff; track s.id) {
                  <tr>
                    <td style="font-weight:500">{{ s.name }}</td>
                    <td>{{ s.role }}</td>
                    <td>{{ s.phone || '—' }}</td>
                    <td>{{ s.shift || '—' }}</td>
                    <td><span class="badge" [class]="s.active!==false?'badge-green':'badge-gray'">{{ s.active!==false?'Active':'Inactive' }}</span></td>
                    <td><button class="btn btn-danger btn-sm" (click)="removeStaff(s.id)" [disabled]="actionId===s.id">Remove</button></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="empty-state"><div class="empty-icon">👥</div><h3>No staff members</h3></div>
        }
      }

      <!-- INVOICES TAB -->
      @if (tab === 'invoices') {
        <div class="tab-toolbar">
          <button class="btn btn-primary btn-sm" (click)="showInvForm=!showInvForm">+ Create Invoice</button>
          <button class="btn btn-ghost btn-sm" (click)="loadInvoices()">↻ Refresh</button>
        </div>
        @if (showInvForm) {
          <div class="card" style="padding:16px;margin-bottom:16px;max-width:500px">
            <div class="form-group"><label>Patient ID *</label><input class="form-control" type="number" [(ngModel)]="invForm.patientId"></div>
            <div class="form-group"><label>Notes</label><input class="form-control" [(ngModel)]="invForm.notes" placeholder="Additional notes"></div>
            <div style="margin-bottom:10px">
              <div style="font-weight:500;margin-bottom:8px;font-size:13px">Line Items</div>
              @for (item of invForm.items; track $index) {
                <div style="display:flex;gap:8px;margin-bottom:6px">
                  <input class="form-control" [(ngModel)]="item.description" placeholder="Description" style="flex:2">
                  <input class="form-control" type="number" [(ngModel)]="item.amount" placeholder="₹" style="width:90px">
                  <button class="btn btn-ghost btn-sm" (click)="removeInvItem($index)">✕</button>
                </div>
              }
              <button class="btn btn-ghost btn-sm" (click)="addInvItem()">+ Add line item</button>
            </div>
            <div style="font-weight:600;margin-bottom:12px">Total: ₹{{ invTotal() | number }}</div>
            <div style="display:flex;gap:8px">
              <button class="btn btn-ghost btn-sm" (click)="showInvForm=false">Cancel</button>
              <button class="btn btn-primary btn-sm" (click)="createInvoice()" [disabled]="invSaving||!invForm.patientId||!invForm.items.length">
                @if (invSaving) { <span class="spinner spinner-sm"></span> } @else { Create }
              </button>
            </div>
          </div>
        }
        @if (invLoading) { <div class="loading-wrap"><div class="spinner spinner-lg"></div></div> }
        @else if (invoices.length) {
          <div class="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Patient</th><th>Total</th><th>Paid</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                @for (inv of invoices; track inv.id) {
                  <tr>
                    <td>{{ inv.id }}</td>
                    <td>Patient #{{ inv.patientId }}</td>
                    <td>₹{{ inv.totalAmount | number }}</td>
                    <td>₹{{ inv.paidAmount || 0 | number }}</td>
                    <td><span class="badge" [class]="invBadge(inv.status)">{{ inv.status }}</span></td>
                    <td class="text-sm text-muted">{{ inv.createdAt | date:'shortDate' }}</td>
                    <td>
                      @if (inv.status !== 'PAID') {
                        <button class="btn btn-outline btn-sm" (click)="payInvoice(inv.id)"
                          [disabled]="actionId===inv.id">Mark paid</button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <div class="empty-state"><div class="empty-icon">🧾</div><h3>No invoices</h3></div>
        }
      }
    </div>
  `,
  styles: [`
    .tab-nav { display:flex; gap:4px; border-bottom:1px solid var(--border); }
    .tab-btn { padding:10px 16px; font-size:14px; background:none; border:none; border-bottom:2px solid transparent; cursor:pointer; color:var(--text-2); font-family:inherit; margin-bottom:-1px; &.active { color:var(--primary); border-bottom-color:var(--primary); font-weight:500; } }
    .tab-toolbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; margin:16px 0; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:12px; }
    .stat-card { padding:16px; text-align:center; }
    .stat-val { font-size:28px; font-weight:600; color:var(--primary); }
    .stat-lbl { font-size:12px; color:var(--text-2); margin-top:4px; }
    /* Bed stats */
    .bed-stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
    @media(max-width:600px) { .bed-stats-row { grid-template-columns:repeat(2,1fr); } }
    .bed-stat-card { background:var(--surface); border:1px solid var(--border); border-radius:10px; padding:16px; text-align:center; }
    .bed-stat-card.occupied { border-color:#FCA5A5; background:#FFF5F5; }
    .bed-stat-card.available { border-color:#C0DD97; background:#F0FAE8; }
    .bed-stat-card.pct { border-color:#BDD7F5; background:#EBF4FF; }
    .bsc-icon { font-size:22px; margin-bottom:4px; }
    .bsc-val { font-size:28px; font-weight:700; color:var(--text); }
    .bsc-label { font-size:12px; color:var(--text-2); margin-top:2px; }
    .occ-bar-wrap { display:flex; align-items:center; gap:12px; margin-bottom:20px; }
    .occ-bar { flex:1; height:10px; background:var(--surface-2); border-radius:99px; overflow:hidden; border:1px solid var(--border); }
    .occ-bar-fill { height:100%; background:#e53e3e; border-radius:99px; transition:width .4s; }
    .bed-patient-name { font-weight:600; font-size:13px; margin-bottom:2px; }
    .admit-days { display:block; font-size:11px; color:#854F0B; }
    .bed-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:12px; }
    .bed-card { background:var(--surface); border:2px solid var(--border); border-radius:10px; padding:14px; &.occupied { border-color:#E24B4A44; background:#fff5f5; } }
    .bed-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:6px; }
    .bed-num { font-size:18px; font-weight:700; }
    .bed-patient { font-size:13px; margin-top:8px; display:flex; flex-direction:column; gap:2px; }
    .low-stock { background:#fffbeb; }
    .form-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  `]
})
export class ClinicComponent implements OnInit {
  private svc   = inject(ClinicService);
  auth          = inject(AuthService);
  private toast = inject(ToastService);

  tab = 'beds';
  clinicId: number | null = null;
  actionId: number | null = null;
  dashboard: ClinicDashboardResponse | null = null;

  // ── Clinics (ClinicController — was previously unwired; user had to guess a raw ID) ──
  myClinics: Clinic[] = [];
  clinicsLoading = false;
  showClinicForm = false;
  clinicSaving = false;
  editingClinicId: number | null = null;
  clinicForm: ClinicRequest = { name: '', address: '', city: '', pincode: '', phone: '', timings: '', workingDays: '' };

  beds: BedResponse[] = [];
  bedLoading = false;
  admitNames: Record<number, string> = {};
  newBed = { bedNumber: '', ward: '' };
  newBedQty = 1;
  bedBulkAdding = false;
  bedBulkProgress = 0;

  inventory: InventoryItemResponse[] = [];
  invLoading = false;
  stockChanges: Record<number, number> = {};
  newItem = { itemName: '', quantity: 0, unit: '', category: '', lowStockThreshold: 0 };

  staff: StaffResponse[] = [];
  staffLoading = false;
  staffSaving = false;
  showStaffForm = false;
  newStaff = { clinicId: 0, name: '', role: '', phone: '', shift: '' };

  invoices: InvoiceResponse[] = [];
  invLoading2 = false;
  invSaving = false;
  showInvForm = false;
  invForm: any = { patientId: null, clinicId: null, notes: '', items: [{ description: '', amount: 0 }] };

  ngOnInit() {
    this.loadMyClinics();
  }

  // ── Clinics ─────────────────────────────────
  loadMyClinics() {
    this.clinicsLoading = true;
    this.svc.getMyClinics().subscribe({
      next: res => {
        this.myClinics = res.data || [];
        this.clinicsLoading = false;
        // Auto-select the first clinic so the doctor isn't stuck guessing a numeric ID
        if (!this.clinicId && this.myClinics.length) {
          this.clinicId = this.myClinics[0].id ?? null;
          this.loadAll();
        }
      },
      error: () => { this.myClinics = []; this.clinicsLoading = false; }
    });
  }

  openNewClinicForm() {
    this.editingClinicId = null;
    this.clinicForm = { name: '', address: '', city: '', pincode: '', phone: '', timings: '', workingDays: '' };
    this.showClinicForm = true;
  }

  openEditClinicForm(c: Clinic) {
    this.editingClinicId = c.id ?? null;
    this.clinicForm = {
      name: c.name, address: c.address, city: c.city, pincode: c.pincode,
      phone: c.phone, timings: c.timings, workingDays: c.workingDays,
      latitude: c.latitude, longitude: c.longitude
    };
    this.showClinicForm = true;
  }

  saveClinic() {
    if (!this.clinicForm.name || !this.clinicForm.address) return;
    this.clinicSaving = true;
    const done = () => {
      this.clinicSaving = false;
      this.showClinicForm = false;
      this.loadMyClinics();
    };
    if (this.editingClinicId) {
      this.svc.updateClinic(this.editingClinicId, this.clinicForm).subscribe({
        next: () => { this.toast.success('Clinic updated'); done(); },
        error: (e: any) => { this.toast.error(e?.error?.message || 'Update failed'); this.clinicSaving = false; }
      });
    } else {
      this.svc.addClinic(this.clinicForm).subscribe({
        next: (res) => { this.toast.success('Clinic created'); this.clinicId = res.data?.id ?? this.clinicId; done(); },
        error: (e: any) => { this.toast.error(e?.error?.message || 'Create failed'); this.clinicSaving = false; }
      });
    }
  }

  deleteClinic(c: Clinic) {
    if (!c.id) return;
    if (!confirm(`Delete clinic "${c.name}"? This cannot be undone.`)) return;
    this.svc.deleteClinic(c.id).subscribe({
      next: () => {
        this.toast.success('Clinic deleted');
        if (this.clinicId === c.id) { this.clinicId = null; this.dashboard = null; }
        this.loadMyClinics();
      },
      error: (e: any) => this.toast.error(e?.error?.message || 'Delete failed')
    });
  }

  currentClinic(): Clinic | null {
    return this.myClinics.find(c => c.id === this.clinicId) ?? null;
  }

  selectClinic(id: number) {
    this.clinicId = id;
    this.loadAll();
  }

  loadAll() {
    if (!this.clinicId) return;
    this.loadDashboard(); this.loadBeds(); this.loadInventory(); this.loadStaff(); this.loadInvoices();
  }

  loadDashboard() {
    this.svc.getClinicDashboard(this.clinicId!).subscribe({
      next: r => this.dashboard = r.data,
      error: () => this.dashboard = null
    });
  }

  loadBeds() {
    this.bedLoading = true;
    this.svc.getClinicBeds(this.clinicId!).subscribe({
      next: r => { this.beds = r.data || []; this.bedLoading = false; },
      error: () => { this.beds = []; this.bedLoading = false; }
    });
  }

  isNumeric(v: string): boolean { return v.trim() !== '' && !isNaN(Number(v)); }

  addBed() {
    // FIX: previously this fired even when no clinic was selected, sending
    // clinicId: null to the backend, which failed with
    // "Invalid request: The given id must not be null!" (reported as
    // "clinic is required"). Guard here + [disabled] on the button above.
    if (!this.clinicId) {
      this.toast.error('Please select a clinic first');
      return;
    }
    const clinicId = this.clinicId;
    const qty = Math.max(1, Math.min(200, Math.floor(this.newBedQty) || 1));

    // Single bed — original behaviour, unchanged.
    if (qty <= 1) {
      this.svc.addBed({ ...this.newBed, clinicId }).subscribe({
        next: () => { this.toast.success('Bed added'); this.resetNewBed(); this.loadBeds(); },
        error: (e: any) => this.toast.error(e?.error?.message || 'Failed')
      });
      return;
    }

    // Bulk add — there's no bulk endpoint on the backend, so we generate
    // sequential bed numbers and create them one request at a time.
    // "Bed number" 58 + qty 58 does NOT mean "58 beds" on its own — typing
    // a single number just names one bed. This builds the actual list of
    // N beds (58, 59, 60, ... for numeric input, or "A-1", "A-2", ... for
    // non-numeric input) and creates them sequentially.
    const base = this.newBed.bedNumber.trim();
    const numeric = this.isNumeric(base);
    const bedNumbers: string[] = [];
    for (let i = 0; i < qty; i++) {
      bedNumbers.push(numeric ? String(Number(base) + i) : `${base}-${i + 1}`);
    }

    this.bedBulkAdding = true;
    this.bedBulkProgress = 0;
    let failed = 0;

    from(bedNumbers).pipe(
      concatMap(bedNumber =>
        this.svc.addBed({ bedNumber, ward: this.newBed.ward, clinicId }).pipe(
          // count each attempt (success or failure) so progress always advances
          concatMap(res => { this.bedBulkProgress++; return [res]; })
        )
      ),
      toArray()
    ).subscribe({
      next: () => {
        this.bedBulkAdding = false;
        this.toast.success(`${qty} beds added`);
        this.resetNewBed();
        this.loadBeds();
      },
      error: (e: any) => {
        failed++;
        this.bedBulkAdding = false;
        this.toast.error(`Stopped after ${this.bedBulkProgress} of ${qty} beds: ${e?.error?.message || 'Failed'}`);
        this.loadBeds();
      }
    });
  }

  private resetNewBed() {
    this.newBed = { bedNumber: '', ward: '' };
    this.newBedQty = 1;
    this.bedBulkProgress = 0;
  }

  admitPatient(b: BedResponse) {
    const name = this.admitNames[b.id];
    if (!name) return;
    this.actionId = b.id;
    this.svc.admitPatient(b.id, { patientName: name }).subscribe({
      next: () => { this.toast.success(`Patient admitted to bed ${b.bedNumber}`); this.actionId = null; this.loadBeds(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.actionId = null; }
    });
  }

  discharge(b: BedResponse) {
    this.actionId = b.id;
    this.svc.dischargePatient(b.id).subscribe({
      next: () => { this.toast.success('Patient discharged'); this.actionId = null; this.loadBeds(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.actionId = null; }
    });
  }

  loadInventory() {
    this.invLoading = true;
    this.svc.getClinicInventory(this.clinicId!).subscribe({
      next: r => { this.inventory = r.data || []; this.invLoading = false; },
      error: () => { this.inventory = []; this.invLoading = false; }
    });
  }

  addItem() {
    this.svc.addInventoryItem({ ...this.newItem, clinicId: this.clinicId! }).subscribe({
      next: () => { this.toast.success('Item added'); this.newItem = { itemName: '', quantity: 0, unit: '', category: '', lowStockThreshold: 0 }; this.loadInventory(); },
      error: (e: any) => this.toast.error(e?.error?.message || 'Failed')
    });
  }

  loadLowStock() {
    this.svc.getLowStockItems(this.clinicId!).subscribe({
      next: r => { this.inventory = r.data || []; this.toast.info(`${this.inventory.length} low-stock items`); },
      error: () => {}
    });
  }

  updateStock(item: InventoryItemResponse) {
    const change = this.stockChanges[item.id];
    if (change == null) return;
    this.actionId = item.id;
    this.svc.updateStock(item.id, change).subscribe({
      next: () => { this.toast.success('Stock updated'); this.actionId = null; this.loadInventory(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.actionId = null; }
    });
  }

  loadStaff() {
    this.staffLoading = true;
    this.svc.getClinicStaff(this.clinicId!).subscribe({
      next: r => { this.staff = r.data || []; this.staffLoading = false; },
      error: () => { this.staff = []; this.staffLoading = false; }
    });
  }

  addStaff() {
    this.staffSaving = true;
    this.svc.addStaff({ ...this.newStaff, clinicId: this.clinicId! }).subscribe({
      next: () => { this.toast.success('Staff added'); this.staffSaving = false; this.showStaffForm = false; this.loadStaff(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.staffSaving = false; }
    });
  }

  removeStaff(id: number) {
    if (!confirm('Remove this staff member?')) return;
    this.actionId = id;
    this.svc.deactivateStaff(id).subscribe({
      next: () => { this.toast.success('Staff removed'); this.actionId = null; this.loadStaff(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.actionId = null; }
    });
  }

  loadInvoices() {
    this.invLoading2 = true;
    this.svc.getClinicInvoices(this.clinicId!).subscribe({
      next: r => { this.invoices = r.data || []; this.invLoading2 = false; },
      error: () => { this.invoices = []; this.invLoading2 = false; }
    });
  }

  createInvoice() {
    this.invSaving = true;
    this.svc.createInvoice({ ...this.invForm, clinicId: this.clinicId }).subscribe({
      next: () => { this.toast.success('Invoice created'); this.invSaving = false; this.showInvForm = false; this.loadInvoices(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.invSaving = false; }
    });
  }

  payInvoice(id: number) {
    this.actionId = id;
    this.svc.recordPayment(id, { paymentMode: 'CASH' }).subscribe({
      next: () => { this.toast.success('Payment recorded'); this.actionId = null; this.loadInvoices(); },
      error: (e: any) => { this.toast.error(e?.error?.message || 'Failed'); this.actionId = null; }
    });
  }

  addInvItem() { this.invForm.items.push({ description: '', amount: 0 }); }
  removeInvItem(i: number) { this.invForm.items.splice(i, 1); }
  invTotal(): number { return this.invForm.items.reduce((s: number, it: any) => s + (Number(it.amount) || 0), 0); }
  invBadge(s: string): string { return ({ PAID: 'badge-green', PENDING: 'badge-amber', PARTIAL: 'badge-blue' } as any)[s] || 'badge-gray'; }

  // invLoading2 is used for invoices loading state (invLoading is for inventory)
  admitDays(admittedAt: string): string {
    if (!admittedAt) return '';
    const days = Math.floor((Date.now() - new Date(admittedAt).getTime()) / 86400000);
    if (days === 0) return '(admitted today)';
    return `(${days} day${days > 1 ? 's' : ''} ago)`;
  }

  // FIX: BedResponse from the backend never has an `occupied` boolean — it has
  // status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE'. A stale
  // duplicate BedRequest/BedResponse interface in models/index.ts used to
  // supply a fake `occupied?: boolean` via TS interface merging, so this
  // always evaluated to undefined/false at runtime (occupied count always
  // showed 0). Now derived correctly from `status`.
  isOccupied(b: BedResponse) { return b.status === 'OCCUPIED'; }
  occupiedCount() { return this.beds.filter(b => this.isOccupied(b)).length; }
}