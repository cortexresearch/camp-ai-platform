import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

const UPLOAD_DIR = "/data/uploads";
const CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  html: "text/html; charset=utf-8",
};

export async function GET(_req: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  const { filename } = await params;

  if (!/^[a-f0-9-]+\.(png|jpg|webp|gif|html)$/i.test(filename)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = filename.split(".").pop()!.toLowerCase();

  try {
    const bytes = await readFile(path.join(UPLOAD_DIR, filename));
    const headers: Record<string, string> = {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    };
    if (ext === "html") {
      // User-uploaded HTML is untrusted. It must be linked via the separate
      // *.up.railway.app domain (see BuildCard's UPLOADS_ORIGIN) rather than
      // the campai.cortexresearch.group custom domain, so it never shares a
      // cookie jar or passes Origin-based CSRF checks against the real site.
      // allow-same-origin is safe *because* of that domain split — it only
      // grants same-origin powers (localStorage, sessionStorage, etc, which
      // real single-page demos rely on) within that isolated origin.
      headers["Content-Security-Policy"] = "sandbox allow-scripts allow-popups allow-same-origin";
    }
    return new NextResponse(new Uint8Array(bytes), { headers });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
