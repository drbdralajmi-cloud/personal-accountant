/**
 * التحليل العروضي الكامل: من نصّ خام إلى بحر وتفعيلات وتقطيع ومواضع كسر.
 */

import { splitSyllables } from './feet';
import {
  formulaMeter,
  isVerbatim,
  letterBudget,
  LetterBudget,
  parseFormula,
  ParsedFormula,
} from './formula';
import { FootMatch, HemistichMatch, matchExact, matchNearest, scoreFit } from './matcher';
import { METERS, Meter, ProsodySystem, Slot } from './meters';
import { NABATI_METERS } from './nabati';
import {
  Dialect,
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
  /** الميزان الذي قِيس به النصّ — يُصرَّح به دائماً ولا يُترك ضِمناً. */
  system: ProsodySystem | 'مخصّص';
  /** عدد الحروف العروضية في النصّ (الصدر + العجز). */
  letters: number;
  /** الكلمات التي وقع عندها الخلل، مع سببه بلغةٍ مبسّطة. */
  culprits: Culprit[];
}

/**
 * الكلمة التي انكسر الوزن عندها.
 *
 * لا يكفي أن يقال «الشطر مكسور»؛ فالشاعر يحتاج أن يُشار إلى الكلمة بعينها
 * ويُقال له لماذا. فنردّ كل حرفٍ معيبٍ إلى كلمته، ثم نصف الخلل: أزائدٌ هو
 * أم ناقص، وأيّ تفعيلةٍ اضطربت.
 */
export interface Culprit {
  hemistich: 'الصدر' | 'العجز';
  /** الكلمة كما كتبها الشاعر. */
  word: string;
  /** ترتيبها في الشطر (يبدأ من 1). */
  index: number;
  /** رقم التفعيلة التي وقعت فيها. */
  foot: number;
  /** التفعيلة التي كان يقتضيها الوزن في موضعها. */
  expected: string;
  /** شرحٌ مبسّط بلا مصطلحات. */
  reason: string;
}

/** خيارات القياس: بأيّ ميزان، وعلى أيّ مجموعة أوزان. */
export interface AnalyzeOptions {
  /** الأوزان التي يُقاس عليها. الأصل: بحور الخليل. */
  pool?: Meter[];
  system?: ProsodySystem | 'مخصّص';
  /** لهجة النطق التي يُقرأ بها النصّ. النبطي يُقرأ خليجياً. */
  dialect?: Dialect;
}

const SEPARATOR = /\s*(?:\.{3,}|…|\*{2,}|\|+|\t+| {2,}| {3,}|—{1,}|={2,}|\/{2,})\s*/;

/** توليد كل الاحتمالات الصوتية لشطر (اختلاف الروي المطلق والمقيّد). */
function candidatesFor(text: string, dialect: Dialect): Unit[][] {
  const out = toUnits(text, { continued: false, dialect });
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

function buildConfigs(line: string, dialect: Dialect): Config[] {
  const configs: Config[] = [];
  const parts = line.split(SEPARATOR).filter((p) => p.trim());
  if (parts.length === 2) {
    configs.push({
      sadrText: parts[0].trim(),
      ajzText: parts[1].trim(),
      sadr: candidatesFor(parts[0], dialect),
      ajz: candidatesFor(parts[1], dialect),
      penalty: 0,
    });
    return configs;
  }

  const words = cleanText(line).split(' ').filter(Boolean);
  // احتمال أن يكون المُدخَل شطراً واحداً
  configs.push({
    sadrText: words.join(' '),
    ajzText: null,
    sadr: candidatesFor(words.join(' '), dialect),
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
        sadr: candidatesFor(a, dialect),
        ajz: candidatesFor(b, dialect),
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
export function analyzeVerse(line: string, opts: AnalyzeOptions = {}): VerseAnalysis {
  const pool = opts.pool ?? METERS;
  const system = opts.system ?? 'خليلي';
  const dialect: Dialect = opts.dialect ?? (system === 'نبطي' ? 'خليجي' : 'فصيح');
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
    system,
    letters: 0,
    culprits: [],
  };
  if (!input) return empty;

  const configs = buildConfigs(input, dialect);
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
    for (const meter of pool) {
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
    return buildResult(input, exactFits[0], exactFits, true, system);
  }

  // لا مطابقة تامّة: نبحث عن أقرب وزن ونحدّد مواضع الكسر.
  // ولكل بحرٍ تقسيمُه المناسب: المشطور يُقاس شطراً واحداً، وغيره شطرين.
  const singleCfg = configs.find((c) => c.ajz === null) ?? configs[0];
  const twoCfg = configs.find((c) => c.penalty === 0 && c.ajz) ?? configs.find((c) => c.ajz);
  const near: Fit[] = [];
  for (const meter of pool) {
    const cfg = meter.ajz.length ? (twoCfg ?? singleCfg) : singleCfg;
    const single = cfg.ajz === null || !meter.ajz.length;
    // النصّ غير المشكول يُقرأ بأكثر من وجه (الرويّ مطلقاً أو مقيّداً)،
    // فنجرّب الوجوه كلها ونأخذ أقربها إلى الوزن لا أوّلها.
    const best = (units: Unit[][], slots: Slot[]) =>
      units
        .map((u) => matchNearest(u, slots))
        .filter((m): m is HemistichMatch => !!m)
        .sort((a, b) => a.cost - b.cost)[0];
    const sm = best(cfg.sadr, meter.sadr);
    if (!sm) continue;
    const am = single ? null : best(cfg.ajz!, meter.ajz);
    if (!single && !am) continue;
    near.push({
      meter,
      config: cfg,
      sadr: sm,
      ajz: am,
      score: scoreFit(meter, single ? [sm] : [sm, am]) + cfg.penalty,
    });
  }
  if (!near.length) return empty;
  near.sort((a, b) => a.score - b.score);
  return buildResult(input, near[0], near, false, system);
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
  system: ProsodySystem | 'مخصّص',
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
  const culprits = [...blame(sadr, 'الصدر'), ...blame(ajz, 'العجز')];

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
    system,
    letters: sadr.binary.length + (ajz?.binary.length ?? 0),
    culprits,
  };
}

/**
 * ردّ الحروف المعيبة إلى كلماتها.
 *
 * كل وحدةٍ عروضية تحمل رقم كلمتها، فنجمع الوحدات المعيبة على كلماتها،
 * ثم نصف لكل كلمةٍ ما أصابها: أزادت حرفاً أم نقصت، وأيّ تفعيلةٍ اضطربت
 * عندها. وهذا ما يحتاجه الشاعر: أن يُشار إلى الكلمة لا إلى الشطر.
 */
function blame(h: AnalyzedHemistich | null, label: 'الصدر' | 'العجز'): Culprit[] {
  if (!h || h.ok) return [];
  const words = cleanText(h.text).split(' ').filter(Boolean);
  const out = new Map<number, Culprit>();

  h.feet.forEach((f, fi) => {
    if (f.ok) return;
    // مواضع الخلل داخل هذه التفعيلة، أو حروفها كلها إن كان الخلل نقصاً
    const marks = f.badUnits.length
      ? f.badUnits
      : f.units.map((_, k) => h.units.indexOf(f.units[k])).filter((i) => i >= 0);
    const wordIds = new Set<number>();
    for (const m of marks) {
      const u = h.units[m] ?? f.units.find((_, k) => k === 0);
      if (u) wordIds.add(u.word);
    }
    if (!wordIds.size && f.units.length) wordIds.add(f.units[0].word);

    for (const w of wordIds) {
      if (out.has(w)) continue;
      const word = words[w] ?? '';
      if (!word) continue;
      out.set(w, {
        hemistich: label,
        word,
        index: w + 1,
        foot: fi + 1,
        expected: f.name,
        reason:
          f.missing > 0
            ? `ينقص الوزنَ هنا ${f.missing} حرفاً: الموضع يقتضي (${f.name}) وما جاء أقصر منها. أطِل الكلمة أو أضِف قبلها كلمةً قصيرة.`
            : `ترتيب الحركات والسكنات في «${word}» يخالف ما يقتضيه الموضع، وهو (${f.name}). أبدِلها بكلمةٍ على وزنها.`,
      });
    }
  });

  return [...out.values()].sort((a, b) => a.index - b.index);
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
  const letters = sadr.binary.length + (ajz?.binary.length ?? 0);
  out.push(
    meter.system === 'نبطي'
      ? 'قِيس النصّ بميزان النبط: الطروق تُسمَّى بتفعيلاتها على التقريب، ويُتسامح فيها بالزحاف والإشباع.'
      : 'قِيس النصّ بعروض الخليل، وهو ميزان الشعر الفصيح: كل حرفٍ يُحسب، ولا تتغيّر التفعيلة إلا بزحافٍ معلوم.',
  );
  out.push(`كُتب النصّ كتابةً عروضية فصار: «${sadr.prosodic}»${ajz ? ` … «${ajz.prosodic}»` : ''}.`);
  out.push(
    `ثم رُمز لكل حرف: (/) للمتحرك و(°) للساكن، فنتج: ${sadr.symbols} — وجملتها ${letters} حرفاً عروضياً.`,
  );
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

export function analyzePoem(text: string, opts: AnalyzeOptions = {}): PoemAnalysis {
  const pool = opts.pool ?? METERS;
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  const verses = lines.map((l) => analyzeVerse(l, opts));
  const tally = new Map<string, number>();
  for (const v of verses) {
    if (v.meter && v.ok) tally.set(v.meter.id, (tally.get(v.meter.id) ?? 0) + 1);
  }
  let meter: Meter | null = null;
  let top = 0;
  for (const [id, n] of tally) {
    if (n > top) {
      top = n;
      meter = pool.find((m) => m.id === id) ?? null;
    }
  }
  return {
    verses,
    meter,
    soundCount: verses.filter((v) => v.ok).length,
    brokenCount: verses.filter((v) => !v.ok).length,
  };
}

/* ------------------------------------------------------------------ */
/*                  القياس بميزان النبط وبوزنٍ مُملىً                   */
/* ------------------------------------------------------------------ */

/** قياس النصّ على طروق النبط بدل بحور الخليل. */
export function analyzeNabati(line: string, opts: { dialect?: Dialect } = {}): VerseAnalysis {
  return analyzeVerse(line, {
    pool: NABATI_METERS,
    system: 'نبطي',
    dialect: opts.dialect ?? 'خليجي',
  });
}

export interface FormulaAnalysis {
  /** قراءة الوزن الذي أملاه المستخدم. */
  parsed: ParsedFormula;
  /** نتيجة القياس عليه، أو null إن تعذّرت قراءة الوزن. */
  analysis: VerseAnalysis | null;
  /** الحساب العدديّ: كم حرفاً يقتضيه الوزن وكم في النصّ. */
  budget: LetterBudget | null;
  /** حكمٌ مختصر بالعربية على مطابقة النصّ للوزن المطلوب. */
  verdict: string;
  /** وافق الوزنَ بحروفه كما كُتب، بلا زحافٍ ولا تسامح. */
  verbatim: boolean;
  /**
   * التشكيل الذي اضطُرّ إليه المحرّك ليستقيم الوزن، إن كان النصّ غير مشكول.
   * وهذا موضع تنبيهٍ لا تجاهل: قد يستقيم النصّ على الوزن بقراءةٍ لا يقرأ بها
   * صاحبُه، فيُظنّ الموافقة وليست بموافقة.
   */
  assumedReading: string | null;
}

/**
 * قياس نصٍّ على وزنٍ يُمليه المستخدم بالتفعيلات.
 *
 * هذه هي الإجابة النزيهة عن الخلاف في الأوزان: لا يجادل المحرّك في تسمية
 * الوزن، بل يقيس النصّ على الوزن الذي يُملى عليه، ويُظهر الحساب: هذا ما
 * يقتضيه وزنك من الحروف، وهذا ما في نصّك، وهذا موضع الفرق.
 */
export function analyzeAgainstFormula(
  line: string,
  formula: string,
  opts: { tolerant?: boolean; ishbaa?: boolean; single?: boolean } = {},
): FormulaAnalysis {
  const parsed = parseFormula(formula);
  const fail = (verdict: string): FormulaAnalysis => ({
    parsed,
    analysis: null,
    budget: null,
    verdict,
    verbatim: false,
    assumedReading: null,
  });

  if (!parsed.tokens.some((t) => t.ok)) {
    return fail(
      parsed.unknown.length
        ? `لم أعرف من الوزن: ${parsed.unknown.join('، ')}. اكتب التفعيلات بأسمائها المعروفة.`
        : 'اكتب وزناً بالتفعيلات، مثل: مستفعلن فاعلن مستفعلن فاعلن.',
    );
  }

  const meter = formulaMeter(parsed, {
    tolerant: opts.tolerant ?? false,
    ishbaa: opts.ishbaa ?? false,
    single: opts.single ?? false,
  });
  if (!meter) return fail('تعذّر بناء الوزن.');

  const analysis = analyzeVerse(line, { pool: [meter], system: 'مخصّص' });
  const perHemistich = analysis.shape === 'بيت';
  const where = perHemistich ? ' في الشطر' : '';
  const found = perHemistich ? (analysis.sadr?.binary.length ?? 0) : analysis.letters;
  const budget = letterBudget(parsed, found);

  // هل وافق كلُّ موضعٍ صورتَه المكتوبة، أم احتاج زحافاً ليستقيم؟
  const known = parsed.tokens.filter((t) => t.ok);
  const matched = analysis.sadr?.feet ?? [];
  const verbatim =
    analysis.ok &&
    matched.length === known.length &&
    matched.every((f, i) => isVerbatim(known[i], f.pattern));

  // النصّ غير المشكول يَحسِم المحرّكُ حركاتِه بما يقتضيه الوزن، فقد يستقيم
  // على قراءةٍ لا يقرأ بها صاحبه. نُظهرها له ليحكم بنفسه.
  const bare = !/[ً-ْ]/.test(line);
  const assumedReading = bare && analysis.ok ? (analysis.sadr?.prosodic ?? null) : null;

  let verdict: string;
  if (verbatim) {
    verdict = `النصّ موافقٌ للوزن الذي أمليتَه حرفاً بحرف: ${parsed.normalized}.`;
  } else if (analysis.ok) {
    const changes = matched
      .filter((f, i) => !isVerbatim(known[i], f.pattern))
      .map((f) => f.name)
      .join('، ');
    verdict = `النصّ يستقيم على الوزن بعد زحافٍ في: ${changes} — لا على صورته المكتوبة.`;
  } else if (budget.delta === 0) {
    verdict = `عددُ الحروف موافق (${budget.found}) لكنّ ترتيب الحركات والسكنات يخالف الوزن في ${analysis.issues.length} موضعاً.`;
  } else if (budget.delta < 0) {
    verdict = `الوزن يقتضي ${budget.requiredMin} حرفاً${where}، وفي النصّ ${budget.found} — فينقصه ${Math.abs(budget.delta)} حرفاً.`;
  } else {
    verdict = `الوزن يقتضي ${budget.requiredMax} حرفاً${where}، وفي النصّ ${budget.found} — فيزيد عليه ${budget.delta} حرفاً.`;
  }

  return { parsed, analysis, budget, verdict, verbatim, assumedReading };
}

export interface SystemComparison {
  /** عدد الحروف العروضية في النصّ — الرقم الذي يُحتكم إليه. */
  letters: number;
  khalili: VerseAnalysis;
  nabati: VerseAnalysis;
  /** هل اختلف الميزانان في الحكم؟ */
  differs: boolean;
}

/**
 * قياس النصّ بالميزانين معاً وعرضهما جنباً إلى جنب.
 * فقد يكون البيت مكسوراً في الفصيح مستقيماً في النبط — وكلا الحكمين صحيح
 * في بابه، والخطأ إنما هو في الخلط بينهما.
 */
export function compareSystems(line: string): SystemComparison {
  const khalili = analyzeVerse(line);
  const nabati = analyzeNabati(line);
  return {
    letters: khalili.letters,
    khalili,
    nabati,
    differs: khalili.meter?.name !== nabati.meter?.name || khalili.ok !== nabati.ok,
  };
}
