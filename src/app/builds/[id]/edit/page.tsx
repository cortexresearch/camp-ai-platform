import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Container, PageHero, Card } from "@/components/ui";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { SubmitButton } from "@/components/SubmitButton";
import { getCurrentUser } from "@/lib/auth";
import { updateBuildAction, removeHtmlDemoAction, deleteBuildAction } from "@/lib/actions";
import { getEpisodes, episodeLabel } from "@/lib/season";
import { pool } from "@/lib/db";

export const metadata: Metadata = { title: "Edit build" };
export const dynamic = "force-dynamic";

interface BuildRow {
  id: string;
  user_id: string;
  episode: string;
  title: string;
  how_it_works: string;
  models_used: string;
  token_cost: string;
  prompts_issues: string;
  demo_url: string;
  repo_url: string;
  html_demo_path: string;
  mobile_friendly: boolean | null;
}

export default async function EditBuildPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; updated?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const { error, updated } = await searchParams;

  const result = await pool.query<BuildRow>(
    `select id, user_id, episode, title, how_it_works, models_used, token_cost, prompts_issues, demo_url, repo_url, html_demo_path, mobile_friendly
     from builds where id = $1`,
    [id]
  );
  const build = result.rows[0];
  if (!build || build.user_id !== user.id) redirect("/builds");

  const episodes = await getEpisodes();
  const episodeMatch = /E(\d+)$/.exec(build.episode);
  const currentEpisodeNumber = episodeMatch ? Number(episodeMatch[1]) : episodes[episodes.length - 1]?.number;

  return (
    <>
      <PageHero eyebrow="Edit" title="Edit your build" lede="Update what you shipped." />
      <Container className="py-12">
        <div className="mx-auto max-w-2xl">
          <Link href={`/builds/${build.id}`} className="mb-4 inline-block text-[13px] text-mist-500 hover:text-mist-100">
            ← Back to build
          </Link>
          <Card className="p-6">
            {error && (
              <p className="mb-4 rounded-lg border border-danger-400/40 bg-danger-400/10 px-3.5 py-2.5 text-[13px] text-danger-400">
                {error}
              </p>
            )}
            {updated && (
              <p className="mb-4 rounded-lg border border-aurora-400/40 bg-aurora-400/10 px-3.5 py-2.5 text-[13px] text-aurora-300">
                Your static demo has been removed.
              </p>
            )}
            <form action={updateBuildAction} className="space-y-5">
              <input type="hidden" name="build_id" value={build.id} />

              <div>
                <label className="field-label" htmlFor="episode_number">Which episode is this for?</label>
                <select
                  className="field-input"
                  id="episode_number"
                  name="episode_number"
                  defaultValue={currentEpisodeNumber}
                  required
                >
                  {episodes.map((ep) => (
                    <option key={ep.id} value={ep.number}>
                      {episodeLabel(ep)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label" htmlFor="title">What did you make?</label>
                <input
                  className="field-input"
                  id="title"
                  name="title"
                  type="text"
                  defaultValue={build.title}
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="how_it_works">How does it work?</label>
                <textarea
                  className="field-input"
                  id="how_it_works"
                  name="how_it_works"
                  defaultValue={build.how_it_works}
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="models_used">What models did you use?</label>
                <input
                  className="field-input"
                  id="models_used"
                  name="models_used"
                  type="text"
                  defaultValue={build.models_used}
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="token_cost">How much did it cost / how many tokens?</label>
                <input
                  className="field-input"
                  id="token_cost"
                  name="token_cost"
                  type="text"
                  defaultValue={build.token_cost}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="prompts_issues">
                  What prompts or issues did you run into, and how did you fix them?
                </label>
                <textarea
                  className="field-input"
                  id="prompts_issues"
                  name="prompts_issues"
                  defaultValue={build.prompts_issues}
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="demo_url">Link to your build</label>
                <input
                  className="field-input"
                  id="demo_url"
                  name="demo_url"
                  type="url"
                  defaultValue={build.demo_url}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="html_demo">
                  No live link or repo? {build.html_demo_path ? "Replace" : "Upload"} a static HTML demo
                </label>
                <input
                  className="field-input"
                  id="html_demo"
                  name="html_demo"
                  type="file"
                  accept=".html,text/html"
                />
                <p className="mt-1.5 text-[11.5px] text-mist-700">
                  {build.html_demo_path
                    ? "Leave blank to keep your current static demo."
                    : "A single .html file (under 2MB), sandboxed and rendered on your build's page."}
                </p>
              </div>

              {build.html_demo_path && (
                <div>
                  <ConfirmSubmitButton
                    formAction={removeHtmlDemoAction}
                    confirmMessage="Remove your static HTML demo? This can't be undone — you'll need to re-upload it."
                    variant="secondary"
                    size="sm"
                    className="border-danger-400/40 !bg-transparent text-danger-400 hover:!bg-danger-400/10"
                  >
                    Remove static demo
                  </ConfirmSubmitButton>
                </div>
              )}

              <div>
                <label className="field-label" htmlFor="repo_url">Source code / repo link</label>
                <input
                  className="field-input"
                  id="repo_url"
                  name="repo_url"
                  type="url"
                  defaultValue={build.repo_url}
                />
              </div>

              <div>
                <label className="field-label" htmlFor="screenshot">Replace screenshot</label>
                <input
                  className="field-input"
                  id="screenshot"
                  name="screenshot"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                />
                <p className="mt-1.5 text-[11.5px] text-mist-700">Leave blank to keep your current screenshot.</p>
              </div>

              <div>
                <label className="field-label" htmlFor="mobile_friendly">Does it work well on mobile?</label>
                <select
                  className="field-input"
                  id="mobile_friendly"
                  name="mobile_friendly"
                  defaultValue={build.mobile_friendly === true ? "true" : build.mobile_friendly === false ? "false" : ""}
                >
                  <option value="">Not sure / haven't tested</option>
                  <option value="true">Yes, works well on mobile</option>
                  <option value="false">No, desktop only</option>
                </select>
              </div>

              <SubmitButton pendingLabel="Saving…" className="w-full">Save changes</SubmitButton>

              <div className="rule my-2" />

              <ConfirmSubmitButton
                formAction={deleteBuildAction}
                confirmMessage="Delete this build permanently? This removes its ratings, comments, and any uploaded files. This can't be undone."
                variant="secondary"
                size="sm"
                className="w-full !bg-transparent border-danger-400/40 text-danger-400 hover:!bg-danger-400/10"
              >
                Delete build
              </ConfirmSubmitButton>
            </form>
          </Card>
        </div>
      </Container>
    </>
  );
}
