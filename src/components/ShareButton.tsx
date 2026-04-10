"use client";

import type { CuratedQuote } from "../types";
import { useState } from "react";

export function ShareButton({ quote }: { quote: CuratedQuote }) {
  const [copied, setCopied] = useState(false);

  const shareText = `"${quote.quoteText.replace(/\n/g, " ")}" — ${quote.villain}, ${quote.play}`;

  const handleShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          text: shareText,
          url: window.location.href,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-3 text-xs font-mono uppercase tracking-wider text-[var(--color-neon-yellow)] border-2 border-[var(--color-neon-yellow)]/30 hover:border-[var(--color-neon-yellow)] hover:bg-[var(--color-neon-yellow)]/10 transition-colors bg-transparent cursor-pointer"
    >
      {copied ? (
        "COPIED!"
      ) : (
        <>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Share
        </>
      )}
    </button>
  );
}
