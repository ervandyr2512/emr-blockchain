"use client";

export const dynamic = "force-dynamic";

/**
 * Pending Approval Page
 * ---------------------
 * Shown to doctors who have registered but whose account is
 * still awaiting admin approval (role = "pending_doctor").
 */

import { safeFormat } from "@/lib/dateUtils";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle2, XCircle, Stethoscope, LogOut, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDoctorApplication } from "@/lib/emr";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import type { DoctorApplication } from "@/types";

export default function PendingApprovalPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();

  const [application, setApplication] = useState<DoctorApplication | null>(null);
  const [loadingApp, setLoadingApp]   = useState(true);

  useEffect(() => {
    // If auth is done loading and user isn't pending_doctor anymore, redirect to their dashboard
    if (!authLoading && profile) {
      if (profile.role === "doctor") {
        router.replace("/doctor");
        return;
      }
      if (profile.role !== "pending_doctor") {
        router.replace("/login");
        return;
      }
      // Load the application to show status
      getDoctorApplication(profile.uid)
        .then(setApplication)
        .catch(console.error)
        .finally(() => setLoadingApp(false));
    }
    if (!authLoading && !profile) {
      router.replace("/login");
    }
  }, [authLoading, profile, router]);

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
  };

  const refresh = () => {
    if (!profile) return;
    setLoadingApp(true);
    getDoctorApplication(profile.uid)
      .then(setApplication)
      .catch(console.error)
      .finally(() => setLoadingApp(false));
  };

  if (authLoading || loadingApp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isRejected = application?.status === "rejected";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-teal-600 rounded-2xl flex items-center justify-center shadow-lg mb-4">
            <Stethoscope className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-white">EMRChain</h1>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">

          {/* Status icon */}
          {isRejected ? (
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <Clock className="w-10 h-10 text-amber-500" />
            </div>
          )}

          {isRejected ? (
            <>
              <h2 className="text-xl font-extrabold text-slate-800 mb-2">Permohonan Ditolak</h2>
              <p className="text-slate-500 text-sm mb-4">
                Maaf, permohonan pendaftaran dokter Anda tidak dapat disetujui saat ini.
              </p>
              {application?.rejectReason && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left mb-4">
                  <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-1">Alasan Penolakan</p>
                  <p className="text-sm text-red-700">{application.rejectReason}</p>
                </div>
              )}
              <p className="text-sm text-slate-400">
                Untuk informasi lebih lanjut, hubungi admin EMRChain.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-extrabold text-slate-800 mb-2">Menunggu Persetujuan Admin</h2>
              <p className="text-slate-500 text-sm mb-4">
                Permohonan pendaftaran Anda sedang ditinjau oleh admin EMRChain.
                Proses ini biasanya membutuhkan waktu <strong>1×24 jam</strong>.
              </p>

              {application && (
                <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama</span>
                    <span className="font-semibold text-slate-700">{application.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Spesialisasi</span>
                    <span className="font-semibold text-slate-700">{application.specialization}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Dikirim</span>
                    <span className="font-semibold text-slate-700">
                      {safeFormat(application.submittedAt, "dd MMM yyyy · HH:mm")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Status</span>
                    <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full">
                      Menunggu Review
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 bg-teal-50 border border-teal-200 rounded-xl p-3 text-left mb-4">
                <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-teal-700">
                  Setelah disetujui, Anda akan mendapatkan akses penuh ke dashboard dokter
                  dan dapat melihat rekam medis pasien yang di-assign kepada Anda.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 mt-4">
            {!isRejected && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                icon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={refresh}
                loading={loadingApp}
              >
                Cek Status
              </Button>
            )}
            <Button
              variant={isRejected ? "primary" : "outline"}
              size="sm"
              className="flex-1"
              icon={<LogOut className="w-3.5 h-3.5" />}
              onClick={handleSignOut}
            >
              Keluar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
