"use client";

export const dynamic = "force-dynamic";

/**
 * Doctor — Edit Doctor Note
 * Pre-fills form with existing note data; on submit, updates Firebase
 * and records a new blockchain transaction for the update.
 */

import { safeFormat } from "@/lib/dateUtils";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Plus, Trash2, FlaskConical, Link as LinkIcon, Pencil } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextArea, Select } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { getPatient, getDoctorNote, updateDoctorNote, addDoctorNoteBlockchainTrail } from "@/lib/emr";
import { blockchainSubmitDoctorNoteFull, extractErrorMessage } from "@/lib/blockchain";
import { createNotification } from "@/lib/notifications";
import { sha256 } from "@/lib/hash";
import { useAuth } from "@/hooks/useAuth";
import type { Patient, DoctorNote, SupportingExam, MedicationItem, VitalSigns } from "@/types";

const EMPTY_EXAM: SupportingExam = { type: "Lab", name: "", result: "", date: new Date().toISOString().slice(0, 10) };
const EMPTY_MED: MedicationItem  = { name: "", dose: "", frequency: "", duration: "", notes: "" };

export default function EditDoctorNotePage() {
  const { patientId, noteId } = useParams<{ patientId: string; noteId: string }>();
  const router   = useRouter();
  const { profile } = useAuth();

  const [patient,  setPatient]  = useState<Patient | null>(null);
  const [original, setOriginal] = useState<DoctorNote | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [txHash,   setTxHash]   = useState("");

  const [form, setForm] = useState({
    chiefComplaint:        "",
    historyPresentIllness: "",
    pastMedicalHistory:    "",
    surgicalHistory:       "",
    medicationHistory:     "",
    allergy:               "",
    physicalExamination:   "",
    workingDiagnosis:      "",
    differentialDiagnosis: "",
    managementPlan:        "",
  });
  const [vitals, setVitals] = useState<VitalSigns>({
    bloodPressure: "", heartRate: 0, temperature: 0, respiratoryRate: 0, oxygenSaturation: 0,
  });
  const [supportingExams, setSupportingExams] = useState<SupportingExam[]>([]);
  const [medications,     setMedications]     = useState<MedicationItem[]>([]);

  useEffect(() => {
    Promise.all([getPatient(patientId), getDoctorNote(patientId, noteId)])
      .then(([p, note]) => {
        setPatient(p);
        if (note) {
          setOriginal(note);
          setForm({
            chiefComplaint:        note.chiefComplaint,
            historyPresentIllness: note.historyPresentIllness,
            pastMedicalHistory:    note.pastMedicalHistory,
            surgicalHistory:       note.surgicalHistory,
            medicationHistory:     note.medicationHistory,
            allergy:               note.allergy,
            physicalExamination:   note.physicalExamination,
            workingDiagnosis:      note.workingDiagnosis,
            differentialDiagnosis: note.differentialDiagnosis,
            managementPlan:        note.managementPlan,
          });
          setVitals(note.vitalSigns);
          setSupportingExams(note.supportingExams ?? []);
          setMedications(note.prescription?.medications ?? []);
        }
      })
      .catch((err) => console.error("[EditDoctorNote]", err))
      .finally(() => setLoading(false));
  }, [patientId, noteId]);

  const handle      = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const handleVital = (e: React.ChangeEvent<HTMLInputElement>) =>
    setVitals({ ...vitals, [e.target.name]: e.target.value });

  const addExam    = () => setSupportingExams([...supportingExams, { ...EMPTY_EXAM }]);
  const removeExam = (i: number) => setSupportingExams(supportingExams.filter((_, idx) => idx !== i));
  const updateExam = (i: number, field: keyof SupportingExam, val: string) =>
    setSupportingExams(supportingExams.map((e, idx) => idx === i ? { ...e, [field]: val } : e));

  const addMed    = () => setMedications([...medications, { ...EMPTY_MED }]);
  const removeMed = (i: number) => setMedications(medications.filter((_, idx) => idx !== i));
  const updateMed = (i: number, field: keyof MedicationItem, val: string) =>
    setMedications(medications.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !patient || !original) return;
    if (!form.workingDiagnosis.trim()) { toast.error("Diagnosis utama wajib diisi."); return; }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const updated: DoctorNote = {
        ...original,
        doctorUid:             profile.uid,
        doctorName:            profile.name,
        chiefComplaint:        form.chiefComplaint,
        historyPresentIllness: form.historyPresentIllness,
        pastMedicalHistory:    form.pastMedicalHistory,
        surgicalHistory:       form.surgicalHistory,
        medicationHistory:     form.medicationHistory,
        allergy:               form.allergy,
        vitalSigns:            vitals,
        physicalExamination:   form.physicalExamination,
        supportingExams:       supportingExams,
        workingDiagnosis:      form.workingDiagnosis,
        differentialDiagnosis: form.differentialDiagnosis,
        managementPlan:        form.managementPlan,
        updatedAt:             now,
      };

      // Hash updated data
      const dataHash = await sha256(updated);

      // 1. Update Firebase document
      await updateDoctorNote(patientId, noteId, {
        doctorUid:             profile.uid,
        doctorName:            profile.name,
        chiefComplaint:        form.chiefComplaint,
        historyPresentIllness: form.historyPresentIllness,
        pastMedicalHistory:    form.pastMedicalHistory,
        surgicalHistory:       form.surgicalHistory,
        medicationHistory:     form.medicationHistory,
        allergy:               form.allergy,
        vitalSigns:            vitals,
        physicalExamination:   form.physicalExamination,
        supportingExams:       supportingExams,
        workingDiagnosis:      form.workingDiagnosis,
        differentialDiagnosis: form.differentialDiagnosis,
        managementPlan:        form.managementPlan,
      });

      // 2. New blockchain transaction for the update
      let hash = "";
      const bcToastId = toast.loading("Merekam pembaruan di blockchain…");
      try {
        hash = await blockchainSubmitDoctorNoteFull(
          patientId,
          dataHash,
          (msg) => toast.loading(msg, { id: bcToastId })
        );
        setTxHash(hash);
        toast.success("Pembaruan catatan dokter direkam di blockchain! ✅", { id: bcToastId });
        // Record blockchain trail for the update
        await addDoctorNoteBlockchainTrail(patientId, noteId, {
          txHash:    hash,
          timestamp: new Date().toISOString(),
          action:    "updated",
          actorName: profile.name,
        });
      } catch (bcErr: unknown) {
        console.error("[Blockchain EditDoctorNote]", bcErr);
        toast.error(`⚠️ Blockchain gagal: ${extractErrorMessage(bcErr)}`, { id: bcToastId, duration: 12000 });
      }

      // 3. Notification
      await createNotification({
        icon:        "✏️",
        title:       "Catatan Dokter Diperbarui",
        body:        `Dr. ${profile.name} memperbarui catatan untuk ${patient.firstName}${hash ? " · Blockchain ✅" : ""}`,
        createdAt:   new Date().toISOString(),
        unread:      true,
        targetRoles: ["admin", "nurse"],
        emrId:       patientId,
        txHash:      hash || undefined,
      }).catch(() => {});

      toast.success("Catatan dokter berhasil diperbarui!");
      setTimeout(() => router.push(`/doctor/records/${patientId}`), 1800);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui catatan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner center label="Memuat catatan dokter…" />;
  if (!patient || !original) return <div className="p-8 text-red-500">Data tidak ditemukan.</div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title={`Edit Catatan — ${patient.firstName} ${patient.lastName}`}
        subtitle={`${patient.emrId} · ${patient.department ?? "—"}`}
      />
      <div className="p-6 max-w-5xl mx-auto space-y-4">

        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => router.back()}>
          Kembali
        </Button>

        {/* Original entry info */}
        <Card padding="sm" className="bg-primary-50 border-primary-100">
          <div className="flex items-center gap-2 text-sm text-primary-800">
            <Pencil className="w-4 h-4 flex-shrink-0" />
            <span>
              <b>Mengedit catatan</b> yang diinput pada{" "}
              <b>{safeFormat(original.createdAt, "dd MMM yyyy · HH:mm")}</b>
              {" "}oleh <b>Dr. {original.doctorName}</b>
            </span>
          </div>
        </Card>

        <form onSubmit={submit} className="space-y-4">

          {/* Anamnesis */}
          <Card>
            <h3 className="font-bold text-slate-800 mb-4">📝 Anamnesis</h3>
            <div className="space-y-3">
              <TextArea label="Keluhan Utama" name="chiefComplaint" value={form.chiefComplaint} onChange={handle} required />
              <TextArea label="Riwayat Penyakit Sekarang" name="historyPresentIllness" value={form.historyPresentIllness} onChange={handle} />
              <div className="grid grid-cols-2 gap-3">
                <TextArea label="Riwayat Penyakit Dahulu" name="pastMedicalHistory" value={form.pastMedicalHistory} onChange={handle} />
                <TextArea label="Riwayat Operasi" name="surgicalHistory" value={form.surgicalHistory} onChange={handle} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TextArea label="Riwayat Obat-obatan" name="medicationHistory" value={form.medicationHistory} onChange={handle} />
                <Input label="Alergi" name="allergy" value={form.allergy} onChange={handle} placeholder="Tidak ada / Penisilin / dll" />
              </div>
            </div>
          </Card>

          {/* Vitals */}
          <Card>
            <h3 className="font-bold text-slate-800 mb-4">🩺 Tanda-Tanda Vital</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Input label="Tekanan Darah" name="bloodPressure" value={vitals.bloodPressure as string} onChange={handleVital} placeholder="120/80" />
              <Input label="Denyut Jantung" name="heartRate" value={String(vitals.heartRate)} onChange={handleVital} type="number" />
              <Input label="Suhu (°C)" name="temperature" value={String(vitals.temperature)} onChange={handleVital} type="number" step="0.1" />
              <Input label="Laju Nafas" name="respiratoryRate" value={String(vitals.respiratoryRate)} onChange={handleVital} type="number" />
              <Input label="SpO₂ (%)" name="oxygenSaturation" value={String(vitals.oxygenSaturation)} onChange={handleVital} type="number" />
            </div>
          </Card>

          {/* Physical exam */}
          <Card>
            <h3 className="font-bold text-slate-800 mb-4">🔍 Pemeriksaan Fisik</h3>
            <TextArea label="Temuan Pemeriksaan Fisik" name="physicalExamination"
              value={form.physicalExamination} onChange={handle} className="min-h-[120px]" />
          </Card>

          {/* Supporting exams */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">🧪 Pemeriksaan Penunjang</h3>
              <Button size="sm" variant="outline" icon={<Plus className="w-4 h-4" />} type="button" onClick={addExam}>Tambah</Button>
            </div>
            {supportingExams.length === 0 && (
              <p className="text-slate-400 text-sm">Klik "Tambah" untuk menambahkan pemeriksaan Lab / Radiologi.</p>
            )}
            {supportingExams.map((ex, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 mb-2 items-end">
                <Select label="Jenis" value={ex.type} onChange={(e) => updateExam(i, "type", e.target.value)}
                  options={[
                    { value: "Lab",       label: "Lab" },
                    { value: "Radiology", label: "Radiologi" },
                    { value: "ECG",       label: "EKG" },
                    { value: "USG",       label: "USG" },
                    { value: "Other",     label: "Lainnya" },
                  ]} />
                <Input label="Nama" value={ex.name}   onChange={(e) => updateExam(i, "name",   e.target.value)} />
                <Input label="Hasil" value={ex.result} onChange={(e) => updateExam(i, "result", e.target.value)} />
                <Input label="Tanggal" type="date" value={ex.date} onChange={(e) => updateExam(i, "date", e.target.value)} />
                <Button size="sm" variant="danger" type="button" icon={<Trash2 className="w-4 h-4" />} onClick={() => removeExam(i)}>Hapus</Button>
              </div>
            ))}
          </Card>

          {/* Diagnosis */}
          <Card>
            <h3 className="font-bold text-slate-800 mb-4">🏷️ Diagnosis</h3>
            <div className="space-y-3">
              <Input label="Diagnosis Kerja (Working Diagnosis)" name="workingDiagnosis"
                value={form.workingDiagnosis} onChange={handle} required placeholder="mis. Hipertensi esensial (I10)" />
              <TextArea label="Diagnosis Banding" name="differentialDiagnosis"
                value={form.differentialDiagnosis} onChange={handle} />
            </div>
          </Card>

          {/* Management */}
          <Card>
            <h3 className="font-bold text-slate-800 mb-4">📋 Rencana Tatalaksana</h3>
            <TextArea label="Rencana Tatalaksana & Instruksi" name="managementPlan"
              value={form.managementPlan} onChange={handle} required className="min-h-[100px]" />
          </Card>

          {/* Prescription */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800">💊 Resep Obat</h3>
              <Button size="sm" variant="outline" icon={<Plus className="w-4 h-4" />} type="button" onClick={addMed}>Tambah Obat</Button>
            </div>
            {medications.length === 0 && (
              <p className="text-slate-400 text-sm">Tambahkan obat jika diperlukan.</p>
            )}
            {medications.map((med, i) => (
              <div key={i} className="grid grid-cols-6 gap-2 mb-2 items-end">
                <div className="col-span-2">
                  <Input label="Nama Obat" value={med.name} onChange={(e) => updateMed(i, "name", e.target.value)} />
                </div>
                <Input label="Dosis"      value={med.dose}      onChange={(e) => updateMed(i, "dose",      e.target.value)} placeholder="500mg" />
                <Input label="Frekuensi"  value={med.frequency} onChange={(e) => updateMed(i, "frequency", e.target.value)} placeholder="3x sehari" />
                <Input label="Durasi"     value={med.duration}  onChange={(e) => updateMed(i, "duration",  e.target.value)} placeholder="7 hari" />
                <Button size="sm" variant="danger" type="button" icon={<Trash2 className="w-4 h-4" />} onClick={() => removeMed(i)}>Hapus</Button>
              </div>
            ))}
          </Card>

          {txHash && (
            <Card padding="sm" className="bg-green-50 border-green-100">
              <p className="text-xs text-green-700 font-semibold flex items-center gap-1.5 mb-1">
                <LinkIcon className="w-3.5 h-3.5" /> Transaksi Blockchain (Update)
              </p>
              <p className="hash-text text-green-600">{txHash}</p>
            </Card>
          )}

          <div className="flex justify-end gap-3 pb-8">
            <Button type="button" variant="outline" onClick={() => router.back()}>Batal</Button>
            <Button type="submit" loading={saving} size="lg" icon={<Pencil className="w-4 h-4" />}>
              Simpan Perubahan & Rekam Blockchain
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
