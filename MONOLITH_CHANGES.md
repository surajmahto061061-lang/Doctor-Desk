# MediConnect Frontend — Monolith Migration

## What Changed from Microservices → Monolith

### 1. API Base URLs (CRITICAL)
| Old (Microservices) | New (Monolith) |
|---|---|
| Separate ports per service | All on `:8080` via proxy |
| `/api/auth/*` → auth-service:8081 | `/api/auth/*` → localhost:8080 |
| `/api/doctors/*` → doctor-service:8082 | `/api/doctors/*` → localhost:8080 |
| Eureka/Gateway routing | Simple Angular proxy |

### 2. Files Modified

#### `src/environments/environment.ts`
- `apiUrl: '/api'` — all APIs proxied to `:8080`
- `wsUrl: 'http://localhost:8080/ws'` — single WS endpoint

#### `proxy.conf.json`
- Proxy `/api` AND `/ws` both to `http://localhost:8080`
- Added `"ws": true` for WebSocket proxying

#### `auth.interceptor.ts`
- **REMOVED** `X-User-Id`, `X-User-Role`, `X-User-Email` headers
- Monolith reads JWT directly — gateway headers NOT needed
- Only `Authorization: Bearer <token>` required

#### `auth.service.ts`
- Admin endpoints: `/api/auth/admin/*` → `/api/admin/*`
- Matches monolith `AdminController` at `/api/admin`

#### `doctor.service.ts`
- Split into public (`/api/doctors/*`) and authenticated (`/api/doctor/*`)
- Public: search, get by ID, get clinics, get slots, get location
- Authenticated: profile CRUD, slot generation, unavailable dates, bank details, location update
- Added `generateSlots()` → `POST /api/doctor/slots/generate`
- Added `deleteClinic()`, `getMyBankDetails()`

#### `booking.service.ts`
- Added Patient Records methods (new in monolith):
  - `createPatientRecord()` → `POST /api/doctor/patients`
  - `getAllPatients()` → `GET /api/doctor/patients`
  - `getTodayPatients()` → `GET /api/doctor/patients/today`
  - `getPatientsByDate()` → `GET /api/doctor/patients/by-date`
  - `getPatientHistory()` → `GET /api/doctor/patients/history/{patientId}`
  - `getPatientSummaries()` → `GET /api/doctor/patients/summaries`
  - `searchPatients()` → `GET /api/doctor/patients/search`
  - `doctorUpdateAppointment()` → `PATCH /api/bookings/appointments/{id}/doctor-update`

#### `ambulance.service.ts`
- Driver endpoints now at `/api/ambulance/driver/*` (not `/api/ambulance/my/*`)
- `getMyAmbulance()` → `GET /api/ambulance/driver/my`
- `updateMyLocation()` → `PATCH /api/ambulance/driver/location`
- `updateMyStatus()` → `PATCH /api/ambulance/driver/status`
- **REMOVED** `getNearest()` — monolith uses client-side distance sort

#### `admin.service.ts`
- All endpoints under `/api/admin/*`
- Ambulance admin under `/api/ambulance/*`
- `markAmbulanceAvailable()` → `PATCH /api/ambulance/{id}/status`

#### `websocket.service.ts`
- Single endpoint: `ws://localhost:8080/ws` (SockJS)
- In-memory STOMP broker (no Kafka/Redis)
- Added `subscribeToDoctorLocation()` → `/topic/doctor/{id}/location`
- Added `subscribeToBookingAmbulance()` → `/topic/booking/{id}/ambulance-location`
- Renamed `publishLocation()` → `publishAmbulanceLocation()`

#### `models/index.ts`
- Added `PatientRecord`, `CreateRecordRequest`, `UpdateRecordRequest`, `PatientSummary`
- `Appointment` extended with doctor fields: `doctorNotes`, `diagnosis`, `prescription`, `followUpInstructions`, `followUpDate`
- `DoctorStats` extended with `totalPatients`
- `Ambulance` uses `currentLatitude`/`currentLongitude` (entity field names)

#### `doctor-dashboard.component.ts` (major rewrite)
- **NEW TAB: Patient Records** — doctor manages patients date-wise
  - View all patients by summary
  - Filter by date, search by name
  - Create new records with vitals (BP, pulse, temp, SpO₂, weight, height)
  - View patient visit history
- **NEW TAB: By Date** — appointments filtered by any selected date
- **NEW: Slot Generation** — generate time slots for a date range
- **Doctor Update Modal** — fill diagnosis, prescription, follow-up directly on appointment
- Location update for clinic GPS (broadcasts via WebSocket)

### 3. WebSocket Topics (Monolith In-Memory Broker)
| Topic | Purpose |
|---|---|
| `/topic/ambulance/{id}/location` | Ambulance GPS updates |
| `/topic/booking/{id}/ambulance-location` | Patient tracks their ambulance |
| `/topic/doctor/{id}/location` | Doctor/clinic location for patients |
| `/topic/ambulances/all` | All active ambulance broadcast |

### 4. How to Run
```bash
# Start Spring Boot (monolith)
cd mediconnect-monolith
mvn spring-boot:run

# Start Angular frontend (separate terminal)
cd mediconnect-frontend
npm install
ng serve --proxy-config proxy.conf.json

# Open browser
http://localhost:4200
```

### 5. Default Admin Credentials
```
Email: admin@mediconnect.com
Password: Admin@123456
```
(Configured in application.yml)
