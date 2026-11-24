import { DetailModal } from "@/features/home/DetailModal";

// The modal SHELL lives in a layout so it stays mounted while the content
// below loads (loading.tsx → page.tsx): the open animation plays only once.
export default function MovieModalLayout({ children }: { children: React.ReactNode }) {
  return <DetailModal label="Movie details">{children}</DetailModal>;
}
