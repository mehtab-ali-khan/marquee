import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import "./globals.css";

// Display font: headings, titles, the wordmark.
// Fraunces is a "variable" font: one file covers every weight, and the
// optical-size axis (opsz) automatically sharpens large headings.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  display: "swap",
});

// UI/body font: everything else.
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Marquee",
    // Child pages set just their own title, e.g. "Styleguide",
    // and Next fills this template: "Styleguide · Marquee".
    template: "%s · Marquee",
  },
  description: "What’s worth watching, tonight. Movies and TV, powered by TMDB.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fraunces.variable} ${hanken.variable} h-full`}>
      <body id="top" className="flex min-h-full flex-col">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-60 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-on-accent">
          Skip to content
        </a>
        {/* The header lives in the layout, so it appears on every page and
            stays mounted while you navigate (it doesn't re-render). */}
        <Header />
        {/* Page transitions live in app/template.tsx (it remounts per navigation;
            this layout doesn't, so animating here also fired on every streamed update). */}
        <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
