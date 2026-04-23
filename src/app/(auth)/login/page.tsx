"use client";

export const dynamic = "force-dynamic";

/**
 * Login page — Email / Password authentication via Firebase.
 * Blocks unverified accounts (except demo accounts) and offers resend.
 */

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Building2, Mail, Lock, Eye, EyeOff,
  MailCheck, RefreshCw, CheckCircle,
} from "lucide-react";
import { signIn, getDashboardPath, resendVerificationEmail } from "@/lib/auth";
import { getUserProfile } from "@/lib/emr";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type PageState = "form" | "unverified" | "resent";

export default function LoginPage() {
  const router = useRouter();

  const [form,    setForm]    = useState({ email: "", password: "" });
  const [showPw,  setShowPw]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [pageState, setPageState] = useState<PageState>("form");

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // ── Submit login ────────────────────────────────────────────────────────────
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user    = await signIn(form.email, form.password);
      const profile = await getUserProfile(user.uid);
      if (!profile) throw new Error("Profil pengguna tidak ditemukan. Hubungi admin.");
      toast.success(`Selamat datang, ${profile.name}!`);
      router.push(getDashboardPath(profile.role));
    } catch (err: unknown) {
      const msg  = err instanceof Error ? err.message : "Login gagal";
      const code = (err as any)?.code ?? "";

      if (msg === "email-not-verified" || code === "email-not-verified") {
        // Blocked — email not verified, show dedicated screen
        setPageState("unverified");
      } else if (msg.includes("invalid-credential") || msg.includes("wrong-password") || msg.includes("INVALID_PASSWORD")) {
        toast.error("Email atau password salah.");
      } else if (msg.includes("user-not-found") || msg.includes("USER_NOT_FOUND")) {
        toast.error("Email tidak terdaftar. Silakan daftar terlebih dahulu.");
      } else if (msg.includes("too-many-requests")) {
        toast.error("Terlalu banyak percobaan. Coba lagi beberapa menit.");
      } else if (msg.includes("network-request-failed") || msg.includes("network")) {
        toast.error("Gagal terhubung ke server. Periksa koneksi internet Anda.");
      } else if (msg.includes("Profil pengguna tidak ditemukan")) {
        toast.error("Login berhasil tetapi profil tidak ditemukan. Hubungi admin.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Resend verification email ───────────────────────────────────────────────
  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerificationEmail(form.email, form.password);
      setPageState("resent");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "already-verified") {
        toast.success("Email Anda sudah terverifikasi. Silakan login.");
        setPageState("form");
      } else if (msg.includes("too-many-requests")) {
        toast.error("Terlalu sering. Tunggu beberapa menit lalu coba lagi.");
      } else if (msg.includes("invalid-credential") || msg.includes("wrong-password")) {
        toast.error("Password salah. Tidak dapat mengirim ulang email.");
      } else {
        toast.error("Gagal mengirim ulang email. Coba lagi.");
      }
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-navy-900 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo — clickable back to landing page */}
        <Link href="/" className="flex flex-col items-center mb-8 group">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-colors">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white group-hover:text-white/90 transition-colors">EMR Blockchain</h1>
          <p className="text-white/60 text-sm mt-1">Sistem Rekam Medis Elektronik</p>
        </Link>

        {/* ── STATE: unverified ── */}
        {pageState === "unverified" && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <MailCheck className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Verifikasi Email Dulu</h2>
            <p className="text-sm text-slate-500 mb-2">
              Akun <span className="font-semibold text-slate-700">{form.email}</span> belum diverifikasi.
            </p>
            <p className="text-sm text-slate-500 mb-8">
              Kami sudah mengirimkan link verifikasi ke email Anda saat pendaftaran.
              Buka email tersebut dan klik link di dalamnya, lalu coba login kembali.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleResend}
                disabled={resending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-60"
              >
                {resending
                  ? <><RefreshCw className="w-4 h-4 animate-spin" /> Mengirim…</>
                  : <><RefreshCw className="w-4 h-4" /> Kirim Ulang Email Verifikasi</>
                }
              </button>

              <button
                onClick={() => setPageState("form")}
                className="w-full py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                ← Kembali ke Login
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-6">
              Tidak menerima email? Periksa folder Spam/Junk, atau klik "Kirim Ulang" di atas.
            </p>
          </div>
        )}

        {/* ── STATE: resent ── */}
        {pageState === "resent" && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Email Terkirim!</h2>
            <p className="text-sm text-slate-500 mb-2">
              Link verifikasi baru telah dikirim ke:
            </p>
            <p className="font-semibold text-slate-800 mb-8">{form.email}</p>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-left mb-6">
              <p className="text-xs font-semibold text-blue-700 mb-2">Langkah selanjutnya:</p>
              <ol className="text-xs text-blue-600 space-y-1.5 list-decimal list-inside">
                <li>Buka aplikasi email Anda</li>
                <li>Cari email dari <strong>noreply@emrchain.id</strong></li>
                <li>Klik tombol <strong>"Verifikasi Email"</strong> dalam email</li>
                <li>Kembali ke sini dan login</li>
              </ol>
            </div>

            <button
              onClick={() => setPageState("form")}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl transition-colors"
            >
              Oke, Saya Sudah Verifikasi — Login
            </button>

            <p className="text-xs text-slate-400 mt-4">
              Tidak menerima lagi? Periksa folder Spam. Link verifikasi berlaku 24 jam.
            </p>
          </div>
        )}

        {/* ── STATE: form ── */}
        {pageState === "form" && (
          <>
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-1">Masuk ke Akun</h2>
              <p className="text-sm text-slate-500 mb-6">
                Belum punya akun?{" "}
                <Link href="/register" className="text-primary-600 font-semibold hover:underline">
                  Daftar di sini
                </Link>
              </p>

              <form onSubmit={submit} className="space-y-4">
                <Input
                  label="Alamat Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handle}
                  placeholder="dokter@rumahsakit.id"
                  required
                  icon={<Mail className="w-4 h-4" />}
                />
                <div className="relative">
                  <Input
                    label="Password"
                    name="password"
                    type={showPw ? "text" : "password"}
                    value={form.password}
                    onChange={handle}
                    placeholder="••••••••"
                    required
                    icon={<Lock className="w-4 h-4" />}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex justify-end">
                  <Link href="/reset-password" className="text-sm text-primary-600 hover:underline">
                    Lupa password?
                  </Link>
                </div>

                <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
                  Masuk
                </Button>
              </form>
            </div>

            {/* Demo credentials hint */}
            <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <p className="text-white/70 text-xs font-semibold mb-2">Demo Akun (tidak perlu verifikasi):</p>
              <div className="space-y-1 text-white/50 text-xs font-mono">
                <p>admin@emr.id / admin123</p>
                <p>dokter@emr.id / dokter123</p>
                <p>perawat@emr.id / perawat123</p>
                <p>apoteker@emr.id / apoteker123</p>
                <p>pasien@emr.id / pasien123</p>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
