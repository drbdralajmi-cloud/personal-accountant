/**
 * التحليل العروضي الكامل: من نصّ خام إلى بحر وتفعيلات وتقطيع ومواضع كسر.
 */

import { splitSyllables } from './feet';
import { FootMatch, HemistichMatch, matchExact, matchNearest, scoreFit } from './matcher';
import { METERS, Meter } from './meters';
import {
  Unit,
  cleanText,
  mark,
  toUnits,
  unitsToBinary,
  unitsToSymbols,
  unitsToText,
} from './prosodic';
import { analyzeRhyme, RhymeInfo } from './rhyme';

export interface AnalyzedFoot {
  role: string;
  base: string;
  /** اسم التفعيلة كما وردت فعلاً (بعد الزحاف). */
  name: string;
  /** اسم التغيير: سالمة / القبض / الخبن ... */
  change: string;
  pattern: string;
  /** الحروف التي وقعت في هذه التفعيلة. */
  text: string;
  units: Unit[];
  ok: boolean;
  badUnits: number[];
  missing: number;
}

export interface AnalyzedHemistich {
  /** النصّ كما أدخله المستخدم. */
  text: string;
  /** النصّ بالكتابة العروضية. */
  prosodic: string;
  binary: string;
  symbols: string;
  syllables: string[];
  feet: AnalyzedFoot[];
  units: Unit[];
  /** مؤشّرات الوحدات المعيبة. */
  bad: number[];
  ok: boolean;
}

export interface Issue {
  kind: 'كسر' | 'زيادة' | 'نقص' | 'تنبيه';
  hemistich: 'الصدر' | 'العجز' | 'البيت';
  /** رقم التفعيلة (يبدأ من 1). */
  foot?: number;
  message: string;
  /** ما كان ينبغي أن يكون. */
  expected?: string;
  got?: string;
}

export interface MeterCandidate {
  meter: string;
  slug: string;
  formula: string;
  score: number;
  exact: boolean;
  confidence: number;
}

export interface VerseAnalysis {
  input: string;
  /** موزون تماماً؟ */
  ok: boolean;
  meter: Meter | null;
  confidence: number;
  sadr: AnalyzedHemistich | null;
  ajz: AnalyzedHemistich | null;
  candidates: MeterCandidate[];
  issues: Issue[];
  explanation: string[];
  rhyme: RhymeInfo | null;
  /** هل قُسّم البيت إلى شطرين أم عومل شطراً واحداً؟ */
  shape: 'بيت' | 'شطر';
}

const SEPARATOR = /\s*(?:\.{3,}|…|\*{2,}|\|+|\t+| {2,}| {3,}|—{1,}|={2,}|\/{2,})\s*/;

/** توليد كل الاحتمالات الصوتية لشطر (اختلاف الروي المطلق والمقيّد). */
function candidatesFor(text: string): Unit[][] {
  const out = toUnits(text, { continued: false });
  const seen = new Set<string>();
  const uniq: Unit[][] = [];
  for (const u of out) {
    const k = unitsToBinary(u) + '|' + u.length;
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(u);
  }
  return uniq;
}

interface Config {
  sadrText: string;
  ajzText: string | null;
  sadr: Unit[][];
  ajz: Unit[][] | null;
  /** أفضلية التقسيم: 0 للفاصل الصريح. */
  penalty: number;
}

function buildConfigs(line: string): Config[] {
  const configs: Config[] = [];
  const parts = line.split(SEPARATOR).filter((p) => p.trim());
  if (parts.length === 2) {
    configs.push({
      sadrText: parts[0].trim(),
      ajzText: parts[1].trim(),
      sadr: candidatesFor(parts[0]),
      ajz: candidatesFor(parts[1]),
      penalty: 0,
    });
    return configs;
  }

  const words = cleanText(line).split(' ').filter(Boolean);
  // احتمال أن يكون المُدخَل شطراً واحداً
  configs.push({
    sadrText: words.join(' '),
    ajzText: null,
    sadr: candidatesFor(words.join(' ')),
    ajz: null,
    penalty: 0.4,
  });

  if (words.length >= 4) {
    const lengths = words.map((w) => w.length);
    const total = lengths.reduce((a, b) => a + b, 0);
    let acc = 0;
    for (let i = 1; i < words.length; i++) {
      acc += lengths[i - 1];
      const ratio = acc / total;
      if (ratio < 0.32 || ratio > 0.68) continue;
      const a = words.slice(0, i).join(' ');
      const b = words.slice(i).join(' ');
      configs.push({
        sadrText: a,
        ajzText: b,
        sadr: candidatesFor(a),
        ajz: candidatesFor(b),
        penalty: Math.abs(ratio - 0.5) * 1.2,
      });
    }
  }
  return configs;
}

function toAnalyzed(text: string, m: HemistichMatch): AnalyzedHemistich {
  const bad = new Set<number>();
  const feet: AnalyzedFoot[] = m.feet.map((f: FootMatch) => {
    f.badUnits.forEach((b) => bad.add(b));
    return {
      role: f.role,
      base: f.base,
      name: f.variant.name,
      change: f.variant.change,
      pattern: f.variant.pattern,
      text: f.units.map((u, k) => u.letter + mark(u, f.units[k - 1])).join(''),
      units: f.units,
      ok: f.ok,
      badUnits: f.badUnits,
      missing: f.missing,
    };
  });
  return {
    text,
    prosodic: unitsToText(m.units),
    binary: unitsToBinary(m.units),
    symbols: unitsToSymbols(m.units),
    syllables: splitSyllables(unitsToBinary(m.units).replace(/\?/g, '1')),
    feet,
    units: m.units,
    bad: [...bad].sort((a, b) => a - b),
    ok: m.exact && feet.every((f) => f.ok),
  };
}

/** تحليل بيت واحد أو شطر. */
export function analyzeVerse(line: string): VerseAnalysis {
  const input = line.trim();
  const empty: VerseAnalysis = {
    input,
    ok: false,
    meter: null,
    confidence: 0,
    sadr: null,
    ajz: null,
    candidates: [],
    issues: [{ kind: 'تنبيه', hemistich: 'البيت', message: 'لم يُدخَل نصّ للتحليل.' }],
    explanation: [],
    rhyme: null,
    shape: 'شطر',
  };
  if (!input) return empty;

  const configs = buildConfigs(input);
  if (!configs.length || !configs[0].sadr.length) return empty;

  interface Fit {
    meter: Meter;
    config: Config;
    sadr: HemistichMatch;
    ajz: HemistichMatch | null;
    score: number;
  }

  const exactFits: Fit[] = [];

  for (const cfg of configs) {
    for (const meter of METERS) {
      const single = cfg.ajz === null;
      // الشطر الواحد يُقاس بالصدر، إلا في المشطور فيقاس بما عُرّف له
      const sadrSlots = meter.sadr;
      const ajzSlots = meter.ajz;
      if (!single && !ajzSlots.length) continue; // مشطور لا شطرين له
      for (const su of cfg.sadr) {
        const sm = matchExact(su, sadrSlots);
        if (!sm) continue;
        if (single) {
          exactFits.push({
            meter,
            config: cfg,
            sadr: sm,
            ajz: null,
            score: scoreFit(meter, [sm]) + cfg.penalty,
          });
          continue;
        }
        for (const au of cfg.ajz!) {
          const am = matchExact(au, ajzSlots);
          if (!am) continue;
          exactFits.push({
            meter,
            config: cfg,
            sadr: sm,
            ajz: am,
            score: scoreFit(meter, [sm, am]) + cfg.penalty,
          });
        }
      }
    }
  }

  if (exactFits.length) {
    exactFits.sort((a, b) => a.score - b.score);
    return buildResult(input, exactFits[0], exactFits, true);
  }

  // لا مطابقة تامّة: نبحث عن أقرب وزن ونحدّد مواضع الكسر
  const base = configs.find((c) => c.penalty === 0 && c.ajz) ?? configs[0];
  const near: Fit[] = [];
  for (const meter of METERS) {
    const single = base.ajz === null;
    if (!single && !meter.ajz.length) continue;
    const sm = matchNearest(base.sadr[0], meter.sadr);
    if (!sm) continue;
    const am = single ? null : matchNearest(base.ajz![0], meter.ajz);
    if (!single && !am) continue;
    near.push({
      meter,
      config: base,
      sadr: sm,
      ajz: am,
      score: scoreFit(meter, single ? [sm] : [sm, am]),
    });
  }
  if (!near.length) return empty;
  near.sort((a, b) => a.score - b.score);
  return buildResult(input, near[0], near, false);
}

function buildResult(
  input: string,
  best: {
    meter: Meter;
    config: Config;
    sadr: HemistichMatch;
    ajz: HemistichMatch | null;
    score: number;
  },
  all: { meter: Meter; score: number; sadr: HemistichMatch; ajz: HemistichMatch | null }[],
  exact: boolean,
): VerseAnalysis {
  const sadr = toAnalyzed(best.config.sadrText, best.sadr);
  const ajz = best.ajz ? toAnalyzed(best.config.ajzText!, best.ajz) : null;

  const issues: Issue[] = [];
  const collect = (h: AnalyzedHemistich | null, label: 'الصدر' | 'العجز') => {
    if (!h) return;
    h.feet.forEach((f, i) => {
      if (f.ok) return;
      if (f.missing > 0) {
        issues.push({
          kind: 'نقص',
          hemistich: label,
          foot: i + 1,
          message: `نقص ${f.missing} حرفاً في التفعيلة ${i + 1} (${f.name}).`,
          expected: f.pattern,
          got: f.units.map((u) => (u.state === null ? '?' : u.state)).join(''),
        });
      } else {
        issues.push({
          kind: 'كسر',
          hemistich: label,
          foot: i + 1,
          message: `خلل في التفعيلة ${i + 1}: الوزن يقتضي (${f.name}).`,
          expected: f.pattern,
          got: f.units.map((u) => (u.state === null ? '?' : u.state)).join(''),
        });
      }
    });
  };
  collect(sadr, 'الصدر');
  collect(ajz, 'العجز');

  const seen = new Set<string>();
  const candidates: MeterCandidate[] = [];
  const bestScore = all[0].score;
  for (const f of all) {
    if (seen.has(f.meter.id)) continue;
    seen.add(f.meter.id);
    candidates.push({
      meter: f.meter.name,
      slug: f.meter.slug,
      formula: f.meter.formula,
      score: Number(f.score.toFixed(2)),
      exact,
      confidence: Number(Math.max(0, 100 - (f.score - bestScore) * 22).toFixed(0)),
    });
    if (candidates.length >= 6) break;
  }

  const ok = exact && issues.length === 0;
  const confidence = ok
    ? Math.min(99, 82 + (candidates.length > 1 ? 0 : 12) + best.meter.frequency)
    : Math.max(20, 70 - issues.length * 9);

  const rhyme = analyzeRhyme(ajz?.text ?? sadr.text);

  return {
    input,
    ok,
    meter: best.meter,
    confidence,
    sadr,
    ajz,
    candidates,
    issues,
    explanation: explain(best.meter, sadr, ajz, ok, issues),
    rhyme,
    shape: ajz ? 'بيت' : 'شطر',
  };
}

/** شرح سبب النتيجة بلغة مفهومة. */
function explain(
  meter: Meter,
  sadr: AnalyzedHemistich,
  ajz: AnalyzedHemistich | null,
  ok: boolean,
  issues: Issue[],
): string[] {
  const out: string[] = [];
  out.push(`كُتب النصّ كتابةً عروضية فصار: «${sadr.prosodic}»${ajz ? ` … «${ajz.prosodic}»` : ''}.`);
  out.push(`ثم رُمز لكل حرف: (/) للمتحرك و(°) للساكن، فنتج: ${sadr.symbols}`);
  if (ok) {
    out.push(`طابقت السلسلة وزن بحر ${meter.name}: ${meter.formula}.`);
  } else {
    out.push(`أقرب وزن إلى النصّ هو بحر ${meter.name}: ${meter.formula}، مع ${issues.length} موضع خلل.`);
  }

  const describe = (h: AnalyzedHemistich, label: string) => {
    const changed = h.feet.filter((f) => f.change !== 'سالمة' && f.role === 'حشو');
    if (changed.length) {
      const list = changed.map((f) => `${f.name} (${f.change})`).join('، ');
      out.push(`دخلت الحشوَ في ${label} زحافاتٌ جائزة: ${list}.`);
    }
    const arud = h.feet.find((f) => f.role === 'عروض' || f.role === 'ضرب');
    if (arud) {
      out.push(
        `${arud.role === 'عروض' ? 'عروض البيت' : 'ضرب البيت'} ${arud.name}${
          arud.change !== 'سالمة' ? ` — ${arud.change}` : ' — صحيحة'
        }.`,
      );
    }
  };
  describe(sadr, 'الصدر');
  if (ajz) describe(ajz, 'العجز');

  if (!ok) {
    for (const i of issues.slice(0, 4)) {
      out.push(`${i.hemistich}: ${i.message}`);
    }
  }
  return out;
}

/** تحليل نصّ متعدّد الأبيات. */
export interface PoemAnalysis {
  verses: VerseAnalysis[];
  /** البحر الغالب على القصيدة. */
  meter: Meter | null;
  soundCount: number;
  brokenCount: number;
}

export function analyzePoem(text: string): PoemAnalysis {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const verses = lines.map(analyzeVerse);
  const tally = new Map<string, number>();
  for (const v of verses) {
    if (v.meter && v.ok) tally.set(v.meter.id, (tally.get(v.meter.id) ?? 0) + 1);
  }
  let meter: Meter | null = null;
  let top = 0;
  for (const [id, n] of tally) {
    if (n > top) {
      top = n;
      meter = METERS.find((m) => m.id === id) ?? null;
    }
  }
  return {
    verses,
    meter,
    soundCount: verses.filter((v) => v.ok).length,
    brokenCount: verses.filter((v) => !v.ok).length,
  };
}
