"use client";
/**
 * Root page — redirects to login or appropriate dashboard.
 */
import { useEffect } from "react";
import { useRouter }  from "next/navigation";
import { useAuth }    from "@/hooks/useAuth";
import { getDashboardPath } from "@/lib/auth";
import { Spinner }    from "@/components/ui/Spinner";

export default function RootPage() {
  const router       = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user)    { router.replace("/login"); return; }
    if (profile)  { router.replace(getDashboardPath(profile.role)); return; }
    // User exists but profile not loaded yet — wait
  }, [user, profile, loading, router]);

  return <Spinner center label="Memuat sistem…" />;
}
