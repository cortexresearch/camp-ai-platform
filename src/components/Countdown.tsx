"use client";

import { useEffect, useState } from "react";

/**
 * Countdown to an ISO timestamp.
 *
 * Renders a stable placeholder on the server and first client paint, then
 * starts ticking after mount — otherwise the server's "time remaining" and the
 * client's disagree by the network latency and React reports a hydration
 * mismatch on every load.
 */

function parts(msRemaining: number) {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    total,
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Countdown({
  target,
  className = "",
  compact = false,
  onComplete,
}: {
  target: string;
  className?: string;
  compact?: boolean;
  onComplete?: string;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const end = new Date(target).getTime();
    const tick = () => setRemaining(end - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  if (remaining === null) {
    return <span className={`tnum text-mist-500 ${className}`}>--:--:--</span>;
  }

  const p = parts(remaining);
  if (p.total <= 0) {
    return <span className={`tnum text-mist-500 ${className}`}>{onComplete ?? "Closed"}</span>;
  }

  if (compact) {
    const text =
      p.days > 0
        ? `${p.days}d ${pad(p.hours)}h`
        : p.hours > 0
          ? `${p.hours}h ${pad(p.minutes)}m`
          : `${p.minutes}m ${pad(p.seconds)}s`;
    return <span className={`tnum ${className}`}>{text}</span>;
  }

  const units: [string, number][] = p.days
    ? [
        ["days", p.days],
        ["hrs", p.hours],
        ["min", p.minutes],
        ["sec", p.seconds],
      ]
    : [
        ["hrs", p.hours],
        ["min", p.minutes],
        ["sec", p.seconds],
      ];

  return (
    <div className={`flex gap-2.5 ${className}`}>
      {units.map(([label, value]) => (
        <div
          key={label}
          className="min-w-[62px] rounded-lg border border-ink-600 bg-ink-850/80 px-3 py-2 text-center"
        >
          <div className="tnum font-display text-2xl font-semibold text-mist-100">{pad(value)}</div>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] text-mist-700">{label}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * The build clock on a live challenge — a 30-minute bar that drains, turning
 * amber under five minutes and red under one.
 */
export function BuildTimer({ startsAt, deadlineAt }: { startsAt: string; deadlineAt: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const start = new Date(startsAt).getTime();
  const end = new Date(deadlineAt).getTime();

  if (now === null) {
    return <div className="h-2 w-full rounded-full bg-ink-700" aria-hidden />;
  }

  const elapsed = Math.max(0, now - start);
  const total = end - start;
  const remaining = Math.max(0, end - now);
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));

  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);

  const tone = remaining <= 60_000 ? "bg-danger-400" : remaining <= 300_000 ? "bg-warn-400" : "bg-signal-400";
  const textTone =
    remaining <= 60_000 ? "text-danger-400" : remaining <= 300_000 ? "text-warn-400" : "text-signal-400";

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-700">
          Build clock
        </span>
        <span className={`tnum font-display text-xl font-semibold ${textTone}`} role="timer" aria-live="off">
          {pad(mins)}:{pad(secs)}
        </span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Time remaining in the build window"
        className="h-2 w-full overflow-hidden rounded-full bg-ink-700"
      >
        <div className={`h-full rounded-full ${tone} transition-[width] duration-1000 ease-linear`} style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1.5 text-[11px] text-mist-700">
        {Math.floor(elapsed / 60000)} minutes elapsed · submissions lock automatically at the deadline
      </p>
    </div>
  );
}

/** Relative time that only renders after mount, for the same hydration reason. */
export function RelativeTime({ iso }: { iso: string }) {
  const [text, setText] = useState<string>("");

  useEffect(() => {
    const compute = () => {
      const diff = Date.now() - new Date(iso).getTime();
      const mins = Math.round(diff / 60000);
      if (Math.abs(mins) < 1) return "just now";
      if (Math.abs(mins) < 60) return `${mins}m ago`;
      const hrs = Math.round(mins / 60);
      if (Math.abs(hrs) < 24) return `${hrs}h ago`;
      const days = Math.round(hrs / 24);
      return `${days}d ago`;
    };
    setText(compute());
    const id = setInterval(() => setText(compute()), 30_000);
    return () => clearInterval(id);
  }, [iso]);

  return <span suppressHydrationWarning>{text || "—"}</span>;
}
