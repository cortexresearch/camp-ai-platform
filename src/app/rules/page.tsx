import type { Metadata } from "next";
import { Container, Card, PageHero, SectionHeading, Button } from "@/components/ui";

export const metadata: Metadata = {
  title: "Rules",
  description: "The rules for 🏕️ AI — build window, submission, and rating.",
};

const CORE_RULES = [
  "Anyone can join and build along — no account required just to build.",
  "Build during the announced window for the night's episode. What you submit should be built in that window, not scaffolded ahead of time.",
  "To be eligible for a cash prize, you need an account at campai.cortexresearch.group and your build must be submitted from it. The highest-voted eligible build wins.",
  "One submission per builder per episode.",
  "Your submission must honestly describe how it works, what AI models you used, and the prompts or issues you ran into. Don't misrepresent what you built.",
  "One rating per build per account. Don't create multiple accounts to rate up yourself or anyone else.",
  "Be honest about token cost and tooling if you include it — it helps other builders, and misleading numbers just make the leaderboard less useful for everyone.",
  "Break a rule or miss the submission deadline and we'll still go over your build live — you just won't be eligible for the cash prize that episode.",
];

export default function RulesPage() {
  return (
    <>
      <PageHero
        eyebrow="Rulebook"
        title="Rules"
        lede="Short on purpose. Rules grow only as they're actually needed."
        actions={
          <div className="flex gap-2.5">
            <Button href="/code-of-conduct" variant="secondary">
              Code of conduct
            </Button>
            <Button href="/faq" variant="secondary">
              FAQ
            </Button>
          </div>
        }
      />

      <Container className="py-14">
        <SectionHeading eyebrow="The rules" title="What applies right now" />
        <Card className="p-6">
          <ol className="space-y-2.5">
            {CORE_RULES.map((r, i) => (
              <li key={i} className="flex gap-3 text-[13.5px] leading-relaxed text-mist-300">
                <span className="mt-0.5 shrink-0 font-mono text-[11px] text-ember-500">
                  {String(i + 1).padStart(2, "0")}
                </span>
                {r}
              </li>
            ))}
          </ol>
        </Card>

        <div className="rule my-14" />

        <SectionHeading eyebrow="Judges" title="How judging works today" />
        <Card className="p-6 text-[13.5px] leading-relaxed text-mist-300">
          <p>
            Judges are real people who signed up for that role. There&apos;s no formal scoring rubric yet —
            right now judging is informal: judges browse submissions and rate them like everyone else. If we build
            out a more structured scoring process, it&apos;ll be announced here first.
          </p>
        </Card>

        <div className="rule my-14" />

        <SectionHeading eyebrow="Questions" title="Something not covered here?" />
        <Card className="flex flex-wrap items-center justify-between gap-5 p-6">
          <p className="max-w-lg text-[13.5px] leading-relaxed text-mist-300">
            If something feels unclear or unfair, raise it through{" "}
            <a href="/contact" className="text-aurora-300 hover:underline">contact</a>.
          </p>
          <Button href="/contact">Get in touch</Button>
        </Card>
      </Container>
    </>
  );
}
