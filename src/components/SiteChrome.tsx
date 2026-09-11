import Link from "next/link";
import { Container, Pill, LiveDot, Button, Avatar } from "./ui";
import { MobileNav } from "./MobileNav";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { getCurrentEpisode, episodeLabel } from "@/lib/season";

const PRODUCER = "Cortex Research Group";
const PRODUCER_URL = "https://cortexresearch.group";

export const PRIMARY_NAV = [
  { href: "/challenge", label: "Challenge" },
  { href: "/builds", label: "Builds" },
  { href: "/vote", label: "Vote" },
  { href: "/builders", label: "Builders" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/season", label: "Season" },
  { href: "/spaces", label: "Spaces" },
];

export const SECONDARY_NAV = [
  { href: "/partnership", label: "Partner with us" },
  { href: "/support", label: "Support" },
  { href: "/contact", label: "Contact" },
];

export async function SiteHeader() {
  const user = await getCurrentUser();
  const currentEpisode = await getCurrentEpisode();
  const isLive = currentEpisode?.status === "live";

  return (
    <header className="sticky top-0 z-30 border-b border-ink-700/80 bg-ink-950/80 backdrop-blur-xl">
      <Link
        href="/builds"
        className="block bg-gradient-to-r from-signal-500/15 via-signal-400/10 to-transparent transition-colors hover:from-signal-500/25"
      >
        <Container className="flex items-center gap-2.5 py-2 text-xs">
          {isLive ? (
            <>
              <LiveDot />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-signal-400">Live now</span>
            </>
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-700">Up next</span>
          )}
          <span className="truncate text-mist-300">{currentEpisode ? episodeLabel(currentEpisode) : ""}</span>
          <span className="ml-auto hidden shrink-0 text-mist-500 sm:inline">See builds →</span>
        </Container>
      </Link>

      <Container className="flex h-16 items-center gap-4">
        <div className="flex shrink-0 items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="text-xl leading-none" aria-hidden>
              🏕️
            </span>
            <span className="font-display text-[17px] font-bold tracking-tight text-mist-100">CampAI</span>
          </Link>
          <a
            href={PRODUCER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-mist-700 hover:text-mist-400 lg:inline"
          >
            {PRODUCER}
          </a>
        </div>

        <nav aria-label="Primary" className="ml-3 hidden items-center gap-0.5 lg:flex">
          {PRIMARY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-[13px] text-mist-300 transition-colors hover:bg-ink-800 hover:text-mist-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2.5">
          {user ? (
            <>
              <Link
                href={`/u/${user.handle}`}
                className="hidden items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-ink-800 sm:flex"
              >
                <Avatar name={user.name} src={user.avatar_path ? `/api/uploads/${user.avatar_path}` : undefined} size={28} />
                <span className="hidden text-[13px] text-mist-300 xl:inline">{user.name}</span>
              </Link>
              <Button href={`/u/${user.handle}`} variant="ghost" size="sm" className="hidden sm:inline-flex">
                Settings
              </Button>
              <Button href="/submit" size="sm" className="hidden sm:inline-flex">
                Submit build
              </Button>
              <form action={logoutAction}>
                <Button type="submit" variant="ghost" size="sm">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                Log in
              </Button>
              <Button href="/signup" size="sm" className="hidden sm:inline-flex">
                Sign up
              </Button>
            </>
          )}

          <MobileNav
            primary={PRIMARY_NAV}
            secondary={user ? [{ href: `/u/${user.handle}`, label: "Settings" }, ...SECONDARY_NAV] : SECONDARY_NAV}
          />
        </div>
      </Container>
    </header>
  );
}

export async function SiteFooter() {
  const currentEpisode = await getCurrentEpisode();
  const isLive = currentEpisode?.status === "live";
  const cols = [
    {
      title: "Compete",
      links: [
        { href: "/challenge", label: "Challenge" },
        { href: "/builds", label: "Builds" },
        { href: "/vote", label: "Vote" },
        { href: "/builders", label: "Builders" },
        { href: "/leaderboard", label: "Leaderboard" },
        { href: "/season", label: "Season" },
        { href: "/spaces", label: "Spaces" },
        { href: "/submit", label: "Submit a build" },
        { href: "/signup", label: "Sign up" },
        { href: "/login", label: "Log in" },
      ],
    },
    {
      title: "Partners",
      links: [{ href: "/partnership", label: "Partner with us" }],
    },
    {
      title: "About",
      links: [
        { href: "/about", label: "About" },
        { href: "/how-it-works", label: "How it works" },
        { href: "/rules", label: "Rules" },
        { href: "/faq", label: "FAQ" },
        { href: "/code-of-conduct", label: "Code of conduct" },
        { href: "/support", label: "Support" },
        { href: "/contact", label: "Contact" },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-ink-700/80 bg-ink-950/60">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <span className="text-xl" aria-hidden>
                🏕️
              </span>
              <span className="font-display text-lg font-bold text-mist-100">CampAI</span>
            </div>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-mist-500">
              CampAI is a live vibe coding hackathon. Build with AI, ship in 30 minutes,
              compete all season.
            </p>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-mist-700">
              Produced by{" "}
              <a href={PRODUCER_URL} target="_blank" rel="noopener noreferrer" className="hover:text-mist-400">
                {PRODUCER}
              </a>
            </p>
          </div>

          {cols.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-ember-400">
                {col.title}
              </h3>
              <ul className="mt-3.5 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-[13px] text-mist-500 transition-colors hover:text-mist-100">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="rule my-10" />

        <div className="flex flex-wrap items-center justify-between gap-4 text-[12px] text-mist-700">
          <p>© {new Date().getFullYear()} CampAI. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-3">
            <Pill tone="ember">{currentEpisode ? episodeLabel(currentEpisode) : ""}{isLive ? " · live" : ""}</Pill>
          </div>
        </div>
      </Container>
    </footer>
  );
}
