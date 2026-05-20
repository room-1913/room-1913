"use client";

type Listener = (s: AmbienceState) => void;

export interface AmbienceState {
  enabled: boolean;
  volume: number;
  ready: boolean;
}

const STORAGE_KEY = "room1913:ambience";
const DEFAULT_VOLUME = 0.42;

let ctx: AudioContext | null = null;
let gain: GainNode | null = null;
let source: AudioBufferSourceNode | null = null;
let listeners: Listener[] = [];
let state: AmbienceState = { enabled: true, volume: DEFAULT_VOLUME, ready: false };

function emit() { listeners.forEach(l => l(state)); }

function loadStored(): Partial<AmbienceState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      enabled: state.enabled,
      volume: state.volume,
    }));
  } catch { /* ignore */ }
}

function buildBuffer(audio: AudioContext): AudioBuffer {
  const seconds = 4;
  const buf = audio.createBuffer(1, audio.sampleRate * seconds, audio.sampleRate);
  const data = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.04 * white) / 1.025;
    data[i] = last * 0.42;
  }
  return buf;
}

function ensureContext() {
  if (ctx) return ctx;
  const AC = (window.AudioContext || (window as any).webkitAudioContext);
  if (!AC) return null;
  ctx = new AC();
  const buf = buildBuffer(ctx);
  source = ctx.createBufferSource();
  source.buffer = buf;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 280;
  filter.Q.value = 0.7;

  gain = ctx.createGain();
  gain.gain.value = state.enabled ? state.volume : 0;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  return ctx;
}

function applyVolume(immediate = false) {
  if (!ctx || !gain) return;
  const target = state.enabled ? state.volume : 0;
  const now = ctx.currentTime;
  gain.gain.cancelScheduledValues(now);
  gain.gain.setValueAtTime(gain.gain.value, now);
  if (immediate) gain.gain.setValueAtTime(target, now);
  else gain.gain.linearRampToValueAtTime(target, now + 0.45);
}

export const ambience = {
  init() {
    if (typeof window === "undefined") return;
    const stored = loadStored();
    state = {
      enabled: stored.enabled ?? true,
      volume: typeof stored.volume === "number" ? stored.volume : DEFAULT_VOLUME,
      ready: false,
    };
    emit();
    const start = () => {
      const c = ensureContext();
      if (!c) return;
      if (c.state === "suspended") c.resume();
      state = { ...state, ready: true };
      applyVolume(true);
      emit();
    };
    document.addEventListener("click", start, { once: true });
    document.addEventListener("keydown", start, { once: true });
    document.addEventListener("touchstart", start, { once: true });
  },
  toggle() {
    state = { ...state, enabled: !state.enabled };
    persist();
    applyVolume();
    emit();
  },
  setVolume(v: number) {
    const clamped = Math.max(0, Math.min(1, v));
    state = { ...state, volume: clamped, enabled: clamped > 0 ? state.enabled : false };
    persist();
    applyVolume();
    emit();
  },
  subscribe(fn: Listener) {
    listeners.push(fn);
    fn(state);
    return () => { listeners = listeners.filter(l => l !== fn); };
  },
  getState(): AmbienceState { return state; },
};
