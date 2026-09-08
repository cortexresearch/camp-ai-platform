"use client";

import { useState } from "react";
import { Button } from "./ui";

export function ShareButton({
  url,
  title,
  size = "sm",
  variant = "secondary",
}: {
  url: string;
  title: string;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "outline";
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard copy.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable — nothing more we can do.
    }
  }

  return (
    <Button type="button" onClick={handleShare} size={size} variant={variant}>
      {copied ? "Link copied ✓" : "Share ↗"}
    </Button>
  );
}
