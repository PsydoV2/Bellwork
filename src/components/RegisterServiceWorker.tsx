"use client";

import { useEffect } from "react";

/** Registers the offline service worker for the /app scope (production only). */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/app-sw.js", { scope: "/app/", updateViaCache: "none" })
      .catch((err) => console.warn("Service worker registration failed", err));
  }, []);
  return null;
}
