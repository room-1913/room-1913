import type { CharacterId } from "../characters";

export interface DraftMsg {
  role: "user" | "assistant";
  content: string;
  who?: CharacterId;
}

export interface DraftSession {
  sessionId: string;
  sessionNumber: number;
  active: CharacterId[];
  messages: DraftMsg[];
  updatedAt: number;
}

const KEY = "room1913.draft.v1";
const MAX_MESSAGES = 200;

const VALID_IDS: CharacterId[] = ["jung", "freud", "adler", "lacan"];
const isCharacterId = (v: unknown): v is CharacterId =>
  typeof v === "string" && (VALID_IDS as string[]).includes(v);

export function loadDraft(): DraftSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p || typeof p.sessionId !== "string") return null;
    const messages: DraftMsg[] = Array.isArray(p.messages)
      ? p.messages
          .filter(
            (m: any) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string",
          )
          .map((m: any) => ({
            role: m.role,
            content: m.content,
            who: isCharacterId(m.who) ? m.who : undefined,
          }))
          .slice(-MAX_MESSAGES)
      : [];
    const active: CharacterId[] = Array.isArray(p.active)
      ? p.active.filter(isCharacterId)
      : [];
    return {
      sessionId: p.sessionId,
      sessionNumber: Number(p.sessionNumber) || 0,
      active: active.length ? active : ["jung"],
      messages,
      updatedAt: Number(p.updatedAt) || 0,
    };
  } catch {
    return null;
  }
}

export function saveDraft(d: DraftSession) {
  if (typeof window === "undefined") return;
  try {
    const trimmed: DraftSession = {
      ...d,
      messages: d.messages.slice(-MAX_MESSAGES),
      updatedAt: Date.now(),
    };
    window.localStorage.setItem(KEY, JSON.stringify(trimmed));
  } catch {
    /* quota */
  }
}

export function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}
