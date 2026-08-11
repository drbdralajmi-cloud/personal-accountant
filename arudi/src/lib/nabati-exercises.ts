/**
 * تمارين الشعر النبطي.
 *
 * تُشتقّ كلها من قاعدة الطروق ومن المحرّك نفسه، لا من قوائمَ مكتوبة سلفاً:
 * الأشطر تُركَّب بالمحرّك ثم يُعاد تحليلها للتحقّق قبل أن تُعرض، والمشتّتات
 * تُختار بحيث لا يكون فيها جوابٌ ثانٍ صحيح. فإن تعذّر التحقّق سقط التمرين
 * ولم يُعرض — والامتناع أسلم من سؤالٍ جوابه خطأ.
 */

import { Level } from '@/data/lessons';
import { analyzeNabati } from './arud/analyze';
import { composeHemistich } from './arud/compose';
import { splitSyllables } from './arud/feet';
import { nabatiMeterBySlug, Tariq, TURUQ } from './arud/nabati';
import type { Exercise, ExerciseKind } from './exercises';

export type NabatiExerciseKind = ExerciseKind | 'نظم على طَرق';

/** تمرين النظم: يكتب المتدرّب شطراً ويحكم عليه المحرّك. */
export interface ComposeTask {
  id: string;
  kind: 'نظم على طَرق';
  level: Level;
  prompt: string;
  tariqSlug: string;
  tariqName: string;
  formula: string;
  letters: number;
  syllables: number;
  hint: string;
}

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1000000) / 1000000;
  };
}

const pick = <T,>(arr: T[], r: () => number): T => arr[Math.floor(r() * arr.length) % arr.length];

function shuffle<T>(arr: T[], r: () => number): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** شطرٌ مركَّب على طَرقٍ بعينه، متحقَّقٌ من وزنه بإعادة التحليل. */
function lineFor(t: Tariq, seed: number): { text: string; feet: string[] } | null {
  const meter = nabatiMeterBySlug(t.slug);
  if (!meter) return null;
  for (let k = 0; k < 8; k++) {
    const line = composeHemistich(meter, 'sadr', { seed: seed + k * 37, curatedOnly: true });
    if (!line) continue;
    const back = analyzeNabati(line.text);
    // لا نقبل إلا ما رجع إلينا على الطَّرق نفسه موزوناً
    if (back.ok && back.meter?.slug === t.slug) return line;
  }
  return null;
}

/** طروقٌ تصلح مشتّتاتٍ: تخالف الصواب في عدد الحروف فلا تلتبس به. */
function distractorTuruq(correct: Tariq, r: () => number, n = 3): Tariq[] {
  const pool = TURUQ.filter((t) => t.letters !== correct.letters && t.name !== correct.name);
  return shuffle(pool, r).slice(0, n);
}

/* ------------------------------------------------------------------ */
/*                            المولّدات                                */
/* ------------------------------------------------------------------ */

/** ما اسم الطَّرق الذي على هذه التفعيلات؟ */
function exNameTariq(seed: number, level: Level): Exercise | null {
  const r = rng(seed);
  const t = pick(TURUQ, r);
  const wrong = distractorTuruq(t, r);
  if (wrong.length < 3) return null;
  const options = shuffle([t.name, ...wrong.map((w) => w.name)], r);
  return {
    id: `nb-name-${t.slug}-${seed}`,
    kind: 'اختيار التفعيلة',
    level,
    prompt: 'أيّ الطروق على هذه التفعيلات؟',
    context: t.formulaVocalized,
    options,
    answerIndex: options.indexOf(t.name),
    explanation: `${t.name}: ${t.formulaVocalized} — ${t.letters} حرفاً و${t.syllableCount} مقطعاً في الشطر. ${t.tone}`,
    points: 10,
  };
}

/** ما تفعيلات هذا الطَّرق؟ */
function exFormulaOf(seed: number, level: Level): Exercise | null {
  const r = rng(seed);
  const t = pick(TURUQ, r);
  const wrong = TURUQ.filter((x) => x.pattern !== t.pattern);
  if (wrong.length < 3) return null;
  const options = shuffle(
    [t.formulaVocalized, ...shuffle(wrong, r).slice(0, 3).map((w) => w.formulaVocalized)],
    r,
  );
  return {
    id: `nb-formula-${t.slug}-${seed}`,
    kind: 'اختيار التفعيلة',
    level,
    prompt: `على أيّ تفعيلاتٍ يقوم طَرق ${t.name}؟`,
    options,
    answerIndex: options.indexOf(t.formulaVocalized),
    explanation: `${t.name} على ${t.formulaVocalized}، وشطره ${t.letters} حرفاً.`,
    points: 10,
  };
}

/** كم حرفاً يقتضي هذا الطَّرق في الشطر؟ */
function exLetters(seed: number, level: Level): Exercise | null {
  const r = rng(seed);
  const t = pick(TURUQ, r);
  const others = [...new Set(TURUQ.map((x) => x.letters))].filter((n) => n !== t.letters);
  if (others.length < 3) return null;
  const nums = shuffle([t.letters, ...shuffle(others, r).slice(0, 3)], r);
  const options = nums.map((n) => `${n} حرفاً`);
  return {
    id: `nb-letters-${t.slug}-${seed}`,
    kind: 'تقطيع',
    level,
    prompt: `كم حرفاً عروضياً يقتضي شطرُ ${t.name}؟`,
    context: t.formulaVocalized,
    options,
    answerIndex: options.indexOf(`${t.letters} حرفاً`),
    explanation: `${t.feet
      .map((f) => `${f.name} (${f.letters})`)
      .join(' + ')} = ${t.letters} حرفاً. وعدُّ الحروف هو الفيصل عند الاختلاف في الوزن.`,
    points: 15,
  };
}

/** على أيّ طَرقٍ هذا الشطر؟ (شطرٌ مركَّب متحقَّقٌ منه) */
function exWhichTariq(seed: number, level: Level): Exercise | null {
  const r = rng(seed);
  const t = pick(TURUQ, r);
  const line = lineFor(t, seed);
  if (!line) return null;
  const wrong = distractorTuruq(t, r);
  if (wrong.length < 3) return null;
  const options = shuffle([t.name, ...wrong.map((w) => w.name)], r);
  return {
    id: `nb-which-${t.slug}-${seed}`,
    kind: 'اختيار التفعيلة',
    level,
    prompt: 'على أيّ طَرقٍ هذا الشطر؟ (شطرٌ مولَّد للتدريب، لا يُنسب لشاعر)',
    context: line.text,
    options,
    answerIndex: options.indexOf(t.name),
    explanation: `تفعيلاته: ${line.feet.join(' · ')} — وهي تفعيلات ${t.name}.`,
    points: 20,
  };
}

/** رتّب مقاطع التفعيلة. */
function exOrderSyllables(seed: number, level: Level): Exercise | null {
  const r = rng(seed);
  const t = pick(TURUQ, r);
  const foot = pick(t.feet, r);
  const parts = splitSyllables(foot.pattern);
  if (parts.length < 3) return null;
  const labels = parts.map((p) => p.replace(/1/g, '/').replace(/0/g, '°'));
  // لا يصلح الترتيب إذا تكرّرت المقاطع فصار له أكثر من ترتيبٍ صحيح
  if (new Set(labels).size < labels.length) return null;
  return {
    id: `nb-order-${t.slug}-${foot.pattern}-${seed}`,
    kind: 'ترتيب المقاطع',
    level,
    prompt: `رتّب مقاطع (${foot.name}) كما تقع في طَرق ${t.name}.`,
    items: shuffle(labels, r),
    correctOrder: labels,
    explanation: `${foot.name} = ${foot.syllables.map((s) => s.label).join(' + ')}.`,
    points: 20,
  };
}

/** طابق كل طَرقٍ بتفعيلاته. */
function exMatchTuruq(seed: number, level: Level): Exercise | null {
  const r = rng(seed);
  // لا نجمع طَرقين على وزنٍ واحد في المطابقة، وإلا صحّ الجوابان
  const seen = new Set<string>();
  const pool = shuffle(TURUQ, r).filter((t) => {
    if (seen.has(t.pattern)) return false;
    seen.add(t.pattern);
    return true;
  });
  if (pool.length < 4) return null;
  const chosen = pool.slice(0, 4);
  return {
    id: `nb-match-${seed}`,
    kind: 'مطابقة',
    level,
    prompt: 'طابق كل طَرقٍ بتفعيلاته.',
    pairs: chosen.map((t) => ({ left: t.name, right: t.formulaVocalized })),
    explanation: chosen.map((t) => `${t.name}: ${t.formulaVocalized}`).join(' — '),
    points: 25,
  };
}

/** أكمل الشطر بما يستقيم به الوزن. */
function exComplete(seed: number, level: Level): Exercise | null {
  const r = rng(seed);
  const t = pick(TURUQ, r);
  const line = lineFor(t, seed);
  if (!line) return null;
  const words = line.text.split(' ');
  if (words.length < 3) return null;
  const head = words.slice(0, -1).join(' ');
  const tail = words[words.length - 1];

  // المشتّتات: كلماتٌ من أشطرٍ أخرى تكسر الوزن قطعاً — نتحقّق بإعادة التحليل
  const wrong: string[] = [];
  for (let k = 1; k <= 24 && wrong.length < 3; k++) {
    const other = lineFor(pick(TURUQ, r), seed + k * 91);
    if (!other) continue;
    const cand = other.text.split(' ').pop()!;
    if (cand === tail || wrong.includes(cand)) continue;
    const test = analyzeNabati(`${head} ${cand}`);
    if (test.ok && test.meter?.slug === t.slug) continue; // صحيحٌ أيضاً، فلا يصلح مشتّتاً
    wrong.push(cand);
  }
  if (wrong.length < 3) return null;

  const options = shuffle([tail, ...wrong], r);
  return {
    id: `nb-complete-${t.slug}-${seed}`,
    kind: 'إكمال الشطر',
    level,
    prompt: `أكمل الشطر بما يستقيم به وزن ${t.name}.`,
    context: `${head} …`,
    options,
    answerIndex: options.indexOf(tail),
    explanation: `الصواب «${tail}» فيتمّ الشطر على ${line.feet.join(' · ')}.`,
    points: 25,
  };
}

/** أين وقع الكسر في هذا الشطر؟ */
function exFindBreak(seed: number, level: Level): Exercise | null {
  const r = rng(seed);
  const t = pick(TURUQ, r);
  const line = lineFor(t, seed);
  if (!line) return null;
  const words = line.text.split(' ');
  if (words.length < 3) return null;
  // نكسر الشطر بزيادة كلمةٍ قصيرة في موضعٍ معلوم
  const at = 1 + Math.floor(r() * (words.length - 1));
  const broken = [...words.slice(0, at), 'وَقَدْ', ...words.slice(at)].join(' ');
  const check = analyzeNabati(broken);
  if (check.ok) return null; // لم ينكسر فعلاً، فلا يصلح سؤالاً

  const options = shuffle([...words.slice(0, 4)], r);
  const answer = words[at - 1];
  if (!options.includes(answer)) options[0] = answer;
  return {
    id: `nb-break-${t.slug}-${seed}`,
    kind: 'تصحيح الوزن',
    level,
    prompt: 'أُقحمت كلمة «وَقَدْ» في هذا الشطر فكسرته. بعد أيّ كلمةٍ وقعت؟',
    context: broken,
    options,
    answerIndex: options.indexOf(answer),
    explanation: `الشطر الصحيح: «${line.text}» على ${t.name}. وزيادة كلمةٍ واحدة تكفي لكسر الوزن، لأن الطَّرق يقتضي ${t.letters} حرفاً لا يزيد.`,
    points: 30,
  };
}

/* ------------------------------------------------------------------ */

const GENERATORS: Record<Level, ((seed: number, level: Level) => Exercise | null)[]> = {
  مبتدئ: [exNameTariq, exFormulaOf, exLetters, exMatchTuruq, exOrderSyllables],
  متوسط: [exWhichTariq, exLetters, exComplete, exMatchTuruq, exNameTariq],
  'متقدّم': [exComplete, exFindBreak, exWhichTariq, exOrderSyllables, exLetters],
};

/** توليد تمارين نبطية لمستوى معيّن. */
export function generateNabatiExercises(level: Level, count = 8, seed = 1): Exercise[] {
  const gens = GENERATORS[level];
  const out: Exercise[] = [];
  let s = seed * 7919 + 13;
  let guard = 0;
  while (out.length < count && guard++ < count * 30) {
    // ندوّر على المولّدات بعدّاد المحاولات لا بعدد الناتج، وإلا وقفنا
    // عند مولّدٍ يتعذّر عليه التوليد فلم نتجاوزه
    const gen = gens[guard % gens.length];
    const ex = gen(s, level);
    s = (s * 1103515245 + 12345) >>> 0;
    if (ex && !out.some((o) => o.id === ex.id)) out.push(ex);
  }
  return out;
}

/**
 * مهامّ النظم: يُطلب من المتدرّب أن يكتب شطراً على طَرقٍ بعينه، ثم يحكم
 * المحرّك على ما كتب. وهذا آخر مراتب التدريب: لا اختيارَ من متعدّد، بل
 * إنشاءٌ يُقاس.
 */
export function composeTasks(level: Level, count = 3, seed = 1): ComposeTask[] {
  const r = rng(seed * 104729);
  const byLevel = TURUQ.filter((t) =>
    level === 'مبتدئ'
      ? t.difficulty === 'مبتدئ'
      : level === 'متوسط'
        ? t.difficulty !== 'متقدّم'
        : true,
  );
  const pool = shuffle(byLevel.length ? byLevel : TURUQ, r).slice(0, count);
  return pool.map((t) => ({
    id: `nb-compose-${t.slug}-${seed}`,
    kind: 'نظم على طَرق' as const,
    level,
    prompt: `اكتب شطراً على طَرق ${t.name}.`,
    tariqSlug: t.slug,
    tariqName: t.name,
    formula: t.formulaVocalized,
    letters: t.letters,
    syllables: t.syllableCount,
    hint: t.howToWrite[0] ?? '',
  }));
}
