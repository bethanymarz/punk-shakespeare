"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { ShareButton } from "../components/ShareButton";
import { SHAKESPEAREAN_INSULTS } from "../lib/insults";
import type { CuratedQuote } from "../types";

function RotatingInsults() {
  const pickRandom = useCallback(() => Math.floor(Math.random() * SHAKESPEAREAN_INSULTS.length), []);
  const [index, setIndex] = useState(pickRandom);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex(pickRandom());
        setFade(true);
      }, 400);
    }, 2800);
    return () => clearInterval(interval);
  }, [pickRandom]);

  return (
    <div className="h-8 flex items-center justify-center overflow-hidden">
      <p
        className={`font-mono text-sm md:text-base text-zinc-500 italic text-center transition-opacity duration-400 ${fade ? "opacity-100" : "opacity-0"}`}
      >
        &ldquo;{SHAKESPEAREAN_INSULTS[index]}&rdquo;
      </p>
    </div>
  );
}

export default function Home() {
  const [quote, setQuote] = useState<CuratedQuote | null>(null);
  const [gallery, setGallery] = useState<CuratedQuote[]>([]);
  const [generating, setGenerating] = useState(false);
  const [showForm, setShowForm] = useState(true);
  const [name, setName] = useState("");
  const [virtue, setVirtue] = useState("");

  const loadGallery = useCallback(async () => {
    try {
      const res = await fetch("/api/gallery");
      if (res.ok) {
        const data = await res.json();
        setGallery(data);
      }
    } catch (err) {
      console.error("Failed to load gallery:", err);
    }
  }, []);

  useEffect(() => {
    loadGallery();
  }, [loadGallery]);

  const generateNew = async () => {
    setGenerating(true);
    setShowForm(false);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), virtue: virtue.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Generation failed");
      }
      const data = await res.json();
      setQuote(data);
      loadGallery();
    } catch (err) {
      console.error("Generation error:", err);
      setShowForm(true);
    } finally {
      setGenerating(false);
    }
  };

  const summonAnother = () => {
    setQuote(null);
    setVirtue("");
    setShowForm(true);
  };

  const showFromGallery = (item: CuratedQuote) => {
    setQuote(item);
    setShowForm(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen">
      {/* Hero header */}
      <header className="px-6 pt-8 pb-4 stripe-bg border-b-2 border-[var(--color-neon-pink)]">
        <div className="flex items-center justify-center gap-5 md:gap-8">
          <Image
            src="/shakes-skull.png"
            alt="Punk Shakespeare skull"
            width={240}
            height={280}
            className="-rotate-[20deg]"
            priority
          />
          <div className="text-center md:text-left">
            <h1 className="punk-title text-5xl md:text-7xl text-[var(--color-neon-pink)]">
              Punk Shakespeare
            </h1>
            <p className="font-mono text-xs md:text-sm text-[var(--color-neon-yellow)] mt-2 tracking-[0.3em] uppercase">
              Name thy virtue — meet thy villain
            </p>
          </div>
        </div>
      </header>

      {/* Main content — quote + art side by side, no scroll needed */}
      <section className="px-4 md:px-8 py-8 max-w-7xl mx-auto">
        {showForm && !generating ? (
          /* Name & virtue form */
          <div className="flex flex-col items-center justify-center py-20 max-w-md mx-auto">
            <p className="punk-title text-2xl md:text-4xl text-[var(--color-neon-pink)] mb-8 text-center">
              Who dares summon a villain?
            </p>

            <div className="w-full space-y-4">
              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-zinc-300 mb-1 block">
                  Your name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  maxLength={50}
                  className="w-full bg-zinc-950 border-2 border-[var(--color-neon-pink)]/50 focus:border-[var(--color-neon-pink)] text-zinc-100 font-mono px-4 py-3 outline-none placeholder-zinc-500"
                />
              </div>

              <div>
                <label className="font-mono text-xs uppercase tracking-wider text-zinc-300 mb-1 block">
                  Your greatest virtue
                </label>
                <input
                  type="text"
                  value={virtue}
                  onChange={(e) => setVirtue(e.target.value)}
                  placeholder="Honesty, mercy, loyalty, courage..."
                  maxLength={100}
                  className="w-full bg-zinc-950 border-2 border-[var(--color-neon-yellow)]/50 focus:border-[var(--color-neon-yellow)] text-zinc-100 font-mono px-4 py-3 outline-none placeholder-zinc-500"
                />
              </div>

              <button
                onClick={generateNew}
                disabled={!name.trim() || !virtue.trim()}
                className="punk-btn w-full px-8 py-4 text-xl bg-[var(--color-neon-pink)] text-black font-bold cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed mt-4"
              >
                Find your foil
              </button>
            </div>
          </div>
        ) : generating && !quote ? (
          /* First generation loading — with rotating insults */
          <div className="flex flex-col items-center justify-center py-20 gap-8">
            <Image
              src="/pink-quill-1.png"
              alt="Punk quill"
              width={300}
              height={180}
              className="quill-scrawl opacity-80"
              priority
            />
            <div className="punk-title text-2xl md:text-3xl text-[var(--color-neon-pink)] animate-pulse">
              Finding your foil...
            </div>
            <RotatingInsults />
          </div>
        ) : quote ? (
          /* Active quote display — art left, quote right on desktop */
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-6 md:gap-10 items-start">
            {/* Art */}
            <div className="relative aspect-square w-full max-w-lg mx-auto md:mx-0 overflow-hidden border-4 border-[var(--color-neon-pink)] shadow-[6px_6px_0_var(--color-neon-yellow)]">
              {(quote.imageUrl || quote.imageFile) && (
                <Image
                  src={quote.imageUrl || `/art/${quote.imageFile}`}
                  alt={`Punk portrait of ${quote.villain}`}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 45vw"
                  unoptimized={!!quote.imageUrl}
                />
              )}
            </div>

            {/* Quote + info */}
            <div className="flex flex-col justify-center">
              {/* Personalized framing */}
              {quote.userName && quote.userVirtue && (
                <div className="mb-4">
                  <p className="punk-title text-lg md:text-xl text-[var(--color-neon-yellow)]">
                    {quote.userName}, your virtue is {quote.userVirtue}.
                  </p>
                  <p className="punk-title text-sm text-zinc-500 mt-1">
                    Your foil is...
                  </p>
                </div>
              )}

              {/* Villain name */}
              <h2 className="punk-title text-3xl md:text-5xl text-[var(--color-neon-yellow)] mb-4 -rotate-1">
                {quote.villain}
              </h2>

              {/* Foil explanation */}
              {quote.foilExplanation && (
                <p className="font-mono text-sm text-zinc-400 italic mb-4">
                  {quote.foilExplanation}
                </p>
              )}

              {/* Quote text */}
              <blockquote className="text-lg md:text-xl font-mono leading-relaxed text-zinc-100 mb-5 pl-4 border-l-4 border-[var(--color-neon-pink)]">
                {quote.quoteText.split("\n").map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < quote.quoteText.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </blockquote>

              {/* Attribution */}
              <div className="font-mono text-sm text-zinc-500 mb-2">
                <em className="not-italic text-zinc-400">{quote.play}</em>
                <span className="mx-2 text-[var(--color-neon-pink)]">//</span>
                Act {quote.act}, Scene {quote.scene}
              </div>
              {quote.sourceUrl && (
                <a
                  href={quote.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-[var(--color-neon-pink)]/70 hover:text-[var(--color-neon-pink)] underline mb-5 inline-block transition-colors"
                >
                  Read the full scene at the Folger Shakespeare Library &rarr;
                </a>
              )}
              {!quote.sourceUrl && <div className="mb-3" />}

              {/* Themes */}
              <div className="flex flex-wrap gap-2 mb-6">
                {quote.themes.map((theme) => (
                  <span
                    key={theme}
                    className="px-3 py-1 text-xs font-mono uppercase tracking-wider text-[var(--color-neon-yellow)] border border-[var(--color-neon-yellow)]/30 bg-[var(--color-neon-yellow)]/5"
                  >
                    {theme}
                  </span>
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-4 flex-wrap">
                {generating ? (
                  <div className="flex items-center gap-3 punk-title text-lg text-[var(--color-neon-pink)] animate-pulse">
                    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    Conjuring...
                  </div>
                ) : (
                  <button
                    onClick={summonAnother}
                    className="punk-btn px-6 py-3 text-base bg-[var(--color-neon-pink)] text-black font-bold cursor-pointer"
                  >
                    Summon another foil
                  </button>
                )}
                <ShareButton quote={quote} />
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Gallery of all generated punks (from Supabase) */}
      {gallery.length > 0 && (
        <section className="px-4 md:px-8 py-10 max-w-7xl mx-auto border-t-2 border-zinc-800">
          <h3 className="punk-title text-2xl md:text-3xl text-[var(--color-neon-yellow)] mb-6">
            The Rogues&apos; Gallery
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {gallery.map((item, i) => (
              <button
                key={`${item.villain}-${i}`}
                onClick={() => showFromGallery(item)}
                className="gallery-card border-2 border-zinc-800 bg-zinc-950 text-left cursor-pointer overflow-hidden"
              >
                <div className="relative aspect-square">
                  {(item.imageUrl || item.imageFile) && (
                    <Image
                      src={item.imageUrl || `/art/${item.imageFile}`}
                      alt={`Punk portrait of ${item.villain}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      unoptimized={!!item.imageUrl}
                    />
                  )}
                </div>
                <div className="p-3">
                  <p className="punk-title text-sm text-[var(--color-neon-pink)] truncate">
                    {item.villain}
                  </p>
                  <p className="font-mono text-xs text-zinc-600 truncate mt-1">
                    {item.play}
                  </p>
                  {item.userTitle && (
                    <p className="font-mono text-xs text-[var(--color-neon-yellow)]/70 truncate mt-1 italic">
                      Summoned by {item.userTitle}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="px-6 py-6 text-center border-t border-zinc-900">
        <p className="font-mono text-xs text-zinc-500">
          Quotes from the <a href="https://www.folger.edu/explore/shakespeares-works/download/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--color-neon-pink)] transition-colors">Folger Shakespeare Library</a> // Art by Nano Banana // Punk by nature
        </p>
        <p className="font-mono text-xs text-zinc-400 mt-2">
          Built by <a href="https://www.linkedin.com/in/bethanymarz/" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--color-neon-pink)] transition-colors">Bethany Crystal</a>
          <span className="mx-2 text-zinc-600">|</span>
          <a href="https://github.com/bethanymarz/punk-shakespeare" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--color-neon-pink)] transition-colors">GitHub</a>
        </p>
      </footer>
    </main>
  );
}
