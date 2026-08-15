import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// FIX: guestGuard now redirects based on role instead of hardcoding /dashboard
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  router.navigate(['/auth/login']);
  return false;
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) return true;
  // Role-aware redirect
  const role = auth.role();
  if (role === 'DOCTOR') router.navigate(['/doctor/dashboard']);
  else if (role === 'ADMIN') router.navigate(['/admin']);
  else if (role === 'AMBULANCE') router.navigate(['/ambulance/dashboard']);
  else router.navigate(['/dashboard']);
  return false;
};

// FIX: patientGuard — only PATIENT role can access /dashboard
export const patientGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isLoggedIn()) { router.navigate(['/auth/login']); return false; }
  if (auth.isPatient()) return true;
  // Non-patient logged-in users go to their own dashboard
  const role = auth.role();
  if (role === 'DOCTOR') router.navigate(['/doctor/dashboard']);
  else if (role === 'ADMIN') router.navigate(['/admin']);
  else if (role === 'AMBULANCE') router.navigate(['/ambulance/dashboard']);
  else router.navigate(['/']);
  return false;
};

export const doctorGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.isDoctor()) return true;
  router.navigate([auth.isLoggedIn() ? '/dashboard' : '/auth/login']);
  return false;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.isAdmin()) return true;
  router.navigate(['/']);
  return false;
};

// FIX: ambulanceGuard — only AMBULANCE role
export const ambulanceGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isLoggedIn() && auth.role() === 'AMBULANCE') return true;
  router.navigate([auth.isLoggedIn() ? '/' : '/auth/login']);
  return false;
};
