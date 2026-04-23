"use client";

export const dynamic = "force-dynamic";

/**
 * Doctor Self-Registration
 * ------------------------
 * Doctors fill in their professional credentials.
 * On submit: Firebase Auth account is created (role = "pending_doctor") and
 * the full application is saved to doctor_applications/{uid}.
 * Admin will review and approve in the Admin → Manajemen Staff dashboard.
 */

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Building2, Mail, Lock, Eye, EyeOff, User, Phone,
  GraduationCap, Award, FileText, ChevronRight,
  CheckCircle, Stethoscope, ClipboardList,
} from "lucide-react";
import { signUp } from "@/lib/auth";
import { saveDoctorApplication } from "@/lib/emr";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { DoctorApplication } from "@/types";

const SPECIALIZATIONS = [
  "Umum",
  "Penyakit Dalam",
  "Bedah Umum",
  "Bedah Vaskuler",
  "Urologi",
  "Ortopedi dan Traumatologi",
  "Obstetri dan Ginekologi",
  "Neurologi",
  "Kardiologi",
  "Paru",
  "Anak",
  "Anestesiologi",
  "Radiologi",
  "Patologi Klinik",
  "Kulit dan Kelamin",
  "THT",
  "Mata",
  "Psikiatri",
  "Rehabilitasi Medis",
  "Lainnya",
];

type Step = 1 | 2 | 3;

interface FormData {
  // Step 1 — Account
  name:     string;
  email:    string;
  password: string;
  confirm:  string;
  // Step 2 — Professional
  phone:          string;
  specialization: string;
  strNumber:      string;
  sipNumber:      string;
  hospital:       string;
  education:      string;
  experience:     string;
  bio:            string;
}

const EMPTY: FormData = {
  name: "", email: "", password: "", confirm: "",
  phone: "", specialization: "Umum", strNumber: "", sipNumber: "",
  hospital: "", education: "", experience: "", bio: "",
};

export default function RegisterDokterPage() {
  const router = useRouter();
  const [step,    setStep]    = useState<Step>(1);
  const [form,    setForm]    = useState<FormData>(EMPTY);
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ── Step 1 validation ───────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!form.name.trim())    { toast.error("Nama lengkap wajib diisi."); return false; }
    if (!form.email.trim())   { toast.error("Email wajib diisi."); return false; }
    if (form.password.length < 8) { toast.error("Password minimal 8 karakter."); return false; }
    if (form.password !== form.confirm) { toast.error("Konfirmasi password tidak cocok."); return false; }
    return true;
  };

  // ── Step 2 validation ───────────────────────────────────────────────────────
  const validateStep2 = () => {
    if (!form.phone.trim())     { toast.error("Nomor telepon wajib diisi."); return false; }
    if (!form.strNumber.trim()) { toast.error("Nomor STR wajib diisi."); return false; }
    if (!form.sipNumber.trim()) { toast.error("Nomor SIP wajib diisi."); return false; }
    if (!form.hospital.trim())  { toast.error("Nama RS / Klinik wajib diisi."); return false; }
    if (!form.education.trim()) { toast.error("Riwayat pendidikan wajib diisi."); return false; }
    if (!form.experience || Number(form.experience) < 0) {
      toast.error("Lama pengalaman wajib diisi."); return false;
    }
    return true;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create Firebase Auth account with "pending_doctor" role
      const user = await signUp(form.email, form.password, form.name, "pending_doctor");

      // 2. Save full application to Firebase RTDB
      const application: DoctorApplication = {
        uid:            user.uid,
        email:          form.email,
        name:           form.name,
        phone:          form.phone,
        specialization: form.specialization,
        strNumber:      form.strNumber,
        sipNumber:      form.sipNumber,
        hospital:       form.hospital,
        education:      form.education,
        experience:     Number(form.experience),
        bio:            form.bio,
        status:         "pending",
        submittedAt:    new Date().toISOString(),
      };
      await saveDoctorApplication(application);

      toast.success("Pendaftaran berhasil! Menunggu persetujuan admin.");
      router.push("/pending-approval");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mendaftar";
      if (msg.includes("email-already-in-use")) {
        toast.error("Email sudah terdaftar. Gunakan email lain.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Progress indicator ──────────────────────────────────────────────────────
  const steps = [
    { num: 1, label: "Akun" },
    { num: 2, label: "Profil Profesional" },
    { num: 3, label: "Konfirmasi" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Daftar Sebagai Dokter</h1>
          <p className="text-white/60 text-sm mt-1">EMRChain — Sistem Rekam Medis Elektronik</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {steps.map((s, i) => (
            <React.Fragment key={s.num}>
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  step > s.num
                    ? "bg-green-500 text-white"
                    : step === s.num
                    ? "bg-teal-500 text-white ring-4 ring-teal-400/30"
                    : "bg-white/10 text-white/40"
                }`}>
                  {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                </div>
                <span className={`text-xs mt-1.5 font-medium ${step >= s.num ? "text-white/80" : "text-white/30"}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-16 sm:w-24 mx-1 mb-5 transition-colors ${step > s.num ? "bg-green-500" : "bg-white/10"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">

          {/* ── STEP 1 — Account credentials ─────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Informasi Akun</h2>
                <p className="text-sm text-slate-500 mt-1">Buat akun login Anda untuk mengakses EMRChain.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Nama Lengkap (dengan gelar)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="name"
                      value={form.name}
                      onChange={handle}
                      placeholder="dr. Nama Anda, Sp.XX"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Contoh: dr. Budi Santoso, Sp.PD</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handle}
                      placeholder="email@dokter.com"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPw ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handle}
                      placeholder="Minimal 8 karakter"
                      className="w-full pl-10 pr-11 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Konfirmasi Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type={showPw ? "text" : "password"}
                      name="confirm"
                      value={form.confirm}
                      onChange={handle}
                      placeholder="Ulangi password"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full" onClick={nextStep}>
                Lanjut <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* ── STEP 2 — Professional profile ────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Profil Profesional</h2>
                <p className="text-sm text-slate-500 mt-1">Data ini akan diverifikasi oleh admin sebelum akun diaktifkan.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phone */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">No. Telepon / HP</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="phone"
                      value={form.phone}
                      onChange={handle}
                      placeholder="08xxxxxxxxxx"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Specialization */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Spesialisasi</label>
                  <select
                    name="specialization"
                    value={form.specialization}
                    onChange={handle}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    {SPECIALIZATIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* STR Number */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Nomor STR <span className="text-slate-400 font-normal">(Surat Tanda Registrasi)</span>
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="strNumber"
                      value={form.strNumber}
                      onChange={handle}
                      placeholder="Contoh: 32/72100/1/2024"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* SIP Number */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Nomor SIP <span className="text-slate-400 font-normal">(Surat Izin Praktik)</span>
                  </label>
                  <div className="relative">
                    <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="sipNumber"
                      value={form.sipNumber}
                      onChange={handle}
                      placeholder="Contoh: 503/001/SIP/2024"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Hospital */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">RS / Klinik Tempat Praktik</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      name="hospital"
                      value={form.hospital}
                      onChange={handle}
                      placeholder="Nama rumah sakit atau klinik"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Years of experience */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Lama Pengalaman (tahun)</label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      name="experience"
                      value={form.experience}
                      onChange={handle}
                      min="0"
                      max="60"
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Education */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Riwayat Pendidikan</label>
                <div className="relative">
                  <GraduationCap className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    name="education"
                    value={form.education}
                    onChange={handle}
                    placeholder="Contoh: FK UI (2010), Sp.PD RSCM (2015)"
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Bio Singkat <span className="text-slate-400 font-normal">(opsional)</span>
                </label>
                <textarea
                  name="bio"
                  value={form.bio}
                  onChange={handle}
                  rows={3}
                  placeholder="Ceritakan keahlian dan pendekatan Anda dalam melayani pasien…"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  Kembali
                </Button>
                <Button className="flex-1" onClick={nextStep}>
                  Lanjut <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3 — Review & Submit ──────────────────────────────────── */}
          {step === 3 && (
            <form onSubmit={submit} className="space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Konfirmasi Pendaftaran</h2>
                <p className="text-sm text-slate-500 mt-1">Periksa data Anda sebelum mengirimkan permohonan.</p>
              </div>

              {/* Summary card */}
              <div className="bg-slate-50 rounded-2xl p-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama</span>
                  <span className="font-semibold text-slate-800">{form.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email</span>
                  <span className="font-semibold text-slate-800">{form.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Telepon</span>
                  <span className="font-semibold text-slate-800">{form.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Spesialisasi</span>
                  <span className="font-semibold text-slate-800">{form.specialization}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. STR</span>
                  <span className="font-semibold text-slate-800">{form.strNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. SIP</span>
                  <span className="font-semibold text-slate-800">{form.sipNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">RS / Klinik</span>
                  <span className="font-semibold text-slate-800">{form.hospital}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pendidikan</span>
                  <span className="font-semibold text-slate-800">{form.education}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pengalaman</span>
                  <span className="font-semibold text-slate-800">{form.experience} tahun</span>
                </div>
              </div>

              {/* Info notice */}
              <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-xl p-4">
                <CheckCircle className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-teal-800">Apa yang terjadi selanjutnya?</p>
                  <p className="text-teal-700 mt-1">
                    Admin EMRChain akan meninjau permohonan Anda dalam 1×24 jam.
                    Setelah disetujui, Anda dapat login dan mulai mengakses rekam medis pasien.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>
                  Kembali
                </Button>
                <Button type="submit" loading={loading} variant="primary" className="flex-1">
                  Kirim Permohonan
                </Button>
              </div>
            </form>
          )}

          {/* Footer link */}
          <p className="text-center text-sm text-slate-500 mt-6">
            Sudah punya akun?{" "}
            <Link href="/login" className="text-teal-600 font-semibold hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
