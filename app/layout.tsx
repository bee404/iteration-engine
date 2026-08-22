import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";

import { THEME_INIT_SCRIPT } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coqu\u00ed",
  description: "Screenshot and feedback in. Critique and rationale-backed directions out. Code generation is optional, per direction.",
};

// Fonts are loaded via <link> rather than next/font/google: Figtree carries every label, field,
// and caption; Archivo Narrow stands in for the commercial Owners Narrow display face until it is
// licensed (see DESIGN.md open question 1). globals.css references both by family name.
//
// Instrument Serif and Roboto Mono belong to the Obsidian53 theme (display and meta respectively),
// and Figtree gains 300 for that theme's body/micro-label weight. They ship in the same request as
// the default theme's faces rather than being fetched on toggle: one stylesheet keeps the switch
// instant, and Google Fonts only serves the subsets a page actually renders.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@500;600&family=Figtree:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&family=Roboto+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        {/* Applies the saved theme before first paint. Inline and synchronous by necessity: any
            deferred script runs after the browser has already painted the default theme, which is
            exactly the flash this exists to prevent. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
