"use client";

/**
 * Login page — Email / Password authentication via Firebase.
 */

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Building2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { signIn, getDashboardPath } from "@/lib/auth";
import { getUserProfile } from "@/lib/emr";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

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
      const msg = err instanceof Error ? err.message : "Login gagal";
      // Translate Firebase error codes
      if (msg.includes("invalid-credential") || msg.includes("wrong-password")) {
        toast.error("Email atau password salah.");
      } else if (msg.includes("too-many-requests")) {
        toast.error("Terlalu banyak percobaan. Coba lagi nanti.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-navy-900 to-primary-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">EMR Blockchain</h1>
          <p className="text-white/60 text-sm mt-1">Sistem Rekam Medis Elektronik</p>
        </div>

        {/* Card */}
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
          <p className="text-white/70 text-xs font-semibold mb-2">Demo Akun:</p>
          <div className="space-y-1 text-white/50 text-xs font-mono">
            <p>admin@emr.id / admin123</p>
            <p>dokter@emr.id / dokter123</p>
            <p>perawat@emr.id / perawat123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
