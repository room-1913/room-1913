import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
});

interface Msg { role: "user" | "assistant"; content: string }

const SYSTEM = `You are the silent archivist of Room 1913 — a candlelit study where psychologists and one visitor speak.
After listening to a brief exchange, you record ONE poetic memory fragment about the visitor (never about the psychologists), and a compact summary.

The fragment is a single short sentence — observation, not advice — in the voice of an old archive note.
It should sound like something Jung might pencil in a margin: literary, melancholic, intimate, never clinical.

Constraints:
- fragment: 6 to 18 words, no quotation marks, no name, second person ("you ...") or impersonal ("a quiet fear of ...").
- themes: 2 to 5 lowercase one-word tags (e.g. solitude, freedom, identity, shame, longing).
- tone: a single short phrase (1–3 words), e.g. "introspective", "guarded but warm".

Return STRICT JSON only:
{"fragment":"...","themes":["..."],"tone":"..."}
If the exchange is too thin to observe anything genuine, return {"skip":true}.`;

export async function POST(req: Request) {
  try {
    const { messages, prior } = (await req.json()) as {
      messages: Msg[];
      prior?: { themes?: string[]; tone?: string };
    };

    if (!Array.isArray(messages) || messages.length < 2) {
      return NextResponse.json({ skip: true });
    }

    const trimmed = messages.slice(-8).map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: String(m.content ?? "").slice(0, 400),
    }));

    const priorBlock = prior && (prior.themes?.length || prior.tone)
      ? `\n\nPrior reading (do not simply repeat — only deepen or shift if warranted):\nthemes: ${(prior.themes ?? []).join(", ")}\ntone: ${prior.tone ?? ""}`
      : "";

    const result = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 220,
      temperature: 0.8,
      system: SYSTEM + priorBlock,
      messages: [
        {
          role: "user",
          content:
            "Recent exchange:\n\n" +
            trimmed.map(t => `${t.role === "user" ? "Visitor" : "Room"}: ${t.content}`).join("\n") +
            "\n\nWrite the archive note now.",
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

    const fragment = String(parsed?.fragment ?? "").trim();
    if (!fragment || fragment.length < 6) return NextResponse.json({ skip: true });

    const themes = Array.isArray(parsed?.themes)
      ? parsed.themes
          .map((t: any) => String(t ?? "").trim().toLowerCase())
          .filter((t: string) => t && /^[a-zà-ÿ\- ]{2,24}$/i.test(t))
          .slice(0, 5)
      : [];

    const tone = String(parsed?.tone ?? "").trim().slice(0, 40);

    return NextResponse.json({ fragment: fragment.slice(0, 160), themes, tone });
  } catch (err: any) {
    console.error("distill error", err?.status, err?.message);
    return NextResponse.json({ skip: true });
  }
}
