/**
 * قراءة وزنٍ مكتوب بالتفعيلات، وبناء بحرٍ منه للقياس عليه.
 *
 * الغرض: أن يقول المستخدم «هذا البيت عندي على: مستفعلن فاعلن مستفعلن فاعلن»
 * فيقيس المحرّكُ النصَّ على ذلك الوزن بعينه، ويُري الحسابَ حرفاً بحرف —
 * كم حرفاً يقتضيه الوزن، وكم حرفاً في النصّ، وأين يقع الفرق. فالحكم على
 * الوزن يصير حساباً ظاهراً لا دعوى.
 *
 * ويُستعمل هذا أيضاً في بناء طروق النبط، فإنّ أوزانها تُسمَّى بتفعيلاتها.
 */

import { FEET, FEET_LIST, FootId, FootVariant } from './feet';
import { Meter, Slot, SlotRole } from './meters';
import { stripHarakat, TEMPLATES } from './templates';

export interface FormulaOption {
  pattern: string;
  name: string;
  foot: FootId;
}

export interface FormulaToken {
  /** كما كتبه المستخدم. */
  raw: string;
  /** الصور التي يحتملها هذا الاسم (الاسم غير المشكول قد يحتمل صورتين). */
  options: FormulaOption[];
  ok: boolean;
}

export interface ParsedFormula {
  ok: boolean;
  input: string;
  tokens: FormulaToken[];
  /** الأسماء التي لم يعرفها المحرّك. */
  unknown: string[];
  /** الرمز المطلوب على الاختيار الأوّل من كل تفعيلة. */
  pattern: string;
  /** أقلّ وأكثر ما يقتضيه الوزن من الحروف. */
  minLetters: number;
  maxLetters: number;
  /** صيغة معاد كتابتها مشكولةً. */
  normalized: string;
}

/* ------------------------------------------------------------------ */
/*                            الفهرسة                                  */
/* ------------------------------------------------------------------ */

const normalize = (s: string) =>
  stripHarakat(s)
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, '')
    .trim();

/** فهرسان: الأول للأسماء المشكولة (يرفع اللبس)، والثاني للمجرّدة. */
const exactIndex = new Map<string, FormulaOption>();
const looseIndex = new Map<string, FormulaOption[]>();

function register(name: string, pattern: string, foot: FootId) {
  const clean = name.trim();
  if (!clean) return;
  // الأسماء في الجداول قد تحمل مرادفاً بين قوسين: «مُتَفْعِلُنْ (مَفَاعِلُنْ)»
  const parts = clean
    .split(/[()]/)
    .map((p) => p.trim())
    .filter(Boolean);
  for (const part of parts) {
    const opt: FormulaOption = { pattern, name: part, foot };
    const withHarakat = part.replace(/\s+/g, '');
    if (/[ً-ْ]/.test(part) && !exactIndex.has(withHarakat)) exactIndex.set(withHarakat, opt);
    const key = normalize(part);
    if (!key) continue;
    const list = looseIndex.get(key) ?? [];
    if (!list.some((o) => o.pattern === pattern)) list.push(opt);
    looseIndex.set(key, list);
  }
}

// القوالب أولاً: أسماؤها أدقّ وأشهر
for (const t of TEMPLATES) {
  const foot = FEET_LIST.find((f) => f.slug === t.slug)?.id ?? t.origins[0]?.foot ?? 'failun';
  register(t.name, t.pattern, foot);
  for (const alias of t.aliases) register(alias, t.pattern, foot);
}
// ثم كل صور التفعيلات (زحافاً وعلّة) لتُقبَل أسماؤها كلها
for (const foot of FEET_LIST) {
  register(foot.name, foot.pattern, foot.id);
  for (const v of [...foot.zihafat, ...foot.ilal]) register(v.name, v.pattern, foot.id);
}

/** كل الأسماء المعروفة، للعرض في واجهة الإدخال. */
export const KNOWN_FEET_NAMES = TEMPLATES.map((t) => t.name);

/* ------------------------------------------------------------------ */
/*                             التحليل                                 */
/* ------------------------------------------------------------------ */

/** التفعيلتان ذواتا الوتد المفروق تُكتبان مفصولتين في الكتب. */
const JOINED: [RegExp, string][] = [
  [/مستفع\s+لن/g, 'مستفعلن'],
  [/مُسْتَفْعِ\s+لُنْ/g, 'مُسْتَفْعِلُنْ'],
  [/فاع\s+لاتن/g, 'فاعلاتن'],
  [/فَاعِ\s+لَاتُنْ/g, 'فَاعِلَاتُنْ'],
];

export function parseFormula(input: string): ParsedFormula {
  let text = (input ?? '').trim();
  for (const [re, to] of JOINED) text = text.replace(re, to);
  const raws = text.split(/[\s،,+·/|—–-]+/).filter(Boolean);

  const tokens: FormulaToken[] = [];
  const unknown: string[] = [];

  for (const raw of raws) {
    // تكرار مختصر: «فاعلن ×4» أو «فاعلن x4»
    const rep = raw.match(/^[×xX*](\d+)$/);
    if (rep && tokens.length) {
      const times = Math.min(12, Number(rep[1]));
      const last = tokens[tokens.length - 1];
      for (let i = 1; i < times; i++) tokens.push({ ...last, options: [...last.options] });
      continue;
    }
    const compact = raw.replace(/\s+/g, '');
    const exact = exactIndex.get(compact);
    if (exact) {
      tokens.push({ raw, options: [exact], ok: true });
      continue;
    }
    const loose = looseIndex.get(normalize(raw));
    if (loose && loose.length) {
      tokens.push({ raw, options: loose, ok: true });
      continue;
    }
    unknown.push(raw);
    tokens.push({ raw, options: [], ok: false });
  }

  const known = tokens.filter((t) => t.ok);
  const pattern = known.map((t) => t.options[0].pattern).join('');
  const minLetters = known.reduce(
    (s, t) => s + Math.min(...t.options.map((o) => o.pattern.length)),
    0,
  );
  const maxLetters = known.reduce(
    (s, t) => s + Math.max(...t.options.map((o) => o.pattern.length)),
    0,
  );

  return {
    ok: tokens.length > 0 && unknown.length === 0,
    input: text,
    tokens,
    unknown,
    pattern,
    minLetters,
    maxLetters,
    normalized: known.map((t) => t.options[0].name).join(' '),
  };
}

/* ------------------------------------------------------------------ */
/*                        بناء البحر من الوزن                          */
/* ------------------------------------------------------------------ */

export interface FormulaMeterOptions {
  /** يسمح بزحافات التفعيلة الأصل، لا بصورتها المكتوبة وحدها. */
  tolerant?: boolean;
  /** الإشباع: جواز زيادة ساكن في آخر الشطر (عادة النبط والغناء). */
  ishbaa?: boolean;
  name?: string;
  slug?: string;
  id?: string;
  /** شطران متماثلان (الأصل)، أو شطر واحد. */
  single?: boolean;
}

function slotFor(
  token: FormulaToken,
  role: SlotRole,
  opts: FormulaMeterOptions,
  last: boolean,
): Slot {
  const base = token.options[0].foot;
  const variants: FootVariant[] = [];
  const seen = new Set<string>();
  const add = (v: FootVariant) => {
    if (seen.has(v.pattern)) return;
    seen.add(v.pattern);
    variants.push(v);
  };

  for (const o of token.options) {
    add({ pattern: o.pattern, name: o.name, change: 'كما في الوزن المطلوب', cost: 0 });
  }
  if (opts.tolerant) {
    for (const z of FEET[base].zihafat) add({ ...z, cost: z.cost === 0 ? 0.4 : 1 });
  }
  if (opts.ishbaa && last) {
    for (const o of token.options) {
      add({
        pattern: o.pattern + '0',
        name: o.name + 'ْ',
        change: 'الإشباع — مدّ آخر الشطر بساكن',
        cost: 0.5,
      });
    }
  }
  return { role, base, variants };
}

/** يبني بحراً صناعيّاً من وزنٍ مكتوب بالتفعيلات، ليُقاس عليه. */
export function formulaMeter(parsed: ParsedFormula, opts: FormulaMeterOptions = {}): Meter | null {
  const tokens = parsed.tokens.filter((t) => t.ok);
  if (!tokens.length) return null;
  const n = tokens.length;

  const sadr = tokens.map((t, i) =>
    slotFor(t, i === n - 1 ? 'عروض' : 'حشو', opts, i === n - 1),
  );
  const ajz = opts.single
    ? []
    : tokens.map((t, i) => slotFor(t, i === n - 1 ? 'ضرب' : 'حشو', opts, i === n - 1));

  const formula = parsed.normalized || parsed.input;
  return {
    id: opts.id ?? 'formula',
    slug: opts.slug ?? 'formula',
    name: opts.name ?? 'الوزن المطلوب',
    family: opts.name ?? 'وزن مخصّص',
    form: 'تام',
    key: formula,
    formula,
    sadr,
    ajz,
    description: `وزنٌ مُملىً بالتفعيلات: ${formula}.`,
    tone: '',
    example: { verse: '', poet: '' },
    frequency: 5,
  };
}

/** حساب ما يقتضيه الوزن من حروف مقابل ما في النصّ — بيان عدديّ لا دعوى. */
export interface LetterBudget {
  /** ما يقتضيه الوزن سالماً كما كُتب، بلا زحاف. */
  required: number;
  requiredMin: number;
  requiredMax: number;
  found: number;
  /** موجب = زيادة في النصّ، سالب = نقص عنه. يُقاس على الوزن سالماً. */
  delta: number;
}

export function letterBudget(parsed: ParsedFormula, found: number): LetterBudget {
  const required = parsed.pattern.length;
  const delta =
    found > parsed.maxLetters
      ? found - parsed.maxLetters
      : found < parsed.minLetters
        ? found - parsed.minLetters
        : 0;
  return {
    required,
    requiredMin: parsed.minLetters,
    requiredMax: parsed.maxLetters,
    found,
    delta,
  };
}

/** هل التمثيل الرمزي مذكور نصّاً في صور هذه التفعيلة كما كتبها المستخدم؟ */
export const isVerbatim = (token: FormulaToken, pattern: string): boolean =>
  token.options.some((o) => o.pattern === pattern);
