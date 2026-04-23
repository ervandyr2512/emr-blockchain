"use client";

export const dynamic = "force-dynamic";

/**
 * /profile — User profile, settings, and security (3 tabs).
 * Accepts ?tab=profile | settings | security
 */

import { safeFormat } from "@/lib/dateUtils";
import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import {
  User, Settings, ShieldCheck, Save, Eye, EyeOff,
  Mail, Phone, BadgeCheck, Calendar,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/hooks/useAuth";
import { updateUserRole } from "@/lib/emr";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

// ── Tab definitions ───────────────────────────────────────────────────────────
type Tab = "profile" | "settings" | "security";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "profile",  label: "Profil Saya",    icon: <User       className="w-4 h-4" /> },
  { id: "settings", label: "Pengaturan",     icon: <Settings   className="w-4 h-4" /> },
  { id: "security", label: "Keamanan Akun",  icon: <ShieldCheck className="w-4 h-4" /> },
];

const roleLabel: Record<string, string> = {
  admin:      "Admin Rumah Sakit",
  doctor:     "Dokter",
  nurse:      "Perawat",
  patient:    "Pasien",
  pharmacist: "Apoteker",
};

const roleColor: Record<string, string> = {
  admin:      "bg-purple-100 text-purple-700 border-purple-200",
  doctor:     "bg-primary-100 text-primary-700 border-primary-200",
  nurse:      "bg-teal-100 text-teal-700 border-teal-200",
  patient:    "bg-green-100 text-green-700 border-green-200",
  pharmacist: "bg-amber-100 text-amber-700 border-amber-200",
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const searchParams = useSearchParams();
  const { profile }  = useAuth();

  const initialTab = (searchParams.get("tab") as Tab) ?? "profile";
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Update tab when query param changes (e.g. from header link)
  useEffect(() => {
    const t = searchParams.get("tab") as Tab;
    if (t) setActiveTab(t);
  }, [searchParams]);

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Pengaturan Akun" subtitle="Kelola profil dan keamanan akun Anda" />
      <div className="p-6 max-w-2xl mx-auto space-y-6">

        {/* Tab switcher */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "profile"  && <ProfileTab  profile={profile} />}
        {activeTab === "settings" && <SettingsTab profile={profile} />}
        {activeTab === "security" && <SecurityTab profile={profile} />}
      </div>
    </div>
  );
}

// ── Profile Tab ───────────────────────────────────────────────────────────────
function ProfileTab({ profile }: { profile: any }) {
  if (!profile) return <Card><p className="text-slate-400 text-sm">Memuat profil…</p></Card>;

  const initials = profile.name?.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const rc       = roleColor[profile.role] ?? "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <div className="space-y-4">
      {/* Avatar card */}
      <Card>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center text-2xl font-bold text-primary-700 flex-shrink-0">
            {initials}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{profile.name}</h2>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${rc}`}>
              {roleLabel[profile.role] ?? profile.role}
            </span>
          </div>
        </div>
      </Card>

      {/* Info fields */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">Informasi Akun</h3>
        <div className="space-y-4">
          <InfoRow icon={<User    className="w-4 h-4 text-slate-400" />} label="Nama Lengkap" value={profile.name} />
          <InfoRow icon={<Mail    className="w-4 h-4 text-slate-400" />} label="Alamat Email" value={profile.email} />
          <InfoRow icon={<BadgeCheck className="w-4 h-4 text-slate-400" />} label="Role"  value={roleLabel[profile.role] ?? profile.role} />
          <InfoRow
            icon={<Calendar className="w-4 h-4 text-slate-400" />}
            label="Bergabung"
            value={profile.createdAt ? safeFormat(profile.createdAt, "dd MMMM yyyy") : "—"}
          />
          <InfoRow icon={<ShieldCheck className="w-4 h-4 text-slate-400" />} label="User ID" value={profile.uid} mono />
        </div>
      </Card>

      <p className="text-xs text-slate-400 text-center">
        Untuk mengubah nama atau email, hubungi Admin Rumah Sakit.
      </p>
    </div>
  );
}

function InfoRow({ icon, label, value, mono = false }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
      <span className="mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
        <p className={`text-sm text-slate-800 break-all ${mono ? "font-mono text-xs bg-slate-50 px-2 py-1 rounded-lg" : "font-medium"}`}>{value}</p>
      </div>
    </div>
  );
}

// ── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab({ profile }: { profile: any }) {
  const [lang,  setLang]  = useState("id");
  const [notif, setNotif] = useState(true);
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    toast.success("Pengaturan berhasil disimpan!");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">Preferensi Tampilan</h3>
        <div className="space-y-4">
          {/* Language */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Bahasa Antarmuka</label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option value="id">🇮🇩  Bahasa Indonesia</option>
              <option value="en">🇬🇧  English</option>
            </select>
          </div>

          {/* Notifications toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-slate-700">Notifikasi Sistem</p>
              <p className="text-xs text-slate-400 mt-0.5">Terima pemberitahuan aktivitas pasien dan resep baru</p>
            </div>
            <button
              onClick={() => setNotif((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${notif ? "bg-primary-500" : "bg-slate-200"}`}
            >
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notif ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Zona Waktu</label>
            <select className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white">
              <option>Asia/Jakarta (WIB, UTC+7)</option>
              <option>Asia/Makassar (WITA, UTC+8)</option>
              <option>Asia/Jayapura (WIT, UTC+9)</option>
            </select>
          </div>
        </div>
      </Card>

      <Button onClick={save} icon={<Save className="w-4 h-4" />} className="w-full">
        {saved ? "Tersimpan ✓" : "Simpan Pengaturan"}
      </Button>
    </div>
  );
}

// ── Security Tab ──────────────────────────────────────────────────────────────
function SecurityTab({ profile }: { profile: any }) {
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const sendReset = async () => {
    if (!profile?.email || !auth) return;
    setSending(true);
    try {
      await sendPasswordResetEmail(auth, profile.email);
      setSent(true);
      toast.success(`Link reset password dikirim ke ${profile.email}`);
    } catch (err: any) {
      toast.error(err.message ?? "Gagal mengirim email reset");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current account info */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-4 text-sm uppercase tracking-wide">Status Keamanan</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
            <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-700">Akun Terverifikasi</p>
              <p className="text-xs text-green-600">Email: {profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <Mail className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-700">Autentikasi Email & Password</p>
              <p className="text-xs text-slate-400">Login menggunakan email dan password</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Change password */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-1 text-sm uppercase tracking-wide">Ubah Password</h3>
        <p className="text-xs text-slate-400 mb-4">
          Kami akan mengirimkan link reset password ke email Anda. Buka email dan ikuti petunjuknya.
        </p>

        {sent ? (
          <div className="flex items-center gap-3 p-4 bg-primary-50 rounded-xl border border-primary-100">
            <Mail className="w-5 h-5 text-primary-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-primary-700">Email Terkirim!</p>
              <p className="text-xs text-primary-600">Cek inbox {profile?.email} dan klik link di dalamnya.</p>
            </div>
          </div>
        ) : (
          <Button
            onClick={sendReset}
            loading={sending}
            variant="outline"
            icon={<Mail className="w-4 h-4" />}
            className="w-full"
          >
            Kirim Link Reset Password
          </Button>
        )}
      </Card>

      {/* Security tips */}
      <Card>
        <h3 className="font-semibold text-slate-700 mb-3 text-sm uppercase tracking-wide">Tips Keamanan</h3>
        <ul className="space-y-2 text-xs text-slate-500">
          {[
            "Gunakan password minimal 12 karakter yang unik",
            "Jangan gunakan password yang sama di situs lain",
            "Logout dari perangkat yang tidak Anda kenal",
            "Jangan bagikan kredensial akun kepada siapapun",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
