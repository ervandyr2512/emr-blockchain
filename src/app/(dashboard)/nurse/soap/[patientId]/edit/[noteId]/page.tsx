"use client";

export const dynamic = "force-dynamic";

/**
 * Nurse — Edit SOAP Note
 * Pre-fills form with existing SOAP data; on submit, updates Firebase
 * and records a new blockchain transaction for the update.
 */

import { safeFormat } from "@/lib/dateUtils";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Stethoscope, Link as LinkIcon, Pencil } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { getPatient, getSOAPNote, updateSOAPNote, addSOAPBlockchainTrail } from "@/lib/emr";
import { blockchainSubmitSOAPFull, extractErrorMessage } from "@/lib/blockchain";
import { createNotification } from "@/lib/notifications";
import { sha256 } from "@/lib/hash";
import { useAuth } from "@/hooks/useAuth";
import type { Patient, SOAPNote, VitalSigns } from "@/types";

export default function EditSOAPPage() {
  const { patientId, noteId } = useParams<{ patientId: string; noteId: string }>();
  const router   = useRouter();
  const { profile } = useAuth();

  const [patient,  setPatient]  = useState<Patient | null>(null);
  const [original, setOriginal] = useState<SOAPNote | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [txHash,   setTxHash]   = useState("");

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
    Promise.all([getPatient(patientId), getSOAPNote(patientId, noteId)])
      .then(([p, note]) => {
        setPatient(p);
        if (note) {
          setOriginal(note);
          setForm({
            subjective:       note.subjective,
            assessment:       note.assessment,
            plan:             note.plan,
            bloodPressure:    note.objective.bloodPressure,
            heartRate:        String(note.objective.heartRate),
            temperature:      String(note.objective.temperature),
            respiratoryRate:  String(note.objective.respiratoryRate),
            oxygenSaturation: String(note.objective.oxygenSaturation),
            weight:           note.objective.weight ? String(note.objective.weight) : "",
            height:           note.objective.height ? String(note.objective.height) : "",
          });
        }
      })
      .catch((err) => console.error("[EditSOAP]", err))
      .finally(() => setLoading(false));
  }, [patientId, noteId]);

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !original) return;
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

      const updated: SOAPNote = {
        ...original,
        subjective: form.subjective,
        objective:  vitals,
        assessment: form.assessment,
        plan:       form.plan,
        nurseUid:   profile.uid,
        nurseName:  profile.name,
      };

      // Hash updated data
      const dataHash = await sha256(updated);

      // 1. Update Firebase document
      await updateSOAPNote(patientId, noteId, {
        subjective: updated.subjective,
        objective:  updated.objective,
        assessment: updated.assessment,
        plan:       updated.plan,
        nurseUid:   profile.uid,
        nurseName:  profile.name,
      });

      // 2. New blockchain transaction for the update
      let hash = "";
      const bcToastId = toast.loading("Merekam pembaruan di blockchain…");
      try {
        hash = await blockchainSubmitSOAPFull(
          patientId,
          dataHash,
          (msg) => toast.loading(msg, { id: bcToastId })
        );
        setTxHash(hash);
        toast.success("Pembaruan SOAP direkam di blockchain! ✅", { id: bcToastId });
        // Record blockchain trail for the update
        await addSOAPBlockchainTrail(patientId, noteId, {
          txHash:    hash,
          timestamp: new Date().toISOString(),
          action:    "updated",
          actorName: profile.name,
        });
      } catch (bcErr: unknown) {
        console.error("[Blockchain EditSOAP]", bcErr);
        toast.error(`⚠️ Blockchain gagal: ${extractErrorMessage(bcErr)}`, { id: bcToastId, duration: 12000 });
      }

      // 3. Notification
      await createNotification({
        icon:        "✏️",
        title:       "SOAP Diperbarui",
        body:        `Perawat ${profile.name} memperbarui SOAP pasien ${patient?.firstName ?? patientId}${hash ? " · Blockchain ✅" : ""}`,
        createdAt:   new Date().toISOString(),
        unread:      true,
        targetRoles: ["doctor", "admin"],
        emrId:       patientId,
        txHash:      hash || undefined,
      }).catch(() => {});

      toast.success("SOAP berhasil diperbarui!");
      setTimeout(() => router.push(`/nurse/records/${patientId}`), 1800);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui SOAP");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner center label="Memuat data SOAP…" />;
  if (!patient || !original) return <div className="p-8 text-red-500">Data tidak ditemukan.</div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title={`Edit SOAP — ${patient.firstName} ${patient.lastName}`}
        subtitle={`${patient.emrId} · Poli ${patient.department ?? "—"}`}
      />
      <div className="p-6 max-w-4xl mx-auto space-y-4">

        <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => router.back()}>
          Kembali
        </Button>

        {/* Original entry info */}
        <Card padding="sm" className="bg-amber-50 border-amber-100">
          <div className="flex items-center gap-2 text-sm text-amber-800">
            <Pencil className="w-4 h-4 flex-shrink-0" />
            <span>
              <b>Mengedit SOAP</b> yang diinput pada{" "}
              <b>{safeFormat(original.createdAt, "dd MMM yyyy · HH:mm")}</b>
              {" "}oleh <b>{original.nurseName}</b>
            </span>
          </div>
        </Card>

        <form onSubmit={submit} className="space-y-4">
          {/* SOAP text */}
          <Card>
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary-600" /> Catatan SOAP
            </h3>
            <div className="space-y-4">
              <TextArea label="S — Subjective (Keluhan Pasien)" name="subjective"
                value={form.subjective} onChange={handle} required
                placeholder="Pasien mengeluh… sejak… disertai…" />
              <TextArea label="A — Assessment (Penilaian Perawat)" name="assessment"
                value={form.assessment} onChange={handle} required
                placeholder="Berdasarkan pengkajian..." />
              <TextArea label="P — Plan (Rencana Tindakan)" name="plan"
                value={form.plan} onChange={handle} required
                placeholder="Rencana asuhan keperawatan..." />
            </div>
          </Card>

          {/* Vitals */}
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
                <LinkIcon className="w-3.5 h-3.5" /> Transaksi Blockchain (Update)
              </p>
              <p className="hash-text text-green-600">{txHash}</p>
            </Card>
          )}

          <div className="flex gap-3 justify-end pb-6">
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
