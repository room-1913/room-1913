import type { ArchiveRecord } from "./archive";
import type { CharacterId } from "../characters";

export const DIMENSIONS = [
  "desire",
  "order",
  "shadow",
  "rationality",
  "sensitivity",
  "isolation",
  "dream",
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const DIM_LABEL_ZH: Record<Dimension, string> = {
  desire: "欲望",
  order: "秩序",
  shadow: "阴影",
  rationality: "理性",
  sensitivity: "感受",
  isolation: "孤独",
  dream: "梦境",
};

const KEYWORDS: Record<Dimension, string[]> = {
  desire: ["欲望","渴望","想要","身体","性","爱","libido","desire","want","passion","craving","longing","饥饿","渴求"],
  order: ["秩序","规则","控制","纪律","责任","目标","计划","order","control","rule","duty","goal","plan","结构","框架"],
  shadow: ["阴影","黑暗","恐惧","愤怒","羞耻","自卑","shadow","fear","anger","shame","dark","压抑","禁忌","罪"],
  rationality: ["理性","逻辑","分析","思考","判断","reason","logic","analysis","think","rational","清醒","推理","客观"],
  sensitivity: ["敏感","感受","情绪","共情","脆弱","柔软","sensitive","feel","emotion","empathy","tender","纤细","在意"],
  isolation: ["孤独","沉默","隔离","疏离","一个人","alone","isolation","silence","lonely","隔绝","空","距离","冷"],
  dream: ["梦","梦境","潜意识","幻想","象征","意象","dream","unconscious","symbol","fantasy","imagery","幻","隐喻","原型"],
};

const PRIMARY_BIAS: Record<CharacterId, Partial<Record<Dimension, number>>> = {
  freud: { desire: 8, shadow: 5 },
  jung: { dream: 8, shadow: 5 },
  adler: { order: 8, rationality: 5 },
  lacan: { sensitivity: 6, dream: 6 },
};

const TONE_BIAS: { test: RegExp; nudge: Partial<Record<Dimension, number>> }[] = [
  { test: /(冷|sober|distant|detach)/i, nudge: { rationality: 4, isolation: 4 } },
  { test: /(温|warm|tender|gentle)/i, nudge: { sensitivity: 5 } },
  { test: /(暗|dark|grave|somber)/i, nudge: { shadow: 5 } },
  { test: /(梦|dream|reverie)/i, nudge: { dream: 5 } },
];

const BASELINE = 50;
const PER_HIT = 6;
const MAX_FROM_HITS = 35;

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function corpusOf(r: ArchiveRecord): string {
  return [
    r.themes.join(" "),
    r.tone ?? "",
    r.observation ?? "",
    r.summary ?? "",
    r.quotes.join(" "),
  ].join(" ").toLowerCase();
}

function countMatches(text: string, words: string[]): number {
  let n = 0;
  for (const w of words) {
    const wl = w.toLowerCase();
    if (!wl) continue;
    let from = 0;
    while (true) {
      const idx = text.indexOf(wl, from);
      if (idx < 0) break;
      n++;
      from = idx + wl.length;
    }
  }
  return n;
}

export function scoreRecord(r: ArchiveRecord): Record<Dimension, number> {
  const text = corpusOf(r);
  const out: Record<Dimension, number> = {} as any;
  for (const d of DIMENSIONS) {
    const hits = countMatches(text, KEYWORDS[d]);
    const fromHits = Math.min(MAX_FROM_HITS, hits * PER_HIT);
    const fromPrimary = PRIMARY_BIAS[r.primary]?.[d] ?? 0;
    let fromTone = 0;
    for (const t of TONE_BIAS) {
      if (t.test.test(r.tone ?? "")) fromTone += t.nudge[d] ?? 0;
    }
    out[d] = clamp(BASELINE + fromHits + fromPrimary + fromTone);
  }
  return out;
}

export interface DerivedPoint {
  at: number;
  primary: CharacterId;
  recordId: string;
  number: number;
  values: Record<Dimension, number>;
}

const ALPHA = 0.35;

export function derivedHistory(records: ArchiveRecord[]): DerivedPoint[] {
  const sorted = [...records].sort((a, b) => a.createdAt - b.createdAt);
  const acc: Record<Dimension, number> = Object.fromEntries(
    DIMENSIONS.map(d => [d, BASELINE])
  ) as any;
  const out: DerivedPoint[] = [];
  for (const r of sorted) {
    const s = scoreRecord(r);
    for (const d of DIMENSIONS) {
      acc[d] = clamp(ALPHA * s[d] + (1 - ALPHA) * acc[d]);
    }
    out.push({
      at: r.createdAt,
      primary: r.primary,
      recordId: r.id,
      number: r.number,
      values: { ...acc },
    });
  }
  return out;
}

export function latestState(history: DerivedPoint[]): Record<Dimension, number> {
  if (!history.length) {
    return Object.fromEntries(DIMENSIONS.map(d => [d, BASELINE])) as any;
  }
  return history[history.length - 1].values;
}
