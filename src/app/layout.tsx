import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stellar Path Finder",
  description: "Compare Stellar path payment routes between any two assets.",
  metadataBase: new URL("https://stellar-path-finder.vercel.app"),
  openGraph: {
    title: "Stellar Path Finder",
    description: "Compare Stellar path payment routes between any two assets.",
    url: "https://stellar-path-finder.vercel.app",
    siteName: "Stellar Path Finder",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Stellar Path Finder",
    description: "Compare Stellar path payment routes between any two assets.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
