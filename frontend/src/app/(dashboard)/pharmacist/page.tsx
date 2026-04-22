"use client";

/**
 * Pharmacist Dashboard — Manage incoming prescriptions.
 */

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Pill, CheckCircle2, Clock, Link as LinkIcon } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { StatCard, Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { getPendingPrescriptions, updatePrescriptionStatus } from "@/lib/emr";
import { blockchainFulfillPrescription } from "@/lib/blockchain";
import { sha256 } from "@/lib/hash";
import type { Prescription } from "@/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function PharmacistDashboard() {
  const { profile }               = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Prescription | null>(null);
  const [dispensing, setDispensing] = useState(false);
  const [txHash, setTxHash]       = useState("");

  const load = () => {
    setLoading(true);
    getPendingPrescriptions().then((p) => { setPrescriptions(p); setLoading(false); });
  };
  useEffect(load, []);

  const dispense = async () => {
    if (!selected || !profile) return;
    setDispensing(true);
    try {
      const dataHash = await sha256({ ...selected, dispensedBy: profile.uid, timestamp: new Date().toISOString() });

      let hash = "";
      try {
        hash = await blockchainFulfillPrescription(selected.emrId, dataHash);
        setTxHash(hash);
      } catch {
        toast("Blockchain tidak tersedia. Status disimpan di Firebase.", { icon: "⚠️" });
      }

      await updatePrescriptionStatus(
        selected.emrId, selected.id, "dispensed",
        profile.uid, profile.name, hash
      );

      toast.success(`Resep untuk ${selected.emrId} berhasil diserahkan!`);
      setSelected(null);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses resep");
    } finally {
      setDispensing(false);
    }
  };

  const pending  = prescriptions.filter((p) => p.status === "pending").length;
  const processing = prescriptions.filter((p) => p.status === "processing").length;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title={`Halo, ${profile?.name ?? "Apoteker"} 💊`} subtitle="Dashboard Apotek" />
      <div className="p-6 space-y-6">

        <div className="dashboard-grid">
          <StatCard title="Resep Pending" value={pending}
            icon={<Clock className="w-6 h-6" />} color="amber" />
          <StatCard title="Sedang Diproses" value={processing}
            icon={<Pill className="w-6 h-6" />} color="blue" />
        </div>

        <Card>
          <h3 className="font-bold text-slate-800 mb-4">📋 Daftar Resep Masuk</h3>
          {loading ? <Spinner center /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["EMR ID", "Dokter", "Obat", "Status", "Waktu", "Aksi"].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {prescriptions.map((rx, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg">{rx.emrId}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{rx.doctorName}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {rx.medications.slice(0, 3).map((m, j) => (
                            <span key={j} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg">{m.name}</span>
                          ))}
                          {rx.medications.length > 3 && (
                            <span className="text-xs text-slate-400">+{rx.medications.length - 3} lainnya</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4"><StatusBadge status={rx.status} /></td>
                      <td className="py-3 px-4 text-slate-400 text-xs">
                        {format(new Date(rx.createdAt), "dd MMM HH:mm", { locale: localeId })}
                      </td>
                      <td className="py-3 px-4">
                        <Button size="sm" icon={<CheckCircle2 className="w-4 h-4" />} onClick={() => setSelected(rx)}>
                          Proses
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {prescriptions.length === 0 && (
                    <tr><td colSpan={6} className="py-12 text-center text-slate-400">
                      Tidak ada resep masuk saat ini.
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Dispense Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Proses & Serahkan Resep"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setSelected(null)}>Batal</Button>
            <Button onClick={dispense} loading={dispensing} variant="secondary">
              Tandai Diserahkan & Rekam Blockchain
            </Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
              <p><b>EMR ID:</b> {selected.emrId}</p>
              <p><b>Dokter:</b> {selected.doctorName}</p>
              <p><b>Dibuat:</b> {format(new Date(selected.createdAt), "dd MMM yyyy HH:mm", { locale: localeId })}</p>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700 mb-2">Daftar Obat:</p>
              <table className="w-full text-sm border border-slate-100 rounded-xl overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    {["Nama Obat", "Dosis", "Frekuensi", "Durasi"].map(h => (
                      <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {selected.medications.map((m, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-2 px-3 font-medium">{m.name}</td>
                      <td className="py-2 px-3 text-slate-600">{m.dose}</td>
                      <td className="py-2 px-3 text-slate-600">{m.frequency}</td>
                      <td className="py-2 px-3 text-slate-600">{m.duration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {txHash && (
              <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                <p className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-1">
                  <LinkIcon className="w-3.5 h-3.5" /> TX Blockchain
                </p>
                <p className="hash-text text-green-600">{txHash}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
