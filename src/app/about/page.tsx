import type { Metadata } from "next";
import { Container, Card, PageHero, SectionHeading, Stat, Button, Avatar } from "@/components/ui";
import { pool } from "@/lib/db";

export const metadata: Metadata = {
  alternates: { canonical: "/about" },
  title: "About",
  description: "CampAI is a live vibe coding hyper hackathon produced by Cortex Research Group. 30 minutes to build and ship with AI, demo live, and get rated.",
};

const VALUES = [
  {
    t: "The constraint is the point",
    d: "Thirty minutes isn't a gimmick — it's short enough that scope can't hide bad ideas, and long enough that something real gets built.",
  },
  {
    t: "It's live, not staged",
    d: "Builds happen in public, on the clock. What you see submitted is what got made in the window.",
  },
  {
    t: "Say what didn't work",
    d: "Every submission includes the prompts and issues you actually ran into — not just the polished result.",
  },
];

export default async function AboutPage() {
  const counts = await pool.query<{ builders: string; judges: string; builds: string }>(
    `select
       count(*) filter (where role = 'builder') as builders,
       count(*) filter (where role = 'judge') as judges,
       (select count(*) from builds) as builds
     from users`
  );
  const { builders, judges, builds } = counts.rows[0];

  return (
    <>
      <PageHero
        eyebrow="About"
        title="Cortex Research Group"
        lede="Cortex Research Group produces 🏕️ AI — a live build competition where builders use AI tools to ship something real in a short window, then submit what they made and rate their favorites. This is Season 1 — we're just getting started."
        actions={
          <div className="flex gap-2.5">
            <Button href="/how-it-works">How it works</Button>
            <Button href="/contact" variant="secondary">
              Contact us
            </Button>
          </div>
        }
      >
        <div className="mt-8 grid grid-cols-3 gap-6 sm:max-w-md">
          <Stat label="Builders" value={builders} />
          <Stat label="Judges" value={judges} tone="aurora" />
          <Stat label="Builds shipped" value={builds} tone="ember" />
        </div>
      </PageHero>

      <Container className="py-14">
        <SectionHeading
          eyebrow="Why this exists"
          title="A league for how people actually build with AI now"
          description="Most demos of AI tools are staged. We wanted a format where the build happens in public, on the clock, and what gets shipped is what's real."
        />

        <div className="rule my-14" />

        <SectionHeading eyebrow="Principles" title="What we optimize for" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((v) => (
            <Card key={v.t} className="p-5">
              <h3 className="font-display text-[15px] font-semibold text-mist-100">{v.t}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-mist-500">{v.d}</p>
            </Card>
          ))}
        </div>

        <div className="rule my-14" />

        <SectionHeading eyebrow="Production" title="Who's running it" />
        <Card className="flex flex-wrap items-center gap-4 p-6">
          <Avatar name="Cortex Research Group" size={52} />
          <div>
            <p className="font-display text-[15px] font-semibold text-mist-100">Cortex Research Group</p>
            <p className="text-[13px] text-mist-500">Producer &amp; host</p>
          </div>
          <p className="ml-0 mt-3 w-full text-[13px] leading-relaxed text-mist-500 sm:ml-4 sm:mt-0 sm:w-auto sm:flex-1">
            Hosts the build windows live and runs the platform. Learn more at{" "}
            <a
              href="https://cortexresearch.group"
              target="_blank"
              rel="noopener noreferrer"
              className="text-aurora-300 hover:underline"
            >
              cortexresearch.group
            </a>
            .
          </p>
        </Card>

        <Card className="mt-14 flex flex-wrap items-center justify-between gap-5 p-7">
          <div>
            <h3 className="font-display text-lg font-semibold text-mist-100">Season 1 is live</h3>
            <p className="mt-1.5 max-w-lg text-[13px] text-mist-500">
              Come build, judge, or sponsor.
            </p>
          </div>
          <div className="flex gap-2.5">
            <Button href="/signup">Sign up</Button>
            <Button href="/partnership" variant="secondary">
              Partner with us
            </Button>
          </div>
        </Card>
      </Container>
    </>
  );
}
