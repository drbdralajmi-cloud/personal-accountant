/**
 * مكتبة الشعر النبطي: التصنيف والبحث والتحقّق.
 *
 * لا يُقبل بيتٌ في المكتبة حتى يمرّ على المحرّك: يُقاس وزنه بميزان النبط،
 * فيُصنَّف بالطَّرق والقالب والقافية آليّاً. فإن لم يستقم على طَرقٍ معلوم
 * وُسم «يحتاج مراجعة» ولم يُحذف — فقد يكون على طَرقٍ لم يُسجَّل بعد، أو
 * وقع في نسخه خطأ.
 *
 * وأما ما لا يُحسب — الشاعر والدولة والمدرسة والموضوع — فيُنقل عن مُدخِله
 * كما هو، ولا يُخمَّن ولا يُستنبط.
 */

import { CorpusEntry, NABATI_CORPUS, School } from '@/data/nabati-corpus';
import { analyzeNabati } from './arud/analyze';
import { describeRhyme } from './arud/rhyme';

export type { CorpusEntry, School } from '@/data/nabati-corpus';
export { TOPICS, SCHOOLS } from '@/data/nabati-corpus';

export interface ClassifiedEntry extends CorpusEntry {
  /** الطَّرق كما حكم به المحرّك (لا كما ادّعاه المُدخِل). */
  tariq: string | null;
  tariqSlug: string | null;
  /** التفعيلات كما وقعت فعلاً في البيت. */
  feet: string[];
  letters: number;
  rhyme: string | null;
  rawi: string | null;
  /** استقام وزنه على طَرقٍ معلوم؟ */
  sound: boolean;
  /** خالف حكمُ المحرّك ما نسبه المصدر؟ */
  disputed: boolean;
  note: string | null;
}

/** تصنيف بيتٍ واحد بالمحرّك. */
export function classify(entry: CorpusEntry): ClassifiedEntry {
  const line = entry.ajz ? `${entry.sadr} … ${entry.ajz}` : entry.sadr;
  const a = analyzeNabati(line);
  const tariq = a.meter?.name ?? null;
  const disputed = !!entry.claimedTariq && !!tariq && entry.claimedTariq !== tariq;

  return {
    ...entry,
    tariq,
    tariqSlug: a.meter?.slug ?? null,
    feet: a.sadr?.feet.map((f) => f.name) ?? [],
    letters: a.letters,
    rhyme: a.rhyme ? describeRhyme(a.rhyme) : null,
    rawi: a.rhyme?.rawi ?? null,
    sound: a.ok,
    disputed,
    note: !a.ok
      ? 'لم يستقم على طَرقٍ معلوم — قد يكون على طَرقٍ لم يُسجَّل بعد، أو وقع في نسخه خطأ. يحتاج مراجعة.'
      : disputed
        ? `نسبه المصدر إلى «${entry.claimedTariq}» وحكم المحرّك بأنه «${tariq}». والحكمان معروضان، ولا يُرجَّح أحدهما بغير حجّة.`
        : null,
  };
}

let cache: ClassifiedEntry[] | null = null;

/** المكتبة كلها مصنَّفةً. */
export function library(): ClassifiedEntry[] {
  if (!cache) cache = NABATI_CORPUS.map(classify);
  return cache;
}

export interface LibraryQuery {
  q?: string;
  tariqSlug?: string;
  rawi?: string;
  topic?: string;
  poet?: string;
  country?: string;
  school?: School;
  /** الأبيات التي لم يستقم وزنها، للمراجعة. */
  needsReview?: boolean;
}

const bare = (s: string) =>
  s
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .trim();

export function searchLibrary(query: LibraryQuery = {}): ClassifiedEntry[] {
  const q = query.q ? bare(query.q) : '';
  return library().filter((e) => {
    if (query.tariqSlug && e.tariqSlug !== query.tariqSlug) return false;
    if (query.rawi && e.rawi !== query.rawi) return false;
    if (query.topic && e.topic !== query.topic) return false;
    if (query.poet && e.poet !== query.poet) return false;
    if (query.country && e.country !== query.country) return false;
    if (query.school && e.school !== query.school) return false;
    if (query.needsReview !== undefined && e.sound === query.needsReview) return false;
    if (!q) return true;
    return bare(
      [e.sadr, e.ajz ?? '', e.poet, e.topic ?? '', e.country ?? '', e.source ?? ''].join(' | '),
    ).includes(q);
  });
}

/** إحصاء المكتبة: كم بيتاً، وعلى أيّ الطروق، ولأيّ الشعراء. */
export function libraryStats() {
  const all = library();
  const by = (get: (e: ClassifiedEntry) => string | null | undefined) => {
    const m = new Map<string, number>();
    for (const e of all) {
      const k = get(e);
      if (!k) continue;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
  };
  return {
    total: all.length,
    sound: all.filter((e) => e.sound).length,
    needsReview: all.filter((e) => !e.sound).length,
    disputed: all.filter((e) => e.disputed).length,
    byTariq: by((e) => e.tariq),
    byPoet: by((e) => e.poet),
    byCountry: by((e) => e.country),
    bySchool: by((e) => e.school),
    byTopic: by((e) => e.topic),
    byRawi: by((e) => e.rawi),
  };
}

/**
 * فحص دفعةٍ مستورَدة قبل قبولها.
 * تُعاد كل مدخلةٍ بحكم المحرّك عليها، فيرى المستورِد ما سيدخل قبل أن يدخل.
 */
export function reviewBatch(entries: CorpusEntry[]): {
  accepted: ClassifiedEntry[];
  flagged: ClassifiedEntry[];
  rejected: { entry: CorpusEntry; why: string }[];
} {
  const accepted: ClassifiedEntry[] = [];
  const flagged: ClassifiedEntry[] = [];
  const rejected: { entry: CorpusEntry; why: string }[] = [];

  for (const e of entries) {
    if (!e.sadr?.trim()) {
      rejected.push({ entry: e, why: 'لا نصّ للبيت.' });
      continue;
    }
    if (!e.poet?.trim()) {
      // النسبة شرطٌ: بيتٌ بلا شاعرٍ معلوم لا يصلح مرجعاً
      rejected.push({ entry: e, why: 'لا شاعر منسوباً إليه — والنسبة شرطٌ في المكتبة.' });
      continue;
    }
    const c = classify(e);
    (c.sound && !c.disputed ? accepted : flagged).push(c);
  }

  return { accepted, flagged, rejected };
}
