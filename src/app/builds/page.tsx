import type { Metadata } from "next";
import { Container, PageHero, Button, EmptyState, SectionHeading } from "@/components/ui";
import { BuildCard, type BuildCardData } from "@/components/BuildCard";
import { SeasonPills } from "@/components/SeasonPills";
import { AutoRefresh } from "@/components/AutoRefresh";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";
import {
  getCurrentEpisode,
  episodeLabel,
  getAvailableSeasons,
  getLatestEpisodeWithBuilds,
  episodeSeason,
  episodeNumberInSeason,
  seasonSqlExpr,
  SEASON,
} from "@/lib/season";

export const metadata: Metadata = {
  alternates: { canonical: "/builds" },
  title: "Builds",
  description:
    "Every build shipped at CampAI, episode by episode — what it does, how it was made, and what it scored.",
};
export const dynamic = "force-dynamic";

export default async function BuildsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; updated?: string; deleted?: string; season?: string }>;
}) {
  const user = await getCurrentUser();
  const { submitted, updated, deleted, season: seasonParam } = await searchParams;
  const currentEpisode = await getCurrentEpisode();

  const availableSeasons = await getAvailableSeasons();

  const showAll = seasonParam === "all";
  const selectedSeason = showAll ? null : Number(seasonParam) || SEASON;

  const result = await pool.query<BuildCardData>(
    `select b.id, b.user_id, b.episode, b.title, b.how_it_works, b.models_used, b.token_cost, b.prompts_issues,
            b.demo_url, b.repo_url, b.screenshot_path, b.html_demo_path, b.mobile_friendly,
            u.name as author_name, u.handle as author_handle,
            coalesce(rs.avg_rating, 0) as avg_rating,
            coalesce(rs.rating_count, 0) as rating_count,
            ur_name.stars as user_rating_name,
            ur_pitch.stars as user_rating_pitch,
            ur_product.stars as user_rating_product,
            ur_ui.stars as user_rating_ui,
            (ur_name.created_at > now() - interval '10 minutes') as user_rating_name_editable,
            (ur_pitch.created_at > now() - interval '10 minutes') as user_rating_pitch_editable,
            (ur_product.created_at > now() - interval '10 minutes') as user_rating_product_editable,
            (ur_ui.created_at > now() - interval '10 minutes') as user_rating_ui_editable,
            coalesce(cs.comment_count, 0) as comment_count,
            v.voters
     from builds b
     join users u on u.id = b.user_id
     left join (select build_id, avg(stars) as avg_rating, count(distinct user_id) as rating_count, sum(stars) as rating_points
                from ratings group by build_id) rs on rs.build_id = b.id
     left join ratings ur_name on ur_name.build_id = b.id and ur_name.user_id = $1 and ur_name.category = 'name'
     left join ratings ur_pitch on ur_pitch.build_id = b.id and ur_pitch.user_id = $1 and ur_pitch.category = 'pitch'
     left join ratings ur_product on ur_product.build_id = b.id and ur_product.user_id = $1 and ur_product.category = 'product'
     left join ratings ur_ui on ur_ui.build_id = b.id and ur_ui.user_id = $1 and ur_ui.category = 'ui'
     left join (select build_id, count(*) as comment_count from comments group by build_id) cs on cs.build_id = b.id
     left join (select build_id, jsonb_agg(jsonb_build_object('name', name, 'handle', handle) order by name) as voters
                from (select distinct r.build_id, u2.id as uid, u2.name, u2.handle from ratings r join users u2 on u2.id = r.user_id) d
                group by build_id) v on v.build_id = b.id
     where $2::int is null or ${seasonSqlExpr("b.episode")} = $2::int
     order by coalesce(rs.rating_points, 0) desc, b.created_at asc`,
    [user?.id ?? null, selectedSeason]
  );

  const builds = result.rows;

  const latestEpisode = await getLatestEpisodeWithBuilds();
  const pinCurrentEpisode = latestEpisode && (showAll || episodeSeason(latestEpisode.number) === selectedSeason);
  const pinnedBuilds = pinCurrentEpisode ? builds.filter((b) => b.episode === latestEpisode!.code) : [];
  const restBuilds = pinCurrentEpisode ? builds.filter((b) => b.episode !== latestEpisode!.code) : builds;

  return (
    <>
      <AutoRefresh />
      <PageHero
        eyebrow={currentEpisode ? episodeLabel(currentEpisode) : "Builds"}
        title="Builds"
        lede={
          showAll
            ? "Every build, every season. Rate your favorites and leave feedback."
            : selectedSeason === SEASON
              ? "Everything shipped this season. Rate your favorites and leave feedback."
              : `Everything shipped in Season ${selectedSeason}. Rate your favorites and leave feedback.`
        }
        actions={<Button href="/submit">Submit your build</Button>}
      />
      <Container className="py-12">
        <SeasonPills
          basePath="/builds"
          availableSeasons={availableSeasons}
          selectedSeason={selectedSeason}
          showAll={showAll}
        />

        {submitted && (
          <p className="mb-6 rounded-lg border border-aurora-400/40 bg-aurora-400/10 px-4 py-3 text-[13.5px] text-aurora-300">
            Your build is up. Thanks for shipping.
          </p>
        )}
        {updated && (
          <p className="mb-6 rounded-lg border border-aurora-400/40 bg-aurora-400/10 px-4 py-3 text-[13.5px] text-aurora-300">
            Your build has been updated.
          </p>
        )}
        {deleted && (
          <p className="mb-6 rounded-lg border border-aurora-400/40 bg-aurora-400/10 px-4 py-3 text-[13.5px] text-aurora-300">
            Your build has been deleted.
          </p>
        )}

        {builds.length === 0 ? (
          <EmptyState
            title="No builds yet"
            body={showAll ? "Be the first to submit tonight." : `No builds yet for Season ${selectedSeason}. Be the first to submit tonight.`}
            action={<Button href="/submit">Submit your build</Button>}
          />
        ) : pinnedBuilds.length > 0 ? (
          <>
            <SectionHeading
              eyebrow={`Episode ${episodeNumberInSeason(latestEpisode!.number)}`}
              title={latestEpisode!.theme || "This episode"}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              {pinnedBuilds.map((b) => (
                <BuildCard key={b.id} build={b} viewerId={user?.id ?? null} linkTitle />
              ))}
            </div>

            {restBuilds.length > 0 && (
              <>
                <div className="rule my-10" />
                <SectionHeading eyebrow={showAll ? "All seasons" : `Season ${selectedSeason}`} title="Earlier this season" />
                <div className="grid gap-4 lg:grid-cols-2">
                  {restBuilds.map((b) => (
                    <BuildCard key={b.id} build={b} viewerId={user?.id ?? null} linkTitle />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {builds.map((b) => (
              <BuildCard key={b.id} build={b} viewerId={user?.id ?? null} linkTitle />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
