import type { Metadata } from "next";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import { SITE_NAME } from "@/lib/site";

// Only the app segment is installable: the manifest and service worker are scoped to /app.
export const metadata: Metadata = {
  manifest: "/app/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black",
  },
};

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <>
      {children}
      <RegisterServiceWorker />
    </>
  );
}
