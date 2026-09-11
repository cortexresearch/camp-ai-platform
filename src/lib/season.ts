import "server-only";
import { pool } from "./db";

export type EpisodeStatus = "complete" | "live" | "upcoming";

export interface Episode {
  id: string;
  number: number;
  theme: string;
  brief: string;
  status: EpisodeStatus;
  x_spaces_url: string;
  live_at: string | null;
}

export const SEASON = 2;
export const SEASON_BUILD_GOAL = 15;

// Each season runs for SEASON_BUILD_GOAL episodes, so a season can be derived
// straight from an episode's global number (episodes 1-15 -> season 1, 16-30 -> season 2, ...).
export function episodeSeason(episodeNumber: number): number {
  return Math.ceil(episodeNumber / SEASON_BUILD_GOAL);
}

// The `episodes` table numbers episodes globally (season 2 starts at 16), but
// showing that to users reads as "why is tonight's episode 16" — display the
// position within its own season instead.
export function episodeNumberInSeason(episodeNumber: number): number {
  return episodeNumber - (episodeSeason(episodeNumber) - 1) * SEASON_BUILD_GOAL;
}

export const SEASON_THEME = "Groups";

export const SEASON_SPONSOR = {
  name: "GroupGPT",
  url: "https://chat.groupgpt.tech",
  blurb:
    "The original real-time group chat AI — private rooms, a living knowledge base, and an AI teammate you can put to work with commands like code!, research!, and rule!.",
};

/** Tonight's build window. Update per episode. */
export const TONIGHT = {
  prize: "$20",
  submissionStart: "2026-09-10T20:30:00-05:00",
  submissionDeadline: "2026-09-10T21:00:00-05:00",
};

export async function getEpisodes(): Promise<Episode[]> {
  const result = await pool.query<Episode>(
    `select id, number, theme, brief, status, x_spaces_url, live_at from episodes order by number asc`
  );
  const now = Date.now();
  // No background job flips status at showtime — derive it here instead, so an
  // 'upcoming' episode reads as 'live' the moment now() passes its live_at,
  // on every request, without anyone having to touch the admin panel.
  return result.rows.map((ep) => ({
    ...ep,
    status: ep.status === "upcoming" && ep.live_at && new Date(ep.live_at).getTime() <= now ? "live" : ep.status,
  }));
}

// How long the homepage treats an episode as "live now" (redirect to /vote, "Live now"
// badge) after its live_at. Covers the build + vote window; after this it reads as a
// normal past episode instead of redirecting forever until someone marks it complete.
export const SHOW_WINDOW_HOURS = 3;

export function isEpisodeLiveNow(ep: Pick<Episode, "status" | "live_at"> | null | undefined): boolean {
  if (!ep || ep.status !== "live") return false;
  if (!ep.live_at) return true;
  const elapsedMs = Date.now() - new Date(ep.live_at).getTime();
  return elapsedMs < SHOW_WINDOW_HOURS * 60 * 60 * 1000;
}

export async function getCurrentEpisode(): Promise<Episode | null> {
  const episodes = await getEpisodes();
  if (episodes.length === 0) return null;
  return episodes.find((e) => e.status === "live") ?? episodes[episodes.length - 1];
}

export function episodeCode(ep: Pick<Episode, "number">): string {
  return `S${SEASON}E${ep.number}`;
}

export function episodeLabel(ep: Pick<Episode, "number" | "theme">): string {
  return `Season ${episodeSeason(ep.number)} · Episode ${episodeNumberInSeason(ep.number)} · ${ep.theme}`;
}

/** Parses a frozen build code like "S1E4" into its season and in-season episode number. */
export function formatEpisodeCode(code: string): string {
  const m = code.match(/^S(\d+)E(\d+)$/);
  if (!m) return code;
  const season = Number(m[1]);
  const globalNumber = Number(m[2]);
  return `Season ${season} · Episode ${globalNumber - (season - 1) * SEASON_BUILD_GOAL}`;
}

/** SQL expression that pulls the season number out of an "S{n}E{n}" episode code. */
export function seasonSqlExpr(column: string): string {
  return `coalesce((substring(${column} from 'S(\\d+)E'))::int, 0)`;
}

export async function getLatestEpisodeWithBuilds(): Promise<{ number: number; theme: string; code: string } | null> {
  const codesResult = await pool.query<{ episode: string; number: number }>(
    `select episode, (substring(episode from 'E(\\d+)$'))::int as number from builds
     order by number desc nulls last limit 1`
  );
  const latest = codesResult.rows[0];
  if (!latest) return null;
  const episodes = await getEpisodes();
  const ep = episodes.find((e) => e.number === latest.number);
  return { number: latest.number, theme: ep?.theme ?? "", code: latest.episode };
}

export async function getAvailableSeasons(): Promise<number[]> {
  const expr = seasonSqlExpr("episode");
  const result = await pool.query<{ season: number }>(
    `select distinct ${expr} as season from builds where ${expr} > 0 order by season desc`
  );
  return result.rows.map((r) => r.season);
}
