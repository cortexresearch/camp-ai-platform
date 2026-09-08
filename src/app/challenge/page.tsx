import type { Metadata } from "next";
import { Container, PageHero, Card, Button, Pill } from "@/components/ui";
import { SeasonCountdown } from "@/components/SeasonCountdown";
import { getCurrentEpisode, episodeSeason, episodeNumberInSeason, TONIGHT } from "@/lib/season";

export const metadata: Metadata = { title: "Challenge" };
export const dynamic = "force-dynamic";

export default async function ChallengePage() {
  const episode = await getCurrentEpisode();

  return (
    <>
      <PageHero
        eyebrow={episode ? `Season ${episodeSeason(episode.number)} · Episode ${episodeNumberInSeason(episode.number)}` : "Challenge"}
        title={episode?.theme ?? "The challenge"}
        lede="What to build tonight — the direction, not a script to copy."
        actions={<Button href="/submit">Submit your build</Button>}
      />
      <Container className="py-12">
        <div className="mx-auto max-w-2xl space-y-6">
          <Card className="p-6">
            <h3 className="font-display text-base font-semibold text-mist-100">The brief</h3>
            {episode?.brief ? (
              <p className="mt-3 whitespace-pre-wrap text-[14.5px] leading-relaxed text-mist-300">{episode.brief}</p>
            ) : (
              <p className="mt-3 text-[14.5px] leading-relaxed text-mist-500">
                No written brief yet for this episode — the theme is{" "}
                <span className="text-mist-100">{episode?.theme ?? "TBD"}</span>. Take that wherever you want; there's no
                single right answer.
              </p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-display text-base font-semibold text-mist-100">How it works</h3>
            <ul className="mt-3 space-y-2 text-[14.5px] leading-relaxed text-mist-300">
              <li>Build something that fits the theme — interpret it however you want.</li>
              <li>You've got the build window shown below. Ship something real, not a mockup.</li>
              <li>
                Submit with a title, how it works, the models you used, and the prompts or issues you ran into —{" "}
                <Button href="/submit" variant="secondary" size="sm" className="ml-1 inline-flex">
                  Submit your build
                </Button>
              </li>
              <li>Everyone rates every build on name, pitch, product, and UI. Top score wins.</li>
            </ul>
          </Card>

          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-base font-semibold text-mist-100">Tonight's window</h3>
                <p className="mt-1 text-[13px] text-mist-500">
                  Prize: <span className="text-ember-400">{TONIGHT.prize}</span>
                </p>
              </div>
              {episode?.status === "live" && <Pill tone="signal">Live now</Pill>}
            </div>
            <div className="mt-4">
              <SeasonCountdown start={TONIGHT.submissionStart} deadline={TONIGHT.submissionDeadline} />
            </div>
          </Card>

          <div className="flex flex-wrap gap-3 text-[13px]">
            {episode?.status !== "complete" && episode?.x_spaces_url && (
              <Button href={episode.x_spaces_url} size="sm">Join tonight&apos;s Space →</Button>
            )}
            <Button href="/rules" variant="secondary" size="sm">Full rules</Button>
            <Button href="/how-it-works" variant="secondary" size="sm">How it works</Button>
            <Button href="/vote" variant="secondary" size="sm">Vote on builds</Button>
          </div>
        </div>
      </Container>
    </>
  );
}
