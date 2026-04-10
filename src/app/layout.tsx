import type { Metadata } from "next";
import { Space_Mono, Permanent_Marker } from "next/font/google";
import "./globals.css";

const spaceMono = Space_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const permanentMarker = Permanent_Marker({
  variable: "--font-punk",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "PUNK SHAKESPEARE",
  description:
    "Shakespeare's villains reimagined as punk icons. AI-generated art and quotes from the baddest characters in the canon.",
  openGraph: {
    title: "PUNK SHAKESPEARE",
    description: "Shakespeare's villains. Punk art. Chaos.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceMono.variable} ${permanentMarker.variable} h-full`}
    >
      <body className="min-h-full flex flex-col grain">{children}</body>
    </html>
  );
}
