"use client";
import { useState } from "react";
import { MemoryState, clearMemory } from "../lib/memory";

export default function ArchivePanel({
  memory,
  onClear,
}: {
  memory: MemoryState;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);

  const fragments = memory.fragments.slice(-10).reverse();
  const themes = memory.summary.themes.slice(0, 6);
  const tone = memory.summary.tone;

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="archive-toggle font-type"
        aria-pressed={open}
      >
        {open ? "· close archive ·" : "· the room remembers ·"}
        <span className="archive-toggle-count">{memory.fragments.length}</span>
      </button>

      <aside className={`archive-panel ${open ? "archive-panel-open" : ""}`} aria-hidden={!open}>
        <div className="archive-inner">
          <div className="archive-head">
            <p className="archive-title font-type">Archive</p>
            <p className="archive-subtitle font-serif italic ink-mute">
              fragments left at the door, between visits
            </p>
          </div>

          {(themes.length > 0 || tone) && (
            <div className="archive-summary">
              {tone && (
                <p className="font-serif italic ink-fade">
                  <span className="archive-summary-key font-type">tone</span>
                  <span className="archive-summary-val">— {tone}</span>
                </p>
              )}
              {themes.length > 0 && (
                <p className="font-serif italic ink-fade">
                  <span className="archive-summary-key font-type">themes</span>
                  <span className="archive-summary-val">— {themes.join(" · ")}</span>
                </p>
              )}
            </div>
          )}

          {fragments.length === 0 ? (
            <p className="archive-empty font-serif italic ink-mute">
              The drawer is empty. The room has not yet learned your weather.
            </p>
          ) : (
            <ul className="archive-list">
              {fragments.map((f, i) => {
                const ageOpacity = Math.max(0.42, 1 - i * 0.07);
                return (
                  <li
                    key={f.id}
                    className="archive-scrap"
                    style={{
                      ["--rot" as any]: `${(((i * 37) % 7) - 3) * 0.4}deg`,
                      ["--delay" as any]: `${i * 60}ms`,
                      ["--age-opacity" as any]: ageOpacity.toFixed(2),
                    }}
                  >
                    <p className="archive-scrap-text font-serif">{f.text}</p>
                    <p className="archive-scrap-date font-type ink-mute">
                      {softWhen(f.createdAt)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          {memory.fragments.length > 0 && (
            <button
              onClick={() => { if (confirm("Burn the archive? This cannot be undone.")) { clearMemory(); onClear(); } }}
              className="archive-burn font-type"
            >
              · burn the archive ·
            </button>
          )}
        </div>
      </aside>
    </>
  );
}

function softWhen(t: number) {
  const now = Date.now();
  const diff = Math.max(0, now - t);
  const min = diff / 60000;
  if (min < 4) return "moments ago";
  if (min < 60) return "earlier tonight";
  const sameDay = new Date(t).toDateString() === new Date(now).toDateString();
  if (sameDay) {
    const hour = new Date(t).getHours();
    if (hour >= 18 || hour < 4) return "earlier · this evening";
    return "earlier · today";
  }
  const day = min / 1440;
  if (day < 2) return "last night";
  if (day < 7) return "a few nights ago";
  if (day < 30) return "some weeks past";
  return "long ago";
}
