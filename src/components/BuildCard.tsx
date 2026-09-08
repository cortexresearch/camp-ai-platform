import Link from "next/link";
import { Card, Button, Pill } from "./ui";
import { CollapsibleText } from "./CollapsibleText";
import { ShareButton } from "./ShareButton";
import { rateAction } from "@/lib/actions";

const SITE_URL = "https://campai.cortexresearch.group";
// User-uploaded static HTML demos are served from Railway's own subdomain
// (a genuinely different origin/cookie jar from SITE_URL), not our custom
// domain — that's what makes it safe to grant the sandbox allow-same-origin
// so demos can use localStorage/sessionStorage like a normal page would.
const UPLOADS_ORIGIN = "https://camp-ai-platform-production.up.railway.app";

export interface BuildCardData {
  id: string;
  user_id: string;
  episode?: string;
  mobile_friendly?: boolean | null;
  title: string;
  how_it_works: string;
  models_used: string;
  token_cost: string;
  prompts_issues: string;
  demo_url: string;
  repo_url: string;
  screenshot_path: string;
  html_demo_path: string;
  author_name: string;
  author_handle: string;
  avg_rating: string;
  rating_count: string;
  user_rating_name: string | null;
  user_rating_pitch: string | null;
  user_rating_product: string | null;
  user_rating_ui: string | null;
  user_rating_name_editable: boolean | null;
  user_rating_pitch_editable: boolean | null;
  user_rating_product_editable: boolean | null;
  user_rating_ui_editable: boolean | null;
  comment_count: string;
  voters?: { name: string; handle: string }[] | null;
}

const RATING_CATEGORIES = [
  { key: "name", label: "Name" },
  { key: "pitch", label: "Pitch" },
  { key: "product", label: "Product" },
  { key: "ui", label: "UI" },
] as const;

export function BuildCard({
  build: b,
  viewerId,
  linkTitle = false,
}: {
  build: BuildCardData;
  viewerId: string | null;
  linkTitle?: boolean;
}) {
  const shareUrl = `${SITE_URL}/builds/${b.id}`;

  return (
    <Card className="p-5">
      {b.screenshot_path && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/api/uploads/${b.screenshot_path}`}
          alt={`Screenshot of ${b.title}`}
          className="mb-4 aspect-video w-full rounded-lg border border-ink-700/60 object-cover"
        />
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          {linkTitle ? (
            <Link href={`/builds/${b.id}`} className="font-display text-lg font-semibold text-mist-100 hover:text-ember-400">
              {b.title}
            </Link>
          ) : (
            <h1 className="font-display text-lg font-semibold text-mist-100">{b.title}</h1>
          )}
          <p className="mt-0.5 text-[12px] text-mist-700">
            by{" "}
            <Link href={`/u/${b.author_handle}`} className="hover:text-mist-400">
              {b.author_name}
            </Link>
          </p>
          {b.mobile_friendly === false && (
            <Pill tone="warn" className="mt-1.5">⚠ Desktop only</Pill>
          )}
        </div>
        <div className="flex items-center gap-2">
          {viewerId === b.user_id && (
            <Button href={`/builds/${b.id}/edit`} variant="secondary" size="sm">
              Edit
            </Button>
          )}
          {Number(b.rating_count) > 0 ? (
            <Pill tone="ember">★ {Number(b.avg_rating).toFixed(1)} ({b.rating_count})</Pill>
          ) : (
            <Pill>No ratings yet</Pill>
          )}
        </div>
      </div>

      {b.voters && b.voters.length > 0 && (
        <p className="mt-2 text-[11.5px] leading-relaxed text-mist-700">
          Voted by{" "}
          {b.voters.map((v, i) => (
            <span key={v.handle}>
              <Link href={`/u/${v.handle}`} className="hover:text-mist-400">
                {v.name}
              </Link>
              {i < b.voters!.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      )}

      {(b.demo_url || b.html_demo_path || b.repo_url) && (
        <div className="mt-3 flex flex-wrap gap-3 text-[12.5px]">
          {b.demo_url && (
            <a href={b.demo_url} target="_blank" rel="noopener noreferrer" className="text-aurora-300 hover:underline">
              Live demo ↗
            </a>
          )}
          {b.html_demo_path && (
            <a
              href={`${UPLOADS_ORIGIN}/api/uploads/${b.html_demo_path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-aurora-300 hover:underline"
            >
              Static demo ↗
            </a>
          )}
          {b.repo_url && (
            <a href={b.repo_url} target="_blank" rel="noopener noreferrer" className="text-aurora-300 hover:underline">
              Source ↗
            </a>
          )}
        </div>
      )}

      <p className="mt-4 text-[13.5px] leading-relaxed text-mist-300">{b.how_it_works}</p>

      <div className="rule my-4" />

      <dl className="grid gap-3 text-[12.5px] sm:grid-cols-2">
        <div>
          <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-700">Models</dt>
          <dd className="mt-1 text-mist-300">{b.models_used}</dd>
        </div>
        {b.token_cost && (
          <div>
            <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-700">Cost</dt>
            <dd className="mt-1 text-mist-300">{b.token_cost}</dd>
          </div>
        )}
      </dl>

      <div className="mt-4">
        <dt className="font-mono text-[9px] uppercase tracking-[0.14em] text-mist-700">Prompts &amp; issues</dt>
        <dd className="mt-1.5">
          <CollapsibleText text={b.prompts_issues} />
        </dd>
      </div>

      <div className="mt-5">
        {viewerId ? (
          <div className="space-y-1.5">
            {RATING_CATEGORIES.map(({ key, label }) => {
              const given = b[`user_rating_${key}` as const];
              const editable = b[`user_rating_${key}_editable` as const];
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-[11.5px] text-mist-700">{label}</span>
                  {given && !editable ? (
                    <span className="text-ember-400">{"★".repeat(Number(given))}</span>
                  ) : (
                    <form action={rateAction} className="flex items-center gap-1">
                      <input type="hidden" name="build_id" value={b.id} />
                      <input type="hidden" name="category" value={key} />
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="submit"
                          name="stars"
                          value={n}
                          aria-label={`Rate ${label} ${n} star${n === 1 ? "" : "s"}`}
                          className={`text-lg leading-none transition-colors hover:text-ember-400 ${
                            given && n <= Number(given) ? "text-ember-400" : "text-mist-700"
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </form>
                  )}
                  {given && editable && <span className="text-[10.5px] text-mist-700">editable for a few more min</span>}
                </div>
              );
            })}
          </div>
        ) : (
          <Button href="/login" variant="secondary" size="sm">
            Log in to rate
          </Button>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link href={`/builds/${b.id}#comments`} className="text-[12.5px] text-mist-500 hover:text-mist-300">
            {b.comment_count} comment{b.comment_count === "1" ? "" : "s"}
          </Link>
          <ShareButton url={shareUrl} title={`${b.title} — 🏕️ AI`} />
        </div>
      </div>
    </Card>
  );
}
