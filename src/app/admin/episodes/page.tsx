import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container, PageHero, Card, Button, Pill } from "@/components/ui";
import { AdminNav } from "@/components/AdminNav";
import { getCurrentUser } from "@/lib/auth";
import { getEpisodes, type EpisodeStatus } from "@/lib/season";
import { createEpisodeAction, updateEpisodeAction } from "@/lib/actions";

export const metadata: Metadata = { title: "Manage episodes" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<EpisodeStatus, "ember" | "signal" | "aurora"> = {
  complete: "aurora",
  live: "signal",
  upcoming: "ember",
};

// Inverse of parseLiveAt in actions.ts — renders a stored UTC instant back as
// Central wall-clock text for the <input type="datetime-local"> default.
function toCentralInputValue(iso: string | null): string {
  if (!iso) return "";
  const central = new Date(new Date(iso).getTime() - 5 * 60 * 60 * 1000);
  return central.toISOString().slice(0, 16);
}

export default async function AdminEpisodesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.is_admin) redirect("/builds");

  const { error } = await searchParams;
  const episodes = await getEpisodes();
  const nextNumber = (episodes[episodes.length - 1]?.number ?? 0) + 1;

  return (
    <>
      <PageHero
        eyebrow="Admin"
        title="Manage episodes"
        lede="Add new episodes, flip who's live, and attach X Spaces links."
      />
      <Container className="py-12">
        <div className="mx-auto max-w-2xl space-y-6">
          <AdminNav active="episodes" />
          {error && (
            <p className="rounded-lg border border-danger-400/40 bg-danger-400/10 px-3.5 py-2.5 text-[13px] text-danger-400">
              {error}
            </p>
          )}

          {episodes.map((ep) => (
            <Card key={ep.id} className="p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="font-mono text-[11px] font-medium tracking-[0.16em] text-ember-500">
                  {String(ep.number).padStart(2, "0")}
                </span>
                <Pill tone={STATUS_TONE[ep.status]}>{ep.status}</Pill>
              </div>
              <form action={updateEpisodeAction} className="space-y-3">
                <input type="hidden" name="id" value={ep.id} />
                <div>
                  <label className="field-label" htmlFor={`theme-${ep.id}`}>Theme</label>
                  <input className="field-input" id={`theme-${ep.id}`} name="theme" type="text" defaultValue={ep.theme} required />
                </div>
                <div>
                  <label className="field-label" htmlFor={`brief-${ep.id}`}>Challenge brief</label>
                  <textarea
                    className="field-input"
                    id={`brief-${ep.id}`}
                    name="brief"
                    rows={3}
                    placeholder="What builders should aim for tonight — direction, not a literal prompt to copy."
                    defaultValue={ep.brief}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor={`status-${ep.id}`}>Status</label>
                  <select className="field-input" id={`status-${ep.id}`} name="status" defaultValue={ep.status}>
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live</option>
                    <option value="complete">Complete</option>
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor={`x-${ep.id}`}>X Spaces link</label>
                  <input
                    className="field-input"
                    id={`x-${ep.id}`}
                    name="x_spaces_url"
                    type="url"
                    placeholder="https://x.com/i/spaces/..."
                    defaultValue={ep.x_spaces_url}
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor={`live-${ep.id}`}>Goes live at (Central)</label>
                  <input
                    className="field-input"
                    id={`live-${ep.id}`}
                    name="live_at"
                    type="datetime-local"
                    defaultValue={toCentralInputValue(ep.live_at)}
                  />
                  <p className="mt-1.5 text-[11.5px] text-mist-700">
                    While status is "Upcoming", the site auto-switches to live once this time passes.
                  </p>
                </div>
                <Button type="submit" size="sm">Save</Button>
              </form>
            </Card>
          ))}

          <Card className="p-5">
            <h3 className="font-display text-base font-semibold text-mist-100">Add episode</h3>
            <form action={createEpisodeAction} className="mt-4 space-y-3">
              <div>
                <label className="field-label" htmlFor="number">Number</label>
                <input className="field-input" id="number" name="number" type="number" defaultValue={nextNumber} required />
              </div>
              <div>
                <label className="field-label" htmlFor="theme">Theme</label>
                <input className="field-input" id="theme" name="theme" type="text" placeholder="e.g. Calendar" required />
              </div>
              <div>
                <label className="field-label" htmlFor="brief">Challenge brief</label>
                <textarea
                  className="field-input"
                  id="brief"
                  name="brief"
                  rows={3}
                  placeholder="What builders should aim for tonight — direction, not a literal prompt to copy."
                />
              </div>
              <div>
                <label className="field-label" htmlFor="status">Status</label>
                <select className="field-input" id="status" name="status" defaultValue="upcoming">
                  <option value="upcoming">Upcoming</option>
                  <option value="live">Live</option>
                  <option value="complete">Complete</option>
                </select>
              </div>
              <div>
                <label className="field-label" htmlFor="x_spaces_url">X Spaces link</label>
                <input className="field-input" id="x_spaces_url" name="x_spaces_url" type="url" placeholder="https://x.com/i/spaces/..." />
              </div>
              <div>
                <label className="field-label" htmlFor="live_at">Goes live at (Central)</label>
                <input className="field-input" id="live_at" name="live_at" type="datetime-local" />
              </div>
              <Button type="submit">Add episode</Button>
            </form>
          </Card>
        </div>
      </Container>
    </>
  );
}
