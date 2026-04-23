"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, Menu, X, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { getDashboardPath } from "@/lib/auth";

const NAV_LINKS = [
  { href: "/",              label: "Home" },
  { href: "/rumah-sakit",   label: "Rumah Sakit" },
  { href: "/dokter",        label: "Dokter" },
  { href: "/tentang-kami",  label: "Tentang Kami" },
  { href: "/kontak-kami",   label: "Kontak Kami" },
];

export function LandingNavbar() {
  const pathname          = usePathname();
  const router            = useRouter();
  const { user, profile } = useAuth();

  const [scrolled,     setScrolled]     = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut();
    router.push("/");
  };

  const dashPath = profile ? getDashboardPath(profile.role) : "/login";

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-md border-b border-slate-100"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">

          {/* ── Logo ── */}
          <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-teal-500 rounded-xl flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className={`font-bold text-lg leading-none ${scrolled ? "text-slate-800" : "text-white"}`}>
                EMR<span className="text-blue-400">Chain</span>
              </span>
              <p className={`text-[10px] leading-none mt-0.5 ${scrolled ? "text-slate-400" : "text-white/60"}`}>
                Rekam Medis Blockchain
              </p>
            </div>
          </Link>

          {/* ── Desktop Nav ── */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? scrolled
                        ? "bg-blue-50 text-blue-700"
                        : "bg-white/15 text-white"
                      : scrolled
                      ? "text-slate-600 hover:text-blue-700 hover:bg-blue-50"
                      : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* ── Auth buttons ── */}
          <div className="hidden lg:flex items-center gap-2">
            {user && profile ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all ${
                    scrolled
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                      : "bg-white/15 hover:bg-white/25 text-white"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white">
                    {profile.name?.[0]?.toUpperCase()}
                  </div>
                  <span className="text-sm font-medium max-w-[120px] truncate">{profile.name}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-teal-50 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800 truncate">{profile.name}</p>
                      <p className="text-xs text-slate-500 truncate">{profile.email}</p>
                    </div>
                    <div className="py-1">
                      <Link
                        href={dashPath}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4 text-blue-500" /> Dashboard
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Keluar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                    scrolled
                      ? "border-blue-200 text-blue-700 hover:bg-blue-50"
                      : "border-white/40 text-white hover:bg-white/10"
                  }`}
                >
                  Masuk
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-teal-500 text-white hover:opacity-90 shadow-md hover:shadow-lg transition-all"
                >
                  Daftar
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className={`lg:hidden p-2 rounded-xl transition-colors ${
              scrolled ? "text-slate-700 hover:bg-slate-100" : "text-white hover:bg-white/10"
            }`}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <div
        className={`lg:hidden transition-all duration-300 overflow-hidden ${
          mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-white/98 backdrop-blur-md border-t border-slate-100 px-4 py-4 space-y-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:text-blue-700 hover:bg-blue-50"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          <div className="pt-3 pb-1 flex gap-2 border-t border-slate-100 mt-2">
            {user && profile ? (
              <>
                <Link href={dashPath} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white text-center hover:bg-blue-700 transition-colors">
                  Dashboard
                </Link>
                <button onClick={handleSignOut} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-blue-200 text-blue-700 text-center hover:bg-blue-50 transition-colors">
                  Masuk
                </Link>
                <Link href="/register" className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-teal-500 text-white text-center hover:opacity-90 transition-opacity">
                  Daftar
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
