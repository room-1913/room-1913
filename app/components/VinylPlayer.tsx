"use client";
import { useEffect, useRef, useState } from "react";

const SRC = "/bgm.mp3";
const VOLUME = 0.18;

export default function VinylPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.loop = true;
    a.volume = VOLUME;
    const onCanPlay = () => setReady(true);
    a.addEventListener("canplay", onCanPlay);

    let rampTimer: any = null;
    const onHush = (e: Event) => {
      const { mul = 1, ms = 800 } = (e as CustomEvent).detail ?? {};
      const target = VOLUME * Math.max(0, Math.min(1, mul));
      const start = a.volume;
      const t0 = performance.now();
      if (rampTimer) cancelAnimationFrame(rampTimer);
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / Math.max(1, ms));
        a.volume = start + (target - start) * k;
        if (k < 1) rampTimer = requestAnimationFrame(step);
      };
      rampTimer = requestAnimationFrame(step);
    };
    window.addEventListener("room1913:hush", onHush);

    return () => {
      a.removeEventListener("canplay", onCanPlay);
      window.removeEventListener("room1913:hush", onHush);
      if (rampTimer) cancelAnimationFrame(rampTimer);
      a.pause();
    };
  }, []);

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      a.play().then(() => setPlaying(true)).catch(() => {});
    }
  }

  return (
    <div className={`vinyl ${playing ? "vinyl-on" : ""}`}>
      <button
        type="button"
        className="vinyl-btn"
        aria-label={playing ? "Lift needle" : "Drop needle"}
        aria-pressed={playing}
        onClick={toggle}
      >
        <span className="vinyl-disc" aria-hidden>
          <span className="vinyl-grooves" />
          <span className="vinyl-label">
            <span className="vinyl-label-ring" />
            <span className="vinyl-label-text font-type">1913</span>
            <span className="vinyl-spindle" />
          </span>
          <span className="vinyl-shine" />
        </span>
        <span className="vinyl-arm" aria-hidden>
          <span className="vinyl-arm-base" />
          <span className="vinyl-arm-stem" />
          <span className="vinyl-arm-head" />
        </span>
      </button>
      <span className="vinyl-state font-type">
        {playing ? "PLAYING" : ready ? "TAP TO PLAY" : "LOADING"}
      </span>
      <audio ref={audioRef} src={SRC} preload="auto" loop />
    </div>
  );
}
