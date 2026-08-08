/**
 * التأليف الموزون والاقتراحات:
 *  - تبليط وزن الشطر بكلمات من المعجم لتوليد شطر صحيح الوزن.
 *  - اقتراح بدائل للكلمة التي كُسر بها الوزن.
 *  - اقتراح قوافٍ موافقة للرويّ.
 *
 * تنبيه: الأشطر المؤلَّفة صحيحةُ الوزن قطعاً، لكنها لا تدّعي معنًى شعرياً؛
 * وظيفتها التدريب على الإيقاع لا إنشاء الشعر.
 */

import { LexEntry, patternIndex, rhymeWords, wordEntry, wordsForPattern } from '../lexicon';
import { analyzeVerse, AnalyzedFoot, ProsodySystemOf, VerseAnalysis } from './analyze';
import { Meter } from './meters';

export interface ComposedLine {
  text: string;
  words: LexEntry[];
  /** التفعيلات التي بُني عليها الشطر. */
  feet: string[];
  pattern: string;
}

/** مولّد عشوائي ثابت البذرة، ليكون الناتج قابلاً للتكرار. */
function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

/**
 * تأليف شطر موزون على بحر بعينه.
 * @param rhyme حرف الرويّ المطلوب في آخر الشطر (اختياري).
 */
export function composeHemistich(
  meter: Meter,
  side: 'sadr' | 'ajz' = 'sadr',
  opts: { seed?: number; rhyme?: string; curatedOnly?: boolean } = {},
): ComposedLine | null {
  const slots = side === 'ajz' && meter.ajz.length ? meter.ajz : meter.sadr;
  const rand = rng(opts.seed ?? 7);

  // نجرّب عدّة توليفات من صور التفعيلات
  for (let attempt = 0; attempt < 24; attempt++) {
    const chosen = slots.map((slot) => {
      const pool = slot.variants;
      // نرجّح الصور السالمة في أول المحاولات
      const idx = attempt < 4 ? 0 : Math.floor(rand() * pool.length);
      return pool[Math.min(idx, pool.length - 1)];
    });
    const target = chosen.map((v) => v.pattern).join('');
    const words = tile(target, {
      seed: Math.floor(rand() * 1e6),
      rhyme: opts.rhyme,
      curatedOnly: opts.curatedOnly,
    });
    if (words) {
      return {
        text: words.map((w) => w.spoken).join(' '),
        words,
        feet: chosen.map((v) => v.name),
        pattern: target,
      };
    }
  }
  return null;
}

interface TiledWord extends LexEntry {
  spoken: string;
}

/** تبليط سلسلة رمزية بكلمات: كل كلمة تملأ جزءاً منها. */
function tile(
  target: string,
  opts: { seed: number; rhyme?: string; curatedOnly?: boolean },
): TiledWord[] | null {
  const { byWaqf, byWasl, byTanween } = patternIndex();
  const rand = rng(opts.seed);
  const used = new Set<string>();
  const n = target.length;
  let steps = 0;

  const pick = (list: LexEntry[] | undefined, first: boolean): LexEntry | null => {
    if (!list || !list.length) return null;
    let pool = opts.curatedOnly ? list.filter((e) => e.source === 'معتمدة') : list;
    // الكلمة المبدوءة بهمزة وصل يتغيّر تقطيعها في الدرج، فلا تصلح لغير الابتداء
    if (!first) pool = pool.filter((e) => !e.plain.startsWith('ا'));
    if (!pool.length) return null;
    const start = Math.floor(rand() * pool.length);
    for (let k = 0; k < pool.length; k++) {
      const e = pool[(start + k) % pool.length];
      if (!used.has(e.word)) return e;
    }
    return null;
  };

  const walk = (pos: number, out: TiledWord[]): TiledWord[] | null => {
    if (pos === n) return out.length ? out : null;
    if (++steps > 4000) return null;

    // نبدأ بالكلمات الطويلة لتقلّ الكلمات ويحسن الجرس
    for (let len = Math.min(9, n - pos); len >= 2; len--) {
      const seg = target.slice(pos, pos + len);
      const last = pos + len === n;
      const candidates: { list: LexEntry[] | undefined; form: 'وقف' | 'وصل' | 'تنوين' }[] = last
        ? [
            { list: byWaqf.get(seg), form: 'وقف' },
            { list: byTanween.get(seg), form: 'تنوين' },
          ]
        : [{ list: byWasl.get(seg), form: 'وصل' }];

      for (const c of candidates) {
        let list = c.list;
        if (last && opts.rhyme && list) {
          list = list.filter((e) => e.plain.endsWith(opts.rhyme!));
        }
        const e = pick(list, pos === 0);
        if (!e) continue;
        used.add(e.word);
        const spoken =
          c.form === 'تنوين' ? addMark(e.word, 'ٌ') : c.form === 'وصل' ? addMark(e.word, 'ُ') : e.word;
        const res = walk(pos + len, [...out, { ...e, spoken }]);
        if (res) return res;
        used.delete(e.word);
      }
    }
    return null;
  };

  return walk(0, []);
}

/* ------------------------------------------------------------------ */

export interface Phrase {
  /** التركيب مشكولاً كما يُنطق. */
  text: string;
  words: { word: string; segments: string[]; source: string }[];
}

/**
 * تراكيب على وزن قالبٍ بعينه (كلمتان فأكثر).
 *
 * بعض الصور لا تقع على كلمةٍ واحدة في العربية — كـ(مُسْتَفْعِلَانْ) و
 * (مُتَفَاعِلَانْ) وهما من أضرب المذيَّل، وطولهما يتجاوز بنية الكلمة المفردة.
 * فتُملأ حينئذٍ بتركيبٍ من كلمتين، وهو ما يفعله الشاعر نفسه. وهذا يجعل لكل
 * قالبٍ محتوًى، ولا يترك صفحةً فارغة.
 */
export function phrasesForPattern(
  pattern: string,
  opts: { limit?: number; seed?: number; curatedOnly?: boolean } = {},
): Phrase[] {
  const limit = opts.limit ?? 50;
  const seen = new Set<string>();
  const out: Phrase[] = [];
  for (let attempt = 0; attempt < limit * 14 && out.length < limit; attempt++) {
    const words = tile(pattern, {
      seed: (opts.seed ?? 1) * 7919 + attempt * 131,
      curatedOnly: opts.curatedOnly,
    });
    if (!words || words.length < 2) continue;
    const text = words.map((w) => w.spoken).join(' ');
    if (seen.has(text)) continue;
    seen.add(text);
    out.push({
      text,
      words: words.map((w) => ({ word: w.spoken, segments: w.segments, source: w.source })),
    });
  }
  return out;
}

function addMark(word: string, m: string): string {
  const last = word[word.length - 1];
  if ('اىآءًٌٍ'.includes(last)) return word;
  return word + m;
}

/* ------------------------------------------------------------------ */
/*                            الاقتراحات                               */
/* ------------------------------------------------------------------ */

export interface FixSuggestion {
  hemistich: 'الصدر' | 'العجز';
  /** رقم التفعيلة. */
  foot: number;
  /** التفعيلة المطلوبة. */
  expected: string;
  pattern: string;
  /** ما ورد فعلاً في النصّ مكانها. */
  got: string;
  /** كلمات تملأ موضع الخلل بالوزن الصحيح. */
  words: { word: string; segments: string[]; source: string }[];
  hint: string;
}

/** اقتراح تصحيح لمواضع الكسر في بيت. */
export function suggestFixes(analysis: VerseAnalysis, limit = 8): FixSuggestion[] {
  const out: FixSuggestion[] = [];
  const scan = (feet: AnalyzedFoot[] | undefined, label: 'الصدر' | 'العجز') => {
    feet?.forEach((f, i) => {
      if (f.ok) return;
      const words = wordsForPattern(f.pattern, { limit }).map((w) => ({
        word: w.spoken,
        segments: w.segments,
        source: w.source,
      }));
      out.push({
        hemistich: label,
        foot: i + 1,
        expected: f.name,
        pattern: f.pattern,
        got: f.text,
        words,
        hint: hintFor(f),
      });
    });
  };
  scan(analysis.sadr?.feet, 'الصدر');
  scan(analysis.ajz?.feet, 'العجز');
  return out;
}

function hintFor(f: AnalyzedFoot): string {
  if (f.missing > 0)
    return `الموضع ينقصه ${f.missing} حرفاً؛ أضف كلمةً أو حرفاً متحركاً ليستقيم الوزن على (${f.name}).`;
  const actual = f.units.length;
  const need = f.pattern.length;
  if (actual > need)
    return `الموضع فيه ${actual - need} حرفاً زائداً؛ احذف أو استبدل ليستقيم على (${f.name}).`;
  return `رتّب الحركات والسكنات على صورة (${f.name}) — ${f.pattern
    .split('')
    .map((c) => (c === '1' ? 'متحرك' : 'ساكن'))
    .join(' ')}.`;
}

/* ------------------------------------------------------------------ */
/*                       إعادة صياغة الشطر المكسور                      */
/* ------------------------------------------------------------------ */

export interface Repair {
  /** الشطر بعد الإصلاح. */
  text: string;
  /** ما استُبدل: الكلمة القديمة والجديدة. */
  swaps: { from: string; to: string; foot: string }[];
  /** استقام الوزن بعد الإصلاح؟ */
  ok: boolean;
  meter: string | null;
}

/**
 * إعادة صياغة شطرٍ مكسور ليستقيم وزنه.
 *
 * لا يُعاد بناء الشطر من الصفر — فذلك يُذهب كلام الشاعر — بل تُستبدل
 * الكلمةُ التي وقع عندها الخلل بكلمةٍ من المعجم على الوزن المطلوب، وتُترك
 * سائرُ كلماته كما هي. ثم يُعاد تحليل الناتج للتحقّق، فلا يُعرض إصلاحٌ لم
 * يستقم.
 *
 * وهذا يحفظ الوزن لا المعنى؛ فالبديل يُقترح ليرى الشاعر ما يسدّ الموضع
 * وزناً، ثم يختار هو ما يوافق معناه ولهجته.
 */
export function repairHemistich(
  h: { text: string; feet: AnalyzedFoot[] } | null,
  reanalyze: (text: string) => { ok: boolean; meter: { name: string } | null },
  opts: { seed?: number; culprits?: { word: string; index: number; expected: string }[] } = {},
): Repair | null {
  if (!h || h.feet.every((f) => f.ok)) return null;
  const words = h.text.split(/\s+/).filter(Boolean);
  if (!words.length) return null;

  // ما يقتضيه الوزن من الحروف، وما في الشطر منها
  const required = h.feet.reduce((n, f) => n + f.pattern.length, 0);
  const found = h.feet.reduce((n, f) => n + f.units.length, 0);
  const delta = required - found; // موجب: ينقص الشطرَ حروف

  // مواضع الاستبدال: الكلمات التي وقع عندها الخلل
  const spots = (opts.culprits ?? [])
    .map((c) => ({ at: c.index - 1, expected: c.expected }))
    .filter((x) => x.at >= 0 && x.at < words.length);
  if (!spots.length) {
    h.feet.forEach((f, fi) => {
      if (f.ok) return;
      const at = f.units[0]?.word ?? fi;
      if (at >= 0 && at < words.length) spots.push({ at, expected: f.name });
    });
  }
  if (!spots.length) return null;

  const attempt = (draft: string[], from: string, to: string, foot: string): Repair | null => {
    const text = draft.join(' ');
    const back = reanalyze(text);
    if (!back.ok) return null;
    return { text, swaps: [{ from, to, foot }], ok: true, meter: back.meter?.name ?? null };
  };

  const byLength = patternsByLength();

  // ١) الاستبدال: كلمةٌ مكانَ كلمة، طولُها يسدّ الفرق
  for (const spot of spots) {
    const current = prosodicLength(words[spot.at]);
    if (!current) continue;
    const want = current + delta;
    if (want < 2) continue;
    const pool = (byLength.get(want) ?? []).slice(0, 300);
    let tried = 0;
    for (const entry of pool) {
      if (++tried > 120) break;
      for (const form of ['waqf', 'wasl', 'tanween'] as const) {
        const draft = [...words];
        const shown = spokenAs(entry, form);
        draft[spot.at] = shown;
        const r = attempt(draft, words[spot.at], shown, spot.expected);
        if (r) return r;
      }
    }
  }

  // ٢) الحذف: إن زاد الشطرُ على وزنه، فقد تكون فيه كلمةٌ مقحمة
  if (delta < 0) {
    const order = [...spots.map((x) => x.at), ...words.map((_, i) => i)];
    for (const at of order) {
      if (at < 0 || at >= words.length || words.length < 3) continue;
      const draft = words.filter((_, i) => i !== at);
      const r = attempt(draft, words[at], '(حُذفت)', 'حذف الزائد');
      if (r) return r;
    }
  }

  // ٣) الزيادة: إن نقص الشطرُ عن وزنه، فقد يحتاج كلمةً تسدّ الموضع
  if (delta > 0) {
    const pool = (byLength.get(delta) ?? []).slice(0, 200);
    const positions = [...new Set([...spots.map((x) => x.at), 0, words.length])];
    for (const at of positions) {
      let tried = 0;
      for (const entry of pool) {
        if (++tried > 90) break;
        for (const form of ['wasl', 'waqf'] as const) {
          const shown = spokenAs(entry, form);
          const draft = [...words.slice(0, at), shown, ...words.slice(at)];
          const r = attempt(draft, '(لا شيء)', shown, 'سدّ النقص');
          if (r) return r;
        }
      }
    }
  }

  return null;
}

/** طول الكلمة بالحروف العروضية في الوقف. */
function prosodicLength(word: string): number {
  const e = wordEntry(word);
  return e ? e.waqf.length : 0;
}

let lengthIndex: Map<number, LexEntry[]> | null = null;
/** المعجم مفهرساً بطول الكلمة، لاختيار بديلٍ يسدّ فرقاً معلوماً. */
function patternsByLength(): Map<number, LexEntry[]> {
  if (lengthIndex) return lengthIndex;
  const { byWaqf } = patternIndex();
  const m = new Map<number, LexEntry[]>();
  for (const [pat, list] of byWaqf) {
    const arr = m.get(pat.length) ?? [];
    for (const e of list) arr.push(e);
    m.set(pat.length, arr);
  }
  lengthIndex = m;
  return m;
}

function spokenAs(e: LexEntry, form: 'waqf' | 'wasl' | 'tanween'): string {
  if (form === 'waqf') return e.word;
  if (form === 'wasl') return addMark(e.word, 'ُ');
  return addMark(e.word, 'ٌ');
}

/**
 * شطرٌ يحتوي كلمةً بعينها على وزنٍ بعينه.
 *
 * يُطلب حين يقول المستخدم: «أعجبتني هذه الكلمة، أرِني كيف أستعملها في بيت».
 * تُثبَّت الكلمة في موضعٍ يوافق تقطيعَها من الوزن، ويُملأ ما حولها من المعجم.
 */
export function lineWithWord(
  meter: Meter,
  word: { word: string; spoken: string; waqf: string; wasl: string; tanween: string },
  opts: { seed?: number } = {},
): ComposedLine | null {
  const slots = meter.sadr;
  const rand = rng(opts.seed ?? 11);

  for (let attempt = 0; attempt < 40; attempt++) {
    const chosen = slots.map((slot) => {
      const idx = attempt < 3 ? 0 : Math.floor(rand() * slot.variants.length);
      return slot.variants[Math.min(idx, slot.variants.length - 1)];
    });
    const target = chosen.map((v) => v.pattern).join('');

    // مواضع الكلمة الممكنة في السلسلة، بصورها الثلاث
    const forms: [string, string][] = [
      [word.waqf, word.word],
      [word.wasl, addMark(word.word, 'ُ')],
      [word.tanween, addMark(word.word, 'ٌ')],
    ];
    for (const [pat, shown] of forms) {
      let at = target.indexOf(pat);
      while (at !== -1) {
        const head = target.slice(0, at);
        const tail = target.slice(at + pat.length);
        const isEnd = tail.length === 0;
        // الكلمة في آخر الشطر تُوقَف، وفي وسطه تُوصَل
        if (isEnd && pat !== word.waqf) {
          at = target.indexOf(pat, at + 1);
          continue;
        }
        const before = head ? tile(head, { seed: Math.floor(rand() * 1e6) }) : [];
        const after = tail ? tile(tail, { seed: Math.floor(rand() * 1e6) }) : [];
        if ((head && !before) || (tail && !after)) {
          at = target.indexOf(pat, at + 1);
          continue;
        }
        const parts = [
          ...(before ?? []).map((w) => w.spoken),
          shown,
          ...(after ?? []).map((w) => w.spoken),
        ];
        return {
          text: parts.join(' '),
          words: [],
          feet: chosen.map((v) => v.name),
          pattern: target,
        };
      }
    }
  }
  return null;
}

export interface RepairResult {
  sadr: Repair | null;
  ajz: Repair | null;
  /** الشطران بعد الإصلاح، مجموعين كما يُكتب البيت. */
  text: string | null;
  ok: boolean;
}

/**
 * إعادة صياغة بيتٍ مكسور ليستقيم وزنه على وزنه نفسه.
 *
 * تُستبدل الكلمةُ التي وقع عندها الخلل بكلمةٍ على الوزن المطلوب، ويُترك
 * سائرُ كلام الشاعر كما هو، ثم يُعاد التحليل للتحقّق. فما يُعرض قد قِيس.
 */
export function repairVerse(
  a: VerseAnalysis,
  opts: { seed?: number; pool?: Meter[] } = {},
): RepairResult {
  const none: RepairResult = { sadr: null, ajz: null, text: null, ok: false };
  if (a.ok || !a.meter) return none;
  const system = a.system === 'مخصّص' ? undefined : (a.system as ProsodySystemOf);
  // نتحقّق على أوزان الميزان كلها لا على أقربها وحده: غرضُ الشاعر أن
  // يستقيم بيته، فإن استقام على طَرقٍ مجاورٍ فذلك مقصودٌ يُخبَر به.
  const pool = opts.pool;
  const again = (text: string) => {
    const r = analyzeVerse(text, { pool, system });
    return { ok: r.ok, meter: r.meter };
  };
  const pick = (side: 'الصدر' | 'العجز') =>
    a.culprits.filter((c) => c.hemistich === side).map((c) => ({
      word: c.word,
      index: c.index,
      expected: c.expected,
    }));
  const sadr = repairHemistich(a.sadr, again, { ...opts, culprits: pick('الصدر') });
  const ajz = a.ajz ? repairHemistich(a.ajz, again, { ...opts, culprits: pick('العجز') }) : null;
  if (!sadr && !ajz) return none;

  const parts = [sadr?.text ?? a.sadr?.text, a.ajz ? (ajz?.text ?? a.ajz.text) : null].filter(
    Boolean,
  ) as string[];
  const text = parts.length ? parts.join(' … ') : null;
  const check = text ? analyzeVerse(text, { pool, system }) : null;
  return { sadr, ajz, text, ok: !!check?.ok };
}

/** اقتراح قوافٍ موافقة لرويّ معيّن. */
export function suggestRhymes(rawi: string, limit = 24) {
  return rhymeWords(rawi, { limit }).map((e) => ({
    word: e.word,
    segments: e.segments,
    source: e.source,
    pattern: e.waqf,
  }));
}

/** اقتراح شطر مكمّل على البحر نفسه وبالقافية نفسها. */
export function suggestCompletion(
  meter: Meter,
  rhyme?: string,
  seed = Date.now() % 100000,
): ComposedLine | null {
  return composeHemistich(meter, 'ajz', { seed, rhyme });
}
