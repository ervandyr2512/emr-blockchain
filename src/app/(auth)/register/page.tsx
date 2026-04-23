"use client";

export const dynamic = "force-dynamic";

/**
 * Register page — Patient self-registration.
 * After creating an auth account, the user is redirected to complete biodata.
 */

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Building2, User, Mail, Lock, MailCheck, CheckCircle, RefreshCw } from "lucide-react";
import { signUp, resendVerificationEmail } from "@/lib/auth";
import { generateEMRId, savePatient } from "@/lib/emr";
import { sha256 } from "@/lib/hash";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import type { Patient } from "@/types";
import { DEPARTMENTS } from "@/types";

export default function RegisterPage() {
  const router  = useRouter();
  const [step, setStep]   = useState<1 | 2 | 3>(1);
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [registeredEmrId, setRegisteredEmrId] = useState("");

  /* Step 1 — Account credentials */
  const [creds, setCreds] = useState({ name: "", email: "", password: "", confirm: "" });

  /* Step 2 — Full patient biodata */
  const [bio, setBio] = useState({
    firstName:   "",
    lastName:    "",
    gender:      "",
    ktpNumber:   "",
    phone:       "",
    street:      "",
    kelurahan:   "",
    kecamatan:   "",
    kota:        "",
    kodePos:     "",
    ecName:      "",
    ecPhone:     "",
  });

  const handleCreds = (e: React.ChangeEvent<HTMLInputElement>) =>
    setCreds({ ...creds, [e.target.name]: e.target.value });
  const handleBio = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setBio({ ...bio, [e.target.name]: e.target.value });

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerificationEmail(creds.email, creds.password);
      toast.success("Email verifikasi berhasil dikirim ulang!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "already-verified") {
        toast.success("Email sudah terverifikasi. Silakan login.");
        router.push("/login");
      } else if (msg.includes("too-many-requests")) {
        toast.error("Terlalu sering. Tunggu beberapa menit.");
      } else {
        toast.error("Gagal kirim ulang. Coba lagi.");
      }
    } finally {
      setResending(false);
    }
  };

  /* ── Step 1 submit ────────────────────────────────────────────────────── */
  const submitStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (creds.password !== creds.confirm) { toast.error("Password tidak cocok."); return; }
    if (creds.password.length < 6)        { toast.error("Password minimal 6 karakter."); return; }
    setStep(2);
  };

  /* ── Step 2 submit ────────────────────────────────────────────────────── */
  const submitStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. Create Firebase Auth account
      const user = await signUp(creds.email, creds.password, creds.name, "patient");

      // 2. Generate EMR ID
      const emrId = await generateEMRId();

      // 3. Build patient record
      const now = new Date().toISOString();
      const patient: Patient = {
        emrId,
        uid:       user.uid,
        firstName: bio.firstName,
        lastName:  bio.lastName,
        gender:    bio.gender as Patient["gender"],
        ktpNumber: bio.ktpNumber,
        address: {
          street:    bio.street,
          kelurahan: bio.kelurahan,
          kecamatan: bio.kecamatan,
          kota:      bio.kota,
          kodePos:   bio.kodePos,
        },
        phone: bio.phone,
        email: creds.email,
        emergencyContact: { name: bio.ecName, phone: bio.ecPhone },
        status:    "registered",
        createdAt: now,
        updatedAt: now,
      };

      // 4. Save to Firebase
      await savePatient(patient);

      // 5. Done — show email verification step
      setRegisteredEmrId(emrId);
      setStep(3);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Pendaftaran gagal";
      if (msg.includes("email-already-in-use")) {
        toast.error("Email sudah terdaftar.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-navy-900 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo — clickable back to landing page */}
        <Link href="/" className="flex flex-col items-center mb-6 group">
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-3 backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-colors">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white group-hover:text-white/90 transition-colors">Pendaftaran Pasien Baru</h1>
        </Link>

        {/* Step indicator */}
        <div className="flex items-center gap-3 justify-center mb-6">
          {[
            { n: 1, label: "Akun" },
            { n: 2, label: "Biodata" },
            { n: 3, label: "Verifikasi" },
          ].map(({ n, label }) => (
            <React.Fragment key={n}>
              <div className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all
                  ${step > n
                    ? "bg-green-500 border-green-500 text-white"
                    : step === n
                    ? "bg-primary-600 border-primary-600 text-white"
                    : "border-white/30 text-white/40"}`}>
                  {step > n ? <CheckCircle className="w-4 h-4" /> : n}
                </div>
                <span className={`text-[10px] font-medium ${step >= n ? "text-white/70" : "text-white/30"}`}>{label}</span>
              </div>
              {n < 3 && <div className={`flex-1 max-w-12 h-0.5 mb-4 ${step > n ? "bg-green-500" : "bg-white/20"}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {step === 3 ? (
            /* ── Step 3: Email Verification Pending ── */
            <div className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
                <MailCheck className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Verifikasi Email Anda</h2>
              <p className="text-sm text-slate-500 mb-1">
                Pendaftaran berhasil! EMR ID Anda:
              </p>
              <p className="text-base font-mono font-bold text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg inline-block mb-4">
                {registeredEmrId}
              </p>
              <p className="text-sm text-slate-500 mb-8">
                Kami telah mengirimkan link verifikasi ke{" "}
                <span className="font-semibold text-slate-700">{creds.email}</span>.
                Klik link tersebut untuk mengaktifkan akun Anda.
              </p>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left mb-6">
                <p className="text-xs font-semibold text-blue-700 mb-2">Langkah selanjutnya:</p>
                <ol className="text-xs text-blue-600 space-y-1.5 list-decimal list-inside">
                  <li>Buka email di <strong>{creds.email}</strong></li>
                  <li>Cari email dari <strong>Firebase / EMRChain</strong></li>
                  <li>Klik tombol <strong>"Verify Email"</strong></li>
                  <li>Kembali ke sini dan login</li>
                </ol>
              </div>

              <div className="space-y-3">
                <Link
                  href="/login"
                  className="block w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors text-center"
                >
                  Saya Sudah Verifikasi — Login
                </Link>

                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm disabled:opacity-60"
                >
                  {resending
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Mengirim ulang…</>
                    : <><RefreshCw className="w-4 h-4" /> Kirim Ulang Email Verifikasi</>
                  }
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-5">
                Tidak menerima email? Periksa folder Spam/Junk. Link berlaku 24 jam.
              </p>
            </div>
          ) : step === 1 ? (
            <>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Buat Akun</h2>
              <p className="text-sm text-slate-500 mb-6">Sudah punya akun?{" "}
                <Link href="/login" className="text-primary-600 font-semibold hover:underline">Masuk</Link>
              </p>
              <form onSubmit={submitStep1} className="space-y-4">
                <Input label="Nama Lengkap" name="name" value={creds.name} onChange={handleCreds} required
                  icon={<User className="w-4 h-4" />} placeholder="Dr. Budi Santoso" />
                <Input label="Email" name="email" type="email" value={creds.email} onChange={handleCreds} required
                  icon={<Mail className="w-4 h-4" />} placeholder="budi@email.com" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Password" name="password" type="password" value={creds.password}
                    onChange={handleCreds} required placeholder="Min. 6 karakter"
                    icon={<Lock className="w-4 h-4" />} />
                  <Input label="Konfirmasi Password" name="confirm" type="password" value={creds.confirm}
                    onChange={handleCreds} required placeholder="Ulangi password" />
                </div>
                <Button type="submit" className="w-full mt-2" size="lg">Lanjut →</Button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Data Biodata Pasien</h2>
              <p className="text-sm text-slate-500 mb-6">Lengkapi data diri untuk rekam medis</p>
              <form onSubmit={submitStep2} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Nama Depan" name="firstName" value={bio.firstName} onChange={handleBio} required />
                  <Input label="Nama Belakang" name="lastName" value={bio.lastName} onChange={handleBio} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Select label="Jenis Kelamin" name="gender" value={bio.gender}
                    onChange={handleBio as (e: React.ChangeEvent<HTMLSelectElement>) => void} required
                    options={[{ value: "Laki-laki", label: "Laki-laki" }, { value: "Perempuan", label: "Perempuan" }]} />
                  <Input label="No. KTP" name="ktpNumber" value={bio.ktpNumber} onChange={handleBio} required
                    placeholder="16 digit NIK" maxLength={16} />
                </div>
                <Input label="No. Telepon" name="phone" value={bio.phone} onChange={handleBio} required
                  placeholder="08xxxxxxxxxx" type="tel" />

                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Alamat Lengkap</p>
                  <div className="space-y-3">
                    <Input label="Jalan / No. Rumah" name="street" value={bio.street} onChange={handleBio} required />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Kelurahan" name="kelurahan" value={bio.kelurahan} onChange={handleBio} required />
                      <Input label="Kecamatan" name="kecamatan" value={bio.kecamatan} onChange={handleBio} required />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Kota / Kabupaten" name="kota" value={bio.kota} onChange={handleBio} required />
                      <Input label="Kode Pos" name="kodePos" value={bio.kodePos} onChange={handleBio} required
                        placeholder="60xxx" maxLength={5} />
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-semibold text-slate-700 mb-3">Kontak Darurat</p>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Nama" name="ecName" value={bio.ecName} onChange={handleBio} required />
                    <Input label="No. Telepon" name="ecPhone" value={bio.ecPhone} onChange={handleBio} required type="tel" />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1">
                    ← Kembali
                  </Button>
                  <Button type="submit" loading={loading} className="flex-2">
                    Daftar & Buat Rekam Medis
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
