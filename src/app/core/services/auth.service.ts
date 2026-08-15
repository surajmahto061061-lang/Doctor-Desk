import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, firstValueFrom, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LoginRequest, RegisterRequest, AuthResponse, UserInfo,
  ApiResponse, ChangePasswordRequest, ApprovalRequest,
  AdminDoctorEntry, AdminAmbulanceEntry
} from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base  = `${environment.apiUrl}/auth`;
  private admin = `${environment.apiUrl}/auth/admin`;

  private _token = signal<string | null>(null);
  private _user  = signal<UserInfo | null>(null);

  readonly token       = this._token.asReadonly();
  readonly user        = this._user.asReadonly();
  readonly isLoggedIn  = computed(() => !!this._token());
  readonly role        = computed(() => this._user()?.role ?? null);
  readonly isDoctor    = computed(() => this._user()?.role === 'DOCTOR');
  readonly isPatient   = computed(() => this._user()?.role === 'PATIENT');
  readonly isAdmin     = computed(() => this._user()?.role === 'ADMIN');
  readonly isAmbulance = computed(() => this._user()?.role === 'AMBULANCE');

  private readonly SESSION_KEY = 'mc_session';

  constructor(private http: HttpClient, private router: Router) {
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      const raw = sessionStorage.getItem(this.SESSION_KEY);
      if (!raw) return;
      const data: { token: string; user: UserInfo } = JSON.parse(raw);
      if (data?.token && data?.user) {
        this._token.set(data.token);
        this._user.set(data.user);
      }
    } catch { sessionStorage.removeItem(this.SESSION_KEY); }
  }

  register(req: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/register`, req);
  }

  async registerAsync(req: RegisterRequest): Promise<{ success: boolean; message: string }> {
    try {
      const res = await firstValueFrom(this.register(req));
      if (res.success && res.data?.accessToken) {
        // Always save session so user is logged in after register
        this.saveSession(res.data);
        // Doctor/Ambulance — show pending screen (dashboard handles it)
        if (req.role === 'DOCTOR' || req.role === 'AMBULANCE') {
          this.router.navigate(['/doctor/dashboard']);
          return { success: true, message: 'Registration successful! Waiting for admin approval.' };
        }
        this.navigateByRole(res.data.role);
      }
      return { success: true, message: res.message || 'Registration successful!' };
    } catch (err: any) {
      const errData = err.error?.data;
      if (errData && typeof errData === 'object') {
        return { success: false, message: Object.values(errData)[0] as string };
      }
      return { success: false, message: err.error?.message || 'Registration failed.' };
    }
  }

  login(req: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.base}/login`, req).pipe(
      tap(res => { if (res.success && res.data) this.saveSession(res.data); })
    );
  }

  async loginAsync(email: string, password: string): Promise<{ success: boolean; message: string }> {
    try {
      const res = await firstValueFrom(this.login({ email, password }));
      if (res.success && res.data?.accessToken) {
        this.navigateByRole(res.data.role);
        return { success: true, message: 'Login successful!' };
      }
      return { success: false, message: res.message || 'Login failed.' };
    } catch (err: any) {
      return { success: false, message: err.error?.message || 'Invalid credentials.' };
    }
  }

  refreshToken(refreshToken: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(
      `${this.base}/refresh`, { refreshToken }
    ).pipe(
      tap(res => { if (res.success && res.data) this.saveSession(res.data); })
    );
  }

  getProfile(): Observable<ApiResponse<UserInfo>> {
    return this.http.get<ApiResponse<UserInfo>>(`${this.base}/profile`).pipe(
      tap(res => { if (res.success && res.data) this._user.set(res.data); })
    );
  }

  // Profile picture upload — multipart/form-data. Backend field name "file".
  uploadProfilePicture(file: File): Observable<ApiResponse<UserInfo>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<UserInfo>>(`${this.base}/profile/picture`, formData).pipe(
      tap(res => { if (res.success && res.data) this.updateUserAndSession(res.data); })
    );
  }

  removeProfilePicture(): Observable<ApiResponse<UserInfo>> {
    return this.http.delete<ApiResponse<UserInfo>>(`${this.base}/profile/picture`).pipe(
      tap(res => { if (res.success && res.data) this.updateUserAndSession(res.data); })
    );
  }

  // _user signal update karo AND sessionStorage bhi refresh karo (taaki page
  // reload ke baad bhi naya photo turant dikhe, restoreSession() se turant milega)
  private updateUserAndSession(updated: UserInfo): void {
    this._user.set(updated);
    try {
      const raw = sessionStorage.getItem(this.SESSION_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        data.user = updated;
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(data));
      }
    } catch {}
  }

  changePassword(req: ChangePasswordRequest): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(`${this.base}/password`, req);
  }

  health(): Observable<ApiResponse<string>> {
    return this.http.get<ApiResponse<string>>(`${this.base}/health`);
  }

  listDoctors(status?: 'PENDING' | 'APPROVED' | 'REJECTED'): Observable<ApiResponse<AdminDoctorEntry[]>> {
    const url = status ? `${this.admin}/doctors?status=${status}` : `${this.admin}/doctors`;
    return this.http.get<ApiResponse<AdminDoctorEntry[]>>(url);
  }

  processDoctorApproval(userId: number, req: ApprovalRequest): Observable<ApiResponse<string>> {
    return this.http.put<ApiResponse<string>>(
      `${this.admin}/doctors/${userId}/approval`, req
    );
  }

  listAmbulanceDrivers(): Observable<ApiResponse<AdminAmbulanceEntry[]>> {
    return this.http.get<ApiResponse<AdminAmbulanceEntry[]>>(`${this.admin}/ambulances`);
  }

  logout(): void {
    try { this.http.post(`${this.base}/logout`, {}).subscribe(); } catch {}
    this._token.set(null);
    this._user.set(null);
    try { sessionStorage.removeItem(this.SESSION_KEY); } catch {}
    this.router.navigate(['/']);
  }

  getUserId(): number | null   { return this._user()?.id ?? null; }
  getUserName(): string | null { return this._user()?.name ?? null; }
  getToken(): string | null    { return this._token(); }

  // FIX: Backend AuthResponse has flat fields (name, role, approvalStatus)
  // NOT a nested user object — map them to UserInfo shape for frontend
  private saveSession(data: AuthResponse): void {
    this._token.set(data.accessToken);

    const userInfo: UserInfo = {
      id:             (data as any).userId ?? (data as any).id,
      name:           (data as any).name   ?? '',
      email:          (data as any).email  ?? '',
      phone:          (data as any).phone  ?? '',
      role:           (data as any).role   as any,
      approvalStatus: (data as any).approvalStatus ?? 'APPROVED',
    };
    this._user.set(userInfo);

    try {
      sessionStorage.setItem(this.SESSION_KEY, JSON.stringify({
        token:        data.accessToken,
        refreshToken: data.refreshToken,
        user:         userInfo
      }));
    } catch {}
  }

  private navigateByRole(role: string): void {
    if (role === 'ADMIN')          this.router.navigate(['/admin']);
    else if (role === 'DOCTOR')    this.router.navigate(['/doctor/dashboard']);
    else if (role === 'AMBULANCE') this.router.navigate(['/ambulance/dashboard']);
    else                           this.router.navigate(['/dashboard']);
  }
}