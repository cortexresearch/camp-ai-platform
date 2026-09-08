import type { Metadata } from "next";
import { Container, Card, PageHero, SectionHeading, Button } from "@/components/ui";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Reach 🏕️ AI — builder support, partnerships, and reports.",
};

const CHANNELS = [
  {
    t: "Builder & judge support",
    handle: "Cortex Research Group",
    d: "Sign-up issues, account questions, or anything else about competing.",
    cta: { label: "Sign up", href: "/signup" },
  },
  {
    t: "Partnerships",
    handle: "Cortex Research Group",
    d: "Sponsoring a challenge or getting your tool in front of builders.",
    cta: { label: "Partnership options", href: "/partnership" },
  },
  {
    t: "Trust & safety",
    handle: "Cortex Research Group",
    d: "Code of conduct violations, harassment, or rating manipulation reports.",
    cta: { label: "Code of conduct", href: "/code-of-conduct" },
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title="Contact"
        lede="Pick the channel closest to what you need — it routes faster than the general inbox."
      />

      <Container className="py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div>
            <SectionHeading title="Channels" />
            <div className="space-y-3">
              {CHANNELS.map((c) => (
                <Card key={c.t} className="p-5">
                  <h3 className="font-display text-[15px] font-semibold text-mist-100">{c.t}</h3>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-mist-500">{c.d}</p>
                  <a
                    href="https://cortexresearch.group"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2.5 inline-block font-mono text-[12px] text-aurora-300 hover:underline"
                  >
                    {c.handle}
                  </a>
                  {c.cta && (
                    <div className="mt-3">
                      <Button href={c.cta.href} variant="secondary" size="sm">
                        {c.cta.label}
                      </Button>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>

          <div>
            <SectionHeading title="Send a message" />
            <ContactForm />
          </div>
        </div>
      </Container>
    </>
  );
}
