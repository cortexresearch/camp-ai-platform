import type { Metadata } from "next";
import { Container, Card, PageHero, SectionHeading, Button } from "@/components/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/how-it-works" },
  title: "How it works",
  description: "How CampAI works: sign up free, build with AI inside the 30-minute window, submit, and rate every build.",
};

const FLOW = [
  {
    n: "01",
    t: "Sign up",
    d: "Create an account with your name, email, and a password. Pick whether you're joining as a builder or a judge — either way you can build and submit.",
  },
  {
    n: "02",
    t: "The theme drops",
    d: "Each episode has a theme, announced when the build window opens. Build anything that fits it.",
  },
  {
    n: "03",
    t: "You build",
    d: "You've got the window to build whatever you want on tonight's theme, using whatever AI tools you like.",
  },
  {
    n: "04",
    t: "Submit",
    d: "Tell us what you made: the title, how it works, what models you used, roughly what it cost, and the prompts or issues you ran into.",
  },
  {
    n: "05",
    t: "Everyone rates",
    d: "Signed-in users rate each build 1-5 stars on name, pitch, product, and UI — once each — and can leave comments. Up to 20 points per build from a single rater. The top-rated builds show up on the home page.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHero
        eyebrow="The format"
        title="Sign up, build, submit, rate"
        lede="This is Season 1 — the format is intentionally simple right now. It'll grow as the show does."
        actions={
          <div className="flex gap-2.5">
            <Button href="/signup">Sign up</Button>
            <Button href="/rules" variant="secondary">
              Full rules
            </Button>
          </div>
        }
      />

      <Container className="py-14">
        <SectionHeading eyebrow="The flow" title="Five steps" />
        <ol className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FLOW.map((s) => (
            <li key={s.n}>
              <Card className="h-full p-5">
                <span className="font-mono text-[11px] font-medium tracking-[0.16em] text-ember-500">
                  {s.n}
                </span>
                <h3 className="mt-2.5 font-display text-[15px] font-semibold text-mist-100">{s.t}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-mist-500">{s.d}</p>
              </Card>
            </li>
          ))}
        </ol>

        <div className="rule my-14" />

        <SectionHeading eyebrow="Judges" title="A real role, not a formal process (yet)" />
        <Card className="p-6 text-[13.5px] leading-relaxed text-mist-300">
          <p>
            Judges can sign up instantly, no application needed. Right now judging is informal — judges
            browse, rate, and comment on builds just like everyone else. There&apos;s no scoring rubric or panel
            system in place yet.
          </p>
        </Card>

        <Card className="mt-14 flex flex-wrap items-center justify-between gap-5 p-7">
          <div>
            <h3 className="font-display text-lg font-semibold text-mist-100">Ready to build?</h3>
            <p className="mt-1.5 text-[13px] text-mist-500">Sign up takes less than a minute.</p>
          </div>
          <div className="flex gap-2.5">
            <Button href="/signup">Sign up</Button>
            <Button href="/builds" variant="secondary">
              See builds
            </Button>
          </div>
        </Card>
      </Container>
    </>
  );
}
