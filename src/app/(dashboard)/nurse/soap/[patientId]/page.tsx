"use client";

export const dynamic = "force-dynamic";

/**
 * SOAP Input Page (Nurse)
 * Nurse fills Subjective/Objective/Assessment/Plan and vital signs.
 * On submit: saves to Firebase + hashes data + records on blockchain.
 */

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Stethoscope, Link as LinkIcon } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { getPatient, saveSOAPNote, getLatestSOAP } from "@/lib/emr";
import { blockchainSubmitSOAPFull, extractErrorMessage } from "@/lib/blockchain";
import { createNotification } from "@/lib/notifications";
import { sha256 } from "@/lib/hash";
import { useAuth } from "@/hooks/useAuth";
import type { Patient, SOAPNote, VitalSigns } from "@/types";

export default function SOAPPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router        = useRouter();
  const { profile }   = useAuth();

  const [patient, setPatient]   = useState<Patient | null>(null);
  const [lastSOAP, setLastSOAP] = useState<SOAPNote | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [txHash, setTxHash]     = useState<string>("");

  const [form, setForm] = useState({
    subjective:  "",
    assessment:  "",
    plan:        "",
    // Vital signs
    bloodPressure:    "",
    heartRate:        "",
    temperature:      "",
    respiratoryRate:  "",
    oxygenSaturation: "",
    weight:           "",
    height:           "",
  });

  useEffect(() => {
    Promise.all([getPatient(patientId), getLatestSOAP(patientId)])
      .then(([p, s]) => { setPatient(p); setLastSOAP(s); })
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

      // 1. Hash the data
      const dataHash = await sha256(note);

      // 2. Save to Firebase first
      await saveSOAPNote({ ...note, blockchainTxHash: "" });

      // 3. Record on blockchain (full flow: MetaMask → Sepolia → selfRegister → registerEMR → submit)
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

      // ── Push live notification ────────────────────────────────────────────
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

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title={`SOAP — ${patient.firstName} ${patient.lastName}`}
        subtitle={`${patient.emrId} · Poli ${patient.department ?? "—"}`}
      />
      <div className="p-6 max-w-4xl mx-auto space-y-4">

        {/* Back button */}
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

        {/* Previous SOAP (if exists) */}
        {lastSOAP && (
          <Card padding="sm" className="border-amber-100 bg-amber-50">
            <p className="text-xs font-semibold text-amber-700 mb-2">📋 SOAP Terakhir — {new Date(lastSOAP.createdAt).toLocaleString("id-ID")}</p>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div><span className="font-medium">TD:</span> {lastSOAP.objective.bloodPressure} mmHg</div>
              <div><span className="font-medium">HR:</span> {lastSOAP.objective.heartRate} bpm</div>
              <div><span className="font-medium">Suhu:</span> {lastSOAP.objective.temperature}°C</div>
              <div><span className="font-medium">RR:</span> {lastSOAP.objective.respiratoryRate} x/min</div>
            </div>
          </Card>
        )}

        <form onSubmit={submit} className="space-y-4">
          {/* SOAP text fields */}
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

          {/* Vital signs */}
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

          {/* TX Hash result */}
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
