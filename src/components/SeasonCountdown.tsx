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

/**
 * Two-phase countdown for the nightly build window: counts down to the
 * submission-window start, then flips to counting down to the deadline.
 */
export function SeasonCountdown({ start, deadline }: { start: string; deadline: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) {
    return <span className="tnum text-mist-500">--:--</span>;
  }

  const startMs = new Date(start).getTime();
  const deadlineMs = new Date(deadline).getTime();

  let label: string;
  let time: string;
  if (now < startMs) {
    label = "Submission countdown starts in";
    time = format(startMs - now);
  } else if (now < deadlineMs) {
    label = "Submissions close in";
    time = format(deadlineMs - now);
  } else {
    label = "Submissions are closed";
    time = "";
  }

  return (
    <div className="text-center">
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist-700">{label}</p>
      {time && <p className="tnum mt-1 font-display text-4xl font-semibold text-ember-400">{time}</p>}
    </div>
  );
}
