import Link from "next/link";

function pillClass(active: boolean): string {
  return `inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
    active
      ? "border-ember-500/40 bg-ember-500/10 text-ember-300"
      : "border-ink-600 bg-ink-800 text-mist-300 hover:text-mist-100"
  }`;
}

export function SeasonPills({
  basePath,
  availableSeasons,
  selectedSeason,
  showAll,
}: {
  basePath: string;
  availableSeasons: number[];
  selectedSeason: number | null;
  showAll: boolean;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-center gap-2">
      {availableSeasons.map((s) => (
        <Link key={s} href={`${basePath}?season=${s}`} className={pillClass(!showAll && selectedSeason === s)}>
          Season {s}
        </Link>
      ))}
      <Link href={`${basePath}?season=all`} className={pillClass(showAll)}>
        All seasons
      </Link>
    </div>
  );
}
