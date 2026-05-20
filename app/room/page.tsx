"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Mirror from "../components/Mirror";
import { CHARACTERS, CharacterId } from "../characters";
import {
  EMPTY_MEMORY,
  MemoryState,
  loadMemory,
  saveMemory,
  appendFragment,
  mergeSummary,
  memoryContextLines,
} from "../lib/memory";
import {
  ArchiveRecord,
  appendRecord,
  newSessionId,
  nextSessionNumber,
  shouldArchive,
} from "../lib/archive";
import { loadDraft, saveDraft, clearDraft } from "../lib/draft";

interface Msg { role: "user" | "assistant"; content: string; who?: CharacterId }
type Turn = { who: CharacterId; text: string };

const SEAT_ORDER: CharacterId[] = ["jung", "freud", "adler", "lacan"];
const DISTILL_AFTER_TURNS = 2;

export default function Room() {
  const router = useRouter();
  const [active, setActive] = useState<Set<CharacterId>>(new Set(["jung"]));
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState<{ who: CharacterId; text: string } | null>(null);
  const [memory, setMemory] = useState<MemoryState>(EMPTY_MEMORY);
  const [sealing, setSealing] = useState(false);
  const distillTimer = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string>("");
  const sessionNumRef = useRef<number>(0);
  const messagesRef = useRef<Msg[]>([]);
  const activeRef = useRef<Set<CharacterId>>(new Set(["jung"]));
  const sealedRef = useRef<boolean>(false);

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { activeRef.current = active; }, [active]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const w = new URLSearchParams(window.location.search).get("with");
    const forced = w && (CHARACTERS as any)[w] ? (w as CharacterId) : null;
    const draft = forced ? null : loadDraft();
    if (draft) {
      sessionIdRef.current = draft.sessionId;
      sessionNumRef.current = draft.sessionNumber || nextSessionNumber();
      if (draft.active.length) setActive(new Set(draft.active));
      if (draft.messages.length) setMessages(draft.messages);
    } else {
      sessionIdRef.current = newSessionId();
      sessionNumRef.current = nextSessionNumber();
      if (forced) {
        setActive(new Set([forced]));
        clearDraft();
      }
    }
  }, []);

  useEffect(() => { setMemory(loadMemory()); }, []);
  useEffect(() => { saveMemory(memory); }, [memory]);

  useEffect(() => {
    if (sealedRef.current) return;
    if (!sessionIdRef.current) return;
    if (messages.length === 0) return;
    saveDraft({
      sessionId: sessionIdRef.current,
      sessionNumber: sessionNumRef.current,
      active: Array.from(active) as CharacterId[],
      messages,
      updatedAt: Date.now(),
    });
  }, [messages, active]);

  const toggle = (id: CharacterId) => {
    setActive(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size > 1) next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  const scheduleDistill = (snapshot: Msg[]) => {
    if (distillTimer.current) clearTimeout(distillTimer.current);
    distillTimer.current = setTimeout(() => runDistill(snapshot), 6000);
  };

  const runDistill = async (snapshot: Msg[]) => {
    if (snapshot.length < 3) return;
    try {
      const recent = snapshot.slice(-8).map(m => ({
        role: m.role, content: String(m.content ?? "").slice(0, 400),
      }));
      const res = await fetch("/api/distill", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: recent,
          prior: { themes: memory.summary.themes, tone: memory.summary.tone },
        }),
      });
      const data = await res.json();
      if (data?.skip || !data?.fragment) return;
      setMemory(prev => {
        const withFrag = appendFragment(prev, data.fragment);
        const merged = mergeSummary(withFrag, { themes: data.themes ?? [], tone: data.tone ?? "" });
        return { ...merged, lastDistilledAt: Date.now(), turnsSinceDistill: 0 };
      });
    } catch {
      /* silent */
    }
  };

  const sealSession = async (): Promise<ArchiveRecord | null> => {
    if (sealedRef.current) return null;
    const transcript = messagesRef.current.map(m => ({
      role: m.role,
      content: m.content,
      who: m.who,
    }));
    if (!shouldArchive(transcript)) return null;
    sealedRef.current = true;
    try {
      const res = await fetch("/api/session-archive", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (data?.skip) return null;
      const participants = SEAT_ORDER.filter(c => activeRef.current.has(c));
      const primary = participants[0] ?? "jung";
      const record: ArchiveRecord = {
        id: sessionIdRef.current,
        number: sessionNumRef.current,
        createdAt: Date.now(),
        participants,
        primary,
        summary: String(data?.summary ?? ""),
        themes: Array.isArray(data?.themes) ? data.themes : [],
        quotes: Array.isArray(data?.quotes) ? data.quotes : [],
        tone: String(data?.tone ?? ""),
        observation: String(data?.observation ?? ""),
        transcript,
      };
      appendRecord(record);
      clearDraft();
      return record;
    } catch {
      sealedRef.current = false;
      return null;
    }
  };

  const handleLeave = async (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (sealing || sealedRef.current) return;
    if (!shouldArchive(messagesRef.current)) return;
    e.preventDefault();
    setSealing(true);
    await sealSession();
    router.push(href);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setBusy(true);
    try {
      const payload = next.map(m => ({ role: m.role, content: m.content }));
      const characters = SEAT_ORDER.filter(c => active.has(c));
      const memoryPayload = {
        fragments: memoryContextLines(memory, 3).map(l => l.replace(/^·\s*/, "")),
        themes: memory.summary.themes.slice(0, 4),
        tone: memory.summary.tone,
      };
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ characters, messages: payload, memory: memoryPayload })
      });
      const data = await res.json();
      const turns: Turn[] = Array.isArray(data?.turns) && data.turns.length
        ? data.turns
        : [{ who: characters[0], text: "…" }];
      const after: Msg[] = [...next];
      for (const t of turns) {
        await typewriter(t, setTyping);
        after.push({ role: "assistant", content: t.text, who: t.who });
        setMessages(m => [...m, { role: "assistant", content: t.text, who: t.who }]);
        setTyping(null);
        await new Promise(r => setTimeout(r, 320));
      }
      const turnsSince = memory.turnsSinceDistill + 1;
      setMemory(prev => ({ ...prev, turnsSinceDistill: prev.turnsSinceDistill + 1 }));
      if (turnsSince >= DISTILL_AFTER_TURNS) scheduleDistill(after);
    } catch {
      setTyping(null);
      const fallback = SEAT_ORDER.find(c => active.has(c)) ?? "jung";
      setMessages(m => [...m, { role: "assistant", content: "— the line falls quiet —", who: fallback }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full text-paper overflow-hidden room-stage">
      <Mirror />
      <RoomUI
        active={active}
        toggle={toggle}
        messages={messages}
        typing={typing}
        busy={busy}
        input={input}
        setInput={setInput}
        send={send}
        scrollRef={scrollRef}
        sealing={sealing}
        onLeave={handleLeave}
      />
    </main>
  );
}

function Roundtable({ active, toggle }: { active: Set<CharacterId>; toggle: (c: CharacterId) => void }) {
  const seats: { id: CharacterId; pos: string }[] = [
    { id: "jung",  pos: "top-[6%] left-1/2 -translate-x-1/2" },
    { id: "freud", pos: "right-[6%] top-1/2 -translate-y-1/2" },
    { id: "adler", pos: "bottom-[6%] left-1/2 -translate-x-1/2" },
    { id: "lacan", pos: "left-[6%] top-1/2 -translate-y-1/2" }
  ];
  return (
    <div className="relative mx-auto my-6 h-[360px] w-[360px] md:h-[440px] md:w-[440px] animate-shadow-drift">
      <div className="absolute inset-[18%] rounded-full table-wood animate-drift" />
      {seats.map(({ id, pos }) => {
        const c = CHARACTERS[id];
        const on = active.has(id);
        return (
          <button
            key={id}
            onClick={() => toggle(id)}
            aria-pressed={on}
            className={`chair absolute ${pos} ${on ? "chair-on" : "chair-off"}`}
            style={on ? { ["--seat" as any]: c.color } : undefined}
          >
            <span className="chair-back">
              {c.portrait && <img src={c.portrait} alt="" className="chair-portrait" />}
            </span>
            <span className="chair-name" style={{ color: on ? c.color : undefined }}>
              {c.zhName ?? c.name.split(" ").pop()}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Overture({ active }: { active: Set<CharacterId> }) {
  const lines: Record<CharacterId, string> = {
    jung: "荣格站在窗边，烟斗早已熄灭，望着窗外的雨。",
    freud: "弗洛伊德没有起身，雪茄的火星亮了一下。",
    adler: "阿德勒合上一本书，抬起头，不慌不忙。",
    lacan: "拉康已经在对着灯光喃喃自语了。",
  };
  const present = SEAT_ORDER.filter(c => active.has(c));
  return (
    <div className="font-serif italic ink-fade text-lg md:text-xl leading-relaxed animate-fadeIn space-y-4">
      <p className="archive-label ink-mute">· at the table tonight ·</p>
      {present.map(id => (
        <p key={id} className="ink-fade">— {lines[id]}</p>
      ))}
      <p className="ink-mute pt-2 italic">Speak. Let us see who answers.</p>
    </div>
  );
}

function Line({ msg, typing = false }: { msg: Msg; typing?: boolean }) {
  if (msg.role === "user") {
    return (
      <div className="archive-line my-4 animate-fadeIn">
        <p className="archive-label ink-mute mb-1">· you ·</p>
        <p className="font-hand text-amber/85 text-xl md:text-2xl leading-snug">
          {msg.content}
        </p>
      </div>
    );
  }
  const c = msg.who ? CHARACTERS[msg.who] : CHARACTERS.jung;
  const label = c.zhName ?? (c.shortName ?? c.name).split(" ").pop();
  return (
    <div className="archive-line my-5 animate-fadeIn">
      <p className={`font-serif text-lg md:text-xl leading-relaxed ink-body ${typing ? "cursor" : ""}`}>
        <span
          className="font-type mr-2"
          style={{ color: c.color, opacity: 0.9, letterSpacing: "0.06em" }}
        >
          {label}:
        </span>
        {msg.content}
      </p>
    </div>
  );
}

async function typewriter(turn: Turn, set: (s: { who: CharacterId; text: string } | null) => void) {
  let acc = "";
  for (const ch of turn.text) {
    acc += ch;
    set({ who: turn.who, text: acc });
    const base = /[.,—;:?!]/.test(ch) ? 70 : 22;
    await new Promise(r => setTimeout(r, base + Math.random() * 35));
  }
}

function TypewriterTextarea({
  value,
  setValue,
  onSubmit,
  placeholder,
}: {
  value: string;
  setValue: (s: string) => void;
  onSubmit: () => void;
  placeholder: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={e => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSubmit();
          return;
        }
        if (e.key.length !== 1 && e.key !== "Backspace" && e.key !== "Enter") return;
        const el = ref.current;
        if (!el) return;
        el.classList.remove("key-strike");
        void el.offsetWidth;
        el.classList.add("key-strike");
      }}
      onAnimationEnd={() => ref.current?.classList.remove("key-strike")}
      placeholder={placeholder}
      rows={2}
      className="input-typewriter flex-1 bg-transparent ink-body text-lg outline-none resize-none leading-relaxed"
    />
  );
}

function RoomUI({ active, toggle, messages, typing, busy, input, setInput, send, scrollRef, sealing, onLeave }: {
  active: Set<CharacterId>;
  toggle: (c: CharacterId) => void;
  messages: Msg[];
  typing: { who: CharacterId; text: string } | null;
  busy: boolean;
  input: string;
  setInput: (s: string) => void;
  send: () => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  sealing: boolean;
  onLeave: (e: React.MouseEvent<HTMLAnchorElement>, href: string) => void;
}) {
  const present = SEAT_ORDER.filter(c => active.has(c));
  const placeholder =
    present.length === 1
      ? `对 ${CHARACTERS[present[0]].zhName ?? CHARACTERS[present[0]].name.split(" ")[0]} 说…`
      : `对众人说…`;
  return (
    <div className="relative z-20 flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-6 md:px-10 py-5">
        <Link
          href="/"
          onClick={(e) => onLeave(e, "/")}
          className="font-hand text-amber/80 text-xl hover:text-amber transition"
        >
          ← Room 1913
        </Link>
        <div className="hidden md:block font-serif italic ink-fade text-sm tracking-wide">
          {sealing ? "sealing the session…" : "Vienna · the lamp is low · rain has not stopped"}
        </div>
        <div className="room-header-spacer" aria-hidden />
      </header>

      <Roundtable active={active} toggle={toggle} />

      <section className="flex-1 flex justify-center px-4 md:px-8 pb-8">
        <div className="w-full max-w-3xl paper rounded-lg p-7 md:p-12 relative animate-breathe">
          <div className="absolute top-4 left-7 archive-label ink-mute pointer-events-none select-none">
            · archive · room 1913 ·
          </div>
          <div ref={scrollRef} className="relative h-[44vh] overflow-y-auto pr-3 mt-6">
            {messages.length === 0 && !typing && <Overture active={active} />}
            {messages.map((m, i) => (
              <Line key={i} msg={m} />
            ))}
            {typing && (
              <Line msg={{ role: "assistant", content: typing.text, who: typing.who }} typing />
            )}
          </div>

          <div className="relative mt-6 border-t border-amber/15 pt-5">
            {busy && !typing && (
              <div className="think-row" aria-live="polite">
                <span className="think-keys" aria-hidden>
                  <span className="think-key" />
                  <span className="think-key" />
                  <span className="think-key" />
                  <span className="think-key" />
                  <span className="think-key" />
                </span>
                <span className="think-label">
                  {present.length === 1
                    ? `${CHARACTERS[present[0]].zhName ?? CHARACTERS[present[0]].name.split(" ").pop()} 正在思考`
                    : `众人正在思考`}
                  <span className="think-dots" />
                </span>
              </div>
            )}
            <div className="input-platen flex items-end gap-3">
              <TypewriterTextarea
                value={input}
                setValue={setInput}
                onSubmit={send}
                placeholder={placeholder}
              />
              <button
                onClick={send}
                disabled={busy || !input.trim()}
                className="shrink-0 border border-amber/40 rounded px-5 py-2 text-amber tracking-[0.3em] text-xs uppercase hover:bg-amber/10 hover:border-amber/70 disabled:opacity-30 transition-all duration-700 font-type"
              >
                {busy ? "…" : "say"}
              </button>
            </div>
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-10 py-5 text-center ink-mute text-xs tracking-[0.4em] italic font-serif">
        ⸺ the clock on the mantelpiece keeps its own time ⸺
      </footer>
    </div>
  );
}

