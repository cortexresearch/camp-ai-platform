import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, PageHero, Card, Button, Pill, Avatar, EmptyState } from "@/components/ui";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SEASON, SEASON_BUILD_GOAL, formatEpisodeCode } from "@/lib/season";
import { SITE_URL } from "@/lib/site";
import {
  addPortfolioItemAction,
  changePasswordAction,
  deletePortfolioItemAction,
  updateProfileAction,
  updateProfileSocialsAction,
} from "@/lib/actions";

interface ProfileUser {
  id: string;
  name: string;
  handle: string;
  role: "builder" | "judge";
  created_at: string;
  x_url: string;
  github_url: string;
  website_url: string;
  avatar_path: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  url: string;
  description: string;
  created_at: string;
  build_id: string | null;
  build_episode: string | null;
}

interface UserBuild {
  id: string;
  title: string;
  episode: string;
  created_at: string;
}

function socialUsername(url: string): string {
  if (!url) return "";
  const match = url.match(/^https?:\/\/[^/]+\/@?([^/?#]+)/i);
  return match ? match[1] : url;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;

  const result = await pool.query<{
    name: string;
    build_count: string;
    latest_title: string | null;
    latest_theme: string | null;
  }>(
    `select u.name,
            (select count(*) from builds b where b.user_id = u.id) as build_count,
            (select b.title from builds b where b.user_id = u.id order by b.created_at desc limit 1) as latest_title,
            (select e.theme from builds b
               left join episodes e on e.number = (substring(b.episode from 'E(\\d+)$'))::int
              where b.user_id = u.id order by b.created_at desc limit 1) as latest_theme
       from users u where u.handle = $1`,
    [handle]
  );

  const profile = result.rows[0];
  if (!profile) return { title: `@${handle}`, robots: { index: false, follow: true } };

  const builds = Number(profile.build_count ?? 0);

  // An empty profile is a real page but not a useful search result. Letting the
  // ones with nothing on them into the index drags on the whole site's quality
  // signal; they stay crawlable so their links still count.
  if (builds === 0) {
    return {
      title: `${profile.name} (@${handle})`,
      description: `${profile.name} on CampAI.`,
      alternates: { canonical: `/u/${handle}` },
      robots: { index: false, follow: true },
    };
  }

  const latest = profile.latest_title
    ? ` Most recent: ${profile.latest_title}${profile.latest_theme ? ` (${profile.latest_theme})` : ""}.`
    : "";

  return {
    title: `${profile.name} (@${handle})`,
    description:
      `${profile.name} has shipped ${builds} build${builds === 1 ? "" : "s"} at CampAI, ` +
      `the live vibe coding hyper hackathon.${latest} See their builds, ratings, and season standing.`,
    alternates: { canonical: `/u/${handle}` },
    openGraph: {
      type: "profile",
      title: `${profile.name} (@${handle}) — CampAI builder`,
      description: `${builds} build${builds === 1 ? "" : "s"} shipped at CampAI.${latest}`,
      url: `${SITE_URL}/u/${handle}`,
    },
  };
}

export default async function ProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { handle } = await params;
  const { error, success } = await searchParams;

  const userResult = await pool.query<ProfileUser>(
    `select id, name, handle, role, created_at, x_url, github_url, website_url, avatar_path from users where handle = $1`,
    [handle]
  );
  const profile = userResult.rows[0];
  if (!profile) notFound();

  const itemsResult = await pool.query<PortfolioItem>(
    `select p.id, p.title, p.url, p.description, p.created_at, p.build_id, b.episode as build_episode
     from portfolio_items p
     left join builds b on b.id = p.build_id
     where p.user_id = $1
     order by p.created_at desc`,
    [profile.id]
  );
  const items = itemsResult.rows;

  const buildsResult = await pool.query<UserBuild>(
    `select id, title, episode, created_at from builds where user_id = $1 order by created_at desc`,
    [profile.id]
  );
  const builds = buildsResult.rows;

  const viewer = await getCurrentUser();
  const isOwner = viewer?.id === profile.id;

  const seasonBuildCount = builds.filter((b) => b.episode.startsWith(`S${SEASON}`)).length;

  return (
    <>
      <PageHero
        eyebrow={profile.role === "judge" ? "Judge" : "Builder"}
        title={profile.name}
        lede={`@${profile.handle}`}
        actions={
          <div className="flex items-center gap-3">
            <Avatar name={profile.name} src={profile.avatar_path ? `/api/uploads/${profile.avatar_path}` : undefined} size={56} />
            <Pill tone={profile.role === "judge" ? "aurora" : "ember"}>{profile.role}</Pill>
          </div>
        }
      />
      <Container className="py-12">
        <div className="mx-auto max-w-2xl space-y-8">
          {error && (
            <p className="rounded-lg border border-danger-400/40 bg-danger-400/10 px-3.5 py-2.5 text-[13px] text-danger-400">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-lg border border-signal-400/40 bg-signal-400/10 px-3.5 py-2.5 text-[13px] text-signal-400">
              {success}
            </p>
          )}

          {(profile.x_url || profile.github_url || profile.website_url) && (
            <div className="flex flex-wrap gap-4 text-[13px]">
              {profile.x_url && (
                <a href={profile.x_url} target="_blank" rel="noopener noreferrer" className="text-aurora-300 hover:underline">
                  X ↗
                </a>
              )}
              {profile.github_url && (
                <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-aurora-300 hover:underline">
                  GitHub ↗
                </a>
              )}
              {profile.website_url && (
                <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className="text-aurora-300 hover:underline">
                  Website ↗
                </a>
              )}
            </div>
          )}

          <Card className="p-6">
            <h3 className="font-display text-base font-semibold text-mist-100">Build badge</h3>
            <p className="mt-1 text-[13px] text-mist-500">
              Proof of build: {seasonBuildCount} of {SEASON_BUILD_GOAL} builds this season.
            </p>
            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
              <img
                src={`/api/badge/${profile.handle}`}
                alt={`${profile.name}'s build badge`}
                width={220}
                height={220}
                className="rounded-2xl"
              />
              <Button
                href={`/api/badge/${profile.handle}`}
                download={`${profile.handle}-build-badge.png`}
                variant="secondary"
              >
                Download badge
              </Button>
            </div>
          </Card>

          {isOwner && (
            <Card className="p-6">
              <h3 className="font-display text-base font-semibold text-mist-100">Edit profile</h3>
              <form action={updateProfileAction} className="mt-4 space-y-4">
                <div>
                  <span className="field-label">Photo</span>
                  <div className="flex items-center gap-3">
                    <Avatar name={profile.name} src={profile.avatar_path ? `/api/uploads/${profile.avatar_path}` : undefined} size={48} />
                    <input
                      className="field-input"
                      id="avatar"
                      name="avatar"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                    />
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-mist-700">PNG, JPG, WEBP, or GIF, under 5MB. Leave blank to keep your current photo.</p>
                </div>
                <div>
                  <label className="field-label" htmlFor="profile-name">Name</label>
                  <input
                    className="field-input"
                    id="profile-name"
                    name="name"
                    type="text"
                    defaultValue={profile.name}
                    required
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="profile-handle">Handle</label>
                  <input
                    className="field-input"
                    id="profile-handle"
                    name="handle"
                    type="text"
                    defaultValue={profile.handle}
                    pattern="[A-Za-z0-9\-]{3,24}"
                    maxLength={24}
                    required
                  />
                  <p className="mt-1.5 text-[11.5px] text-mist-700">
                    Your profile URL: campai.cortexresearch.group/u/&lt;handle&gt;. Letters, numbers, hyphens —
                    we'll lowercase it for you.
                  </p>
                </div>
                <Button type="submit">Save profile</Button>
              </form>
            </Card>
          )}

          {isOwner && (
            <Card className="p-6">
              <h3 className="font-display text-base font-semibold text-mist-100">Your socials</h3>
              <form action={updateProfileSocialsAction} className="mt-4 space-y-4">
                <div>
                  <label className="field-label" htmlFor="x_username">X</label>
                  <div className="field-input flex items-center gap-1 !p-0 pl-3.5 focus-within:border-ember-500/60">
                    <span className="shrink-0 text-[13px] text-mist-700">x.com/</span>
                    <input
                      className="w-full bg-transparent py-[0.65rem] pr-3.5 text-[16px] text-mist-100 outline-none placeholder:text-mist-700 sm:text-[14px]"
                      id="x_username"
                      name="x_username"
                      type="text"
                      placeholder="you"
                      defaultValue={socialUsername(profile.x_url)}
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label" htmlFor="github_username">GitHub</label>
                  <div className="field-input flex items-center gap-1 !p-0 pl-3.5 focus-within:border-ember-500/60">
                    <span className="shrink-0 text-[13px] text-mist-700">github.com/</span>
                    <input
                      className="w-full bg-transparent py-[0.65rem] pr-3.5 text-[16px] text-mist-100 outline-none placeholder:text-mist-700 sm:text-[14px]"
                      id="github_username"
                      name="github_username"
                      type="text"
                      placeholder="you"
                      defaultValue={socialUsername(profile.github_url)}
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label" htmlFor="website_url">Website</label>
                  <input
                    className="field-input"
                    id="website_url"
                    name="website_url"
                    type="url"
                    placeholder="https://"
                    defaultValue={profile.website_url}
                  />
                </div>
                <Button type="submit">Save socials</Button>
              </form>
            </Card>
          )}

          {isOwner && (
            <Card className="p-6">
              <h3 className="font-display text-base font-semibold text-mist-100">Change password</h3>
              <form action={changePasswordAction} className="mt-4 space-y-4">
                <div>
                  <label className="field-label" htmlFor="current_password">Current password</label>
                  <input
                    className="field-input"
                    id="current_password"
                    name="current_password"
                    type="password"
                    required
                    autoComplete="current-password"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="new_password">New password</label>
                  <input
                    className="field-input"
                    id="new_password"
                    name="new_password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="confirm_password">Confirm new password</label>
                  <input
                    className="field-input"
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit">Update password</Button>
              </form>
            </Card>
          )}

          <div>
            <h2 className="font-display text-lg font-semibold text-mist-100">Portfolio</h2>
            {items.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  title="Nothing here yet"
                  body={isOwner ? "Submit a build or add past work below." : `${profile.name} hasn't added anything yet.`}
                />
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {items.map((item) => (
                  <Card key={item.id} as="li" className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        {item.build_id ? (
                          <Link
                            href={`/builds/${item.build_id}`}
                            className="font-display text-[15px] font-semibold text-mist-100 hover:text-ember-400"
                          >
                            {item.title}
                          </Link>
                        ) : item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-display text-[15px] font-semibold text-mist-100 hover:text-ember-400"
                          >
                            {item.title}
                          </a>
                        ) : (
                          <p className="font-display text-[15px] font-semibold text-mist-100">{item.title}</p>
                        )}
                        {item.build_episode ? (
                          <p className="mt-1 text-[12px] text-mist-600">{formatEpisodeCode(item.build_episode)}</p>
                        ) : (
                          item.description && (
                            <p className="mt-1.5 text-[13px] leading-relaxed text-mist-500">{item.description}</p>
                          )
                        )}
                      </div>
                      {isOwner && !item.build_id && (
                        <form action={deletePortfolioItemAction}>
                          <input type="hidden" name="item_id" value={item.id} />
                          <Button type="submit" variant="ghost" size="sm">
                            Remove
                          </Button>
                        </form>
                      )}
                    </div>
                  </Card>
                ))}
              </ul>
            )}
          </div>

          {isOwner && (
            <Card className="p-6">
              <h3 className="font-display text-base font-semibold text-mist-100">Add previous work</h3>
              <form action={addPortfolioItemAction} className="mt-4 space-y-4">
                <div>
                  <label className="field-label" htmlFor="title">Title</label>
                  <input className="field-input" id="title" name="title" type="text" required />
                </div>
                <div>
                  <label className="field-label" htmlFor="url">Link (optional)</label>
                  <input className="field-input" id="url" name="url" type="url" placeholder="https://" />
                </div>
                <div>
                  <label className="field-label" htmlFor="description">Description (optional)</label>
                  <textarea className="field-input" id="description" name="description" rows={3} />
                </div>
                <Button type="submit">Add to portfolio</Button>
              </form>
            </Card>
          )}
        </div>
      </Container>
    </>
  );
}
