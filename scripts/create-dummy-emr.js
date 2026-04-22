/**
 * create-dummy-emr.js
 * -------------------
 * Creates 1 complete dummy patient record in Firebase RTDB so all 5 roles
 * have something to work with immediately:
 *
 *   Admin      → patient appears in Daftar Pasien (status: assigned)
 *   Perawat    → patient appears in Pasien Aktif  (fill SOAP)
 *   Dokter     → patient appears in Pasien Saya   (examine)
 *   Apoteker   → prescription appears in queue    (pending)
 *   Pasien     → sees own EMR history
 *
 * Run: node scripts/create-dummy-emr.js
 */

const fs   = require("fs");
const path = require("path");

// ── Load env ─────────────────────────────────────────────────────────────────
function loadEnv(file) {
  try {
    const content = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx < 0) continue;
      const key = trimmed.slice(0, idx).trim();
      let   val = trimmed.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
        val = val.slice(1, -1);
      if (val && !process.env[key]) process.env[key] = val;
    }
  } catch { /* skip */ }
}
loadEnv(".env.local");
loadEnv(".env.production.local");

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const DB_URL  = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;

if (!API_KEY || !DB_URL) {
  console.error("❌  Missing env vars. Run from project root.");
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function signIn(email, password) {
  const res  = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`Sign-in failed (${email}): ${data.error.message}`);
  return data; // { localId, idToken, email }
}

async function dbPut(path, body, token) {
  const url = `${DB_URL}${path}.json?auth=${token}`;
  const res  = await fetch(url, {
    method:  "PUT",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (data && data.error) throw new Error(`DB write error at ${path}: ${data.error}`);
  return data;
}

async function dbGet(path, token) {
  const res  = await fetch(`${DB_URL}${path}.json?auth=${token}`);
  return res.json();
}

async function dbPatch(path, body, token) {
  const url = `${DB_URL}${path}.json?auth=${token}`;
  const res  = await fetch(url, {
    method:  "PATCH",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (data && data.error) throw new Error(`DB patch error at ${path}: ${data.error}`);
  return data;
}

function now() { return new Date().toISOString(); }
function uid()  { return Math.random().toString(36).slice(2, 18); }

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log("\n🏥  Creating dummy EMR data...\n");

  // 1. Sign in as admin (to get tokens + check existence)
  const admin  = await signIn("admin@emr.id",    "admin123");
  const doctor = await signIn("dokter@emr.id",   "dokter123");
  const nurse  = await signIn("perawat@emr.id",  "perawat123");
  const pharma = await signIn("apoteker@emr.id", "apoteker123");
  const pasien = await signIn("pasien@emr.id",   "pasien123");
  console.log("✅  All users authenticated");

  // 2. Check / create EMR ID counter
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const counter  = (await dbGet("/counters/patients", admin.idToken)) || 0;
  const nextNum  = counter + 1;
  await dbPut("/counters/patients", nextNum, admin.idToken);
  const emrId = `EMR-${todayStr}-${String(nextNum).padStart(5, "0")}`;
  console.log(`   EMR ID: ${emrId}`);

  // 3. Patient record (linked to pasien@emr.id account)
  const patient = {
    emrId,
    uid:       pasien.localId,
    firstName: "Budi",
    lastName:  "Santoso",
    gender:    "Laki-laki",
    ktpNumber: "3275012345670001",
    address: {
      street:    "Jl. Melati No. 12",
      kelurahan: "Menteng",
      kecamatan: "Menteng",
      kota:      "Jakarta Pusat",
      kodePos:   "10310",
    },
    phone:    "081234567890",
    email:    "pasien@emr.id",
    emergencyContact: {
      name:  "Siti Santoso",
      phone: "081234567891",
    },
    department:  "Penyakit Dalam",
    status:      "assigned",          // Admin already assigned → shows in doctor/nurse queue
    blockchainTxHash: "0x" + "a".repeat(64),  // Placeholder hash
    createdAt:   now(),
    updatedAt:   now(),
  };
  await dbPut(`/patients/${emrId}`, patient, admin.idToken);
  console.log(`✅  Patient record created: ${patient.firstName} ${patient.lastName}`);

  // 4. SOAP note (from nurse)
  const soapId   = uid();
  const soapNote = {
    id:       soapId,
    emrId,
    nurseUid:  nurse.localId,
    nurseName: "Perawat Sari",
    subjective:  "Pasien mengeluhkan demam tinggi sejak 3 hari yang lalu, disertai nyeri kepala, mual, dan tidak nafsu makan. Pasien juga mengalami nyeri otot dan persendian.",
    objective: {
      bloodPressure:    "130/85",
      heartRate:        98,
      temperature:      38.7,
      respiratoryRate:  20,
      oxygenSaturation: 97,
      weight:           68,
      height:           170,
    },
    assessment: "Pasien tampak lemah dan pucat. Lidah tampak kotor. Terdapat nyeri tekan pada abdomen kuadran kanan atas.",
    plan:       "Observasi vital signs setiap 4 jam. Pemberian cairan IV NaCl 0.9%. Kompres hangat untuk demam. Menunggu pemeriksaan dokter.",
    blockchainTxHash: "0x" + "b".repeat(64),
    createdAt:  now(),
  };
  await dbPut(`/soap_notes/${emrId}/${soapId}`, soapNote, nurse.idToken);
  console.log(`✅  SOAP note created`);

  // 5. Doctor note
  const noteId     = uid();
  const doctorNote = {
    id:      noteId,
    emrId,
    doctorUid:  doctor.localId,
    doctorName: "Dr. Ahmad Fauzi",
    chiefComplaint:        "Demam tinggi 3 hari, nyeri kepala, mual, tidak nafsu makan",
    historyPresentIllness: "Pasien datang dengan keluhan demam sejak 3 hari yang lalu. Demam bersifat naik-turun dan memburuk pada sore/malam hari. Disertai nyeri kepala frontal, mual tanpa muntah, dan penurunan nafsu makan. Pasien mengaku tinggal di daerah yang sering terdapat genangan air.",
    pastMedicalHistory:    "Hipertensi sejak 2 tahun yang lalu, terkontrol dengan obat",
    surgicalHistory:       "Tidak ada riwayat operasi",
    medicationHistory:     "Amlodipine 5 mg, 1x1 hari",
    allergy:               "Tidak ada alergi yang diketahui",
    vitalSigns: {
      bloodPressure:    "130/85",
      heartRate:        98,
      temperature:      38.7,
      respiratoryRate:  20,
      oxygenSaturation: 97,
      weight:           68,
      height:           170,
    },
    physicalExamination: "KU: tampak sakit sedang, kesadaran compos mentis. Kepala: konjungtiva tidak anemis, sklera tidak ikterik. Thoraks: BJ I/II regular, tidak ada murmur. Paru: vesikuler, tidak ada ronki. Abdomen: supel, hepar teraba 2 cm di bawah arcus costae, nyeri tekan (+) hipokondria kanan.",
    supportingExams: [
      { type: "Lab",    name: "Darah Lengkap",          result: "Leukosit 4.200/μL (turun), Trombosit 98.000/μL (turun), Hematokrit 45%", date: now() },
      { type: "Lab",    name: "NS1 Antigen Dengue",     result: "Positif",                                                                  date: now() },
      { type: "Lab",    name: "Widal Test",              result: "O Typhi 1/160",                                                            date: now() },
    ],
    workingDiagnosis:      "Demam Dengue / DHF Grade I",
    differentialDiagnosis: "Demam Tifoid, Malaria",
    managementPlan:        "1. Rawat inap untuk observasi. 2. IVFD NaCl 0.9% 20 tetes/menit. 3. Paracetamol 500mg tiap 6 jam bila demam >38.5°C. 4. Monitor trombosit dan hematokrit setiap 12 jam. 5. Edukasi tanda bahaya DHF kepada keluarga.",
    blockchainTxHash: "0x" + "c".repeat(64),
    createdAt:  now(),
    updatedAt:  now(),
  };
  await dbPut(`/doctor_notes/${emrId}/${noteId}`, doctorNote, doctor.idToken);
  console.log(`✅  Doctor note created`);

  // 6. Prescription
  const rxId       = uid();
  const prescription = {
    id:         rxId,
    emrId,
    doctorUid:  doctor.localId,
    doctorName: "Dr. Ahmad Fauzi",
    medications: [
      { name: "Paracetamol 500 mg",      dose: "500 mg",  frequency: "3x sehari",  duration: "5 hari",  notes: "Minum setelah makan, hanya bila demam ≥38.5°C" },
      { name: "Ringer Laktat (infus)",    dose: "500 mL",  frequency: "20 tetes/mnt", duration: "3 hari", notes: "Via IV line" },
      { name: "Vitamin C 1000 mg",        dose: "1000 mg", frequency: "1x sehari",  duration: "7 hari",  notes: "Minum setelah makan" },
      { name: "Ondansetron 4 mg",         dose: "4 mg",    frequency: "2x sehari",  duration: "3 hari",  notes: "Bila mual" },
    ],
    status:    "pending",         // Pharmacist will see this in queue
    notes:     "Pasien alergi sulfonamide. Monitor trombosit tiap 12 jam. Hentikan aspirin dan NSAID.",
    blockchainTxHash: "0x" + "d".repeat(64),
    createdAt: now(),
  };
  await dbPut(`/prescriptions/${emrId}/${rxId}`, prescription, doctor.idToken);
  console.log(`✅  Prescription created (status: pending — visible to pharmacist)`);

  // 7. Update patient status to in_examination
  await dbPatch(`/patients/${emrId}`, { status: "in_examination", updatedAt: now() }, admin.idToken);
  console.log(`✅  Patient status updated → in_examination`);

  // 8. Summary
  console.log("\n" + "─".repeat(55));
  console.log("🎉  Dummy EMR Data Created Successfully!\n");
  console.log(`   EMR ID    : ${emrId}`);
  console.log(`   Pasien    : Budi Santoso`);
  console.log(`   Poli      : Penyakit Dalam`);
  console.log(`   Diagnosis : Demam Dengue / DHF Grade I`);
  console.log(`   Status    : in_examination`);
  console.log("\n📋  What each role can do NOW:");
  console.log("   👨‍💼 Admin     → Lihat di /admin/patients, ubah department");
  console.log("   👩‍⚕️ Perawat   → Lihat di /nurse atau /nurse/patients, klik 'Input SOAP'");
  console.log("   👨‍⚕️ Dokter    → Lihat di /doctor atau /doctor/patients, klik 'Periksa'");
  console.log("   💊 Apoteker  → Lihat di /pharmacist, ada 1 resep 'pending'");
  console.log("   🧑 Pasien    → Login sebagai pasien@emr.id, lihat di /patient\n");
})();
