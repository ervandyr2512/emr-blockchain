import React from "react";
import Link from "next/link";
import { Building2, Mail, Phone, MapPin, Github, Twitter, Linkedin } from "lucide-react";

const LINKS = {
  platform: [
    { href: "/",             label: "Home" },
    { href: "/rumah-sakit",  label: "Rumah Sakit" },
    { href: "/dokter",       label: "Dokter" },
    { href: "/tentang-kami", label: "Tentang Kami" },
    { href: "/kontak-kami",  label: "Kontak Kami" },
  ],
  akun: [
    { href: "/login",    label: "Masuk" },
    { href: "/register", label: "Daftar Akun" },
  ],
};

export function LandingFooter() {
  return (
    <footer className="bg-slate-900 text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-teal-400 rounded-xl flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg leading-none">EMR<span className="text-blue-400">Chain</span></p>
                <p className="text-[10px] text-slate-400 leading-none mt-0.5">Rekam Medis Blockchain</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Platform rekam medis elektronik berbasis teknologi blockchain untuk memastikan integritas, keamanan, dan transparansi data medis di Indonesia.
            </p>
            <div className="flex gap-3">
              {[
                { icon: <Github className="w-4 h-4" />, href: "#" },
                { icon: <Twitter className="w-4 h-4" />, href: "#" },
                { icon: <Linkedin className="w-4 h-4" />, href: "#" },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-blue-600 flex items-center justify-center transition-colors"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-300 mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {LINKS.platform.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Akun */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-300 mb-4">Akun</h4>
            <ul className="space-y-2.5">
              {LINKS.akun.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-slate-300 mb-4">Kontak</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-slate-400">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-400" />
                Jl. Sudirman No. 1, Jakarta Pusat, DKI Jakarta 10220
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-400">
                <Mail className="w-4 h-4 flex-shrink-0 text-blue-400" />
                info@emrchain.id
              </li>
              <li className="flex items-center gap-2.5 text-sm text-slate-400">
                <Phone className="w-4 h-4 flex-shrink-0 text-blue-400" />
                +62 21 1234 5678
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} EMRChain. Semua hak cipta dilindungi.
          </p>
          <p className="text-xs text-slate-500">
            Dibangun dengan ❤️ di Indonesia · Powered by Ethereum Blockchain
          </p>
        </div>
      </div>
    </footer>
  );
}
