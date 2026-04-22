"use client";

/**
 * Header.tsx
 * ----------
 * Top navigation bar with working notification panel and profile dropdown.
 */

import React, { useState, useRef, useEffect } from "react";
import { Bell, ChevronDown, LogOut, User, Settings, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";

interface HeaderProps {
  title:    string;
  subtitle?: string;
}

const roleConfig: Record<string, { label: string; color: string }> = {
  admin:      { label: "Admin RS",  color: "bg-purple-100 text-purple-700" },
  doctor:     { label: "Dokter",    color: "bg-primary-100 text-primary-700" },
  nurse:      { label: "Perawat",   color: "bg-teal-100 text-teal-700" },
  patient:    { label: "Pasien",    color: "bg-green-100 text-green-700" },
  pharmacist: { label: "Apoteker",  color: "bg-amber-100 text-amber-700" },
};

const DEMO_NOTIFICATIONS = [
  { id: "1", icon: "🏥", title: "Pasien baru terdaftar",       body: "Budi Santoso didaftarkan ke Poli Penyakit Dalam.",      time: "5 mnt lalu",  unread: true  },
  { id: "2", icon: "💊", title: "Resep selesai diproses",      body: "Resep untuk Budi Santoso sudah diserahkan ke pasien.",   time: "30 mnt lalu", unread: true  },
  { id: "3", icon: "📋", title: "SOAP note telah diisi",       body: "Perawat Sari telah mengisi catatan SOAP pasien.",        time: "1 jam lalu",  unread: false },
  { id: "4", icon: "🔗", title: "Data tersimpan di blockchain", body: "Hash rekam medis berhasil dicatat di Sepolia testnet.", time: "2 jam lalu",  unread: false },
];

export function Header({ title, subtitle }: HeaderProps) {
  const router      = useRouter();
  const { profile } = useAuth();

  const [showNotif,    setShowNotif]    = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);
  const [notifications, setNotifs]      = useState(DEMO_NOTIFICATIONS);

  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (notifRef.current   && !notifRef.current.contains(e.target as Node))   setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const unread = notifications.filter((n) => n.unread).length;
  const rc     = roleConfig[profile?.role ?? "patient"];

  const handleSignOut = async () => {
    setShowProfile(false);
    await signOut();
    router.push("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-slate-100 shadow-sm flex items-center px-6 gap-4 flex-shrink-0 relative z-30">
      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-bold text-slate-800 leading-tight truncate">{title}</h1>
        {subtitle && <p className="text-xs text-slate-400 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-1">

        {/* ── Bell ─────────────────────────────── */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotif((v) => !v); setShowProfile(false); }}
            className="relative p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unread}
              </span>
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="font-semibold text-sm text-slate-800">Notifikasi</span>
                <button
                  onClick={() => setNotifs((p) => p.map((n) => ({ ...n, unread: false })))}
                  className="text-xs text-primary-600 hover:underline font-medium"
                >
                  Tandai semua dibaca
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => setNotifs((p) => p.map((x) => x.id === n.id ? { ...x, unread: false } : x))}
                    className={`px-4 py-3 flex gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${n.unread ? "bg-primary-50/40" : ""}`}
                  >
                    <span className="text-xl leading-none mt-0.5">{n.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm text-slate-800 truncate ${n.unread ? "font-semibold" : "font-medium"}`}>{n.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                    </div>
                    {n.unread && <span className="w-2 h-2 bg-primary-500 rounded-full mt-1.5 flex-shrink-0" />}
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-slate-100 text-center">
                <span className="text-xs text-slate-400">Semua notifikasi ditampilkan</span>
              </div>
            </div>
          )}
        </div>

        {/* ── Profile chip ──────────────────────── */}
        {profile && (
          <div ref={profileRef} className="relative">
            <button
              onClick={() => { setShowProfile((v) => !v); setShowNotif(false); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-700 flex-shrink-0">
                {profile.name[0]?.toUpperCase()}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-semibold text-slate-700 leading-tight">{profile.name}</p>
                <p className="text-[10px] text-slate-400">{rc?.label}</p>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform duration-150 ${showProfile ? "rotate-180" : ""}`} />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                {/* User info banner */}
                <div className="px-4 py-4 border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-base font-bold text-primary-700">
                      {profile.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-slate-800 truncate">{profile.name}</p>
                      <p className="text-xs text-slate-500 truncate">{profile.email}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 inline-block ${rc?.color}`}>
                        {rc?.label}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="py-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <User className="w-4 h-4 text-slate-400" /> Profil Saya
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <Settings className="w-4 h-4 text-slate-400" /> Pengaturan
                  </button>
                  <button className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                    <ShieldCheck className="w-4 h-4 text-slate-400" /> Keamanan Akun
                  </button>
                </div>

                <div className="border-t border-slate-100 py-1">
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"
                  >
                    <LogOut className="w-4 h-4" /> Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
