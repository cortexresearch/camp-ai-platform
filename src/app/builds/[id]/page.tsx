import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Card, Button } from "@/components/ui";
import { BuildCard, type BuildCardData } from "@/components/BuildCard";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";
import { addCommentAction, deleteCommentAction } from "@/lib/actions";
import { formatEpisodeCode } from "@/lib/season";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

async function getBuild(id: string, viewerId: string | null) {
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
     where b.id = $1`,
    [id, viewerId]
  );
  return result.rows[0] ?? null;
}

interface CommentRow {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
  author_name: string;
  author_handle: string;
}

async function getComments(buildId: string) {
  const result = await pool.query<CommentRow>(
    `select c.id, c.user_id, c.body, c.created_at, u.name as author_name, u.handle as author_handle
     from comments c
     join users u on u.id = c.user_id
     where c.build_id = $1
     order by c.created_at asc`,
    [buildId]
  );
  return result.rows;
}

/**
 * Metadata reads through its own small query rather than getBuild(), which
 * carries a dozen joins for viewer-specific rating state a crawler never uses.
 * Next calls generateMetadata and the page body separately, so reusing the
 * heavy query would run it twice per request.
 */
async function getBuildMeta(id: string) {
  const result = await pool.query<{
    title: string;
    how_it_works: string;
    episode: string;
    author_name: string;
    author_handle: string;
    theme: string | null;
    avg_rating: string;
    rating_count: string;
  }>(
    `select b.title, b.how_it_works, b.episode,
            u.name as author_name, u.handle as author_handle,
            e.theme,
            coalesce(rs.avg_rating, 0) as avg_rating,
            coalesce(rs.rating_count, 0) as rating_count
     from builds b
     join users u on u.id = b.user_id
     left join episodes e on e.number = (substring(b.episode from 'E(\\d+)$'))::int
     left join (select build_id, avg(stars) as avg_rating, count(distinct user_id) as rating_count
                from ratings group by build_id) rs on rs.build_id = b.id
     where b.id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const build = await getBuildMeta(id);
  if (!build) return { title: "Build", robots: { index: false, follow: true } };

  // Every build page needs a description no other page could have: the build,
  // who made it, which episode and theme it answered, and what it does. One
  // boilerplate description repeated across 160 pages reads as thin content.
  const episodeName = build.episode ? formatEpisodeCode(build.episode) : "";
  const context = [episodeName, build.theme].filter(Boolean).join(" · ");
  const summary = (build.how_it_works ?? "").replace(/\s+/g, " ").trim();

  const description = `${build.title} by ${build.author_name} — built in 30 minutes at CampAI${
    context ? ` (${context})` : ""
  }. ${summary}`
    .slice(0, 300)
    .trim();

  return {
    title: `${build.title} by ${build.author_name}`,
    description,
    alternates: { canonical: `/builds/${id}` },
    openGraph: {
      type: "article",
      title: `${build.title} — built at CampAI`,
      description: description.slice(0, 200),
      url: `${SITE_URL}/builds/${id}`,
    },
  };
}

export default async function BuildDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const user = await getCurrentUser();
  const build = await getBuild(id, user?.id ?? null);
  if (!build) notFound();

  const comments = await getComments(id);

  return (
    <Container className="py-12">
      <div className="mx-auto max-w-2xl">
        <Link href="/builds" className="mb-4 inline-block text-[13px] text-mist-500 hover:text-mist-100">
          ← Back to builds
        </Link>
        <BuildCard build={build} viewerId={user?.id ?? null} />

        <div id="comments" className="mt-8 scroll-mt-20">
          <h2 className="font-display text-base font-semibold text-mist-100">
            {comments.length} comment{comments.length === 1 ? "" : "s"}
          </h2>

          {error && (
            <p className="mt-4 rounded-lg border border-danger-400/40 bg-danger-400/10 px-3.5 py-2.5 text-[13px] text-danger-400">
              {error}
            </p>
          )}

          <div className="mt-4 space-y-3">
            {comments.map((c) => (
              <Card key={c.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12.5px] text-mist-100">
                      <Link href={`/u/${c.author_handle}`} className="font-semibold hover:text-ember-400">
                        {c.author_name}
                      </Link>{" "}
                      <span className="text-mist-700">{new Date(c.created_at).toLocaleString()}</span>
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-mist-300">{c.body}</p>
                  </div>
                  {user && (user.id === c.user_id || user.is_admin) && (
                    <form action={deleteCommentAction}>
                      <input type="hidden" name="comment_id" value={c.id} />
                      <button type="submit" className="shrink-0 text-[11.5px] text-mist-700 hover:text-danger-400">
                        Delete
                      </button>
                    </form>
                  )}
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-5">
            {user ? (
              <form action={addCommentAction} className="space-y-2.5">
                <input type="hidden" name="build_id" value={id} />
                <textarea
                  className="field-input"
                  name="body"
                  rows={3}
                  placeholder="Leave feedback for the builder..."
                  required
                />
                <Button type="submit" size="sm">Post comment</Button>
              </form>
            ) : (
              <Button href="/login" variant="secondary" size="sm">
                Log in to comment
              </Button>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
}
