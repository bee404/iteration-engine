import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coqu\u00ed",
  description: "Screenshot and feedback in. Critique and rationale-backed directions out. Code generation is optional, per direction.",
};

// Fonts are loaded via <link> rather than next/font/google: Figtree carries every label, field,
// and caption; Archivo Narrow stands in for the commercial Owners Narrow display face until it is
// licensed (see DESIGN.md open question 1). globals.css references both by family name.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@500;600&family=Figtree:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
