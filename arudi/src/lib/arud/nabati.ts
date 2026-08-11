/**
 * محرّك الشعر النبطي: يحوّل قاعدة الطروق إلى أوزانٍ يقيس عليها المحرّك،
 * ويشتقّ من كل صيغةٍ ما يُشتقّ منها حساباً — الرمز، وعدد الحروف، وعدد
 * المقاطع، وتقطيعها، وصور التفعيلات الجائزة.
 *
 * ═══ الفرق بين ميزان النبط وميزان الخليل ═══
 *
 * عروض الخليل يقيس بالحرف: التفعيلة سلسلةٌ من الحروف لا تزيد ولا تنقص
 * إلا بزحافٍ معلومٍ محصور، فقولك «مستفعلن» يعني سبعة أحرفٍ بأعيانها.
 *
 * وأما النبط فأوزانه «طُرُق» و«ألحان» قبل أن تكون تفعيلات؛ يُنشئ الشاعر
 * على لحنٍ يحفظه، ثم يسمّي وزنه بتفعيلاتٍ تقارب اللحن ولا تنطبق عليه
 * انطباق الحرف على الحرف. ولذلك:
 *   • تختلف التسمية باختلاف المناطق والرواة.
 *   • يجري في الإلقاء إشباعٌ ومدٌّ واختلاسٌ لا يسجّله العروض الخليلي.
 *   • التشكيل يتبع اللهجة لا الإعراب، فسكون أواخر الكلم هو الأصل.
 *
 * ولذلك نوسّع في قياس النبط بابين لا يُوسَّعان في الفصيح: الزحاف في كل
 * موضع، والإشباع في آخر الشطر. ونقرأ النصّ بالنطق الخليجي لا الفصيح.
 */

import { NABATI_METERS_DATA, NabatiMeterData } from '@/data/nabati';
import { analyzeNabati } from './analyze';
import { splitSyllables, SYLLABLE_LABEL } from './feet';
import { formulaMeter, parseFormula, ParsedFormula } from './formula';
import { Meter } from './meters';

export type { Attested, Difficulty, NabatiMeterData } from '@/data/nabati';
export { NABATI_REGIONS, DIFFICULTIES } from '@/data/nabati';

/* ------------------------------------------------------------------ */
/*                  ما يُشتقّ من الصيغة حساباً                          */
/* ------------------------------------------------------------------ */

export interface SyllableFact {
  pattern: string;
  label: string;
  /** رمزه للعرض: / للمتحرك و° للساكن. */
  symbol: string;
}

export interface FootFact {
  name: string;
  pattern: string;
  symbol: string;
  letters: number;
  syllables: SyllableFact[];
}

/** الطَّرق بعد إضافة كل ما يُحسب من صيغته. */
export interface Tariq extends NabatiMeterData {
  /** الصيغة معادَ كتابتها مشكولةً. */
  formulaVocalized: string;
  /** التمثيل الرمزي للشطر: 1 متحرك، 0 ساكن. */
  pattern: string;
  symbol: string;
  /** عدد الحروف العروضية في الشطر. */
  letters: number;
  /** عدد الحروف في البيت كله. */
  lineLetters: number;
  /** عدد المقاطع في الشطر. */
  syllableCount: number;
  syllables: SyllableFact[];
  feet: FootFact[];
  ajz: {
    formulaVocalized: string;
    pattern: string;
    letters: number;
    feet: FootFact[];
  } | null;
}

const symbolOf = (p: string) => p.replace(/1/g, '/').replace(/0/g, '°');

const syllablesOf = (pattern: string): SyllableFact[] =>
  splitSyllables(pattern).map((s) => ({
    pattern: s,
    label: SYLLABLE_LABEL[s] ?? s,
    symbol: symbolOf(s),
  }));

function feetOf(parsed: ParsedFormula): FootFact[] {
  return parsed.tokens
    .filter((t) => t.ok)
    .map((t) => {
      const o = t.options[0];
      return {
        name: o.name,
        pattern: o.pattern,
        symbol: symbolOf(o.pattern),
        letters: o.pattern.length,
        syllables: syllablesOf(o.pattern),
      };
    });
}

function enrich(d: NabatiMeterData): Tariq {
  const parsed = parseFormula(d.formula);
  if (!parsed.ok) {
    throw new Error(`صيغة الطَّرق «${d.name}» غير مقروءة: ${parsed.unknown.join('، ')}`);
  }
  const ajzParsed = d.ajzFormula ? parseFormula(d.ajzFormula) : null;
  if (ajzParsed && !ajzParsed.ok) {
    throw new Error(`صيغة عجز «${d.name}» غير مقروءة: ${ajzParsed.unknown.join('، ')}`);
  }

  const letters = parsed.pattern.length;
  const ajzLetters = ajzParsed ? ajzParsed.pattern.length : letters;

  return {
    ...d,
    formulaVocalized: parsed.normalized,
    pattern: parsed.pattern,
    symbol: symbolOf(parsed.pattern),
    letters,
    lineLetters: d.halves === 1 ? letters : letters + ajzLetters,
    syllableCount: splitSyllables(parsed.pattern).length,
    syllables: syllablesOf(parsed.pattern),
    feet: feetOf(parsed),
    ajz:
      d.halves === 1
        ? null
        : {
            formulaVocalized: (ajzParsed ?? parsed).normalized,
            pattern: (ajzParsed ?? parsed).pattern,
            letters: ajzLetters,
            feet: feetOf(ajzParsed ?? parsed),
          },
  };
}

export const TURUQ: Tariq[] = NABATI_METERS_DATA.map(enrich);

export const tariqBySlug = (slug: string): Tariq | undefined =>
  TURUQ.find((t) => t.slug === slug);

export const tariqLetters = (t: { pattern: string }) => t.pattern.length;

/* ------------------------------------------------------------------ */
/*                    بناء الأوزان التي يُقاس عليها                     */
/* ------------------------------------------------------------------ */

export const NABATI_METERS: Meter[] = TURUQ.map((t) => {
  const parsed = parseFormula(t.formula);
  const meter = formulaMeter(parsed, {
    tolerant: true,
    ishbaa: true,
    single: t.halves === 1,
    id: `nabati-${t.id}`,
    slug: t.slug,
    name: t.name,
  });
  if (!meter) throw new Error(`تعذّر بناء طَرق ${t.name} من صيغته: ${t.formula}`);
  return {
    ...meter,
    system: 'نبطي' as const,
    family: 'طروق النبط',
    key: t.formulaVocalized,
    formula: t.formulaVocalized,
    description: t.description,
    tone: t.tone,
    frequency: t.frequency,
  };
});

export const nabatiMeterBySlug = (slug: string) => NABATI_METERS.find((m) => m.slug === slug);

/* ------------------------------------------------------------------ */
/*                          البحث في الطروق                            */
/* ------------------------------------------------------------------ */

export interface TariqQuery {
  /** نصّ حرّ: اسم الطَّرق، أو جزء من تفعيلة، أو اسم بلد. */
  q?: string;
  /** عدد المقاطع في الشطر. */
  syllables?: number;
  /** عدد الحروف في الشطر. */
  letters?: number;
  difficulty?: string;
  region?: string;
}

const bare = (s: string) =>
  s
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .trim();

/**
 * بحثٌ في الطروق باسمها أو بجزءٍ من تفعيلاتها أو بعدد مقاطعها أو بالبلد.
 * ويُطابَق النصّ الحرّ على: الاسم، والأسماء المتداولة، والصيغة، والوصف.
 */
export function searchTuruq(query: TariqQuery): Tariq[] {
  const q = query.q ? bare(query.q) : '';
  return TURUQ.filter((t) => {
    if (query.syllables && t.syllableCount !== query.syllables) return false;
    if (query.letters && t.letters !== query.letters) return false;
    if (query.difficulty && t.difficulty !== query.difficulty) return false;
    if (query.region && !t.regions.includes(query.region)) return false;
    if (!q) return true;
    const hay = [
      t.name,
      ...t.aliases.map((a) => a.name),
      ...t.aliases.map((a) => a.where),
      t.formula,
      t.formulaVocalized,
      t.description,
      t.tone,
      ...t.regions,
      ...t.feet.map((f) => f.name),
    ]
      .map(bare)
      .join(' | ');
    return hay.includes(q);
  }).sort((a, b) => b.frequency - a.frequency);
}

/**
 * البحث بالبيت أو الشطر: يُقاس النصّ على الطروق كلها، وتُعاد مرتّبةً
 * بأقربها إليه. فيسأل المستخدم «على أيّ وزنٍ هذا البيت؟» فيُجاب بقائمةٍ
 * مرتّبة لا بحكمٍ واحد، ويرى بنفسه كم بَعُد كلُّ طَرقٍ عن نصّه.
 */
export interface VerseMatch {
  tariq: Tariq;
  /** استقام عليه تماماً؟ */
  ok: boolean;
  confidence: number;
  /** التفعيلات كما وقعت فعلاً. */
  feet: string[];
  /** حروف النصّ مقابل ما يقتضيه الطَّرق. */
  letters: number;
  required: number;
}

export function matchVerseToTuruq(text: string, limit = 6): VerseMatch[] {
  const a = analyzeNabati(text);
  const byName = new Map(a.candidates.map((c) => [c.slug, c]));
  const found = a.meter?.slug;

  return TURUQ.map((t) => {
    const c = byName.get(t.slug);
    return {
      tariq: t,
      ok: a.ok && t.slug === found,
      confidence: c ? c.confidence : 0,
      feet: t.slug === found ? (a.sadr?.feet.map((f) => f.name) ?? []) : [],
      letters: a.shape === 'بيت' ? Math.round(a.letters / 2) : a.letters,
      required: t.letters,
    };
  })
    .sort((x, y) => {
      if (x.ok !== y.ok) return x.ok ? -1 : 1;
      if (y.confidence !== x.confidence) return y.confidence - x.confidence;
      // ثم الأقرب عدداً في الحروف
      return Math.abs(x.required - x.letters) - Math.abs(y.required - y.letters);
    })
    .slice(0, limit);
}

/** الطروق التي تشترك في تفعيلةٍ بعينها — «أرِني كل طَرقٍ فيه فاعلاتن». */
export const turuqWithFoot = (footPattern: string): Tariq[] =>
  TURUQ.filter((t) => t.feet.some((f) => f.pattern === footPattern));

/** القوالب (التفعيلات) المستعملة في النبط، بعدد الطروق التي تدخلها. */
export function nabatiFeetUsage(): { name: string; pattern: string; turuq: string[] }[] {
  const map = new Map<string, { name: string; pattern: string; turuq: string[] }>();
  for (const t of TURUQ) {
    for (const f of t.feet) {
      const row = map.get(f.pattern) ?? { name: f.name, pattern: f.pattern, turuq: [] };
      if (!row.turuq.includes(t.name)) row.turuq.push(t.name);
      map.set(f.pattern, row);
    }
  }
  return [...map.values()].sort((a, b) => b.turuq.length - a.turuq.length);
}
