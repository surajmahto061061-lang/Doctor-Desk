import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

type Role = 'PATIENT' | 'DOCTOR' | 'AMBULANCE';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  template: `
    <div class="auth-page">
      <div class="auth-card card" [style.maxWidth]="role() === 'PATIENT' ? '480px' : '600px'">

        <div class="auth-logo">🏥</div>
        <h2>Create your account</h2>
        <p>Join MediConnect — Bihar's healthcare platform</p>

        @if (error)   { <div class="alert alert-error">{{ error }}</div> }
        @if (success) { <div class="alert alert-success">{{ success }}</div> }

        <!-- ── Role selector ─────────────────────────────── -->
        <div class="role-tabs">
          <button type="button" class="role-tab" [class.active]="role()==='PATIENT'"   (click)="setRole('PATIENT')">🙋 Patient</button>
          <button type="button" class="role-tab" [class.active]="role()==='DOCTOR'"    (click)="setRole('DOCTOR')">👨‍⚕️ Doctor</button>
          <button type="button" class="role-tab" [class.active]="role()==='AMBULANCE'" (click)="setRole('AMBULANCE')">🚑 Ambulance</button>
        </div>

        <!-- ════════ PATIENT FORM ════════ -->
        @if (role() === 'PATIENT') {
          <form [formGroup]="patientForm" (ngSubmit)="submit()">
            <div class="form-row">
              <div class="form-group">
                <label>Full Name *</label>
                <input class="form-control" formControlName="name" placeholder="Your full name">
                @if (pf['name'].touched && pf['name'].invalid) { <div class="form-error">Name is required</div> }
              </div>
              <div class="form-group">
                <label>Age *</label>
                <input class="form-control" type="number" formControlName="age" placeholder="25" min="1" max="150">
                @if (pf['age'].touched && pf['age'].invalid) { <div class="form-error">Valid age required (1-150)</div> }
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Email *</label>
                <input class="form-control" type="email" formControlName="email" placeholder="you@example.com">
                @if (pf['email'].touched && pf['email'].invalid) { <div class="form-error">Valid email required</div> }
              </div>
              <div class="form-group">
                <label>Mobile Number *</label>
                <input class="form-control" type="tel" formControlName="phone" placeholder="+919876543210">
                @if (pf['phone'].touched && pf['phone'].invalid) { <div class="form-error">Valid phone required</div> }
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Gender</label>
                <select class="form-control" formControlName="gender">
                  <option value="">Select…</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div class="form-group">
                <label>Blood Group</label>
                <select class="form-control" formControlName="bloodGroup">
                  <option value="">Select…</option>
                  <option *ngFor="let b of bloodGroups">{{ b }}</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Address / City</label>
              <input class="form-control" formControlName="address" placeholder="Patna, Bihar">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Password *</label>
                <input class="form-control" type="password" formControlName="password" placeholder="Min 8 characters">
                @if (pf['password'].touched && pf['password'].invalid) { <div class="form-error">Min 8 characters</div> }
              </div>
              <div class="form-group">
                <label>Confirm Password *</label>
                <input class="form-control" type="password" formControlName="confirmPassword" placeholder="Repeat password">
                @if (pf['confirmPassword'].touched && patientForm.errors?.['mismatch']) {
                  <div class="form-error">Passwords do not match</div>
                }
              </div>
            </div>
            <button class="btn btn-primary btn-block" type="submit" [disabled]="loading">
              @if (loading) { <span class="spinner spinner-sm"></span> Creating account… }
              @else { 🙋 Create Patient Account }
            </button>
          </form>
        }

        <!-- ════════ DOCTOR FORM ════════ -->
        @if (role() === 'DOCTOR') {
          <div class="alert alert-info" style="font-size:13px;margin-bottom:16px">
            👨‍⚕️ Doctor accounts require admin approval before appearing in patient search.
          </div>
          <form [formGroup]="doctorForm" (ngSubmit)="submit()">
            <div class="section-label">Personal Info</div>
            <div class="form-row">
              <div class="form-group">
                <label>Full Name *</label>
                <input class="form-control" formControlName="name" placeholder="Dr. Your Name">
                @if (df['name'].touched && df['name'].invalid) { <div class="form-error">Name required</div> }
              </div>
              <div class="form-group">
                <label>Email *</label>
                <input class="form-control" type="email" formControlName="email" placeholder="doctor@example.com">
                @if (df['email'].touched && df['email'].invalid) { <div class="form-error">Valid email required</div> }
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Phone *</label>
                <input class="form-control" type="tel" formControlName="phone" placeholder="+919876543210">
              </div>
              <div class="form-group">
                <label>Password *</label>
                <input class="form-control" type="password" formControlName="password" placeholder="Min 8 characters">
                @if (df['password'].touched && df['password'].invalid) { <div class="form-error">Min 8 characters</div> }
              </div>
            </div>

            <div class="section-label">Professional Info</div>
            <div class="form-row">
              <div class="form-group">
                <label>Specialization *</label>
                <select class="form-control" formControlName="specialization">
                  <option value="">Select specialization…</option>
                  <option *ngFor="let s of specializations">{{ s }}</option>
                </select>
                @if (df['specialization'].touched && df['specialization'].invalid) { <div class="form-error">Required</div> }
              </div>
              <div class="form-group">
                <label>Experience (years)</label>
                <input class="form-control" type="number" formControlName="experience" placeholder="5" min="0" max="60">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Hospital / Clinic *</label>
                <input class="form-control" formControlName="hospital" placeholder="AIIMS Patna">
                @if (df['hospital'].touched && df['hospital'].invalid) { <div class="form-error">Required</div> }
              </div>
              <div class="form-group">
                <label>Consultation Fee (₹)</label>
                <input class="form-control" type="number" formControlName="fee" placeholder="500" min="0">
              </div>
            </div>
            <div class="form-group">
              <label>Education / Qualifications</label>
              <input class="form-control" formControlName="education" placeholder="MBBS, MD (Cardiology), AIIMS Delhi">
            </div>
            <div class="form-group">
              <label>Languages Spoken</label>
              <input class="form-control" formControlName="languages" placeholder="Hindi, English, Bhojpuri">
            </div>
            <div class="form-group">
              <label>Bio / About</label>
              <textarea class="form-control" rows="3" formControlName="bio" placeholder="Tell patients about your expertise and approach…"></textarea>
            </div>

            <div class="section-label">Clinic Location (optional)</div>
            <div class="form-row">
              <div class="form-group">
                <label>Latitude</label>
                <input class="form-control" type="number" step="0.0001" formControlName="latitude" placeholder="25.6093">
              </div>
              <div class="form-group">
                <label>Longitude</label>
                <input class="form-control" type="number" step="0.0001" formControlName="longitude" placeholder="85.1376">
              </div>
            </div>
            <button class="btn btn-primary btn-block" type="submit" [disabled]="loading">
              @if (loading) { <span class="spinner spinner-sm"></span> Submitting… }
              @else { 👨‍⚕️ Submit Doctor Registration }
            </button>
          </form>
        }

        <!-- ════════ AMBULANCE FORM ════════ -->
        @if (role() === 'AMBULANCE') {
          <div class="alert alert-info" style="font-size:13px;margin-bottom:16px">
            🚑 Ambulance driver accounts require admin approval before becoming active.
          </div>
          <form [formGroup]="ambulanceForm" (ngSubmit)="submit()">
            <div class="section-label">Driver Info</div>
            <div class="form-row">
              <div class="form-group">
                <label>Driver Full Name *</label>
                <input class="form-control" formControlName="name" placeholder="Your full name">
                @if (af['name'].touched && af['name'].invalid) { <div class="form-error">Required</div> }
              </div>
              <div class="form-group">
                <label>Email *</label>
                <input class="form-control" type="email" formControlName="email" placeholder="driver@example.com">
                @if (af['email'].touched && af['email'].invalid) { <div class="form-error">Valid email required</div> }
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Mobile Number *</label>
                <input class="form-control" type="tel" formControlName="phone" placeholder="+919876543210">
                @if (af['phone'].touched && af['phone'].invalid) { <div class="form-error">Required</div> }
              </div>
              <div class="form-group">
                <label>Driver Phone (for patients)</label>
                <input class="form-control" type="tel" formControlName="driverPhone" placeholder="Leave blank = same as above">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Password *</label>
                <input class="form-control" type="password" formControlName="password" placeholder="Min 8 characters">
                @if (af['password'].touched && af['password'].invalid) { <div class="form-error">Min 8 characters</div> }
              </div>
              <div class="form-group">
                <label>Confirm Password *</label>
                <input class="form-control" type="password" formControlName="confirmPassword" placeholder="Repeat password">
                @if (af['confirmPassword'].touched && ambulanceForm.errors?.['mismatch']) {
                  <div class="form-error">Passwords do not match</div>
                }
              </div>
            </div>

            <div class="section-label">Vehicle Info</div>
            <div class="form-row">
              <div class="form-group">
                <label>Vehicle Number *</label>
                <input class="form-control" formControlName="vehicleNumber" placeholder="BR01AB1234" style="text-transform:uppercase">
                @if (af['vehicleNumber'].touched && af['vehicleNumber'].invalid) { <div class="form-error">Required</div> }
              </div>
              <div class="form-group">
                <label>Ambulance Type *</label>
                <select class="form-control" formControlName="vehicleType">
                  <option value="">Select type…</option>
                  <option value="BASIC">🚑 Basic Life Support (BLS)</option>
                  <option value="ALS">🚨 Advanced Life Support (ALS)</option>
                  <option value="ICU">🏥 Mobile ICU</option>
                  <option value="NEONATAL">👶 Neonatal</option>
                  <option value="AIR">✈️ Air Ambulance</option>
                </select>
                @if (af['vehicleType'].touched && af['vehicleType'].invalid) { <div class="form-error">Required</div> }
              </div>
            </div>
            <div class="form-group">
              <label>Hospital / Organization Affiliation</label>
              <input class="form-control" formControlName="hospital" placeholder="e.g. AIIMS Patna, Private">
            </div>
            <button class="btn btn-primary btn-block" type="submit" [disabled]="loading">
              @if (loading) { <span class="spinner spinner-sm"></span> Submitting… }
              @else { 🚑 Register as Ambulance Driver }
            </button>
          </form>
        }

        <div class="auth-footer">
          Already have an account? <a routerLink="/auth/login">Sign in</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height:calc(100vh - 58px); display:flex; align-items:center; justify-content:center; padding:24px; }
    .auth-card { width:100%; padding:36px; }
    .auth-logo { font-size:36px; text-align:center; margin-bottom:12px; }
    h2 { text-align:center; margin-bottom:4px; }
    p  { text-align:center; color:var(--text-2); font-size:14px; margin-bottom:20px; }

    .role-tabs { display:flex; gap:0; border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; margin-bottom:24px; }
    .role-tab {
      flex:1; padding:10px 8px; font-size:13px; font-weight:500; border:none; background:var(--surface);
      cursor:pointer; color:var(--text-2); transition:all .2s; font-family:inherit;
      &.active { background:var(--primary); color:#fff; }
      &:not(.active):hover { background:var(--surface-2); color:var(--text); }
    }

    .section-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.06em; color:var(--text-3); margin:16px 0 10px; border-top:1px solid var(--border); padding-top:14px; }
    .form-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
    @media (max-width:520px) { .form-row { grid-template-columns:1fr; } }
    .btn-block { margin-top:12px; }
    .auth-footer { text-align:center; margin-top:20px; font-size:14px; color:var(--text-2); }
  `]
})
export class RegisterComponent {
  private fb    = inject(FormBuilder);
  private auth  = inject(AuthService);
  private toast = inject(ToastService);
  private router= inject(Router);

  role    = signal<Role>('PATIENT');
  loading = false;
  error   = '';
  success = '';

  bloodGroups  = ['A+','A-','B+','B-','O+','O-','AB+','AB-'];
  specializations = [
    'General Physician','Cardiologist','Neurologist','Dermatologist',
    'Orthopedic','Pediatrician','Gynecologist','Psychiatrist',
    'Ophthalmologist','ENT Specialist','Urologist','Gastroenterologist',
    'Endocrinologist','Pulmonologist','Dentist','Radiologist','Oncologist'
  ];

  // ── PATIENT form ─────────────────────────────────────────
  patientForm = this.fb.group({
    name:           ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    age:            [null as number|null, [Validators.required, Validators.min(1), Validators.max(150)]],
    email:          ['', [Validators.required, Validators.email]],
    phone:          ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
    gender:         [''],
    bloodGroup:     [''],
    address:        [''],
    password:       ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword:['', Validators.required],
  }, { validators: this.matchPasswords('password','confirmPassword') });
  get pf() { return this.patientForm.controls; }

  // ── DOCTOR form ──────────────────────────────────────────
  doctorForm = this.fb.group({
    name:           ['', [Validators.required, Validators.minLength(2)]],
    email:          ['', [Validators.required, Validators.email]],
    phone:          ['', Validators.pattern(/^\+?[0-9]{10,15}$/)],
    password:       ['', [Validators.required, Validators.minLength(8)]],
    specialization: ['', Validators.required],
    experience:     [null as number|null, [Validators.min(0), Validators.max(60)]],
    hospital:       ['', Validators.required],
    fee:            [null as number|null, Validators.min(0)],
    bio:            ['', Validators.maxLength(1000)],
    education:      [''],
    languages:      [''],
    latitude:       [null as number|null],
    longitude:      [null as number|null],
  });
  get df() { return this.doctorForm.controls; }

  // ── AMBULANCE form ────────────────────────────────────────
  ambulanceForm = this.fb.group({
    name:           ['', [Validators.required, Validators.minLength(2)]],
    email:          ['', [Validators.required, Validators.email]],
    phone:          ['', [Validators.required, Validators.pattern(/^\+?[0-9]{10,15}$/)]],
    driverPhone:    [''],
    password:       ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword:['', Validators.required],
    vehicleNumber:  ['', Validators.required],
    vehicleType:    ['', Validators.required],
    hospital:       [''],
  }, { validators: this.matchPasswords('password','confirmPassword') });
  get af() { return this.ambulanceForm.controls; }

  setRole(r: Role) {
    this.role.set(r);
    this.error = ''; this.success = '';
  }

  private matchPasswords(pwd: string, confirm: string) {
    return (g: AbstractControl) => {
      const p = g.get(pwd)?.value;
      const c = g.get(confirm)?.value;
      return p && c && p !== c ? { mismatch: true } : null;
    };
  }

  submit() {
    const r = this.role();
    this.error = ''; this.success = '';

    // ── Validate by role ──────────────────────────────────
    if (r === 'PATIENT') {
      if (this.patientForm.invalid) { this.patientForm.markAllAsTouched(); return; }
      const v = this.patientForm.value;
      this.call({
        name:     v.name!,
        email:    v.email!,
        phone:    v.phone!,
        password: v.password!,
        role:     'PATIENT',
        // Patient-specific — stored as bio for now (backend User entity)
        bio: [v.gender, v.bloodGroup, v.address].filter(Boolean).join(' | ') || undefined,
      });
    }

    if (r === 'DOCTOR') {
      if (this.doctorForm.invalid) { this.doctorForm.markAllAsTouched(); return; }
      const v = this.doctorForm.value;
      this.call({
        name:           v.name!,
        email:          v.email!,
        phone:          v.phone || '',
        password:       v.password!,
        role:           'DOCTOR',
        // Doctor-specific fields — exact RegisterRequest DTO field names
        specialization:  v.specialization || undefined,
        experienceYears: v.experience ?? undefined,
        consultationFee: v.fee ?? undefined,
        qualification:   v.hospital || undefined,
        bio:             v.bio || undefined,
        latitude:        v.latitude ?? undefined,
        longitude:       v.longitude ?? undefined,
      });
    }

    if (r === 'AMBULANCE') {
      if (this.ambulanceForm.invalid) { this.ambulanceForm.markAllAsTouched(); return; }
      const v = this.ambulanceForm.value;
      this.call({
        name:         v.name!,
        email:        v.email!,
        phone:        v.phone!,
        password:     v.password!,
        role:         'AMBULANCE',
        // Ambulance-specific fields — exact RegisterRequest DTO
        vehicleNumber: v.vehicleNumber!.toUpperCase(),
        vehicleType:   v.vehicleType || undefined,
        driverPhone:   v.driverPhone || v.phone!,
        hospital:      v.hospital || undefined,
      });
    }
  }

  private call(body: any) {
    this.loading = true;
    this.auth.register(body).subscribe({
      next: (res) => {
        this.loading = false;
        if (!res.success) { this.error = res.message || 'Registration failed'; return; }
        const r = this.role();
        if (r === 'DOCTOR' || r === 'AMBULANCE') {
          this.success = '✅ Registration submitted! Waiting for admin approval. You can now login.';
          this.toast.success('Registration submitted!');
          setTimeout(() => this.router.navigate(['/auth/login']), 2500);
        } else {
          this.success = '✅ Account created!';
          this.toast.success('Welcome to MediConnect!');
          setTimeout(() => this.router.navigate(['/dashboard']), 1200);
        }
      },
      error: (e) => {
        this.loading = false;
        const errData = e?.error?.data;
        if (errData && typeof errData === 'object') {
          this.error = Object.values(errData)[0] as string;
        } else {
          this.error = e?.error?.message || 'Registration failed. Try again.';
        }
      }
    });
  }
}