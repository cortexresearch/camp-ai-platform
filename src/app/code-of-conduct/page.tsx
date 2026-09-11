import type { Metadata } from "next";
import { Container, Card, PageHero, SectionHeading, Button } from "@/components/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/code-of-conduct" },
  title: "Code of conduct",
  description: "The standard every builder, judge, and partner agrees to at CampAI.",
};

const EXPECTED = [
  {
    t: "Build honestly",
    d: "Describe what you actually built — the how-it-works, models, and prompts/issues fields exist so honesty is the easy default.",
  },
  {
    t: "Give and take feedback in good faith",
    d: "Public comments should be specific and constructive. Criticize the work, not the person.",
  },
  {
    t: "Respect the build window",
    d: "The window applies equally to everyone. Build in it, not before it.",
  },
];

const NOT_TOLERATED = [
  "Harassment, hate speech, or targeted insults directed at any builder or judge.",
  "Rating manipulation — creating or coordinating accounts to inflate ratings.",
  "Presenting someone else's work as your own.",
  "Impersonating a judge or staff member, on or off the platform.",
  "Sharing another participant's private information without consent.",
];

const ENFORCEMENT = [
  {
    t: "First step: a private conversation",
    d: "Most issues get resolved with a direct note from us. We assume good faith unless the pattern says otherwise.",
  },
  {
    t: "Severity sets the response",
    d: "A minor issue gets a warning. Harassment or coordinated rating manipulation gets an account suspended.",
  },
  {
    t: "You can appeal",
    d: "If you believe an enforcement action was wrong, raise it through contact and we'll follow up directly.",
  },
];

export default function CodeOfConductPage() {
  return (
    <>
      <PageHero
        eyebrow="Standards"
        title="Code of conduct"
        lede="Everyone at 🏕️ AI — builders, judges, partners, and audience — agrees to this. It's short on purpose."
        actions={<Button href="/contact">Report a concern</Button>}
      />

      <Container className="py-14">
        <SectionHeading eyebrow="Expected" title="What we ask of everyone" />
        <div className="grid gap-4 md:grid-cols-2">
          {EXPECTED.map((f) => (
            <Card key={f.t} className="p-5">
              <h3 className="font-display text-[15px] font-semibold text-mist-100">{f.t}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-mist-500">{f.d}</p>
            </Card>
          ))}
        </div>

        <div className="rule my-14" />

        <SectionHeading eyebrow="Not tolerated" title="What gets you removed" />
        <Card className="p-6">
          <ul className="space-y-2.5">
            {NOT_TOLERATED.map((v, i) => (
              <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-mist-300">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-danger-500" />
                {v}
              </li>
            ))}
          </ul>
        </Card>

        <div className="rule my-14" />

        <SectionHeading eyebrow="Enforcement" title="How this actually gets applied" />
        <div className="grid gap-4 md:grid-cols-2">
          {ENFORCEMENT.map((f) => (
            <Card key={f.t} className="p-5">
              <h3 className="font-display text-[15px] font-semibold text-mist-100">{f.t}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-mist-500">{f.d}</p>
            </Card>
          ))}
        </div>

        <Card className="mt-12 flex flex-wrap items-center justify-between gap-5 p-7">
          <div>
            <h3 className="font-display text-lg font-semibold text-mist-100">See something off?</h3>
            <p className="mt-1.5 max-w-lg text-[13px] text-mist-500">
              Reports go to the production team directly, not to a public thread.
            </p>
          </div>
          <Button href="/contact">Contact us</Button>
        </Card>
      </Container>
    </>
  );
}
