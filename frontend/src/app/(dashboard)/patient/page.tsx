"use client";

/**
 * Patient Dashboard — View own EMR history and blockchain audit trail.
 */

import React, { useEffect, useState } from "react";
import { FileText, Activity, Shield, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { StatCard, Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useAuth } from "@/hooks/useAuth";
import { getPatientByUid, getAllSOAPNotes, getAllDoctorNotes } from "@/lib/emr";
import { getEMRActions } from "@/lib/blockchain";
import { ACTION_TYPE_LABELS } from "@/types";
import type { Patient, SOAPNote, DoctorNote, BlockchainAction } from "@/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function PatientDashboard() {
  const { user, profile }   = useAuth();
  const [patient, setPatient]   = useState<Patient | null>(null);
  const [soaps, setSOAPs]       = useState<SOAPNote[]>([]);
  const [notes, setNotes]       = useState<DoctorNote[]>([]);
  const [chain, setChain]       = useState<BlockchainAction[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    getPatientByUid(user.uid).then(async (p) => {
      setPatient(p);
      if (p) {
        const [s, n] = await Promise.all([getAllSOAPNotes(p.emrId), getAllDoctorNotes(p.emrId)]);
        setSOAPs(s);
        setNotes(n);
        try {
          const actions = await getEMRActions(p.emrId);
          setChain(actions.map((a: unknown) => {
            const act = a as { id: bigint; emrId: string; dataHash: string; actionType: bigint; submitter: string; timestamp: bigint; isActive: boolean };
            return {
              id:         Number(act.id),
              emrId:      act.emrId,
              dataHash:   act.dataHash,
              actionType: Number(act.actionType),
              submitter:  act.submitter,
              timestamp:  Number(act.timestamp),
              isActive:   act.isActive,
            };
          }));
        } catch {/* blockchain unavailable */}
      }
      setLoading(false);
    });
  }, [user]);

  if (loading) return <Spinner center label="Memuat rekam medis…" />;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title={`Halo, ${profile?.name ?? "Pasien"} 👋`} subtitle="Rekam Medis Elektronik Anda" />
      <div className="p-6 space-y-6">

        {patient ? (
          <>
            {/* Info card */}
            <Card className="bg-gradient-to-br from-primary-600 to-primary-800 text-white border-0">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0">
                  {patient.firstName[0]}
                </div>
                <div className="flex-1">
                  <p className="text-white/70 text-xs font-semibold uppercase tracking-wide">EMR ID</p>
                  <p className="text-xl font-bold font-mono">{patient.emrId}</p>
                  <p className="text-white/80 text-sm mt-0.5">{patient.firstName} {patient.lastName} · {patient.gender}</p>
                </div>
                <div>
                  <StatusBadge status={patient.status} />
                  {patient.department && (
                    <p className="text-white/60 text-xs mt-1 text-right">Poli: {patient.department}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* Stats */}
            <div className="dashboard-grid">
              <StatCard title="Catatan SOAP" value={soaps.length}
                icon={<Activity className="w-6 h-6" />} color="teal" subtitle="Dari perawat" />
              <StatCard title="Catatan Dokter" value={notes.length}
                icon={<FileText className="w-6 h-6" />} color="blue" subtitle="Pemeriksaan dan diagnosis" />
              <StatCard title="Rekaman Blockchain" value={chain.length}
                icon={<Shield className="w-6 h-6" />} color="purple" subtitle="Transaksi on-chain" />
            </div>

            {/* Doctor notes */}
            <Card>
              <h3 className="font-bold text-slate-800 mb-4">📋 Riwayat Pemeriksaan Dokter</h3>
              {notes.length === 0 ? (
                <p className="text-slate-400 text-sm">Belum ada catatan pemeriksaan.</p>
              ) : (
                <div className="space-y-3">
                  {notes.map((n, i) => (
                    <div key={i} className="border border-slate-100 rounded-xl overflow-hidden">
                      <button
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 text-left"
                        onClick={() => setExpanded(expanded === `note-${i}` ? null : `note-${i}`)}
                      >
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{n.workingDiagnosis}</p>
                          <p className="text-xs text-slate-400">Dr. {n.doctorName} · {format(new Date(n.createdAt), "dd MMM yyyy HH:mm", { locale: localeId })}</p>
                        </div>
                        {expanded === `note-${i}` ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </button>
                      {expanded === `note-${i}` && (
                        <div className="px-4 pb-4 pt-2 border-t border-slate-100 space-y-3 text-sm">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Keluhan Utama</p>
                              <p className="text-slate-700 mt-1">{n.chiefComplaint}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Alergi</p>
                              <p className="text-slate-700 mt-1">{n.allergy || "Tidak ada"}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tanda Vital</p>
                            <div className="flex flex-wrap gap-3 mt-1 text-xs bg-slate-50 rounded-lg p-2">
                              <span>TD: {n.vitalSigns.bloodPressure}</span>
                              <span>HR: {n.vitalSigns.heartRate} bpm</span>
                              <span>Suhu: {n.vitalSigns.temperature}°C</span>
                              <span>SpO₂: {n.vitalSigns.oxygenSaturation}%</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Diagnosis</p>
                            <p className="text-slate-700 mt-1">{n.workingDiagnosis}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rencana Tatalaksana</p>
                            <p className="text-slate-700 mt-1">{n.managementPlan}</p>
                          </div>
                          {n.blockchainTxHash && (
                            <div>
                              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">TX Blockchain</p>
                              <p className="hash-text">{n.blockchainTxHash}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Blockchain audit trail */}
            <Card>
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-600" /> Audit Trail Blockchain
              </h3>
              {chain.length === 0 ? (
                <p className="text-slate-400 text-sm">Belum ada transaksi blockchain (MetaMask diperlukan).</p>
              ) : (
                <div className="space-y-2">
                  {chain.map((action, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-700">{ACTION_TYPE_LABELS[action.actionType]}</p>
                        <p className="hash-text mt-0.5">{action.dataHash}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {format(new Date(action.timestamp * 1000), "dd MMM yyyy HH:mm:ss", { locale: localeId })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </>
        ) : (
          <Card>
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Data rekam medis belum tersedia.</p>
              <p className="text-xs text-slate-400 mt-1">Hubungi admin rumah sakit untuk melengkapi data.</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
