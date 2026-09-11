import type { Metadata } from "next";
import Link from "next/link";
import { Container, Card, Button, Pill, LiveDot, SectionHeading, Stat } from "@/components/ui";
import { SeasonCountdown } from "@/components/SeasonCountdown";
import { LiveCountdown } from "@/components/LiveCountdown";
import { AutoRefresh } from "@/components/AutoRefresh";
import { pool } from "@/lib/db";
import { SEASON, SEASON_THEME, SEASON_SPONSOR, TONIGHT, getCurrentEpisode, isEpisodeLiveNow, episodeLabel } from "@/lib/season";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Manually tallied from the X Spaces analytics dashboard (not tracked in our DB) —
// update by re-summing listen counts / durations across all recorded spaces.
const SPACES_LISTENS = "2.6K+";
const SPACES_HOURS = "70+";

interface TopBuild {
  id: string;
  title: string;
  author_name: string;
  avg_rating: string;
  rating_count: string;
}

export default async function HomePage() {
  const currentEpisode = await getCurrentEpisode();
  const isLive = isEpisodeLiveNow(currentEpisode);
  const showLiveCountdown =
    !isLive && currentEpisode?.status !== "complete" && !!currentEpisode?.live_at;

  const topBuildsResult = await pool.query<TopBuild>(
    `select b.id, b.title, u.name as author_name,
            coalesce(rs.avg_rating, 0) as avg_rating,
            coalesce(rs.rating_count, 0) as rating_count
     from builds b
     join users u on u.id = b.user_id
     left join (select build_id, avg(stars) as avg_rating, count(distinct user_id) as rating_count, sum(stars) as rating_points
                from ratings group by build_id) rs on rs.build_id = b.id
     order by coalesce(rs.rating_points, 0) desc, b.created_at asc
     limit 4`
  );
  const topBuilds = topBuildsResult.rows;

  const countResult = await pool.query<{ n: string }>(`select count(*) as n from builds`);
  const totalBuilds = Number(countResult.rows[0]?.n ?? 0);

  const episodeCountResult = await pool.query<{ n: string }>(`select count(*) as n from episodes`);
  const totalEpisodes = Number(episodeCountResult.rows[0]?.n ?? 0);

  const builderCountResult = await pool.query<{ n: string }>(
    `select count(*) as n from users where role = 'builder'`
  );
  const totalBuilders = Number(builderCountResult.rows[0]?.n ?? 0);

  return (
    <>
      <AutoRefresh />
      {/* -------------------------------------------------------- stats bar */}
      <section className="border-b border-ink-700/60 bg-ink-900/40">
        <Container className="grid grid-cols-2 gap-6 py-6 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Seasons" value={SEASON} />
          <Stat label="Episodes" value={totalEpisodes} />
          <Stat label="Builders" value={totalBuilders} />
          <Stat label="Builds" value={totalBuilds} />
          <Stat label="Listens" value={SPACES_LISTENS} />
          <Stat label="Hours of content" value={SPACES_HOURS} />
        </Container>
      </section>

      {/* ------------------------------------------------------------- hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {[
            { left: "12%", delay: "0s", dur: "5.2s" },
            { left: "26%", delay: "1.4s", dur: "6.1s" },
            { left: "48%", delay: "2.6s", dur: "4.8s" },
            { left: "67%", delay: "0.7s", dur: "5.9s" },
            { left: "84%", delay: "3.1s", dur: "6.4s" },
            { left: "93%", delay: "1.9s", dur: "5.1s" },
          ].map((e, i) => (
            <span
              key={i}
              className="ember absolute bottom-1/3 size-1 rounded-full bg-ember-400"
              style={{ left: e.left, ["--delay" as string]: e.delay, ["--dur" as string]: e.dur }}
            />
          ))}
        </div>

        <Container className="relative py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 flex flex-wrap items-center justify-center gap-2.5">
              {isLive && (
                <Pill tone="signal">
                  <LiveDot /> Live now
                </Pill>
              )}
              {currentEpisode && (
                <Pill tone="ember">
                  {episodeLabel(currentEpisode)}
                </Pill>
              )}
            </div>

            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-aurora-300">
              This season: {SEASON_THEME}
            </p>

            <h1 className="font-display text-[2.4rem] font-bold leading-[1.05] tracking-tight text-mist-100 sm:text-6xl">
              CampAI — build with AI.
              <br />
              Ship in <span className="text-ember-500">30 minutes</span>.
            </h1>

            <p className="mt-5 text-[15px] leading-relaxed text-mist-400">
              CampAI is a live vibe coding hackathon. Every episode, builders get 30 minutes
              to ship something real on that night&apos;s theme, demo it on X, and get rated
              by everyone watching.
            </p>

            <p className="mt-6 text-[15px] leading-relaxed text-mist-500">
              {isLive ? "Tonight's" : "Last episode's"} theme:{" "}
              <strong className="text-mist-100">{currentEpisode?.theme}</strong>. Sign up, ship
              something on the current theme, tell us how you built it, and rate your
              favorites.
            </p>

            {showLiveCountdown && currentEpisode?.live_at && (
              <div className="mt-8">
                <LiveCountdown liveAt={currentEpisode.live_at} />
              </div>
            )}

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {isLive && (
                <Button href="/vote" size="lg">
                  Vote now →
                </Button>
              )}
              {currentEpisode?.status !== "complete" && currentEpisode?.x_spaces_url && (
                <Button href={currentEpisode.x_spaces_url} size="lg" variant={isLive ? "secondary" : "primary"}>
                  Join tonight&apos;s Space →
                </Button>
              )}
              <Button
                href="/signup"
                variant={currentEpisode?.status !== "complete" && currentEpisode?.x_spaces_url ? "secondary" : "primary"}
                size="lg"
              >
                Sign up
              </Button>
              <Button href="/submit" variant="secondary" size="lg">
                Submit your build
              </Button>
              <Button href="/builds" variant="ghost" size="lg">
                See builds →
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* --------------------------------------------------- tonight's build */}
      {currentEpisode && currentEpisode.status !== "complete" && (
        <section className="border-y border-ink-700/60 bg-ink-900/40 py-14">
          <Container>
            <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              <Card className="p-6">
                <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-ember-400">
                  Season {SEASON} sponsor
                </p>
                <h3 className="mt-2 font-display text-xl font-semibold text-mist-100">
                  This season is sponsored by {SEASON_SPONSOR.name}
                </h3>
                <p className="mt-3 text-[13.5px] leading-relaxed text-mist-500">{SEASON_SPONSOR.blurb}</p>
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <Button href={SEASON_SPONSOR.url} variant="outline" size="sm">
                    Check out {SEASON_SPONSOR.name} →
                  </Button>
                  <p className="text-[13px] text-mist-500">
                    Tonight&apos;s prize: <strong className="text-ember-400">{TONIGHT.prize}</strong>
                  </p>
                </div>
              </Card>

              <Card className="flex flex-col items-center justify-center gap-4 p-6 text-center">
                <SeasonCountdown start={TONIGHT.submissionStart} deadline={TONIGHT.submissionDeadline} />
                <p className="max-w-xs text-[12px] leading-relaxed text-mist-500">
                  Submission countdown starts <strong className="text-mist-100">8:30PM CST</strong> ·
                  all submissions due by <strong className="text-mist-100">9:00PM CST</strong>, no
                  exceptions. Only accounts at campai.cortexresearch.group are eligible for the cash
                  prize — see the{" "}
                  <Link href="/rules" className="text-aurora-300 hover:underline">
                    rules
                  </Link>
                  .
                </p>
              </Card>
            </div>
          </Container>
        </section>
      )}

      {/* ------------------------------------------------------- top builds */}
      {topBuilds.length > 0 && (
        <section className="border-y border-ink-700/60 bg-ink-900/40 py-16">
          <Container>
            <SectionHeading
              eyebrow={`${totalBuilds} build${totalBuilds === 1 ? "" : "s"} tonight`}
              title="Top builds so far"
              action={
                <Button href="/builds" variant="ghost" size="sm">
                  All builds →
                </Button>
              }
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {topBuilds.map((b) => (
                <Card key={b.id} className="card-link">
                  <Link href="/builds" className="block p-4">
                    <p className="truncate font-display text-[14px] font-semibold text-mist-100">{b.title}</p>
                    <p className="mt-1 truncate text-[11.5px] text-mist-700">by {b.author_name}</p>
                    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ember-400">
                      {Number(b.rating_count) > 0
                        ? `★ ${Number(b.avg_rating).toFixed(1)} (${b.rating_count})`
                        : "No ratings yet"}
                    </p>
                  </Link>
                </Card>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* --------------------------------------------------------- how it works */}
      <section className="py-16">
        <Container>
          <SectionHeading eyebrow="How it works" title="Four steps" />
          <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { n: "01", t: "Sign up", d: "Create an account with your name, email, and a password." },
              { n: "02", t: "Build", d: "You've got the window to build whatever you want on tonight's theme." },
              {
                n: "03",
                t: "Submit",
                d: "Tell us what you made, how it works, what models you used, what it cost, and the prompts/issues you ran into.",
              },
              { n: "04", t: "Rate", d: "Everyone rates and comments on their favorite builds of the night." },
            ].map((step) => (
              <li key={step.n}>
                <Card className="h-full p-5">
                  <span className="font-mono text-[11px] font-medium tracking-[0.16em] text-ember-500">
                    {step.n}
                  </span>
                  <h3 className="mt-3 font-display text-base font-semibold text-mist-100">{step.t}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-mist-500">{step.d}</p>
                </Card>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* -------------------------------------------------------- partner CTA */}
      <section className="pb-16">
        <Container>
          <Card className="flex flex-wrap items-center justify-between gap-6 p-6">
            <div className="max-w-xl">
              <h3 className="font-display text-lg font-semibold text-mist-100">Interested in partnering?</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-mist-500">
                Sponsor a challenge or get your tool in front of builders who are actually building.
              </p>
            </div>
            <Button href="/partnership">Partner with us</Button>
          </Card>
        </Container>
      </section>
    </>
  );
}
