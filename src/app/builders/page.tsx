import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, Card, Avatar, Pill, EmptyState } from "@/components/ui";
import { pool } from "@/lib/db";

export const metadata: Metadata = { title: "Builders" };
export const dynamic = "force-dynamic";

interface BuilderRow {
  id: string;
  name: string;
  handle: string;
  avatar_path: string;
  build_count: string;
}

export default async function BuildersPage() {
  const result = await pool.query<BuilderRow>(
    `select u.id, u.name, u.handle, u.avatar_path, count(distinct b.id) as build_count
     from users u
     left join builds b on b.user_id = u.id
     where u.role = 'builder'
     group by u.id
     order by count(distinct b.id) desc, u.created_at asc`
  );
  const builders = result.rows;

  return (
    <>
      <PageHero
        eyebrow="Builders"
        title="Builders"
        lede="Everyone signed up to build this season."
      />
      <Container className="py-12">
        {builders.length === 0 ? (
          <EmptyState title="No builders yet" body="Be the first to sign up." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {builders.map((b) => (
              <Card key={b.id} className="card-link">
                <Link href={`/u/${b.handle}`} className="bc-builder-row">
                  <Avatar name={b.name} src={b.avatar_path ? `/api/uploads/${b.avatar_path}` : undefined} size={44} />
                  <div className="bc-member-copy">
                    <p className="bc-member-name">{b.name}</p>
                    <p className="bc-member-meta">@{b.handle}</p>
                  </div>
                  <Pill tone="ember" className="bc-member-score">
                    {b.build_count} build{b.build_count === "1" ? "" : "s"}
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
