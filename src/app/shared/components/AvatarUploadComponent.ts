import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from 'src/app/core/services/auth.service';
import { ToastService } from 'src/app/core/services/toast.service';


// Reusable avatar — photo dikhata hai agar hai, warna naam ka pehla letter
// colored circle mein. `editable=true` par upload/remove ka option bhi milta
// hai (self-profile ke liye). Kisi bhi jagah drop karo:
//   <app-avatar-upload [imageUrl]="auth.user()?.profileImageUrl"
//                       [name]="auth.user()?.name" size="md" [editable]="true" />
@Component({
  selector: 'app-avatar-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar-wrap" [class]="'size-' + size">
      <div class="avatar-circle" [style.background]="imageUrl ? 'transparent' : bgColor">
        @if (imageUrl) {
          <img [src]="fullImageUrl" [alt]="name || 'Profile'" class="avatar-img" />
        } @else {
          <span class="avatar-letter">{{ (name || '?').charAt(0).toUpperCase() }}</span>
        }

        @if (uploading) {
          <div class="avatar-loading"><span class="spinner spinner-sm"></span></div>
        }
      </div>

      @if (editable) {
        <button type="button" class="avatar-edit-btn" (click)="fileInput.click()"
          [disabled]="uploading" title="Photo change karein">
          📷
        </button>
        <input #fileInput type="file" accept="image/jpeg,image/png,image/webp"
          style="display:none" (change)="onFileSelected($event)" />

        @if (imageUrl) {
          <button type="button" class="avatar-remove-btn" (click)="removePhoto()"
            [disabled]="uploading" title="Photo hataayein">✕</button>
        }
      }
    </div>
  `,
  styles: [`
    .avatar-wrap { position: relative; display: inline-block; }
    .avatar-circle {
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      overflow: hidden; color: #fff; font-weight: 700; flex-shrink: 0;
    }
    .avatar-img { width: 100%; height: 100%; object-fit: cover; }
    .size-sm .avatar-circle { width: 32px; height: 32px; font-size: 13px; }
    .size-md .avatar-circle { width: 48px; height: 48px; font-size: 18px; }
    .size-lg .avatar-circle { width: 80px; height: 80px; font-size: 30px; }
    .size-xl .avatar-circle { width: 120px; height: 120px; font-size: 44px; }
    .avatar-loading {
      position: absolute; inset: 0; background: rgba(0,0,0,.45);
      display: flex; align-items: center; justify-content: center; border-radius: 50%;
    }
    .avatar-edit-btn, .avatar-remove-btn {
      position: absolute; border-radius: 50%; border: 2px solid #fff; cursor: pointer;
      display: flex; align-items: center; justify-content: center; padding: 0;
      background: var(--primary, #1D9E75); color: #fff; font-size: 12px;
    }
    .avatar-edit-btn { bottom: -2px; right: -2px; width: 24px; height: 24px; }
    .avatar-remove-btn { top: -2px; right: -2px; width: 20px; height: 20px; background: #e53e3e; font-size: 10px; }
    .avatar-edit-btn:disabled, .avatar-remove-btn:disabled { opacity: .5; cursor: not-allowed; }
  `]
})
export class AvatarUploadComponent {
  @Input() imageUrl: string | null | undefined = null;
  @Input() name: string | null | undefined = '';
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() editable = false;

  private auth  = inject(AuthService);
  private toast = inject(ToastService);

  uploading = false;

  get bgColor(): string {
    const colors = ['#1D9E75', '#0A6A8B', '#7B4EA6', '#C05621', '#2B6CB0'];
    const n = this.name || '?';
    return colors[n.charCodeAt(0) % colors.length];
  }

  // Backend "/uploads/..." relative path deta hai — dev proxy isse forward
  // karta hai, isliye seedha use kar sakte hai (production mein bhi same
  // origin se serve hoga agar reverse-proxy configured hai)
  get fullImageUrl(): string {
    return this.imageUrl || '';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      this.toast.error('File 5MB se badi hai — chhoti image chuno');
      input.value = '';
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.toast.error('Sirf JPG, PNG ya WEBP images allowed hain');
      input.value = '';
      return;
    }

    this.uploading = true;
    this.auth.uploadProfilePicture(file).subscribe({
      next: res => {
        this.uploading = false;
        if (res.success) this.toast.success('Profile picture update ho gayi!');
        else this.toast.error(res.message || 'Upload fail ho gaya');
        input.value = '';
      },
      error: (e: any) => {
        this.uploading = false;
        this.toast.error(e?.error?.message || 'Upload fail ho gaya');
        input.value = '';
      }
    });
  }

  removePhoto() {
    this.uploading = true;
    this.auth.removeProfilePicture().subscribe({
      next: res => {
        this.uploading = false;
        if (res.success) this.toast.success('Photo hata di gayi');
      },
      error: () => {
        this.uploading = false;
        this.toast.error('Photo hataane mein dikkat aayi');
      }
    });
  }
}