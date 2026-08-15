// ─────────────────────────────────────────────────────────────
// auth.interceptor.ts — attaches Bearer token to all /api/* requests
// On 401: attempts token refresh, then retries original request
// Monolith reads userId/role from JWT directly (no gateway headers)
// ─────────────────────────────────────────────────────────────
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth  = inject(AuthService);
  const token = auth.token();

  // /api/public/** endpoints — no token attach karo
  // Agar token bheja aur invalid/expired ho toh backend 401 deta hai
  // even though endpoint permitAll hai
  const isPublic = req.url.includes('/api/public/');

  const authReq = (token && !isPublic)
    ? req.clone({ setHeaders: { 'Authorization': `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && auth.isLoggedIn()) {
        try {
          const raw = sessionStorage.getItem('mc_session');
          const stored = raw ? JSON.parse(raw) : null;
          const rt = stored?.refreshToken;
          if (rt) {
            return auth.refreshToken(rt).pipe(
              switchMap(res => {
                if (res.success && res.data?.accessToken) {
                  const retried = req.clone({
                    setHeaders: { 'Authorization': `Bearer ${res.data.accessToken}` }
                  });
                  return next(retried);
                }
                auth.logout();
                return throwError(() => err);
              }),
              catchError(() => { auth.logout(); return throwError(() => err); })
            );
          }
        } catch {}
        auth.logout();
      }
      return throwError(() => err);
    })
  );
};