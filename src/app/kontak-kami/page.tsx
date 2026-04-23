"use client";

export const dynamic = "force-dynamic";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, Phone, MapPin, Clock, Send, CheckCircle, ChevronRight, MessageSquare, Building2, Users } from "lucide-react";
import { LandingNavbar } from "@/components/layout/LandingNavbar";
import { LandingFooter } from "@/components/layout/LandingFooter";

const CONTACT_INFO = [
  {
    icon:    <MapPin className="w-5 h-5" />,
    title:   "Alamat Kantor",
    lines:   ["Jl. Sudirman No. 1, Lantai 12", "Jakarta Pusat, DKI Jakarta 10220"],
    color:   "bg-blue-50 text-blue-600",
  },
  {
    icon:    <Mail className="w-5 h-5" />,
    title:   "Email",
    lines:   ["info@emrchain.id", "support@emrchain.id"],
    color:   "bg-teal-50 text-teal-600",
  },
  {
    icon:    <Phone className="w-5 h-5" />,
    title:   "Telepon",
    lines:   ["+62 21 1234 5678", "+62 812 3456 7890 (WhatsApp)"],
    color:   "bg-green-50 text-green-600",
  },
  {
    icon:    <Clock className="w-5 h-5" />,
    title:   "Jam Operasional",
    lines:   ["Senin–Jumat: 08.00–17.00 WIB", "Sabtu: 09.00–13.00 WIB"],
    color:   "bg-amber-50 text-amber-600",
  },
];

const FAQS = [
  {
    q: "Apakah EMRChain cocok untuk klinik kecil?",
    a: "Ya! EMRChain dirancang modular sehingga dapat digunakan oleh klinik pratama hingga rumah sakit besar. Paket harga disesuaikan dengan skala fasilitas.",
  },
  {
    q: "Bagaimana keamanan data pasien dijamin?",
    a: "Setiap rekam medis di-hash menggunakan SHA-256 dan dicatat di blockchain Ethereum. Data tidak dapat diubah tanpa meninggalkan jejak yang terdeteksi.",
  },
  {
    q: "Apakah ada masa percobaan gratis?",
    a: "Kami menawarkan uji coba 30 hari gratis untuk hingga 100 rekam medis. Tidak perlu kartu kredit untuk memulai.",
  },
  {
    q: "Berapa lama proses integrasi dengan sistem RS yang sudah ada?",
    a: "Proses integrasi rata-rata 2–4 minggu, termasuk pelatihan staf. Tim teknis kami mendampingi selama proses migrasi data.",
  },
  {
    q: "Apakah EMRChain sudah mendapatkan sertifikasi?",
    a: "Kami dalam proses sertifikasi ISO 27001 dan sedang berkoordinasi dengan Kemenkes RI untuk mendapatkan pengakuan resmi sebagai platform EMR nasional.",
  },
];

export default function KontakKamiPage() {
  const [form, setForm]   = useState({ nama: "", email: "", institusi: "", topik: "Informasi Umum", pesan: "" });
  const [sent, setSent]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200)); // Simulate submit
    setLoading(false);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <LandingNavbar />

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-green-900 pt-28 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 text-white/50 text-sm mb-6">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white/90">Kontak Kami</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-4">
            Hubungi{" "}
            <span className="bg-gradient-to-r from-green-400 to-teal-300 bg-clip-text text-transparent">
              Tim Kami
            </span>
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto">
            Ada pertanyaan, ingin berkolaborasi, atau perlu demo? Tim kami siap membantu Anda.
          </p>
        </div>
      </section>

      {/* ── Contact Cards ── */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {CONTACT_INFO.map((c) => (
              <div key={c.title} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl ${c.color} flex items-center justify-center mb-4`}>
                  {c.icon}
                </div>
                <h3 className="font-bold text-slate-800 text-sm mb-2">{c.title}</h3>
                {c.lines.map((l) => (
                  <p key={l} className="text-xs text-slate-500 leading-relaxed">{l}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Form + Map area ── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Form */}
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Kirim Pesan</h2>
              <p className="text-slate-500 text-sm mb-8">Isi formulir di bawah dan tim kami akan merespons dalam 1×24 jam kerja.</p>

              {sent ? (
                <div className="flex flex-col items-center justify-center py-16 bg-green-50 rounded-2xl border border-green-100 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-lg font-bold text-green-800 mb-2">Pesan Terkirim!</h3>
                  <p className="text-sm text-green-700 max-w-xs">
                    Terima kasih, <strong>{form.nama}</strong>. Kami akan menghubungi Anda di <strong>{form.email}</strong> dalam waktu 1×24 jam.
                  </p>
                  <button
                    onClick={() => { setSent(false); setForm({ nama: "", email: "", institusi: "", topik: "Informasi Umum", pesan: "" }); }}
                    className="mt-6 text-sm text-green-700 underline hover:no-underline"
                  >
                    Kirim pesan lain
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Lengkap *</label>
                      <input
                        required
                        type="text"
                        placeholder="Dr. Ahmad Fauzi"
                        value={form.nama}
                        onChange={(e) => setForm({ ...form, nama: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email *</label>
                      <input
                        required
                        type="email"
                        placeholder="ahmad@rscm.co.id"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Institusi / Rumah Sakit</label>
                    <input
                      type="text"
                      placeholder="RSUP Dr. Cipto Mangunkusumo"
                      value={form.institusi}
                      onChange={(e) => setForm({ ...form, institusi: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Topik Pesan *</label>
                    <select
                      value={form.topik}
                      onChange={(e) => setForm({ ...form, topik: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      {["Informasi Umum", "Demo Platform", "Kemitraan RS", "Pendaftaran Dokter", "Dukungan Teknis", "Lainnya"].map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pesan *</label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Tuliskan pesan Anda di sini…"
                      value={form.pesan}
                      onChange={(e) => setForm({ ...form, pesan: e.target.value })}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-teal-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-60 shadow-md"
                  >
                    {loading ? (
                      <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Mengirim…</>
                    ) : (
                      <><Send className="w-4 h-4" /> Kirim Pesan</>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Right side: Quick links + social proof */}
            <div className="flex flex-col gap-6">
              {/* Quick contacts */}
              <div className="bg-gradient-to-br from-blue-600 to-teal-500 rounded-2xl p-6 text-white">
                <h3 className="font-bold text-lg mb-4">Hubungi Langsung</h3>
                <div className="space-y-4">
                  {[
                    { icon: <MessageSquare className="w-4 h-4" />, label: "Live Chat",   sub: "Tersedia Senin–Jumat 08.00–17.00", cta: "Mulai Chat" },
                    { icon: <Building2    className="w-4 h-4" />, label: "Demo RS",     sub: "Jadwalkan demo untuk tim Anda",     cta: "Buat Janji" },
                    { icon: <Users        className="w-4 h-4" />, label: "Partnership", sub: "Untuk kerjasama institusional",     cta: "Diskusi" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3 pb-4 border-b border-white/20 last:border-0 last:pb-0">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{item.label}</p>
                        <p className="text-xs text-white/70">{item.sub}</p>
                      </div>
                      <button className="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg transition-colors font-medium whitespace-nowrap">
                        {item.cta}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map placeholder */}
              <div className="bg-slate-100 rounded-2xl overflow-hidden flex-1 min-h-[200px] flex items-center justify-center relative">
                <iframe
                  title="Lokasi EMRChain"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.4!2d106.8272!3d-6.2088!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f3e945e34b9d%3A0x5371bf0fdad786a2!2sJl.%20Jend.%20Sudirman%2C%20Jakarta!5e0!3m2!1sid!2sid!4v1620000000000!5m2!1sid!2sid"
                  className="w-full h-full min-h-[220px] border-0 rounded-2xl"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">FAQ</span>
            <h2 className="mt-3 text-2xl font-extrabold text-slate-900">Pertanyaan yang Sering Diajukan</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-slate-800 pr-4">{f.q}</span>
                  <div className={`w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 transition-transform ${openFaq === i ? "rotate-45" : ""}`}>
                    <span className="text-blue-600 text-lg font-bold leading-none">+</span>
                  </div>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-slate-500 leading-relaxed">{f.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}
