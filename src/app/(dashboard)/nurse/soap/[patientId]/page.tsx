"use client";

export const dynamic = "force-dynamic";

/**
 * SOAP Input Page (Nurse)
 * Shows full SOAP history + doctor note history before the input form.
 */

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  ArrowLeft, Stethoscope, Link as LinkIcon,
  ChevronDown, ChevronUp, ClipboardList, UserCheck,
  Pill, FlaskConical,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import {
  getPatient, saveSOAPNote,
  getAllSOAPNotes, getAllDoctorNotes,
} from "@/lib/emr";
import { blockchainSubmitSOAPFull, extractErrorMessage } from "@/lib/blockchain";
import { createNotification } from "@/lib/notifications";
import { sha256 } from "@/lib/hash";
import { useAuth } from "@/hooks/useAuth";
import type { Patient, SOAPNote, DoctorNote, VitalSigns } from "@/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ── Small helpers ────────────────────────────────────────────────────────────

function VitalsGrid({ v }: { v: VitalSigns }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-xs">
      <VitalItem label="Tekanan Darah" value={`${v.bloodPressure} mmHg`} />
      <VitalItem label="Denyut Jantung" value={`${v.heartRate} bpm`} />
      <VitalItem label="Suhu Tubuh"     value={`${v.temperature} °C`} />
      <VitalItem label="Laju Nafas"     value={`${v.respiratoryRate} x/mnt`} />
      <VitalItem label="SpO₂"           value={`${v.oxygenSaturation} %`} />
      {v.weight  && <VitalItem label="Berat Badan" value={`${v.weight} kg`} />}
      {v.height  && <VitalItem label="Tinggi Badan" value={`${v.height} cm`} />}
    </div>
  );
}

function VitalItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg px-2.5 py-1.5 border border-slate-100">
      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="font-semibold text-slate-700">{value}</p>
    </div>
  );
}

function SOAPField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm text-slate-700 whitespace-pre-wrap bg-white rounded-lg border border-slate-100 px-3 py-2">
        {value || <span className="text-slate-300 italic">—</span>}
      </p>
    </div>
  );
}

// ── SOAP history card ────────────────────────────────────────────────────────

function SOAPHistoryCard({ notes }: { notes: SOAPNote[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(notes[0]?.id ?? null);

  if (notes.length === 0) return null;

  return (
    <Card>
      <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-amber-500" />
        Riwayat SOAP Perawat
        <span className="ml-auto text-xs font-normal text-slate-400">{notes.length} entri</span>
      </h3>
      <div className="space-y-2">
        {notes.map((n) => {
          const open = expandedId === n.id;
          return (
            <div
              key={n.id}
              className={`rounded-xl border transition-colors ${open ? "border-amber-200 bg-amber-50/60" : "border-slate-100 bg-slate-50/50"}`}
            >
              {/* Header row */}
              <button
                type="button"
                onClick={() => setExpandedId(open ? null : n.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {format(new Date(n.createdAt), "dd MMM yyyy · HH:mm", { locale: localeId })}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    Perawat: {n.nurseName}
                    {n.subjective ? ` · "${n.subjective.slice(0, 60)}${n.subjective.length > 60 ? "…" : ""}"` : ""}
                  </p>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                       : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </button>

              {/* Expanded content */}
              {open && (
                <div className="px-4 pb-4 space-y-3">
                  {/* SOAP text */}
                  <div className="space-y-2">
                    <SOAPField label="S — Subjective (Keluhan Pasien)"        value={n.subjective} />
                    <SOAPField label="A — Assessment (Penilaian Perawat)"     value={n.assessment} />
                    <SOAPField label="P — Plan (Rencana Tindakan Perawat)"    value={n.plan} />
                  </div>

                  {/* Vitals */}
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      O — Objective (Tanda-Tanda Vital)
                    </p>
                    <VitalsGrid v={n.objective} />
                  </div>

                  {/* Blockchain hash if available */}
                  {n.blockchainTxHash && (
                    <div className="flex items-center gap-2 text-[11px] text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5">
                      <LinkIcon className="w-3 h-3 flex-shrink-0" />
                      <span className="font-mono truncate">{n.blockchainTxHash}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Doctor notes history card ─────────────────────────────────────────────────

function DoctorHistoryCard({ notes }: { notes: DoctorNote[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(notes[0]?.id ?? null);

  if (notes.length === 0) return null;

  return (
    <Card>
      <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
        <UserCheck className="w-4 h-4 text-primary-500" />
        Riwayat Pemeriksaan Dokter
        <span className="ml-auto text-xs font-normal text-slate-400">{notes.length} entri</span>
      </h3>
      <div className="space-y-2">
        {notes.map((n) => {
          const open = expandedId === n.id;
          return (
            <div
              key={n.id}
              className={`rounded-xl border transition-colors ${open ? "border-primary-200 bg-primary-50/40" : "border-slate-100 bg-slate-50/50"}`}
            >
              {/* Header row */}
              <button
                type="button"
                onClick={() => setExpandedId(open ? null : n.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">
                    {format(new Date(n.createdAt), "dd MMM yyyy · HH:mm", { locale: localeId })}
                    {n.workingDiagnosis && (
                      <span className="ml-2 text-xs font-normal text-primary-700 bg-primary-100 px-2 py-0.5 rounded-full">
                        {n.workingDiagnosis.slice(0, 40)}{n.workingDiagnosis.length > 40 ? "…" : ""}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500">Dr. {n.doctorName}</p>
                </div>
                {open ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                       : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
              </button>

              {/* Expanded content */}
              {open && (
                <div className="px-4 pb-4 space-y-3">

                  {/* Anamnesis */}
                  <div className="space-y-2">
                    {n.chiefComplaint        && <SOAPField label="Keluhan Utama"          value={n.chiefComplaint} />}
                    {n.historyPresentIllness && <SOAPField label="Riwayat Penyakit Kini"  value={n.historyPresentIllness} />}
                    {n.pastMedicalHistory    && <SOAPField label="Riwayat Penyakit Dahulu" value={n.pastMedicalHistory} />}
                    {n.surgicalHistory       && <SOAPField label="Riwayat Operasi"         value={n.surgicalHistory} />}
                    {n.medicationHistory     && <SOAPField label="Riwayat Obat"            value={n.medicationHistory} />}
                    {n.allergy               && <SOAPField label="Alergi"                  value={n.allergy} />}
                  </div>

                  {/* Vitals from doctor visit */}
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      Tanda-Tanda Vital (saat pemeriksaan dokter)
                    </p>
                    <VitalsGrid v={n.vitalSigns} />
                  </div>

                  {/* Physical exam */}
                  {n.physicalExamination && (
                    <SOAPField label="Pemeriksaan Fisik" value={n.physicalExamination} />
                  )}

                  {/* Supporting exams */}
                  {n.supportingExams?.length > 0 && (
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
                            {n.supportingExams.map((e, i) => (
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

                  {/* Diagnosis + Plan */}
                  <div className="grid sm:grid-cols-2 gap-2">
                    {n.workingDiagnosis      && <SOAPField label="Diagnosis Utama"        value={n.workingDiagnosis} />}
                    {n.differentialDiagnosis && <SOAPField label="Diagnosis Banding"      value={n.differentialDiagnosis} />}
                    {n.managementPlan        && <SOAPField label="Rencana Tata Laksana"   value={n.managementPlan} />}
                  </div>

                  {/* Prescription */}
                  {(n.prescription?.medications?.length ?? 0) > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                        <Pill className="w-3 h-3" /> Resep Obat
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
                            {(n.prescription?.medications ?? []).map((m, i) => (
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
                  )}

                  {/* Blockchain hash */}
                  {n.blockchainTxHash && (
                    <div className="flex items-center gap-2 text-[11px] text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-1.5">
                      <LinkIcon className="w-3 h-3 flex-shrink-0" />
                      <span className="font-mono truncate">{n.blockchainTxHash}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function SOAPPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router        = useRouter();
  const { profile }   = useAuth();

  const [patient,     setPatient]     = useState<Patient | null>(null);
  const [soapNotes,   setSOAPNotes]   = useState<SOAPNote[]>([]);
  const [doctorNotes, setDoctorNotes] = useState<DoctorNote[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [txHash,      setTxHash]      = useState<string>("");

  const [form, setForm] = useState({
    subjective:       "",
    assessment:       "",
    plan:             "",
    bloodPressure:    "",
    heartRate:        "",
    temperature:      "",
    respiratoryRate:  "",
    oxygenSaturation: "",
    weight:           "",
    height:           "",
  });

  useEffect(() => {
    Promise.all([
      getPatient(patientId),
      getAllSOAPNotes(patientId),
      getAllDoctorNotes(patientId),
    ])
      .then(([p, soaps, docs]) => {
        setPatient(p);
        setSOAPNotes(soaps);
        setDoctorNotes(docs);
      })
      .catch((err) => console.error("[NurseSOAP]", err))
      .finally(() => setLoading(false));
  }, [patientId]);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const vitals: VitalSigns = {
        bloodPressure:    form.bloodPressure,
        heartRate:        Number(form.heartRate),
        temperature:      Number(form.temperature),
        respiratoryRate:  Number(form.respiratoryRate),
        oxygenSaturation: Number(form.oxygenSaturation),
        weight:           form.weight ? Number(form.weight) : undefined,
        height:           form.height ? Number(form.height) : undefined,
      };

      const note: SOAPNote = {
        id:          "",
        emrId:       patientId,
        nurseUid:    profile.uid,
        nurseName:   profile.name,
        subjective:  form.subjective,
        objective:   vitals,
        assessment:  form.assessment,
        plan:        form.plan,
        createdAt:   new Date().toISOString(),
      };

      const dataHash = await sha256(note);
      await saveSOAPNote({ ...note, blockchainTxHash: "" });

      let hash = "";
      const bcToastId = toast.loading("Memulai transaksi blockchain…");
      try {
        hash = await blockchainSubmitSOAPFull(
          patientId,
          dataHash,
          (msg) => toast.loading(msg, { id: bcToastId })
        );
        setTxHash(hash);
        toast.success("SOAP berhasil direkam di blockchain! ✅", { id: bcToastId });
      } catch (bcErr: unknown) {
        console.error("[Blockchain SOAP]", bcErr);
        const errMsg = extractErrorMessage(bcErr);
        toast.error(`⚠️ Blockchain gagal: ${errMsg}`, { id: bcToastId, duration: 12000 });
      }

      await createNotification({
        icon:        "🩺",
        title:       "SOAP Baru Disubmit",
        body:        `Perawat ${profile.name} mengisi SOAP pasien ${patient?.firstName ?? patientId}${hash ? " · Direkam di blockchain ✅" : ""}`,
        createdAt:   new Date().toISOString(),
        unread:      true,
        targetRoles: ["doctor", "admin"],
        emrId:       patientId,
        txHash:      hash || undefined,
      }).catch(() => {});

      toast.success(`SOAP untuk ${patient?.firstName} berhasil disimpan.`);
      setTimeout(() => router.push("/nurse"), 2000);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan SOAP");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner center label="Memuat data pasien…" />;
  if (!patient) return <div className="p-8 text-red-500">Pasien tidak ditemukan.</div>;

  const hasHistory = soapNotes.length > 0 || doctorNotes.length > 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title={`SOAP — ${patient.firstName} ${patient.lastName}`}
        subtitle={`${patient.emrId} · Poli ${patient.department ?? "—"}`}
      />
      <div className="p-6 max-w-4xl mx-auto space-y-4">

        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => router.back()}>
          Kembali
        </Button>

        {/* Patient info bar */}
        <Card padding="sm" className="bg-primary-50 border-primary-100">
          <div className="flex flex-wrap gap-4 text-sm">
            <span><span className="font-semibold text-primary-800">EMR:</span> <span className="font-mono text-primary-700">{patient.emrId}</span></span>
            <span><span className="font-semibold text-primary-800">KTP:</span> {patient.ktpNumber}</span>
            <span><span className="font-semibold text-primary-800">Jenis Kelamin:</span> {patient.gender}</span>
            <span><span className="font-semibold text-primary-800">Telepon:</span> {patient.phone}</span>
          </div>
        </Card>

        {/* ── Medical history ──────────────────────────────────────────────── */}
        {hasHistory && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-slate-400" /> Riwayat Rekam Medis
            </h2>

            {/* SOAP history */}
            <SOAPHistoryCard notes={soapNotes} />

            {/* Doctor notes history */}
            <DoctorHistoryCard notes={doctorNotes} />
          </div>
        )}

        {/* No history notice */}
        {!hasHistory && (
          <Card padding="sm" className="border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-400 py-5">
            Belum ada riwayat SOAP maupun catatan dokter untuk pasien ini.
          </Card>
        )}

        {/* ── SOAP Input Form ──────────────────────────────────────────────── */}
        <h2 className="text-base font-bold text-slate-700 flex items-center gap-2 pt-2">
          <Stethoscope className="w-4 h-4 text-primary-500" /> Input SOAP Baru
        </h2>

        <form onSubmit={submit} className="space-y-4">
          <Card>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary-600" /> Catatan SOAP
            </h3>
            <div className="space-y-4">
              <TextArea label="S — Subjective (Keluhan Pasien)" name="subjective" value={form.subjective}
                onChange={handle} required placeholder="Pasien mengeluh… sejak… disertai…" />
              <TextArea label="A — Assessment (Penilaian Perawat)" name="assessment" value={form.assessment}
                onChange={handle} required placeholder="Berdasarkan pengkajian..." />
              <TextArea label="P — Plan (Rencana Tindakan)" name="plan" value={form.plan}
                onChange={handle} required placeholder="Rencana asuhan keperawatan..." />
            </div>
          </Card>

          <Card>
            <h3 className="font-bold text-slate-800 mb-4">O — Objective (Tanda-Tanda Vital)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Input label="Tekanan Darah (mmHg)" name="bloodPressure" value={form.bloodPressure}
                onChange={handle} required placeholder="120/80" />
              <Input label="Denyut Jantung (bpm)" name="heartRate" value={form.heartRate}
                onChange={handle} required type="number" placeholder="80" />
              <Input label="Suhu Tubuh (°C)" name="temperature" value={form.temperature}
                onChange={handle} required type="number" step="0.1" placeholder="36.5" />
              <Input label="Laju Nafas (x/min)" name="respiratoryRate" value={form.respiratoryRate}
                onChange={handle} required type="number" placeholder="20" />
              <Input label="SpO₂ (%)" name="oxygenSaturation" value={form.oxygenSaturation}
                onChange={handle} required type="number" placeholder="98" />
              <Input label="Berat Badan (kg)" name="weight" value={form.weight}
                onChange={handle} type="number" step="0.1" placeholder="Opsional" />
              <Input label="Tinggi Badan (cm)" name="height" value={form.height}
                onChange={handle} type="number" placeholder="Opsional" />
            </div>
          </Card>

          {txHash && (
            <Card padding="sm" className="bg-green-50 border-green-100">
              <p className="text-xs text-green-700 font-semibold flex items-center gap-1.5 mb-1">
                <LinkIcon className="w-3.5 h-3.5" /> Transaksi Blockchain Berhasil
              </p>
              <p className="hash-text text-green-600">{txHash}</p>
            </Card>
          )}

          <div className="flex gap-3 justify-end pb-6">
            <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
            <Button type="submit" loading={saving} size="lg">Simpan SOAP & Rekam Blockchain</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
