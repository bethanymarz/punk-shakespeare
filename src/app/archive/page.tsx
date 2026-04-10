import Link from "next/link";
import Image from "next/image";
import { getAllQuotes } from "../../lib/get-daily-quote";

export default function ArchivePage() {
  const quotes = getAllQuotes();

  // Group by villain
  const byVillain = quotes.reduce(
    (acc, q) => {
      if (!acc[q.villain]) acc[q.villain] = [];
      acc[q.villain].push(q);
      return acc;
    },
    {} as Record<string, typeof quotes>
  );

  return (
    <main className="flex-1 pt-20 pb-12 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="font-mono text-2xl uppercase tracking-[0.3em] text-zinc-200 mb-2">
          Archive
        </h1>
        <p className="font-mono text-sm text-zinc-600 mb-12">
          {quotes.length} quotes from {Object.keys(byVillain).length} villains
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {quotes.map((q) => (
            <div
              key={q.dayIndex}
              className="group border border-zinc-800 bg-zinc-950 hover:border-zinc-600 transition-colors"
            >
              <div className="relative aspect-square overflow-hidden">
                <Image
                  src={`/art/${q.imageFile}`}
                  alt={`Punk portrait of ${q.villain}`}
                  fill
                  className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-4">
                <p className="font-mono text-sm text-zinc-300 line-clamp-2 mb-2">
                  &ldquo;{q.quoteText.replace(/\n/g, " ").slice(0, 100)}
                  {q.quoteText.length > 100 ? "..." : ""}&rdquo;
                </p>
                <p className="font-mono text-xs text-zinc-600">
                  <span className="text-fuchsia-500 uppercase">
                    {q.villain}
                  </span>{" "}
                  / {q.play}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
