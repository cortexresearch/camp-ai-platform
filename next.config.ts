import type { NextConfig } from "next";
import path from "node:path";

const config: NextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(__dirname),
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ] }];
  },
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
