import type { CuratedQuote } from "../types";

// In production, this imports the curated JSON.
// For dev/demo, we use sample data if the file doesn't exist.
let quotesData: CuratedQuote[];

try {
  quotesData = require("../../data/curated/quotes-365.json");
} catch {
  // Sample data for development before curation is run
  quotesData = [
    {
      dayIndex: 0,
      quoteText:
        "I am not what I am.",
      villain: "Iago",
      play: "Othello",
      act: 1,
      scene: 1,
      mood: "deceptive self-revelation",
      artPrompt: "A punk Iago with a split face",
      themes: ["deception", "identity"],
      imageFile: "day-001.webp",
    },
    {
      dayIndex: 1,
      quoteText:
        "Now is the winter of our discontent\nMade glorious summer by this son of York.",
      villain: "Richard III",
      play: "Richard III",
      act: 1,
      scene: 1,
      mood: "bitter ambition",
      artPrompt: "A hunched punk Richard with a twisted crown",
      themes: ["ambition", "resentment"],
      imageFile: "day-002.webp",
    },
    {
      dayIndex: 2,
      quoteText:
        "Come, you spirits\nThat tend on mortal thoughts, unsex me here,\nAnd fill me from the crown to the toe top-full\nOf direst cruelty.",
      villain: "Lady Macbeth",
      play: "Macbeth",
      act: 1,
      scene: 5,
      mood: "dark invocation",
      artPrompt: "A fierce punk Lady Macbeth summoning dark spirits",
      themes: ["power", "ambition", "gender"],
      imageFile: "day-003.webp",
    },
    {
      dayIndex: 3,
      quoteText:
        "O, my offense is rank, it smells to heaven;\nIt hath the primal eldest curse upon 't,\nA brother's murder.",
      villain: "Claudius",
      play: "Hamlet",
      act: 3,
      scene: 3,
      mood: "guilty confession",
      artPrompt: "A tormented punk Claudius kneeling in neon candlelight",
      themes: ["guilt", "murder", "religion"],
      imageFile: "day-004.webp",
    },
    {
      dayIndex: 4,
      quoteText:
        "Thou, Nature, art my goddess. To thy law\nMy services are bound.",
      villain: "Edmund",
      play: "King Lear",
      act: 1,
      scene: 2,
      mood: "rebellious defiance",
      artPrompt:
        "A sneering punk Edmund raising a fist to the sky, bastard and proud",
      themes: ["nature", "rebellion", "illegitimacy"],
      imageFile: "day-005.webp",
    },
  ];
}

// Epoch: the launch date. Change this to your actual launch date.
const EPOCH = new Date("2026-05-01T00:00:00");

export function getDailyQuote(date: Date = new Date()): CuratedQuote {
  const msPerDay = 86400000;
  const daysSinceEpoch = Math.floor(
    (date.getTime() - EPOCH.getTime()) / msPerDay
  );
  const index =
    ((daysSinceEpoch % quotesData.length) + quotesData.length) %
    quotesData.length;
  return quotesData[index];
}

export function getQuoteByIndex(index: number): CuratedQuote {
  const safeIndex =
    ((index % quotesData.length) + quotesData.length) % quotesData.length;
  return quotesData[safeIndex];
}

export function getAllQuotes(): CuratedQuote[] {
  return quotesData;
}

export function getTotalQuotes(): number {
  return quotesData.length;
}
