import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .not("image_path", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const quotes = data.map((row) => ({
    id: row.id,
    dayIndex: -1,
    quoteText: row.quote_text,
    villain: row.villain,
    play: row.play,
    act: row.act,
    scene: row.scene,
    mood: row.mood,
    artPrompt: row.art_prompt,
    themes: row.themes || [],
    imageUrl: row.image_path,
    userName: row.user_name,
    userVirtue: row.user_virtue,
    userTitle: row.user_title,
    foilExplanation: row.foil_explanation,
  }));

  return NextResponse.json(quotes);
}
