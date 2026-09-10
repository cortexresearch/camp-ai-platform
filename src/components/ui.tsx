import Link from "next/link";
import type { ReactNode } from "react";

/* ------------------------------------------------------------------ layout */

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-5 sm:px-8 ${className}`}>{children}</div>;
}

export function Card({
  children,
  className = "",
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return <As className={`card ${className}`}>{children}</As>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.22em] text-ember-400">{eyebrow}</p>
        )}
        <h2 className="text-2xl font-semibold sm:text-3xl">{title}</h2>
        {description && <p className="mt-2 text-sm leading-relaxed text-mist-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/** Standard page masthead. Every non-home page opens with one. */
export function PageHero({
  eyebrow,
  title,
  lede,
  children,
  actions,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="bc-subhero border-b border-ink-700/60 bg-ink-900/30">
      <Container className="py-12 sm:py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-ember-400">{eyebrow}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-3xl">
            <h1 className="font-display text-3xl font-bold tracking-tight text-mist-100 sm:text-5xl">
              {title}
            </h1>
            {lede && <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-mist-500">{lede}</p>}
          </div>
          {actions}
        </div>
        {children}
      </Container>
    </section>
  );
}

/** Long-form prose block with consistent rhythm. */
export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="max-w-3xl space-y-5 text-[14.5px] leading-relaxed text-mist-500 [&_a]:text-aurora-300 [&_a:hover]:underline [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-mist-100 [&_h3]:mt-7 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-mist-100 [&_li]:leading-relaxed [&_strong]:text-mist-100 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-5">
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------- buttons */

const BUTTON_VARIANTS = {
  primary:
    "bc-primary bg-ember-500 text-ink-950 hover:bg-ember-400 font-semibold",
  secondary: "bg-ink-700 text-mist-100 hover:bg-ink-600 border border-ink-600",
  ghost: "text-mist-300 hover:text-mist-100 hover:bg-ink-800",
  outline: "border border-ember-500/50 text-ember-300 hover:bg-ember-500/10",
} as const;

export function Button({
  children,
  href,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  ...rest
}: {
  children: ReactNode;
  href?: string;
  variant?: keyof typeof BUTTON_VARIANTS;
  size?: "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit";
} & Record<string, unknown>) {
  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-[15px]",
  };
  const cls = `inline-flex items-center justify-center gap-2 rounded-lg transition-colors ${sizes[size]} ${BUTTON_VARIANTS[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}

/* -------------------------------------------------------------------- pills */

const PILL_TONES = {
  neutral: "border-ink-600 bg-ink-800 text-mist-300",
  ember: "border-ember-500/40 bg-ember-500/10 text-ember-300",
  aurora: "border-aurora-400/40 bg-aurora-400/10 text-aurora-300",
  signal: "border-signal-400/40 bg-signal-400/10 text-signal-400",
  danger: "border-danger-400/40 bg-danger-400/10 text-danger-400",
  warn: "border-warn-400/40 bg-warn-400/10 text-warn-400",
} as const;

export function Pill({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof PILL_TONES;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] ${PILL_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function LiveDot() {
  return (
    <span className="live-dot inline-block size-1.5 shrink-0 rounded-full bg-signal-400" aria-hidden />
  );
}

/* ------------------------------------------------------------------- stats */

export function Stat({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: "default" | "ember" | "aurora";
}) {
  const valueTone =
    tone === "ember" ? "text-ember-400" : tone === "aurora" ? "text-aurora-300" : "text-mist-100";
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-700">{label}</p>
      <p className={`tnum mt-1.5 font-display text-2xl font-semibold sm:text-3xl ${valueTone}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-mist-500">{sub}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ avatar */

/**
 * Monogram avatars. Deterministic hue from the name means a builder keeps the
 * same colour everywhere without any image hosting.
 */
export function Avatar({
  name,
  src,
  size = 40,
  ring = false,
}: {
  name: string;
  src?: string;
  size?: number;
  ring?: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;

  if (src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden
        className={`inline-block shrink-0 rounded-full object-cover ${
          ring ? "ring-2 ring-ember-500/50 ring-offset-2 ring-offset-ink-900" : ""
        }`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-white ${
        ring ? "ring-2 ring-ember-500/50 ring-offset-2 ring-offset-ink-900" : ""
      }`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `linear-gradient(140deg, hsl(${h} 62% 44%), hsl(${(h + 42) % 360} 58% 26%))`,
      }}
    >
      {initials}
    </span>
  );
}

/** Organization monogram tile — square, brand-coloured. */
export function OrgMark({
  monogram,
  color,
  size = 44,
}: {
  monogram: string;
  color: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-xl font-display font-bold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        color,
        background: `color-mix(in oklab, ${color} 16%, #0b0f17)`,
        border: `1px solid color-mix(in oklab, ${color} 34%, transparent)`,
      }}
    >
      {monogram}
    </span>
  );
}

/* ---------------------------------------------------------------- progress */

export function Meter({
  value,
  max = 100,
  tone = "ember",
  label,
}: {
  value: number;
  max?: number;
  tone?: "ember" | "aurora" | "signal";
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  const bg = { ember: "bg-ember-500", aurora: "bg-aurora-400", signal: "bg-signal-400" }[tone];
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className="h-1.5 w-full overflow-hidden rounded-full bg-ink-700"
    >
      <div className={`h-full rounded-full ${bg} transition-[width] duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/* -------------------------------------------------------- metric provenance */

/**
 * Partner metrics must never read as verified when they aren't. Every figure on
 * a partner surface carries one of these.
 */
export function SourceChip({ source }: { source: "verified" | "platform" | "partner-reported" | "estimate" }) {
  const map = {
    verified: { tone: "signal" as const, label: "Verified" },
    platform: { tone: "aurora" as const, label: "Platform" },
    "partner-reported": { tone: "warn" as const, label: "Partner-reported" },
    estimate: { tone: "neutral" as const, label: "Estimate" },
  };
  const { tone, label } = map[source];
  return <Pill tone={tone}>{label}</Pill>;
}

/* ------------------------------------------------------------------ empty */

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <Card className="p-10 text-center">
      <p className="font-display text-lg font-semibold text-mist-100">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-mist-500">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </Card>
  );
}

/** A short paragraph flagging demo-only behaviour, used on non-functional forms. */
export function DemoNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-aurora-400/25 bg-aurora-400/[0.06] px-3.5 py-2.5 text-xs leading-relaxed text-aurora-300">
      {children}
    </p>
  );
}
