import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import { SITE_URL } from "@/lib/site";
import { OrganizationJsonLd } from "@/components/JsonLd";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  // campai.space is the canonical home. campai.cortexresearch.group serves the
  // same app and is 301'd to it in middleware, so search engines consolidate
  // signal on one hostname instead of splitting it across two.
  metadataBase: new URL(SITE_URL),
  applicationName: "CampAI",
  title: {
    // The brand name has to be literal text, not the 🏕️ mark — "🏕️ AI" is
    // unsearchable, which is why "campai" returned nothing.
    default: "CampAI — the live vibe coding hyper hackathon. Build and ship in 30 minutes.",
    template: "%s · CampAI",
  },
  description:
    "CampAI is a live vibe coding hyper hackathon. Builders get 30 minutes to build and ship something real with AI, demo it on X, and get rated by everyone watching. New episode every show night — sign up free and compete all season.",
  keywords: [
    "CampAI",
    "camp ai",
    "vibe coding",
    "vibe coding hackathon",
    "hyper hackathon",
    "AI hackathon",
    "AI build competition",
    "live coding competition",
    "build with AI",
    "ship in 30 minutes",
  ],
  openGraph: {
    siteName: "CampAI",
    title: "CampAI — the live vibe coding hyper hackathon",
    description:
      "30 minutes to build and ship with AI, demo live, and get rated. New episode every show night.",
    url: SITE_URL,
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "CampAI — the live vibe coding hyper hackathon",
    description: "30 minutes to build and ship with AI, demo live, and get rated.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
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
        <OrganizationJsonLd />
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
