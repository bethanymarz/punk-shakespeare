#!/usr/bin/env node

const Anthropic = require("@anthropic-ai/sdk");
const fs = require("fs");
const path = require("path");

const EXTRACTED_DIR = path.join(__dirname, "..", "data", "extracted");
const OUT_FILE = path.join(__dirname, "..", "data", "curated", "quotes-365.json");

// How many quotes to select per villain (~365 total)
const QUOTAS = {
  iago: 55,
  "richard-iii": 55,
  macbeth: 35,
  "lady-macbeth": 35,
  claudius: 25,
  cassius: 30,
  edmund: 25,
  shylock: 30,
  aaron: 20,
  caliban: 20,
  tamora: 15,
  goneril: 10,
  regan: 10,
};

const SYSTEM_PROMPT = `You are curating a "Villain of the Day" calendar — a web app that shows one Shakespeare villain quote per day, paired with AI-generated punk-rock art.

Your job: select the most compelling, quotable excerpts from a villain's speeches. Each excerpt should be:
- Self-contained (understandable without knowing the surrounding scene)
- 1-5 lines of verse or prose (not too long)
- Menacing, cunning, philosophical, darkly humorous, or emotionally powerful
- A mix of famous and lesser-known passages

For each quote, provide a vivid "artPrompt" describing a punk-rock portrait of the villain in the mood of that quote. The art style is: Elizabethan costume mashed with punk aesthetics — mohawks, safety pins, leather, torn ruffs, spiked crowns. Dark backgrounds, neon splashes, gritty screen-print texture. The artPrompt should focus on the villain's expression, pose, and symbolic details — NO text or lettering.

Return ONLY a JSON array (no markdown, no explanation). Each element:
{
  "quoteText": "exact text of the excerpt",
  "villain": "character name",
  "play": "play title",
  "act": 1,
  "scene": 1,
  "mood": "short mood/tone description",
  "artPrompt": "2-3 sentence visual description for the punk portrait",
  "themes": ["theme1", "theme2"]
}`;

async function curateVillain(client, villainFile, quota) {
  const speeches = JSON.parse(
    fs.readFileSync(path.join(EXTRACTED_DIR, villainFile), "utf-8")
  );

  if (speeches.length === 0) {
    console.log(`  Skipping ${villainFile} — no speeches`);
    return [];
  }

  const villainName = speeches[0].villain;
  const playName = speeches[0].play;

  console.log(
    `  Curating ${villainName} (${playName}): selecting ${quota} from ${speeches.length} speeches...`
  );

  const userPrompt = `Below are all ${speeches.length} speeches by ${villainName} from "${playName}". Select exactly ${quota} of the most compelling, quotable excerpts.

SPEECHES:
${JSON.stringify(
  speeches.map((s) => ({
    act: s.act,
    scene: s.scene,
    text: s.fullText,
    lineCount: s.lineCount,
  })),
  null,
  2
)}`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0].text;

  // Parse JSON from response (handle possible markdown wrapping)
  let jsonText = text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (jsonMatch) jsonText = jsonMatch[0];

  try {
    const quotes = JSON.parse(jsonText);
    console.log(`    Got ${quotes.length} quotes`);
    return quotes;
  } catch (e) {
    console.error(`    ERROR parsing JSON for ${villainName}:`, e.message);
    // Save raw response for debugging
    const debugFile = path.join(
      EXTRACTED_DIR,
      `_debug_${villainFile.replace(".json", "")}.txt`
    );
    fs.writeFileSync(debugFile, text);
    console.error(`    Raw response saved to ${debugFile}`);
    return [];
  }
}

// Seeded shuffle (Fisher-Yates with simple seed)
function seededShuffle(array, seed) {
  const arr = [...array];
  let s = seed;
  function nextRandom() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(nextRandom() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      "Error: ANTHROPIC_API_KEY environment variable is required."
    );
    console.error("  export ANTHROPIC_API_KEY=sk-ant-...");
    process.exit(1);
  }

  const client = new Anthropic();

  console.log("Curating villain quotes with Claude...\n");

  const allQuotes = [];

  for (const [fileKey, quota] of Object.entries(QUOTAS)) {
    const fileName = `${fileKey}.json`;
    const filePath = path.join(EXTRACTED_DIR, fileName);

    if (!fs.existsSync(filePath)) {
      console.log(`  WARNING: ${fileName} not found, skipping`);
      continue;
    }

    const quotes = await curateVillain(client, fileName, quota);
    allQuotes.push(...quotes);
  }

  console.log(`\nTotal curated quotes: ${allQuotes.length}`);

  // Shuffle so adjacent days show different villains
  const shuffled = seededShuffle(allQuotes, 42);

  // Add day index and image filename
  const final = shuffled.map((q, i) => ({
    dayIndex: i,
    ...q,
    imageFile: `day-${String(i + 1).padStart(3, "0")}.webp`,
  }));

  fs.writeFileSync(OUT_FILE, JSON.stringify(final, null, 2));
  console.log(`\nWrote ${final.length} quotes to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
