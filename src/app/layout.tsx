import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://campai.cortexresearch.group"),
  title: {
    default: "🏕️ AI — Build with AI. Ship in 30 minutes. Compete all season.",
    template: "%s · 🏕️ AI",
  },
  description:
    "🏕️ AI is a live AI build competition. Builders get 30 minutes to ship, demo, and compete. Produced by Cortex Research Group.",
  openGraph: {
    title: "🏕️ AI — a competitive AI builder league",
    description: "Build with AI. Ship in 30 minutes. Compete all season.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/*
          Fonts are loaded via <link> rather than next/font so the build does
          not depend on network access. The stack degrades to system fonts.
        */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="terrain min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-ember-500 focus:px-4 focus:py-2 focus:font-semibold focus:text-ink-950"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
