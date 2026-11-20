// What the @modal slot shows when no modal is open, including after a full
// page reload (Next can't restore a modal then, and would show a 404 without this).
export default function NoModal() {
  return null;
}
