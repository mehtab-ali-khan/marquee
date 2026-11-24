import Image from "next/image";
import Link from "next/link";
import { UserRound } from "lucide-react";
import { profileUrl } from "@/lib/tmdb/images";

// An actor card for cast rows: photo, name, and the role they play.
// Same look and hover as MediaCard, so rails of people and posters feel like one family.

type PersonCardProps = {
  id: number;
  name: string;
  role?: string; // e.g. the character name "Tyler Durden"
  profilePath: string | null;
};

export function PersonCard({ id, name, role, profilePath }: PersonCardProps) {
  const src = profileUrl(profilePath, "w185");

  return (
    <Link href={`/person/${id}`} className="group block rounded-md">
      <div className="relative aspect-[2/3] overflow-hidden rounded-md border border-line bg-surface transition-transform duration-250 ease-out-soft group-hover:-translate-y-1">
        {src ? (
          <Image
            src={src}
            alt={`Photo of ${name}`}
            fill
            sizes="(max-width: 640px) 40vw, 12rem"
            className="object-cover transition-transform duration-250 ease-out-soft group-hover:scale-[1.03]"
          />
        ) : (
          // No photo on TMDB: a quiet person icon instead of a broken image.
          <div className="flex size-full items-center justify-center text-fg-subtle">
            <UserRound className="size-10" aria-hidden="true" />
          </div>
        )}
      </div>
      <h3 className="mt-3 truncate font-sans text-sm font-medium tracking-normal">{name}</h3>
      {role && <p className="mt-0.5 truncate text-xs text-fg-subtle">{role}</p>}
    </Link>
  );
}
