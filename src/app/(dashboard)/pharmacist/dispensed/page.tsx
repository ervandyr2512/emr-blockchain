"use client";

export const dynamic = "force-dynamic";

/**
 * Pharmacist — Dispensed Medications History
 * Lists all prescriptions that have been dispensed, with patient
 * identity, medication details, and blockchain trail.
 */

import { safeFormat } from "@/lib/dateUtils";
import React, { useEffect, useState, useCallback } from "react";
import {
  PackageCheck, User, ShieldCheck, Link as LinkIcon,
  RefreshCw, ChevronDown, ChevronUp, Pill, AlertCircle,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { getDispensedPrescriptions, getPatient } from "@/lib/emr";
import type { Prescription, Patient } from "@/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Cache patient data to avoid re-fetching same emrId */
const patientCache = new Map<string, Patient | null>();

async function fetchPatient(emrId: string): Promise<Patient | null> {
  if (patientCache.has(emrId)) return patientCache.get(emrId) ?? null;
  try {
    const pt = await getPatient(emrId);
    patientCache.set(emrId, pt);
    return pt;
  } catch {
    patientCache.set(emrId, null);
    return null;
  }
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PharmacistDispensedPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [patients,      setPatients]      = useState<Map<string, Patient | null>>(new Map());
  const [loading,       setLoading]       = useState(true);
  const [openIds,       setOpenIds]       = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rxs = await getDispensedPrescriptions();
      setPrescriptions(rxs);

      // Batch-fetch unique patients
      const uniqueEmrIds = [...new Set(rxs.map((r) => r.emrId))];
      const pairs = await Promise.all(
        uniqueEmrIds.map(async (id) => [id, await fetchPatient(id)] as [string, Patient | null])
      );
      setPatients(new Map(pairs));
    } catch (err) {
      console.error("[PharmacistDispensed]", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allIds  = prescriptions.map((r) => r.id);
  const allOpen = allIds.length > 0 && allIds.every((id) => openIds.has(id));
  const toggleAll = () => setOpenIds(allOpen ? new Set() : new Set(allIds));

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title="Obat Telah Diserahkan"
        subtitle={`${prescriptions.length} resep telah diserahkan ke pasien`}
      />
      <div className="p-6 space-y-4">

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
            <PackageCheck className="w-4 h-4 text-green-500" />
            <span className="text-sm font-semibold text-green-700">
              {prescriptions.length} diserahkan
            </span>
          </div>
          <Button
            variant="outline" size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={load}
          >
            Refresh
          </Button>
          {prescriptions.length > 0 && (
            <button
              type="button"
              onClick={toggleAll}
              className="ml-auto text-xs text-slate-500 hover:text-slate-700 font-medium hover:underline transition-colors"
            >
              {allOpen ? "Tutup Semua" : "Buka Semua"}
            </button>
          )}
        </div>

        {/* List */}
        {loading ? (
          <Spinner center label="Memuat data penyerahan obat…" />
        ) : prescriptions.length === 0 ? (
          <Card padding="sm" className="text-center py-16 text-slate-400 border-dashed">
            <PackageCheck className="w-10 h-10 mx-auto mb-2 opacity-20" />
            Belum ada obat yang diserahkan.
          </Card>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {prescriptions.map((rx) => {
                const open = openIds.has(rx.id);
                const pt   = patients.get(rx.emrId);
                return (
                  <div key={rx.id} className={open ? "bg-green-50/30" : "bg-white"}>

                    {/* Row header — click to expand */}
                    <button
                      type="button"
                      onClick={() => toggle(rx.id)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-green-50/40 transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                        <PackageCheck className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 flex flex-wrap items-center gap-2">
                          {pt
                            ? `${pt.firstName} ${pt.lastName}`
                            : <span className="text-slate-400">Pasien tidak ditemukan</span>
                          }
                          <span className="font-mono text-xs font-normal bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg">
                            {rx.emrId}
                          </span>
                          <span className="text-[11px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                            Diserahkan
                          </span>
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {rx.medications.length} obat ·{" "}
                          {rx.dispensedAt
                            ? `Diserahkan ${safeFormat(rx.dispensedAt, "dd MMM yyyy · HH:mm")}`
                            : `Dibuat ${safeFormat(rx.createdAt, "dd MMM yyyy · HH:mm")}`
                          }
                          {rx.pharmacistName ? ` · Apoteker: ${rx.pharmacistName}` : ""}
                        </p>
                      </div>
                      {open
                        ? <ChevronUp   className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    </button>

                    {/* Expanded detail */}
                    {open && (
                      <div className="px-4 pb-5 space-y-4">

                        {/* Patient identity */}
                        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 overflow-hidden">
                          <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 border-b border-amber-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide">
                              Identitas Pasien
                            </span>
                          </div>
                          {pt ? (
                            <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                              <div>
                                <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Nama</p>
                                <p className="font-bold text-slate-800">{pt.firstName} {pt.lastName}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">EMR ID</p>
                                <p className="font-mono text-primary-700 font-semibold">{pt.emrId}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">No. KTP</p>
                                <p className="font-mono text-slate-700">{pt.ktpNumber}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Jenis Kelamin</p>
                                <p className="text-slate-700">{pt.gender}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Telepon</p>
                                <p className="text-slate-700">{pt.phone}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Poli</p>
                                <p className="text-slate-700">{pt.department ?? "—"}</p>
                              </div>
                            </div>
                          ) : (
                            <div className="px-4 py-3 flex items-center gap-2 text-sm text-slate-500">
                              <AlertCircle className="w-4 h-4 text-amber-400" />
                              Data pasien tidak ditemukan.
                            </div>
                          )}
                        </div>

                        {/* Dispense info */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                          <div className="bg-white rounded-xl border border-slate-100 px-3 py-2">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Dokter</p>
                            <p className="font-medium text-slate-700">{rx.doctorName}</p>
                          </div>
                          <div className="bg-white rounded-xl border border-slate-100 px-3 py-2">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Apoteker</p>
                            <p className="font-medium text-slate-700">{rx.pharmacistName ?? "—"}</p>
                          </div>
                          <div className="bg-white rounded-xl border border-slate-100 px-3 py-2">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Waktu Penyerahan</p>
                            <p className="font-medium text-slate-700">
                              {rx.dispensedAt
                                ? safeFormat(rx.dispensedAt, "dd MMM yyyy · HH:mm")
                                : "—"}
                            </p>
                          </div>
                        </div>

                        {/* Medications table */}
                        <div>
                          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                            <Pill className="w-3 h-3" /> Daftar Obat
                          </p>
                          <div className="overflow-x-auto rounded-xl border border-slate-100">
                            <table className="w-full text-xs">
                              <thead className="bg-slate-50">
                                <tr>
                                  {["Nama Obat", "Dosis", "Frekuensi", "Durasi", "Catatan"].map(h => (
                                    <th key={h} className="text-left py-2 px-3 text-slate-400 font-semibold">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {rx.medications.map((m, i) => (
                                  <tr key={i} className="border-t border-slate-100">
                                    <td className="py-2 px-3 font-medium text-slate-800">{m.name}</td>
                                    <td className="py-2 px-3 text-slate-600">{m.dose}</td>
                                    <td className="py-2 px-3 text-slate-600">{m.frequency}</td>
                                    <td className="py-2 px-3 text-slate-600">{m.duration}</td>
                                    <td className="py-2 px-3 text-slate-400">{m.notes ?? "—"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Blockchain trail */}
                        {rx.blockchainTxHash && (
                          <div className="rounded-xl border border-green-200 bg-green-50/60 overflow-hidden">
                            <div className="flex items-center gap-1.5 px-3 py-2 bg-green-100/70 border-b border-green-200">
                              <LinkIcon className="w-3.5 h-3.5 text-green-600" />
                              <span className="text-[11px] font-bold text-green-700 uppercase tracking-wide">
                                Blockchain Trail
                              </span>
                            </div>
                            <div className="px-3 py-2.5 space-y-2.5 text-[11px]">
                              <div className="grid grid-cols-2 gap-x-4">
                                <div>
                                  <p className="text-slate-400 font-semibold uppercase tracking-wide text-[10px]">Network</p>
                                  <p className="text-slate-700 font-medium">Ethereum Sepolia</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 font-semibold uppercase tracking-wide text-[10px]">EMR ID</p>
                                  <p className="font-mono text-slate-700">{rx.emrId}</p>
                                </div>
                              </div>
                              <div className="pl-2.5 border-l-2 border-green-300 space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold px-1.5 py-0.5 rounded-full text-[10px] bg-green-100 text-green-700">
                                    Diserahkan
                                  </span>
                                  {rx.pharmacistName && (
                                    <span className="text-slate-600 font-medium">{rx.pharmacistName}</span>
                                  )}
                                  {rx.dispensedAt && (
                                    <span className="text-slate-400">
                                      · {safeFormat(rx.dispensedAt, "dd MMM yyyy · HH:mm")}
                                    </span>
                                  )}
                                </div>
                                <p className="font-mono text-green-600 break-all text-[10px] leading-snug">
                                  {rx.blockchainTxHash}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
