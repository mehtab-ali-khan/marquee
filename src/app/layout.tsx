import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
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
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
