import { DetailModal } from "@/features/home/DetailModal";

// Same as the movie modal layout: the shell stays mounted while content loads.
export default function TvModalLayout({ children }: { children: React.ReactNode }) {
  return <DetailModal label="Show details">{children}</DetailModal>;
}
