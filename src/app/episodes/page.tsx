import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, Card, Pill, SectionHeading } from "@/components/ui";
import { pool } from "@/lib/db";
import { getEpisodes, episodeSeason, episodeNumberInSeason, type EpisodeStatus } from "@/lib/season";
import { buildEpisodeSlugMap } from "@/lib/episode-slug";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Every episode",
  description:
    "Every CampAI episode and its theme, from Calculator to the current season. Each one is 30 minutes, live, with every build that shipped and who won.",
  alternates: { canonical: "/episodes" },
};

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

export default async function EpisodesIndexPage() {
  const episodes = await getEpisodes();
  const slugs = buildEpisodeSlugMap(episodes);

  const countsResult = await pool.query<{ number: number; build_count: string }>(
    `select (substring(episode from 'E(\\d+)$'))::int as number, count(*) as build_count
       from builds group by 1`
  );
  const buildCounts = new Map(countsResult.rows.map((r) => [Number(r.number), Number(r.build_count)]));

  // Newest first — a visitor landing here most likely wants the recent show,
  // and grouping by season keeps the older archive navigable rather than a
  // flat list of thirty rows.
  const bySeason = new Map<number, typeof episodes>();
  for (const ep of [...episodes].sort((a, b) => b.number - a.number)) {
    const season = episodeSeason(ep.number);
    if (!bySeason.has(season)) bySeason.set(season, []);
    bySeason.get(season)!.push(ep);
  }
  const seasons = [...bySeason.keys()].sort((a, b) => b - a);

  const totalBuilds = [...buildCounts.values()].reduce((sum, n) => sum + n, 0);

  return (
    <>
      <PageHero
        eyebrow="Archive"
        title="Every episode"
        lede={`${episodes.length} episodes, ${totalBuilds} builds, 30 minutes each. Every theme CampAI has run, and everything that shipped against it.`}
      />
      <Container className="py-12">
        <div className="mx-auto max-w-2xl space-y-12">
          {seasons.map((season) => (
            <div key={season}>
              <SectionHeading eyebrow={`Season ${season}`} title={`Season ${season} episodes`} />
              <div className="space-y-3">
                {bySeason.get(season)!.map((ep) => {
                  const count = buildCounts.get(ep.number) ?? 0;
                  return (
                    <Card key={ep.number} className="p-4">
                      <Link href={`/episodes/${slugs.get(ep.number)}`} className="block">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-4">
                            <span className="font-mono text-[11px] font-medium tracking-[0.16em] text-ember-500">
                              {String(episodeNumberInSeason(ep.number)).padStart(2, "0")}
                            </span>
                            <p className="font-display text-[15px] font-semibold text-mist-100">{ep.theme}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[12.5px] text-mist-500">
                              {count} build{count === 1 ? "" : "s"}
                            </span>
                            <Pill tone={STATUS_TONE[ep.status]}>{STATUS_LABEL[ep.status]}</Pill>
                          </div>
                        </div>
                      </Link>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
