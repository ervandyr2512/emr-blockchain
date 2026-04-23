"use client";

export const dynamic = "force-dynamic";

/**
 * Nurse — View-Only Medical Records
 * Shows complete medical history for a patient without any edit form.
 */

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ClipboardList, FilePlus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { StatusBadge } from "@/components/ui/Badge";
import {
  SOAPHistoryCard,
  DoctorHistoryCard,
  PrescriptionHistoryCard,
} from "@/components/ui/MedicalHistoryCards";
import {
  getPatient,
  getAllSOAPNotes,
  getAllDoctorNotes,
  getPrescriptionsByEmrId,
} from "@/lib/emr";
import type { Patient, SOAPNote, DoctorNote, Prescription } from "@/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function NurseRecordsPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const router        = useRouter();

  const [patient,       setPatient]       = useState<Patient | null>(null);
  const [soapNotes,     setSOAPNotes]     = useState<SOAPNote[]>([]);
  const [doctorNotes,   setDoctorNotes]   = useState<DoctorNote[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      getPatient(patientId),
      getAllSOAPNotes(patientId),
      getAllDoctorNotes(patientId),
      getPrescriptionsByEmrId(patientId),
    ])
      .then(([p, soaps, docs, rxs]) => {
        setPatient(p);
        setSOAPNotes(soaps);
        setDoctorNotes(docs);
        setPrescriptions(rxs);
      })
      .catch((err) => console.error("[NurseRecords]", err))
      .finally(() => setLoading(false));
  }, [patientId]);

  if (loading) return <Spinner center label="Memuat rekam medis…" />;
  if (!patient) return <div className="p-8 text-red-500">Pasien tidak ditemukan.</div>;

  const hasHistory = soapNotes.length > 0 || doctorNotes.length > 0 || prescriptions.length > 0;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title={`Rekam Medis — ${patient.firstName} ${patient.lastName}`}
        subtitle={`${patient.emrId} · Poli ${patient.department ?? "—"}`}
      />
      <div className="p-6 max-w-4xl mx-auto space-y-4">

        {/* Nav */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => router.back()}>
            Kembali
          </Button>
          <Link href={`/nurse/soap/${patientId}`}>
            <Button variant="secondary" icon={<FilePlus className="w-4 h-4" />} size="sm">
              Input SOAP Baru
            </Button>
          </Link>
        </div>

        {/* Patient info */}
        <Card padding="sm" className="bg-primary-50 border-primary-100">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            <span><span className="font-semibold text-primary-800">EMR:</span> <span className="font-mono text-primary-700">{patient.emrId}</span></span>
            <span><span className="font-semibold text-primary-800">Nama:</span> {patient.firstName} {patient.lastName}</span>
            <span><span className="font-semibold text-primary-800">KTP:</span> {patient.ktpNumber}</span>
            <span><span className="font-semibold text-primary-800">Jenis Kelamin:</span> {patient.gender}</span>
            <span><span className="font-semibold text-primary-800">Telepon:</span> {patient.phone}</span>
            <span><span className="font-semibold text-primary-800">Poli:</span> {patient.department ?? "—"}</span>
            <span>
              <span className="font-semibold text-primary-800">Status:</span>{" "}
              <StatusBadge status={patient.status} />
            </span>
            <span>
              <span className="font-semibold text-primary-800">Terdaftar:</span>{" "}
              {format(new Date(patient.createdAt), "dd MMM yyyy", { locale: localeId })}
            </span>
          </div>
        </Card>

        {/* History sections */}
        {hasHistory ? (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-slate-400" /> Riwayat Rekam Medis
            </h2>
            <SOAPHistoryCard         notes={soapNotes} />
            <DoctorHistoryCard       notes={doctorNotes} />
            <PrescriptionHistoryCard prescriptions={prescriptions} />
          </div>
        ) : (
          <Card padding="sm" className="border-dashed border-slate-200 bg-slate-50 text-center text-sm text-slate-400 py-10">
            <ClipboardList className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Belum ada riwayat rekam medis untuk pasien ini.
          </Card>
        )}
      </div>
    </div>
  );
}
