"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ChevronLeft, ChevronDown, ChevronUp,
  User, Phone, MapPin, HeartPulse, Thermometer,
  FileText, Activity, Pill, Shield, ClipboardList,
  AlertCircle, CheckCircle, FlaskConical, Wind, Droplets,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import {
  getPatient, getAllSOAPNotes, getAllDoctorNotes,
  getPrescriptionsByEmrId, assignPatientDepartment,
  updatePatientStatus,
} from "@/lib/emr";
import {
  blockchainAssignDepartmentFull,
  getBlockchainStatus,
  extractErrorMessage,
  type BlockchainStatus,
} from "@/lib/blockchain";
import { sha256 } from "@/lib/hash";
import { BlockchainStatusPanel } from "@/components/ui/BlockchainStatusPanel";
import { useAuth } from "@/hooks/useAuth";
import type { Patient, SOAPNote, DoctorNote, Prescription, Department } from "@/types";
import { DEPARTMENTS } from "@/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

type Tab = "biodata" | "soap" | "doctor" | "resep";

export default function AdminPatientDetailPage() {
  const { emrId }  = useParams<{ emrId: string }>();
  const router     = useRouter();
  const { profile } = useAuth();

  const [patient,  setPatient]  = useState<Patient | null>(null);
  const [soaps,    setSOAPs]    = useState<SOAPNote[]>([]);
  const [notes,    setNotes]    = useState<DoctorNote[]>([]);
  const [rxList,   setRxList]   = useState<Prescription[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState<Tab>("biodata");
  const [expanded, setExpanded] = useState<string | null>(null);

  // Assign modal
  const [assignOpen,   setAssignOpen]   = useState(false);
  const [department,   setDepartment]   = useState("");
  const [assigning,    setAssigning]    = useState(false);

  // Blockchain pre-flight status
  const [bcStatus,   setBcStatus]       = useState<BlockchainStatus | null>(null);
  const [bcChecking, setBcChecking]     = useState(false);

  const openAssignModal = () => {
    setBcStatus(null);
    setAssignOpen(true);
    setBcChecking(true);
    getBlockchainStatus()
      .then(setBcStatus)
      .catch(() => setBcStatus(null))
      .finally(() => setBcChecking(false));
  };

  // Status modal
  const [statusOpen,   setStatusOpen]   = useState(false);
  const [newStatus,    setNewStatus]    = useState<Patient["status"]>("registered");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!emrId) return;
    const timer = setTimeout(() => setLoading(false), 10_000);

    const load = async () => {
      try {
        const [p, s, n, rx] = await Promise.all([
          getPatient(emrId),
          getAllSOAPNotes(emrId),
          getAllDoctorNotes(emrId),
          getPrescriptionsByEmrId(emrId),
        ]);
        setPatient(p);
        setSOAPs(s);
        setNotes(n);
        setRxList(rx);
        if (p) {
          setDepartment(p.department ?? "");
          setNewStatus(p.status);
        }
      } catch (err) {
        console.error("[AdminPatientDetail]", err);
        toast.error("Gagal memuat data pasien.");
      } finally {
        clearTimeout(timer);
        setLoading(false);
      }
    };

    load();
    return () => clearTimeout(timer);
  }, [emrId]);

  // ── Assign department ────────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!patient || !department) { toast.error("Pilih poli terlebih dahulu."); return; }
    setAssigning(true);

    // Hash the assignment data for blockchain
    const payload  = { emrId: patient.emrId, department, assignedBy: profile?.uid, timestamp: new Date().toISOString() };
    const dataHash = await sha256(payload);

    // ── Full blockchain flow with step-by-step toasts ─────────────────────
    let txHash: string | undefined;
    const blockchainToastId = toast.loading("Memulai transaksi blockchain…");
    try {
      txHash = await blockchainAssignDepartmentFull(
        patient.emrId,
        dataHash,
        (msg) => toast.loading(msg, { id: blockchainToastId })
      );
      toast.success("Transaksi blockchain berhasil! ✅", { id: blockchainToastId });
    } catch (blockchainErr: unknown) {
      console.error("[Blockchain] Assign department error:", blockchainErr);
      const errMsg = extractErrorMessage(blockchainErr);
      toast.error(`⚠️ Blockchain gagal: ${errMsg}`, { id: blockchainToastId, duration: 12000 });
      // Refresh pre-flight status
      getBlockchainStatus().then(setBcStatus).catch(() => {});
      // Don't return — still save to Firebase
    }

    // ── Always save to Firebase ────────────────────────────────────────────
    try {
      await assignPatientDepartment(patient.emrId, department as Department, txHash);
      setPatient((prev) =>
        prev ? { ...prev, department: department as Department, blockchainTxHash: txHash ?? prev.blockchainTxHash } : prev
      );
      toast.success(
        txHash
          ? `Ditugaskan ke Poli ${department} & dicatat di blockchain.`
          : `Ditugaskan ke Poli ${department} (disimpan di Firebase).`
      );
      setAssignOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan penugasan poli");
    } finally {
      setAssigning(false);
    }
  };

  // ── Update status ─────────────────────────────────────────────────────────────
  const handleStatusUpdate = async () => {
    if (!patient) return;
    setUpdatingStatus(true);
    try {
      await updatePatientStatus(patient.emrId, newStatus);
      setPatient((prev) => prev ? { ...prev, status: newStatus } : prev);
      toast.success("Status pasien berhasil diperbarui.");
      setStatusOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) return <Spinner center label="Memuat data pasien…" />;

  if (!patient) return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Detail Pasien" />
      <div className="p-6">
        <Card>
          <div className="text-center py-16">
            <AlertCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Pasien tidak ditemukan.</p>
            <p className="text-xs text-slate-400 mt-1">EMR ID: {emrId}</p>
            <Link href="/admin/patients" className="mt-4 inline-block text-sm text-primary-600 hover:underline">
              ← Kembali ke Daftar Pasien
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );

  const TABS: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "biodata", label: "Biodata",        icon: <User          className="w-4 h-4" />                    },
    { id: "soap",    label: "Catatan SOAP",   icon: <Activity      className="w-4 h-4" />, count: soaps.length  },
    { id: "doctor",  label: "Catatan Dokter", icon: <HeartPulse    className="w-4 h-4" />, count: notes.length  },
    { id: "resep",   label: "Resep",          icon: <Pill          className="w-4 h-4" />, count: rxList.length },
  ];

  const STATUS_OPTIONS: { value: Patient["status"]; label: string }[] = [
    { value: "registered",     label: "Terdaftar" },
    { value: "waiting",        label: "Menunggu" },
    { value: "assigned",       label: "Ditugaskan" },
    { value: "in_examination", label: "Sedang Diperiksa" },
    { value: "completed",      label: "Selesai" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Detail Pasien" subtitle={`EMR ID: ${patient.emrId}`} />
      <div className="p-6 space-y-5">

        {/* ── Back + Action buttons ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/patients"
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Kembali ke Daftar Pasien
          </Link>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={openAssignModal}>
              Tugaskan Poli
            </Button>
            <Button size="sm" onClick={() => setStatusOpen(true)}>
              Ubah Status
            </Button>
          </div>
        </div>

        {/* ── Identity card ── */}
        <Card className="bg-gradient-to-br from-primary-600 to-primary-800 text-white border-0">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {patient.firstName[0]}
            </div>
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "EMR ID",        value: patient.emrId,                            mono: true  },
                { label: "Nama Lengkap",  value: `${patient.firstName} ${patient.lastName}`, mono: false },
                { label: "Jenis Kelamin", value: patient.gender,                            mono: false },
                { label: "Poli / Dept.",  value: patient.department ?? "Belum ditugaskan",  mono: false },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wide">{label}</p>
                  <p className={`text-white font-semibold text-sm mt-0.5 ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={patient.status} />
              <p className="text-white/50 text-xs">
                Daftar: {format(new Date(patient.createdAt), "dd MMM yyyy", { locale: localeId })}
              </p>
            </div>
          </div>
        </Card>

        {/* ── Tabs ── */}
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

        {/* ── Tab: Biodata ── */}
        {tab === "biodata" && (
          <div className="space-y-4">
            <Card>
              <SectionTitle icon={<User className="w-4 h-4" />} title="Data Pribadi" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <InfoRow label="Nama Depan"    value={patient.firstName} />
                <InfoRow label="Nama Belakang" value={patient.lastName} />
                <InfoRow label="Jenis Kelamin" value={patient.gender} />
                <InfoRow label="No. KTP / NIK" value={patient.ktpNumber} mono />
                <InfoRow label="No. Telepon"   value={patient.phone} />
                <InfoRow label="Email"         value={patient.email} />
              </div>
            </Card>

            <Card>
              <SectionTitle icon={<MapPin className="w-4 h-4" />} title="Alamat" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <InfoRow label="Jalan"       value={patient.address.street}    className="sm:col-span-2" />
                <InfoRow label="Kelurahan"   value={patient.address.kelurahan} />
                <InfoRow label="Kecamatan"   value={patient.address.kecamatan} />
                <InfoRow label="Kota"        value={patient.address.kota} />
                <InfoRow label="Kode Pos"    value={patient.address.kodePos} />
              </div>
            </Card>

            <Card>
              <SectionTitle icon={<Phone className="w-4 h-4" />} title="Kontak Darurat" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <InfoRow label="Nama"        value={patient.emergencyContact?.name  ?? "—"} />
                <InfoRow label="No. Telepon" value={patient.emergencyContact?.phone ?? "—"} />
              </div>
            </Card>

            {patient.blockchainTxHash && (
              <Card>
                <SectionTitle icon={<Shield className="w-4 h-4" />} title="Info Blockchain" />
                <div className="mt-3 space-y-2">
                  <InfoRow label="TX Hash" value={patient.blockchainTxHash} mono />
                </div>
              </Card>
            )}
          </div>
        )}

        {/* ── Tab: SOAP ── */}
        {tab === "soap" && (
          <div className="space-y-4">
            {soaps.length === 0 ? (
              <Card><EmptyState icon={<Activity className="w-10 h-10" />} msg="Belum ada catatan SOAP." /></Card>
            ) : soaps.map((s, i) => (
              <Card key={i} className="p-0 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 text-left"
                  onClick={() => setExpanded(expanded === `soap-${i}` ? null : `soap-${i}`)}
                >
                  <div>
                    <p className="font-bold text-slate-800">{s.nurseName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {format(new Date(s.createdAt), "dd MMMM yyyy, HH:mm", { locale: localeId })}
                    </p>
                  </div>
                  {expanded === `soap-${i}`
                    ? <ChevronUp   className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </button>
                {expanded === `soap-${i}` && (
                  <div className="border-t border-slate-100 px-5 py-5 space-y-4">
                    <VitalGrid vitals={[
                      { label: "TD",   value: s.objective.bloodPressure + " mmHg" },
                      { label: "Nadi", value: s.objective.heartRate + " bpm" },
                      { label: "Suhu", value: s.objective.temperature + " °C" },
                      { label: "BB",   value: s.objective.weight + " kg" },
                      { label: "SpO₂", value: s.objective.oxygenSaturation + "%" },
                    ]} color="teal" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InfoBlock label="Subjektif"  value={s.subjective} />
                      <InfoBlock label="Assessment" value={s.assessment} />
                      <InfoBlock label="Plan"       value={s.plan} className="sm:col-span-2" />
                    </div>
                    {s.blockchainTxHash && <HashBlock hash={s.blockchainTxHash} />}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* ── Tab: Catatan Dokter ── */}
        {tab === "doctor" && (
          <div className="space-y-4">
            {notes.length === 0 ? (
              <Card><EmptyState icon={<HeartPulse className="w-10 h-10" />} msg="Belum ada catatan dokter." /></Card>
            ) : notes.map((n, i) => (
              <Card key={i} className="p-0 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 text-left"
                  onClick={() => setExpanded(expanded === `doc-${i}` ? null : `doc-${i}`)}
                >
                  <div>
                    <p className="font-bold text-slate-800">{n.workingDiagnosis}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">{n.doctorName}</span>
                      <span className="text-slate-200">·</span>
                      <span className="text-xs text-slate-400">
                        {format(new Date(n.createdAt), "dd MMMM yyyy, HH:mm", { locale: localeId })}
                      </span>
                    </div>
                  </div>
                  {expanded === `doc-${i}`
                    ? <ChevronUp   className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </button>
                {expanded === `doc-${i}` && (
                  <div className="border-t border-slate-100 px-5 py-5 space-y-5">
                    <VitalGrid vitals={[
                      { label: "TD",   value: n.vitalSigns.bloodPressure + " mmHg" },
                      { label: "Nadi", value: n.vitalSigns.heartRate + " bpm" },
                      { label: "Suhu", value: n.vitalSigns.temperature + " °C" },
                      { label: "RR",   value: n.vitalSigns.respiratoryRate + "x/mnt" },
                      { label: "SpO₂", value: n.vitalSigns.oxygenSaturation + "%" },
                    ]} color="blue" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InfoBlock label="Keluhan Utama"         value={n.chiefComplaint} />
                      <InfoBlock label="Riwayat Penyakit"      value={n.historyPresentIllness} />
                      <InfoBlock label="Riwayat Penyakit Lalu" value={n.pastMedicalHistory || "Tidak ada"} />
                      <InfoBlock label="Alergi"                value={n.allergy || "Tidak ada"} />
                    </div>
                    {n.physicalExamination && (
                      <InfoBlock label="Pemeriksaan Fisik" value={n.physicalExamination} />
                    )}
                    {n.supportingExams?.length > 0 && (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Pemeriksaan Penunjang</p>
                        <div className="space-y-2">
                          {n.supportingExams.map((ex: any, j: number) => (
                            <div key={j} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3 text-sm">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <InfoBlock label="Diagnosis Kerja"   value={n.workingDiagnosis}      highlight />
                      <InfoBlock label="Diagnosis Banding" value={n.differentialDiagnosis || "—"} />
                      <InfoBlock label="Rencana Tatalaksana" value={n.managementPlan}      className="sm:col-span-2" />
                    </div>
                    {n.blockchainTxHash && <HashBlock hash={n.blockchainTxHash} />}
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
              <Card><EmptyState icon={<Pill className="w-10 h-10" />} msg="Belum ada resep." /></Card>
            ) : rxList.map((rx, i) => (
              <Card key={i}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-bold text-slate-800">{rx.doctorName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {format(new Date(rx.createdAt), "dd MMMM yyyy", { locale: localeId })}
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
                  {rx.medications.map((med: any, j: number) => (
                    <div key={j} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3">
                      <div className="w-7 h-7 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Pill className="w-3.5 h-3.5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{med.name}</p>
                        <div className="flex flex-wrap gap-x-3 text-xs text-slate-500 mt-0.5">
                          <span>{med.dose}</span>
                          <span>{med.frequency}</span>
                          <span>{med.duration}</span>
                        </div>
                        {med.notes && <p className="text-xs text-slate-400 mt-0.5 italic">{med.notes}</p>}
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

      </div>

      {/* ── Assign Department Modal ── */}
      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Tugaskan Poli"
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Batal</Button>
            <Button onClick={handleAssign} loading={assigning}>Simpan & Rekam di Blockchain</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-3 text-sm space-y-1">
            <p><span className="font-semibold">Pasien:</span> {patient.firstName} {patient.lastName}</p>
            <p><span className="font-semibold">EMR ID:</span> {patient.emrId}</p>
            <p><span className="font-semibold">Poli Saat Ini:</span> {patient.department ?? "—"}</p>
          </div>
          <Select
            label="Pilih Departemen / Poli"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
            required
          />
          <BlockchainStatusPanel status={bcStatus} loading={bcChecking} />
        </div>
      </Modal>

      {/* ── Update Status Modal ── */}
      <Modal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Ubah Status Pasien"
        footer={
          <>
            <Button variant="outline" onClick={() => setStatusOpen(false)}>Batal</Button>
            <Button onClick={handleStatusUpdate} loading={updatingStatus}>Simpan</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-xl p-3 text-sm">
            <p><span className="font-semibold">Status Saat Ini:</span></p>
            <div className="mt-1"><StatusBadge status={patient.status} /></div>
          </div>
          <Select
            label="Status Baru"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value as Patient["status"])}
            options={STATUS_OPTIONS}
            required
          />
        </div>
      </Modal>
    </div>
  );
}

// ── Shared helper components ──────────────────────────────────────────────────

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-700 mb-1">
      <span className="text-slate-400">{icon}</span>
      <span className="text-sm font-bold uppercase tracking-wide">{title}</span>
    </div>
  );
}

function InfoRow({ label, value, mono = false, className = "" }: {
  label: string; value: string; mono?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
      <p className={`text-sm text-slate-800 font-semibold break-all ${mono ? "font-mono text-xs bg-slate-50 px-2 py-1 rounded-lg" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}

function InfoBlock({ label, value, highlight = false, className = "" }: {
  label: string; value: string; highlight?: boolean; className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm leading-relaxed ${highlight ? "font-bold text-primary-700" : "text-slate-700"}`}>{value}</p>
    </div>
  );
}

function VitalGrid({ vitals, color }: { vitals: { label: string; value: string }[]; color: "blue" | "teal" }) {
  const bg = color === "blue" ? "bg-blue-50" : "bg-teal-50";
  return (
    <div className={`grid grid-cols-3 sm:grid-cols-5 gap-2`}>
      {vitals.map((v) => (
        <div key={v.label} className={`${bg} rounded-xl p-2.5 text-center`}>
          <p className="text-xs font-bold text-slate-800">{v.value}</p>
          <p className="text-[10px] text-slate-400">{v.label}</p>
        </div>
      ))}
    </div>
  );
}

function HashBlock({ hash }: { hash: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">TX Hash Blockchain</p>
      <p className="hash-text">{hash}</p>
    </div>
  );
}

function EmptyState({ icon, msg }: { icon: React.ReactNode; msg: string }) {
  return (
    <div className="text-center py-12">
      <div className="text-slate-200 flex justify-center mb-3">{icon}</div>
      <p className="text-slate-500 font-medium">{msg}</p>
    </div>
  );
}
