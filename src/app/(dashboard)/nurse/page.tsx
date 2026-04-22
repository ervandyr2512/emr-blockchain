"use client";

export const dynamic = "force-dynamic";

/**
 * Nurse Dashboard — Lists assigned patients waiting for SOAP input.
 */

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ChevronRight, ClipboardList } from "lucide-react";
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

export default function NurseDashboard() {
  const { profile }         = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getAllPatients().then((p) => {
      // Nurse sees patients that are assigned but haven't been examined yet
      setPatients(p.filter((pt) => pt.status === "assigned" || pt.status === "in_examination"));
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title={`Halo, ${profile?.name ?? "Perawat"} 👩‍⚕️`} subtitle="Dashboard Perawat — Input SOAP Pasien" />
      <div className="p-6 space-y-6">

        <div className="dashboard-grid">
          <StatCard title="Pasien Menunggu SOAP" value={patients.filter(p => p.status === "assigned").length}
            icon={<ClipboardList className="w-6 h-6" />} color="amber" />
          <StatCard title="Sedang Diperiksa" value={patients.filter(p => p.status === "in_examination").length}
            icon={<Activity className="w-6 h-6" />} color="teal" />
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Daftar Pasien Aktif</h3>
          </div>
          {loading ? <Spinner center /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["EMR ID", "Nama", "Poli", "Status", "Terdaftar", "Aksi"].map(h => (
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
                        <Link href={`/nurse/soap/${p.emrId}`}>
                          <Button size="sm" icon={<ClipboardList className="w-4 h-4" />}>Input SOAP</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {patients.length === 0 && (
                    <tr><td colSpan={6} className="py-10 text-center text-slate-400">Tidak ada pasien aktif saat ini.</td></tr>
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
