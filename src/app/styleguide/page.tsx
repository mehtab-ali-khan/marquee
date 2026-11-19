import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Play, Plus, Search, Star } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonStyles } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Skeleton } from "@/components/ui/Skeleton";

// Page-level metadata. Combined with the template in layout.tsx,
// the browser tab reads "Styleguide · Marquee".
export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false }, // internal page: keep it out of search engines
};

const colors = [
  { name: "canvas", hex: "#0E0F11", use: "Page background" },
  { name: "surface", hex: "#16181B", use: "Cards, header" },
  { name: "raised", hex: "#1E2125", use: "Menus, modals, hover" },
  { name: "line", hex: "#2A2E33", use: "Borders, dividers" },
  { name: "fg", hex: "#EDEAE4", use: "Primary text" },
  { name: "fg-muted", hex: "#A39E95", use: "Secondary text" },
  { name: "fg-subtle", hex: "#6E6A63", use: "Captions, metadata" },
  { name: "accent", hex: "#E4A853", use: "One key action per screen" },
  { name: "success", hex: "#6FBF8E", use: "Feedback only" },
  { name: "danger", hex: "#E0645A", use: "Feedback only" },
];

const typeScale = [
  { cls: "text-5xl", px: 61 },
  { cls: "text-4xl", px: 49 },
  { cls: "text-3xl", px: 39 },
  { cls: "text-2xl", px: 31 },
  { cls: "text-xl", px: 25 },
  { cls: "text-lg", px: 20 },
  { cls: "text-base", px: 16 },
  { cls: "text-sm", px: 14 },
  { cls: "text-xs", px: 12 },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-12">
      <h2 className="mb-8 text-2xl">{title}</h2>
      {children}
    </section>
  );
}

export default function StyleguidePage() {
  return (
    <Container className="py-16">
      <header className="mb-12 max-w-2xl">
        <p className="mb-3 text-xs font-medium tracking-[0.2em] text-accent uppercase">Design system</p>
        <h1 className="mb-4 text-5xl">Marquee</h1>
        <p className="text-lg text-fg-muted">
          A dark, warm “screening room”: editorial serif headings, a quiet sans for the interface, and one
          brass accent used sparingly.
        </p>
      </header>

      <Section title="Color">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {colors.map((c) => (
            <li key={c.name} className="overflow-hidden rounded-md border border-line bg-surface">
              <div className="h-20" style={{ backgroundColor: c.hex }} />
              <div className="p-3">
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-fg-subtle tabular-nums">{c.hex}</p>
                <p className="mt-1 text-xs text-fg-muted">{c.use}</p>
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Typography">
        <div className="mb-10 grid gap-8 md:grid-cols-2">
          <div className="rounded-md border border-line bg-surface p-6">
            <p className="mb-2 text-xs text-fg-subtle">Display · Fraunces</p>
            <p className="font-display text-4xl">The Grand Budapest Hotel</p>
          </div>
          <div className="rounded-md border border-line bg-surface p-6">
            <p className="mb-2 text-xs text-fg-subtle">Interface · Hanken Grotesk</p>
            <p className="text-lg">A concierge and his lobby boy become entangled in a theft and a fortune.</p>
          </div>
        </div>
        <ul className="space-y-3">
          {typeScale.map((t) => (
            <li key={t.cls} className="flex items-baseline gap-6">
              <span className="w-24 shrink-0 text-xs text-fg-subtle tabular-nums">
                {t.cls} · {t.px}px
              </span>
              <span className={`${t.cls} truncate font-display`}>What’s worth watching</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Play /> Watch trailer
          </Button>
          <Button variant="secondary">
            <Plus /> Watchlist
          </Button>
          <Button variant="ghost">
            <Heart /> Favorite
          </Button>
          <Button variant="secondary" size="icon" aria-label="Search">
            <Search />
          </Button>
          <Button disabled>Disabled</Button>
          <Link href="/" className={buttonStyles({ variant: "ghost", size: "sm" })}>
            A link styled as a button
          </Link>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Drama</Badge>
          <Badge>2014</Badge>
          <Badge>PG-13</Badge>
          <Badge tone="accent">
            <Star className="mr-1 size-3 fill-current" /> 8.1
          </Badge>
          <Badge tone="success">In your watchlist</Badge>
        </div>
      </Section>

      <Section title="Loading & motion">
        <p className="mb-6 max-w-xl text-sm text-fg-muted">
          Skeletons copy the exact shape of the real content. Hover the right-hand card: a 4px lift, a slight
          image zoom, 250ms on the app’s single easing curve.
        </p>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-6">
          {[0, 1].map((i) => (
            <div key={i}>
              <Skeleton className="aspect-[2/3] w-full" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-2 h-3 w-1/3" />
            </div>
          ))}
          <div className="group cursor-pointer">
            <div className="aspect-[2/3] overflow-hidden rounded-md border border-line bg-surface transition-transform duration-250 ease-out-soft group-hover:-translate-y-1">
              <div className="flex size-full items-end bg-[linear-gradient(160deg,var(--color-raised),var(--color-canvas))] p-3 transition-transform duration-250 ease-out-soft group-hover:scale-[1.03]">
                <span className="font-display text-lg leading-tight">Poster preview</span>
              </div>
            </div>
            <p className="mt-3 text-sm font-medium">Hover me</p>
            <p className="text-xs text-fg-subtle tabular-nums">2024 · Film</p>
          </div>
        </div>
      </Section>
    </Container>
  );
}
