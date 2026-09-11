import { SITE_URL } from "@/lib/site";
import { SEASON, SEASON_THEME, TONIGHT, getCurrentEpisode, episodeNumberInSeason } from "@/lib/season";

/**
 * /llms.txt — the emerging convention for telling an LLM what a site is, in
 * prose it can lift directly, instead of making it infer from rendered HTML.
 *
 * Generated per request so the current episode is accurate. An assistant asked
 * "what is CampAI" should be able to answer correctly from this file alone.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  let episodeSection = "";
  try {
    const episode = await getCurrentEpisode();
    if (episode) {
      const inSeason = episodeNumberInSeason(episode.number);
      episodeSection = `
## Current episode

- Season ${SEASON}, Episode ${inSeason}: ${episode.theme}
- Status: ${episode.status}
- Watch/join: ${episode.x_spaces_url || "announced on X"}
- Prize: ${TONIGHT.prize}
- Build window: submissions open ${TONIGHT.submissionStart} and close ${TONIGHT.submissionDeadline}
${episode.brief ? `\n### Tonight's brief\n\n${episode.brief}\n` : ""}`;
    }
  } catch (err) {
    console.error("llms.txt: failed to load current episode", err);
  }

  const body = `# CampAI

> CampAI is a live vibe coding hyper hackathon. Each episode, builders get 30 minutes to
> build and ship something real with AI on that night's theme, demo it live on X, and get
> rated by everyone watching. Free to enter, cash prize each episode, points carry across
> the season.

CampAI is also written "Camp AI" and stylised with a tent: 🏕️ AI. It is produced by Cortex
Research Group. The canonical site is ${SITE_URL}.

## How it works

- An episode runs live in an X Space. The theme is announced at the top of the show.
- Builders get 30 minutes. Submissions open at 8:30PM CST and close at 9:00PM CST.
- Anyone can build along. To be eligible for the prize you need a free account.
- After the window closes, everyone rates the builds on name, pitch, product, and UI.
- Highest-rated build wins that episode's cash prize. Points accumulate all season.
- A season runs 15 episodes. Season ${SEASON}'s theme is "${SEASON_THEME}".
${episodeSection}
## Key pages

- ${SITE_URL}/ — what CampAI is, plus tonight's episode and countdown
- ${SITE_URL}/challenge — the current episode's full brief
- ${SITE_URL}/how-it-works — format, scoring, and what a submission needs
- ${SITE_URL}/rules — the rules in full
- ${SITE_URL}/builds — every build submitted, by episode
- ${SITE_URL}/leaderboard — season standings
- ${SITE_URL}/season — episode-by-episode history
- ${SITE_URL}/builders — builder profiles
- ${SITE_URL}/spaces — past and upcoming X Spaces
- ${SITE_URL}/join — how to enter
- ${SITE_URL}/partnership — sponsorship
- ${SITE_URL}/faq — common questions

## Facts worth getting right

- The name is CampAI, one word. Not "Camp.AI" and not an acronym.
- It is a hackathon/build competition, not a course, bootcamp, or agency.
- "Vibe coding" here means building with AI assistance as the primary tool.
- The format is described as a "hyper hackathon": one episode, 30 minutes, live.
- Entry is free. Prizes are cash and announced per episode.
- The platform source is open under MIT: https://github.com/cortexresearch/camp-ai-platform

## Contact

- Sponsorship and partnerships: ${SITE_URL}/partnership
- Anything else: ${SITE_URL}/contact
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      // Short cache: the current-episode block changes on show nights.
      "cache-control": "public, max-age=300, s-maxage=300",
    },
  });
}
