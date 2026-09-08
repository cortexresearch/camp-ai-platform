import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "@/lib/db";
import { SEASON, SEASON_BUILD_GOAL } from "@/lib/season";

const UPLOAD_DIR = "/data/uploads";
const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

const SIZE = 640;
const CENTER_X = 320;
const CENTER_Y = 320;
const RING_R = 280;
const RING_STROKE = 28;
const AVATAR_D = 575;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

const COLOR = {
  ink950: "#05070b",
  ink900: "#080b12",
  ink600: "#2e3747",
  mist100: "#f2f5f9",
  mist500: "#8b97ab",
  mist700: "#5d6879",
  ember500: "#ff7a1a",
};

interface BadgeUser {
  name: string;
  handle: string;
  avatar_path: string;
}

function monogramGradient(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return `linear-gradient(140deg, hsl(${h} 62% 44%), hsl(${(h + 42) % 360} 58% 26%))`;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// The badge is rendered by Satori (next/og), whose built-in font only covers
// standard Latin glyphs. Unusual characters (e.g. stylized currency-symbol
// look-alikes) render as tofu boxes, so strip anything outside that coverage.
// NFKD first so "fancy text generator" Unicode (bold/italic/script letters,
// which have real compatibility decompositions) folds back to plain ASCII.
function safeBadgeText(input: string): string {
  const cleaned = input.normalize("NFKD").replace(/[^\x20-\x7E]/g, "").trim();
  return cleaned || input.replace(/[^\x20-\x7E]/g, "").trim() || "?";
}

export async function GET(_request: Request, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;

  const result = await pool.query<BadgeUser>(
    `select name, handle, avatar_path from users where handle = $1`,
    [handle]
  );
  const user = result.rows[0];
  if (!user) return new NextResponse("Not found", { status: 404 });

  const countResult = await pool.query<{ count: string }>(
    `select count(*) from builds where user_id = (select id from users where handle = $1) and episode like $2`,
    [handle, `S${SEASON}%`]
  );
  const buildCount = Number(countResult.rows[0]?.count ?? 0);
  const progress = Math.min(buildCount, SEASON_BUILD_GOAL) / SEASON_BUILD_GOAL;
  const dash = CIRCUMFERENCE * progress;

  let avatarUrl = "";
  if (user.avatar_path) {
    try {
      const ext = path.extname(user.avatar_path).slice(1).toLowerCase();
      const bytes = await readFile(path.join(UPLOAD_DIR, user.avatar_path));
      avatarUrl = `data:${MIME_BY_EXT[ext] ?? "image/jpeg"};base64,${bytes.toString("base64")}`;
    } catch {
      avatarUrl = "";
    }
  }
  const initials = safeBadgeText(user.name);

  return new ImageResponse(
    (
      <div
        style={{
          width: SIZE,
          height: SIZE,
          display: "flex",
          background: `linear-gradient(160deg, ${COLOR.ink900}, ${COLOR.ink950})`,
          borderRadius: 40,
          position: "relative",
        }}
      >
        {avatarUrl ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              left: CENTER_X - AVATAR_D / 2,
              top: CENTER_Y - AVATAR_D / 2,
              width: AVATAR_D,
              height: AVATAR_D,
              borderRadius: "50%",
              overflow: "hidden",
              background: COLOR.ink600,
            }}
          >
            <img
              src={avatarUrl}
              width={AVATAR_D}
              height={AVATAR_D}
              style={{ objectFit: "cover" }}
            />
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "absolute",
              left: CENTER_X - AVATAR_D / 2,
              top: CENTER_Y - AVATAR_D / 2,
              width: AVATAR_D,
              height: AVATAR_D,
              borderRadius: "50%",
              background: monogramGradient(user.name),
              color: "white",
              fontSize: 150,
              fontWeight: 700,
            }}
          >
            {initialsOf(initials)}
          </div>
        )}

        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ position: "absolute", left: 0, top: 0 }}>
          <circle cx={CENTER_X} cy={CENTER_Y} r={RING_R} stroke={COLOR.ink600} strokeWidth={RING_STROKE} fill="none" />
          <circle
            cx={CENTER_X}
            cy={CENTER_Y}
            r={RING_R}
            stroke={COLOR.ember500}
            strokeWidth={RING_STROKE}
            fill="none"
            strokeLinecap="butt"
            strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
            transform={`rotate(-90 ${CENTER_X} ${CENTER_Y})`}
          />
        </svg>

        <div
          style={{
            display: "flex",
            position: "absolute",
            left: CENTER_X - 150,
            top: CENTER_Y + 150,
            width: 300,
            justifyContent: "center",
            padding: "10px 16px",
            borderRadius: 999,
            background: COLOR.ember500,
            fontSize: 15,
            fontWeight: 700,
            color: COLOR.ink950,
            whiteSpace: "nowrap",
          }}
        >
          {`@${user.handle} · ${buildCount}/${SEASON_BUILD_GOAL} · S${SEASON}`}
        </div>

        <div style={{ display: "flex", position: "absolute", right: 28, bottom: 22, fontSize: 16, color: COLOR.mist700 }}>
          🏕️ AI
        </div>
      </div>
    ),
    { width: SIZE, height: SIZE, headers: { "Cache-Control": "public, max-age=300" } }
  );
}
