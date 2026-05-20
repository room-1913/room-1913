"use client";
import { useEffect, useState } from "react";
import { ambience, AmbienceState } from "../lib/ambience";

export default function AmbienceControl() {
  const [s, setS] = useState<AmbienceState>(() => ambience.getState());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    ambience.init();
    return ambience.subscribe(setS);
  }, []);

  const pct = Math.round(s.volume * 100);
  const playing = s.enabled && s.ready && s.volume > 0;

  return (
    <div className={`ambience ${open ? "ambience-open" : ""}`}>
      <button
        type="button"
        className="ambience-trigger"
        aria-label={playing ? "Mute rain" : "Play rain"}
        onClick={() => setOpen(o => !o)}
      >
        <span className={`ambience-glyph ${playing ? "ambience-glyph-on" : ""}`} aria-hidden>
          <span /><span /><span /><span /><span />
        </span>
        <span className="ambience-trigger-labels">
          <span className="ambience-tag font-type">RAIN AMBIENCE</span>
          <span className="ambience-state font-serif ink-fade">
            {s.ready ? (playing ? "Vienna · soft rain" : "muted") : "tap to begin"}
          </span>
        </span>
      </button>

      <div className="ambience-panel" role="group" aria-label="Rain ambience controls">
        <div className="ambience-panel-row">
          <button
            type="button"
            className="ambience-toggle font-type"
            onClick={() => ambience.toggle()}
            aria-pressed={s.enabled}
          >
            {s.enabled ? "ON" : "OFF"}
          </button>
          <span className="ambience-vol-label font-type">{pct}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          value={pct}
          onChange={e => ambience.setVolume(Number(e.target.value) / 100)}
          className="ambience-slider"
          aria-label="Ambience volume"
        />
        <p className="ambience-hint font-serif ink-mute">
          rain · vinyl ambience to follow
        </p>
      </div>
    </div>
  );
}
