"use client";

/**
 * Sidebar.tsx
 * -----------
 * Role-aware navigation sidebar. Shows only the menu items
 * relevant to the currently logged-in user's role.
 */

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard, Users, FileText, Activity, FlaskConical,
  Pill, ClipboardList, ChevronLeft, ChevronRight,
  ShieldCheck, Building2, LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import type { UserRole } from "@/types";

// ── Nav item definition ───────────────────────────────────────────────────────

interface NavItem {
  href:  string;
  label: string;
  icon:  React.ReactNode;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  {
    href:  "/admin",
    label: "Dashboard Admin",
    icon:  <LayoutDashboard className="w-5 h-5" />,
    roles: ["admin"],
  },
  {
    href:  "/admin/patients",
    label: "Daftar Pasien",
    icon:  <Users className="w-5 h-5" />,
    roles: ["admin"],
  },
  {
    href:  "/admin/staff",
    label: "Manajemen Staff",
    icon:  <ShieldCheck className="w-5 h-5" />,
    roles: ["admin"],
  },
  {
    href:  "/doctor",
    label: "Dashboard Dokter",
    icon:  <LayoutDashboard className="w-5 h-5" />,
    roles: ["doctor"],
  },
  {
    href:  "/doctor/patients",
    label: "Pasien Saya",
    icon:  <Users className="w-5 h-5" />,
    roles: ["doctor"],
  },
  {
    href:  "/nurse",
    label: "Dashboard Perawat",
    icon:  <LayoutDashboard className="w-5 h-5" />,
    roles: ["nurse"],
  },
  {
    href:  "/nurse/patients",
    label: "Pasien Aktif",
    icon:  <Activity className="w-5 h-5" />,
    roles: ["nurse"],
  },
  {
    href:  "/patient",
    label: "Dashboard Pasien",
    icon:  <LayoutDashboard className="w-5 h-5" />,
    roles: ["patient"],
  },
  {
    href:  "/patient/emr",
    label: "Rekam Medis Saya",
    icon:  <FileText className="w-5 h-5" />,
    roles: ["patient"],
  },
  {
    href:  "/pharmacist",
    label: "Dashboard Apoteker",
    icon:  <LayoutDashboard className="w-5 h-5" />,
    roles: ["pharmacist"],
  },
  {
    href:  "/pharmacist/prescriptions",
    label: "Resep Masuk",
    icon:  <Pill className="w-5 h-5" />,
    roles: ["pharmacist"],
  },
];

// ── Role colors ────────────────────────────────────────────────────────────────

const roleConfig: Record<UserRole, { label: string; color: string }> = {
  admin:       { label: "Admin RS",  color: "bg-purple-100 text-purple-700" },
  doctor:      { label: "Dokter",    color: "bg-primary-100 text-primary-700" },
  nurse:       { label: "Perawat",   color: "bg-teal-100 text-teal-700" },
  patient:     { label: "Pasien",    color: "bg-green-100 text-green-700" },
  pharmacist:     { label: "Apoteker",       color: "bg-amber-100 text-amber-700" },
  pending_doctor: { label: "Menunggu Verif", color: "bg-slate-100 text-slate-500" },
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Sidebar() {
  const pathname       = usePathname();
  const { profile }    = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const role     = profile?.role ?? "patient";
  const rc       = roleConfig[role];
  const navItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  return (
    <aside
      className={clsx(
        "flex flex-col h-full bg-navy-900 text-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="flex-shrink-0 w-9 h-9 bg-primary-600 rounded-xl flex items-center justify-center shadow-sm">
          <Building2 className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="font-bold text-sm leading-tight">EMR Blockchain</p>
            <p className="text-xs text-white/50">Sistem Rekam Medis</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && profile && (
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-bold">
              {profile.name[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile.name}</p>
              <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full", rc.color)}>
                {rc.label}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={clsx(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                active
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              )}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="p-2 border-t border-white/10">
        <button
          onClick={handleSignOut}
          title="Keluar"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
