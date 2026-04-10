#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const RAW_DIR = path.join(__dirname, "..", "texts");
const OUT_DIR = path.join(__dirname, "..", "data", "extracted");

// Villain definitions: who to extract, from which file, and how to match them
const VILLAINS = [
  // --- Original 13 ---
  { villain: "Iago", play: "Othello", file: "othello_TXT_FolgerShakespeare.txt", token: "IAGO" },
  { villain: "Lady Macbeth", play: "Macbeth", file: "macbeth_TXT_FolgerShakespeare.txt", token: "LADY MACBETH" },
  { villain: "Macbeth", play: "Macbeth", file: "macbeth_TXT_FolgerShakespeare.txt", token: "MACBETH", exclude: ["LADY MACBETH"] },
  { villain: "Richard III", play: "Richard III", file: "richard-iii_TXT_FolgerShakespeare.txt", token: "RICHARD" },
  { villain: "Claudius", play: "Hamlet", file: "hamlet_TXT_FolgerShakespeare.txt", token: "KING", exclude: ["PLAYER KING"] },
  { villain: "Edmund", play: "King Lear", file: "king-lear_TXT_FolgerShakespeare.txt", token: "EDMUND" },
  { villain: "Shylock", play: "The Merchant of Venice", file: "the-merchant-of-venice_TXT_FolgerShakespeare.txt", token: "SHYLOCK" },
  { villain: "Aaron", play: "Titus Andronicus", file: "titus-andronicus_TXT_FolgerShakespeare.txt", token: "AARON" },
  { villain: "Caliban", play: "The Tempest", file: "the-tempest_TXT_FolgerShakespeare.txt", token: "CALIBAN" },
  { villain: "Cassius", play: "Julius Caesar", file: "julius-caesar_TXT_FolgerShakespeare.txt", token: "CASSIUS" },
  { villain: "Tamora", play: "Titus Andronicus", file: "titus-andronicus_TXT_FolgerShakespeare.txt", token: "TAMORA" },
  { villain: "Goneril", play: "King Lear", file: "king-lear_TXT_FolgerShakespeare.txt", token: "GONERIL" },
  { villain: "Regan", play: "King Lear", file: "king-lear_TXT_FolgerShakespeare.txt", token: "REGAN" },
  // --- Tier 1: Major villains ---
  { villain: "Angelo", play: "Measure for Measure", file: "measure-for-measure_TXT_FolgerShakespeare.txt", token: "ANGELO" },
  { villain: "Iachimo", play: "Cymbeline", file: "cymbeline_TXT_FolgerShakespeare.txt", token: "IACHIMO" },
  { villain: "Leontes", play: "The Winter's Tale", file: "the-winters-tale_TXT_FolgerShakespeare.txt", token: "LEONTES" },
  { villain: "Proteus", play: "The Two Gentlemen of Verona", file: "the-two-gentlemen-of-verona_TXT_FolgerShakespeare.txt", token: "PROTEUS" },
  { villain: "Don John", play: "Much Ado About Nothing", file: "much-ado-about-nothing_TXT_FolgerShakespeare.txt", token: "DON JOHN" },
  { villain: "Cloten", play: "Cymbeline", file: "cymbeline_TXT_FolgerShakespeare.txt", token: "CLOTEN" },
  { villain: "Hotspur", play: "Henry IV, Part 1", file: "henry-iv-part-1_TXT_FolgerShakespeare.txt", token: "HOTSPUR" },
  { villain: "Cardinal Wolsey", play: "Henry VIII", file: "henry-viii_TXT_FolgerShakespeare.txt", token: "WOLSEY" },
  { villain: "Aufidius", play: "Coriolanus", file: "coriolanus_TXT_FolgerShakespeare.txt", token: "AUFIDIUS" },
  { villain: "Queen Margaret", play: "Henry VI, Part 2", file: "henry-vi-part-2_TXT_FolgerShakespeare.txt", token: "QUEEN MARGARET" },
  { villain: "Thersites", play: "Troilus and Cressida", file: "troilus-and-cressida_TXT_FolgerShakespeare.txt", token: "THERSITES" },
  { villain: "Timon", play: "Timon of Athens", file: "timon-of-athens_TXT_FolgerShakespeare.txt", token: "TIMON" },
  // --- Tier 2: Compelling anti-virtue characters ---
  { villain: "Falstaff", play: "Henry IV, Part 1", file: "henry-iv-part-1_TXT_FolgerShakespeare.txt", token: "FALSTAFF" },
  { villain: "Petruchio", play: "The Taming of the Shrew", file: "the-taming-of-the-shrew_TXT_FolgerShakespeare.txt", token: "PETRUCHIO" },
  { villain: "Malvolio", play: "Twelfth Night", file: "twelfth-night_TXT_FolgerShakespeare.txt", token: "MALVOLIO" },
  { villain: "Bolingbroke", play: "Richard II", file: "richard-ii_TXT_FolgerShakespeare.txt", token: "BOLINGBROKE" },
  { villain: "Oberon", play: "A Midsummer Night's Dream", file: "a-midsummer-nights-dream_TXT_FolgerShakespeare.txt", token: "OBERON" },
  { villain: "Suffolk", play: "Henry VI, Part 2", file: "henry-vi-part-2_TXT_FolgerShakespeare.txt", token: "SUFFOLK", exclude: ["QUEEN MARGARET"] },
  { villain: "Joan La Pucelle", play: "Henry VI, Part 1", file: "henry-vi-part-1_TXT_FolgerShakespeare.txt", token: "PUCELLE" },
  // --- Tier 3: Smaller roles, iconic villainy ---
  { villain: "Tybalt", play: "Romeo and Juliet", file: "romeo-and-juliet_TXT_FolgerShakespeare.txt", token: "TYBALT" },
  { villain: "Dionyza", play: "Pericles", file: "pericles_TXT_FolgerShakespeare.txt", token: "DIONYZA" },
  { villain: "Duke Frederick", play: "As You Like It", file: "as-you-like-it_TXT_FolgerShakespeare.txt", token: "DUKE FREDERICK" },
  { villain: "Bertram", play: "All's Well That Ends Well", file: "alls-well-that-ends-well_TXT_FolgerShakespeare.txt", token: "BERTRAM" },
  { villain: "Antiochus", play: "Pericles", file: "pericles_TXT_FolgerShakespeare.txt", token: "ANTIOCHUS" },
  { villain: "The Queen", play: "Cymbeline", file: "cymbeline_TXT_FolgerShakespeare.txt", token: "QUEEN", exclude: ["QUEEN MARGARET"] },
  // --- Additional female characters ---
  { villain: "Cleopatra", play: "Antony and Cleopatra", file: "antony-and-cleopatra_TXT_FolgerShakespeare.txt", token: "CLEOPATRA" },
  { villain: "Volumnia", play: "Coriolanus", file: "coriolanus_TXT_FolgerShakespeare.txt", token: "VOLUMNIA" },
  { villain: "Cressida", play: "Troilus and Cressida", file: "troilus-and-cressida_TXT_FolgerShakespeare.txt", token: "CRESSIDA" },
];

function stripStageDirections(text) {
  return text.replace(/\[.*?\]/g, "").replace(/\s+/g, " ").trim();
}

// Detect if a line starts a new character's speech.
// Returns { speaker, inlineDialogue } or null.
function parseSpeakerLine(line) {
  // Pattern 1: NAME  dialogue (inline, 2+ spaces separating)
  // Name is uppercase letters and spaces only — comma is NOT part of the name
  // (it separates name from stage direction like "MACBETH, [aside]")
  const inlineMatch = line.match(
    /^([A-Z][A-Z ]*[A-Z])(?:,\s*\[.*?\])?\s{2,}(.+)$/
  );
  if (inlineMatch) {
    return { speaker: inlineMatch[1].trim(), inlineDialogue: inlineMatch[2] };
  }

  // Pattern 2: NAME alone on a line (optionally with stage direction)
  const nameOnlyMatch = line.match(
    /^([A-Z][A-Z ]*[A-Z])(?:,\s*\[.*?\])?\s*$/
  );
  if (nameOnlyMatch) {
    return { speaker: nameOnlyMatch[1].trim(), inlineDialogue: null };
  }

  return null;
}

function isSpeakerMatch(speaker, token, exclude) {
  // Check exclusions first (e.g., LADY MACBETH should not match MACBETH)
  if (exclude) {
    for (const ex of exclude) {
      if (speaker === ex || speaker.startsWith(ex + " ")) return false;
    }
  }
  return speaker === token || speaker.startsWith(token + ",");
}

function extractSpeeches(filePath, villainDef) {
  const text = fs.readFileSync(filePath, "utf-8").replace(/\r\n/g, "\n");
  const lines = text.split("\n");
  const speeches = [];

  let currentAct = 0;
  let currentScene = 0;
  let pastHeader = false; // skip character list before ACT 1
  let currentSpeech = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track act/scene
    const actMatch = line.match(/^ACT (\d+)/);
    if (actMatch) {
      if (currentSpeech) {
        speeches.push(currentSpeech);
        currentSpeech = null;
      }
      currentAct = parseInt(actMatch[1]);
      pastHeader = true;
      continue;
    }
    const sceneMatch = line.match(/^Scene (\d+)/);
    if (sceneMatch) {
      if (currentSpeech) {
        speeches.push(currentSpeech);
        currentSpeech = null;
      }
      currentScene = parseInt(sceneMatch[1]);
      continue;
    }

    if (!pastHeader) continue;

    // Skip separator lines
    if (/^=+$/.test(line)) continue;

    // Check if this is a new speaker line
    const speaker = parseSpeakerLine(line);
    if (speaker) {
      // Save previous speech if it was our villain's
      if (currentSpeech) {
        speeches.push(currentSpeech);
        currentSpeech = null;
      }

      if (
        isSpeakerMatch(
          speaker.speaker,
          villainDef.token,
          villainDef.exclude
        )
      ) {
        const firstLine = speaker.inlineDialogue
          ? stripStageDirections(speaker.inlineDialogue)
          : null;
        currentSpeech = {
          villain: villainDef.villain,
          play: villainDef.play,
          act: currentAct,
          scene: currentScene,
          lines: firstLine ? [firstLine] : [],
          startLine: i + 1,
        };
      }
      continue;
    }

    // Stage direction on its own line — don't end the speech, just skip it
    if (/^\[/.test(line.trim())) continue;

    // Blank line ends a speech
    if (line.trim() === "") {
      if (currentSpeech) {
        speeches.push(currentSpeech);
        currentSpeech = null;
      }
      continue;
    }

    // Continuation line
    if (currentSpeech) {
      const cleaned = stripStageDirections(line.trim());
      if (cleaned) currentSpeech.lines.push(cleaned);
    }
  }

  // Don't forget the last speech
  if (currentSpeech) speeches.push(currentSpeech);

  // Build fullText and lineCount
  return speeches
    .filter((s) => s.lines.length > 0)
    .map((s) => ({
      ...s,
      fullText: s.lines.join(" "),
      lineCount: s.lines.length,
    }));
}

// Main
console.log("Extracting villain dialogue...\n");

let totalSpeeches = 0;

for (const v of VILLAINS) {
  const filePath = path.join(RAW_DIR, v.file);
  const speeches = extractSpeeches(filePath, v);
  totalSpeeches += speeches.length;

  const outFile = path.join(
    OUT_DIR,
    `${v.villain.toLowerCase().replace(/\s+/g, "-")}.json`
  );
  fs.writeFileSync(outFile, JSON.stringify(speeches, null, 2));
  console.log(`  ${v.villain} (${v.play}): ${speeches.length} speeches`);
}

console.log(`\nTotal: ${totalSpeeches} speeches extracted.`);
console.log(`Output written to ${OUT_DIR}`);
