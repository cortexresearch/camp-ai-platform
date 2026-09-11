import type { MetadataRoute } from "next";
import { pool } from "@/lib/db";
import { SITE_URL } from "@/lib/site";
import { getEpisodes } from "@/lib/season";
import { buildEpisodeSlugMap } from "@/lib/episode-slug";

// Built per request rather than at build time: builds and builder profiles are
// added live during a show, and a sitemap that only refreshes on deploy would
// miss them until the next push.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Public, indexable routes. Auth, admin, and API paths are deliberately absent. */
const STATIC_ROUTES: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1.0, changeFrequency: "daily" },
  { path: "/challenge", priority: 0.9, changeFrequency: "daily" },
  { path: "/episodes", priority: 0.9, changeFrequency: "daily" },
  { path: "/builds", priority: 0.9, changeFrequency: "daily" },
  { path: "/leaderboard", priority: 0.8, changeFrequency: "daily" },
  { path: "/season", priority: 0.8, changeFrequency: "daily" },
  { path: "/builders", priority: 0.7, changeFrequency: "weekly" },
  { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" },
  { path: "/rules", priority: 0.6, changeFrequency: "monthly" },
  { path: "/spaces", priority: 0.6, changeFrequency: "weekly" },
  { path: "/about", priority: 0.6, changeFrequency: "monthly" },
  { path: "/faq", priority: 0.6, changeFrequency: "monthly" },
  { path: "/partnership", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  { path: "/support", priority: 0.4, changeFrequency: "yearly" },
  { path: "/code-of-conduct", priority: 0.3, changeFrequency: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // A failed query must not take the whole sitemap down — serving the static
  // routes is far better than serving a 500 to a crawler.
  // One page per episode theme. These are the pages with a real shot at
  // long-tail search: nobody searches "campai episode 24", they search the
  // theme.
  try {
    const episodes = await getEpisodes();
    const slugs = buildEpisodeSlugMap(episodes);
    for (const episode of episodes) {
      const slug = slugs.get(episode.number);
      if (!slug) continue;
      entries.push({
        url: `${SITE_URL}/episodes/${slug}`,
        lastModified: episode.live_at ? new Date(episode.live_at) : now,
        changeFrequency: episode.status === "complete" ? "monthly" : "daily",
        priority: episode.status === "complete" ? 0.7 : 0.9,
      });
    }
  } catch (err) {
    console.error("sitemap: failed to list episodes", err);
  }

  try {
    const builds = await pool.query<{ id: string; created_at: Date }>(
      `select id, created_at from builds order by created_at desc limit 1000`
    );
    for (const build of builds.rows) {
      entries.push({
        url: `${SITE_URL}/builds/${build.id}`,
        lastModified: build.created_at ?? now,
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (err) {
    console.error("sitemap: failed to list builds", err);
  }

  try {
    const builders = await pool.query<{ handle: string }>(
      `select u.handle from users u
        where u.handle is not null and u.handle <> ''
          and exists (select 1 from builds b where b.user_id = u.id)
        limit 1000`
    );
    for (const builder of builders.rows) {
      entries.push({
        url: `${SITE_URL}/u/${builder.handle}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.5,
      });
    }
  } catch (err) {
    console.error("sitemap: failed to list builders", err);
  }

  return entries;
}
