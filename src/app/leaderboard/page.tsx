import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, Card, Avatar, Pill, EmptyState } from "@/components/ui";
import { SeasonPills } from "@/components/SeasonPills";
import { pool } from "@/lib/db";
import { getAvailableSeasons, seasonSqlExpr, SEASON } from "@/lib/season";

export const metadata: Metadata = { title: "Leaderboard" };
export const dynamic = "force-dynamic";

const POINTS_PER_SUBMISSION = 10;

const POINTS_PER_VOTE = 1;

interface LeaderboardRow {
  id: string;
  name: string;
  handle: string;
  avatar_path: string;
  build_count: string;
  rating_count: string;
  received_points: string;
}

const RANK_TONE = ["ember", "aurora", "neutral"] as const;

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season: seasonParam } = await searchParams;
  const availableSeasons = await getAvailableSeasons();

  const showAll = seasonParam === "all";
  const selectedSeason = showAll ? null : Number(seasonParam) || SEASON;

  const buildSeasonExpr = seasonSqlExpr("episode");

  const result = await pool.query<LeaderboardRow>(
    `select u.id, u.name, u.handle, u.avatar_path,
            coalesce(bc.build_count, 0) as build_count,
            coalesce(rv.rating_count, 0) as rating_count,
            coalesce(rr.received_points, 0) as received_points
     from users u
     left join (select user_id, count(*) as build_count from builds
                where $1::int is null or ${buildSeasonExpr} = $1::int
                group by user_id) bc on bc.user_id = u.id
     left join (select r.user_id, count(*) as rating_count
                from ratings r join builds b on b.id = r.build_id
                where $1::int is null or ${seasonSqlExpr("b.episode")} = $1::int
                group by r.user_id) rv on rv.user_id = u.id
     left join (select b.user_id, sum(r.stars) as received_points
                from ratings r join builds b on b.id = r.build_id
                where $1::int is null or ${seasonSqlExpr("b.episode")} = $1::int
                group by b.user_id) rr on rr.user_id = u.id
     order by (coalesce(bc.build_count, 0) * ${POINTS_PER_SUBMISSION}
               + coalesce(rv.rating_count, 0) * ${POINTS_PER_VOTE}
               + coalesce(rr.received_points, 0)) desc,
              u.created_at asc`,
    [selectedSeason]
  );

  const rows = result.rows
    .map((r) => {
      const builds = Number(r.build_count);
      const ratings = Number(r.rating_count);
      const receivedPoints = Number(r.received_points);
      return {
        ...r,
        builds,
        ratings,
        points: builds * POINTS_PER_SUBMISSION + ratings * POINTS_PER_VOTE + receivedPoints,
      };
    })
    // Season-scoped views drop everyone with zero activity that season so the
    // board isn't padded with builders who only showed up a different season.
    .filter((r) => showAll || r.points > 0);

  return (
    <>
      <PageHero
        eyebrow="Leaderboard"
        title="Leaderboard"
        lede={`Points for showing up. +${POINTS_PER_SUBMISSION} for every build you submit, +${POINTS_PER_VOTE} for every category (name, pitch, product, UI) you rate, plus the stars your builds receive from others.`}
      />
      <Container className="py-12">
        <SeasonPills
          basePath="/leaderboard"
          availableSeasons={availableSeasons}
          selectedSeason={selectedSeason}
          showAll={showAll}
        />

        {rows.length === 0 ? (
          <EmptyState
            title="No points yet"
            body={showAll ? "Submit a build or rate one to get on the board." : `No points yet for Season ${selectedSeason}. Submit a build or rate one to get on the board.`}
          />
        ) : (
          <div className="mx-auto max-w-2xl space-y-3">
            {rows.map((r, i) => (
              <Card key={r.id} className="card-link">
                <Link href={`/u/${r.handle}`} className="flex items-center gap-4 p-4">
                  <span
                    className={`w-7 shrink-0 text-center font-mono text-[13px] font-semibold ${
                      i === 0 ? "text-ember-400" : i === 1 ? "text-aurora-300" : i === 2 ? "text-mist-300" : "text-mist-700"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <Avatar name={r.name} src={r.avatar_path ? `/api/uploads/${r.avatar_path}` : undefined} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[15px] font-semibold text-mist-100">{r.name}</p>
                    <p className="truncate text-[12px] text-mist-700">
                      @{r.handle} · {r.builds} build{r.builds === 1 ? "" : "s"} · {r.ratings} rating{r.ratings === 1 ? "" : "s"} given
                    </p>
                  </div>
                  <Pill tone={i < 3 ? RANK_TONE[i] : "neutral"} className="ml-auto shrink-0">
                    {r.points} pts
                  </Pill>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
