#!/usr/bin/env node

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

// Load .env.local
const envPath = path.join(__dirname, "..", ".env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}
const sharp = require("sharp");

const QUOTES_FILE = path.join(
  __dirname,
  "..",
  "data",
  "curated",
  "quotes-365.json"
);
const ART_DIR = path.join(__dirname, "..", "public", "art");

const STYLE_PREFIX = `A punk rock portrait of a Shakespeare villain. Bold graphic style mixing Elizabethan costume with punk aesthetics — mohawks, safety pins, leather, studs, torn ruffs, spiked crowns. High contrast, gritty texture, screen-print and zine aesthetic with splashes of neon color against dark backgrounds. No text, no lettering, no words in the image.`;

// Delay between requests to respect rate limits
const DELAY_MS = 3000;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateImage(model, quote, index) {
  const outFile = path.join(ART_DIR, quote.imageFile);

  // Skip if already generated
  if (fs.existsSync(outFile)) {
    console.log(`  [${index + 1}] Skipping ${quote.imageFile} (exists)`);
    return true;
  }

  const prompt = `${STYLE_PREFIX} ${quote.artPrompt}`;

  try {
    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseModalities: ["image"],
      },
    });

    // Extract image data from response
    const parts = response.response.candidates[0].content.parts;
    const imagePart = parts.find((p) => p.inlineData);

    if (!imagePart) {
      console.error(
        `  [${index + 1}] No image returned for ${quote.villain} - "${quote.quoteText.slice(0, 40)}..."`
      );
      return false;
    }

    const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");

    // Convert to 800x800 WebP
    await sharp(imageBuffer)
      .resize(800, 800, { fit: "cover" })
      .webp({ quality: 75 })
      .toFile(outFile);

    console.log(
      `  [${index + 1}] Generated ${quote.imageFile} — ${quote.villain}`
    );
    return true;
  } catch (err) {
    console.error(
      `  [${index + 1}] ERROR for ${quote.villain}: ${err.message}`
    );
    return false;
  }
}

async function main() {
  const apiKey = process.env.NANO_BANANA_API_KEY || process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    console.error(
      "Error: NANO_BANANA_API_KEY or GOOGLE_AI_API_KEY environment variable is required."
    );
    console.error("  Get one at https://ai.google.dev/");
    process.exit(1);
  }

  if (!fs.existsSync(QUOTES_FILE)) {
    console.error(`Error: ${QUOTES_FILE} not found.`);
    console.error("  Run scripts/curate-quotes.js first.");
    process.exit(1);
  }

  const quotes = JSON.parse(fs.readFileSync(QUOTES_FILE, "utf-8"));
  console.log(`Generating art for ${quotes.length} quotes...\n`);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash-image", // Nano Banana
  });

  let success = 0;
  let failed = 0;

  for (let i = 0; i < quotes.length; i++) {
    const ok = await generateImage(model, quotes[i], i);
    if (ok) success++;
    else failed++;

    // Rate limiting
    if (i < quotes.length - 1) await sleep(DELAY_MS);
  }

  console.log(
    `\nDone! ${success} generated, ${failed} failed out of ${quotes.length} total.`
  );

  if (failed > 0) {
    console.log("Re-run this script to retry failed images.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
