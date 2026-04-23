"use client";

/**
 * BlockchainStatusPanel.tsx
 * -------------------------
 * Compact pre-flight check panel shown inside the "Tugaskan Poli" modal.
 * Displays MetaMask installation, wallet address, network, and on-chain role.
 */

import React from "react";
import type { BlockchainStatus } from "@/lib/blockchain";
import { clsx } from "clsx";

interface Props {
  status: BlockchainStatus | null;
  loading: boolean;
}

export function BlockchainStatusPanel({ status, loading }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-50 px-3 py-2 border-b border-slate-200">
        <span className="font-bold text-slate-600 uppercase tracking-wide text-[10px]">
          Status MetaMask &amp; Blockchain
        </span>
        {loading && (
          <span className="text-slate-400 flex items-center gap-1">
            <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z" />
            </svg>
            Memeriksa…
          </span>
        )}
      </div>

      {loading && !status && (
        <div className="px-3 py-3 text-slate-400 text-center">Memeriksa koneksi blockchain…</div>
      )}

      {!loading && !status && (
        <div className="px-3 py-3 text-slate-400 text-center">Gagal memeriksa status</div>
      )}

      {status && (
        <div className="px-3 py-3 space-y-2">
          {/* Row: MetaMask */}
          <StatusRow
            label="MetaMask"
            value={status.metaMaskInstalled ? "Terdeteksi ✓" : "Tidak terdeteksi ✗"}
            ok={status.metaMaskInstalled}
          />

          {/* Row: Wallet */}
          <StatusRow
            label="Wallet"
            value={
              status.account
                ? `${status.account.slice(0, 6)}…${status.account.slice(-4)}`
                : "Belum terhubung (akan diminta)"
            }
            ok={!!status.account}
            neutral={!status.account}
          />

          {/* Row: Network */}
          <StatusRow
            label="Jaringan"
            value={
              status.isOnSepolia
                ? "Sepolia ✓"
                : status.chainId
                  ? `Bukan Sepolia — akan diganti otomatis`
                  : "Tidak diketahui"
            }
            ok={status.isOnSepolia}
            neutral={!status.isOnSepolia && status.metaMaskInstalled}
          />

          {/* Row: On-chain role */}
          <StatusRow
            label="Peran Admin"
            value={
              !status.account
                ? "Belum terhubung"
                : status.isAdmin
                  ? `Admin (role=4) ✓`
                  : `${status.roleName} (role=${status.onChainRole}) — perlu Admin`
            }
            ok={status.isAdmin}
          />

          {/* Issues / warnings */}
          {status.issues.length > 0 && (
            <div className="mt-1 pt-2 border-t border-slate-100 space-y-1.5">
              {status.issues.map((issue, i) => (
                <p key={i} className={clsx(
                  "flex items-start gap-1.5 leading-snug",
                  // Network-only issue is just a warning, role issues are errors
                  issue.includes("Jaringan") || issue.includes("jaringan") || issue.includes("terhubung")
                    ? "text-amber-600"
                    : "text-red-600"
                )}>
                  <span className="flex-shrink-0 mt-0.5">
                    {issue.includes("Jaringan") || issue.includes("jaringan") || issue.includes("terhubung") ? "⚠️" : "❌"}
                  </span>
                  <span>{issue}</span>
                </p>
              ))}
            </div>
          )}

          {/* All good */}
          {status.ready && status.issues.length === 0 && (
            <p className="text-green-600 font-semibold flex items-center gap-1 mt-1 pt-2 border-t border-slate-100">
              ✅ Siap untuk transaksi blockchain
            </p>
          )}
          {status.ready && status.isOnSepolia && (
            <p className="text-green-600 font-semibold flex items-center gap-1 mt-1 pt-2 border-t border-slate-100">
              ✅ Siap untuk transaksi blockchain
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Row helper ────────────────────────────────────────────────────────────────

function StatusRow({
  label,
  value,
  ok,
  neutral = false,
}: {
  label: string;
  value: string;
  ok: boolean;
  neutral?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-500 flex-shrink-0">{label}</span>
      <span
        className={clsx(
          "text-right font-medium",
          neutral ? "text-amber-600" : ok ? "text-green-600" : "text-red-500"
        )}
      >
        {value}
      </span>
    </div>
  );
}
