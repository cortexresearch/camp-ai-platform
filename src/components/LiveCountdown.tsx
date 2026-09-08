"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

function format(msRemaining: number) {
  const total = Math.max(0, Math.floor(msRemaining / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Counts down to an episode's go-live time. Renders nothing once that time has passed. */
export function LiveCountdown({ liveAt }: { liveAt: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return null;

  const remaining = new Date(liveAt).getTime() - now;
  if (remaining <= 0) return null;

  return (
    <div className="text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-mist-700">Goes live in</p>
      <p className="tnum mt-1 font-display text-5xl font-semibold text-ember-400">{format(remaining)}</p>
    </div>
  );
}
