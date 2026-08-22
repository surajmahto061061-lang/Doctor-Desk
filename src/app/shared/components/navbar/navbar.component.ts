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
          <img src="assets/logo.png" alt="Doctor-Desk logo" class="brand-icon-img">
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
    .brand-icon-img { height: 60px; width: 40px; object-fit: contain; border-radius: 6px; }
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
    .hamburger {
      display: none; flex-direction: column; gap: 4px; background: none; border: none; cursor: pointer; padding: 6px;
      span { display: block; width: 22px; height: 2px; background: var(--text-2, #6b7280); border-radius: 2px; transition: all .2s; }
      &.open span:nth-child(1) { transform: translateY(6px) rotate(45deg); }
      &.open span:nth-child(2) { opacity: 0; }
      &.open span:nth-child(3) { transform: translateY(-6px) rotate(-45deg); }
    }
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
        .nav-link { width: 100%; padding: 12px 14px; font-size: 15px; border-radius: 8px; }
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
}