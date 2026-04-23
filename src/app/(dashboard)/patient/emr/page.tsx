"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import {
  FileText, Activity, Shield, ChevronDown, ChevronUp,
  Pill, HeartPulse, Thermometer, Droplets, Wind,
  ClipboardList, FlaskConical,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import {
  getPatientByUid, getAllSOAPNotes, getAllDoctorNotes,
  getPrescriptionsByEmrId,
} from "@/lib/emr";
import type { Patient, SOAPNote, DoctorNote, Prescription } from "@/types";
import { safeFormat } from "@/lib/dateUtils";

type Tab = "soap" | "doctor" | "resep" | "blockchain";

export default function PatientEMRPage() {
  const { user }   = useAuth();
  const [patient,  setPatient]  = useState<Patient | null>(null);
  const [soaps,    setSOAPs]    = useState<SOAPNote[]>([]);
  const [notes,    setNotes]    = useState<DoctorNote[]>([]);
  const [rxList,   setRxList]   = useState<Prescription[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<Tab>("doctor");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => setLoading(false), 10_000);

    const load = async () => {
      try {
        const p = await getPatientByUid(user.uid);
        setPatient(p);
        if (p) {
          const [s, n, rx] = await Promise.all([
            getAllSOAPNotes(p.emrId),
            getAllDoctorNotes(p.emrId),
            getPrescriptionsByEmrId(p.emrId),
          ]);
          setSOAPs(s);
          setNotes(n);
          setRxList(rx);
        }
      } catch (err) {
        console.error("[PatientEMR]", err);
      } finally {
        clearTimeout(timer);
        setLoading(false);
      }
    };

    load();
    return () => clearTimeout(timer);
  }, [user]);

  if (loading) return <Spinner center label="Memuat rekam medis…" />;

  const TABS: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "doctor",     label: "Catatan Dokter",  icon: <HeartPulse  className="w-4 h-4" />, count: notes.length   },
    { id: "soap",       label: "Catatan SOAP",    icon: <Activity    className="w-4 h-4" />, count: soaps.length   },
    { id: "resep",      label: "Resep",           icon: <Pill        className="w-4 h-4" />, count: rxList.length  },
    { id: "blockchain", label: "Blockchain Trail",icon: <Shield      className="w-4 h-4" />                        },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Rekam Medis Saya" subtitle="Seluruh riwayat medis dan dokumen kesehatan Anda" />
      <div className="p-6 space-y-6">

        {patient ? (
          <>
            {/* ── Patient identity card ── */}
            <Card className="bg-gradient-to-br from-primary-600 to-primary-800 text-white border-0">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0">
                  {patient.firstName[0]}
                </div>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "EMR ID",   value: patient.emrId,                          mono: true  },
                    { label: "Nama",     value: `${patient.firstName} ${patient.lastName}`, mono: false },
                    { label: "Jenis Kelamin", value: patient.gender,                    mono: false },
                    { label: "Poli",     value: patient.department ?? "Belum ditentukan", mono: false },
                  ].map(({ label, value, mono }) => (
                    <div key={label}>
                      <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wide">{label}</p>
                      <p className={`text-white font-semibold text-sm mt-0.5 ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
                    </div>
                  ))}
                </div>
                <StatusBadge status={patient.status} />
              </div>
            </Card>

            {/* ── Tab switcher ── */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-shrink-0 flex items-center gap-2 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
                    tab === t.id
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                  {t.count !== undefined && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      tab === t.id ? "bg-primary-100 text-primary-700" : "bg-slate-200 text-slate-500"
                    }`}>
                      {t.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── Tab: Catatan Dokter ── */}
            {tab === "doctor" && (
              <div className="space-y-4">
                {notes.length === 0 ? (
                  <Card>
                    <EmptyState icon={<HeartPulse className="w-10 h-10" />} msg="Belum ada catatan pemeriksaan dokter." />
                  </Card>
                ) : notes.map((n, i) => (
                  <Card key={i} className="p-0 overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 text-left transition-colors"
                      onClick={() => setExpanded(expanded === `doc-${i}` ? null : `doc-${i}`)}
                    >
                      <div>
                        <p className="font-bold text-slate-800">{n.workingDiagnosis}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400">{n.doctorName}</span>
                          <span className="text-slate-200">·</span>
                          <span className="text-xs text-slate-400">
                            {safeFormat(n.createdAt, "dd MMMM yyyy, HH:mm")}
                          </span>
                        </div>
                      </div>
                      {expanded === `doc-${i}`
                        ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    </button>

                    {expanded === `doc-${i}` && (
                      <div className="border-t border-slate-100 px-5 py-5 space-y-5">

                        {/* Vital signs */}
                        {n.vitalSigns && (
                        <div>
                          <SectionTitle icon={<Thermometer className="w-4 h-4" />} title="Tanda Vital" />
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                            {[
                              { label: "Tekanan Darah", value: n.vitalSigns.bloodPressure ? n.vitalSigns.bloodPressure + " mmHg" : "—", icon: <Droplets className="w-3.5 h-3.5" /> },
                              { label: "Nadi",          value: n.vitalSigns.heartRate ? n.vitalSigns.heartRate + " bpm" : "—",             icon: <HeartPulse className="w-3.5 h-3.5" /> },
                              { label: "Suhu",          value: n.vitalSigns.temperature ? n.vitalSigns.temperature + " °C" : "—",           icon: <Thermometer className="w-3.5 h-3.5" /> },
                              { label: "RR",            value: n.vitalSigns.respiratoryRate ? n.vitalSigns.respiratoryRate + "x/mnt" : "—", icon: <Wind className="w-3.5 h-3.5" /> },
                              { label: "SpO₂",          value: n.vitalSigns.oxygenSaturation ? n.vitalSigns.oxygenSaturation + "%" : "—",   icon: <Activity className="w-3.5 h-3.5" /> },
                            ].map((v) => (
                              <div key={v.label} className="bg-slate-50 rounded-xl p-2.5 text-center">
                                <div className="flex justify-center text-primary-400 mb-1">{v.icon}</div>
                                <p className="text-xs font-bold text-slate-800">{v.value}</p>
                                <p className="text-[10px] text-slate-400">{v.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        )}

                        {/* Chief complaint & history */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <InfoBlock label="Keluhan Utama"         value={n.chiefComplaint} />
                          <InfoBlock label="Riwayat Penyakit"      value={n.historyPresentIllness} />
                          <InfoBlock label="Riwayat Penyakit Lalu" value={n.pastMedicalHistory || "Tidak ada"} />
                          <InfoBlock label="Alergi"                value={n.allergy || "Tidak ada"} />
                        </div>

                        {/* Physical exam */}
                        {n.physicalExamination && (
                          <InfoBlock label="Pemeriksaan Fisik" value={n.physicalExamination} />
                        )}

                        {/* Supporting exams */}
                        {n.supportingExams?.length > 0 && (
                          <div>
                            <SectionTitle icon={<FlaskConical className="w-4 h-4" />} title="Pemeriksaan Penunjang" />
                            <div className="mt-2 space-y-2">
                              {n.supportingExams.map((ex: any, j: number) => (
                                <div key={j} className="flex items-start gap-3 text-sm bg-slate-50 rounded-xl p-3">
                                  <span className="text-xs font-bold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full flex-shrink-0">{ex.type}</span>
                                  <div>
                                    <p className="font-semibold text-slate-700">{ex.name}</p>
                                    <p className="text-slate-500 text-xs mt-0.5">{ex.result}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Diagnosis & plan */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <InfoBlock label="Diagnosis Kerja"         value={n.workingDiagnosis}      highlight />
                          <InfoBlock label="Diagnosis Banding"       value={n.differentialDiagnosis || "—"} />
                          <InfoBlock label="Rencana Tatalaksana"     value={n.managementPlan}        className="sm:col-span-2" />
                        </div>

                        {/* Blockchain hash */}
                        {n.blockchainTxHash && (
                          <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">TX Hash Blockchain</p>
                            <p className="hash-text">{n.blockchainTxHash}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* ── Tab: Catatan SOAP ── */}
            {tab === "soap" && (
              <div className="space-y-4">
                {soaps.length === 0 ? (
                  <Card>
                    <EmptyState icon={<Activity className="w-10 h-10" />} msg="Belum ada catatan SOAP dari perawat." />
                  </Card>
                ) : soaps.map((s, i) => (
                  <Card key={i} className="p-0 overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 text-left"
                      onClick={() => setExpanded(expanded === `soap-${i}` ? null : `soap-${i}`)}
                    >
                      <div>
                        <p className="font-bold text-slate-800">{s.nurseName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {safeFormat(s.createdAt, "dd MMMM yyyy, HH:mm")}
                        </p>
                      </div>
                      {expanded === `soap-${i}`
                        ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                    </button>

                    {expanded === `soap-${i}` && (
                      <div className="border-t border-slate-100 px-5 py-5 space-y-4">
                        {/* Vitals */}
                        {s.objective && (
                        <div>
                          <SectionTitle icon={<Thermometer className="w-4 h-4" />} title="Tanda Vital" />
                          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-2">
                            {[
                              { label: "TD",    value: s.objective.bloodPressure ? s.objective.bloodPressure + " mmHg" : "—" },
                              { label: "Nadi",  value: s.objective.heartRate ? s.objective.heartRate + " bpm" : "—" },
                              { label: "Suhu",  value: s.objective.temperature ? s.objective.temperature + " °C" : "—" },
                              { label: "BB",    value: s.objective.weight ? s.objective.weight + " kg" : "—" },
                              { label: "SpO₂",  value: s.objective.oxygenSaturation ? s.objective.oxygenSaturation + "%" : "—" },
                            ].map((v) => (
                              <div key={v.label} className="bg-teal-50 rounded-xl p-2.5 text-center">
                                <p className="text-xs font-bold text-slate-800">{v.value}</p>
                                <p className="text-[10px] text-slate-400">{v.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <InfoBlock label="S — Subjektif" value={s.subjective} />
                          <InfoBlock label="O — Objektif"  value={s.assessment} />
                          <InfoBlock label="P — Plan"      value={s.plan} className="sm:col-span-2" />
                        </div>

                        {s.blockchainTxHash && (
                          <div className="bg-slate-50 rounded-xl p-3">
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">TX Hash Blockchain</p>
                            <p className="hash-text">{s.blockchainTxHash}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* ── Tab: Resep ── */}
            {tab === "resep" && (
              <div className="space-y-4">
                {rxList.length === 0 ? (
                  <Card>
                    <EmptyState icon={<Pill className="w-10 h-10" />} msg="Belum ada resep yang dikeluarkan." />
                  </Card>
                ) : rxList.map((rx, i) => (
                  <Card key={i}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-bold text-slate-800">{rx.doctorName}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {safeFormat(rx.createdAt, "dd MMMM yyyy")}
                        </p>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                        rx.status === "dispensed"   ? "bg-green-50 text-green-700 border-green-200" :
                        rx.status === "processing"  ? "bg-amber-50 text-amber-700 border-amber-200" :
                        "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                        {rx.status === "dispensed"  ? "Sudah Diserahkan" :
                         rx.status === "processing" ? "Sedang Diproses"  : "Menunggu"}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {(rx.medications ?? []).map((med: any, j: number) => (
                        <div key={j} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
                          <div className="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Pill className="w-3.5 h-3.5 text-primary-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800">{med.name}</p>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-500 mt-0.5">
                              <span>Dosis: {med.dose}</span>
                              <span>Frekuensi: {med.frequency}</span>
                              <span>Durasi: {med.duration}</span>
                            </div>
                            {med.notes && (
                              <p className="text-xs text-slate-400 mt-0.5 italic">{med.notes}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {rx.notes && (
                      <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-xs font-semibold text-amber-700 mb-0.5">Catatan Dokter:</p>
                        <p className="text-xs text-amber-600">{rx.notes}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {/* ── Tab: Blockchain Trail ── */}
            {tab === "blockchain" && (
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-primary-600" />
                  <h3 className="font-bold text-slate-800">Audit Trail Blockchain</h3>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                  <Shield className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-500">Koneksi ke blockchain memerlukan MetaMask.</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Setiap perubahan rekam medis Anda tercatat permanen di jaringan Ethereum Sepolia
                    dan tidak dapat dimanipulasi oleh siapapun.
                  </p>
                  <div className="mt-4 space-y-2 text-left">
                    {[
                      { label: "Network",  value: "Ethereum Sepolia Testnet" },
                      { label: "EMR ID",   value: patient.emrId },
                      { label: "TX Hash",  value: patient.blockchainTxHash ?? "Belum ada transaksi" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-start gap-2 text-xs">
                        <span className="text-slate-400 w-16 flex-shrink-0">{label}:</span>
                        <span className="font-mono text-slate-600 break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            )}
          </>
        ) : (
          <Card>
            <EmptyState
              icon={<FileText className="w-12 h-12" />}
              msg="Data rekam medis belum tersedia."
              sub="Hubungi admin rumah sakit untuk melengkapi data Anda."
            />
          </Card>
        )}
      </div>
    </div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-1.5 text-slate-600">
      {icon}
      <span className="text-xs font-bold uppercase tracking-wider">{title}</span>
    </div>
  );
}

function InfoBlock({
  label, value, highlight = false, className = "",
}: {
  label: string; value: string; highlight?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm leading-relaxed ${highlight ? "font-bold text-primary-700" : "text-slate-700"}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState({
  icon, msg, sub,
}: {
  icon: React.ReactNode; msg: string; sub?: string;
}) {
  return (
    <div className="text-center py-12">
      <div className="text-slate-200 flex justify-center mb-3">{icon}</div>
      <p className="text-slate-500 font-medium">{msg}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}
