"use client";

export const dynamic = "force-dynamic";

/**
 * Doctor — Full Patient List (all statuses, search + filter)
 */

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Users, Search, Stethoscope, Filter, FileText } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { getAllPatients } from "@/lib/emr";
import type { Patient, PatientStatus } from "@/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const STATUS_FILTERS: { label: string; value: PatientStatus | "all" }[] = [
  { label: "Semua",         value: "all"          },
  { label: "Menunggu",      value: "assigned"      },
  { label: "Diperiksa",     value: "in_examination"},
  { label: "Selesai",       value: "completed"     },
];

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState("");
  const [filter,   setFilter]   = useState<PatientStatus | "all">("all");

  useEffect(() => {
    getAllPatients()
      .then((p) => setPatients(p))
      .catch((err) => console.error("[DoctorPatients]", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = patients;
    if (filter !== "all") list = list.filter((p) => p.status === filter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.emrId.toLowerCase().includes(q) ||
        p.department?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [patients, filter, search]);

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Pasien Saya" subtitle="Daftar seluruh pasien yang terdaftar" />
      <div className="p-6 space-y-4">

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Cari nama, EMR ID, atau poli…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                  filter === f.value
                    ? "bg-primary-600 text-white border-primary-600"
                    : "bg-white text-slate-600 border-slate-200 hover:border-primary-300"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">
              <Users className="inline w-4 h-4 mr-2 text-primary-500" />
              {filtered.length} Pasien
            </h3>
          </div>

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
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link href={`/doctor/records/${p.emrId}`}>
                            <Button size="sm" variant="outline" icon={<FileText className="w-3.5 h-3.5" />}>
                              Rekam Medis
                            </Button>
                          </Link>
                          {p.status !== "completed" && (
                            <Link href={`/doctor/emr/${p.emrId}`}>
                              <Button size="sm" icon={<Stethoscope className="w-3.5 h-3.5" />}>
                                Periksa
                              </Button>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada pasien yang sesuai filter.
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
