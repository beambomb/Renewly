"use client";

import { useEffect } from "react";
import { setDetectedTimezone } from "@/app/(app)/settings/actions";

const STORAGE_KEY = "renewly-timezone-synced";

/**
 * Renders nothing. While a profile still has the default "UTC" time zone, it
 * saves the device's zone once per browser session.
 */
export function DetectTimezone({ current }: { current: string }) {
  useEffect(() => {
    if (current !== "UTC") return;
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detected || detected === "UTC") return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return;
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Storage can be blocked; the server-side guard keeps this harmless.
    }
    void setDetectedTimezone(detected);
  }, [current]);

  return null;
}
