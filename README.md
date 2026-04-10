# Punk Shakespeare

**Name thy virtue -- meet thy villain.**

A web app that matches you with your Shakespearean foil. Enter your name and greatest virtue, and we'll summon the Shakespeare villain who is your perfect literary opposite -- complete with a punk rock portrait and a quote that cuts to the bone.

Built on the complete works of Shakespeare from the [Folger Shakespeare Library](https://www.folger.edu/explore/shakespeares-works/download/).

## How It Works

1. Enter your name and your greatest virtue
2. Claude picks the Shakespeare villain who best opposes that virtue
3. A quote is selected that highlights the contrast between your virtue and the villain's nature
4. A punk-style portrait is generated with AI (Gemini)
5. You get your result: villain, quote, art, and a Shakespearean title for yourself

While you wait, enjoy a stream of Shakespearean insults.

## Tech Stack

- **Next.js** (App Router, TypeScript, Tailwind CSS v4)
- **Claude API** (Anthropic) -- villain matching + quote curation
- **Gemini** (Google AI) -- punk portrait generation
- **Supabase** -- image storage + generation history
- **Sharp** -- image processing

## Setup

```bash
npm install
cp .env.local.example .env.local  # Add your API keys
npm run dev
```

### Environment Variables

```
ANTHROPIC_API_KEY=         # Claude API key
NANO_BANANA_API_KEY=       # Google AI API key (Gemini)
NEXT_PUBLIC_SUPABASE_URL=  # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon key
```

## Data Pipeline

The app draws from pre-extracted villain speeches parsed from the Folger Shakespeare Library plain-text corpus (42 plays, sonnets, and poems in `texts/`).

```bash
node scripts/extract-quotes.js    # Parse texts -> data/extracted/
```

## Villains (38 total)

Iago, Lady Macbeth, Macbeth, Richard III, Claudius, Edmund, Shylock, Aaron, Caliban, Cassius, Tamora, Goneril, Regan, Angelo, Iachimo, Leontes, Proteus, Don John, Cloten, Hotspur, Cardinal Wolsey, Aufidius, Queen Margaret, Thersites, Timon, Falstaff, Petruchio, Malvolio, Bolingbroke, Oberon, Suffolk, Joan La Pucelle, Tybalt, Dionyza, Duke Frederick, Bertram, Antiochus, The Queen

## Credits

- Shakespeare texts from the [Folger Shakespeare Library](https://www.folger.edu/explore/shakespeares-works/download/)
- Art generated with Gemini (Google AI)
- Built by [Bethany Crystal](https://www.linkedin.com/in/bethanymarz/)
