"use client";

export const dynamic = "force-dynamic";

import { safeFormat } from "@/lib/dateUtils";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText, Activity, Shield, ArrowRight,
  HeartPulse, Pill, Calendar, CheckCircle,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { StatCard, Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { getPatientByUid, getAllSOAPNotes, getAllDoctorNotes } from "@/lib/emr";
import type { Patient, SOAPNote, DoctorNote } from "@/types";

export default function PatientDashboard() {
  const { user, profile }  = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [soaps,   setSOAPs]   = useState<SOAPNote[]>([]);
  const [notes,   setNotes]   = useState<DoctorNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => setLoading(false), 10_000);

    const load = async () => {
      try {
        const p = await getPatientByUid(user.uid);
        setPatient(p);
        if (p) {
          const [s, n] = await Promise.all([
            getAllSOAPNotes(p.emrId),
            getAllDoctorNotes(p.emrId),
          ]);
          setSOAPs(s);
          setNotes(n);
        }
      } catch (err) {
        console.error("[PatientDashboard]", err);
      } finally {
        clearTimeout(timer);
        setLoading(false);
      }
    };

    load();
    return () => clearTimeout(timer);
  }, [user]);

  if (loading) return <Spinner center label="Memuat dashboard…" />;

  const latestNote  = notes[0]  ?? null;
  const latestSOAP  = soaps[0]  ?? null;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header
        title={`Halo, ${profile?.name ?? "Pasien"} 👋`}
        subtitle="Selamat datang di portal kesehatan Anda"
      />
      <div className="p-6 space-y-6">

        {patient ? (
          <>
            {/* ── Identity card ── */}
            <Card className="bg-gradient-to-br from-primary-600 to-primary-800 text-white border-0">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0">
                  {patient.firstName[0]}
                </div>
                <div className="flex-1">
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-0.5">EMR ID</p>
                  <p className="text-lg font-bold font-mono">{patient.emrId}</p>
                  <p className="text-white/80 text-sm mt-0.5">
                    {patient.firstName} {patient.lastName} · {patient.gender}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge status={patient.status} />
                  {patient.department && (
                    <p className="text-white/60 text-xs">Poli: {patient.department}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* ── Stats ── */}
            <div className="dashboard-grid">
              <StatCard
                title="Catatan SOAP"
                value={soaps.length}
                icon={<Activity className="w-6 h-6" />}
                color="teal"
                subtitle="Dari perawat"
              />
              <StatCard
                title="Pemeriksaan Dokter"
                value={notes.length}
                icon={<FileText className="w-6 h-6" />}
                color="blue"
                subtitle="Diagnosis & tatalaksana"
              />
              <StatCard
                title="Status Akun"
                value="Aktif"
                icon={<CheckCircle className="w-6 h-6" />}
                color="green"
                subtitle="Email terverifikasi"
              />
            </div>

            {/* ── Quick access ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link
                href="/patient/emr"
                className="group flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-primary-200 transition-all"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition-colors flex-shrink-0">
                  <FileText className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">Rekam Medis Saya</p>
                  <p className="text-xs text-slate-400 mt-0.5">Lihat semua catatan medis, diagnosis, dan resep</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
              </Link>

              <Link
                href="/profile?tab=security"
                className="group flex items-center gap-4 p-5 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-teal-200 transition-all"
              >
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center group-hover:bg-teal-100 transition-colors flex-shrink-0">
                  <Shield className="w-6 h-6 text-teal-600" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-800">Keamanan Akun</p>
                  <p className="text-xs text-slate-400 mt-0.5">Kelola password dan keamanan akun Anda</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
              </Link>
            </div>

            {/* ── Recent activity ── */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Aktivitas Terbaru</h3>
                <Link
                  href="/patient/emr"
                  className="text-xs text-primary-600 hover:underline font-semibold flex items-center gap-1"
                >
                  Lihat Semua <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {latestNote || latestSOAP ? (
                <div className="space-y-3">
                  {latestNote && (
                    <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <HeartPulse className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          Diagnosis: {latestNote.workingDiagnosis}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {latestNote.doctorName} ·{" "}
                          {safeFormat(latestNote.createdAt, "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>
                  )}

                  {latestSOAP && (
                    <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-xl border border-teal-100">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Activity className="w-4 h-4 text-teal-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800">Catatan SOAP Perawat</p>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {latestSOAP.subjective}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {latestSOAP.nurseName} ·{" "}
                          {safeFormat(latestSOAP.createdAt, "dd MMM yyyy")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Belum ada aktivitas medis.</p>
                  <p className="text-xs mt-1">Kunjungi poli untuk memulai pemeriksaan.</p>
                </div>
              )}
            </Card>

            {/* ── Info panel ── */}
            <Card>
              <h3 className="font-bold text-slate-800 mb-3">Informasi Kontak</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                {[
                  { label: "No. Telepon",   value: patient.phone },
                  { label: "Email",         value: patient.email },
                  { label: "No. KTP",       value: patient.ktpNumber },
                  { label: "Kontak Darurat",value: `${patient.emergencyContact?.name} (${patient.emergencyContact?.phone})` },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 font-medium">{label}</p>
                    <p className="text-slate-700 font-semibold mt-0.5 break-all">{value || "—"}</p>
                  </div>
                ))}
              </div>
            </Card>
          </>
        ) : (
          <Card>
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-600 font-semibold">Data rekam medis belum tersedia.</p>
              <p className="text-sm text-slate-400 mt-1">
                Hubungi admin rumah sakit untuk melengkapi data Anda.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
