"use client";

const BOKEH = [
  { l: 14, t: 70, s: 7, o: 0.38, b: 5 },
  { l: 22, t: 76, s: 5, o: 0.46, b: 3 },
  { l: 30, t: 68, s: 9, o: 0.32, b: 6 },
  { l: 38, t: 74, s: 6, o: 0.42, b: 4 },
  { l: 46, t: 70, s: 10, o: 0.26, b: 7 },
  { l: 54, t: 78, s: 5, o: 0.50, b: 3 },
  { l: 62, t: 72, s: 7, o: 0.34, b: 5 },
  { l: 70, t: 76, s: 6, o: 0.42, b: 4 },
  { l: 78, t: 70, s: 8, o: 0.30, b: 6 },
  { l: 86, t: 78, s: 5, o: 0.44, b: 3 },
  { l: 92, t: 72, s: 6, o: 0.34, b: 4 },
  { l: 18, t: 84, s: 6, o: 0.36, b: 4 },
  { l: 34, t: 86, s: 7, o: 0.32, b: 5 },
  { l: 50, t: 88, s: 5, o: 0.40, b: 3 },
  { l: 66, t: 84, s: 6, o: 0.34, b: 4 },
  { l: 82, t: 86, s: 7, o: 0.30, b: 5 },
  { l: 26, t: 62, s: 3, o: 0.36, b: 2 },
  { l: 44, t: 60, s: 4, o: 0.30, b: 3 },
  { l: 60, t: 64, s: 3, o: 0.34, b: 2 },
  { l: 76, t: 62, s: 4, o: 0.30, b: 3 },
  { l: 88, t: 66, s: 3, o: 0.32, b: 2 },
  { l: 12, t: 92, s: 4, o: 0.42, b: 2 },
  { l: 40, t: 94, s: 5, o: 0.38, b: 3 },
  { l: 72, t: 92, s: 4, o: 0.40, b: 2 },
];

export default function WindowScene() {
  return (
    <div className="window-scene" aria-hidden>
      <div className="window-sky" />
      <div className="window-haze" />
      <div className="window-skyline" />
      <div className="window-bokeh">
        {BOKEH.map((b, i) => (
          <span
            key={i}
            className="bokeh-dot"
            style={{
              left: `${b.l}%`,
              top: `${b.t}%`,
              width: `${b.s}px`,
              height: `${b.s}px`,
              opacity: b.o,
              filter: `blur(${b.b}px)`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
      </div>
      <div className="window-streetglow" />
      <div className="window-glass" />
      <div className="window-vignette" />
    </div>
  );
}
