import SessionRail from "../components/SessionRail";
import WindowDateChip from "../components/WindowDateChip";
import MapShell from "../components/MapShell";

export default function MapPage() {
  return (
    <main className="archive-shell">
      <SessionRail active="map" />
      <MapShell />
      <aside className="archive-window">
        <WindowDateChip />
      </aside>
    </main>
  );
}
