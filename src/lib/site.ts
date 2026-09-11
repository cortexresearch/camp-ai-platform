/**
 * Canonical origin. Everything that emits an absolute URL — metadata, sitemap,
 * robots, llms.txt, JSON-LD — reads it from here so there is exactly one place
 * to change if the domain ever moves.
 *
 * campai.cortexresearch.group serves the same app and redirects here, so search
 * engines credit one hostname instead of treating the two as duplicates.
 */
export const SITE_URL = "https://campai.space";

/** Hostnames that serve the app but are not canonical. Redirected in middleware. */
export const LEGACY_HOSTS = ["campai.cortexresearch.group", "camp-ai-platform-production.up.railway.app"];

export const SITE_NAME = "CampAI";

export const SITE_TAGLINE = "The live vibe coding hyper hackathon";

export const SITE_DESCRIPTION =
  "CampAI is a live vibe coding hyper hackathon. Builders get 30 minutes to build and ship something real with AI, demo it on X, and get rated by everyone watching.";
