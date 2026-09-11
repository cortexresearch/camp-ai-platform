import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, PageHero, Card, Pill, Button, SectionHeading, EmptyState } from "@/components/ui";
import { EpisodeJsonLd } from "@/components/JsonLd";
import { pool } from "@/lib/db";
import { getEpisodes, episodeSeason, episodeNumberInSeason, type Episode } from "@/lib/season";
import { buildEpisodeSlugMap, episodeNumberForSlug } from "@/lib/episode-slug";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

interface EpisodeBuildRow {
  id: string;
  title: string;
  how_it_works: string;
  author_name: string;
  author_handle: string;
  rating_points: string;
  rating_count: string;
  avg_rating: string;
}

async function getEpisodeBuilds(episodeNumber: number): Promise<EpisodeBuildRow[]> {
  // Build codes are frozen text written at submission time ("S2E24"), so match
  // on the trailing number rather than re-deriving the code from the current
  // season constant — a build submitted last season still has to resolve.
  const result = await pool.query<EpisodeBuildRow>(
    `select b.id, b.title, b.how_it_works, u.name as author_name, u.handle as author_handle,
            coalesce(sum(r.stars), 0) as rating_points,
            count(r.stars) as rating_count,
            coalesce(avg(r.stars), 0) as avg_rating
       from builds b
       join users u on u.id = b.user_id
       left join ratings r on r.build_id = b.id
      where (substring(b.episode from 'E(\\d+)$'))::int = $1
      group by b.id, u.name, u.handle
      order by rating_points desc, b.created_at asc`,
    [episodeNumber]
  );
  return result.rows;
}

async function resolveEpisode(slug: string): Promise<{ episode: Episode; episodes: Episode[] } | null> {
  const episodes = await getEpisodes();
  const number = episodeNumberForSlug(episodes, slug);
  if (number === null) return null;
  const episode = episodes.find((e) => e.number === number);
  return episode ? { episode, episodes } : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveEpisode(slug);
  if (!resolved) return { title: "Episode", robots: { index: false, follow: true } };

  const { episode } = resolved;
  const season = episodeSeason(episode.number);
  const inSeason = episodeNumberInSeason(episode.number);
  const brief = (episode.brief ?? "").replace(/\s+/g, " ").trim();

  const description = (
    brief ||
    `Season ${season}, Episode ${inSeason} of CampAI: ${episode.theme}. Builders had 30 minutes to build and ship on the theme, live. See every build, how it was made, and who won.`
  ).slice(0, 300);

  return {
    title: `${episode.theme} — Season ${season}, Episode ${inSeason}`,
    description,
    alternates: { canonical: `/episodes/${slug}` },
    openGraph: {
      type: "article",
      title: `${episode.theme} — CampAI Season ${season}, Episode ${inSeason}`,
      description: description.slice(0, 200),
      url: `${SITE_URL}/episodes/${slug}`,
    },
  };
}

export default async function EpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await resolveEpisode(slug);
  if (!resolved) notFound();

  const { episode, episodes } = resolved;
  const season = episodeSeason(episode.number);
  const inSeason = episodeNumberInSeason(episode.number);
  const builds = await getEpisodeBuilds(episode.number);
  const slugs = buildEpisodeSlugMap(episodes);

  // Previous and next by episode number. These links are the reason an episode
  // page is reachable by a crawler at all once it drops off the season page —
  // a page nothing links to doesn't get indexed.
  const ordered = [...episodes].sort((a, b) => a.number - b.number);
  const position = ordered.findIndex((e) => e.number === episode.number);
  const previous = position > 0 ? ordered[position - 1] : null;
  const next = position >= 0 && position < ordered.length - 1 ? ordered[position + 1] : null;

  const topPoints = builds.length > 0 ? Number(builds[0].rating_points) : 0;

  return (
    <>
      {episode.live_at && (
        <EpisodeJsonLd
          name={`CampAI Season ${season}, Episode ${inSeason}: ${episode.theme}`}
          description={(episode.brief ?? `Build and ship on the theme "${episode.theme}" in 30 minutes.`).slice(0, 300)}
          startDate={new Date(episode.live_at).toISOString()}
          url={episode.x_spaces_url || `${SITE_URL}/episodes/${slug}`}
        />
      )}

      <PageHero
        eyebrow={`Season ${season} · Episode ${inSeason}`}
        title={episode.theme}
        lede={
          episode.status === "upcoming"
            ? "Coming up — the theme for the next show."
            : `${builds.length} build${builds.length === 1 ? "" : "s"} shipped in 30 minutes, live.`
        }
        actions={
          episode.x_spaces_url ? (
            <Button href={episode.x_spaces_url} variant="secondary">
              Listen on X ↗
            </Button>
          ) : undefined
        }
      />

      <Container className="py-12">
        <div className="mx-auto max-w-2xl space-y-8">
          {episode.brief && (
            <Card className="p-6">
              <h2 className="font-display text-base font-semibold text-mist-100">The brief</h2>
              <p className="mt-3 whitespace-pre-wrap text-[14.5px] leading-relaxed text-mist-300">{episode.brief}</p>
            </Card>
          )}

          <Card className="p-6">
            <h2 className="font-display text-base font-semibold text-mist-100">
              What &ldquo;{episode.theme}&rdquo; meant
            </h2>
            <p className="mt-3 text-[14.5px] leading-relaxed text-mist-300">
              Every CampAI episode sets one theme and one constraint: 30 minutes, live, with AI
              doing the heavy lifting. Season {season}
              {episode.status === "complete" ? "'s" : "'s"} builders took &ldquo;{episode.theme}&rdquo; in
              {builds.length > 1 ? ` ${builds.length} different directions` : " their own direction"} — the
              submissions below are what actually shipped inside the window, with the models used and
              the problems hit written up by the builders themselves.
            </p>
          </Card>

          <div>
            <SectionHeading eyebrow="Submissions" title={builds.length > 0 ? "Every build" : "Builds"} />

            {builds.length === 0 ? (
              <EmptyState
                title="No builds recorded"
                body={
                  episode.status === "upcoming"
                    ? "This episode hasn't run yet. Submissions open when the show starts."
                    : "No submissions were recorded for this episode."
                }
              />
            ) : (
              <div className="space-y-3">
                {builds.map((build) => {
                  // Ties at the top all win — the created_at ordering in the query
                  // exists to keep the sort stable, not to break prize ties.
                  const isWinner = Number(build.rating_points) === topPoints && topPoints > 0;
                  return (
                    <Card key={build.id} className={isWinner ? "border-ember-500/50 bg-ember-500/[0.05] p-4" : "p-4"}>
                      <Link href={`/builds/${build.id}`} className="block">
                        <div className="flex flex-wrap items-center gap-3">
                          {isWinner && <Pill tone="ember">🏆 Winner</Pill>}
                          <p className="font-display text-[15px] font-semibold text-mist-100">{build.title}</p>
                        </div>
                        <p className="mt-1 text-[12.5px] text-mist-500">
                          by {build.author_name} · {Number(build.rating_count)} rating
                          {Number(build.rating_count) === 1 ? "" : "s"}
                        </p>
                        {build.how_it_works && (
                          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-mist-400">
                            {build.how_it_works}
                          </p>
                        )}
                      </Link>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rule" />

          <nav className="flex flex-wrap items-center justify-between gap-4 text-[13px]">
            {previous ? (
              <Link href={`/episodes/${slugs.get(previous.number)}`} className="text-aurora-300 hover:underline">
                ← Episode {episodeNumberInSeason(previous.number)}: {previous.theme}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={`/episodes/${slugs.get(next.number)}`} className="text-aurora-300 hover:underline">
                Episode {episodeNumberInSeason(next.number)}: {next.theme} →
              </Link>
            ) : (
              <span />
            )}
          </nav>

          <div className="flex flex-wrap gap-3 text-[13px]">
            <Button href="/episodes" variant="secondary" size="sm">
              All episodes
            </Button>
            <Button href="/builds" variant="secondary" size="sm">
              All builds
            </Button>
            <Button href="/leaderboard" variant="secondary" size="sm">
              Leaderboard
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
}
