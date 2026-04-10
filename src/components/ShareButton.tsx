"use client";

import type { CuratedQuote } from "../types";
import { useState, useRef } from "react";

async function fetchAsDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function ShareButton({ quote }: { quote: CuratedQuote }) {
  const [status, setStatus] = useState<"idle" | "generating">("idle");
  const cardRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const captureCard = async (): Promise<Blob | null> => {
    const { toBlob } = await import("html-to-image");

    // Convert art to data URL to avoid CORS issues during capture
    const artSrc =
      quote.imageUrl || (quote.imageFile ? `/art/${quote.imageFile}` : null);
    if (artSrc && imgRef.current) {
      try {
        const dataUrl = await fetchAsDataUrl(artSrc);
        imgRef.current.src = dataUrl;
        await new Promise<void>((resolve) => {
          const img = imgRef.current!;
          if (img.complete && img.naturalWidth > 0) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          }
        });
      } catch {
        // Proceed without image if fetch fails
      }
    }

    if (!cardRef.current) return null;
    return toBlob(cardRef.current, {
      pixelRatio: 2,
      backgroundColor: "#0a0a0a",
    });
  };

  const handleShare = async () => {
    setStatus("generating");
    try {
      const blob = await captureCard();
      if (!blob) return;

      const fileName = `punk-shakespeare-${quote.villain
        .toLowerCase()
        .replace(/\s+/g, "-")}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      // Mobile: native share with image + link (lets you text, AirDrop, etc.)
      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        navigator.canShare?.({ files: [file] })
      ) {
        try {
          await navigator.share({
            files: [file],
            text: `My Shakespeare villain foil is ${quote.villain}! Find yours:`,
            url: "https://punk-shakespeare.vercel.app/",
          });
          return;
        } catch (err) {
          if ((err as Error).name === "AbortError") return;
          // Fall through to download
        }
      }

      // Desktop fallback: download image
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setStatus("idle");
    }
  };

  const artSrc =
    quote.imageUrl || (quote.imageFile ? `/art/${quote.imageFile}` : null);

  return (
    <>
      {/* Hidden share card — captured as image */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          pointerEvents: "none",
        }}
      >
        <div
          ref={cardRef}
          style={{
            width: 540,
            padding: 32,
            backgroundColor: "#0a0a0a",
            color: "#fafafa",
            fontFamily: "'Space Mono', monospace",
            display: "flex",
            flexDirection: "column",
            border: "4px solid #ff2d95",
          }}
        >
          {/* Header */}
          <div
            style={{
              fontFamily: "'Permanent Marker', cursive",
              fontSize: 24,
              color: "#ff2d95",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            Punk Shakespeare
          </div>

          {/* Art */}
          {artSrc && (
            <div
              style={{
                width: "100%",
                aspectRatio: "1",
                overflow: "hidden",
                border: "3px solid #ff2d95",
                boxShadow: "4px 4px 0 #e6ff00",
                marginBottom: 20,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={artSrc}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>
          )}

          {/* Personalized framing */}
          {quote.userName && quote.userVirtue && (
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontFamily: "'Permanent Marker', cursive",
                  fontSize: 16,
                  color: "#e6ff00",
                  textTransform: "uppercase",
                }}
              >
                {quote.userName}, your virtue is {quote.userVirtue}.
              </div>
              <div
                style={{
                  fontFamily: "'Permanent Marker', cursive",
                  fontSize: 13,
                  color: "#71717a",
                  textTransform: "uppercase",
                  marginTop: 4,
                }}
              >
                Your foil is...
              </div>
            </div>
          )}

          {/* Villain name */}
          <div
            style={{
              fontFamily: "'Permanent Marker', cursive",
              fontSize: 32,
              color: "#e6ff00",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              transform: "rotate(-1deg)",
              marginBottom: 16,
            }}
          >
            {quote.villain}
          </div>

          {/* Foil explanation */}
          {quote.foilExplanation && (
            <div
              style={{
                fontSize: 13,
                fontStyle: "italic",
                color: "#a1a1aa",
                marginBottom: 12,
              }}
            >
              {quote.foilExplanation}
            </div>
          )}

          {/* Quote */}
          <div
            style={{
              fontSize: 15,
              lineHeight: 1.6,
              borderLeft: "4px solid #ff2d95",
              paddingLeft: 16,
              marginBottom: 16,
              whiteSpace: "pre-wrap",
            }}
          >
            {quote.quoteText}
          </div>

          {/* Attribution */}
          <div
            style={{
              fontSize: 13,
              color: "#71717a",
              marginBottom: 20,
            }}
          >
            <span style={{ color: "#a1a1aa" }}>{quote.play}</span>
            <span style={{ color: "#ff2d95", margin: "0 8px" }}>//</span>
            Act {quote.act}, Scene {quote.scene}
          </div>

          {/* Footer */}
          <div
            style={{
              borderTop: "2px solid #27272a",
              paddingTop: 16,
              fontSize: 12,
              color: "#71717a",
              textAlign: "center",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            punk-shakespeare.vercel.app
          </div>
        </div>
      </div>

      {/* Visible button */}
      <button
        onClick={handleShare}
        disabled={status === "generating"}
        className="flex items-center gap-2 px-4 py-3 text-xs font-mono uppercase tracking-wider text-[var(--color-neon-yellow)] border-2 border-[var(--color-neon-yellow)]/30 hover:border-[var(--color-neon-yellow)] hover:bg-[var(--color-neon-yellow)]/10 transition-colors bg-transparent cursor-pointer disabled:opacity-50"
      >
        {status === "generating" ? (
          <>
            <svg
              className="animate-spin"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            Creating...
          </>
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
    </>
  );
}
