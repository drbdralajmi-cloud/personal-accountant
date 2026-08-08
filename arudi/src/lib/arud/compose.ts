/**
 * التأليف الموزون والاقتراحات:
 *  - تبليط وزن الشطر بكلمات من المعجم لتوليد شطر صحيح الوزن.
 *  - اقتراح بدائل للكلمة التي كُسر بها الوزن.
 *  - اقتراح قوافٍ موافقة للرويّ.
 *
 * تنبيه: الأشطر المؤلَّفة صحيحةُ الوزن قطعاً، لكنها لا تدّعي معنًى شعرياً؛
 * وظيفتها التدريب على الإيقاع لا إنشاء الشعر.
 */

import { LexEntry, patternIndex, rhymeWords, wordsForPattern } from '../lexicon';
import { AnalyzedFoot, VerseAnalysis } from './analyze';
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
