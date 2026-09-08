"use client";

import { useState } from "react";

export function CollapsibleText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 220 || text.split("\n").length > 3;

  if (!isLong) {
    return <p className="text-[13px] leading-relaxed text-mist-500 whitespace-pre-line">{text}</p>;
  }

  return (
    <div>
      <p
        className={`text-[13px] leading-relaxed text-mist-500 whitespace-pre-line ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-ember-400 hover:text-ember-300"
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
}
