"use client";

/**
 * Dashboard shell layout — shared by all role dashboards.
 * Redirects to /login if not authenticated.
 */

// Force dynamic rendering — prevents Next.js from statically prerendering
// dashboard pages during build (which would fail without Firebase env vars).
export const dynamic = "force-dynamic";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Spinner } from "@/components/ui/Spinner";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading) return <Spinner center label="Memuat…" />;
  if (!user)   return null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
