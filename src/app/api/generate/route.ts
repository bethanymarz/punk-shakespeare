import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";
import sharp from "sharp";

export const maxDuration = 60;

const EXTRACTED_DIR = path.join(process.cwd(), "data", "extracted");

const FEMALE_VILLAINS = [
  "lady-macbeth", "tamora", "goneril", "regan", "queen-margaret",
  "joan-la-pucelle", "dionyza", "the-queen", "cleopatra", "volumnia", "cressida",
];

const MALE_VILLAINS = [
  "iago", "macbeth", "richard-iii", "claudius", "edmund",
  "shylock", "aaron", "caliban", "cassius",
  "angelo", "iachimo", "leontes", "proteus", "don-john", "cloten",
  "hotspur", "cardinal-wolsey", "aufidius", "thersites",
  "timon", "falstaff", "petruchio", "malvolio", "bolingbroke", "oberon",
  "suffolk", "tybalt", "duke-frederick",
  "bertram", "antiochus",
];

const VILLAINS = [...FEMALE_VILLAINS, ...MALE_VILLAINS];

const VILLAIN_DISPLAY: Record<string, string> = {
  "iago": "Iago (Othello) — master deceiver, manipulator, false friend",
  "lady-macbeth": "Lady Macbeth (Macbeth) — ruthless ambition, guilt, cruelty",
  "macbeth": "Macbeth (Macbeth) — ambition corrupting honor, moral collapse",
  "richard-iii": "Richard III (Richard III) — tyranny, cunning, seduction of power",
  "claudius": "Claudius (Hamlet) — treachery, fratricide, hollow kingship",
  "edmund": "Edmund (King Lear) — betrayal of family, envy, illegitimacy weaponized",
  "shylock": "Shylock (The Merchant of Venice) — vengeance, mercilessness, wounded pride",
  "aaron": "Aaron the Moor (Titus Andronicus) — pure malice, chaos, gleeful evil",
  "caliban": "Caliban (The Tempest) — resentment, savagery, rebellion against order",
  "cassius": "Cassius (Julius Caesar) — envy, conspiracy, manipulation of idealists",
  "tamora": "Tamora (Titus Andronicus) — revenge, cruelty, maternal rage twisted dark",
  "goneril": "Goneril (King Lear) — ingratitude, betrayal of a parent, cold ambition",
  "regan": "Regan (King Lear) — sadism, filial betrayal, cruelty without remorse",
  "angelo": "Angelo (Measure for Measure) — hypocrisy, corruption of justice, abuse of power",
  "iachimo": "Iachimo (Cymbeline) — deceit, violation of trust, predatory wagers",
  "leontes": "Leontes (The Winter's Tale) — groundless jealousy, destruction of family, paranoia",
  "proteus": "Proteus (The Two Gentlemen of Verona) — betrayal of friendship, disloyalty in love",
  "don-john": "Don John (Much Ado About Nothing) — spite, sabotage of joy, villainy for its own sake",
  "cloten": "Cloten (Cymbeline) — entitlement, crudeness, violence born of wounded ego",
  "hotspur": "Hotspur (Henry IV Part 1) — reckless glory-seeking, hot-headed rebellion, vanity of honor",
  "cardinal-wolsey": "Cardinal Wolsey (Henry VIII) — greed, abuse of religious office, lust for power",
  "aufidius": "Aufidius (Coriolanus) — treacherous rivalry, assassination of allies, pragmatic betrayal",
  "queen-margaret": "Queen Margaret (Henry VI) — ruthless vengeance, cruelty, mercilessness in war",
  "thersites": "Thersites (Troilus and Cressida) — cynicism, contempt for all, foul-mouthed nihilism",
  "timon": "Timon (Timon of Athens) — misanthropy, generosity curdled to hatred, cursing humanity",
  "falstaff": "Falstaff (Henry IV Part 1) — cowardice, gluttony, corruption of youth, charming dishonesty",
  "petruchio": "Petruchio (The Taming of the Shrew) — domination, psychological control, breaking a spirit",
  "malvolio": "Malvolio (Twelfth Night) — vanity, self-importance, delusions of grandeur",
  "bolingbroke": "Bolingbroke (Richard II) — usurpation, political ambition disguised as justice",
  "oberon": "Oberon (A Midsummer Night's Dream) — magical cruelty, humiliation of a spouse, domestic tyranny",
  "suffolk": "Suffolk (Henry VI Part 2) — adultery, political murder, lust above duty",
  "joan-la-pucelle": "Joan La Pucelle (Henry VI Part 1) — sorcery, deception, dark power",
  "tybalt": "Tybalt (Romeo and Juliet) — aggression, hatred, violence that destroys love",
  "dionyza": "Dionyza (Pericles) — jealousy, betrayal of trust, attempted murder of a ward",
  "duke-frederick": "Duke Frederick (As You Like It) — usurpation, banishment, threatened by goodness",
  "bertram": "Bertram (All's Well That Ends Well) — inconstancy, broken promises, dishonorable flight",
  "antiochus": "Antiochus (Pericles) — incest, tyranny, the darkest corruption of paternal love",
  "the-queen": "The Queen (Cymbeline) — poisoning, wicked stepmother, false nurture",
  "cleopatra": "Cleopatra (Antony and Cleopatra) — seduction, manipulation, intoxicating self-destruction",
  "volumnia": "Volumnia (Coriolanus) — domineering motherhood, weaponized guilt, glory over humanity",
  "cressida": "Cressida (Troilus and Cressida) — infidelity, broken vows, betrayal of love",
};

// Character-specific visual details from the plays for unique art generation
const VILLAIN_VISUAL: Record<string, string> = {
  "iago": "Venetian military officer, standard-bearer's uniform, deceptively trustworthy face hiding pure malice",
  "lady-macbeth": "Bloodstained hands she cannot wash clean, sleepwalking with a candle, Scottish queen unraveling into madness",
  "macbeth": "Scottish warrior-king with a bloodied crown, haunted eyes seeing phantom daggers, battle-worn armor",
  "richard-iii": "Hunchbacked with a withered arm, boar emblem, twisted asymmetrical silhouette, stolen crown",
  "claudius": "Danish king with a poisoner's vial, stolen crown and stolen queen, regal but hollow",
  "edmund": "Bastard son with forged letters, calculated smile, dressed to rival legitimate nobility",
  "shylock": "Jewish gaberdine gown, moneylender's scales, sharp knife for his pound of flesh",
  "aaron": "Moor with jet-black skin he proudly flaunts, fiercely protecting his newborn child, gleeful in evil",
  "caliban": "Puppy-headed monster with fish-like fins for arms, island creature neither human nor animal, primal and ancient",
  "cassius": "Lean and hungry Roman conspirator, dagger hidden in his toga, envious sharp features",
  "tamora": "Gothic queen of the Goths turned Roman empress, vengeful mother, draped in captured Roman finery",
  "goneril": "Elder daughter in regal gown, cold imperious stare, poison vial concealed in her hand",
  "regan": "Younger sister in blood-splattered noble dress, sadistic smile, plucking out Gloucester's eyes",
  "angelo": "Deputy judge in black judicial robes, scales of justice tipped by hypocrisy, puritanical severity hiding lust",
  "iachimo": "Italian gambler emerging from a trunk in a bedchamber, stealing a bracelet, smooth predatory charm",
  "leontes": "Sicilian king gripping his throne with white knuckles, eyes wild with groundless jealousy, crown askew",
  "proteus": "Young Veronese gentleman with two-faced mask, love letters to multiple women spilling from his doublet",
  "don-john": "Bastard prince in all black, sullen scowl, scheming in shadows to ruin a wedding",
  "cloten": "Boorish prince overdressed in finery that doesn't suit him, crude gestures, entitled sneer",
  "hotspur": "Hot-headed rebel knight in battle armor, sword drawn impatiently, map of the kingdom torn in frustration",
  "cardinal-wolsey": "Cardinal in sumptuous red robes with papal seal, purse of gold borne before him, ecclesiastical power",
  "aufidius": "Volscian general in bloodied warrior armor, rival's banner in his fist, pragmatic killer's eyes",
  "queen-margaret": "She-wolf queen with a paper crown, cloth dipped in her enemy's son's blood, furious war-painted face",
  "thersites": "Ragged, foul-mouthed Greek camp-follower, twisted sneer, spitting contempt at heroes and warriors alike",
  "timon": "Once-lavish Athenian lord now a cave-dwelling misanthrope in rags, digging for roots, cursing gold",
  "falstaff": "Enormously fat knight sweating through buckram, tankard of sack wine in hand, belly straining his armor",
  "petruchio": "Swaggering Paduan suitor in deliberately ragged wedding clothes, whip and riding crop, domineering stance",
  "malvolio": "Puritanical steward humiliated in yellow stockings and cross-garters, chain of office, ridiculous forced smile",
  "bolingbroke": "Usurper lord in exile's travel-worn armor, reaching for a crown that isn't his, calculating eyes",
  "oberon": "Fairy king with antler-like crown, wielding the purple love-in-idleness flower as a weapon, forest shadows",
  "suffolk": "Handsome earl whispering to the queen, one hand on his sword hilt and the other reaching for forbidden love",
  "joan-la-pucelle": "French warrior-sorceress in battered armor, conjuring flames, peasant origins showing through battlefield grime",
  "tybalt": "Prince of Cats in Capulet crimson, rapier drawn with feline grace, theatrical swordsman with lethal precision",
  "dionyza": "Jealous guardian in respectable matron's dress hiding a murderous plot, false smile masking envy",
  "duke-frederick": "Usurping duke in his stolen brother's throne room, paranoid glare, banishing gesture",
  "bertram": "Young French count fleeing his wedding in soldier's kit, broken ring and discarded promises behind him",
  "antiochus": "Ancient tyrant king with an incestuous secret, riddle-scroll in hand, threatening death to truth-seekers",
  "the-queen": "Nameless wicked stepmother queen brewing poisons in a castle laboratory, beautiful exterior hiding venom",
  "cleopatra": "Egyptian queen on a golden barge with purple sails, serpent of the Nile, asp at her breast, impossible luxury",
  "volumnia": "Stern Roman matron counting her son's twenty-five battle scars with pride, dressed in war trophies not jewelry",
  "cressida": "Trojan beauty swearing eternal love while already glancing toward the Greek camp, faithless eyes, broken vows",
};

const VILLAIN_FOLGER_SLUG: Record<string, string> = {
  "iago": "othello",
  "lady-macbeth": "macbeth",
  "macbeth": "macbeth",
  "richard-iii": "richard-iii",
  "claudius": "hamlet",
  "edmund": "king-lear",
  "shylock": "the-merchant-of-venice",
  "aaron": "titus-andronicus",
  "caliban": "the-tempest",
  "cassius": "julius-caesar",
  "tamora": "titus-andronicus",
  "goneril": "king-lear",
  "regan": "king-lear",
  "angelo": "measure-for-measure",
  "iachimo": "cymbeline",
  "leontes": "the-winters-tale",
  "proteus": "the-two-gentlemen-of-verona",
  "don-john": "much-ado-about-nothing",
  "cloten": "cymbeline",
  "hotspur": "henry-iv-part-1",
  "cardinal-wolsey": "henry-viii",
  "aufidius": "coriolanus",
  "queen-margaret": "henry-vi-part-2",
  "thersites": "troilus-and-cressida",
  "timon": "timon-of-athens",
  "falstaff": "henry-iv-part-1",
  "petruchio": "the-taming-of-the-shrew",
  "malvolio": "twelfth-night",
  "bolingbroke": "richard-ii",
  "oberon": "a-midsummer-nights-dream",
  "suffolk": "henry-vi-part-2",
  "joan-la-pucelle": "henry-vi-part-1",
  "tybalt": "romeo-and-juliet",
  "dionyza": "pericles",
  "duke-frederick": "as-you-like-it",
  "bertram": "alls-well-that-ends-well",
  "antiochus": "pericles",
  "the-queen": "cymbeline",
  "cleopatra": "antony-and-cleopatra",
  "volumnia": "coriolanus",
  "cressida": "troilus-and-cressida",
};

const ART_STYLE =
  "A punk rock portrait of a Shakespeare villain. Bold graphic style mixing Elizabethan costume with punk aesthetics — safety pins, leather, studs, torn ruffs, chains, patches, tattoos, piercings, ripped lace, spiked jewelry. IMPORTANT: Vary the hairstyle — do NOT default to a mohawk. Use shaved sides, wild long hair, braids with beads, liberty spikes, a buzz cut, dreads, slicked-back undercut, messy curls, or period-accurate hair with punk accents. High contrast, gritty texture, screen-print and zine aesthetic with splashes of neon color against dark backgrounds. No text, no lettering, no words in the image.";

export async function POST(request: Request) {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const googleKey = process.env.NANO_BANANA_API_KEY;

  if (!anthropicKey || !googleKey) {
    return NextResponse.json(
      { error: "Missing API keys. Set ANTHROPIC_API_KEY and NANO_BANANA_API_KEY in .env.local" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { name, virtue } = body;

    if (!name?.trim() || !virtue?.trim()) {
      return NextResponse.json({ error: "Name and virtue are required" }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    // 1. Ask Claude to pick the villain who is the best literary foil to this virtue
    // Build a balanced candidate pool: at least 5 female villains out of 12
    const shuffledFemale = FEMALE_VILLAINS.sort(() => Math.random() - 0.5);
    const shuffledMale = MALE_VILLAINS.sort(() => Math.random() - 0.5);
    const femalePool = shuffledFemale.slice(0, 5);
    const malePool = shuffledMale.slice(0, 7);
    const candidatePool = [...femalePool, ...malePool]
      .sort(() => Math.random() - 0.5)
      .map((slug) => [slug, VILLAIN_DISPLAY[slug]] as const);
    const villainList = candidatePool
      .map(([slug, desc]) => `- ${slug}: ${desc}`)
      .join("\n");

    const foilMsg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `A person named "${name.trim()}" says their greatest virtue is "${virtue.trim()}". Pick the Shakespeare villain from this list who is the BEST literary foil — the character whose defining traits most directly oppose or corrupt this virtue.

IMPORTANT: Do NOT default to Iago or the most famous villains. Shakespeare's lesser-known characters — especially the women (Lady Macbeth, Tamora, Goneril, Regan, Queen Margaret, Cleopatra, Volumnia, Cressida, etc.) — are often MORE interesting and specific foils. Prefer a surprising, thematically precise match over an obvious one.

Also create a Shakespearean-style epithet for this person based on their virtue — the kind of title a herald might announce. It should be "${name.trim()} the ___" where the blank is a single evocative Shakespearean word or short phrase that captures their virtue. Examples: "the Brave" for bravery, "the Gentle-hearted" for kindness, "the Ever-true" for loyalty, "the Unbowed" for resilience.

VILLAINS:
${villainList}

Return ONLY valid JSON, no markdown:
{ "villain": "slug-from-list", "foilExplanation": "One punchy sentence explaining why this villain is the perfect foil for this virtue.", "userTitle": "${name.trim()} the ___" }`,
        },
      ],
    });

    const foilText = foilMsg.content[0].type === "text" ? foilMsg.content[0].text : "";
    const foilMatch = foilText.match(/\{[\s\S]*\}/);
    if (!foilMatch) {
      return NextResponse.json({ error: "Failed to select villain foil" }, { status: 500 });
    }

    const foilResult = JSON.parse(foilMatch[0]);
    const villainFile = VILLAINS.includes(foilResult.villain)
      ? foilResult.villain
      : VILLAINS[Math.floor(Math.random() * VILLAINS.length)];

    // 2. Load that villain's speeches
    const filePath = path.join(EXTRACTED_DIR, `${villainFile}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: `Extracted data not found for ${villainFile}` }, { status: 500 });
    }

    const speeches = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const shuffled = speeches.sort(() => Math.random() - 0.5);
    const sample = shuffled.slice(0, Math.min(15, speeches.length));

    // 3. Ask Claude to pick the best quote that highlights the contrast with this virtue
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `The user's greatest virtue is "${virtue.trim()}". This villain was chosen as their literary foil. Pick the single most compelling excerpt (1-5 lines) that best highlights the CONTRAST between the villain's nature and this virtue. Return ONLY valid JSON, no markdown.

{
  "quoteText": "the exact quote text",
  "villain": "character name",
  "play": "play title",
  "act": 1,
  "scene": 1,
  "mood": "short mood description",
  "artPrompt": "2-3 sentence punk portrait description for this villain in this mood — describe expression, pose, punk details, colors. NO text in image.",
  "themes": ["theme1", "theme2"]
}

SPEECHES:
${JSON.stringify(sample.map((s: { act: number; scene: number; fullText: string }) => ({ act: s.act, scene: s.scene, text: s.fullText })))}`,
        },
      ],
    });

    const responseText = msg.content[0].type === "text" ? msg.content[0].text : "";
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Failed to parse Claude response" }, { status: 500 });
    }

    const quote = JSON.parse(jsonMatch[0]);

    // 3. Generate punk art with Nano Banana
    const genAI = new GoogleGenerativeAI(googleKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-image",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      generationConfig: { responseModalities: ["image"] } as any,
    });

    const artResponse = await model.generateContent(
      `${ART_STYLE} Character details: ${VILLAIN_VISUAL[villainFile] || ""}. ${quote.artPrompt}`
    );

    const parts = artResponse.response.candidates?.[0]?.content?.parts;
    const imagePart = parts?.find((p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData);

    let imagePath: string | null = null;

    if (imagePart?.inlineData) {
      const buf = Buffer.from(imagePart.inlineData.data, "base64");
      const webpBuf = await sharp(buf).resize(800, 800, { fit: "cover" }).webp({ quality: 75 }).toBuffer();
      const filename = `generated-${Date.now()}.webp`;

      const { error: uploadError } = await supabase.storage
        .from("art")
        .upload(filename, webpBuf, { contentType: "image/webp" });

      if (uploadError) {
        console.error("Supabase upload error:", uploadError);
      } else {
        const { data: urlData } = supabase.storage.from("art").getPublicUrl(filename);
        imagePath = urlData.publicUrl;
      }
    }

    // Build Folger Shakespeare Library source URL
    const folgerSlug = VILLAIN_FOLGER_SLUG[villainFile];
    const sourceUrl = folgerSlug
      ? `https://www.folger.edu/explore/shakespeares-works/${folgerSlug}/read/${quote.act}/${quote.scene}/`
      : null;

    // Save to database
    const record = {
      user_name: name.trim(),
      user_virtue: virtue.trim(),
      villain: quote.villain,
      play: quote.play,
      act: quote.act,
      scene: quote.scene,
      quote_text: quote.quoteText,
      mood: quote.mood,
      art_prompt: quote.artPrompt,
      themes: quote.themes,
      foil_explanation: foilResult.foilExplanation,
      user_title: foilResult.userTitle || `${name.trim()} the ${virtue.trim()}`,
      image_path: imagePath,
      source_url: sourceUrl,
    };

    const { data: inserted, error: dbError } = await supabase
      .from("generations")
      .insert(record)
      .select()
      .single();

    if (dbError) {
      console.error("Supabase DB error:", dbError);
    }

    return NextResponse.json({
      ...quote,
      id: inserted?.id,
      imageUrl: imagePath,
      dayIndex: -1,
      userName: name.trim(),
      userVirtue: virtue.trim(),
      userTitle: foilResult.userTitle || `${name.trim()} the ${virtue.trim()}`,
      foilExplanation: foilResult.foilExplanation,
      sourceUrl,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Generate error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
