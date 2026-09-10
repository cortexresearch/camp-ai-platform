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
      // Every entry point uses an opaque origin, including direct app-origin URLs.
      // Stored demos may run scripts, but cannot inherit the application's origin.
      headers["Content-Security-Policy"] = "sandbox allow-scripts allow-popups";
      headers["Referrer-Policy"] = "no-referrer";
    }
    return new NextResponse(new Uint8Array(bytes), { headers });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
