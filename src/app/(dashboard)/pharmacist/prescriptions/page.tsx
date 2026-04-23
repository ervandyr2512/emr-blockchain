"use client";

export const dynamic = "force-dynamic";

/**
 * Pharmacist — Prescription Queue
 * Dedicated page for viewing and dispensing incoming prescriptions.
 * Fetches patient identity for safety verification before dispensing.
 */

import React, { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import {
  Pill, CheckCircle2, Clock, Link as LinkIcon,
  RefreshCw, User, ShieldCheck, AlertCircle,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import {
  getPendingPrescriptions, updatePrescriptionStatus, getPatient,
} from "@/lib/emr";
import { blockchainFulfillPrescriptionFull, extractErrorMessage } from "@/lib/blockchain";
import { createNotification } from "@/lib/notifications";
import { sha256 } from "@/lib/hash";
import type { Prescription, Patient } from "@/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function PharmacistPrescriptionsPage() {
  const { profile } = useAuth();

  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [selected,      setSelected]      = useState<Prescription | null>(null);
  const [selPatient,    setSelPatient]    = useState<Patient | null>(null);
  const [loadingPt,     setLoadingPt]     = useState(false);
  const [dispensing,    setDispensing]    = useState(false);
  const [txHash,        setTxHash]        = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getPendingPrescriptions()
      .then(setPrescriptions)
      .catch((err) => console.error("[PharmacistRx]", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  /** Open modal — also fetch patient identity for safety verification */
  const handleSelect = async (rx: Prescription) => {
    setSelected(rx);
    setSelPatient(null);
    setTxHash("");
    setLoadingPt(true);
    try {
      const pt = await getPatient(rx.emrId);
      setSelPatient(pt);
    } catch {
      // non-fatal
    } finally {
      setLoadingPt(false);
    }
  };

  const dispense = async () => {
    if (!selected || !profile) return;
    setDispensing(true);
    try {
      const dataHash = await sha256({
        ...selected,
        dispensedBy: profile.uid,
        timestamp:   new Date().toISOString(),
      });

      let hash = "";
      const bcToastId = toast.loading("Memulai transaksi blockchain…");
      try {
        hash = await blockchainFulfillPrescriptionFull(
          selected.emrId,
          dataHash,
          (msg) => toast.loading(msg, { id: bcToastId })
        );
        setTxHash(hash);
        toast.success("Resep berhasil direkam di blockchain! ✅", { id: bcToastId });
      } catch (bcErr: unknown) {
        console.error("[Blockchain Rx]", bcErr);
        toast.error(`⚠️ Blockchain gagal: ${extractErrorMessage(bcErr)}`, {
          id: bcToastId, duration: 12000,
        });
      }

      await updatePrescriptionStatus(
        selected.emrId, selected.id, "dispensed",
        profile.uid, profile.name, hash || undefined
      );

      await createNotification({
        icon:        "💊",
        title:       "Resep Diserahkan",
        body:        `Apoteker ${profile.name} menyerahkan resep ${selected.emrId}${hash ? " · Direkam di blockchain ✅" : ""}`,
        createdAt:   new Date().toISOString(),
        unread:      true,
        targetRoles: ["doctor", "admin"],
        emrId:       selected.emrId,
        txHash:      hash || undefined,
      }).catch(() => {});

      const patientName = selPatient
        ? `${selPatient.firstName} ${selPatient.lastName}`
        : selected.emrId;
      toast.success(`Resep untuk ${patientName} berhasil diserahkan!`);
      setSelected(null);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses resep");
    } finally {
      setDispensing(false);
    }
  };

  const pending    = prescriptions.filter((p) => p.status === "pending").length;
  const processing = prescriptions.filter((p) => p.status === "processing").length;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Resep Masuk" subtitle="Antrian resep yang perlu diproses" />
      <div className="p-6 space-y-4">

        {/* Summary chips */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-amber-700">{pending} menunggu</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
            <Pill className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-semibold text-blue-700">{processing} sedang diproses</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="w-3.5 h-3.5" />}
            onClick={load}
            className="ml-auto"
          >
            Refresh
          </Button>
        </div>

        <Card>
          {loading ? <Spinner center label="Memuat resep…" /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["EMR ID", "Dokter", "Obat", "Status", "Waktu Masuk", "Aksi"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {prescriptions.map((rx) => (
                    <tr key={rx.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg">
                          {rx.emrId}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{rx.doctorName}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {rx.medications.slice(0, 3).map((m, j) => (
                            <span key={j} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg">
                              {m.name}
                            </span>
                          ))}
                          {rx.medications.length > 3 && (
                            <span className="text-xs text-slate-400">
                              +{rx.medications.length - 3} lainnya
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4"><StatusBadge status={rx.status} /></td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {format(new Date(rx.createdAt), "dd MMM yyyy · HH:mm", { locale: localeId })}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          icon={<CheckCircle2 className="w-4 h-4" />}
                          onClick={() => handleSelect(rx)}
                        >
                          Proses
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {prescriptions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-slate-400">
                        <Pill className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        Tidak ada resep masuk saat ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ── Dispense Modal ───────────────────────────────────────────────────── */}
      <Modal
        open={!!selected}
        onClose={() => { setSelected(null); setTxHash(""); }}
        title="Verifikasi & Serahkan Resep"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => { setSelected(null); setTxHash(""); }}>
              Batal
            </Button>
            <Button onClick={dispense} loading={dispensing} variant="secondary"
              icon={<CheckCircle2 className="w-4 h-4" />}>
              Obat Telah Diserahkan &amp; Rekam Blockchain
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">

            {/* ── Patient identity — safety check ────────────────────────── */}
            <div className="rounded-xl border-2 border-amber-300 bg-amber-50 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-100 border-b border-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span className="text-xs font-bold text-amber-800 uppercase tracking-wide">
                  Verifikasi Identitas Pasien
                </span>
              </div>
              {loadingPt ? (
                <div className="px-4 py-4 flex items-center gap-2 text-sm text-slate-500">
                  <Spinner /> Memuat data pasien…
                </div>
              ) : selPatient ? (
                <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div>
                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Nama Pasien</p>
                    <p className="font-bold text-slate-800 text-base">
                      {selPatient.firstName} {selPatient.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">EMR ID</p>
                    <p className="font-mono font-semibold text-primary-700">{selPatient.emrId}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">No. KTP</p>
                    <p className="font-mono text-slate-700">{selPatient.ktpNumber}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Jenis Kelamin</p>
                    <p className="text-slate-700">{selPatient.gender}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">No. Telepon</p>
                    <p className="text-slate-700">{selPatient.phone}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-amber-600 uppercase tracking-wide">Poli</p>
                    <p className="text-slate-700">{selPatient.department ?? "—"}</p>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3 flex items-center gap-2 text-sm text-slate-500">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  Data pasien tidak ditemukan untuk EMR {selected.emrId}
                </div>
              )}
            </div>

            {/* ── Prescription meta ──────────────────────────────────────── */}
            <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
              <p><b className="text-slate-600">Dokter:</b> {selected.doctorName}</p>
              <p><b className="text-slate-600">Dibuat:</b>{" "}
                {format(new Date(selected.createdAt), "dd MMM yyyy · HH:mm", { locale: localeId })}
              </p>
            </div>

            {/* ── Medications table ──────────────────────────────────────── */}
            <div>
              <p className="text-sm font-bold text-slate-700 mb-2">Daftar Obat:</p>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {["Nama Obat", "Dosis", "Frekuensi", "Durasi", "Catatan"].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.medications.map((m, i) => (
                      <tr key={i} className="border-t border-slate-100">
                        <td className="py-2 px-3 font-medium text-slate-800">{m.name}</td>
                        <td className="py-2 px-3 text-slate-600">{m.dose}</td>
                        <td className="py-2 px-3 text-slate-600">{m.frequency}</td>
                        <td className="py-2 px-3 text-slate-600">{m.duration}</td>
                        <td className="py-2 px-3 text-slate-400">{m.notes ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Blockchain TX hash ─────────────────────────────────────── */}
            {txHash && (
              <div className="bg-green-50 rounded-xl p-3 border border-green-200">
                <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5 mb-1">
                  <LinkIcon className="w-3.5 h-3.5" /> Transaksi Blockchain Berhasil
                </p>
                <p className="hash-text text-green-600 text-[11px]">{txHash}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
