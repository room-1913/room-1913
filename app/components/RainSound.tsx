"use client";
import { useEffect, useRef } from "react";

const BASE_GAIN = 0.16;

export default function RainSound() {
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    const playSoftRain = () => {
      if (ctxRef.current) return;
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC();
      ctxRef.current = ctx;

      const bufferSize = ctx.sampleRate * 2;
      const rainBuf = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = rainBuf.getChannelData(0);

      // ✅ 小睡眠同款：粉色噪音（柔和雨声，不嗡嗡、不拖拉机）
      let last = 0;
      for (let i = 0; i < bufferSize; i++) {
        // 粉色噪声，低频柔和，最接近真实下雨
        const white = Math.random() * 2 - 1;
        last = (last + 0.04 * white) / 1.025;
        data[i] = last * 0.4;
      }

      const src = ctx.createBufferSource();
      src.buffer = rainBuf;
      src.loop = true;

      // ✅ 小睡眠同款滤波：压低刺耳高频，保留温润低频雨声
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 260;
      filter.Q.value = 0.7;

      // 音量：轻柔助眠，不吵
      const gain = ctx.createGain();
      gain.gain.value = BASE_GAIN;
      gainRef.current = gain;

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start();
    };

    const onHush = (e: Event) => {
      const ctx = ctxRef.current;
      const gain = gainRef.current;
      if (!ctx || !gain) return;
      const { mul = 1, ms = 800 } = (e as CustomEvent).detail ?? {};
      const target = BASE_GAIN * Math.max(0, Math.min(1, mul));
      const now = ctx.currentTime;
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(target, now + Math.max(0.05, ms / 1000));
    };

    // Safari 必须点击才播放
    document.addEventListener("click", playSoftRain, { once: true });
    window.addEventListener("room1913:hush", onHush);
    return () => {
      document.removeEventListener("click", playSoftRain);
      window.removeEventListener("room1913:hush", onHush);
    };
  }, []);

  return null;
}