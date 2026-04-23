"use client";

/**
 * MedicalHistoryCards.tsx
 * -----------------------
 * Shared collapsible history cards used on Nurse SOAP, Doctor EMR,
 * and the view-only Records pages.
 *
 * Exports:
 *   <SOAPHistoryCard        notes={SOAPNote[]} />
 *   <DoctorHistoryCard      notes={DoctorNote[]} />
 *   <PrescriptionHistoryCard prescriptions={Prescription[]} />
 */

import React, { useState } from "react";
import {
  ChevronDown, ChevronUp, ClipboardList, UserCheck,
  Pill, FlaskConical, Link as LinkIcon, PackageCheck, Clock, Pencil,
  ShieldCheck,
} from "lucide-react";
import type { SOAPNote, DoctorNote, Prescription, VitalSigns, BlockchainTrailEntry } from "@/types";
import { safeFormat } from "@/lib/dateUtils";

// ── Micro-components ─────────────────────────────────────────────────────────

function VitalItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg px-2.5 py-1.5 border border-slate-100">
      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-slate-700 text-xs">{value}</p>
    </div>
  );
}

function VitalsGrid({ v }: { v: VitalSigns }) {
  if (!v) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-1.5">
      <VitalItem label="Tekanan Darah"  value={v.bloodPressure    ? `${v.bloodPressure} mmHg`  : "—"} />
      <VitalItem label="Denyut Jantung" value={v.heartRate        ? `${v.heartRate} bpm`        : "—"} />
      <VitalItem label="Suhu Tubuh"     value={v.temperature      ? `${v.temperature} °C`       : "—"} />
      <VitalItem label="Laju Nafas"     value={v.respiratoryRate  ? `${v.respiratoryRate} x/mnt`: "—"} />
      <VitalItem label="SpO₂"           value={v.oxygenSaturation ? `${v.oxygenSaturation} %`   : "—"} />
      {v.weight && <VitalItem label="Berat Badan"  value={`${v.weight} kg`} />}
      {v.height && <VitalItem label="Tinggi Badan" value={`${v.height} cm`} />}
    </div>
  );
}

function SOAPField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 whitespace-pre-wrap bg-white rounded-lg border border-slate-100 px-3 py-2 leading-relaxed">
        {value || <span className="text-slate-300 italic">—</span>}
      </p>
    </div>
  );
}

/** Full blockchain trail panel — shows Network, EMR ID, and all trail entries */
function BlockchainTrailSection({
  emrId,
  txHash,
  history,
}: {
  emrId: string;
  txHash?: string;
  history?: Record<string, BlockchainTrailEntry>;
}) {
  const trails: BlockchainTrailEntry[] = history
    ? Object.values(history).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )
    : [];

  // Fallback: if no trail history but we have a txHash, show a minimal row
  const showFallback = trails.length === 0 && !!txHash;

  if (!txHash && trails.length === 0) return null;

  return (
    <div className="rounded-xl border border-green-200 bg-green-50/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-green-100/70 border-b border-green-200">
        <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
        <span className="text-[11px] font-bold text-green-700 uppercase tracking-wide">
          Blockchain Trail
        </span>
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        {/* Meta row */}
        <div className="grid grid-cols-2 gap-x-4 text-[11px]">
          <div>
            <p className="text-slate-400 font-semibold uppercase tracking-wide text-[10px]">Network</p>
            <p className="text-slate-700 font-medium">Ethereum Sepolia</p>
          </div>
          <div>
            <p className="text-slate-400 font-semibold uppercase tracking-wide text-[10px]">EMR ID</p>
            <p className="font-mono text-slate-700">{emrId}</p>
          </div>
        </div>

        {/* Trail entries */}
        {trails.length > 0 && (
          <div className="space-y-2 pt-0.5">
            {trails.map((entry, i) => (
              <div key={i} className="pl-2.5 border-l-2 border-green-300 space-y-0.5 text-[11px]">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded-full text-[10px] ${
                      entry.action === "created"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {entry.action === "created" ? "Dibuat" : "Diperbarui"}
                  </span>
                  {entry.actorName && (
                    <span className="text-slate-600 font-medium">{entry.actorName}</span>
                  )}
                  {entry.timestamp && (
                    <span className="text-slate-400">
                      · {safeFormat(entry.timestamp, "dd MMM yyyy · HH:mm")}
                    </span>
                  )}
                </div>
                <p className="font-mono text-green-600 break-all text-[10px] leading-snug">
                  {entry.txHash}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Fallback for legacy entries that only have blockchainTxHash but no history */}
        {showFallback && (
          <div className="flex items-start gap-1.5 text-[11px]">
            <LinkIcon className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="font-mono text-green-600 break-all leading-snug">{txHash}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const RX_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:    { label: "Menunggu",   color: "bg-amber-100 text-amber-700" },
  processing: { label: "Diproses",   color: "bg-blue-100 text-blue-700" },
  dispensed:  { label: "Diserahkan", color: "bg-green-100 text-green-700" },
  cancelled:  { label: "Dibatalkan", color: "bg-red-100 text-red-700" },
};

// ── SOAP history card ─────────────────────────────────────────────────────────

export function SOAPHistoryCard({
  notes,
  onEdit,
}: {
  notes: SOAPNote[];
  onEdit?: (noteId: string) => void;
}) {
  const allIds = notes.map((n) => n.id);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const allOpen    = allIds.length > 0 && allIds.every((id) => openIds.has(id));
  const toggleAll  = () => setOpenIds(allOpen ? new Set() : new Set(allIds));
  if (notes.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border-b border-amber-100">
        <ClipboardList className="w-4 h-4 text-amber-500" />
        <span className="font-bold text-sm text-slate-800">Riwayat SOAP Perawat</span>
        <span className="text-xs text-slate-400">{notes.length} entri</span>
        <button
          type="button"
          onClick={toggleAll}
          className="ml-auto text-xs text-amber-600 hover:text-amber-800 font-medium hover:underline transition-colors"
        >
          {allOpen ? "Tutup Semua" : "Buka Semua"}
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {notes.map((n) => {
          const open   = openIds.has(n.id);
          const edited = !!n.updatedAt && n.updatedAt !== n.createdAt;
          // Primary timestamp to display: updatedAt if edited, else createdAt
          const displayTime = safeFormat(
            edited && n.updatedAt ? n.updatedAt : n.createdAt,
            "dd MMM yyyy · HH:mm"
          );
          return (
            <div key={n.id} className={open ? "bg-amber-50/40" : "bg-white"}>
              <button
                type="button"
                onClick={() => toggle(n.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-amber-50/60 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 flex flex-wrap items-center gap-1.5">
                    {displayTime}
                    {edited && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        ✏️ Diperbarui
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {n.nurseName ?? ""}
                    {edited
                      ? ` · dibuat ${safeFormat(n.createdAt, "dd MMM yyyy · HH:mm")}`
                      : ""}
                    {n.subjective
                      ? ` · "${n.subjective.slice(0, 60)}${n.subjective.length > 60 ? "…" : ""}"`
                      : ""}
                  </p>
                </div>
                {open
                  ? <ChevronUp   className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </button>

              {open && (
                <div className="px-4 pb-5 space-y-3">
                  <SOAPField label="S — Subjective (Keluhan Pasien)"     value={n.subjective ?? ""} />
                  <SOAPField label="A — Assessment (Penilaian Perawat)"  value={n.assessment ?? ""} />
                  <SOAPField label="P — Plan (Rencana Tindakan Perawat)" value={n.plan       ?? ""} />

                  {n.objective && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        O — Objective (Tanda-Tanda Vital)
                      </p>
                      <VitalsGrid v={n.objective} />
                    </div>
                  )}

                  <BlockchainTrailSection
                    emrId={n.emrId}
                    txHash={n.blockchainTxHash}
                    history={n.blockchainHistory}
                  />

                  {onEdit && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onEdit(n.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit SOAP Ini
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Doctor notes history card ─────────────────────────────────────────────────

export function DoctorHistoryCard({
  notes,
  onEdit,
}: {
  notes: DoctorNote[];
  onEdit?: (noteId: string) => void;
}) {
  const allIds = notes.map((n) => n.id);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const allOpen   = allIds.length > 0 && allIds.every((id) => openIds.has(id));
  const toggleAll = () => setOpenIds(allOpen ? new Set() : new Set(allIds));
  if (notes.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-primary-50 border-b border-primary-100">
        <UserCheck className="w-4 h-4 text-primary-500" />
        <span className="font-bold text-sm text-slate-800">Riwayat Pemeriksaan Dokter</span>
        <span className="text-xs text-slate-400">{notes.length} entri</span>
        <button
          type="button"
          onClick={toggleAll}
          className="ml-auto text-xs text-primary-600 hover:text-primary-800 font-medium hover:underline transition-colors"
        >
          {allOpen ? "Tutup Semua" : "Buka Semua"}
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {notes.map((n) => {
          const open   = openIds.has(n.id);
          const edited = !!n.updatedAt && n.updatedAt !== n.createdAt;
          return (
            <div key={n.id} className={open ? "bg-primary-50/30" : "bg-white"}>
              <button
                type="button"
                onClick={() => toggle(n.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-primary-50/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 flex flex-wrap items-center gap-1.5">
                    {safeFormat(n.createdAt, "dd MMM yyyy · HH:mm")}
                    {n.workingDiagnosis && (
                      <span className="text-xs font-normal text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full truncate max-w-[220px]">
                        {n.workingDiagnosis.length > 45
                          ? n.workingDiagnosis.slice(0, 45) + "…"
                          : n.workingDiagnosis}
                      </span>
                    )}
                    {edited && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                        ✏️ Diperbarui
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {n.doctorName ? `Dr. ${n.doctorName}` : "—"}
                    {edited && n.updatedAt
                      ? ` · diperbarui ${safeFormat(n.updatedAt, "dd MMM yyyy · HH:mm")}`
                      : ""}
                  </p>
                </div>
                {open
                  ? <ChevronUp   className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </button>

              {open && (
                <div className="px-4 pb-5 space-y-3">

                  {/* Anamnesis */}
                  <div className="space-y-2">
                    {n.chiefComplaint        && <SOAPField label="Keluhan Utama"           value={n.chiefComplaint} />}
                    {n.historyPresentIllness && <SOAPField label="Riwayat Penyakit Kini"   value={n.historyPresentIllness} />}
                    {n.pastMedicalHistory    && <SOAPField label="Riwayat Penyakit Dahulu" value={n.pastMedicalHistory} />}
                    {n.surgicalHistory       && <SOAPField label="Riwayat Operasi"         value={n.surgicalHistory} />}
                    {n.medicationHistory     && <SOAPField label="Riwayat Obat-obatan"     value={n.medicationHistory} />}
                    {n.allergy               && <SOAPField label="Alergi"                  value={n.allergy} />}
                  </div>

                  {/* Vitals */}
                  {n.vitalSigns && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                        Tanda-Tanda Vital (saat pemeriksaan)
                      </p>
                      <VitalsGrid v={n.vitalSigns} />
                    </div>
                  )}

                  {/* Physical exam */}
                  {n.physicalExamination && (
                    <SOAPField label="Pemeriksaan Fisik" value={n.physicalExamination} />
                  )}

                  {/* Supporting exams */}
                  {(n.supportingExams?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                        <FlaskConical className="w-3 h-3" /> Pemeriksaan Penunjang
                      </p>
                      <div className="overflow-x-auto rounded-lg border border-slate-100">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50">
                            <tr>
                              {["Jenis", "Nama", "Hasil", "Tanggal"].map(h => (
                                <th key={h} className="text-left py-1.5 px-3 text-slate-400 font-semibold">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {(n.supportingExams ?? []).map((e, i) => (
                              <tr key={i} className="border-t border-slate-100">
                                <td className="py-1.5 px-3 text-slate-500">{e.type}</td>
                                <td className="py-1.5 px-3 font-medium text-slate-700">{e.name}</td>
                                <td className="py-1.5 px-3 text-slate-600">{e.result}</td>
                                <td className="py-1.5 px-3 text-slate-400">{e.date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Diagnosis + plan */}
                  <div className="grid sm:grid-cols-2 gap-2">
                    {n.workingDiagnosis      && <SOAPField label="Diagnosis Utama"   value={n.workingDiagnosis} />}
                    {n.differentialDiagnosis && <SOAPField label="Diagnosis Banding" value={n.differentialDiagnosis} />}
                  </div>
                  {n.managementPlan && (
                    <SOAPField label="Rencana Tata Laksana" value={n.managementPlan} />
                  )}

                  <BlockchainTrailSection
                    emrId={n.emrId}
                    txHash={n.blockchainTxHash}
                    history={n.blockchainHistory}
                  />

                  {onEdit && (
                    <div className="pt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onEdit(n.id)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit Catatan Ini
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Prescription history card ─────────────────────────────────────────────────

export function PrescriptionHistoryCard({ prescriptions }: { prescriptions: Prescription[] }) {
  const allIds = prescriptions.map((rx) => rx.id);
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const allOpen   = allIds.length > 0 && allIds.every((id) => openIds.has(id));
  const toggleAll = () => setOpenIds(allOpen ? new Set() : new Set(allIds));
  if (prescriptions.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-teal-50 border-b border-teal-100">
        <Pill className="w-4 h-4 text-teal-500" />
        <span className="font-bold text-sm text-slate-800">Riwayat Resep &amp; Pengobatan</span>
        <span className="text-xs text-slate-400">{prescriptions.length} resep</span>
        <button
          type="button"
          onClick={toggleAll}
          className="ml-auto text-xs text-teal-600 hover:text-teal-800 font-medium hover:underline transition-colors"
        >
          {allOpen ? "Tutup Semua" : "Buka Semua"}
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {prescriptions.map((rx) => {
          const open      = openIds.has(rx.id);
          const statusCfg = RX_STATUS_LABEL[rx.status] ?? { label: rx.status, color: "bg-slate-100 text-slate-600" };
          return (
            <div key={rx.id} className={open ? "bg-teal-50/30" : "bg-white"}>
              <button
                type="button"
                onClick={() => toggle(rx.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-teal-50/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 flex flex-wrap items-center gap-2">
                    {safeFormat(rx.createdAt, "dd MMM yyyy · HH:mm")}
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  </p>
                  <p className="text-xs text-slate-500">
                    {rx.doctorName ? `Dr. ${rx.doctorName}` : "—"}
                    {rx.medications?.length
                      ? ` · ${rx.medications.length} obat: ${rx.medications.map(m => m.name).join(", ").slice(0, 60)}${rx.medications.map(m => m.name).join(", ").length > 60 ? "…" : ""}`
                      : ""}
                  </p>
                </div>
                {open
                  ? <ChevronUp   className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </button>

              {open && (
                <div className="px-4 pb-5 space-y-3">

                  {/* Medications table */}
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Daftar Obat
                    </p>
                    <div className="overflow-x-auto rounded-lg border border-slate-100">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-50">
                          <tr>
                            {["Nama Obat", "Dosis", "Frekuensi", "Durasi", "Catatan"].map(h => (
                              <th key={h} className="text-left py-1.5 px-3 text-slate-400 font-semibold">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(rx.medications ?? []).map((m, i) => (
                            <tr key={i} className="border-t border-slate-100">
                              <td className="py-1.5 px-3 font-medium text-slate-700">{m.name}</td>
                              <td className="py-1.5 px-3 text-slate-600">{m.dose}</td>
                              <td className="py-1.5 px-3 text-slate-600">{m.frequency}</td>
                              <td className="py-1.5 px-3 text-slate-600">{m.duration}</td>
                              <td className="py-1.5 px-3 text-slate-400">{m.notes ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Dispensed info */}
                  {rx.status === "dispensed" && rx.dispensedAt && (
                    <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                      <PackageCheck className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>
                        Diserahkan oleh <b>{rx.pharmacistName ?? "Apoteker"}</b> pada{" "}
                        {safeFormat(rx.dispensedAt, "dd MMM yyyy · HH:mm")}
                      </span>
                    </div>
                  )}

                  {/* Pending notice */}
                  {rx.status === "pending" && (
                    <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>Resep sedang menunggu proses di apotek.</span>
                    </div>
                  )}

                  {/* Blockchain trail */}
                  {rx.blockchainTxHash && (
                    <BlockchainTrailSection
                      emrId={rx.emrId}
                      txHash={rx.blockchainTxHash}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
