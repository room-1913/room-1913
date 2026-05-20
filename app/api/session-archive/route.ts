import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

interface Msg { role: "user" | "assistant"; content: string; who?: string }

const SYSTEM = `You are the silent archivist of Room 1913 — a candlelit study where a visitor speaks with one or more early-20th-century psychologists. After a session has ended, you compose a psychological case file in the manner of late-night clinical archives: literary, restrained, never clinical-sterile, never sentimental.

You are reading the session as a thoughtful analyst would in retrospect. Observe the visitor — never the analysts. Do not invent facts. Use only what is genuinely present in the exchange.

Write each field with cinematic restraint:

- summary: 2 to 4 sentences. What was discussed, in plain literary prose. Past tense. No bullet points. No clinical labels.
- themes: 2 to 5 lowercase tags, single words or short phrases (e.g. "loneliness", "fear of abandonment", "emotional repression").
- quotes: 1 to 3 short verbatim or near-verbatim lines from the VISITOR (never the analyst). Each under 140 characters. Strip surrounding quotation marks. These should be the lines that carry emotional weight — the things the visitor actually said about themselves.
- tone: 2 to 4 short adjectives or fragments separated by " / " (e.g. "quiet / unresolved / introspective", "guarded but warm").
- observation: ONE sentence. A quiet analytic note in the third person. Restrained, not diagnostic. (e.g. "Patient shows recurring attachment anxiety patterns." or "An undertone of self-erasure beneath the calm.")

Return STRICT JSON only — no prose, no markdown fences:
{"summary":"...","themes":["..."],"quotes":["..."],"tone":"...","observation":"..."}

If the session is too thin to observe anything (fewer than 2 substantive visitor turns, or only small talk), return {"skip":true}.`;

export async function POST(req: Request) {
  try {
    const { transcript } = (await req.json()) as { transcript: Msg[] };

    if (!Array.isArray(transcript) || transcript.length < 4) {
      return NextResponse.json({ skip: true });
    }

    const userTurns = transcript.filter(t => t.role === "user").length;
    if (userTurns < 2) {
      return NextResponse.json({ skip: true });
    }

    const trimmed = transcript.slice(-40).map(t => ({
      role: t.role === "user" ? "user" : "assistant",
      content: String(t.content ?? "").slice(0, 800),
    }));

    const dialogue = trimmed
      .map(t => `${t.role === "user" ? "Visitor" : "Analyst"}: ${t.content}`)
      .join("\n\n");

    const result = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 700,
      temperature: 0.6,
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content:
            "Session transcript:\n\n" +
            dialogue +
            "\n\nCompose the case file now.",
        },
      ],
    });

    const raw = result.content
      .filter(b => b.type === "text")
      .map(b => (b as any).text)
      .join("")
      .trim();

    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return NextResponse.json({ skip: true });

    let parsed: any = {};
    try { parsed = JSON.parse(m[0]); } catch { return NextResponse.json({ skip: true }); }

    if (parsed?.skip) return NextResponse.json({ skip: true });

    const summary = String(parsed?.summary ?? "").trim();
    if (!summary || summary.length < 20) return NextResponse.json({ skip: true });

    const themes = Array.isArray(parsed?.themes)
      ? parsed.themes
          .map((t: any) => String(t ?? "").trim().toLowerCase())
          .filter((t: string) => t && /^[\p{L}\- ]{2,40}$/u.test(t))
          .slice(0, 5)
      : [];

    const quotes = Array.isArray(parsed?.quotes)
      ? parsed.quotes
          .map((q: any) => String(q ?? "").trim().replace(/^["“”']|["“”']$/g, ""))
          .filter((q: string) => q.length >= 6)
          .slice(0, 3)
          .map((q: string) => q.slice(0, 200))
      : [];

    const tone = String(parsed?.tone ?? "").trim().slice(0, 80);
    const observation = String(parsed?.observation ?? "").trim().slice(0, 240);

    return NextResponse.json({
      summary: summary.slice(0, 800),
      themes,
      quotes,
      tone,
      observation,
    });
  } catch (err: any) {
    console.error("session-archive error", err?.status, err?.message);
    return NextResponse.json({ skip: true });
  }
}
