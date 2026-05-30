import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { CHARACTERS, CharacterId } from "@/app/characters";

export const runtime = "nodejs";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
  defaultHeaders: process.env.ANTHROPIC_BASE_URL
    ? { "user-agent": "node" }
    : undefined,
});

interface Msg { role: "user" | "assistant"; content: string }
type Turn = { who: CharacterId; text: string };

const TAG_RE = /^\s*\[([a-z]+)\]\s*/i;

function stripTags(s: string): string {
  return s.replace(/^\s*\[[a-z]+\]\s*/gi, "").trim();
}

function parseTurns(raw: string, active: CharacterId[]): Turn[] {
  const cleaned = raw.replace(/```[a-z]*\s*|\s*```/gi, "").trim();
  const blocks = cleaned.split(/\n\s*\n+/).map(b => b.trim()).filter(Boolean);
  const out: Turn[] = [];
  let current: Turn | null = null;
  for (const block of blocks) {
    const m = block.match(TAG_RE);
    if (m && active.includes(m[1].toLowerCase() as CharacterId)) {
      if (current) out.push(current);
      current = {
        who: m[1].toLowerCase() as CharacterId,
        text: block.slice(m[0].length).trim(),
      };
    } else if (current) {
      current.text = `${current.text}\n\n${block}`.trim();
    }
  }
  if (current) out.push(current);
  return out
    .map(t => ({ who: t.who, text: t.text.replace(/\s+$/g, "") }))
    .filter(t => t.text.length > 0)
    .slice(0, 4);
}

interface MemoryContext {
  fragments?: string[];
  themes?: string[];
  tone?: string;
}

function buildSystem(active: CharacterId[], memory?: MemoryContext) {
  const briefs = active
    .map(id => `### ${CHARACTERS[id].name} (id: ${id})\n${CHARACTERS[id].system}`)
    .join("\n\n");
  const tagList = active.map(i => `[${i}]`).join(", ");
  const maxTurns = Math.min(active.length + 1, 4);

  const fragments = (memory?.fragments ?? []).filter(Boolean).slice(-3);
  const themes = (memory?.themes ?? []).filter(Boolean).slice(0, 4);
  const tone = (memory?.tone ?? "").trim();

  const memoryBlock =
    fragments.length || themes.length || tone
      ? `\n\n## What the room already knows of this visitor\n` +
        (fragments.length ? `Archive fragments (faded notes from earlier nights):\n${fragments.map(f => `· ${f}`).join("\n")}\n` : "") +
        (themes.length ? `Recurring themes: ${themes.join(", ")}\n` : "") +
        (tone ? `Tone: ${tone}\n` : "") +
        `\nLet this colour what is said tonight — never quote these notes aloud, never name them, but let recognition surface in the voices, as if the room remembers.`
      : "";

  return `You are staging a candlelit roundtable in Room 1913 — a dim European study at night, rain on the windows. Only the following psychologists are present at the table tonight:

${briefs}${memoryBlock}

The user has just spoken. Produce a short exchange in which ONLY the listed characters speak. Rules:
- 1 to ${maxTurns} turns total. Not every present character must speak each round.
- Each turn: 1–3 sentences, fully in that character's voice, literary, no headings, no lists, no emojis.
- Characters may address the user OR one another. Sometimes they disagree. Sometimes one cuts another off.
- Choose who speaks first based on whose temperament the user's line most provokes.

Format the reply as plain text. One turn per paragraph (blank line between paragraphs).
Each paragraph MUST begin with a speaker tag in square brackets, then one space, then the dialogue.
Allowed speaker tags: ${tagList}.
No JSON. No markdown fences. No commentary outside the dialogue paragraphs.

Example shape (do NOT copy the words, only the shape):
[${active[0]}] First sentence of their reply. Second sentence if needed.

[${active[active.length - 1]}] Another character answers, possibly disagreeing.`;
}

export async function POST(req: Request) {
  try {
    const { characters, messages, memory } = (await req.json()) as {
      characters: CharacterId[];
      messages: Msg[];
      memory?: MemoryContext;
    };

    const active = (Array.isArray(characters) ? characters : []).filter(
      (c): c is CharacterId => !!CHARACTERS[c as CharacterId]
    );
    if (active.length === 0) {
      return NextResponse.json({ error: "no characters at the table" }, { status: 400 });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "no messages" }, { status: 400 });
    }

    const trimmed = messages.slice(-20).map(m => ({
      role: m.role,
      content: String(m.content ?? "").slice(0, 2000)
    }));

    const result = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 900,
      temperature: 0.85,
      system: buildSystem(active, memory),
      messages: trimmed
    });

    const raw = result.content
      .filter(b => b.type === "text")
      .map(b => (b as any).text)
      .join("")
      .trim();

    const turns = parseTurns(raw, active);
    const finalTurns = turns.length
      ? turns
      : [{ who: active[0], text: stripTags(raw) || "…" }];

    return NextResponse.json({ turns: finalTurns });
  } catch (err: any) {
    console.error("chat error", err?.status, err?.message, err?.error ?? err?.response?.data);
    return NextResponse.json(
      { error: "the room is silent for a moment…" },
      { status: 500 }
    );
  }
}
