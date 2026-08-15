import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DoctorService } from '../../../core/services/doctor.service';
import { Doctor } from '../../../core/models';

@Component({
  selector: 'app-doctor-list',
  standalone: true,
  imports: [RouterLink, FormsModule, CommonModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h2>Find a doctor</h2>
        <p>Search from our network of verified specialists</p>
      </div>

      <!-- Search filters -->
      <div class="filters card mb-24">
        <div class="filter-row">
          <input class="form-control" type="search" [(ngModel)]="query"
            (ngModelChange)="onSearch()" placeholder="Search by name or keyword…" style="flex:1">

          <select class="form-control" [(ngModel)]="selectedSpec"
            (ngModelChange)="onSearch()" style="max-width:220px">
            <option value="">All specializations</option>
            @for (s of specializations; track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select>

          <!-- BUG FIX: checkbox is UNCHECKED by default → shows all doctors (available + unavailable).
               When checked it passes available=true to backend to filter only available ones.
               Previously the label said "Available only" but "availableOnly=false" still filtered
               because of a stale client-side filter in an older version of this component. -->
          <label class="avail-toggle">
            <input type="checkbox" [(ngModel)]="availableOnly" (ngModelChange)="onSearch()">
            <span>Available only</span>
          </label>
        </div>
      </div>

      <!-- Loading -->
      @if (loading) {
        <div class="loading-wrap">
          <div class="spinner spinner-lg"></div>
          <p>Finding doctors…</p>
        </div>
      }

      <!-- Results -->
      @if (!loading && doctors.length) {
        <div class="results-info text-sm text-muted mb-16">
          {{ totalElements }} doctor{{ totalElements !== 1 ? 's' : '' }} found
          @if (availableOnly) { <span class="avail-badge">Available only</span> }
        </div>
        <div class="grid-2">
          @for (doc of doctors; track doc.id) {
            <a class="doctor-card card" [routerLink]="['/doctors', doc.id]">
              <div class="doc-top">
                <div class="avatar avatar-md" [style.background]="doc.profileImageUrl ? 'transparent' : avatarBg(doc.name)">
                  @if (doc.profileImageUrl) {
                    <img [src]="doc.profileImageUrl" alt="{{ doc.name }}"
                      style="width:100%;height:100%;border-radius:50%;object-fit:cover;">
                  } @else {
                    {{ initials(doc) }}
                  }
                </div>
                <div class="doc-info">
                  <div class="doc-name">{{ doc.name || 'Doctor' }}</div>
                  <div class="doc-spec text-sm text-muted">{{ doc.specialization || 'General Physician' }}</div>
                </div>
                <!-- BUG FIX: badge correctly shows Available/Unavailable for ALL doctors in the list.
                     Previously an old client-side filter was hiding unavailable doctors entirely.
                     Now ALL approved doctors show with the right availability badge. -->
                <span class="badge" [class]="doc.available !== false ? 'badge-green' : 'badge-gray'">
                  {{ doc.available !== false ? 'Available' : 'Unavailable' }}
                </span>
              </div>
              <div class="doc-meta">
                @if (doc.experienceYears) { <span class="meta-chip">{{ doc.experienceYears }} yrs exp</span> }
                @if (doc.consultationFee) { <span class="meta-chip">₹{{ doc.consultationFee }}</span> }
                @if (doc.rating)          { <span class="meta-chip rating">★ {{ doc.rating | number:'1.1-1' }}</span> }
              </div>
              @if (doc.bio) {
                <p class="doc-bio text-sm">{{ (doc.bio)!.slice(0, 90) }}{{ (doc.bio)!.length > 90 ? '…' : '' }}</p>
              }
              @if (doc.latitude && doc.longitude) {
                <div style="margin-top:4px">
                  <a [href]="getMapLink(doc)" target="_blank" class="location-link"
                    (click)="$event.stopPropagation()">
                    📍 View Clinic on Map
                  </a>
                </div>
              } @else {
                <div style="margin-top:4px">
                  <span class="location-link location-link-muted">📍 Location not shared yet</span>
                </div>
              }
              <div class="doc-action">View profile & book →</div>
            </a>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages > 1) {
          <div class="pagination">
            <button class="btn btn-ghost btn-sm" [disabled]="page === 0" (click)="changePage(page-1)">← Prev</button>
            <span class="text-sm text-muted">Page {{ page+1 }} of {{ totalPages }}</span>
            <button class="btn btn-ghost btn-sm" [disabled]="page >= totalPages-1" (click)="changePage(page+1)">Next →</button>
          </div>
        }
      }

      <!-- Empty -->
      @if (!loading && !doctors.length) {
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No doctors found</h3>
          <p>Try adjusting your search or removing filters</p>
          <button class="btn btn-outline" (click)="reset()">Clear filters</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .filters { padding: 16px 20px; }
    .filter-row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
    .avail-toggle { display: flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer; white-space: nowrap;
      input { cursor: pointer; } }
    .mb-24 { margin-bottom: 24px; }
    .avail-badge {
      display:inline-block; margin-left:8px; font-size:11px; padding:2px 8px;
      border-radius:12px; background:var(--primary-light); color:var(--primary-dark); font-weight:500;
    }
    .doctor-card {
      display: flex; flex-direction: column; gap: 12px; text-decoration: none;
      color: var(--text); transition: border-color .15s, box-shadow .15s;
      &:hover { border-color: var(--primary); box-shadow: var(--shadow-md); }
    }
    .doc-top { display: flex; align-items: center; gap: 12px; }
    .doc-info { flex: 1; min-width: 0; }
    .doc-name { font-size: 15px; font-weight: 600; }
    .doc-meta { display: flex; gap: 8px; flex-wrap: wrap; }
    .location-link { font-size:12px; color:var(--primary); text-decoration:none; }
    .location-link:hover { text-decoration:underline; }
    .location-link-muted { color: var(--text-2); cursor:default; }
    .meta-chip {
      font-size: 12px; padding: 3px 10px; border-radius: 20px;
      background: var(--surface-2); color: var(--text-2); border: 1px solid var(--border);
      &.rating { background: #FAEEDA; color: #854F0B; border-color: #FAC775; }
    }
    .doc-bio { color: var(--text-2); line-height: 1.5; }
    .location-link { font-size:12px; color:#0A6A8B; text-decoration:none; }
    .location-link:hover { text-decoration:underline; }
    .location-link-muted { color: var(--text-2); cursor:default; }
    .doc-action { font-size: 13px; color: var(--primary); font-weight: 500; margin-top: 4px; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 32px; }
  `]
})
export class DoctorListComponent implements OnInit {
  private doctorSvc = inject(DoctorService);

  doctors: Doctor[] = [];
  specializations: string[] = [];
  loading       = true;
  query         = '';
  selectedSpec  = '';
  // BUG FIX: starts as false → by default ALL doctors (available + unavailable) are shown
  availableOnly = false;
  sortBy        = 'rating';
  page          = 0;
  totalPages    = 0;
  totalElements = 0;
  private searchTimer: any;

  ngOnInit() {
    this.doctorSvc.getSpecializations().subscribe({
      next: s => { this.specializations = s.data || []; },
      error: () => {}
    });
    this.loadDoctors();
  }

  loadDoctors() {
    this.loading = true;
    this.doctorSvc.searchDoctors({
      q:              this.query,
      specialization: this.selectedSpec,
      available:      this.availableOnly ? true : undefined,
      sortBy:         this.sortBy,
    }).subscribe({
      next: res => {
        // Backend returns ApiResponse<Doctor[]> (plain array, no pagination)
        const all: any[] = (Array.isArray(res.data) ? res.data : (res.data as any)?.content) || [];
        this.doctors = all.filter((d: any) => d.approvalStatus !== 'REJECTED');
        this.totalElements = this.doctors.length;
        // Client-side pagination
        this.totalPages = Math.ceil(this.doctors.length / 12) || 1;
        this.loading = false;
      },
      error: () => { this.doctors = []; this.loading = false; }
    });
  }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.page = 0;
    this.searchTimer = setTimeout(() => this.loadDoctors(), 350);
  }

  changePage(p: number) { this.page = p; this.loadDoctors(); }

  reset() {
    this.query = '';
    this.selectedSpec = '';
    this.availableOnly = false;
    this.page = 0;
    this.loadDoctors();
  }

  getMapLink(doc: any): string {
    return `https://www.google.com/maps?q=${doc.latitude},${doc.longitude}`;
  }

  avatarBg(name: string): string {
    const colors = ['#1D9E75','#0A6A8B','#7B4EA6','#C05621','#2B6CB0'];
    return colors[(name || '').charCodeAt(0) % colors.length];
  }

  initials(doc: Doctor): string {
    const n = doc.name || 'DR';
    return n.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
  }
}