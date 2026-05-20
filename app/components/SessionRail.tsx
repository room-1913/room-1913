"use client";
import Link from "next/link";

interface RailItem {
  id: string;
  label: string;
  zh: string;
  href?: string;
  active?: boolean;
  glyph: React.ReactNode;
}

const Glyph = {
  session: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M4 6h12l4 4v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z" />
      <path d="M6 12h8M6 16h6" />
    </svg>
  ),
  table: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" />
    </svg>
  ),
  archive: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <rect x="5" y="4" width="14" height="16" rx="1" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </svg>
  ),
  map: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M9 5 4 7v12l5-2 6 2 5-2V5l-5 2-6-2Z" />
      <path d="M9 5v12M15 7v12" />
    </svg>
  ),
};

const ITEMS: RailItem[] = [
  { id: "session",  label: "SESSION",     zh: "对话",       href: "/home",  glyph: Glyph.session },
  { id: "table",    label: "ROUND TABLE", zh: "圆桌讨论",   href: "/room",  glyph: Glyph.table },
  { id: "archive",  label: "ARCHIVE",     zh: "档案室",     href: "/archive", glyph: Glyph.archive },
  { id: "map",      label: "MAP",         zh: "潜意识地图", href: "/map",    glyph: Glyph.map },
];

export default function SessionRail({ active }: { active?: string }) {
  return (
    <nav className="rail" aria-label="primary">
      <div className="rail-head">
        <p className="rail-title font-type">ROOM 1913</p>
        <p className="rail-sub font-type">ARCHIVE NO. 001</p>
      </div>
      <ul className="rail-list">
        {ITEMS.map(it => {
          const on = (active ?? "session") === it.id;
          const inner = (
            <span className={`rail-item ${on ? "rail-item-on" : ""} ${!it.href && !on ? "rail-item-soon" : ""}`}>
              <span className="rail-glyph">{it.glyph}</span>
              <span className="rail-labels">
                <span className="rail-label font-type">{it.label}</span>
                <span className="rail-zh font-serif">{it.zh}</span>
              </span>
            </span>
          );
          return (
            <li key={it.id}>
              {it.href ? <Link href={it.href}>{inner}</Link> : <span className="rail-link-disabled">{inner}</span>}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
