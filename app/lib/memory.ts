export interface MemoryFragment {
  id: string;
  text: string;
  createdAt: number;
}

export interface MemorySummary {
  themes: string[];
  tone: string;
}

export interface MemoryState {
  fragments: MemoryFragment[];
  summary: MemorySummary;
  lastDistilledAt: number;
  turnsSinceDistill: number;
}

const KEY = "room1913.memory.v1";
const MAX_FRAGMENTS = 24;
const MAX_THEMES = 8;

export const EMPTY_MEMORY: MemoryState = {
  fragments: [],
  summary: { themes: [], tone: "" },
  lastDistilledAt: 0,
  turnsSinceDistill: 0,
};

export function loadMemory(): MemoryState {
  if (typeof window === "undefined") return EMPTY_MEMORY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY_MEMORY;
    const parsed = JSON.parse(raw);
    return {
      fragments: Array.isArray(parsed?.fragments) ? parsed.fragments.slice(-MAX_FRAGMENTS) : [],
      summary: {
        themes: Array.isArray(parsed?.summary?.themes) ? parsed.summary.themes.slice(0, MAX_THEMES) : [],
        tone: typeof parsed?.summary?.tone === "string" ? parsed.summary.tone : "",
      },
      lastDistilledAt: Number(parsed?.lastDistilledAt) || 0,
      turnsSinceDistill: Number(parsed?.turnsSinceDistill) || 0,
    };
  } catch {
    return EMPTY_MEMORY;
  }
}

export function saveMemory(m: MemoryState) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* quota */ }
}

export function clearMemory() {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(KEY); } catch { /* noop */ }
}

export function appendFragment(prev: MemoryState, text: string): MemoryState {
  const cleaned = String(text || "").trim().replace(/^["“”']|["“”']$/g, "").slice(0, 160);
  if (!cleaned) return prev;
  const last = prev.fragments[prev.fragments.length - 1];
  if (last && last.text.toLowerCase() === cleaned.toLowerCase()) return prev;
  const frag: MemoryFragment = {
    id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    text: cleaned,
    createdAt: Date.now(),
  };
  const fragments = [...prev.fragments, frag].slice(-MAX_FRAGMENTS);
  return { ...prev, fragments };
}

export function mergeSummary(prev: MemoryState, incoming: Partial<MemorySummary>): MemoryState {
  const incomingThemes = (incoming.themes ?? [])
    .map(t => String(t || "").trim().toLowerCase())
    .filter(Boolean);
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const t of [...incomingThemes, ...prev.summary.themes]) {
    const k = t.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    merged.push(t);
    if (merged.length >= MAX_THEMES) break;
  }
  return {
    ...prev,
    summary: {
      themes: merged,
      tone: (incoming.tone || prev.summary.tone || "").trim().slice(0, 40),
    },
  };
}

export function memoryContextLines(m: MemoryState, maxFragments = 5): string[] {
  const lines: string[] = [];
  const recent = m.fragments.slice(-maxFragments);
  for (const f of recent) lines.push(`· ${f.text}`);
  return lines;
}
