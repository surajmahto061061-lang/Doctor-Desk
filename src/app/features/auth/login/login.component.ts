import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule],
  template: `
    <div class="auth-page">
      <div class="auth-card card">
        <div class="auth-logo">🏥</div>
        <h2>Welcome back</h2>
        <p>Sign in to your Doctor-desk account</p>

        @if (error) {
          <div class="alert alert-error">{{ error }}</div>
        }

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-group">
            <label>Email address</label>
            <input class="form-control" type="email" formControlName="email" placeholder="you@example.com" autocomplete="email">
            @if (form.get('email')?.touched && form.get('email')?.invalid) {
              <div class="form-error">Valid email is required</div>
            }
          </div>

          <div class="form-group">
            <label>Password</label>
            <input class="form-control" type="password" formControlName="password" placeholder="••••••••" autocomplete="current-password">
            @if (form.get('password')?.touched && form.get('password')?.invalid) {
              <div class="form-error">Password is required</div>
            }
          </div>

          <button class="btn btn-primary btn-block" type="submit" [disabled]="loading">
            @if (loading) { <span class="spinner spinner-sm"></span> Signing in… }
            @else { Sign in }
          </button>
        </form>

        <div class="auth-footer">
          Don't have an account? <a routerLink="/auth/register">Register here</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page { min-height: calc(100vh - 58px); display: flex; align-items: center; justify-content: center; padding: 24px; }
    .auth-card { width: 100%; max-width: 420px; padding: 36px; }
    .auth-logo { font-size: 36px; text-align: center; margin-bottom: 16px; }
    h2 { text-align: center; margin-bottom: 4px; }
    p  { text-align: center; color: var(--text-2); font-size: 14px; margin-bottom: 24px; }
    .btn-block { margin-top: 8px; }
    .auth-footer { text-align: center; margin-top: 20px; font-size: 14px; color: var(--text-2); }
    @media (max-width: 480px) {
      .auth-page { padding: 16px; align-items: flex-start; padding-top: 32px; }
      .auth-card { padding: 24px 16px; }
      .auth-logo { font-size: 30px; }
    }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);
  private router = inject(Router);

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading = false;
  error = '';

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true; this.error = '';
    const { email, password } = this.form.value;
    this.auth.login({ email: email!, password: password! }).subscribe({
      next: (res) => {
        if (!res.success) { this.error = res.message || 'Login failed'; this.loading = false; return; }
        this.toast.success('Welcome back!');
        // AuthService.login already calls saveSession — navigate based on role
        const role = res.data?.role?.toUpperCase();
        if (role === 'ADMIN')      this.router.navigate(['/admin']);
        else if (role === 'DOCTOR')     this.router.navigate(['/doctor/dashboard']);
        else if (role === 'AMBULANCE')  this.router.navigate(['/ambulance/dashboard']);
        else                            this.router.navigate(['/dashboard']);
      },
      error: (e) => {
        this.error = e?.error?.message || 'Invalid email or password';
        this.loading = false;
      }
    });
  }
}