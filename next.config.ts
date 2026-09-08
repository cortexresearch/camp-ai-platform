import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  experimental: {
    // Screenshots and avatars are allowed up to 5MB and static HTML demos up
    // to 2MB (see MAX_SCREENSHOT_BYTES / MAX_HTML_DEMO_BYTES in actions.ts) —
    // well above Next's default 1MB server action body limit.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default config;
