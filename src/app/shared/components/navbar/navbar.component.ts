import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AvatarUploadComponent } from '../AvatarUploadComponent';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, AvatarUploadComponent],
  template: `
    <nav class="navbar">
      <div class="nav-inner">
        <a routerLink="/" class="nav-brand">
          <img [src]="logoDataUrl" alt="Doctor-Desk logo" class="brand-icon-img">
          <span class="brand-name">Doctor-Desk</span>
        </a>

        <button class="hamburger" (click)="menuOpen=!menuOpen" [class.open]="menuOpen" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>

        <div class="nav-links" [class.open]="menuOpen" (click)="menuOpen=false">

          <!-- Always visible -->
          <a routerLink="/doctors"     routerLinkActive="active" class="nav-link">Doctors</a>
          <a routerLink="/ambulance"   routerLinkActive="active" class="nav-link">Ambulance</a>
          <a routerLink="/book"        routerLinkActive="active" class="nav-link">Book (Guest)</a>

          <!-- Authenticated -->
          @if (auth.isLoggedIn()) {

            <!-- Patient links -->
            @if (auth.isPatient()) {
              <a routerLink="/dashboard"     routerLinkActive="active" class="nav-link">My Dashboard</a>
              <a routerLink="/prescriptions" routerLinkActive="active" class="nav-link">Prescriptions</a>
              <a routerLink="/lab-tests"     routerLinkActive="active" class="nav-link">Lab Tests</a>
              <a routerLink="/records"       routerLinkActive="active" class="nav-link">My Records</a>
            }

            <!-- Doctor links -->
            @if (auth.isDoctor()) {
              <a routerLink="/doctor/dashboard" routerLinkActive="active" class="nav-link">Dashboard</a>
              <a routerLink="/clinic"           routerLinkActive="active" class="nav-link">Clinic</a>
              <a routerLink="/prescriptions"    routerLinkActive="active" class="nav-link">Prescriptions</a>
              <a routerLink="/lab-tests"        routerLinkActive="active" class="nav-link">Lab Tests</a>
              <a routerLink="/records"          routerLinkActive="active" class="nav-link">Records</a>
            }

            <!-- Ambulance links -->
            @if (auth.isAmbulance()) {
              <a routerLink="/ambulance/dashboard" routerLinkActive="active" class="nav-link">My Dashboard</a>
            }

            <!-- Admin links -->
            @if (auth.isAdmin()) {
              <a routerLink="/admin" routerLinkActive="active" class="nav-link">Admin Panel</a>
            }

            <div class="nav-divider"></div>
            <div class="nav-user">
              <span class="user-chip">
                <span class="user-avatar">
                  <app-avatar-upload [imageUrl]="auth.user()?.profileImageUrl" [name]="auth.getUserName()" size="sm" [editable]="false"></app-avatar-upload>
                </span>
                <span class="user-name">{{ auth.getUserName() }}</span>
                <span class="user-role badge-pill">{{ auth.role() }}</span>
              </span>
              <button class="btn btn-ghost btn-sm" (click)="auth.logout()">Sign out</button>
            </div>
          }

          @if (!auth.isLoggedIn()) {
            <div class="nav-auth">
              <a routerLink="/auth/login"    class="btn btn-ghost btn-sm">Sign in</a>
              <a routerLink="/auth/register" class="btn btn-primary btn-sm">Register</a>
            </div>
          }
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .brand-icon-img { height: 26px; width: 26px; object-fit: contain; border-radius: 6px; }
    .navbar {
      position: sticky; top: 0; z-index: 100;
      background: var(--surface, #fff); border-bottom: 1px solid var(--border, #e5e7eb);
      backdrop-filter: blur(8px);
    }
    .nav-inner {
      max-width: 1280px; margin: 0 auto; padding: 0 20px;
      display: flex; align-items: center; gap: 8px; height: 60px;
    }
    .nav-brand {
      display: flex; align-items: center; gap: 8px; text-decoration: none;
      font-size: 17px; font-weight: 700; color: var(--primary, #1D9E75); margin-right: 12px; flex-shrink: 0;
    }
    .brand-icon { font-size: 20px; }
    .nav-links {
      display: flex; align-items: center; gap: 4px; flex: 1; flex-wrap: wrap;
    }
    .nav-link {
      padding: 6px 10px; font-size: 14px; border-radius: 6px; text-decoration: none;
      color: var(--text-2, #6b7280); transition: all .15s; white-space: nowrap;
      &:hover { background: var(--surface-2, #f3f4f6); color: var(--text, #111); }
      &.active { color: var(--primary, #1D9E75); font-weight: 500; background: var(--primary-light, #e8f7f2); }
    }
    .nav-divider { width: 1px; height: 24px; background: var(--border, #e5e7eb); margin: 0 6px; }
    .nav-user { display: flex; align-items: center; gap: 8px; margin-left: auto; }
    .user-chip { display: flex; align-items: center; gap: 6px; }
    .user-avatar { display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .user-name { font-size: 13px; font-weight: 500; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .user-role { font-size: 10px; padding: 2px 7px; border-radius: 99px; background: var(--primary-light, #e8f7f2); color: var(--primary-dark, #0a6649); font-weight: 600; }
    .nav-auth { display: flex; align-items: center; gap: 8px; margin-left: auto; }
    .hamburger { display: none; flex-direction: column; gap: 4px; background: none; border: none; cursor: pointer; padding: 6px; span { display: block; width: 22px; height: 2px; background: var(--text-2, #6b7280); border-radius: 2px; transition: all .2s; } &.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); } &.open span:nth-child(2) { opacity: 0; } &.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); } }
    @media (max-width: 768px) {
      .hamburger { display: flex; margin-left: auto; }
      .nav-links {
        display: none;
        &.open {
          display: flex;
          position: fixed; top: 60px; left: 0; right: 0; bottom: 0;
          background: var(--surface, #fff);
          flex-direction: column; align-items: flex-start;
          padding: 12px 16px 40px; gap: 2px;
          overflow-y: auto;
          box-shadow: 0 4px 20px rgba(0,0,0,.1);
          z-index: 200;
        }
        .nav-link {
          width: 100%; padding: 12px 14px; font-size: 15px; border-radius: 8px;
        }
        .nav-divider { width: 100%; height: 1px; margin: 8px 0; }
        .nav-auth {
          margin-left: 0; width: 100%; padding: 8px 0; gap: 8px;
          display: flex; flex-direction: column;
          a { width: 100%; text-align: center; justify-content: center; padding: 12px 18px; font-size: 15px; }
        }
        .nav-user {
          margin-left: 0; width: 100%; padding: 8px 0;
          display: flex; flex-direction: column; gap: 10px;
          .user-chip {
            display: flex; align-items: center; gap: 10px;
            padding: 10px 12px; background: var(--surface-2, #f3f4f6);
            border-radius: 10px; width: 100%;
          }
          .user-name { max-width: none; font-size: 15px; }
          button { width: 100%; justify-content: center; padding: 12px; font-size: 15px; }
        }
      }
    }
  `]
})
export class NavbarComponent {
  auth = inject(AuthService);
  menuOpen = false;
  // Embedded directly (base64) so it never depends on the assets folder / build config —
  // guaranteed to render regardless of asset-serving issues.
  logoDataUrl = 'data:image/png;base64,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';
}