import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @for (t of toast.toasts(); track t.id) {
      <div class="toast toast-{{ t.type }}" (click)="toast.remove(t.id)">
        <span class="toast-icon">{{ icons[t.type] }}</span>
        {{ t.message }}
      </div>
    }
  `,
  styles: [`
    :host {
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      display: flex; flex-direction: column; gap: 8px; pointer-events: none;
    }
    .toast {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 18px; border-radius: var(--radius);
      font-size: 14px; font-weight: 500; pointer-events: all;
      cursor: pointer; box-shadow: var(--shadow-md);
      animation: slideIn .2s ease; min-width: 240px; max-width: 360px;
    }
    @keyframes slideIn {
      from { transform: translateX(60px); opacity: 0; }
      to   { transform: none; opacity: 1; }
    }
    .toast-success { background: #EAF3DE; color: #3B6D11; border: 1px solid #C0DD97; }
    .toast-error   { background: var(--danger-light); color: #A32D2D; border: 1px solid #F7C1C1; }
    .toast-info    { background: #E6F1FB; color: #185FA5; border: 1px solid #B5D4F4; }
    .toast-warning { background: var(--warning-light); color: #854F0B; border: 1px solid #FAC775; }
    .toast-icon    { font-size: 16px; flex-shrink: 0; }
  `]
})
export class ToastComponent {
  toast = inject(ToastService);
  icons: Record<string, string> = {
    success: '✓', error: '✕', info: 'ℹ', warning: '⚠'
  };
}
