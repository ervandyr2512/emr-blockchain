"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Redirect /patient/emr → /patient (dashboard already shows full EMR history) */
export default function PatientEmrRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/patient"); }, [router]);
  return null;
}
