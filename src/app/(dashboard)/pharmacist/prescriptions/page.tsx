"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Redirect /pharmacist/prescriptions → /pharmacist (dashboard already shows prescription queue) */
export default function PharmacistPrescriptionsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/pharmacist"); }, [router]);
  return null;
}
