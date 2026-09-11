import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, Card, Pill, Button, SectionHeading, EmptyState } from "@/components/ui";
import { SeasonPills } from "@/components/SeasonPills";
import { SEASON, getEpisodes, episodeSeason, episodeNumberInSeason, type EpisodeStatus } from "@/lib/season";
import { pool } from "@/lib/db";
import { buildEpisodeSlugMap } from "@/lib/episode-slug";

export const metadata: Metadata = {
  alternates: { canonical: "/season" },
  title: "Season",
  description: `Every episode of Season ${SEASON} — themes, status, and who won.`,
};
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<EpisodeStatus, string> = {
  complete: "Complete",
  live: "Live now",
  upcoming: "Upcoming",
};

const STATUS_TONE: Record<EpisodeStatus, "ember" | "signal" | "aurora"> = {
  complete: "aurora",
  live: "signal",
  upcoming: "ember",
};

interface EpisodeBuildRow {
  id: string;
  title: string;
  author_name: string;
  author_handle: string;
  avg_rating: string;
  rating_count: string;
  rating_points: string;
}

export default async function SeasonPage({
  searchParams,
}: {
  searchParams: Promise<{ episode?: string; season?: string }>;
}) {
  const episodes = await getEpisodes();
  const episodeSlugs = buildEpisodeSlugMap(episodes);
  const { episode: episodeParam, season: seasonParam } = await searchParams;

  const availableSeasons = Array.from(new Set(episodes.map((ep) => episodeSeason(ep.number)))).sort((a, b) => b - a);
  const showAll = seasonParam === "all";
  const selectedSeason = showAll ? null : Number(seasonParam) || SEASON;

  const seasonEpisodes = episodes.filter((ep) => showAll || episodeSeason(ep.number) === selectedSeason);

  // Build codes are frozen text at submission time (e.g. "S1E4", "S2E16"), not
  // derived from the current SEASON constant — so which episodes actually have
  // builds has to come from the builds table itself, not from re-deriving codes.
  const codesResult = await pool.query<{ episode: string; number: number }>(
    `select distinct episode, (substring(episode from 'E(\\d+)$'))::int as number from builds`
  );
  const codeByNumber = new Map(codesResult.rows.map((r) => [r.number, r.episode]));
  const selectableEpisodes = seasonEpisodes.filter((ep) => codeByNumber.has(ep.number));

  // Default to the most recent episode that actually has builds, not whatever
  // getCurrentEpisode() reports — that can be an upcoming episode (no builds
  // yet) once the live show wraps and the next one is scheduled.
  const selectedNumber = Number(episodeParam) || selectableEpisodes[selectableEpisodes.length - 1]?.number;
  const selectedEpisode = episodes.find((ep) => ep.number === selectedNumber) ?? null;
  const buildCode = selectedNumber ? codeByNumber.get(selectedNumber) : undefined;

  let episodeBuilds: EpisodeBuildRow[] = [];
  if (buildCode) {
    const result = await pool.query<EpisodeBuildRow>(
      `select b.id, b.title, u.name as author_name, u.handle as author_handle,
              coalesce(avg(r.stars), 0) as avg_rating,
              count(r.stars) as rating_count,
              coalesce(sum(r.stars), 0) as rating_points
       from builds b
       join users u on u.id = b.user_id
       left join ratings r on r.build_id = b.id
       where b.episode = $1
       group by b.id, u.name, u.handle
       order by rating_points desc, b.created_at asc`,
      [buildCode]
    );
    episodeBuilds = result.rows;
  }

  return (
    <>
      <PageHero
        eyebrow={showAll ? "All seasons" : `Season ${selectedSeason}`}
        title={showAll || selectedSeason === SEASON ? "This season" : `Season ${selectedSeason}`}
        lede="Every episode, its theme, and where it stands."
      />
      <Container className="py-12">
        <div className="mx-auto max-w-2xl">
          <SeasonPills
            basePath="/season"
            availableSeasons={availableSeasons}
            selectedSeason={selectedSeason}
            showAll={showAll}
          />
        </div>
        <div className="mx-auto max-w-2xl space-y-3">
          {seasonEpisodes.map((ep) => (
            <Card key={ep.number} className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="flex items-center gap-4">
                <span className="font-mono text-[11px] font-medium tracking-[0.16em] text-ember-500">
                  {String(episodeNumberInSeason(ep.number)).padStart(2, "0")}
                </span>
                <Link
                  href={`/episodes/${episodeSlugs.get(ep.number)}`}
                  className="font-display text-[15px] font-semibold text-mist-100 hover:text-ember-400"
                >
                  {ep.theme}
                </Link>
              </div>
              <div className="flex items-center gap-3">
                {codeByNumber.has(ep.number) && (
                  <Link href={`/builds?season=${episodeSeason(ep.number)}`} className="text-[12.5px] text-aurora-300 hover:underline">
                    See builds ↗
                  </Link>
                )}
                {ep.x_spaces_url && (
                  <a
                    href={ep.x_spaces_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[12.5px] text-aurora-300 hover:underline"
                  >
                    X Spaces ↗
                  </a>
                )}
                <Pill tone={STATUS_TONE[ep.status]}>{STATUS_LABEL[ep.status]}</Pill>
              </div>
            </Card>
          ))}
        </div>

        <div className="rule my-14" />

        <SectionHeading eyebrow="Episode results" title="Who won" />

        <form action="/season" method="get" className="mb-6 flex flex-wrap items-end gap-3">
          {seasonParam && <input type="hidden" name="season" value={seasonParam} />}
          <div>
            <label className="field-label" htmlFor="episode">Episode</label>
            <select id="episode" name="episode" defaultValue={selectedNumber} className="field-input">
              {selectableEpisodes
                .slice()
                .reverse()
                .map((ep) => (
                  <option key={ep.number} value={ep.number}>
                    Episode {episodeNumberInSeason(ep.number)} · {ep.theme}
                  </option>
                ))}
            </select>
          </div>
          <Button type="submit" variant="secondary">View</Button>
        </form>

        {!buildCode || episodeBuilds.length === 0 ? (
          <EmptyState
            title="No builds yet"
            body={
              selectedEpisode
                ? `No submissions recorded for Episode ${episodeNumberInSeason(selectedEpisode.number)} · ${selectedEpisode.theme}.`
                : "No submissions recorded for this episode."
            }
          />
        ) : (
          <div className="space-y-3">
            {episodeBuilds.map((b) => {
              // Everyone tied for the top score wins — not just whoever happened
              // to submit first, which the created_at tiebreak in the query above
              // is only there to give a stable sort order, not to break ties for prizes.
              const isWinner = Number(b.rating_points) === Number(episodeBuilds[0].rating_points);
              return (
              <Card key={b.id} className={isWinner ? "border-ember-500/50 bg-ember-500/[0.05] p-4" : "p-4"}>
                <Link href={`/builds/${b.id}`} className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    {isWinner && <Pill tone="ember">🏆 Winner</Pill>}
                    <div className="min-w-0">
                      <p className="truncate font-display text-[14px] font-semibold text-mist-100">{b.title}</p>
                      <p className="truncate text-[12px] text-mist-700">by {b.author_name}</p>
                    </div>
                  </div>
                  <Pill tone="neutral" className="shrink-0">
                    {Number(b.rating_count) > 0
                      ? `★ ${Number(b.avg_rating).toFixed(1)} · ${b.rating_points} pts`
                      : "No ratings yet"}
                  </Pill>
                </Link>
              </Card>
              );
            })}
          </div>
        )}
      </Container>
    </>
  );
}
