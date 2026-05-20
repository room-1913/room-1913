"use client";
import { useEffect, useMemo, useState } from "react";
import type { ArchiveRecord } from "../lib/archive";
import { loadArchive } from "../lib/archive";
import {
  DIMENSIONS,
  DIM_LABEL_ZH,
  derivedHistory,
  latestState,
  type Dimension,
  type DerivedPoint,
} from "../lib/dimensions";
import { CHARACTERS, type CharacterId } from "../characters";

const PRIMARY_COLOR: Record<CharacterId, string> = {
  freud: "rgba(217,154,78,0.95)",
  jung: "rgba(174,140,210,0.95)",
  adler: "rgba(150,180,180,0.92)",
  lacan: "rgba(210,210,220,0.85)",
};

export default function MapShell() {
  const [records, setRecords] = useState<ArchiveRecord[]>([]);
  const [hover, setHover] = useState<string | null>(null);
  const [activeDim, setActiveDim] = useState<Dimension | null>(null);

  useEffect(() => {
    setRecords(loadArchive());
  }, []);

  const history = useMemo(() => derivedHistory(records), [records]);
  const latest = useMemo(() => latestState(history), [history]);
  const empty = records.length === 0;

  return (
    <section className="map-stage">
      <header className="map-head">
        <h1 className="map-title font-serif">SUBCONSCIOUS MAP</h1>
        <p className="map-sub font-serif ink-fade">潜意识地图 · 七维趋势</p>
      </header>

      <div className="map-grid">
        <div className="map-radar-wrap">
          <RadarChart values={latest} activeDim={activeDim} />
          <ul className="map-legend">
            {DIMENSIONS.map(d => (
              <li
                key={d}
                className={`map-legend-item ${activeDim === d ? "on" : ""}`}
                onMouseEnter={() => setActiveDim(d)}
                onMouseLeave={() => setActiveDim(null)}
              >
                <span className="map-legend-dot" />
                <span className="font-type">{d}</span>
                <span className="font-serif ink-fade">· {DIM_LABEL_ZH[d]}</span>
                <span className="map-legend-num font-type">
                  {Math.round(latest[d])}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="map-series-wrap">
          {empty ? (
            <p className="map-empty font-serif ink-mute">
              尚无会议记录 · the map awaits its first session
            </p>
          ) : (
            <TimeSeries history={history} activeDim={activeDim} setActiveDim={setActiveDim} />
          )}
        </div>
      </div>

      <EventTimeline records={records} hover={hover} setHover={setHover} />
    </section>
  );
}

/* ── Radar ─────────────────────────────────────────────── */

function RadarChart({
  values,
  activeDim,
}: {
  values: Record<Dimension, number>;
  activeDim: Dimension | null;
}) {
  const size = 360;
  const cx = size / 2;
  const cy = size / 2;
  const R = 130;
  const N = DIMENSIONS.length;

  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / N;
  const point = (i: number, r: number) => [
    cx + Math.cos(angle(i)) * r,
    cy + Math.sin(angle(i)) * r,
  ] as const;

  const rings = [0.25, 0.5, 0.75, 1].map(k =>
    DIMENSIONS.map((_, i) => point(i, R * k).join(",")).join(" ")
  );

  const dataPoly = DIMENSIONS.map((d, i) => point(i, R * (values[d] / 100)).join(",")).join(" ");

  return (
    <svg
      className="map-radar"
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Subconscious radar"
    >
      {rings.map((pts, i) => (
        <polygon key={i} className={`map-radar-ring ring-${i}`} points={pts} />
      ))}
      {DIMENSIONS.map((d, i) => {
        const [x, y] = point(i, R);
        return (
          <line
            key={d}
            className="map-radar-axis"
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
          />
        );
      })}
      <polygon className="map-radar-data" points={dataPoly} />
      {DIMENSIONS.map((d, i) => {
        const [px, py] = point(i, R * (values[d] / 100));
        return (
          <circle
            key={d}
            className={`map-radar-vertex ${activeDim === d ? "on" : ""}`}
            cx={px}
            cy={py}
            r={activeDim === d ? 4.6 : 3}
          />
        );
      })}
      {DIMENSIONS.map((d, i) => {
        const [lx, ly] = point(i, R + 22);
        return (
          <text
            key={d}
            className={`map-radar-label ${activeDim === d ? "on" : ""}`}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {d}
          </text>
        );
      })}
    </svg>
  );
}

/* ── Time series ───────────────────────────────────────── */

function TimeSeries({
  history,
  activeDim,
  setActiveDim,
}: {
  history: DerivedPoint[];
  activeDim: Dimension | null;
  setActiveDim: (d: Dimension | null) => void;
}) {
  const W = 900;
  const H = 260;
  const padX = 32;
  const padY = 22;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const xs = history.length;
  const xAt = (i: number) =>
    xs <= 1 ? padX + innerW / 2 : padX + (innerW * i) / (xs - 1);
  const yAt = (v: number) => padY + innerH - (innerH * v) / 100;

  const yGrid = [25, 50, 75];

  return (
    <svg className="map-series" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      {yGrid.map(g => (
        <line
          key={g}
          className="map-series-grid"
          x1={padX}
          x2={W - padX}
          y1={yAt(g)}
          y2={yAt(g)}
        />
      ))}
      {DIMENSIONS.map(d => {
        const path = history
          .map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p.values[d])}`)
          .join(" ");
        const dim = activeDim ? (activeDim === d ? "on" : "off") : "";
        return (
          <path
            key={d}
            className={`map-series-line dim-${d} ${dim}`}
            d={path}
            onMouseEnter={() => setActiveDim(d)}
            onMouseLeave={() => setActiveDim(null)}
          />
        );
      })}
      {history.map((p, i) => (
        <circle
          key={p.recordId}
          className="map-series-marker"
          cx={xAt(i)}
          cy={H - padY + 8}
          r={2}
        />
      ))}
    </svg>
  );
}

/* ── Event timeline ────────────────────────────────────── */

function EventTimeline({
  records,
  hover,
  setHover,
}: {
  records: ArchiveRecord[];
  hover: string | null;
  setHover: (id: string | null) => void;
}) {
  if (!records.length) return null;
  const sorted = [...records].sort((a, b) => a.createdAt - b.createdAt);
  const last = sorted[sorted.length - 1];
  const first = sorted[0];

  return (
    <div className="map-timeline">
      <div className="map-timeline-rule" />
      <ul className="map-timeline-list">
        {sorted.map(r => (
          <li key={r.id} className="map-timeline-item">
            <button
              className="map-timeline-marker"
              style={{ background: PRIMARY_COLOR[r.primary] }}
              onMouseEnter={() => setHover(r.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(r.id)}
              onBlur={() => setHover(null)}
              aria-label={`Session ${r.number} · ${CHARACTERS[r.primary].shortName}`}
            />
            {hover === r.id && (
              <div className="map-timeline-card">
                <p className="font-type map-timeline-num">
                  № {String(r.number).padStart(3, "0")} ·{" "}
                  {CHARACTERS[r.primary].shortName ?? CHARACTERS[r.primary].name}
                </p>
                <p className="font-serif ink-fade map-timeline-date">
                  {new Date(r.createdAt).toLocaleString()}
                </p>
                {r.themes.length > 0 && (
                  <p className="font-serif map-timeline-themes">
                    {r.themes.slice(0, 3).join(" · ")}
                  </p>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
      <div className="map-timeline-bounds font-type ink-mute">
        <span>{new Date(first.createdAt).toLocaleDateString()}</span>
        <span>{new Date(last.createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
