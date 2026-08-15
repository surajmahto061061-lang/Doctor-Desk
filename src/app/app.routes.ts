import { Routes } from '@angular/router';
import { authGuard, guestGuard, doctorGuard, adminGuard, patientGuard, ambulanceGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./features/home/home.component').then(m => m.HomeComponent) },
  {
    path: 'auth',
    children: [
      { path: 'login',    canActivate: [guestGuard], loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) }
    ]
  },
  { path: 'doctors',    loadComponent: () => import('./features/doctors/doctor-list/doctor-list.component').then(m => m.DoctorListComponent) },
  { path: 'doctors/:id', loadComponent: () => import('./features/doctors/doctor-detail/doctor-detail.component').then(m => m.DoctorDetailComponent) },
  { path: 'ambulance',  loadComponent: () => import('./features/ambulance/ambulance.component').then(m => m.AmbulanceComponent) },
  { path: 'book',       loadComponent: () => import('./features/public-booking/public-booking.component').then(m => m.PublicBookingComponent) },
  { path: 'dashboard',  canActivate: [patientGuard],   loadComponent: () => import('./features/dashboard/patient-dashboard/patient-dashboard.component').then(m => m.PatientDashboardComponent) },
  { path: 'doctor/dashboard', canActivate: [doctorGuard], loadComponent: () => import('./features/dashboard/doctor-dashboard/doctor-dashboard.component').then(m => m.DoctorDashboardComponent) },
  { path: 'ambulance/dashboard', canActivate: [ambulanceGuard], loadComponent: () => import('./features/dashboard/ambulance-dashboard/ambulance-dashboard.component').then(m => m.AmbulanceDashboardComponent) },
  { path: 'admin',        canActivate: [adminGuard],  loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent) },
  { path: 'prescriptions', canActivate: [authGuard],  loadComponent: () => import('./features/prescriptions/prescriptions.component').then(m => m.PrescriptionsComponent) },
  { path: 'lab-tests',    canActivate: [authGuard],   loadComponent: () => import('./features/lab-tests/lab-tests.component').then(m => m.LabTestsComponent) },
  { path: 'records',      canActivate: [authGuard],   loadComponent: () => import('./features/patient-records/patient-records.component').then(m => m.PatientRecordsComponent) },
  { path: 'clinic',       canActivate: [doctorGuard], loadComponent: () => import('./features/clinic/clinic.component').then(m => m.ClinicComponent) },
  { path: '**', redirectTo: '' }
];
