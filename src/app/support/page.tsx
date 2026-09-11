import type { Metadata } from "next";
import { Container, PageHero, Card, Button } from "@/components/ui";

const COFFEE_URL = "https://buymeacoffee.com/cortexresearch";

export const metadata: Metadata = {
  alternates: { canonical: "/support" },
  title: "Support",
  description: "Support CampAI. Every dollar goes back into the platform, the Spaces, and prizes for builders.",
};

export default function SupportPage() {
  return (
    <>
      <PageHero
        eyebrow="Support 🏕️ AI"
        title="Keep the fire going"
        lede="🏕️ AI is run by builders, for builders. If it's been useful to you, a coffee helps us keep building it."
      />
      <Container className="py-12">
        <div className="mx-auto max-w-lg">
          <Card className="p-8 text-center">
            <span className="text-4xl" aria-hidden>☕</span>
            <p className="mt-4 font-display text-lg font-semibold text-mist-100">Buy us a coffee</p>
            <p className="mt-3 text-[14px] leading-relaxed text-mist-500">
              Every dollar goes straight back into the platform — more consistent X Spaces, new features
              here on the site, and giveaways and prizes for the builders who show up and ship.
            </p>
            <Button href={COFFEE_URL} size="lg" className="mt-6" target="_blank" rel="noopener noreferrer">
              Buy us a coffee ↗
            </Button>
            <p className="mt-4 text-[12px] text-mist-700">
              No pressure — showing up and building is support enough. This is just for those who want to do more.
            </p>
          </Card>
        </div>
      </Container>
    </>
  );
}
