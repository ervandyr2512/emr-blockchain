"use client";

export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import {
  Shield, Target, Heart, ChevronRight, CheckCircle,
  Code2, Database, Lock, Cpu, Users, Building2, ArrowRight,
} from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LandingFooter } from "@/components/layout/LandingFooter";

const TEAM = [
  { name: "dr. Ervandy Rangganata, SpU", role: "Founder & CEO",           bg: "from-blue-500 to-blue-600"   },
  { name: "Aditya Pratama, M.Kom",     role: "Chief Technology Officer", bg: "from-teal-500 to-teal-600"   },
  { name: "Dr. Ninda Rahayu, Sp.PD",   role: "Chief Medical Officer",    bg: "from-purple-500 to-purple-600"},
  { name: "Reza Firmansyah, S.Kom",    role: "Blockchain Engineer",      bg: "from-amber-500 to-amber-600" },
  { name: "Santi Dewi, M.Kes",         role: "Head of Clinical Ops",     bg: "from-rose-500 to-rose-600"   },
  { name: "Rizky Maulana, S.T",        role: "Frontend Engineer",        bg: "from-green-500 to-green-600" },
];

const MILESTONES = [
  { year: "2022", event: "Riset awal dan ideasi platform EMR berbasis blockchain di Indonesia." },
  { year: "2023", event: "Pengembangan prototipe smart contract di Ethereum Sepolia testnet." },
  { year: "2024", event: "Peluncuran beta dengan 3 rumah sakit mitra pertama di Jakarta." },
  { year: "2025", event: "Ekspansi ke 12 rumah sakit dan 80+ dokter. Lebih dari 5.000 rekam medis tercatat." },
  { year: "2026", event: "Integrasi AI untuk deteksi anomali data medis dan prediksi risiko pasien." },
];

const TECH_STACK = [
  { icon: <Code2 className="w-5 h-5" />,     name: "Next.js 15",           desc: "Frontend framework React terbaru dengan App Router", color: "bg-slate-100 text-slate-700" },
  { icon: <Database className="w-5 h-5" />,  name: "Firebase RTDB",        desc: "Real-time database untuk sinkronisasi data medis",    color: "bg-amber-50 text-amber-700"  },
  { icon: <Lock className="w-5 h-5" />,      name: "Ethereum Blockchain",  desc: "Smart contract Solidity di Sepolia testnet",           color: "bg-blue-50 text-blue-700"    },
  { icon: <Cpu className="w-5 h-5" />,       name: "Hardhat & Ethers.js",  desc: "Tools pengembangan dan interaksi smart contract",      color: "bg-purple-50 text-purple-700"},
  { icon: <Shield className="w-5 h-5" />,    name: "Firebase Auth",        desc: "Autentikasi multi-role berbasis email dan password",   color: "bg-green-50 text-green-700"  },
  { icon: <Code2 className="w-5 h-5" />,     name: "TypeScript",           desc: "Type-safe development untuk keandalan kode",           color: "bg-indigo-50 text-indigo-700"},
];

export default function TentangKamiPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <LandingNavbar />

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-900 via-purple-950 to-blue-900 pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-white/50 text-sm mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white/90">Tentang Kami</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6">
            Tentang{" "}
            <span className="bg-gradient-to-r from-purple-400 to-blue-300 bg-clip-text text-transparent">
              EMRChain
            </span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Kami membangun masa depan layanan kesehatan Indonesia melalui teknologi blockchain yang transparan, aman, dan dapat dipercaya.
          </p>
        </div>
      </section>

      {/* ── Mission & Vision ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Siapa Kami</span>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-900 mb-6">
                Inovasi Teknologi untuk Kesehatan Indonesia
              </h2>
              <p className="text-slate-600 leading-relaxed mb-5">
                EMRChain adalah platform rekam medis elektronik (EMR) berbasis blockchain pertama di Indonesia yang dirancang untuk mengatasi tantangan keamanan, integritas, dan aksesibilitas data medis di fasilitas kesehatan.
              </p>
              <p className="text-slate-600 leading-relaxed mb-8">
                Dengan memanfaatkan teknologi smart contract Ethereum, setiap rekam medis yang dibuat, dimodifikasi, atau diakses akan meninggalkan jejak digital yang tidak dapat dimanipulasi — memberikan kepercayaan penuh kepada pasien dan tenaga medis.
              </p>
              <div className="space-y-3">
                {[
                  "Integritas data medis dijamin oleh blockchain",
                  "Akses multi-role yang aman dan terverifikasi",
                  "Kompatibel dengan standar interoperabilitas HL7 FHIR",
                  "Audit trail lengkap untuk setiap perubahan data",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2.5">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {[
                {
                  icon:  <Target className="w-6 h-6 text-blue-600" />,
                  bg:    "bg-blue-50",
                  title: "Misi Kami",
                  desc:  "Mewujudkan sistem rekam medis yang aman, transparan, dan dapat diakses oleh seluruh fasilitas kesehatan di Indonesia melalui teknologi blockchain.",
                },
                {
                  icon:  <Heart className="w-6 h-6 text-rose-600" />,
                  bg:    "bg-rose-50",
                  title: "Visi Kami",
                  desc:  "Menjadi infrastruktur digital kesehatan Indonesia yang terpercaya, di mana setiap pasien memiliki kendali penuh atas data medis mereka.",
                },
                {
                  icon:  <Shield className="w-6 h-6 text-green-600" />,
                  bg:    "bg-green-50",
                  title: "Nilai Kami",
                  desc:  "Transparansi, keamanan, inovasi, dan komitmen terhadap privasi pasien adalah fondasi dari setiap keputusan yang kami buat.",
                },
              ].map((v) => (
                <div key={v.title} className="flex items-start gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm">
                  <div className={`w-11 h-11 ${v.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    {v.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 mb-1">{v.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Milestones ── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Perjalanan Kami</span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900">Tonggak Pencapaian</h2>
          </div>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 sm:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-teal-200 to-green-200 -translate-x-0.5" />

            <div className="space-y-8">
              {MILESTONES.map((m, i) => (
                <div
                  key={m.year}
                  className={`relative flex items-start gap-6 sm:gap-8 ${
                    i % 2 === 0 ? "sm:flex-row" : "sm:flex-row-reverse"
                  }`}
                >
                  {/* Dot */}
                  <div className={`absolute left-4 sm:left-1/2 w-4 h-4 rounded-full bg-blue-600 border-4 border-blue-100 -translate-x-1.5 sm:-translate-x-2 mt-1 z-10`} />

                  {/* Content */}
                  <div className={`ml-12 sm:ml-0 sm:w-[calc(50%-2rem)] ${i % 2 === 0 ? "sm:text-right sm:pr-2" : "sm:pl-2"}`}>
                    <span className="text-sm font-extrabold text-blue-600">{m.year}</span>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{m.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Tech Stack ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-teal-600 uppercase tracking-wider">Teknologi</span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900">Dibangun dengan Teknologi Terkini</h2>
            <p className="mt-4 text-slate-500 max-w-xl mx-auto">
              Kami memilih stack teknologi yang andal, scalable, dan aman untuk membangun infrastruktur kesehatan digital.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {TECH_STACK.map((t) => (
              <div key={t.name} className="flex items-start gap-4 p-5 border border-slate-100 rounded-2xl hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl ${t.color} flex items-center justify-center flex-shrink-0`}>
                  {t.icon}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-800">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Team ── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-purple-600 uppercase tracking-wider">Tim Kami</span>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-900">Orang-orang di Balik EMRChain</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {TEAM.map((member) => (
              <div key={member.name} className="flex flex-col items-center text-center group">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${member.bg} flex items-center justify-center text-white font-extrabold text-xl mb-3 group-hover:scale-105 transition-transform shadow-md`}>
                  {member.name[0]}
                </div>
                <p className="text-sm font-bold text-slate-800 leading-snug">{member.name.split(",")[0]}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-snug">{member.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 bg-gradient-to-r from-slate-900 to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { icon: <Building2 className="w-6 h-6" />, val: "12+",   label: "RS Mitra"          },
              { icon: <Users     className="w-6 h-6" />, val: "80+",   label: "Dokter Aktif"      },
              { icon: <Shield    className="w-6 h-6" />, val: "5K+",   label: "Rekam Medis"       },
              { icon: <CheckCircle className="w-6 h-6" />, val: "99.9%", label: "Uptime Platform" },
            ].map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-blue-300">
                  {s.icon}
                </div>
                <p className="text-3xl font-extrabold text-white">{s.val}</p>
                <p className="text-sm text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-16 bg-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">
            Siap Bergabung dengan EMRChain?
          </h2>
          <p className="text-slate-500 mb-8">
            Mulai perjalanan transformasi digital kesehatan Anda bersama kami.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register" className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-2xl shadow-lg hover:opacity-90 transition-all">
              Mulai Sekarang <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/kontak-kami" className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-blue-200 text-blue-700 font-semibold rounded-2xl hover:bg-blue-50 transition-all">
              Hubungi Kami
            </Link>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
