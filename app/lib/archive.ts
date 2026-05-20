import type { CharacterId } from "../characters";

export interface ArchiveTranscriptLine {
  role: "user" | "assistant";
  content: string;
  who?: CharacterId;
}

export interface ArchiveRecord {
  id: string;
  number: number;
  createdAt: number;
  participants: CharacterId[];
  primary: CharacterId;
  summary: string;
  themes: string[];
  quotes: string[];
  tone: string;
  observation: string;
  transcript: ArchiveTranscriptLine[];
}

const KEY = "room1913.archive.v1";
const MAX_RECORDS = 200;

export function loadArchive(): ArchiveRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((r: any) => r && typeof r.id === "string" && Array.isArray(r.transcript))
      .slice(-MAX_RECORDS);
  } catch {
    return [];
  }
}

export function saveArchive(records: ArchiveRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(records.slice(-MAX_RECORDS)));
  } catch {
    /* quota */
  }
}

export function getRecord(id: string): ArchiveRecord | undefined {
  return loadArchive().find(r => r.id === id);
}

export function appendRecord(record: ArchiveRecord): ArchiveRecord[] {
  const all = loadArchive();
  if (all.some(r => r.id === record.id)) return all;
  const next = [...all, record].slice(-MAX_RECORDS);
  saveArchive(next);
  return next;
}

export function nextSessionNumber(): number {
  const all = loadArchive();
  if (!all.length) return 1;
  return Math.max(...all.map(r => r.number || 0)) + 1;
}

export function newSessionId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

export function formatSessionNumber(n: number): string {
  return String(n).padStart(3, "0");
}

export function shouldArchive(transcript: ArchiveTranscriptLine[]): boolean {
  const userTurns = transcript.filter(t => t.role === "user").length;
  const assistantTurns = transcript.filter(t => t.role === "assistant").length;
  return userTurns >= 2 && assistantTurns >= 2;
}
