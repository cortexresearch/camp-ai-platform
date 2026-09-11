import { episodeSeason, episodeNumberInSeason, type Episode } from "./season";

/**
 * URL slug for an episode theme. Keyword-bearing rather than numeric, because
 * the search traffic these pages can win is the theme itself — someone looking
 * for "group red flag detector" finds /episodes/group-red-flag-detector, not
 * /season?episode=24.
 */
export function themeSlug(theme: string): string {
  return theme
    .toLowerCase()
    // Strip anything that isn't a letter or digit. Themes carry emoji ("Reimagine 🏕️ AI")
    // and punctuation ("Audio/Video Clipper", "Game PT.1") that can't go in a path.
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Slugs for a whole set of episodes, guaranteed unique.
 *
 * Two seasons could land on the same theme eventually. When that happens the
 * earlier episode keeps the clean slug — its URL may already be indexed and
 * linked — and later ones take an episode-code suffix. Iteration is by episode
 * number so the result is stable across requests regardless of input order.
 */
export function buildEpisodeSlugMap(episodes: Episode[]): Map<number, string> {
  const byNumber = [...episodes].sort((a, b) => a.number - b.number);
  const slugs = new Map<number, string>();
  const taken = new Set<string>();

  for (const ep of byNumber) {
    const base = themeSlug(ep.theme) || `episode-${ep.number}`;
    let slug = base;
    if (taken.has(slug)) {
      slug = `${base}-s${episodeSeason(ep.number)}e${episodeNumberInSeason(ep.number)}`;
    }
    // Still taken (same theme twice in one season) — fall back to the global
    // number, which is unique by definition.
    if (taken.has(slug)) slug = `${base}-${ep.number}`;
    taken.add(slug);
    slugs.set(ep.number, slug);
  }

  return slugs;
}

/** Reverse lookup: which episode does this slug belong to? */
export function episodeNumberForSlug(episodes: Episode[], slug: string): number | null {
  for (const [number, value] of buildEpisodeSlugMap(episodes)) {
    if (value === slug) return number;
  }
  return null;
}
