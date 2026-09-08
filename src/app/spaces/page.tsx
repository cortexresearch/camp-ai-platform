import type { Metadata } from "next";
import { Container, PageHero, Card, Button, EmptyState } from "@/components/ui";
import { SEASON, getEpisodes, episodeLabel } from "@/lib/season";

export const metadata: Metadata = {
  title: "Spaces",
  description: `Every X Spaces recording from Season ${SEASON}.`,
};
export const dynamic = "force-dynamic";

export default async function SpacesPage() {
  const episodes = await getEpisodes();
  const spaces = episodes.filter((ep) => ep.x_spaces_url);

  return (
    <>
      <PageHero
        eyebrow={`Season ${SEASON}`}
        title="Spaces"
        lede="Every X Spaces recording from the season, in one place."
      />
      <Container className="py-12">
        {spaces.length === 0 ? (
          <EmptyState title="No spaces yet" body="Recordings show up here as episodes go live." />
        ) : (
          <div className="mx-auto max-w-2xl space-y-3">
            {spaces.map((ep) => (
              <Card key={ep.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-[11px] font-medium tracking-[0.16em] text-ember-500">
                    {String(ep.number).padStart(2, "0")}
                  </span>
                  <div>
                    <p className="font-display text-[15px] font-semibold text-mist-100">{ep.theme}</p>
                    <p className="text-[12px] text-mist-700">{episodeLabel(ep)}</p>
                  </div>
                </div>
                <Button href={ep.x_spaces_url} size="sm" variant="secondary" target="_blank" rel="noopener noreferrer">
                  Listen ↗
                </Button>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
