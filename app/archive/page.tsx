"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import SessionRail from "../components/SessionRail";
import WindowDateChip from "../components/WindowDateChip";
import { CHARACTERS } from "../characters";
import {
  ArchiveRecord,
  loadArchive,
  formatSessionNumber,
} from "../lib/archive";

export default function ArchiveIndex() {
  const [records, setRecords] = useState<ArchiveRecord[] | null>(null);

  useEffect(() => {
    setRecords(loadArchive());
  }, []);

  const ordered = (records ?? []).slice().sort((a, b) => b.createdAt - a.createdAt);

  return (
    <main className="archive-shell">
      <SessionRail active="archive" />

      <section className="archive-stage">
        <header className="archive-stage-head">
          <h1 className="archive-stage-title font-serif">ARCHIVE</h1>
          <p className="archive-stage-sub font-serif ink-fade">
            sealed sessions, kept by the lamplight
          </p>
        </header>

        {records === null ? (
          <p className="archive-empty font-serif italic ink-mute">
            opening the records room…
          </p>
        ) : ordered.length === 0 ? (
          <div className="case-file-empty font-serif">
            <p>The records room is quiet. No sessions have been sealed yet.</p>
            <p>Begin a conversation, then leave the room — your session will be filed here.</p>
            <p className="case-file-empty-mute font-type">· nothing has been written down yet ·</p>
          </div>
        ) : (
          <ul className="case-file-list">
            {ordered.map(r => {
              const c = CHARACTERS[r.primary] ?? CHARACTERS.jung;
              const quote = r.quotes[0];
              const themes = r.themes.slice(0, 4).join(" · ");
              return (
                <li key={r.id}>
                  <Link href={`/archive/${r.id}`} className="case-file">
                    <div className="case-file-num">
                      <span>SESSION {formatSessionNumber(r.number)}</span>
                      <span className="case-file-num-zh">第 {r.number} 次</span>
                    </div>
                    <div className="case-file-body">
                      <div className="case-file-head">
                        <p className="case-file-analyst font-serif">{c.shortName ?? c.name}</p>
                        <span className="case-file-date">{formatDate(r.createdAt)}</span>
                      </div>
                      {themes && <p className="case-file-themes">{themes}</p>}
                      {quote && <p className="case-file-quote">“{quote}”</p>}
                    </div>
                    <span className="case-file-arrow" aria-hidden>›</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <aside className="archive-window">
        <WindowDateChip />
        <p className="window-quote font-serif italic">
          “What was said, the room remembers.”
          <span className="window-quote-zh ink-fade font-serif">所说之语，此处仍在。</span>
        </p>
      </aside>
    </main>
  );
}

function formatDate(t: number): string {
  const d = new Date(t);
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  return `${month} ${d.getDate()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function pad(n: number) { return String(n).padStart(2, "0"); }
