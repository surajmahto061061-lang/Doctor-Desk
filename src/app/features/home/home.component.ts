import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <!-- Hero -->
    <section class="hero">
      <div class="hero-content">
        <div class="hero-badge">Trusted healthcare platform</div>
        <h1>Your health,<br>our priority</h1>
        <p>Book appointments with top-rated doctors, request emergency ambulances, and manage your entire healthcare journey — all in one place.</p>
        <div class="hero-actions">
          <a class="btn btn-primary btn-lg" routerLink="/doctors">Find a doctor</a>
          <a class="btn btn-outline btn-lg" routerLink="/ambulance">Emergency ambulance</a>
        </div>
      </div>
      <div class="hero-stats">
        <div class="stat"><strong>500+</strong><span>Doctors</span></div>
        <div class="stat"><strong>50K+</strong><span>Patients</span></div>
        <div class="stat"><strong>100+</strong><span>Ambulances</span></div>
        <div class="stat"><strong>4.8★</strong><span>Rating</span></div>
      </div>
    </section>

    <!-- Features -->
    <section class="page-container">
      <div class="section-header">
        <h2>Everything you need</h2>
        <p>One platform for all your healthcare needs</p>
      </div>
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">📅</div>
          <h3>Instant booking</h3>
          <p>See real-time slot availability and confirm appointments in seconds with automatic payment processing.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🚑</div>
          <h3>Emergency ambulance</h3>
          <p>Request the nearest available ambulance with live GPS tracking so you know exactly where help is.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📍</div>
          <h3>Real-time tracking</h3>
          <p>Track doctors and ambulances on a live map. WebSocket-powered updates with zero delay.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔔</div>
          <h3>Smart notifications</h3>
          <p>Get SMS and email alerts for bookings, cancellations, reminders, and status updates.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🩺</div>
          <h3>Doctor profiles</h3>
          <p>Verified doctors with detailed profiles, specializations, ratings, and clinic locations.</p>
        </div>
        <div class="feature-card">
          <div class="feature-icon">🔒</div>
          <h3>Secure & private</h3>
          <p>JWT-based authentication, role-based access, and encrypted data storage.</p>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="how-section">
      <div class="page-container">
        <div class="section-header"><h2>How it works</h2></div>
        <div class="steps">
          <div class="step"><div class="step-num">1</div><h4>Register</h4><p>Create your account as a patient, doctor, or ambulance driver</p></div>
          <div class="step-arrow">→</div>
          <div class="step"><div class="step-num">2</div><h4>Find</h4><p>Search doctors by specialization, availability, and rating</p></div>
          <div class="step-arrow">→</div>
          <div class="step"><div class="step-num">3</div><h4>Book</h4><p>Pick a date and time slot, confirm payment</p></div>
          <div class="step-arrow">→</div>
          <div class="step"><div class="step-num">4</div><h4>Visit</h4><p>Meet your doctor and get the care you need</p></div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <div class="page-container">
        <div class="cta-card">
          <h2>Ready to get started?</h2>
          <p>Join thousands of patients who trust ediConnect for their healthcare needs.</p>
          <div class="hero-actions">
            <a class="btn btn-primary btn-lg" routerLink="/auth/register">Create free account</a>
            <a class="btn btn-ghost btn-lg" routerLink="/doctors">Browse doctors</a>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .hero {
      background: linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%);
      border-bottom: 1px solid var(--border);
      padding: 64px 24px 48px; text-align: center;
    }
    .hero-content { max-width: 640px; margin: 0 auto; }
    .hero-badge {
      display: inline-block; padding: 4px 14px; border-radius: 20px;
      background: var(--primary-light); color: var(--primary-dark);
      font-size: 13px; font-weight: 500; margin-bottom: 20px;
    }
    .hero h1 { font-size: 3rem; font-weight: 700; color: var(--text); margin-bottom: 16px; line-height: 1.15; }
    .hero p { font-size: 17px; color: var(--text-2); max-width: 500px; margin: 0 auto 28px; }
    .hero-actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
    .hero-stats {
      display: flex; gap: 32px; justify-content: center; flex-wrap: wrap;
      margin-top: 48px; padding-top: 32px; border-top: 1px solid rgba(0,0,0,.08);
      .stat { text-align: center;
        strong { display: block; font-size: 24px; font-weight: 700; color: var(--primary); }
        span   { font-size: 13px; color: var(--text-2); }
      }
    }
    .section-header { text-align: center; margin-bottom: 32px;
      h2 { margin-bottom: 6px; } p { color: var(--text-2); }
    }
    .features-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .feature-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-lg); padding: 24px;
      .feature-icon { font-size: 32px; margin-bottom: 14px; }
      h3 { margin-bottom: 8px; font-size: 16px; color: var(--text); }
      p  { font-size: 14px; line-height: 1.6; }
    }
    .how-section { background: var(--surface-2); border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 48px 0; margin-top: 32px; }
    .steps { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: center; }
    .step { text-align: center; max-width: 140px;
      .step-num { width: 40px; height: 40px; border-radius: 50%; background: var(--primary); color: #fff; font-size: 18px; font-weight: 700; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; }
      h4 { margin-bottom: 6px; }
      p  { font-size: 13px; }
    }
    .step-arrow { font-size: 20px; color: var(--text-3); }
    .cta-section { padding: 48px 0; }
    .cta-card { background: var(--primary); border-radius: var(--radius-lg); padding: 40px; text-align: center;
      h2 { color: #fff; margin-bottom: 10px; }
      p  { color: rgba(255,255,255,.8); margin-bottom: 24px; }
      .btn-primary { background: #fff; color: var(--primary); }
      .btn-ghost   { border-color: rgba(255,255,255,.5); color: #fff; &:hover { background: rgba(255,255,255,.1); } }
    }
    @media (max-width: 640px) { .hero h1 { font-size: 2rem; } .step-arrow { display: none; } }
  `]
})
export class HomeComponent {}
