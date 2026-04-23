"use client";

export const dynamic = "force-dynamic";

/**
 * Admin — Patient List + Department Assignment
 */

import { safeFormat } from "@/lib/dateUtils";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Search, ChevronRight, MapPin, Phone, AlertCircle } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, StatusBadge } from "@/components/ui/Badge";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { getAllPatients, assignPatientDepartment } from "@/lib/emr";
import { createNotification } from "@/lib/notifications";
import {
  blockchainAssignDepartmentFull,
  getBlockchainStatus,
  extractErrorMessage,
  type BlockchainStatus,
} from "@/lib/blockchain";
import { sha256 } from "@/lib/hash";
import { BlockchainStatusPanel } from "@/components/ui/BlockchainStatusPanel";
import { useAuth } from "@/hooks/useAuth";
import type { Patient, Department } from "@/types";
import { DEPARTMENTS } from "@/types";

export default function AdminPatientsPage() {
  const { profile }         = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Department assignment modal
  const [assignModal, setAssignModal]   = useState(false);
  const [selected, setSelected]         = useState<Patient | null>(null);
  const [department, setDepartment]     = useState<string>("");
  const [assigning, setAssigning]       = useState(false);

  // Blockchain pre-flight status
  const [bcStatus,   setBcStatus]       = useState<BlockchainStatus | null>(null);
  const [bcChecking, setBcChecking]     = useState(false);

  const load = () => {
    setLoading(true);
    getAllPatients()
      .then((p) => setPatients(p))
      .catch((err) => console.error("[AdminPatients]", err))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const name = `${p.firstName} ${p.lastName}`.toLowerCase();
      const matchSearch = !search || name.includes(search.toLowerCase()) || p.emrId.includes(search);
      const matchStatus = !filterStatus || p.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [patients, search, filterStatus]);

  const openAssign = (p: Patient) => {
    setSelected(p);
    setDepartment(p.department ?? "");
    setBcStatus(null);
    setAssignModal(true);
    // Kick off pre-flight check (no MetaMask popup — uses eth_accounts)
    setBcChecking(true);
    getBlockchainStatus()
      .then(setBcStatus)
      .catch(() => setBcStatus(null))
      .finally(() => setBcChecking(false));
  };

  const handleAssign = async () => {
    if (!selected || !department) { toast.error("Pilih poli terlebih dahulu."); return; }
    setAssigning(true);

    // Hash the assignment data for blockchain
    const payload  = { emrId: selected.emrId, department, assignedBy: profile?.uid, timestamp: new Date().toISOString() };
    const dataHash = await sha256(payload);

    // ── Full blockchain flow with step-by-step toasts ─────────────────────
    let txHash: string | undefined;
    const blockchainToastId = toast.loading("Memulai transaksi blockchain…");
    try {
      txHash = await blockchainAssignDepartmentFull(
        selected.emrId,
        dataHash,
        (msg) => toast.loading(msg, { id: blockchainToastId })
      );
      toast.success("Transaksi blockchain berhasil! ✅", { id: blockchainToastId });
    } catch (blockchainErr: unknown) {
      console.error("[Blockchain] Assign department error:", blockchainErr);
      const errMsg = extractErrorMessage(blockchainErr);
      toast.error(`⚠️ Blockchain gagal: ${errMsg}`, { id: blockchainToastId, duration: 12000 });
      // Refresh pre-flight status to show updated wallet/role info
      getBlockchainStatus().then(setBcStatus).catch(() => {});
      // Don't return — save to Firebase anyway
    }

    // ── Always save to Firebase ────────────────────────────────────────────
    try {
      await assignPatientDepartment(selected.emrId, department as Department, txHash);

      // ── Push live notification ────────────────────────────────────────────
      await createNotification({
        icon:        "🏥",
        title:       "Pasien Ditugaskan ke Poli",
        body:        `${selected.firstName} ${selected.lastName} ditugaskan ke ${department}${txHash ? " · Direkam di blockchain ✅" : ""}`,
        createdAt:   new Date().toISOString(),
        unread:      true,
        targetRoles: ["nurse", "doctor"],
        emrId:       selected.emrId,
        txHash:      txHash,
      }).catch(() => {});

      toast.success(
        txHash
          ? `${selected.firstName} ditugaskan ke Poli ${department} & dicatat di blockchain.`
          : `${selected.firstName} ditugaskan ke Poli ${department} (Firebase saja).`
      );
      setAssignModal(false);
      load();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan penugasan poli");
    } finally {
      setAssigning(false);
    }
  };

  const statusOptions = [
    { value: "",              label: "Semua Status" },
    { value: "registered",   label: "Terdaftar" },
    { value: "waiting",      label: "Menunggu" },
    { value: "assigned",     label: "Ditugaskan" },
    { value: "in_examination", label: "Diperiksa" },
    { value: "completed",    label: "Selesai" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Daftar Pasien" subtitle="Kelola dan tugaskan pasien ke departemen" />
      <div className="p-6 space-y-4">

        {/* Filters */}
        <Card padding="sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Cari nama atau EMR ID…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                options={statusOptions}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card padding="none">
          {loading ? <Spinner center /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    {["EMR ID", "Nama Pasien", "Kontak", "Poli / Dept.", "Status", "Terdaftar", "Aksi"].map((h) => (
                      <th key={h} className="text-left py-3 px-4 text-slate-500 font-semibold text-xs uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((p) => (
                    <tr key={p.emrId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs bg-primary-50 text-primary-700 px-2 py-1 rounded-lg whitespace-nowrap">{p.emrId}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-slate-400">{p.gender} · KTP {p.ktpNumber}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="flex items-center gap-1 text-slate-600 text-xs">
                          <Phone className="w-3 h-3" /> {p.phone}
                        </p>
                        <p className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                          <MapPin className="w-3 h-3" /> {p.address.kota}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        {p.department
                          ? <span className="text-slate-700 text-xs font-medium">{p.department}</span>
                          : <span className="text-amber-500 text-xs flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Belum ditugaskan</span>
                        }
                      </td>
                      <td className="py-3.5 px-4"><StatusBadge status={p.status} /></td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">
                        {safeFormat(p.createdAt, "dd MMM yyyy")}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => openAssign(p)}>
                            Tugaskan Poli
                          </Button>
                          <Link href={`/admin/patients/${p.emrId}`}>
                            <Button size="sm" variant="ghost" icon={<ChevronRight className="w-4 h-4" />}>
                              Detail
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-400">Tidak ada pasien ditemukan.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <p className="text-xs text-slate-400 text-right">{filtered.length} pasien ditampilkan</p>
      </div>

      {/* Assign Department Modal */}
      <Modal
        open={assignModal}
        onClose={() => setAssignModal(false)}
        title={`Tugaskan Poli — ${selected?.firstName} ${selected?.lastName}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setAssignModal(false)}>Batal</Button>
            <Button onClick={handleAssign} loading={assigning}>Simpan & Rekam di Blockchain</Button>
          </>
        }
      >
        {selected && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-1">
              <p><span className="font-semibold">EMR ID:</span> {selected.emrId}</p>
              <p><span className="font-semibold">Nama:</span> {selected.firstName} {selected.lastName}</p>
              <p><span className="font-semibold">Poli Saat Ini:</span> {selected.department ?? "—"}</p>
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
        )}
      </Modal>
    </div>
  );
}
