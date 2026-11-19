import type { Metadata } from "next";
import { ViewTransition } from "react";
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
      <body className="flex min-h-full flex-col">
        {/* The header lives in the layout, so it appears on every page and
            stays mounted while you navigate (it doesn't re-render). */}
        <Header />
        {/* When you navigate, the page content (not the header) fades out and
            the new page rises in. The browser does the animation; React tells
            it when. The animation itself is defined in globals.css (.page). */}
        <ViewTransition default="page">
          <div className="flex flex-1 flex-col">{children}</div>
        </ViewTransition>
        <Footer />
      </body>
    </html>
  );
}
