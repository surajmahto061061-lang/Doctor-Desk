// ═══════════════════════════════════════════════════════════════
// MediConnect — Models aligned with Solvixon Healthcare backend DTOs
// Backend base: Spring Boot :8080, all routes under /api/*
// ═══════════════════════════════════════════════════════════════

// ── GENERIC WRAPPER ───────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

export interface PagedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last?: boolean;
  first?: boolean;
  empty?: boolean;
}

// ── AUTH ──────────────────────────────────────────────────────
// POST /api/auth/register
export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'PATIENT' | 'DOCTOR' | 'AMBULANCE';
  // Doctor fields (sent in same register body)
  specialization?: string;
  experience?: number;
  hospital?: string;
  bio?: string;
  fee?: number;
  latitude?: number;
  longitude?: number;
  // Ambulance fields
  vehicleNumber?: string;
  vehicleType?: string;
  driverPhone?: string;
}

// POST /api/auth/login
export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  // Backend returns flat fields (not nested user object)
  userId: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  approvalStatus: string;   // PENDING | APPROVED | REJECTED
}

// GET /api/auth/profile
export interface UserInfo {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'PATIENT' | 'DOCTOR' | 'ADMIN' | 'AMBULANCE';
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';  // present after login
  specialization?: string;
  hospital?: string;
  profileImageUrl?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  ambulanceId?: number;
}

// PUT /api/auth/password
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// PUT /api/auth/admin/doctors/{userId}/approval
export interface ApprovalRequest {
  // Backend `ApprovalRequest` DTO field is `status`, values PENDING/APPROVED/REJECTED
  // (NOT `action` with APPROVE/REJECT — that mismatch silently 400'd every approval/rejection).
  status: 'APPROVED' | 'REJECTED' | 'PENDING';
  reason?: string;
}

// ── ADMIN ─────────────────────────────────────────────────────
// GET /api/auth/admin/doctors
export interface AdminDoctorEntry {
  id: number;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  hospital?: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt?: string;
}

// GET /api/auth/admin/ambulances
export interface AdminAmbulanceEntry {
  id: number;
  name: string;
  email: string;
  phone?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  ambulanceId?: number;
  approvalStatus?: string;
  createdAt?: string;
}

// ── DOCTOR ────────────────────────────────────────────────────
// GET /api/doctors/search, GET /api/doctors/{id}
export interface Doctor {
  id: number;
  userId: number;
  name: string;
  email: string;
  phone?: string;
  specialization: string;
  experienceYears?: number;
  bio?: string;
  hospital?: string;
  consultationFee?: number;
  rating?: number;
  totalReviews?: number;
  available?: boolean;
  // True sirf jab doctor ki Razorpay KYC ACTIVATED ho — false hone par patient ko
  // 'KYC Pending' badge dikhao aur booking allow mat karo, chahe `available` bhi true ho.
  kycActivated?: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  education?: string;
  languages?: string;
  profileImageUrl?: string;
  latitude?: number;
  longitude?: number;
  clinics?: Clinic[];
}

// POST /api/doctors/profile, PUT /api/doctors/profile
export interface DoctorProfileRequest {
  name: string;
  email: string;
  phone?: string;
  specialization: string;
  experienceYears?: number;
  bio?: string;
  hospital?: string;
  consultationFee?: number;
  latitude?: number;
  longitude?: number;
  education?: string;
  languages?: string;
}

// GET /api/doctors/specializations
// returns string[]

// ── CLINIC ────────────────────────────────────────────────────
// POST /api/doctors/clinics, GET /api/doctors/clinics, GET /api/doctors/{id}/clinics
export interface ClinicRequest {
  name: string;
  address: string;
  city?: string;
  pincode?: string;
  phone?: string;
  timings?: string;
  workingDays?: string;
  latitude?: number;
  longitude?: number;
}

export interface Clinic extends ClinicRequest {
  id?: number;
}

// Backend DTO is named ClinicResponse — alias so ClinicController-facing code can use the
// same name as the API docs/response shape while existing components keep using `Clinic`.
export type ClinicResponse = Clinic;

// ── SLOTS ─────────────────────────────────────────────────────
// GET /api/slots/{doctorId}/available?date=YYYY-MM-DD
// GET /api/slots/{doctorId}/free?date=YYYY-MM-DD
// GET /api/slots/{doctorId}/summary?date=YYYY-MM-DD
export interface SlotResponse {
  id?: number;
  time: string;
  available: boolean;
  isBooked?: boolean;
}

export type TimeSlot = SlotResponse;
export type Slot = SlotResponse;

export interface DaySlots {
  date: string;
  label?: string;
  day?: string;
  available: boolean;
  slots: SlotResponse[];
}

export interface SlotSummaryResponse {
  hour: string;
  total: number;
  booked: number;
  available: number;
}

export type SlotSummary = SlotSummaryResponse;

// ── LOCATION ──────────────────────────────────────────────────
// PATCH /api/doctors/location, PATCH /api/ambulance/my/location
export interface LocationUpdateRequest {
  latitude: number;
  longitude: number;
}

export type LocationUpdate = LocationUpdateRequest;

// ── BOOKINGS / APPOINTMENTS ───────────────────────────────────
// POST /api/bookings/appointments
export interface AppointmentRequest {
  doctorId: number;
  slotId?: number;             // ID of the DoctorSlot entity (preferred over slotTime)
  slotTime?: string;           // ISO datetime e.g. "2026-06-01T10:00:00"
  notes?: string;
  patientName?: string;
  patientPhone?: string;
  patientAge?: number;
  patientDisease?: string;
}

export type AppointmentStatus =
  | 'PENDING_PAYMENT' | 'CONFIRMED' | 'PENDING'
  | 'CANCELLED' | 'COMPLETED' | 'NO_SHOW';

// GET /api/bookings/appointments/my, /doctor, /doctor/today
export interface AppointmentResponse {
  id: number;
  patientId: number;
  patientName: string;
  patientPhone?: string;
  patientAge?: number;
  patientDisease?: string;
  doctorId: number;
  doctorName: string;
  specialization?: string;
  clinicAddress?: string;
  appointmentTime: string;
  durationMinutes?: number;
  status: AppointmentStatus;
  fee?: number;
  platformFee?: number;
  doctorFee?: number;
  paymentStatus?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  paymentOrderId?: string;     // alias for razorpayOrderId
  notes?: string;
  cancellationReason?: string;
  doctorNotes?: string;
  diagnosis?: string;
  prescription?: string;
  followUpInstructions?: string;
  followUpDate?: string;
  createdAt?: string;
  tokenNumber?: number;       // assigned after payment confirmed
  queuePosition?: number;     // patients ahead in queue
}

// alias kept for component compat
export type Appointment = AppointmentResponse;

// GET /api/bookings/appointments/doctor/stats
export interface DoctorStatsResponse {
  totalPatients: number;
  totalAppointments: number;
  todayAppointments: number;
  confirmedAppointments: number;
  completedAppointments: number;
  monthlyEarnings: number;
}

export type DoctorStats = DoctorStatsResponse;

// POST /api/bookings/appointments/{id}/razorpay/order
// Matches dto/response/RazorpayOrderResponse.java exactly.
export interface RazorpayOrderResponse {
  appointmentId?: number;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amountInPaise: number;
  currency: string;
  name?: string;
  description?: string;
  prefillName?: string;
  prefillContact?: string;
  prefillEmail?: string;
}

// POST /api/bookings/appointments/{id}/razorpay/verify
export interface RazorpayVerifyRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

// ── AMBULANCE ─────────────────────────────────────────────────
export type AmbulanceStatusType =
  | 'AVAILABLE' | 'DISPATCHED' | 'EN_ROUTE'
  | 'AT_SCENE' | 'TRANSPORTING' | 'OFFLINE';

// GET /api/ambulance, /api/ambulance/available, /api/ambulance/{id}, /api/ambulance/my
export interface AmbulanceResponse {
  id: number;
  vehicleNumber: string;
  driverName: string;
  driverPhone: string;
  type: 'BASIC' | 'ADVANCED_LIFE_SUPPORT' | 'NEONATAL' | 'AIR' | 'ALS' | 'BLS' | 'ICU';
  status: AmbulanceStatusType;
  currentLatitude?: number;
  currentLongitude?: number;
  latitude?: number;
  longitude?: number;
  active?: boolean;
  updatedAt?: string;
  distanceKm?: number; // client-computed
}

export type Ambulance = AmbulanceResponse;

// POST /api/ambulance/register
export interface AmbulanceRegisterRequest {
  vehicleNumber: string;
  vehicleType?: string;
  driverName?: string;
  driverPhone?: string;
}

// GET /api/ambulance/location/{ambulanceId}
export interface AmbulanceLocationResponse {
  ambulanceId: number;
  vehicleNumber?: string;
  latitude: number;
  longitude: number;
  status?: string;
  timestamp?: number;
}

export type AmbulanceLocation = AmbulanceLocationResponse;

// POST /api/bookings/ambulance
export interface AmbulanceBookingRequest {
  patientName: string;
  patientPhone: string;
  pickupLatitude: number;
  pickupLongitude: number;
  pickupAddress?: string;
  dropLatitude?: number;
  dropLongitude?: number;
  dropAddress?: string;
  emergencyType?: string;
  additionalNotes?: string;
  ambulanceId?: number;
}

export type AmbulanceRequest = AmbulanceBookingRequest;

// Response from POST /api/bookings/ambulance
export interface AmbulanceBookingResponse {
  id: number;
  patientName: string;
  patientPhone: string;
  pickupAddress?: string;
  dropAddress?: string;
  emergencyType?: string;
  status: string;
  ambulanceId?: number;
  ambulanceVehicleNumber?: string;
  driverName?: string;
  driverPhone?: string;
  estimatedArrivalMinutes?: number;
  fare?: number;
  createdAt?: string;
}

export type AmbulanceBooking = AmbulanceBookingResponse;

// ── PUBLIC / GUEST BOOKING ────────────────────────────────────
// POST /api/public/bookings/appointment
export interface GuestAppointmentRequest {
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientEmail?: string;
  doctorId: number;
  slotId?: number;
  slotTime: string;
  notes?: string;
}

// NEW pay-first flow — matches dto/request/GuestOrderRequest.java.
// No appointment exists yet when this is sent (POST /api/public/bookings/order).
export interface GuestOrderRequest {
  patientName: string;
  patientPhone: string;
  patientAge?: number;
  patientEmail?: string;
  doctorId: number;
  slotId: number;
  notes?: string;
}

// NEW pay-first flow — matches dto/request/GuestVerifyRequest.java.
// Sent after Razorpay checkout succeeds (POST /api/public/bookings/verify) — this is
// what actually creates the Appointment, atomically with token number assignment.
export interface GuestBookingVerifyRequest {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  slotId: number;
  notes?: string;
}

// GET /api/public/bookings/appointment/{id}/track?phone=
// Matches dto/response/GuestBookingResponse.java — nested, NOT flat.
export interface GuestBookingResponse {
  appointment: AppointmentResponse;
  patientsAheadInQueue?: number;
  trackingUrl?: string;
  message?: string;
}

// ── PATIENT RECORDS ───────────────────────────────────────────
// POST /api/patient-records
export interface PatientRecordRequest {
  patientId: number;
  patientName: string;
  patientPhone?: string;
  patientAge?: number;
  patientGender?: string;
  visitDate?: string;
  chiefComplaint?: string;
  clinicalNotes?: string;
  diagnosis?: string;
  prescription?: string;
  labTests?: string;
  followUpInstructions?: string;
  followUpDate?: string;
  // Vital signs
  appointmentId?: number;
  bloodPressure?: string;
  pulse?: string;
  temperature?: string;
  oxygenSaturation?: string;
  weight?: string;
  height?: string;
}

// GET /api/patient-records/patient/{patientId}
export interface PatientRecordResponse {
  id: number;
  doctorId: number;
  patientId: number;
  patientName: string;
  patientPhone?: string;
  patientAge?: number;
  patientGender?: string;
  visitDate: string;
  chiefComplaint?: string;
  clinicalNotes?: string;
  diagnosis?: string;
  prescription?: string;
  labTests?: string;
  followUpInstructions?: string;
  followUpDate?: string;
  createdAt?: string;
  // Vital signs
  appointmentId?: number;
  bloodPressure?: string;
  pulse?: string;
  temperature?: string;
  oxygenSaturation?: string;
  weight?: string;
  height?: string;
}

export type PatientRecord = PatientRecordResponse;
export type CreateRecordRequest = PatientRecordRequest;

export interface UpdateRecordRequest {
  chiefComplaint?: string;
  clinicalNotes?: string;
  diagnosis?: string;
  prescription?: string;
  labTests?: string;
  followUpInstructions?: string;
  followUpDate?: string;
}

export interface PatientSummary {
  patientId: number;
  patientName: string;
  patientPhone?: string;
  totalVisits: number;
  lastVisit: string;
  lastDiagnosis?: string;
}

// ── LAB TESTS ────────────────────────────────────────────────
// POST /api/lab-tests
export interface LabTestRequest {
  patientId: number;
  clinicId?: number;
  testName: string;
  testType?: string;
  notes?: string;
}

// PUT /api/lab-tests/{testId}/result
export interface LabTestResultRequest {
  resultText: string;
  resultFileUrl?: string;
}

// GET /api/lab-tests/patient/{patientId}
export interface LabTestResponse {
  id: number;
  patientId: number;
  clinicId?: number;
  testName: string;
  testType?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  resultText?: string;
  resultFileUrl?: string;
  notes?: string;
  orderedAt?: string;
  completedAt?: string;
}

// ── PRESCRIPTIONS ─────────────────────────────────────────────
// POST /api/prescriptions
export interface PrescriptionRequest {
  patientId: number;
  appointmentId?: number;
  medicines: string;
  instructions?: string;
  followUpDate?: string;
}

// GET /api/prescriptions/patient/{patientId}
export interface PrescriptionResponse {
  id: number;
  doctorId: number;
  patientId: number;
  appointmentId?: number;
  medicines: string;
  instructions?: string;
  followUpDate?: string;
  followUpDone?: boolean;
  createdAt?: string;
}

// ── BEDS ──────────────────────────────────────────────────────
// POST /api/beds
export interface BedRequest {
  clinicId: number;
  bedNumber: string;
  wardType?: string;
}

// PUT /api/beds/{bedId}/admit
export interface BedAssignRequest {
  patientName: string;
  patientId?: number;   // only set if this is a registered app user, e.g. from a booking
}

// GET /api/beds/clinic/{clinicId}
export interface BedResponse {
  id: number;
  clinicId: number;
  bedNumber: string;
  wardType?: string;
  occupied: boolean;
  patientId?: number;
  patientName?: string;
  admittedAt?: string;
}

// ── INVENTORY ─────────────────────────────────────────────────
// POST /api/inventory
export interface InventoryItemRequest {
  clinicId: number;
  itemName: string;
  quantity: number;
  unit?: string;
  lowStockThreshold?: number;
  category?: string;
}

// GET /api/inventory/clinic/{clinicId}
export interface InventoryItemResponse {
  id: number;
  clinicId: number;
  itemName: string;
  quantity: number;
  unit?: string;
  lowStockThreshold?: number;
  category?: string;
  updatedAt?: string;
}

// ── INVOICES ──────────────────────────────────────────────────
// POST /api/invoices
export interface InvoiceRequest {
  patientId: number;
  clinicId?: number;
  appointmentId?: number;
  items: InvoiceItemLine[];
  notes?: string;
}

export interface InvoiceItemLine {
  description: string;
  amount: number;
}

// POST /api/invoices/{invoiceId}/pay
export interface InvoicePaymentRequest {
  paymentMode: 'CASH' | 'UPI' | 'CARD' | 'ONLINE';
  transactionId?: string;
}

// GET /api/invoices/patient/{patientId}
export interface InvoiceResponse {
  id: number;
  patientId: number;
  clinicId?: number;
  appointmentId?: number;
  totalAmount: number;
  paidAmount?: number;
  status: 'PENDING' | 'PAID' | 'PARTIAL';
  items?: InvoiceItemLine[];
  notes?: string;
  createdAt?: string;
}

// ── STAFF ─────────────────────────────────────────────────────
// POST /api/staff
export interface StaffRequest {
  clinicId: number;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  shift?: string;
}

// GET /api/staff/clinic/{clinicId}
export interface StaffResponse {
  id: number;
  clinicId: number;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  shift?: string;
  active?: boolean;
}

// ── DASHBOARD ─────────────────────────────────────────────────
// GET /api/dashboard/clinic/{clinicId}
export interface ClinicDashboardResponse {
  todayAppointments: number;
  liveQueueSize: number;
  newPatientsToday: number;
  todayRevenue: number;
}

// ── NOTIFICATIONS ─────────────────────────────────────────────
// POST /api/notifications/send
export interface NotificationRequest {
  to: string;
  subject?: string;
  message: string;
  type?: 'SMS' | 'EMAIL';
}

export type NotificationStatus = 'READ' | 'UNREAD' | 'DISMISSED';

// ── PAYMENT / CONFIRM ─────────────────────────────────────────
// legacy type kept for component compat
export interface PaymentConfirmRequest {
  paymentId: string;
  paymentOrderId: string;
}

// ── UNAVAILABLE DATE ──────────────────────────────────────────
// POST /api/doctors/unavailable?date=YYYY-MM-DD
export interface UnavailableDate {
  id?: number;
  date: string;
  reason?: string;
}

// ── BANK DETAILS / RAZORPAY ROUTE KYC ─────────────────────────
// Matches BankDetailsRequest.java — POST /api/doctors/bank-details
export interface BankDetailsRequest {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
  upiId?: string;
  addressStreet: string;
  city: string;
  state: string;
  postalCode: string;
  panNumber?: string;   // e.g. ABCDE1234F — optional, only needed if Razorpay asks for extra identity verification
}

export type KycStatus = 'NOT_STARTED' | 'PENDING' | 'NEEDS_CLARIFICATION' | 'ACTIVATED' | 'REJECTED';

// Matches BankDetailsResponse.java — GET /api/doctors/bank-details/me
export interface BankDetailsResponse {
  id?: number;
  accountHolderName?: string;
  maskedAccountNumber?: string;
  ifscCode?: string;
  bankName?: string;
  upiId?: string;
  kycStatus: KycStatus;
  kycMessage?: string;
  kycUpdatedAt?: string;
}

// legacy alias kept for any older component references
export type BankDetails = BankDetailsResponse;

// ── BED MANAGEMENT ─────────────────────────────────────────────
export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'MAINTENANCE';

// Matches BedRequest.java — POST /api/beds
export interface BedRequest {
  clinicId: number;
  bedNumber: string;
  ward?: string;
  chargePerDay?: number;
}

// Matches BedAssignRequest.java — PUT /api/beds/{bedId}/admit
export interface BedAssignRequest {
  patientName: string;
  patientId?: number;
  expectedDischargeDate?: string; // YYYY-MM-DD
}

// Matches ExpectedDischargeRequest.java — PUT /api/beds/{bedId}/expected-discharge
export interface ExpectedDischargeRequest {
  expectedDischargeDate: string; // YYYY-MM-DD
}

// Matches BedResponse.java
export interface BedResponse {
  id: number;
  clinicId: number;
  bedNumber: string;
  ward?: string;
  status: BedStatus;
  patientId?: number;
  patientName?: string;
  admittedAt?: string;
  dischargedAt?: string;
  expectedDischargeDate?: string;
  chargePerDay?: number;
}

// Matches BedStatsResponse.java — GET /api/beds/clinic/{clinicId}/stats
export interface BedStatsResponse {
  clinicId: number;
  totalBeds: number;
  occupiedCount: number;
  availableCount: number;
  reservedCount: number;
  maintenanceCount: number;
  leavingSoonCount: number;
  fillPercentage: number;
}