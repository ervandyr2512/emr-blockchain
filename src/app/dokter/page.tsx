"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { Star, Search, ChevronRight, GraduationCap, Award, Clock } from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LandingFooter } from "@/components/layout/LandingFooter";
import Link from "next/link";

const SPECIALTIES = ["Semua", "Penyakit Dalam", "Jantung", "Anak", "Bedah", "Neurologi", "Kandungan", "Ortopedi"];

const DOCTORS = [
  { name: "Dr. Ahmad Fauzi, Sp.PD",      spesialis: "Penyakit Dalam",  rs: "RSCM",              pengalaman: 18, rating: 4.9, pasien: 3200, pendidikan: "FK UI", konsultasi: "Senin–Jumat",  color: "from-blue-500 to-blue-600"    },
  { name: "Dr. Sarah Amelia, Sp.JP",      spesialis: "Jantung",         rs: "RS Bunda Jakarta",   pengalaman: 14, rating: 4.8, pasien: 2800, pendidikan: "FK UNPAD", konsultasi: "Selasa–Sabtu", color: "from-rose-500 to-rose-600"   },
  { name: "Dr. Rudi Hartono, Sp.A",       spesialis: "Anak",            rs: "RS Fatmawati",       pengalaman: 12, rating: 4.9, pasien: 4100, pendidikan: "FK UI",    konsultasi: "Senin–Kamis",  color: "from-teal-500 to-teal-600"   },
  { name: "Dr. Dewi Kusuma, Sp.OG",       spesialis: "Kandungan",       rs: "RS Premier Bintaro", pengalaman: 16, rating: 4.7, pasien: 2600, pendidikan: "FK UGM",   konsultasi: "Rabu–Sabtu",   color: "from-purple-500 to-purple-600"},
  { name: "Dr. Bachtiar Saleh, Sp.BS",    spesialis: "Bedah",           rs: "Mandaya Hospital",   pengalaman: 22, rating: 4.8, pasien: 1900, pendidikan: "FK UI",    konsultasi: "Senin–Jumat",  color: "from-amber-500 to-amber-600" },
  { name: "Dr. Lestari Wulandari, Sp.N",  spesialis: "Neurologi",       rs: "RS Siloam ASRI",     pengalaman: 10, rating: 4.7, pasien: 2100, pendidikan: "FK UNAIR", konsultasi: "Selasa–Sabtu", color: "from-indigo-500 to-indigo-600"},
  { name: "Dr. Hendra Wijaya, Sp.OT",     spesialis: "Ortopedi",        rs: "RSPAD Gatot Soebroto",pengalaman:19, rating: 4.9, pasien: 2400, pendidikan: "FK UI",   konsultasi: "Senin–Jumat",  color: "from-green-500 to-green-600" },
  { name: "Dr. Maya Putri, Sp.PD-KGH",   spesialis: "Penyakit Dalam",  rs: "RS Persahabatan",    pengalaman: 11, rating: 4.8, pasien: 1800, pendidikan: "FK UNHAS", konsultasi: "Rabu–Sabtu",   color: "from-cyan-500 to-cyan-600"   },
  { name: "Dr. Firman Santoso, Sp.JP",    spesialis: "Jantung",         rs: "RSCM",              pengalaman: 20, rating: 4.9, pasien: 3600, pendidikan: "FK UI",    konsultasi: "Senin–Jumat",  color: "from-pink-500 to-pink-600"   },
  { name: "Dr. Anita Setiawan, Sp.A",     spesialis: "Anak",            rs: "RS Bunda Jakarta",   pengalaman: 9,  rating: 4.7, pasien: 2200, pendidikan: "FK UGM",   konsultasi: "Selasa–Sabtu", color: "from-orange-500 to-orange-600"},
  { name: "Dr. Fajar Nugroho, Sp.B",      spesialis: "Bedah",           rs: "RS Fatmawati",       pengalaman: 15, rating: 4.8, pasien: 1700, pendidikan: "FK UNPAD", konsultasi: "Senin–Kamis",  color: "from-violet-500 to-violet-600"},
  { name: "Dr. Rina Marlinda, Sp.OG",     spesialis: "Kandungan",       rs: "Mandaya Hospital",   pengalaman: 13, rating: 4.8, pasien: 2900, pendidikan: "FK UI",    konsultasi: "Rabu–Sabtu",   color: "from-fuchsia-500 to-fuchsia-600"},
];

export default function DokterPage() {
  const [search,  setSearch]  = useState("");
  const [filter,  setFilter]  = useState("Semua");

  const filtered = DOCTORS.filter((d) => {
    const q = search.toLowerCase();
    const matchSearch = d.name.toLowerCase().includes(q) ||
                        d.rs.toLowerCase().includes(q)   ||
                        d.spesialis.toLowerCase().includes(q);
    const matchFilter = filter === "Semua" || d.spesialis === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <LandingNavbar />

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-900 via-teal-950 to-teal-900 pt-28 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white/90">Dokter</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Tim{" "}
            <span className="bg-gradient-to-r from-teal-400 to-blue-300 bg-clip-text text-transparent">
              Dokter Spesialis
            </span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Lebih dari {DOCTORS.length} dokter spesialis berpengalaman siap memberikan pelayanan terbaik melalui platform EMRChain.
          </p>
          <div className="flex flex-wrap gap-8 mt-8">
            {[
              { val: `${DOCTORS.length}+`,                                    label: "Dokter Aktif"       },
              { val: `${SPECIALTIES.length - 1}`,                             label: "Spesialisasi"       },
              { val: `${Math.max(...DOCTORS.map((d) => d.pengalaman))}+ Thn`, label: "Pengalaman Tertinggi"},
              { val: "4.8",                                                    label: "Rating Rata-rata"   },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-extrabold text-white">{s.val}</p>
                <p className="text-xs text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filter ── */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari dokter, spesialis, atau RS…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {SPECIALTIES.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === s
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 ml-auto">{filtered.length} dokter</p>
        </div>
      </div>

      {/* ── Doctor Grid ── */}
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((d) => (
              <div
                key={d.name}
                className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden group"
              >
                {/* Avatar header */}
                <div className={`bg-gradient-to-br ${d.color} px-6 py-6 flex flex-col items-center text-center`}>
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <span className="text-2xl font-extrabold text-white">{d.name.split(" ")[1]?.[0] ?? "D"}</span>
                  </div>
                  <h3 className="font-bold text-white text-sm leading-snug">{d.name}</h3>
                  <span className="text-xs text-white/70 mt-1 bg-white/15 px-3 py-0.5 rounded-full">{d.spesialis}</span>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span className="text-xs font-bold text-white">{d.rating}</span>
                  </div>
                </div>

                {/* Body */}
                <div className="px-5 py-4">
                  <p className="text-xs text-slate-500 font-medium mb-4 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400 inline-block" />
                    {d.rs}
                  </p>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {[
                      { icon: <Award className="w-3.5 h-3.5" />,       val: `${d.pengalaman} Thn`, label: "Pengalaman" },
                      { icon: <GraduationCap className="w-3.5 h-3.5" />, val: d.pendidikan,          label: "Alumni" },
                      { icon: <Clock className="w-3.5 h-3.5" />,         val: d.konsultasi,          label: "Praktik" },
                    ].map((s) => (
                      <div key={s.label} className="bg-slate-50 rounded-xl p-2 text-center">
                        <div className="flex justify-center text-slate-400 mb-1">{s.icon}</div>
                        <p className="text-[11px] font-bold text-slate-700 leading-tight">{s.val}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <span className="text-xs text-slate-400">
                      {d.pasien.toLocaleString()}+ pasien
                    </span>
                    <Link
                      href="/login"
                      className={`text-xs font-semibold bg-gradient-to-r ${d.color} text-white px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity`}
                    >
                      Buat Janji
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <p className="font-medium text-lg">Dokter tidak ditemukan.</p>
              <p className="text-sm mt-1">Coba kata kunci yang berbeda.</p>
            </div>
          )}
        </div>
      </main>

      {/* ── CTA ── */}
      <section className="py-16 bg-gradient-to-r from-teal-700 to-blue-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Anda Seorang Dokter?</h2>
          <p className="text-white/80 mb-8">Bergabunglah dengan jaringan EMRChain dan kelola rekam medis pasien dengan lebih efisien dan aman.</p>
          <Link href="/register-dokter" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-teal-700 font-bold rounded-2xl hover:bg-teal-50 transition-colors shadow-lg">
            Daftar Sebagai Dokter <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
