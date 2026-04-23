"use client";

export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import {
  Shield, Activity, FileText, Users, ChevronRight,
  CheckCircle, Lock, Zap, Globe, Building2, Star,
  ArrowRight, HeartPulse, ClipboardList, Pill, UserCheck,
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LandingFooter } from "@/components/layout/LandingFooter";

// ── Data ─────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "12+",  label: "Rumah Sakit Mitra",   icon: <Building2  className="w-5 h-5" />, color: "text-blue-400"  },
  { value: "80+",  label: "Dokter Spesialis",     icon: <UserCheck  className="w-5 h-5" />, color: "text-teal-400"  },
  { value: "5K+",  label: "Pasien Terlayani",     icon: <Users      className="w-5 h-5" />, color: "text-purple-400" },
  { value: "100%", label: "Data Terenkripsi",     icon: <Shield     className="w-5 h-5" />, color: "text-green-400" },
];

const FEATURES = [
  {
    icon: <Shield className="w-6 h-6 text-blue-600" />,
    bg:   "bg-blue-50",
    title: "Keamanan Blockchain",
    desc:  "Setiap rekam medis di-hash dan dicatat di jaringan Ethereum Sepolia, sehingga tidak dapat dimanipulasi oleh siapapun.",
  },
  {
    icon: <Activity className="w-6 h-6 text-teal-600" />,
    bg:   "bg-teal-50",
    title: "Monitoring Real-Time",
    desc:  "Dokter, perawat, dan apoteker dapat memantau status pasien secara langsung dan berkolaborasi dalam satu platform.",
  },
  {
    icon: <Lock className="w-6 h-6 text-purple-600" />,
    bg:   "bg-purple-50",
    title: "Privasi Terlindungi",
    desc:  "Akses data berdasarkan role: hanya tenaga medis yang berwenang yang dapat melihat rekam medis pasien.",
  },
  {
    icon: <Zap className="w-6 h-6 text-amber-600" />,
    bg:   "bg-amber-50",
    title: "Proses Cepat & Efisien",
    desc:  "Dari pendaftaran hingga resep, semua proses medis terdokumentasi digital tanpa kertas dan antrian panjang.",
  },
  {
    icon: <Globe className="w-6 h-6 text-green-600" />,
    bg:   "bg-green-50",
    title: "Akses Lintas Fasilitas",
    desc:  "Rekam medis dapat diakses oleh rumah sakit mana pun dalam jaringan, mempercepat penanganan darurat.",
  },
  {
    icon: <FileText className="w-6 h-6 text-rose-600" />,
    bg:   "bg-rose-50",
    title: "Riwayat Lengkap",
    desc:  "Semua catatan SOAP, diagnosis, resep, dan hasil lab tersimpan permanen dan dapat ditelusuri kapan saja.",
  },
];

const STEPS = [
  { num: "01", icon: <UserCheck className="w-6 h-6" />,    title: "Pendaftaran Pasien",    desc: "Admin rumah sakit mendaftarkan pasien dan menetapkan departemen. Data otomatis tersimpan di blockchain.",    color: "from-blue-600 to-blue-500"   },
  { num: "02", icon: <HeartPulse className="w-6 h-6" />,   title: "Pemeriksaan Perawat",   desc: "Perawat mengisi SOAP note: subjektif, objektif, assessment, dan rencana perawatan awal pasien.",              color: "from-teal-600 to-teal-500"   },
  { num: "03", icon: <ClipboardList className="w-6 h-6" />, title: "Diagnosis Dokter",      desc: "Dokter memeriksa pasien, memberikan diagnosis, memesan pemeriksaan penunjang, dan menyusun rencana terapi.", color: "from-purple-600 to-purple-500"},
  { num: "04", icon: <Pill className="w-6 h-6" />,          title: "Penyerahan Resep",      desc: "Apoteker memverifikasi dan menyiapkan resep. Status diperbarui real-time dan tercatat di blockchain.",       color: "from-green-600 to-green-500" },
];

const HOSPITALS = [
  { name: "RSUP Dr. Cipto Mangunkusumo", kota: "Jakarta Pusat", akreditasi: "Paripurna", beds: 960 },
  { name: "RS Fatmawati",                kota: "Jakarta Selatan", akreditasi: "Paripurna", beds: 750 },
  { name: "RS Bunda Jakarta",            kota: "Jakarta Pusat", akreditasi: "Utama",     beds: 320 },
  { name: "RS Siloam ASRI",              kota: "Jakarta Selatan", akreditasi: "Paripurna", beds: 210 },
  { name: "Mandaya Hospital Puri",       kota: "Tangerang",     akreditasi: "Paripurna", beds: 400 },
  { name: "RS Premier Bintaro",          kota: "Tangerang Selatan", akreditasi: "Utama",  beds: 270 },
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function LandingHomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <LandingNavbar />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-teal-900">
        {/* Background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-teal-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-800/10 rounded-full blur-3xl" />
          {/* Grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-xs font-semibold px-4 py-2 rounded-full mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              Platform EMR Berbasis Blockchain — Sepolia Testnet
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Rekam Medis{" "}
              <span className="bg-gradient-to-r from-blue-400 to-teal-300 bg-clip-text text-transparent">
                Aman & Transparan
              </span>{" "}
              Berbasis Blockchain
            </h1>

            <p className="text-lg text-white/70 leading-relaxed mb-10 max-w-2xl">
              EMRChain adalah platform rekam medis elektronik yang memanfaatkan teknologi blockchain Ethereum untuk menjamin integritas, keamanan, dan aksesibilitas data medis pasien di seluruh Indonesia.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold rounded-2xl shadow-lg shadow-blue-500/30 hover:opacity-90 hover:shadow-xl transition-all"
              >
                Mulai Sekarang <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/tentang-kami"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 backdrop-blur-sm border border-white/30 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all"
              >
                Pelajari Lebih Lanjut <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 mt-12">
              {["Ethereum Blockchain", "HIPAA Compliant", "End-to-End Encrypted"].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-white/60 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/30 backdrop-blur-sm border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {STATS.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <div className={`${s.color}`}>{s.icon}</div>
                  <div>
                    <p className="text-2xl font-extrabold text-white leading-none">{s.value}</p>
                    <p className="text-xs text-white/50 mt-0.5">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Keunggulan Platform</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Mengapa EMRChain?
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              Kami menggabungkan teknologi blockchain terdepan dengan kebutuhan nyata tenaga medis dan pasien Indonesia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="group p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 ${f.bg} rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-base font-bold text-slate-800 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-sm font-semibold text-teal-600 uppercase tracking-wider">Alur Kerja</span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900">
              Bagaimana Cara Kerjanya?
            </h2>
            <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">
              Proses rekam medis dari pendaftaran hingga penyerahan resep, semua tercatat permanen di blockchain.
            </p>
          </div>

          <div className="relative">
            {/* Connector line */}
            <div className="hidden lg:block absolute top-14 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-blue-200 via-teal-200 to-green-200" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map((step, i) => (
                <div key={i} className="relative flex flex-col items-center text-center">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shadow-lg mb-5 relative z-10`}>
                    {step.icon}
                  </div>
                  <span className={`text-xs font-bold bg-gradient-to-r ${step.color} bg-clip-text text-transparent mb-2`}>
                    LANGKAH {step.num}
                  </span>
                  <h3 className="text-base font-bold text-slate-800 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOSPITALS PREVIEW ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Jaringan Kami</span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900">Rumah Sakit Mitra</h2>
              <p className="mt-3 text-slate-500 max-w-xl">
                EMRChain telah terhubung dengan rumah sakit terkemuka di Jabodetabek untuk memberikan layanan terbaik.
              </p>
            </div>
            <Link
              href="/rumah-sakit"
              className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 whitespace-nowrap group"
            >
              Lihat Semua <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {HOSPITALS.map((h) => (
              <div
                key={h.name}
                className="flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-100 transition-all group"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-800 leading-snug">{h.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{h.kota}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] font-semibold bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full">
                      {h.akreditasi}
                    </span>
                    <span className="text-[10px] text-slate-400">{h.beds} tempat tidur</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 bg-gradient-to-br from-blue-700 via-blue-600 to-teal-600 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-teal-300/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            Siap Transformasi Sistem Rekam Medis Anda?
          </h2>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">
            Bergabunglah dengan ribuan tenaga medis yang telah mempercayakan rekam medis pasien kepada EMRChain.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-3.5 bg-white text-blue-700 font-bold rounded-2xl shadow-lg hover:shadow-xl hover:bg-blue-50 transition-all"
            >
              Daftar Sekarang — Gratis
            </Link>
            <Link
              href="/kontak-kami"
              className="px-8 py-3.5 bg-white/15 border border-white/30 text-white font-semibold rounded-2xl hover:bg-white/25 transition-all"
            >
              Hubungi Kami
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS / TRUST ── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-amber-600 uppercase tracking-wider">Dipercaya Oleh</span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900">Apa Kata Mereka?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name:  "Dr. Ahmad Fauzi, Sp.PD",
                role:  "Dokter Spesialis Penyakit Dalam — RSCM",
                quote: "EMRChain mengubah cara saya mengakses riwayat pasien. Tidak perlu lagi mencari tumpukan kertas — semua ada dalam genggaman, real-time, dan aman.",
                stars: 5,
              },
              {
                name:  "Ns. Sari Dewi, S.Kep",
                role:  "Perawat — RS Fatmawati",
                quote: "Pengisian SOAP note kini jauh lebih efisien. Data langsung tersinkron ke dokter tanpa jeda waktu, dan saya bisa pastikan tidak ada informasi yang terlewat.",
                stars: 5,
              },
              {
                name:  "Budi Santoso",
                role:  "Pasien",
                quote: "Saya merasa lebih tenang mengetahui rekam medis saya tersimpan di blockchain dan tidak bisa dimanipulasi. Transparansi seperti ini yang saya harapkan dari RS modern.",
                stars: 5,
              },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
