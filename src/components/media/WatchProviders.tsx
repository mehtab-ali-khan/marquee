import Image from "next/image";
import { logoUrl } from "@/lib/tmdb/images";
import type { WatchProvider, WatchProviderRegion } from "@/lib/tmdb/types";

// "Where to watch": which services offer the title in one country,
// grouped as Stream / Free / Rent / Buy. A Server Component.

type WatchProvidersProps = {
  region: WatchProviderRegion | undefined; // undefined = no data for this country
  countryName: string; // "the United States", for the empty message
};

const groups: { key: keyof Omit<WatchProviderRegion, "link">; label: string }[] = [
  { key: "flatrate", label: "Stream" },
  { key: "free", label: "Free" },
  { key: "ads", label: "Free with ads" },
  { key: "rent", label: "Rent" },
  { key: "buy", label: "Buy" },
];

export function WatchProviders({ region, countryName }: WatchProvidersProps) {
  const filled = groups
    .map((group) => ({ ...group, providers: sortByPriority(region?.[group.key]) }))
    .filter((group) => group.providers.length > 0);

  return (
    <section>
      <h2 className="mb-4 text-xl">Where to watch</h2>

      {filled.length === 0 ? (
        <p className="text-sm text-fg-muted">Not available to stream, rent or buy in {countryName} yet.</p>
      ) : (
        <div className="space-y-5">
          {filled.map((group) => (
            <div key={group.key}>
              <h3 className="mb-2 font-sans text-xs font-medium tracking-[0.15em] text-fg-subtle uppercase">
                {group.label}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {group.providers.map((provider) => (
                  <li key={provider.provider_id}>
                    {/* All logos link to TMDB's watch page, which links on to the service. */}
                    <a
                      href={region!.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={provider.provider_name}
                      className="block size-11 overflow-hidden rounded-sm border border-line transition-transform duration-150 ease-out-soft hover:-translate-y-0.5"
                    >
                      <Image
                        src={logoUrl(provider.logo_path, "w92")!}
                        alt={provider.provider_name}
                        width={44}
                        height={44}
                        className="size-full object-cover"
                      />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* TMDB's terms: provider data comes from JustWatch and must be credited. */}
      <p className="mt-5 text-xs text-fg-subtle">
        Availability data by{" "}
        <a
          href="https://www.justwatch.com"
          target="_blank"
          rel="noopener noreferrer"
          className="underline-offset-2 hover:text-fg-muted hover:underline"
        >
          JustWatch
        </a>
        .
      </p>
    </section>
  );
}

/** TMDB gives each provider a display_priority; lower numbers are the big, well-known services. */
function sortByPriority(providers: WatchProvider[] | undefined) {
  return [...(providers ?? [])].sort((a, b) => a.display_priority - b.display_priority);
}
