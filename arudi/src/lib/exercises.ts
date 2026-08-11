/**
 * مولّد التمارين التفاعلية.
 * التمارين تُشتقّ من المدوّنة الشعرية والمعجم الموزون ومحرّك التحليل،
 * لا من قوائم مكتوبة سلفاً — فهي متجدّدة بتغيّر البذرة.
 */

import { CORPUS, fullVerse } from '@/data/corpus';
import { Level } from '@/data/lessons';
import { analyzeVerse } from './arud/analyze';
import { FEET_LIST, PROSODIC_UNITS, splitSyllables } from './arud/feet';
import { METERS } from './arud/meters';
import { wordsForPattern } from './lexicon';

export type ExerciseKind =
  | 'تقطيع'
  | 'اختيار التفعيلة'
  | 'إكمال الشطر'
  | 'تصحيح الوزن'
  | 'ترتيب المقاطع'
  | 'مطابقة';

export interface Exercise {
  id: string;
  kind: ExerciseKind;
  level: Level;
  prompt: string;
  /** نصّ يُعرض في إطار (بيت أو شطر أو رموز). */
  context?: string;
  /** أسئلة الاختيار. */
  options?: string[];
  answerIndex?: number;
  /** تمارين الترتيب: العناصر مخلوطة والترتيب الصحيح. */
  items?: string[];
  correctOrder?: string[];
  /** تمارين المطابقة. */
  pairs?: { left: string; right: string }[];
  explanation: string;
  points: number;
}

function rng(seed: number) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1000000) / 1000000;
  };
}

const pickOne = <T,>(arr: T[], r: () => number): T => arr[Math.floor(r() * arr.length) % arr.length];

function shuffle<T>(arr: T[], r: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** يضع الجواب الصحيح مع مشتّتات ويعيد الخيارات ومؤشّر الصواب. */
function choices(correct: string, distractors: string[], r: () => number, n = 4) {
  const pool = distractors.filter((d) => d !== correct);
  const picked: string[] = [];
  const shuffled = shuffle(pool, r);
  for (const d of shuffled) {
    if (picked.length >= n - 1) break;
    if (!picked.includes(d)) picked.push(d);
  }
  const options = shuffle([correct, ...picked], r);
  return { options, answerIndex: options.indexOf(correct) };
}

const symbolsOf = (pattern: string) =>
  pattern
    .split('')
    .map((c) => (c === '1' ? '/' : '°'))
    .join('');

/* ------------------------------------------------------------------ */

/** تمرين: ما رموز هذا المقطع؟ */
function exScansion(seed: number, level: Level): Exercise | null {
  const r = rng(seed);
  const verse = pickOne(CORPUS, r);
  const a = analyzeVerse(fullVerse(verse));
  const half = a.sadr;
  if (!half || !half.feet.length) return null;
  const foot = pickOne(half.feet, r);
  const correct = symbolsOf(foot.pattern);
  const others = FEET_LIST.flatMap((f) => [f.pattern, ...f.zihafat.map((z) => z.pattern)])
    .filter((p) => p.length >= 4)
    .map(symbolsOf);
  const { options, answerIndex } = choices(correct, others, r);
  return {
    id: `scan-${seed}`,
    kind: 'تقطيع',
    level,
    prompt: `ما التمثيل الرمزي للجزء «${foot.text}» من هذا البيت؟`,
    context: `${verse.sadr} … ${verse.ajz}`,
    options,
    answerIndex,
    explanation: `«${foot.text}» تفعيلتها ${foot.name}، ورمزها ${correct} — (/) للمتحرك و(°) للساكن.`,
    points: 10,
  };
}

/** تمرين: أيّ تفعيلة توافق هذه الرموز؟ */
function exFoot(seed: number, level: Level): Exercise {
  const r = rng(seed);
  const foot = pickOne(FEET_LIST, r);
  const variant = level === 'مبتدئ' ? foot.zihafat[0] : pickOne(foot.zihafat, r);
  const correct = variant.name;
  // تفعيلاتٌ كثيرة تشترك في التمثيل الرمزي نفسه (110110 مثلاً هي مَفَاعِلُنْ
  // ومُتَفْعِلُنْ ومُفَاعِلُنْ)، فلا بدّ من استبعادها حتى لا يصحّ أكثر من خيار.
  const others = FEET_LIST.flatMap((f) =>
    [{ name: f.name, pattern: f.pattern }, ...f.zihafat].filter(
      (z) => z.pattern !== variant.pattern,
    ),
  ).map((z) => z.name);
  const { options, answerIndex } = choices(correct, others, r);
  return {
    id: `foot-${seed}`,
    kind: 'اختيار التفعيلة',
    level,
    prompt: 'أيّ تفعيلة توافق هذا التمثيل الرمزي؟',
    context: symbolsOf(variant.pattern),
    options,
    answerIndex,
    explanation:
      variant.change === 'سالمة'
        ? `هي ${foot.name} سالمةً، تركيبها: ${foot.build.join(' + ')}.`
        : `هي ${foot.name} بعد ${variant.change}، فصارت ${variant.name}.`,
    points: 10,
  };
}

/** تمرين: أيّ كلمة تُكمل الشطر على وزنه؟ */
function exComplete(seed: number, level: Level): Exercise | null {
  const r = rng(seed);
  const verse = pickOne(CORPUS, r);
  const a = analyzeVerse(fullVerse(verse));
  const half = r() > 0.5 ? a.sadr : a.ajz;
  if (!half || half.feet.length < 2) return null;

  const words = half.text.trim().split(/\s+/);
  if (words.length < 3) return null;
  const idx = 1 + Math.floor(r() * (words.length - 1));
  const correct = words[idx];
  const blanked = words.map((w, i) => (i === idx ? '⬚⬚⬚' : w)).join(' ');

  // مشتّتات: كلمات نتحقّق آلياً من أنها تكسر الوزن، فلا يصحّ إلا جواب واحد
  const foot = half.feet[Math.min(idx, half.feet.length - 1)];
  const wrongPattern = FEET_LIST.find((f) => f.pattern !== foot.pattern)!.pattern;
  const distractors: string[] = [];
  for (const cand of wordsForPattern(wrongPattern, { limit: 30, seed })) {
    if (distractors.length >= 3) break;
    if (cand.word === correct) continue;
    const trial = words.map((w, i) => (i === idx ? cand.word : w)).join(' ');
    if (!analyzeVerse(trial).ok) distractors.push(cand.word);
  }
  if (distractors.length < 3) return null;
  const { options, answerIndex } = choices(correct, distractors, r);

  return {
    id: `complete-${seed}`,
    kind: 'إكمال الشطر',
    level,
    prompt: 'اختر الكلمة التي يستقيم بها وزن الشطر:',
    context: blanked,
    options,
    answerIndex,
    explanation: `الشطر من بحر ${a.meter?.name ?? '—'}، وتفعيلاته: ${half.feet
      .map((f) => f.name)
      .join(' ')}. والكلمة الصحيحة «${correct}».`,
    points: 15,
  };
}

/** تمرين: أين موضع الكسر؟ */
function exFix(seed: number, level: Level): Exercise | null {
  const r = rng(seed);
  const verse = pickOne(CORPUS, r);
  const sound = analyzeVerse(fullVerse(verse));
  if (!sound.ok || !sound.meter) return null;

  // نكسر البيت بزيادة كلمة
  const extra = pickOne(['جِدًّا', 'قَدْ', 'كَمْ', 'ثُمَّ', 'حَتَّى'], r);
  const words = verse.sadr.trim().split(/\s+/);
  const at = 1 + Math.floor(r() * (words.length - 1));
  const brokenSadr = [...words.slice(0, at), extra, ...words.slice(at)].join(' ');
  const broken = `${brokenSadr} … ${verse.ajz}`;

  const correct = 'الصدر';
  const { options, answerIndex } = choices(correct, ['العجز', 'البيت سليم لا كسر فيه', 'القافية'], r);
  return {
    id: `fix-${seed}`,
    kind: 'تصحيح الوزن',
    level,
    prompt: 'أين وقع الكسر في هذا البيت؟',
    context: broken,
    options,
    answerIndex,
    explanation: `البيت من بحر ${sound.meter.name}. زِيدت كلمة «${extra}» في الصدر فاختلّ وزنه، وصوابه: «${verse.sadr}».`,
    points: 20,
  };
}

/** تمرين: رتّب المقاطع لتكوّن التفعيلة. */
function exOrder(seed: number, level: Level): Exercise {
  const r = rng(seed);
  const foot = pickOne(FEET_LIST, r);
  const correctOrder = foot.syllables;
  return {
    id: `order-${seed}`,
    kind: 'ترتيب المقاطع',
    level,
    prompt: `رتّب المقاطع لتكوّن التفعيلة «${foot.name}»:`,
    context: symbolsOf(foot.pattern),
    items: shuffle(correctOrder, r),
    correctOrder,
    explanation: `${foot.name} = ${foot.build.join(' + ')}، وتُنطق: ${foot.syllables.join('/')}.`,
    points: 15,
  };
}

/** تمرين: طابق كل كلمة بتفعيلتها. */
function exMatch(seed: number, level: Level): Exercise | null {
  const r = rng(seed);
  const feet = shuffle(FEET_LIST, r).slice(0, 4);
  const pairs: { left: string; right: string }[] = [];
  for (const f of feet) {
    const w = wordsForPattern(f.pattern, { limit: 6, seed: seed + f.pattern.length })[0];
    if (!w) continue;
    pairs.push({ left: w.spoken, right: f.name });
  }
  if (pairs.length < 3) return null;
  return {
    id: `match-${seed}`,
    kind: 'مطابقة',
    level,
    prompt: 'طابق كل كلمة بالتفعيلة التي توافق وزنها:',
    pairs,
    explanation: 'كل كلمة هنا تطابق تفعيلتها في ترتيب حركاتها وسكناتها حرفاً بحرف.',
    points: 20,
  };
}

/** تمرين: ما بحر هذا البيت؟ */
function exMeter(seed: number, level: Level): Exercise | null {
  const r = rng(seed);
  const verse = pickOne(CORPUS, r);
  const correct = verse.meter;
  const others = METERS.map((m) => m.name);
  const { options, answerIndex } = choices(correct, others, r);
  return {
    id: `meter-${seed}`,
    kind: 'اختيار التفعيلة',
    level,
    prompt: 'من أيّ بحرٍ هذا البيت؟',
    context: `${verse.sadr} … ${verse.ajz}`,
    options,
    answerIndex,
    explanation: `البيت من بحر ${correct}${verse.poet ? ` — ${verse.poet}` : ''}.`,
    points: 15,
  };
}

/* ------------------------------------------------------------------ */

const GENERATORS: Record<Level, ((seed: number, level: Level) => Exercise | null)[]> = {
  مبتدئ: [exFoot, exOrder, exScansion, exMatch],
  متوسط: [exFoot, exScansion, exMeter, exMatch, exComplete],
  'متقدّم': [exComplete, exFix, exMeter, exScansion, exFoot],
};

/** توليد مجموعة تمارين لمستوى معيّن. */
export function generateExercises(level: Level, count = 8, seed = 1): Exercise[] {
  const gens = GENERATORS[level];
  const out: Exercise[] = [];
  let s = seed * 7919;
  let guard = 0;
  while (out.length < count && guard++ < count * 12) {
    const gen = gens[out.length % gens.length];
    const ex = gen(s, level);
    s = (s * 1103515245 + 12345) >>> 0;
    if (ex && !out.some((o) => o.id === ex.id)) out.push(ex);
  }
  return out;
}

/** تدريب اليوم: مجموعة ثابتة تتغيّر كل يوم. */
export function dailyDrill(date = new Date()): Exercise[] {
  const day = Math.floor(date.getTime() / 86400000);
  return generateExercises('متوسط', 5, day);
}

/** بطاقات مراجعة سريعة للوحدات العروضية. */
export const FLASHCARDS = PROSODIC_UNITS.map((u) => ({
  front: u.name,
  back: `${symbolsOf(u.pattern)} — ${u.desc} مثاله: ${u.example}`,
}));

/** عدد المقاطع في تمثيل رمزي — يستعمله واجهة التمارين. */
export const syllableCount = (pattern: string) => splitSyllables(pattern).length;
