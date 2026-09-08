import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container, PageHero, Card } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { getCurrentUser } from "@/lib/auth";
import { submitBuildAction } from "@/lib/actions";
import { getEpisodes, getCurrentEpisode, episodeLabel } from "@/lib/season";

export const metadata: Metadata = { title: "Submit your build" };
export const dynamic = "force-dynamic";

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { error } = await searchParams;
  const episodes = await getEpisodes();
  const currentEpisode = await getCurrentEpisode();

  return (
    <>
      <PageHero
        eyebrow={currentEpisode ? episodeLabel(currentEpisode) : "Submit"}
        title="Submit your build"
        lede="Tell everyone what you shipped tonight. This is what shows up on the builds page for voting."
      />
      <Container className="py-12">
        <div className="mx-auto max-w-2xl">
          <Card className="p-6">
            {error && (
              <p className="mb-4 rounded-lg border border-danger-400/40 bg-danger-400/10 px-3.5 py-2.5 text-[13px] text-danger-400">
                {error}
              </p>
            )}
            <form action={submitBuildAction} className="space-y-5">
              <div>
                <label className="field-label" htmlFor="episode_number">Which episode is this for?</label>
                <select
                  className="field-input"
                  id="episode_number"
                  name="episode_number"
                  defaultValue={currentEpisode?.number}
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
                  placeholder="e.g. A geofenced reminder app that pings you near a place"
                  required
                />
              </div>

              <div>
                <label className="field-label" htmlFor="how_it_works">How does it work?</label>
                <textarea
                  className="field-input"
                  id="how_it_works"
                  name="how_it_works"
                  placeholder="Walk through it like you're demoing it live."
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
                  placeholder="e.g. Claude Sonnet 5, GPT-5-mini"
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
                  placeholder="e.g. ~80k tokens, about $0.60"
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
                  placeholder="The good stuff — what broke, what you tried, what actually worked."
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
                  placeholder="https://your-live-demo.com"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="html_demo">
                  No live link or repo? Upload a static HTML demo
                </label>
                <input
                  className="field-input"
                  id="html_demo"
                  name="html_demo"
                  type="file"
                  accept=".html,text/html"
                />
                <p className="mt-1.5 text-[11.5px] text-mist-700">
                  A single .html file (under 2MB), sandboxed and rendered on your build&apos;s page.
                </p>
              </div>

              <div>
                <label className="field-label" htmlFor="repo_url">Source code / repo link</label>
                <input
                  className="field-input"
                  id="repo_url"
                  name="repo_url"
                  type="url"
                  placeholder="https://github.com/you/your-build"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="screenshot">Screenshot</label>
                <input
                  className="field-input"
                  id="screenshot"
                  name="screenshot"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                />
                <p className="mt-1.5 text-[11.5px] text-mist-700">
                  Leave blank and we'll grab one from your live demo link automatically.
                </p>
              </div>

              <div>
                <label className="field-label" htmlFor="mobile_friendly">Does it work well on mobile?</label>
                <select className="field-input" id="mobile_friendly" name="mobile_friendly" defaultValue="">
                  <option value="">Not sure / haven't tested</option>
                  <option value="true">Yes, works well on mobile</option>
                  <option value="false">No, desktop only</option>
                </select>
              </div>

              <SubmitButton pendingLabel="Submitting…" className="w-full">Submit build</SubmitButton>
            </form>
          </Card>
        </div>
      </Container>
    </>
  );
}
