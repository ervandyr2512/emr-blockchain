/**
 * emr.ts
 * ------
 * Firebase Realtime Database helpers for all EMR operations.
 * All data is stored under structured paths (see Firebase Schema below).
 *
 * Firebase Schema:
 * ├── users/{uid}           — UserProfile
 * ├── patients/{emrId}      — Patient biodata
 * ├── soap_notes/{emrId}/{noteId}       — SOAP notes by nurse
 * ├── doctor_notes/{emrId}/{noteId}     — Doctor examination notes
 * ├── prescriptions/{emrId}/{rxId}      — Prescriptions
 * └── counters/patients                 — Auto-increment counter for EMR ID
 */

import {
  ref, set, get, update, push, query,
  orderByChild, equalTo, onValue, off,
} from "firebase/database";
import { db } from "./firebase";
import type {
  Patient, SOAPNote, DoctorNote, Prescription,
  UserProfile, UserRole,
} from "@/types";

// ── ID Generation ────────────────────────────────────────────────────────────

/** Generate the next EMR ID using a server-side counter in Firebase. */
export async function generateEMRId(): Promise<string> {
  const counterRef = ref(db, "counters/patients");
  const snap       = await get(counterRef);
  const current    = (snap.val() as number) || 0;
  const next       = current + 1;
  await set(counterRef, next);
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `EMR-${today}-${String(next).padStart(5, "0")}`;
}

// ── User / Role Management ───────────────────────────────────────────────────

export async function createUserProfile(profile: UserProfile): Promise<void> {
  await set(ref(db, `users/${profile.uid}`), profile);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await get(ref(db, `users/${uid}`));
  return snap.exists() ? (snap.val() as UserProfile) : null;
}

export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  await update(ref(db, `users/${uid}`), { role });
}

// ── Patients ─────────────────────────────────────────────────────────────────

export async function savePatient(patient: Patient): Promise<void> {
  await set(ref(db, `patients/${patient.emrId}`), patient);
}

export async function getPatient(emrId: string): Promise<Patient | null> {
  const snap = await get(ref(db, `patients/${emrId}`));
  return snap.exists() ? (snap.val() as Patient) : null;
}

export async function getPatientByUid(uid: string): Promise<Patient | null> {
  const q    = query(ref(db, "patients"), orderByChild("uid"), equalTo(uid));
  const snap = await get(q);
  if (!snap.exists()) return null;
  const entries = Object.values(snap.val() as Record<string, Patient>);
  return entries[0] ?? null;
}

export async function getAllPatients(): Promise<Patient[]> {
  const snap = await get(ref(db, "patients"));
  if (!snap.exists()) return [];
  return Object.values(snap.val() as Record<string, Patient>);
}

export async function updatePatientStatus(
  emrId: string,
  status: Patient["status"],
  extra?: Partial<Patient>
): Promise<void> {
  await update(ref(db, `patients/${emrId}`), {
    status,
    updatedAt: new Date().toISOString(),
    ...extra,
  });
}

export async function assignPatientDepartment(
  emrId: string,
  department: Patient["department"],
  txHash?: string
): Promise<void> {
  await update(ref(db, `patients/${emrId}`), {
    department,
    status: "assigned",
    updatedAt:          new Date().toISOString(),
    ...(txHash ? { blockchainTxHash: txHash } : {}),
  });
}

// ── SOAP Notes ───────────────────────────────────────────────────────────────

export async function saveSOAPNote(note: SOAPNote): Promise<string> {
  const r   = ref(db, `soap_notes/${note.emrId}`);
  const ref2 = await push(r, note);
  const id  = ref2.key!;
  // Also update the patient record with last SOAP timestamp
  await update(ref(db, `patients/${note.emrId}`), {
    status:    "in_examination",
    updatedAt: new Date().toISOString(),
  });
  return id;
}

export async function getLatestSOAP(emrId: string): Promise<SOAPNote | null> {
  const snap = await get(ref(db, `soap_notes/${emrId}`));
  if (!snap.exists()) return null;
  const notes = Object.values(snap.val() as Record<string, SOAPNote>);
  return notes.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0] ?? null;
}

export async function getAllSOAPNotes(emrId: string): Promise<SOAPNote[]> {
  const snap = await get(ref(db, `soap_notes/${emrId}`));
  if (!snap.exists()) return [];
  return Object.values(snap.val() as Record<string, SOAPNote>).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ── Doctor Notes ─────────────────────────────────────────────────────────────

export async function saveDoctorNote(note: DoctorNote): Promise<string> {
  const r    = ref(db, `doctor_notes/${note.emrId}`);
  const ref2 = await push(r, note);
  const id   = ref2.key!;
  await update(ref(db, `patients/${note.emrId}`), {
    status:    "in_examination",
    updatedAt: new Date().toISOString(),
  });
  return id;
}

export async function getLatestDoctorNote(emrId: string): Promise<DoctorNote | null> {
  const snap = await get(ref(db, `doctor_notes/${emrId}`));
  if (!snap.exists()) return null;
  const notes = Object.values(snap.val() as Record<string, DoctorNote>);
  return notes.sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0] ?? null;
}

export async function getAllDoctorNotes(emrId: string): Promise<DoctorNote[]> {
  const snap = await get(ref(db, `doctor_notes/${emrId}`));
  if (!snap.exists()) return [];
  return Object.values(snap.val() as Record<string, DoctorNote>).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

// ── Prescriptions ────────────────────────────────────────────────────────────

export async function savePrescription(rx: Prescription): Promise<string> {
  const r    = ref(db, `prescriptions/${rx.emrId}`);
  const ref2 = await push(r, rx);
  return ref2.key!;
}

export async function getPendingPrescriptions(): Promise<Prescription[]> {
  const snap = await get(ref(db, "prescriptions"));
  if (!snap.exists()) return [];
  const all: Prescription[] = [];
  const data = snap.val() as Record<string, Record<string, Prescription>>;
  Object.values(data).forEach((byPatient) => {
    Object.values(byPatient).forEach((rx) => {
      if (rx.status === "pending" || rx.status === "processing") {
        all.push(rx);
      }
    });
  });
  return all;
}

export async function updatePrescriptionStatus(
  emrId: string,
  rxId: string,
  status: Prescription["status"],
  pharmacistUid?: string,
  pharmacistName?: string,
  txHash?: string
): Promise<void> {
  await update(ref(db, `prescriptions/${emrId}/${rxId}`), {
    status,
    ...(pharmacistUid ? { pharmacistUid, pharmacistName } : {}),
    ...(txHash ? { blockchainTxHash: txHash } : {}),
    dispensedAt: status === "dispensed" ? new Date().toISOString() : null,
  });
}

// ── Real-time listeners ───────────────────────────────────────────────────────

/** Subscribe to all patients (for admin/nurse dashboards). */
export function subscribePatients(
  callback: (patients: Patient[]) => void
): () => void {
  const r = ref(db, "patients");
  const handler = (snap: ReturnType<typeof get> extends Promise<infer T> ? T : never) => {
    if (!(snap as { exists(): boolean }).exists()) { callback([]); return; }
    const val = (snap as { val(): unknown }).val() as Record<string, Patient>;
    callback(Object.values(val));
  };
  onValue(r, handler as Parameters<typeof onValue>[1]);
  return () => off(r, "value", handler as Parameters<typeof onValue>[1]);
}
