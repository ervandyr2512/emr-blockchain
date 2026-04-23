"use client";

export const dynamic = "force-dynamic";

/**
 * Admin — Staff Management
 * ─────────────────────────
 * Tab 1: Buat Akun Staff   — manually create accounts (doctor/nurse/pharmacist/admin)
 * Tab 2: Permohonan Dokter — review and approve/reject self-registered doctors
 */

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  UserPlus, ShieldCheck, ClipboardList, CheckCircle2, XCircle,
  RefreshCw, ChevronDown, ChevronUp, Clock, User, Phone,
  GraduationCap, Award, Building2, FileText, Stethoscope,
  AlertCircle,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { signUp } from "@/lib/auth";
import {
  getDoctorApplications,
  approveDoctorApplication,
  rejectDoctorApplication,
} from "@/lib/emr";
import { useAuth } from "@/hooks/useAuth";
import { createNotification } from "@/lib/notifications";
import type { UserRole, DoctorApplication, DoctorApplicationStatus } from "@/types";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = "staff" | "applications";

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "doctor",     label: "Dokter" },
  { value: "nurse",      label: "Perawat" },
  { value: "pharmacist", label: "Apoteker" },
  { value: "admin",      label: "Admin" },
];

// ── Status badge helper ───────────────────────────────────────────────────────

function AppStatusBadge({ status }: { status: DoctorApplicationStatus }) {
  const cfg = {
    pending:  { label: "Menunggu",  cls: "bg-amber-100 text-amber-700"  },
    approved: { label: "Disetujui", cls: "bg-green-100 text-green-700"  },
    rejected: { label: "Ditolak",   cls: "bg-red-100 text-red-600"      },
  }[status];
  return (
    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminStaffPage() {
  const { profile } = useAuth();

  // ── Tab state ───────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<TabId>("staff");

  // ── Create staff form ───────────────────────────────────────────────────────
  const [modal,   setModal]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [form,    setForm]    = useState({ name: "", email: "", password: "", role: "doctor" });

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const submitStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(form.email, form.password, form.name, form.role as UserRole);
      toast.success(`Akun ${form.name} berhasil dibuat sebagai ${form.role}.`);
      setModal(false);
      setForm({ name: "", email: "", password: "", role: "doctor" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal membuat akun");
    } finally {
      setLoading(false);
    }
  };

  // ── Applications state ──────────────────────────────────────────────────────
  const [applications, setApplications] = useState<DoctorApplication[]>([]);
  const [loadingApps, setLoadingApps]   = useState(false);
  const [openIds,     setOpenIds]       = useState<Set<string>>(new Set());

  // Reject modal
  const [rejectTarget, setRejectTarget] = useState<DoctorApplication | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadApplications = useCallback(async () => {
    setLoadingApps(true);
    try {
      setApplications(await getDoctorApplications());
    } catch (err) {
      console.error("[AdminStaff] loadApplications", err);
    } finally {
      setLoadingApps(false);
    }
  }, []);

  useEffect(() => {
    if (tab === "applications") loadApplications();
  }, [tab, loadApplications]);

  const toggleRow = (uid: string) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(uid) ? next.delete(uid) : next.add(uid);
      return next;
    });

  // ── Approve ─────────────────────────────────────────────────────────────────
  const approve = async (app: DoctorApplication) => {
    if (!profile) return;
    setSubmittingReview(true);
    try {
      await approveDoctorApplication(app.uid, profile.name);
      await createNotification({
        icon: "✅",
        title: "Permohonan Dokter Disetujui",
        body: `${app.name} (${app.specialization}) telah disetujui sebagai dokter.`,
        createdAt: new Date().toISOString(),
        unread: true,
        targetRoles: ["admin"],
      }).catch(() => {});
      toast.success(`${app.name} telah disetujui sebagai dokter!`);
      loadApplications();
    } catch (err) {
      toast.error("Gagal menyetujui permohonan.");
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── Reject ──────────────────────────────────────────────────────────────────
  const submitReject = async () => {
    if (!rejectTarget || !profile) return;
    if (!rejectReason.trim()) { toast.error("Alasan penolakan wajib diisi."); return; }
    setSubmittingReview(true);
    try {
      await rejectDoctorApplication(rejectTarget.uid, profile.name, rejectReason.trim());
      toast.success(`Permohonan ${rejectTarget.name} ditolak.`);
      setRejectTarget(null);
      setRejectReason("");
      loadApplications();
    } catch (err) {
      toast.error("Gagal menolak permohonan.");
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // ── Counts ──────────────────────────────────────────────────────────────────
  const pendingCount = applications.filter((a) => a.status === "pending").length;

  return (
    <div className="flex-1 overflow-y-auto">
      <Header title="Manajemen Staff" subtitle="Kelola akun tenaga medis dan permohonan dokter" />

      <div className="p-6 space-y-4">

        {/* ── Tabs ─────────────────────────────────────────────────────────── */}
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
          {([
            { id: "staff",        icon: <UserPlus      className="w-4 h-4" />, label: "Buat Akun Staff"     },
            { id: "applications", icon: <ClipboardList className="w-4 h-4" />, label: "Permohonan Dokter",
              badge: pendingCount > 0 && tab !== "applications" ? pendingCount : null },
          ] as const).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                tab === t.id
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.icon}
              {t.label}
              {"badge" in t && t.badge ? (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            TAB 1 — Create staff account
            ════════════════════════════════════════════════════════════════════ */}
        {tab === "staff" && (
          <>
            <div className="flex justify-end">
              <Button icon={<UserPlus className="w-4 h-4" />} onClick={() => setModal(true)}>
                Tambah Staff Baru
              </Button>
            </div>

            <Card>
              <div className="flex flex-col items-center py-12 text-center gap-3">
                <ShieldCheck className="w-12 h-12 text-slate-200" />
                <p className="text-slate-500 font-medium">Daftar staff akan muncul di sini.</p>
                <p className="text-xs text-slate-400 max-w-sm">
                  Buat akun untuk dokter, perawat, dan apoteker menggunakan tombol di atas.
                  Akun yang dibuat dapat langsung login ke sistem.
                </p>
              </div>
            </Card>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            TAB 2 — Doctor applications
            ════════════════════════════════════════════════════════════════════ */}
        {tab === "applications" && (
          <>
            {/* Summary bar */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-semibold text-amber-700">{pendingCount} menunggu review</span>
              </div>
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-sm font-semibold text-green-700">
                  {applications.filter((a) => a.status === "approved").length} disetujui
                </span>
              </div>
              <Button
                variant="outline" size="sm"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={loadApplications}
                className="ml-auto"
              >
                Refresh
              </Button>
            </div>

            {loadingApps ? (
              <Spinner center label="Memuat permohonan…" />
            ) : applications.length === 0 ? (
              <Card padding="sm" className="text-center py-16 text-slate-400 border-dashed">
                <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-20" />
                Belum ada permohonan dokter.
              </Card>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {applications.map((app) => {
                    const open = openIds.has(app.uid);
                    return (
                      <div key={app.uid} className={open ? "bg-blue-50/30" : "bg-white"}>

                        {/* Row header */}
                        <button
                          type="button"
                          onClick={() => toggleRow(app.uid)}
                          className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                            {app.name[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-800 flex flex-wrap items-center gap-2">
                              {app.name}
                              <span className="text-xs font-normal bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg">
                                {app.specialization}
                              </span>
                              <AppStatusBadge status={app.status} />
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {app.email} · {app.hospital} ·{" "}
                              {format(new Date(app.submittedAt), "dd MMM yyyy · HH:mm", { locale: localeId })}
                            </p>
                          </div>
                          {open
                            ? <ChevronUp   className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                        </button>

                        {/* Expanded detail */}
                        {open && (
                          <div className="px-4 pb-5 space-y-4">

                            {/* Details grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                              {[
                                { icon: <User         className="w-3.5 h-3.5" />, label: "Email",       val: app.email        },
                                { icon: <Phone        className="w-3.5 h-3.5" />, label: "Telepon",     val: app.phone        },
                                { icon: <Stethoscope  className="w-3.5 h-3.5" />, label: "Spesialisasi",val: app.specialization},
                                { icon: <FileText     className="w-3.5 h-3.5" />, label: "No. STR",     val: app.strNumber    },
                                { icon: <FileText     className="w-3.5 h-3.5" />, label: "No. SIP",     val: app.sipNumber    },
                                { icon: <Building2    className="w-3.5 h-3.5" />, label: "RS/Klinik",   val: app.hospital     },
                                { icon: <GraduationCap className="w-3.5 h-3.5" />,label: "Pendidikan",  val: app.education    },
                                { icon: <Award        className="w-3.5 h-3.5" />, label: "Pengalaman",  val: `${app.experience} tahun` },
                              ].map(({ icon, label, val }) => (
                                <div key={label} className="bg-white rounded-xl border border-slate-100 px-3 py-2">
                                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                    {icon} {label}
                                  </p>
                                  <p className="text-sm font-medium text-slate-700 mt-0.5 break-words">{val}</p>
                                </div>
                              ))}
                            </div>

                            {/* Bio */}
                            {app.bio && (
                              <div className="bg-white rounded-xl border border-slate-100 px-4 py-3">
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Bio</p>
                                <p className="text-sm text-slate-600">{app.bio}</p>
                              </div>
                            )}

                            {/* Rejection reason */}
                            {app.status === "rejected" && app.rejectReason && (
                              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Alasan Penolakan</p>
                                  <p className="text-sm text-red-700 mt-0.5">{app.rejectReason}</p>
                                  {app.reviewedBy && (
                                    <p className="text-xs text-red-400 mt-1">
                                      Oleh: {app.reviewedBy} ·{" "}
                                      {app.reviewedAt && format(new Date(app.reviewedAt), "dd MMM yyyy · HH:mm", { locale: localeId })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Approval info */}
                            {app.status === "approved" && (
                              <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="text-sm font-semibold text-green-700">Dokter telah diaktifkan</p>
                                  {app.reviewedBy && (
                                    <p className="text-xs text-green-500 mt-0.5">
                                      Disetujui oleh: {app.reviewedBy} ·{" "}
                                      {app.reviewedAt && format(new Date(app.reviewedAt), "dd MMM yyyy · HH:mm", { locale: localeId })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Action buttons — only for pending */}
                            {app.status === "pending" && (
                              <div className="flex gap-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
                                  icon={<XCircle className="w-4 h-4" />}
                                  onClick={() => { setRejectTarget(app); setRejectReason(""); }}
                                  loading={submittingReview}
                                >
                                  Tolak
                                </Button>
                                <Button
                                  size="sm"
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                  icon={<CheckCircle2 className="w-4 h-4" />}
                                  onClick={() => approve(app)}
                                  loading={submittingReview}
                                >
                                  Setujui
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Create Staff Modal ──────────────────────────────────────────────── */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Tambah Staff Baru"
        footer={
          <>
            <Button variant="outline" onClick={() => setModal(false)}>Batal</Button>
            <Button form="staff-form" type="submit" loading={loading}>Buat Akun</Button>
          </>
        }
      >
        <form id="staff-form" onSubmit={submitStaff} className="space-y-4">
          <Input label="Nama Lengkap" name="name" value={form.name} onChange={handle} required />
          <Input label="Email" name="email" type="email" value={form.email} onChange={handle} required />
          <Input
            label="Password Awal"
            name="password"
            type="password"
            value={form.password}
            onChange={handle}
            required
            hint="Minimal 6 karakter"
          />
          <Select
            label="Role / Jabatan"
            name="role"
            value={form.role}
            onChange={handle as (e: React.ChangeEvent<HTMLSelectElement>) => void}
            options={ROLE_OPTIONS}
            required
          />
        </form>
      </Modal>

      {/* ── Reject Reason Modal ──────────────────────────────────────────────── */}
      <Modal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Tolak Permohonan Dokter"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Batal</Button>
            <Button
              variant="primary"
              className="bg-red-600 hover:bg-red-700 border-red-600"
              onClick={submitReject}
              loading={submittingReview}
              icon={<XCircle className="w-4 h-4" />}
            >
              Tolak Permohonan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Anda akan menolak permohonan dari{" "}
            <strong>{rejectTarget?.name}</strong>. Dokter akan mendapatkan
            notifikasi dan tidak dapat mengakses sistem.
          </p>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Alasan Penolakan <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Jelaskan alasan penolakan kepada dokter…"
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
