"use client";

export const dynamic = "force-dynamic";

/**
 * Nurse — Patient List (all active patients, SOAP action)
 */

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Activity, Search, ClipboardList, CheckCircle2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { getAllPatients } from "@/lib/emr";
import type { Patient } from "@/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function NursePatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");

  useEffect(() => {
    getAllPatients()
      .then((p) => setPatients(p.filter((pt) =>
        pt.status === "assigned" || pt.status === "in_examination" || pt.status === "completed"
      )))
      .catch((err) => console.error("[NursePatients]", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return patients;
    const q = search.toLowerCase();
    return patients.filter((p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.emrId.toLowerCase().includes(q)
    );
  }, [patients, search]);

  const pending   = patients.filter((p) => p.status === "assigned").length;
  const examining = patients.filter((p) => p.status === "in_examination").length;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Pasien Aktif" subtitle="Pasien yang memerlukan pengisian SOAP" />
      <div className="p-6 space-y-4">

        {/* Summary chips */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <ClipboardList className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-700">{pending} menunggu SOAP</span>
          </div>
          <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-2">
            <Activity className="w-4 h-4 text-teal-500" />
            <span className="text-sm font-semibold text-teal-700">{examining} sedang diperiksa</span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Cari nama atau EMR ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <Card>
          {loading ? <Spinner center /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["EMR ID", "Nama Pasien", "Poli", "Status", "Terdaftar", "Aksi"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((p) => (
                    <tr key={p.emrId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg">{p.emrId}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{p.firstName} {p.lastName}</td>
                      <td className="py-3 px-4 text-slate-500 text-xs">{p.department ?? "—"}</td>
                      <td className="py-3 px-4"><StatusBadge status={p.status} /></td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {format(new Date(p.createdAt), "dd MMM yyyy", { locale: localeId })}
                      </td>
                      <td className="py-3 px-4">
                        {p.status === "completed" ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                          </span>
                        ) : (
                          <Link href={`/nurse/soap/${p.emrId}`}>
                            <Button size="sm" icon={<ClipboardList className="w-3.5 h-3.5" />}>
                              Input SOAP
                            </Button>
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada pasien aktif saat ini.
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
