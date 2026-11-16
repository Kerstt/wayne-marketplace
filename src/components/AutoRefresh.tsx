"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Re-renders the current server page every few seconds (used while a payment is confirming). */
export function AutoRefresh({ seconds = 3 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}
