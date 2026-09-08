"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string };

export function MobileNav({ primary, secondary }: { primary: Item[]; secondary: Item[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation, and lock body scroll while the sheet is open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="rounded-lg border border-ink-600 bg-ink-800 p-2 text-mist-300 lg:hidden"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-ink-950/85 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 right-0 flex w-[86%] max-w-sm flex-col border-l border-ink-700 bg-ink-900 shadow-2xl">
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-700 px-5">
                <span className="font-display font-bold text-mist-100">
                  <span aria-hidden>🏕️</span> AI
                </span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="rounded-lg p-2 text-mist-500 hover:bg-ink-800 hover:text-mist-100"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-3 py-5">
                <ul className="space-y-0.5">
                  {primary.map((i) => (
                    <li key={i.href}>
                      <Link
                        href={i.href}
                        className="block rounded-lg px-3.5 py-2.5 font-display text-[15px] text-mist-100 hover:bg-ink-800"
                      >
                        {i.label}
                      </Link>
                    </li>
                  ))}
                </ul>
                <div className="rule my-4" />
                <ul className="space-y-0.5">
                  {secondary.map((i) => (
                    <li key={i.href}>
                      <Link href={i.href} className="block rounded-lg px-3.5 py-2 text-[13px] text-mist-500 hover:bg-ink-800">
                        {i.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="shrink-0 border-t border-ink-700 p-4">
                <Link
                  href="/join"
                  className="block rounded-lg bg-ember-500 px-4 py-3 text-center text-sm font-semibold text-ink-950"
                >
                  Join as a builder
                </Link>
                <Link
                  href="/partnership"
                  className="mt-2 block rounded-lg border border-ink-600 px-4 py-3 text-center text-sm text-mist-100"
                >
                  Become a partner
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
