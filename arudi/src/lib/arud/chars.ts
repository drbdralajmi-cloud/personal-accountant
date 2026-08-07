/**
 * ثوابت الحروف والحركات العربية المستعملة في التحليل العروضي.
 */

export const FATHA = 'َ';
export const DAMMA = 'ُ';
export const KASRA = 'ِ';
export const SUKUN = 'ْ';
export const SHADDA = 'ّ';
export const FATHATAN = 'ً';
export const DAMMATAN = 'ٌ';
export const KASRATAN = 'ٍ';
export const DAGGER_ALEF = 'ٰ'; // الألف الخنجرية
export const TATWEEL = 'ـ';

export const ALEF = 'ا';
export const ALEF_MADDA = 'آ'; // آ
export const ALEF_HAMZA = 'أ'; // أ
export const ALEF_HAMZA_BELOW = 'إ'; // إ
export const WAW_HAMZA = 'ؤ'; // ؤ
export const YEH_HAMZA = 'ئ'; // ئ
export const HAMZA = 'ء'; // ء
export const WAW = 'و';
export const YEH = 'ي';
export const ALEF_MAKSURA = 'ى'; // ى
export const TEH_MARBUTA = 'ة'; // ة
export const LAM = 'ل';
export const NOON = 'ن';
export const MEEM = 'م';

export const HARAKAT = new Set([FATHA, DAMMA, KASRA]);
export const TANWEEN = new Set([FATHATAN, DAMMATAN, KASRATAN]);
export const ALL_DIACRITICS = new Set([
  FATHA,
  DAMMA,
  KASRA,
  SUKUN,
  SHADDA,
  FATHATAN,
  DAMMATAN,
  KASRATAN,
  DAGGER_ALEF,
]);

/** الحروف الشمسية — تُدغم فيها لام التعريف. */
export const SUN_LETTERS = new Set([
  'ت', // ت
  'ث', // ث
  'د', // د
  'ذ', // ذ
  'ر', // ر
  'ز', // ز
  'س', // س
  'ش', // ش
  'ص', // ص
  'ض', // ض
  'ط', // ط
  'ظ', // ظ
  'ل', // ل
  'ن', // ن
]);

export const ARABIC_LETTERS = new Set([
  ALEF, ALEF_MADDA, ALEF_HAMZA, ALEF_HAMZA_BELOW, HAMZA, WAW_HAMZA, YEH_HAMZA,
  'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ',
  'ر', 'ز', 'س', 'ش', 'ص', 'ض', 'ط', 'ظ',
  'ع', 'غ', 'ف', 'ق', 'ك', 'ل', 'م', 'ن',
  'ه', WAW, YEH, ALEF_MAKSURA, TEH_MARBUTA,
]);

export const isLetter = (ch: string) => ARABIC_LETTERS.has(ch);
export const isDiacritic = (ch: string) => ALL_DIACRITICS.has(ch);
export const isHaraka = (ch: string) => HARAKAT.has(ch);
export const isTanween = (ch: string) => TANWEEN.has(ch);

/** إزالة كل التشكيل من نص. */
export function stripDiacritics(text: string): string {
  let out = '';
  for (const ch of text) if (!isDiacritic(ch) && ch !== TATWEEL) out += ch;
  return out;
}

/** توحيد صور الهمزة والألف لأغراض المطابقة المعجمية فقط. */
export function normalizeLetters(text: string): string {
  return stripDiacritics(text)
    .replace(/[آأإ]/g, ALEF)
    .replace(/ى/g, YEH)
    .replace(/ة/g, 'ه');
}
