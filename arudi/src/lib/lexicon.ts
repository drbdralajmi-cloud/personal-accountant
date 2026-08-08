/**
 * المعجم الموزون: كل كلمة مع تقطيعها العروضي في حالتي الوقف والتنوين،
 * مفهرسةً بالتمثيل الرمزي ليسهل استخراج الكلمات المطابقة لأي تفعيلة.
 *
 * المصدران:
 *  - كلمات منتقاة مشكولة (مُعتمدة).
 *  - صيغ قياسية مولَّدة من جذور صحيحة سالمة على الأوزان الصرفية المشهورة،
 *    وتشكيلها معلوم بالقالب فيكون تقطيعها قطعياً.
 */

import { CURATED_WORDS } from '@/data/curated';
import { MORPH_PATTERNS, derive } from '@/data/morphology';
import { SOUND_ROOTS } from '@/data/roots';
import { SUKUN, stripDiacritics } from './arud/chars';
import { splitSyllables, SYLLABLE_LABEL } from './arud/feet';
import { Unit, mark, toUnits } from './arud/prosodic';

export type WordSource = 'معتمدة' | 'قياسية';

export interface LexEntry {
  /** الكلمة مشكولة. */
  word: string;
  /** بلا تشكيل — للبحث. */
  plain: string;
  /** التمثيل الرمزي في الوقف (آخر الكلمة ساكن). */
  waqf: string;
  /** التمثيل الرمزي في الوصل (آخر الكلمة متحرك، كما تقع داخل الشطر). */
  wasl: string;
  /** التمثيل الرمزي منوّنةً (آخرها متحرك فساكن). */
  tanween: string;
  /** المقاطع مكتوبة: مَكْ/تَ/بَة. */
  segments: string[];
  /** أنواع المقاطع: طويل/قصير. */
  syllableKinds: string[];
  source: WordSource;
  /** الوزن الصرفي إن كانت مولَّدة. */
  morph?: string;
  root?: string;
}

export interface WordMatch extends LexEntry {
  /** الصورة التي طابقت التفعيلة. */
  form: 'وقف' | 'وصل' | 'تنوين';
  /** الكلمة كما تُنطق في تلك الصورة. */
  spoken: string;
}

/* ------------------------------------------------------------------ */

/** تحويل كلمة مشكولة إلى مدخل معجمي، أو null إن تعذّر تقطيعها يقيناً. */
export function toEntry(
  word: string,
  source: WordSource,
  morph?: string,
  root?: string,
): LexEntry | null {
  const built = toUnits(word, { saturate: false });
  if (!built.length) return null;
  const units = built[0];
  if (units.length < 2) return null;

  // آخر الكلمة ساكن في الوقف
  const last = units[units.length - 1];
  if (last.state === null) {
    last.state = 0;
    last.haraka = SUKUN;
  }
  // أي حرف يبقى مجهول الحركة يجعل التقطيع ظنّياً، فنستبعد الكلمة
  if (units.some((u) => u.state === null)) return null;

  const waqf = units.map((u) => u.state).join('');
  if (waqf[0] !== '1') return null;
  // لا يلتقي ساكنان إلا في آخر الكلمة (مدّ عارض للسكون)
  const doubleSukun = waqf.indexOf('00');
  if (doubleSukun !== -1 && doubleSukun !== waqf.length - 2) return null;
  if (!waqf.endsWith('0')) return null;
  if (/1111/.test(waqf)) return null;

  const wasl = waqf.slice(0, -1) + '1';
  const tanween = waqf.slice(0, -1) + '10';
  const { segments, kinds } = segment(units, waqf);

  return {
    word,
    plain: stripDiacritics(word),
    waqf,
    wasl,
    tanween,
    segments,
    syllableKinds: kinds,
    source,
    morph,
    root,
  };
}

/** تقسيم الكلمة إلى مقاطع مكتوبة بالحروف. */
function segment(units: Unit[], pattern: string): { segments: string[]; kinds: string[] } {
  const syls = splitSyllables(pattern);
  const segments: string[] = [];
  const kinds: string[] = [];
  let i = 0;
  for (const s of syls) {
    const chunk = units.slice(i, i + s.length);
    segments.push(chunk.map((u, k) => u.letter + mark(u, units[i + k - 1])).join(''));
    i += s.length;
    kinds.push(SYLLABLE_LABEL[s] ?? s);
  }
  return { segments, kinds };
}

/* ------------------------------------------------------------------ */

let cache: {
  entries: LexEntry[];
  byWaqf: Map<string, LexEntry[]>;
  byWasl: Map<string, LexEntry[]>;
  byTanween: Map<string, LexEntry[]>;
} | null = null;

function build() {
  if (cache) return cache;
  const entries: LexEntry[] = [];
  const seen = new Set<string>();

  for (const w of CURATED_WORDS) {
    const e = toEntry(w.trim(), 'معتمدة');
    if (!e || seen.has(e.word)) continue;
    seen.add(e.word);
    entries.push(e);
  }

  for (const root of SOUND_ROOTS) {
    for (const p of MORPH_PATTERNS) {
      const w = derive(root, p);
      if (!w) continue;
      const e = toEntry(w, 'قياسية', p.name, root);
      if (!e || seen.has(e.word)) continue;
      seen.add(e.word);
      entries.push(e);
    }
  }

  const byWaqf = new Map<string, LexEntry[]>();
  const byWasl = new Map<string, LexEntry[]>();
  const byTanween = new Map<string, LexEntry[]>();
  const add = (m: Map<string, LexEntry[]>, k: string, e: LexEntry) => {
    const list = m.get(k);
    if (list) list.push(e);
    else m.set(k, [e]);
  };
  for (const e of entries) {
    add(byWaqf, e.waqf, e);
    add(byWasl, e.wasl, e);
    add(byTanween, e.tanween, e);
  }

  cache = { entries, byWaqf, byWasl, byTanween };
  return cache;
}

export const lexicon = () => build().entries;
export const lexiconSize = () => build().entries.length;

export interface WordQuery {
  /** التمثيل الرمزي المطلوب. */
  pattern?: string;
  /** الاقتصار على الكلمات المعتمدة. */
  curatedOnly?: boolean;
  /** عدد المقاطع. */
  syllables?: number;
  /** بحث نصّي جزئي. */
  text?: string;
  /** الرويّ: آخر حرف. */
  rhyme?: string;
  limit?: number;
  /** بذرة للترتيب العشوائي الثابت. */
  seed?: number;
}

/** كلمات تطابق تفعيلةً بعينها، في صورة الوقف أو التنوين. */
export function wordsForPattern(pattern: string, opts: WordQuery = {}): WordMatch[] {
  const { byWaqf, byWasl, byTanween } = build();
  const out: WordMatch[] = [];
  const seen = new Set<string>();
  const push = (list: LexEntry[] | undefined, form: 'وقف' | 'وصل' | 'تنوين') => {
    for (const e of list ?? []) {
      if (opts.curatedOnly && e.source !== 'معتمدة') continue;
      if (seen.has(e.word)) continue;
      seen.add(e.word);
      out.push({ ...e, form, spoken: spokenForm(e.word, form) });
    }
  };
  push(byWaqf.get(pattern), 'وقف');
  push(byTanween.get(pattern), 'تنوين');
  push(byWasl.get(pattern), 'وصل');
  return finish(out, opts);
}

/** صورة الكلمة كما تُنطق في الوقف أو الوصل أو التنوين. */
function spokenForm(word: string, form: 'وقف' | 'وصل' | 'تنوين'): string {
  const last = word[word.length - 1];
  // المنتهية بألف أو همزة أو تنوين لا تقبل زيادة الحركة
  if ('اىآءًٌٍ'.includes(last)) return word;
  if (form === 'تنوين') return word + 'ٌ';
  if (form === 'وصل') return word + 'ُ';
  return word;
}

function finish<T extends LexEntry>(list: T[], opts: WordQuery): T[] {
  let out = list;
  if (opts.text) {
    const q = stripDiacritics(opts.text);
    out = out.filter((e) => e.plain.includes(q));
  }
  if (opts.syllables) out = out.filter((e) => e.segments.length === opts.syllables);
  if (opts.rhyme) {
    const r = opts.rhyme;
    out = out.filter((e) => e.plain.endsWith(r));
  }
  // ترتيب: المعتمدة أولاً ثم خلطٌ ثابت بحسب البذرة
  const seed = opts.seed ?? 1;
  out = [...out].sort((a, b) => {
    if (a.source !== b.source) return a.source === 'معتمدة' ? -1 : 1;
    return hash(a.word + seed) - hash(b.word + seed);
  });
  return opts.limit ? out.slice(0, opts.limit) : out;
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** بحث عام في المعجم. */
export function searchWords(opts: WordQuery): LexEntry[] {
  const all = build().entries;
  let out = all;
  if (opts.pattern)
    out = out.filter(
      (e) => e.waqf === opts.pattern || e.tanween === opts.pattern || e.wasl === opts.pattern,
    );
  if (opts.curatedOnly) out = out.filter((e) => e.source === 'معتمدة');
  return finish(out, { ...opts, limit: opts.limit ?? 60 });
}

/** كلمات تصلح قافيةً: تنتهي بالرويّ نفسه. */
export function rhymeWords(rawi: string, opts: WordQuery = {}): LexEntry[] {
  const all = build().entries;
  const out = all.filter((e) => e.plain.endsWith(stripDiacritics(rawi)));
  return finish(out, { ...opts, limit: opts.limit ?? 40 });
}

/** إحصاءات المعجم — تُعرض في لوحة الإدارة. */
let plainIndex: Map<string, LexEntry> | null = null;

/** مدخلةُ كلمةٍ بنصّها (بلا تشكيل)، إن كانت في المعجم. */
export function wordEntry(word: string): LexEntry | undefined {
  if (!plainIndex) {
    plainIndex = new Map();
    for (const e of build().entries) if (!plainIndex.has(e.plain)) plainIndex.set(e.plain, e);
  }
  return plainIndex.get(stripDiacritics(word).trim());
}

export function lexiconStats() {
  const { entries } = build();
  const byPattern = new Map<string, number>();
  for (const e of entries) {
    for (const p of [e.waqf, e.wasl, e.tanween])
      byPattern.set(p, (byPattern.get(p) ?? 0) + 1);
  }
  return {
    total: entries.length,
    curated: entries.filter((e) => e.source === 'معتمدة').length,
    derived: entries.filter((e) => e.source === 'قياسية').length,
    distinctPatterns: byPattern.size,
    byPattern,
  };
}

/** الفهارس الثلاثة — يستعملها مؤلّف الأشطر لتبليط الوزن بالكلمات. */
export function patternIndex() {
  const { byWaqf, byWasl, byTanween } = build();
  return { byWaqf, byWasl, byTanween };
}
