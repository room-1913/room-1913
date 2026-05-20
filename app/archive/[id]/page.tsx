"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SessionRail from "../../components/SessionRail";
import { CHARACTERS } from "../../characters";
import {
  ArchiveRecord,
  getRecord,
  formatSessionNumber,
} from "../../lib/archive";

export default function ArchiveDetail() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<ArchiveRecord | null | undefined>(undefined);
  const [showTranscript, setShowTranscript] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    const found = getRecord(params.id);
    setRecord(found ?? null);
  }, [params?.id]);

  if (record === undefined) {
    return (
      <main className="archive-shell">
        <SessionRail active="archive" />
        <section className="case-record">
          <p className="record-summary font-serif italic ink-mute">
            opening the file…
          </p>
        </section>
      </main>
    );
  }

  if (record === null) {
    return (
      <main className="archive-shell">
        <SessionRail active="archive" />
        <section className="case-record">
          <Link href="/archive" className="record-back">← all records</Link>
          <p className="record-summary font-serif italic ink-mute">
            That file could not be found. The page may have been cleared, or it never existed.
          </p>
        </section>
      </main>
    );
  }

  const analyst = CHARACTERS[record.primary] ?? CHARACTERS.jung;
  const dateLine = formatDate(record.createdAt);

  return (
    <main className="archive-shell">
      <SessionRail active="archive" />
      <section className="case-record">
        <Link href="/archive" className="record-back">← all records</Link>

        <header className="record-head">
          <p className="record-num">SESSION {formatSessionNumber(record.number)}</p>
          <div className="record-meta">
            <div className="record-meta-row">
              <span className="record-meta-label">Analyst</span>
              <span className="record-meta-val font-serif">{analyst.shortName ?? analyst.name}</span>
              {analyst.zhName && (
                <span className="record-meta-val-mute">{analyst.zhName} · {analyst.schoolZh ?? analyst.school}</span>
              )}
            </div>
            <div className="record-meta-row">
              <span className="record-meta-label">Date</span>
              <span className="record-meta-val font-serif">{dateLine}</span>
              <span className="record-meta-val-mute">1913 · Vienna · Rain</span>
            </div>
          </div>
        </header>

        {record.summary && (
          <div className="record-block">
            <span className="record-block-label">Summary</span>
            <p className="record-summary">{record.summary}</p>
          </div>
        )}

        {record.themes.length > 0 && (
          <div className="record-block">
            <span className="record-block-label">Themes</span>
            <ul className="record-themes">
              {record.themes.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
          </div>
        )}

        {record.quotes.length > 0 && (
          <div className="record-block">
            <span className="record-block-label">Important Quotes</span>
            <ul className="record-quotes">
              {record.quotes.map((q, i) => (
                <li key={i} className="record-quote">“{q}”</li>
              ))}
            </ul>
          </div>
        )}

        {record.tone && (
          <div className="record-block">
            <span className="record-block-label">Tone</span>
            <p className="record-tone">{record.tone}</p>
          </div>
        )}

        {record.observation && (
          <div className="record-block">
            <span className="record-block-label">Observation</span>
            <p className="record-observation">{record.observation}</p>
          </div>
        )}

        {record.transcript.length > 0 && (
          <div className="record-block">
            <span className="record-block-label">Transcript</span>
            {!showTranscript ? (
              <button
                onClick={() => setShowTranscript(true)}
                className="record-transcript-toggle"
              >
                · open the transcript ·
              </button>
            ) : (
              <ul className="record-transcript">
                {record.transcript.map((line, i) => {
                  const c = line.who ? CHARACTERS[line.who] : null;
                  const who = line.role === "user"
                    ? "you"
                    : (c?.shortName ?? c?.name ?? "the room");
                  return (
                    <li key={i} className={`record-line ${line.role === "user" ? "record-line-user" : ""}`}>
                      <span className="record-line-who">— {who} —</span>
                      <p className="record-line-text">{line.content}</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function formatDate(t: number): string {
  const d = new Date(t);
  const month = d.toLocaleString("en-US", { month: "long" });
  return `${month} ${d.getDate()} · ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function pad(n: number) { return String(n).padStart(2, "0"); }
