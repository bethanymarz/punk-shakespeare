export interface CuratedQuote {
  id?: string;
  dayIndex: number;
  quoteText: string;
  villain: string;
  play: string;
  act: number;
  scene: number;
  mood: string;
  artPrompt: string;
  themes: string[];
  imageFile?: string;
  imageUrl?: string;
  userName?: string;
  userVirtue?: string;
  foilExplanation?: string;
  userTitle?: string;
  sourceUrl?: string;
}
