// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = "patient" | "doctor" | "nurse" | "admin" | "pharmacist";

export interface UserProfile {
  uid:       string;
  email:     string;
  name:      string;
  role:      UserRole;
  createdAt: string;
}

// ─── Patient Biodata ────────────────────────────────────────────────────────

export interface PatientAddress {
  street:     string;
  kelurahan:  string;
  kecamatan:  string;
  kota:       string;
  kodePos:    string;
}

export interface EmergencyContact {
  name:  string;
  phone: string;
}

export interface Patient {
  emrId:            string;            // Auto-generated, e.g. "EMR-20240421-00001"
  uid:              string;            // Firebase Auth UID
  firstName:        string;
  lastName:         string;
  gender:           "Laki-laki" | "Perempuan";
  ktpNumber:        string;
  address:          PatientAddress;
  phone:            string;
  email:            string;
  emergencyContact: EmergencyContact;
  department?:      Department;        // Assigned by admin
  status:           PatientStatus;
  blockchainTxHash?: string;           // TX hash of registerPatient call
  createdAt:        string;
  updatedAt:        string;
}

export type PatientStatus =
  | "registered"      // Just signed up
  | "waiting"         // Waiting to be assigned to department
  | "assigned"        // Assigned to poli by admin
  | "in_examination"  // Nurse/doctor currently attending
  | "completed"       // Visit complete
  | "discharged";     // Discharged

export type Department =
  | "Penyakit Dalam"
  | "Bedah Umum"
  | "Bedah Vaskuler"
  | "Urologi"
  | "Ortopedi dan Traumatologi"
  | "Obstetri dan Ginekologi"
  | "Umum"
  | "Neurologi"
  | "Kardiologi"
  | "Paru";

export const DEPARTMENTS: Department[] = [
  "Penyakit Dalam",
  "Bedah Umum",
  "Bedah Vaskuler",
  "Urologi",
  "Ortopedi dan Traumatologi",
  "Obstetri dan Ginekologi",
  "Umum",
  "Neurologi",
  "Kardiologi",
  "Paru",
];

// ─── SOAP (Nurse) ───────────────────────────────────────────────────────────

export interface VitalSigns {
  bloodPressure:    string;  // e.g. "120/80"
  heartRate:        number;  // bpm
  temperature:      number;  // Celsius
  respiratoryRate:  number;  // breaths/min
  oxygenSaturation: number;  // SpO2 %
  weight?:          number;  // kg
  height?:          number;  // cm
}

export interface SOAPNote {
  id:           string;
  emrId:        string;
  nurseUid:     string;
  nurseName:    string;
  subjective:   string;
  objective:    VitalSigns;
  assessment:   string;
  plan:         string;
  blockchainTxHash?: string;
  createdAt:    string;
}

// ─── Doctor Examination ─────────────────────────────────────────────────────

export interface SupportingExam {
  type:    "Lab" | "Radiology" | "ECG" | "USG" | "Other";
  name:    string;
  result:  string;
  date:    string;
}

export interface DoctorNote {
  id:                    string;
  emrId:                 string;
  doctorUid:             string;
  doctorName:            string;
  chiefComplaint:        string;
  historyPresentIllness: string;
  pastMedicalHistory:    string;
  surgicalHistory:       string;
  medicationHistory:     string;
  allergy:               string;
  vitalSigns:            VitalSigns;    // Auto-filled from last SOAP
  physicalExamination:   string;
  supportingExams:       SupportingExam[];
  workingDiagnosis:      string;
  differentialDiagnosis: string;
  managementPlan:        string;
  prescription?:         Prescription;
  blockchainTxHash?:     string;
  createdAt:             string;
  updatedAt:             string;
}

// ─── Prescription ───────────────────────────────────────────────────────────

export interface MedicationItem {
  name:         string;
  dose:         string;
  frequency:    string;
  duration:     string;
  notes?:       string;
}

export interface Prescription {
  id:               string;
  emrId:            string;
  doctorUid:        string;
  doctorName:       string;
  pharmacistUid?:   string;
  pharmacistName?:  string;
  medications:      MedicationItem[];
  status:           "pending" | "processing" | "dispensed" | "cancelled";
  notes?:           string;
  blockchainTxHash?: string;
  createdAt:        string;
  dispensedAt?:     string;
}

// ─── Blockchain ─────────────────────────────────────────────────────────────

export interface BlockchainAction {
  id:          number;
  emrId:       string;
  dataHash:    string;
  actionType:  number;   // maps to ActionType enum in contract
  submitter:   string;
  timestamp:   number;
  isActive:    boolean;
}

export const ACTION_TYPE_LABELS: Record<number, string> = {
  0: "Patient Registered",
  1: "SOAP Submitted",
  2: "Doctor Note Submitted",
  3: "Prescription Created",
  4: "Record Updated",
  5: "Department Assigned",
};

// ─── Notifications ──────────────────────────────────────────────────────────

export interface AppNotification {
  id:           string;
  icon:         string;
  title:        string;
  body:         string;
  createdAt:    string;   // ISO string
  unread:       boolean;
  targetRoles?: string[]; // which roles see this; undefined = all roles
  emrId?:       string;
  txHash?:      string;
}

// ─── Dashboard Stats ────────────────────────────────────────────────────────

export interface DashboardStats {
  totalPatients:      number;
  todayVisits:        number;
  pendingSOAP:        number;
  pendingPrescriptions: number;
  totalBlockchainTx:  number;
}
