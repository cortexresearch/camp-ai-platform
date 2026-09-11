import type { Metadata } from "next";
import { Container, PageHero, Button, EmptyState } from "@/components/ui";
import { BuildCard, type BuildCardData } from "@/components/BuildCard";
import { AutoRefresh } from "@/components/AutoRefresh";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";
import { getCurrentEpisode, episodeCode, episodeNumberInSeason } from "@/lib/season";

export const metadata: Metadata = {
  alternates: { canonical: "/vote" },
  title: "Vote",
  description:
    "Rate tonight's CampAI builds on name, pitch, product, and UI. Highest score takes the prize.",
};
export const dynamic = "force-dynamic";

export default async function VotePage() {
  const user = await getCurrentUser();
  const currentEpisode = await getCurrentEpisode();

  if (!currentEpisode) {
    return (
      <>
        <PageHero eyebrow="Vote" title="Vote" lede="Rate every build from the latest episode, all in one place." />
        <Container className="py-12">
          <EmptyState title="No builds yet" body="Nothing to vote on yet — check back once builds start coming in." />
        </Container>
      </>
    );
  }

  const result = await pool.query<BuildCardData>(
    `select b.id, b.user_id, b.title, b.how_it_works, b.models_used, b.token_cost, b.prompts_issues,
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
     left join ratings ur_name on ur_name.build_id = b.id and ur_name.user_id = $2 and ur_name.category = 'name'
     left join ratings ur_pitch on ur_pitch.build_id = b.id and ur_pitch.user_id = $2 and ur_pitch.category = 'pitch'
     left join ratings ur_product on ur_product.build_id = b.id and ur_product.user_id = $2 and ur_product.category = 'product'
     left join ratings ur_ui on ur_ui.build_id = b.id and ur_ui.user_id = $2 and ur_ui.category = 'ui'
     left join (select build_id, count(*) as comment_count from comments group by build_id) cs on cs.build_id = b.id
     left join (select build_id, jsonb_agg(jsonb_build_object('name', name, 'handle', handle) order by name) as voters
                from (select distinct r.build_id, u2.id as uid, u2.name, u2.handle from ratings r join users u2 on u2.id = r.user_id) d
                group by build_id) v on v.build_id = b.id
     where b.episode = $1
     order by b.created_at asc`,
    [episodeCode(currentEpisode), user?.id ?? null]
  );

  const builds = result.rows;

  return (
    <>
      <AutoRefresh />
      <PageHero
        eyebrow={`Episode ${episodeNumberInSeason(currentEpisode.number)}${currentEpisode.theme ? ` · ${currentEpisode.theme}` : ""}`}
        title="Vote"
        lede="Rate every build from this episode, all in one place — name, pitch, product, and UI."
        actions={<Button href="/builds" variant="secondary">See all builds</Button>}
      />
      <Container className="py-12">
        {builds.length === 0 ? (
          <EmptyState title="No builds yet" body="No submissions recorded for this episode yet." />
        ) : (
          <div className="mx-auto max-w-2xl space-y-4">
            {builds.map((b) => (
              <BuildCard key={b.id} build={b} viewerId={user?.id ?? null} linkTitle />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
