import { Suspense } from "react";
import { MediaCard } from "@/components/media/MediaCard";
import { TrailerButton } from "@/components/media/TrailerButton";
import { WatchProviders } from "@/components/media/WatchProviders";
import { Container } from "@/components/ui/Container";
import { TitleLibraryActions } from "@/features/library/TitleLibraryActions";
import { WATCH_REGION } from "@/lib/tmdb/details";
import { ChapterNav } from "./ChapterNav";
import { Chapter, CreditsRoll, Screen, SpecSheet, Story, TicketStub, TitleBlock } from "./ProgramParts";
import type { Program } from "./program";

// The "Festival Program" detail page, shared by movies and shows.
//
//   [ the screen: letterboxed backdrop ]
//   NOW SHOWING · FILM · 2026          ┌ ticket stub ┐
//   Title / tagline / genres           │ score, facts │
//                                      ├┄┄┄┄┄┄┄┄┄┄┄┄┄┄┤
//                                      │ actions      │
//   01 Story  02 Episodes  03 Credits  04 Where to watch  05 Details  06 Related
//
// Chapters only appear when there's something to show, and are numbered in order.

type Section = { id: string; label: string; content: React.ReactNode };

export function TitleProgram({ program, episodes }: { program: Program; episodes?: React.ReactNode }) {
  const sections: Section[] = [
    { id: "story", label: "Story", content: <Story overview={program.overview} /> },
    ...(episodes ? [{ id: "episodes", label: "Episodes", content: episodes }] : []),
    ...(program.cast.length || program.crew.length
      ? [{ id: "credits", label: "Credits", content: <CreditsRoll cast={program.cast} crew={program.crew} /> }]
      : []),
    {
      id: "watch",
      label: "Where to watch",
      content: <WatchProviders region={program.region} countryName={WATCH_REGION.name} showHeading={false} />,
    },
    ...(program.specs.length ? [{ id: "details", label: "Details", content: <SpecSheet specs={program.specs} /> }] : []),
    ...(program.related.length
      ? [
          {
            id: "related",
            label: "Related",
            content: (
              <ul className="grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 lg:grid-cols-6">
                {program.related.map(({ key, ...card }) => (
                  <li key={key}>
                    <MediaCard {...card} />
                  </li>
                ))}
              </ul>
            ),
          },
        ]
      : []),
  ];

  return (
    <main className="pb-24">
      <Screen backdropPath={program.backdropPath} title={program.title} />

      <Container className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-16">
        <TitleBlock program={program} />
        <TicketStub program={program}>
          {program.trailerKey && (
            <div className="[&>button]:w-full">
              <TrailerButton youtubeKey={program.trailerKey} title={program.title} />
            </div>
          )}
          {/* Personal (reads the session) → streams in on its own. The selector
              makes the library buttons share the stub's width evenly. */}
          <div className="[&_[role=group]>*]:flex-1 [&>a]:w-full">
            {/* (the "Sign in to save" link fills the stub too) */}
            <Suspense fallback={<div className="h-11 rounded-md bg-raised" aria-hidden="true" />}>
              <TitleLibraryActions type={program.type} id={program.id} />
            </Suspense>
          </div>
        </TicketStub>
      </Container>

      {/* Directly inside <main> (no wrapper div): a sticky element only sticks
          within its parent, and a wrapper here made the bar scroll away. */}
      <ChapterNav className="mt-16" chapters={sections.map(({ id, label }) => ({ id, label }))} />


      <Container className="mt-12 space-y-16">
        {sections.map((section, index) => (
          <Chapter key={section.id} id={section.id} number={index + 1} title={section.label}>
            {section.content}
          </Chapter>
        ))}
      </Container>
    </main>
  );
}
