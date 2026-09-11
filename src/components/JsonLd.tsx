import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "@/lib/site";

/**
 * Structured data. This is how a search engine learns that the emoji mark, the
 * word "CampAI", and this domain are the same entity — which is what a brand
 * knowledge panel is built from.
 *
 * Rendered as a plain script tag rather than next/script: JSON-LD is inert data
 * and needs to be in the server-rendered HTML for crawlers that don't execute
 * scripts.
 */
export function OrganizationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: ["Camp AI", "🏕️ AI", "CampAI Hackathon"],
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        sameAs: [
          "https://x.com/NFTmansa",
          "https://github.com/cortexresearch/camp-ai-platform",
        ],
        parentOrganization: {
          "@type": "Organization",
          name: "Cortex Research Group",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-US",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // Content is a literal built above, not user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * An episode is a scheduled, free, online event. Marking it up is what makes a
 * show night eligible to surface as an event result rather than a plain link.
 */
export function EpisodeJsonLd({
  name,
  description,
  startDate,
  url,
}: {
  name: string;
  description: string;
  startDate: string;
  url: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Event",
    name,
    description,
    startDate,
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "VirtualLocation",
      url,
    },
    organizer: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    isAccessibleForFree: true,
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
