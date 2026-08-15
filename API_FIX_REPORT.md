# MediConnect Frontend — API Fix Report

Backend: Solvixon Healthcare (Spring Boot :8080)  
All routes are under `/api/*` — proxied from Angular dev server via `proxy.conf.json`.

---

## Files Modified

### `src/app/core/models/index.ts`
- Added missing interfaces: `AppointmentResponse`, `AmbulanceResponse`, `AmbulanceLocationResponse`, `AmbulanceBookingRequest/Response`, `GuestAppointmentRequest`, `GuestBookingResponse`, `RazorpayOrderResponse`, `RazorpayVerifyRequest`, `PatientRecordRequest/Response`, `LabTestRequest/Response`, `LabTestResultRequest`, `PrescriptionRequest/Response`, `BedRequest/Response`, `BedAssignRequest`, `InventoryItemRequest/Response`, `InvoiceRequest/Response`, `InvoicePaymentRequest`, `InvoiceItemLine`, `StaffRequest/Response`, `ClinicDashboardResponse`, `NotificationRequest`, `AmbulanceRegisterRequest`, `SlotResponse`, `SlotSummaryResponse`, `ClinicRequest`, `UnavailableDate`, `LocationUpdateRequest`
- Renamed ambiguous aliases for clarity (kept old names as `type =` aliases for component compat)

---

## Files Fixed

### `auth.service.ts`
| Bug | Fix |
|-----|-----|
| `private admin = '/api/admin'` | Changed to `/api/auth/admin` — backend `AdminController` maps to `/api/auth/admin/*` |
| `refreshToken` body sent as `{ refreshToken }` | Backend reads it from `body.password` — changed to `{ password: refreshToken }` |
| `processDoctorApproval(id, action, reason)` took loose params | Now takes `ApprovalRequest` object matching backend DTO |

### `admin.service.ts`
| Bug | Fix |
|-----|-----|
| `private admin = '/api/admin'` | Changed to `/api/auth/admin` |
| `POST /api/ambulance` to register | Changed to `POST /api/ambulance/register` |
| `PATCH /api/ambulance/{id}/status` | Backend uses `/api/ambulance/my/status?status=` (JWT identifies driver) — removed `id` param |

### `doctor.service.ts`
| Bug | Fix |
|-----|-----|
| `private priv = '/api/doctor'` (authenticated) | Removed — backend has ONE `DoctorController` at `/api/doctors/*` for both public and authed |
| `GET /api/doctor/profile` | Fixed to `GET /api/doctors/profile/me` |
| `PUT /api/doctor/profile` | Fixed to `PUT /api/doctors/profile` |
| `PATCH /api/doctor/availability` | Fixed to `PATCH /api/doctors/profile/availability` |
| `POST /api/doctor/clinics` | Fixed to `POST /api/doctors/clinics` |
| `GET /api/doctor/clinics` | Fixed to `GET /api/doctors/clinics` |
| `PATCH /api/doctor/location` | Fixed to `PATCH /api/doctors/location` |
| `GET /api/doctor/unavailable` | Removed — not in backend |
| `POST /api/doctor/slots/generate` | Removed — not in backend |
| `PUT /api/doctor/bank-details` | Removed — not in backend |
| `GET /api/doctors/{id}/bank-details` | Removed — not in backend |

### `booking.service.ts`
| Bug | Fix |
|-----|-----|
| `POST /api/doctor/patients` (create patient record) | Removed — no such backend route; use `PatientRecordService` instead |
| `GET /api/doctor/patients/*` (all patient record routes) | Removed — moved to `PatientRecordService` (`/api/patient-records/*`) |
| `GET /api/bookings/appointments/doctor/by-date?date=` | Removed — not in backend |
| `PATCH /api/bookings/appointments/{id}/doctor-update` | Removed — not in backend; use `completeAppointment` |
| `confirmPayment` accepted `PaymentConfirmRequest` body | Backend `/confirm-payment` takes no body (JWT identifies user) — changed to empty `{}` |
| Missing Razorpay endpoints | Added `createRazorpayOrder()` and `verifyRazorpayPayment()` |

### `ambulance.service.ts`
| Bug | Fix |
|-----|-----|
| `private driver = '/api/ambulance/driver'` | Removed — backend uses `/api/ambulance/my` |
| `GET /api/ambulance/driver/my` | Fixed to `GET /api/ambulance/my` |
| `PATCH /api/ambulance/driver/location` | Fixed to `PATCH /api/ambulance/my/location` |
| `PATCH /api/ambulance/driver/status` with body | Fixed to `PATCH /api/ambulance/my/status?status=` (query param) |
| `POST /api/ambulance` (register) | Fixed to `POST /api/ambulance/register` |
| Missing `getNearest(lat, lng)` | Added — `GET /api/ambulance/nearest?lat=&lng=` |

### `notification.service.ts`
- Typed `NotificationRequest` properly (was using `any`)
- Fixed return types to `ApiResponse<string>`

---

## New Files Added

### `slot.service.ts` ← NEW
Complete service for `SlotController`:
- `GET /api/slots/{doctorId}/available?date=`
- `GET /api/slots/{doctorId}/free?date=`
- `GET /api/slots/{doctorId}/summary?date=`

### `public-booking.service.ts` ← NEW
Complete service for `PublicBookingController` (no auth required):
- `POST /api/public/bookings/appointment` — guest book
- `GET  /api/public/bookings/appointment/{id}/track?phone=` — guest track
- `POST /api/public/bookings/appointment/{id}/razorpay/order?phone=`
- `POST /api/public/bookings/appointment/{id}/razorpay/verify`
- `GET  /api/public/doctors/{doctorId}/qrcode/link`
- `getDoctorQrImageUrl(doctorId)` — returns URL string for `<img src>`

### `patient-record.service.ts` ← NEW
Complete service for `PatientRecordController`:
- `POST   /api/patient-records`
- `GET    /api/patient-records/patient/{patientId}`
- `GET    /api/patient-records/patient/{patientId}/type/{type}`
- `DELETE /api/patient-records/{recordId}`

### `prescription.service.ts` ← NEW
Complete service for `PrescriptionController`:
- `POST /api/prescriptions`
- `GET  /api/prescriptions/patient/{patientId}`
- `GET  /api/prescriptions/doctor/{doctorId}`
- `PUT  /api/prescriptions/{prescriptionId}/follow-up-done`

### `lab-test.service.ts` ← NEW
Complete service for `LabTestController`:
- `POST /api/lab-tests`
- `GET  /api/lab-tests/patient/{patientId}`
- `GET  /api/lab-tests/clinic/{clinicId}`
- `PUT  /api/lab-tests/{testId}/status?status=`
- `PUT  /api/lab-tests/{testId}/result`

### `clinic.service.ts` ← NEW
Aggregated service covering clinic-scoped controllers:
- **Beds** `/api/beds/*` — add, list, admit, discharge
- **Inventory** `/api/inventory/*` — add item, list, low-stock, update stock
- **Staff** `/api/staff/*` — add, list, update, deactivate
- **Invoices** `/api/invoices/*` — create, list by patient/clinic, record payment
- **Dashboard** `/api/dashboard/*` — clinic dashboard stats

---

## How to update existing components

### Components using `BookingService` for patient records
Replace calls like:
```ts
// OLD (broken)
this.bookingService.createPatientRecord(req)
this.bookingService.getPatientHistory(patientId)

// NEW
import { PatientRecordService } from '../../core/services/patient-record.service';
this.patientRecordService.addRecord(req)
this.patientRecordService.getPatientHistory(patientId)
```

### Components using `DoctorService` for slots
Replace calls like:
```ts
// OLD (broken — /api/doctor/slots/*)
this.doctorService.getSlots(doctorId, date)

// NEW
import { SlotService } from '../../core/services/slot.service';
this.slotService.getFreeSlots(doctorId, date)
```

### Components using `AdminService` for ambulance status
```ts
// OLD (broken — /api/ambulance/{id}/status)
this.adminService.markAmbulanceAvailable(id)

// NEW — backend identifies driver from JWT, no id needed
this.ambulanceService.updateMyStatus('AVAILABLE')
```

### Razorpay payment flow (was missing)
```ts
// Step 1: create order
const order = await this.bookingService.createRazorpayOrder(appointmentId).toPromise();

// Step 2: open Razorpay checkout with order.data.orderId

// Step 3: verify after success
await this.bookingService.verifyRazorpayPayment(appointmentId, {
  razorpayOrderId: ...,
  razorpayPaymentId: ...,
  razorpaySignature: ...
}).toPromise();
```
