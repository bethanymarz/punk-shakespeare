# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

**Villain of the Day** — a Next.js web app that displays a daily Shakespeare villain quote paired with AI-generated punk-style art. Built on top of a plain-text corpus of Shakespeare's complete works from the Folger Shakespeare Library.

## Project Structure

- `texts/` — 42 Shakespeare text files (plays, sonnets, poems) from the Folger Shakespeare Library
- `scripts/` — Offline data pipeline scripts (Node.js)
  - `extract-quotes.js` — Parses text files, extracts dialogue for 13 villains into JSON
  - `curate-quotes.js` — Uses Claude API to select 365 best quotes (requires `ANTHROPIC_API_KEY`)
  - `generate-art.js` — Uses Nano Banana 2 / Gemini API for punk art (requires `GOOGLE_AI_API_KEY`)
- `data/extracted/` — Per-villain speech JSON files (output of extract-quotes.js)
- `data/curated/quotes-365.json` — Final 365 curated quotes (output of curate-quotes.js)
- `public/art/` — Generated WebP images (output of generate-art.js)
- `src/` — Next.js app (TypeScript + Tailwind CSS v4)
  - `src/app/page.tsx` — Main daily villain page (client component, date-based quote selection)
  - `src/app/archive/page.tsx` — Grid view of all quotes
  - `src/components/` — VillainCard, ShareButton, Navigation
  - `src/lib/get-daily-quote.ts` — Date-based index logic with fallback sample data
  - `src/types/index.ts` — CuratedQuote interface

## Build and Run

```bash
npm install          # Install dependencies
npm run dev          # Dev server at localhost:3000
npm run build        # Production build
```

## Data Pipeline (run once, offline)

```bash
node scripts/extract-quotes.js                          # Parse texts → data/extracted/
ANTHROPIC_API_KEY=... node scripts/curate-quotes.js     # Curate 365 quotes → data/curated/
GOOGLE_AI_API_KEY=... node scripts/generate-art.js      # Generate art → public/art/
```

The app works with 5 built-in sample quotes when `data/curated/quotes-365.json` doesn't exist yet.

## Shakespeare Text File Format

All text files in `texts/` follow the naming convention `{title}_TXT_FolgerShakespeare.txt`:

- Files use `\r\n` line endings — parsers must handle this
- `ACT N` and `Scene N` headings are underlined with `=====`
- Stage directions appear in `[square brackets]`
- Speaker names are ALL CAPS, optionally followed by `, [stage direction]`
- Dialogue starts on the same line (after 2+ spaces) or on the next line
- Character list appears before `ACT 1` and should be skipped during extraction

## Design System

Punk villain Shakespeare aesthetic:
- Dark background (`bg-zinc-950`) with grain/noise texture overlay
- Fonts: `Space Mono` (monospace, primary) + `Cormorant Garamond` (serif, decorative)
- Per-villain neon accent colors (fuchsia for Iago, red for Richard III, violet for Lady Macbeth, etc.)
- Punk details: safety pin dividers, ransom-note style, torn-edge art overlays

## Key Dependencies

- `next` — App framework (App Router, static generation)
- `@anthropic-ai/sdk` — Claude API for quote curation
- `@google/generative-ai` — Gemini/Nano Banana 2 for art generation
- `sharp` — Image conversion to WebP

## Villains Extracted (13 total)

Iago, Lady Macbeth, Macbeth, Richard III, Claudius, Edmund, Shylock, Aaron, Caliban, Cassius, Tamora, Goneril, Regan
