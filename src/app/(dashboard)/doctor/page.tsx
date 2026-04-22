"use client";

export const dynamic = "force-dynamic";

/**
 * Doctor Dashboard — Lists assigned patients ready for examination.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Stethoscope, ChevronRight, ClipboardList, CheckCircle2, Clock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { StatCard, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { getAllPatients } from "@/lib/emr";
import { useAuth } from "@/hooks/useAuth";
import type { Patient } from "@/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function DoctorDashboard() {
  const { profile }         = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getAllPatients().then((all) => {
      setPatients(all.filter((p) => p.status === "assigned" || p.status === "in_examination"));
      setLoading(false);
    });
  }, []);

  const toExamine  = patients.filter((p) => p.status === "assigned").length;
  const examining  = patients.filter((p) => p.status === "in_examination").length;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title={`Dr. ${profile?.name ?? "Dokter"}`} subtitle="Dashboard Pemeriksaan" />
      <div className="p-6 space-y-6">

        <div className="dashboard-grid">
          <StatCard title="Antrian Pemeriksaan" value={toExamine}
            icon={<Clock className="w-6 h-6" />} color="amber" />
          <StatCard title="Sedang Diperiksa" value={examining}
            icon={<Stethoscope className="w-6 h-6" />} color="teal" />
        </div>

        <Card>
          <h3 className="font-bold text-slate-800 mb-4">Daftar Pasien — Perlu Pemeriksaan</h3>
          {loading ? <Spinner center /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["EMR ID", "Nama", "Poli", "Status", "Masuk", "Aksi"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {patients.map((p) => (
                    <tr key={p.emrId} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg">{p.emrId}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{p.firstName} {p.lastName}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{p.department}</td>
                      <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {format(new Date(p.createdAt), "dd MMM yyyy", { locale: localeId })}
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/doctor/emr/${p.emrId}`}>
                          <Button size="sm" icon={<Stethoscope className="w-4 h-4" />}>Periksa</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {patients.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada pasien dalam antrian pemeriksaan.
                    </td></tr>
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
