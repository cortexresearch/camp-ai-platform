import type { Metadata } from "next";
import { Container, Card, PageHero, SectionHeading, Button } from "@/components/ui";

export const metadata: Metadata = {
  alternates: { canonical: "/faq" },
  title: "FAQ",
  description: "Answers to the questions builders and judges ask most about CampAI — the live vibe coding hyper hackathon.",
};

const GROUPS: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "Getting started",
    items: [
      {
        q: "Do I need to sign up before every episode?",
        a: "Just once. Create an account and you're set for every future episode — sign in and submit whenever you build something.",
      },
      {
        q: "Is there a cost to enter?",
        a: "No. Signing up, building, and submitting are all free.",
      },
      {
        q: "What do I actually need to bring?",
        a: "A working environment for whatever you plan to build with, and the ability to describe what you made — how it works, what models you used, and the prompts or issues along the way.",
      },
    ],
  },
  {
    title: "Building & submitting",
    items: [
      {
        q: "What counts as a valid submission?",
        a: "Anything you built during the episode's window that fits the theme. You submit a title, how it works, the models you used, roughly what it cost, and the prompts or issues you ran into.",
      },
      {
        q: "How does rating work?",
        a: "Anyone signed in can rate a build 1-5 stars on four things — name, pitch, product, and UI — once each, and leave a comment. That's up to 20 points per build from a single rater. The top-rated builds show up on the home page.",
      },
      {
        q: "Can I edit or delete a submission after posting it?",
        a: "You can edit it anytime from the builds page, and delete it entirely from the edit page. Submissions aren't final once posted.",
      },
    ],
  },
  {
    title: "Judges",
    items: [
      {
        q: "How do I become a judge?",
        a: "Pick \"Judge\" when you sign up — it's instant, no application required.",
      },
      {
        q: "What does a judge actually do right now?",
        a: "Today, judges browse, rate, and comment on builds like everyone else. There's no separate scoring system yet — if that changes, it'll be announced on the Rules page.",
      },
    ],
  },
  {
    title: "Profile & portfolio",
    items: [
      {
        q: "What's the portfolio for?",
        a: "A place to list things you've built before — a title, a link, and a short description. It shows up on your public profile page.",
      },
      {
        q: "Can other people see my profile?",
        a: "Yes, your profile (including your portfolio) is public at /u/your-handle.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <PageHero
        eyebrow="Help"
        title="Frequently asked questions"
        lede="If it's not here, contact reaches us directly."
        actions={<Button href="/contact">Contact us</Button>}
      />

      <Container className="py-14">
        {GROUPS.map((group) => (
          <div key={group.title} className="mb-12 last:mb-0">
            <SectionHeading title={group.title} />
            <div className="space-y-2.5">
              {group.items.map((item) => (
                <Card key={item.q} className="overflow-hidden p-0">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-display text-[14.5px] font-semibold text-mist-100 marker:content-none">
                      {item.q}
                      <span className="shrink-0 font-mono text-mist-700 transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="px-4 pb-4 text-[13.5px] leading-relaxed text-mist-500">{item.a}</p>
                  </details>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </Container>
    </>
  );
}
