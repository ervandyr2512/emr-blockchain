"use client";

export const dynamic = "force-dynamic";

/**
 * Admin Dashboard — System overview, stats, and quick actions.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Users, Activity, ClipboardList, ChevronRight, Plus, ShieldCheck } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { StatCard, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { getAllPatients } from "@/lib/emr";
import { useAuth } from "@/hooks/useAuth";
import type { Patient } from "@/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function AdminDashboard() {
  const { profile }       = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getAllPatients()
      .then((p) => setPatients(p))
      .catch((err) => console.error("[AdminDashboard]", err))
      .finally(() => setLoading(false));
  }, []);

  const total      = patients.length;
  const waiting    = patients.filter((p) => p.status === "registered" || p.status === "waiting").length;
  const assigned   = patients.filter((p) => p.status === "assigned").length;
  const examining  = patients.filter((p) => p.status === "in_examination").length;
  const recent     = [...patients]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title={`Selamat Datang, ${profile?.name ?? "Admin"} 👋`}
        subtitle="Panel Administrasi Rumah Sakit"
      />
      <div className="p-6 space-y-6">

        {/* Stats */}
        <div className="dashboard-grid">
          <StatCard
            title="Total Pasien Terdaftar"
            value={total}
            icon={<Users className="w-6 h-6" />}
            color="blue"
            subtitle="Semua pasien di sistem"
          />
          <StatCard
            title="Menunggu Penugasan"
            value={waiting}
            icon={<ClipboardList className="w-6 h-6" />}
            color="amber"
            subtitle="Perlu diarahkan ke poli"
          />
          <StatCard
            title="Sudah Ditugaskan"
            value={assigned}
            icon={<ShieldCheck className="w-6 h-6" />}
            color="green"
            subtitle="Pasien di poli aktif"
          />
          <StatCard
            title="Sedang Diperiksa"
            value={examining}
            icon={<Activity className="w-6 h-6" />}
            color="teal"
            subtitle="Dalam pemeriksaan perawat/dokter"
          />
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 flex-wrap">
          <Link href="/admin/patients">
            <Button icon={<Users className="w-4 h-4" />}>Kelola Pasien</Button>
          </Link>
          <Link href="/admin/staff">
            <Button variant="outline" icon={<ShieldCheck className="w-4 h-4" />}>Manajemen Staff</Button>
          </Link>
        </div>

        {/* Recent patients */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Pasien Terbaru</h3>
            <Link href="/admin/patients" className="text-sm text-primary-600 hover:underline flex items-center gap-1">
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <Spinner center />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2.5 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">EMR ID</th>
                    <th className="text-left py-2.5 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">Nama</th>
                    <th className="text-left py-2.5 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">Poli</th>
                    <th className="text-left py-2.5 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">Status</th>
                    <th className="text-left py-2.5 px-3 text-slate-500 font-semibold text-xs uppercase tracking-wide">Tanggal Daftar</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {recent.map((p) => (
                    <tr key={p.emrId} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg">{p.emrId}</span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">{p.firstName} {p.lastName}</td>
                      <td className="py-3 px-3 text-slate-500">{p.department ?? <span className="text-slate-300 italic">Belum</span>}</td>
                      <td className="py-3 px-3"><StatusBadge status={p.status} /></td>
                      <td className="py-3 px-3 text-slate-400 text-xs">
                        {format(new Date(p.createdAt), "dd MMM yyyy", { locale: localeId })}
                      </td>
                      <td className="py-3 px-3">
                        <Link href={`/admin/patients/${p.emrId}`}>
                          <Button size="sm" variant="ghost" icon={<ChevronRight className="w-4 h-4" />}>Detail</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {recent.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-slate-400">Belum ada pasien terdaftar.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
}
