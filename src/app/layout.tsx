import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stellar Path Finder",
  description: "Compare Stellar path payment routes between any two assets.",
  metadataBase: new URL("https://stellar-path-finder.vercel.app"),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Path Finder",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
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

export const viewport: Viewport = {
  themeColor: "#020617",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
        <Script id="sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function () {
                navigator.serviceWorker.register('/sw.js').catch(function () {});
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}
