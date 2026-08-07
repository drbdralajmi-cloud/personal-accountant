/**
 * القافية: استخراج الرويّ ونوع القافية وحركتها ولواحقها.
 * القافية عند الخليل: من آخر ساكن في البيت إلى أوّل ساكن يسبقه
 * مع المتحرّك الذي قبل ذلك الساكن.
 */

import { ALEF, DAMMA, FATHA, KASRA, SUKUN, WAW, YEH } from './chars';
import { toUnits, Unit } from './prosodic';

export interface RhymeInfo {
  /** حرف الرويّ الذي تُبنى عليه القصيدة. */
  rawi: string;
  /** حركة الرويّ (فارغة إن كان ساكناً). */
  harakaRawi: string;
  /** مطلقة (رويّها متحرك) أو مقيّدة (رويّها ساكن). */
  type: 'مطلقة' | 'مقيّدة';
  /** نوعها بحسب عدد المتحركات بين ساكنيها. */
  kind: 'مترادف' | 'متواتر' | 'متدارك' | 'متراكب' | 'متكاوس' | 'غير محدّد';
  /** نصّ القافية بالكتابة العروضية. */
  text: string;
  /** حرف مدّ أو لين قبل الرويّ مباشرة. */
  ridf: string | null;
  /** ألف بينها وبين الرويّ حرف متحرّك واحد. */
  tasees: boolean;
  /** حرف المدّ الناشئ عن إشباع حركة الرويّ. */
  wasl: string | null;
  /** مفتاح البحث عن قوافٍ مشابهة: الرويّ + حركته. */
  key: string;
  /** التمثيل الرمزي للقافية. */
  pattern: string;
}

const KIND_BY_COUNT: RhymeInfo['kind'][] = [
  'مترادف',
  'متواتر',
  'متدارك',
  'متراكب',
  'متكاوس',
];

export function analyzeRhyme(text: string): RhymeInfo | null {
  if (!text || !text.trim()) return null;
  const cands = toUnits(text);
  if (!cands.length) return null;
  // نفضّل الاحتمال المطلق (المفتوح) لأنه الأشيع في الشعر العربي
  const units = cands[0];
  if (units.length < 2) return null;

  const isMadd = (u: Unit) => u.state === 0 && (u.letter === ALEF || u.letter === WAW || u.letter === YEH);

  // تحديد الوصل والرويّ
  const last = units[units.length - 1];
  let rawiIdx: number;
  let wasl: string | null = null;
  let type: RhymeInfo['type'];
  if (isMadd(last) && units.length >= 2 && units[units.length - 2].state === 1) {
    rawiIdx = units.length - 2;
    wasl = last.letter;
    type = 'مطلقة';
  } else {
    rawiIdx = units.length - 1;
    type = 'مقيّدة';
  }

  const rawi = units[rawiIdx];

  // موضعا الساكنين
  const sakinIdx: number[] = [];
  for (let i = units.length - 1; i >= 0; i--) if (units[i].state === 0) sakinIdx.push(i);
  let kind: RhymeInfo['kind'] = 'غير محدّد';
  let start = Math.max(0, rawiIdx - 1);
  if (sakinIdx.length >= 2) {
    const s2 = sakinIdx[0];
    const s1 = sakinIdx[1];
    const between = s2 - s1 - 1;
    kind = KIND_BY_COUNT[between] ?? 'غير محدّد';
    start = Math.max(0, s1 - 1);
  } else if (sakinIdx.length === 1) {
    kind = 'مترادف';
    start = Math.max(0, sakinIdx[0] - 1);
  }

  const slice = units.slice(start);
  const ridfUnit = rawiIdx > 0 ? units[rawiIdx - 1] : null;
  const ridf = ridfUnit && isMadd(ridfUnit) ? ridfUnit.letter : null;
  const taseesUnit = rawiIdx > 1 ? units[rawiIdx - 2] : null;
  const tasees = !!(taseesUnit && taseesUnit.letter === ALEF && units[rawiIdx - 1]?.state === 1);

  return {
    rawi: rawi.letter,
    harakaRawi: rawi.haraka || (rawi.state === 0 ? SUKUN : ''),
    type,
    kind,
    text: slice.map((u) => u.letter + (u.state === 0 ? SUKUN : u.haraka)).join(''),
    ridf,
    tasees,
    wasl,
    key: rawi.letter + (rawi.haraka || ''),
    pattern: slice.map((u) => (u.state === null ? '?' : u.state)).join(''),
  };
}

/** وصف مختصر للقافية يُعرض للمستخدم. */
export function describeRhyme(r: RhymeInfo): string {
  const parts = [`الرويّ: ${r.rawi}`, `قافية ${r.type}`, r.kind !== 'غير محدّد' ? `نوعها: ${r.kind}` : ''];
  if (r.ridf) parts.push(`مردوفة بـ«${r.ridf}»`);
  if (r.tasees) parts.push('مؤسَّسة');
  if (r.wasl) parts.push(`وصلها «${r.wasl}»`);
  return parts.filter(Boolean).join(' — ');
}

const HARAKA_NAME: Record<string, string> = {
  [FATHA]: 'مفتوح',
  [DAMMA]: 'مضموم',
  [KASRA]: 'مكسور',
  [SUKUN]: 'ساكن',
};

export const harakaName = (h: string) => HARAKA_NAME[h] ?? '';
