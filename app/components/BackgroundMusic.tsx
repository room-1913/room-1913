"use client";
import { useEffect, useRef } from "react";

const SRC = "/bgm.mp3";
const VOLUME = 0.18;

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.loop = true;
    audio.volume = VOLUME;

    let started = false;
    const start = () => {
      if (started) return;
      audio.play().then(() => { started = true; }).catch(() => {});
    };

    audio.play().then(() => { started = true; }).catch(() => {});

    const onInteract = () => {
      start();
      if (started) {
        document.removeEventListener("click", onInteract);
        document.removeEventListener("keydown", onInteract);
        document.removeEventListener("touchstart", onInteract);
      }
    };

    document.addEventListener("click", onInteract);
    document.addEventListener("keydown", onInteract);
    document.addEventListener("touchstart", onInteract);

    let rampTimer: any = null;
    const onHush = (e: Event) => {
      const { mul = 1, ms = 800 } = (e as CustomEvent).detail ?? {};
      const target = VOLUME * Math.max(0, Math.min(1, mul));
      const start = audio.volume;
      const t0 = performance.now();
      if (rampTimer) cancelAnimationFrame(rampTimer);
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / Math.max(1, ms));
        audio.volume = start + (target - start) * k;
        if (k < 1) rampTimer = requestAnimationFrame(step);
      };
      rampTimer = requestAnimationFrame(step);
    };
    window.addEventListener("room1913:hush", onHush);

    return () => {
      document.removeEventListener("click", onInteract);
      document.removeEventListener("keydown", onInteract);
      document.removeEventListener("touchstart", onInteract);
      window.removeEventListener("room1913:hush", onHush);
      if (rampTimer) cancelAnimationFrame(rampTimer);
      audio.pause();
    };
  }, []);

  return <audio ref={audioRef} src={SRC} preload="auto" loop />;
}
