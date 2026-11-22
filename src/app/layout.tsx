import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// self-hosted analytics (webstats.sfalter.de), loaded on every page
const WEBSTATS_WEBSITE_ID = "8279bc10-5acc-4337-b0f7-680c3e7ca416";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} – ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: "fitness",
  keywords: [
    "kettlebell workout",
    "kettlebell workout planner",
    "kettlebell timer",
    "kettlebell AMRAP",
    "kettlebell exercises",
    "kettlebell workout app",
    "double kettlebell",
    "single kettlebell workout",
  ],
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0d0e10",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Script
          src="https://webstats.sfalter.de/recorder.js"
          data-website-id={WEBSTATS_WEBSITE_ID}
          strategy="afterInteractive"
        />
        <Script
          src="https://webstats.sfalter.de/script.js"
          data-website-id={WEBSTATS_WEBSITE_ID}
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
