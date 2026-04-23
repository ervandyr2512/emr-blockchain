"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import { Building2, MapPin, Star, Users, Phone, Globe, Search, ChevronRight } from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LandingFooter } from "@/components/layout/LandingFooter";
import Link from "next/link";

const HOSPITALS = [
  {
    name:        "RSUP Dr. Cipto Mangunkusumo",
    alias:       "RSCM",
    kota:        "Jakarta Pusat",
    alamat:      "Jl. Diponegoro No. 71, Kenari, Senen",
    akreditasi:  "Paripurna",
    type:        "RS Pemerintah",
    beds:        960,
    doctors:     320,
    phone:       "(021) 500-135",
    website:     "rscm.co.id",
    spesialis:   ["Penyakit Dalam", "Jantung", "Neurologi", "Onkologi", "Bedah"],
    rating:      4.8,
    color:       "from-blue-600 to-blue-500",
  },
  {
    name:        "RS Fatmawati",
    alias:       "Fatmawati",
    kota:        "Jakarta Selatan",
    alamat:      "Jl. RS Fatmawati Raya No. 4, Cilandak",
    akreditasi:  "Paripurna",
    type:        "RS Pemerintah",
    beds:        750,
    doctors:     210,
    phone:       "(021) 766-0552",
    website:     "rsfatmawati.co.id",
    spesialis:   ["Ortopedi", "Penyakit Dalam", "Bedah Saraf", "Anak", "Kandungan"],
    rating:      4.7,
    color:       "from-teal-600 to-teal-500",
  },
  {
    name:        "RS Bunda Jakarta",
    alias:       "Bunda",
    kota:        "Jakarta Pusat",
    alamat:      "Jl. Teuku Cik Ditiro No. 28, Menteng",
    akreditasi:  "Paripurna",
    type:        "RS Swasta",
    beds:        320,
    doctors:     85,
    phone:       "(021) 314-6030",
    website:     "bundajakarta.com",
    spesialis:   ["Kandungan", "Anak", "Jantung", "Penyakit Dalam", "Urologi"],
    rating:      4.9,
    color:       "from-purple-600 to-purple-500",
  },
  {
    name:        "RS Siloam ASRI",
    alias:       "Siloam ASRI",
    kota:        "Jakarta Selatan",
    alamat:      "Jl. Duren Tiga Raya No. 20, Pancoran",
    akreditasi:  "Paripurna",
    type:        "RS Swasta",
    beds:        210,
    doctors:     90,
    phone:       "(021) 797-5700",
    website:     "siloamhospitals.com",
    spesialis:   ["Onkologi", "Bedah", "Penyakit Dalam", "Radiologi", "Neurologi"],
    rating:      4.8,
    color:       "from-amber-600 to-amber-500",
  },
  {
    name:        "Mandaya Hospital Puri",
    alias:       "Mandaya",
    kota:        "Tangerang",
    alamat:      "Jl. Lingkar Luar Barat, Puri Indah, Kembangan",
    akreditasi:  "Paripurna",
    type:        "RS Swasta",
    beds:        400,
    doctors:     130,
    phone:       "(021) 2569-5000",
    website:     "mandayahospital.com",
    spesialis:   ["Jantung", "Bedah Vaskular", "Penyakit Dalam", "Neurologi", "Urologi"],
    rating:      4.9,
    color:       "from-rose-600 to-rose-500",
  },
  {
    name:        "RS Premier Bintaro",
    alias:       "Premier Bintaro",
    kota:        "Tangerang Selatan",
    alamat:      "Jl. MH Thamrin No. 1, Bintaro Sektor 7",
    akreditasi:  "Utama",
    type:        "RS Swasta",
    beds:        270,
    doctors:     110,
    phone:       "(021) 7456-0700",
    website:     "premierhhealthcare.com",
    spesialis:   ["Bedah Plastik", "Kandungan", "Anak", "Penyakit Dalam", "Jantung"],
    rating:      4.7,
    color:       "from-green-600 to-green-500",
  },
  {
    name:        "RSPAD Gatot Soebroto",
    alias:       "RSPAD",
    kota:        "Jakarta Pusat",
    alamat:      "Jl. Abdul Rahman Saleh No. 24, Senen",
    akreditasi:  "Paripurna",
    type:        "RS Militer",
    beds:        820,
    doctors:     280,
    phone:       "(021) 344-5073",
    website:     "rspad.mil.id",
    spesialis:   ["Bedah", "Penyakit Dalam", "Neurologi", "Ortopedi", "Mata"],
    rating:      4.6,
    color:       "from-indigo-600 to-indigo-500",
  },
  {
    name:        "RS Persahabatan",
    alias:       "Persahabatan",
    kota:        "Jakarta Timur",
    alamat:      "Jl. Persahabatan Raya No. 1, Rawamangun",
    akreditasi:  "Paripurna",
    type:        "RS Pemerintah",
    beds:        640,
    doctors:     190,
    phone:       "(021) 489-2002",
    website:     "rsuppersahabatan.co.id",
    spesialis:   ["Paru", "Penyakit Dalam", "Jantung", "THT", "Rehabilitasi Medik"],
    rating:      4.7,
    color:       "from-cyan-600 to-cyan-500",
  },
];

export default function RumahSakitPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("Semua");

  const FILTERS = ["Semua", "RS Pemerintah", "RS Swasta", "RS Militer"];

  const filtered = HOSPITALS.filter((h) => {
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
                        h.kota.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "Semua" || h.type === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <LandingNavbar />

      {/* ── Page Hero ── */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-blue-900 pt-28 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white/90">Rumah Sakit</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Jaringan{" "}
            <span className="bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent">
              Rumah Sakit Mitra
            </span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            EMRChain terhubung dengan {HOSPITALS.length} rumah sakit terkemuka di Jabodetabek. Semua data rekam medis terintegrasi dan aman di blockchain.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-8 mt-8">
            {[
              { val: `${HOSPITALS.length}`,                     label: "RS Mitra" },
              { val: `${HOSPITALS.reduce((s, h) => s + h.beds, 0).toLocaleString()}+`, label: "Total Tempat Tidur" },
              { val: `${HOSPITALS.reduce((s, h) => s + h.doctors, 0)}+`,               label: "Dokter Aktif" },
              { val: "4 Kota",                                   label: "Area Layanan" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-extrabold text-white">{s.val}</p>
                <p className="text-xs text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Filter + Search ── */}
      <div className="sticky top-16 z-30 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari rumah sakit atau kota…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-400 ml-auto">{filtered.length} rumah sakit</p>
        </div>
      </div>

      {/* ── Hospital Grid ── */}
      <main className="flex-1 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filtered.map((h) => (
              <div
                key={h.name}
                className="bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group"
              >
                {/* Card header */}
                <div className={`bg-gradient-to-r ${h.color} px-6 py-5 flex items-start gap-4`}>
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-white text-base leading-snug">{h.name}</h2>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-xs text-white/70 bg-white/15 px-2 py-0.5 rounded-full">{h.type}</span>
                      <span className="text-xs text-white/70 bg-white/15 px-2 py-0.5 rounded-full">Akreditasi {h.akreditasi}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 bg-white/20 rounded-lg px-2 py-1 flex-shrink-0">
                    <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                    <span className="text-xs font-bold text-white">{h.rating}</span>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-6 py-5">
                  <div className="flex items-start gap-2 text-sm text-slate-500 mb-4">
                    <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{h.alamat}, {h.kota}</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-lg font-bold text-slate-800">{h.beds}</p>
                      <p className="text-xs text-slate-400">Tempat Tidur</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-lg font-bold text-slate-800">{h.doctors}</p>
                      <p className="text-xs text-slate-400">Dokter Aktif</p>
                    </div>
                  </div>

                  {/* Specialists */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {h.spesialis.map((s) => (
                      <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Contact */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Phone className="w-3.5 h-3.5" /> {h.phone}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Globe className="w-3.5 h-3.5" /> {h.website}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-400">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Rumah sakit tidak ditemukan.</p>
              <p className="text-sm mt-1">Coba kata kunci yang berbeda.</p>
            </div>
          )}
        </div>
      </main>

      {/* ── CTA ── */}
      <section className="py-16 bg-gradient-to-r from-blue-700 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">Ingin Mendaftarkan Rumah Sakit Anda?</h2>
          <p className="text-white/80 mb-8">Hubungi tim kami untuk mengintegrasikan fasilitas kesehatan Anda ke jaringan EMRChain.</p>
          <Link href="/kontak-kami" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-blue-700 font-bold rounded-2xl hover:bg-blue-50 transition-colors shadow-lg">
            Hubungi Kami <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
