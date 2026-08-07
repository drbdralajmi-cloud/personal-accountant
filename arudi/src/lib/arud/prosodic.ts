/**
 * الكتابة العروضية: تحويل النص الإملائي إلى سلسلة من الوحدات الصوتية
 * (حرف + حالة: متحرك 1 أو ساكن 0)، وهي المدخل الأساسي لمحرك التقطيع.
 *
 * القواعد المطبَّقة:
 *  - فكّ الشدّة إلى حرفين: ساكن ثم متحرك.
 *  - تحويل التنوين إلى نون ساكنة، وحذف ألف التنوين.
 *  - حذف همزة الوصل في الدرج (ومنها همزة «ال»).
 *  - إدغام لام التعريف في الحروف الشمسية.
 *  - حذف الحروف التي تُكتب ولا تُنطق (ألف الجماعة، واو «عمرو»، ...).
 *  - ردّ الكلمات التي تُنطق بخلاف رسمها (هذا ← هاذا، لكن ← لاكن، ...).
 *  - إشباع حركة آخر الشطر (توليد حرف مدّ ساكن).
 */

import {
  ALEF,
  ALEF_HAMZA,
  ALEF_HAMZA_BELOW,
  ALEF_MADDA,
  ALEF_MAKSURA,
  DAGGER_ALEF,
  DAMMA,
  DAMMATAN,
  FATHA,
  FATHATAN,
  KASRA,
  KASRATAN,
  SHADDA,
  SUKUN,
  SUN_LETTERS,
  TATWEEL,
  TEH_MARBUTA,
  WAW,
  YEH,
  isDiacritic,
  isHaraka,
  isLetter,
  isTanween,
  stripDiacritics,
} from './chars';

/** حالة الحرف عروضياً: 1 متحرك، 0 ساكن، null غير معروف (نصّ غير مشكول). */
export type State = 1 | 0 | null;

export interface Unit {
  /** الحرف بعد المعالجة العروضية. */
  letter: string;
  /** الحركة المصاحبة (قد تكون فارغة في النص غير المشكول). */
  haraka: string;
  /** متحرك / ساكن / مجهول. */
  state: State;
  /** أول حرف في الكلمة المنطوقة (لا يجوز أن يكون ساكناً). */
  wordStart: boolean;
  /** موضع الحرف في النص الأصلي — للتلوين والإبراز. */
  src: number;
  /** رقم الكلمة في الشطر. */
  word: number;
}

interface Atom {
  l: string;
  d: string;
  src: number;
  word: number;
  wordStart: boolean;
  /** أُضيف بواسطة المعالجة (لا يقابله حرف في الأصل). */
  virtual?: boolean;
}

/** كلمات تُنطق بخلاف رسمها. المفتاح: الكلمة مجرّدة من التشكيل. */
const SPELLING_EXCEPTIONS: Record<string, string> = {
  هذا: 'هَاذَا',
  هذه: 'هَاذِهِ',
  هذان: 'هَاذَانِ',
  هذين: 'هَاذَيْنِ',
  ذلك: 'ذَالِكَ',
  ذلكم: 'ذَالِكُمْ',
  تلك: 'تِلْكَ',
  هؤلاء: 'هَاؤُلَاءِ',
  أولئك: 'أُلَائِكَ',
  اولئك: 'أُلَائِكَ',
  لكن: 'لَاكِنْ',
  لكنه: 'لَاكِنَّهُ',
  لكنها: 'لَاكِنَّهَا',
  هكذا: 'هَاكَذَا',
  الله: 'اللَّاه',
  اللهم: 'اللَّاهُمَّ',
  إله: 'إِلَاه',
  الرحمن: 'الرَّحْمَان',
  رحمن: 'رَحْمَان',
  طه: 'طَاهَا',
  يس: 'يَاسِين',
  داود: 'دَاوُود',
  داوود: 'دَاوُود',
  طاوس: 'طَاوُوس',
  عمرو: 'عَمْر',
  مائة: 'مِئَة',
  مئة: 'مِئَة',
  أنا: 'أَنَ',
  انا: 'أَنَ',
  أولو: 'أُلُو',
  أولي: 'أُلِي',
  أولات: 'أُولَات',
  السموات: 'السَّمَاوَات',
  سموات: 'سَمَاوَات',
  إسحق: 'إِسْحَاق',
  إبرهيم: 'إِبْرَاهِيم',
  لكنا: 'لَاكِنَّا',
};

/** كلمات تبدأ بهمزة وصل (تُحذف في الدرج) خارج «ال» التعريفية. */
const WASL_WORDS = new Set([
  'ابن', 'ابنة', 'ابنا', 'ابني', 'ابنه', 'اسم', 'اسمه', 'است', 'امرؤ', 'امرأة',
  'امرئ', 'امرأ', 'اثنان', 'اثنين', 'اثنتان', 'اثنتين', 'ايم', 'ايمن',
]);

const SEPARATORS = /[،؛؟.,;:!؟\-–—_"'«»(){}\[\]…*]+/g;

/** تنظيف النص: إزالة التطويل وعلامات الترقيم وتوحيد المسافات. */
export function cleanText(text: string): string {
  return text
    .replace(new RegExp(TATWEEL, 'g'), '')
    .replace(SEPARATORS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** تفكيك النص إلى ذرّات: حرف + ما يتبعه من تشكيل، مع حفظ موضعه الأصلي. */
function toAtoms(text: string): Atom[] {
  const atoms: Atom[] = [];
  let word = 0;
  let atWordStart = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === ' ') {
      if (!atWordStart) word++;
      atWordStart = true;
      continue;
    }
    if (isDiacritic(ch)) {
      if (atoms.length) atoms[atoms.length - 1].d += ch;
      continue;
    }
    if (!isLetter(ch)) continue;
    atoms.push({ l: ch, d: '', src: i, word, wordStart: atWordStart });
    atWordStart = false;
  }
  return atoms;
}

/**
 * تطبيق استثناءات النطق على مستوى الكلمة، مع مراعاة حروف الجرّ والعطف
 * المتصلة بأولها: «ولكن» ← «وَلَاكِنْ»، «بهذا» ← «بِهَاذَا».
 */
function applyExceptions(text: string): string {
  return text
    .split(' ')
    .map((w) => {
      const bare = stripDiacritics(w);
      const direct = SPELLING_EXCEPTIONS[bare];
      if (direct) return direct;
      if (bare.length < 2 || !PREFIXES.has(bare[0])) return w;
      const rest = SPELLING_EXCEPTIONS[bare.slice(1)];
      if (!rest) return w;
      // نحتفظ بالحرف الأول بحركته كما وردت في النصّ
      let head = w[0];
      for (let i = 1; i < w.length && isDiacritic(w[i]); i++) head += w[i];
      return head + rest;
    })
    .join(' ');
}

/** الحروف التي تسبق «ال» فتُدرَج همزتها: و، ف، ب، ك، ل، ت، س. */
const PREFIXES = new Set(['و', 'ف', 'ب', 'ك', 'ل', 'ت', 'س']);

/**
 * تحديد موضع «ال» التعريفية داخل الكلمة.
 * تشمل الصور: «الـ»، «والـ/بالـ/كالـ/فالـ»، و«للـ» (المحذوفة الألف).
 */
function findArticle(atoms: Atom[]): { hamza: number; lam: number } | null {
  const at = (i: number) => atoms[i]?.l ?? '';
  if (at(0) === ALEF && at(1) === 'ل' && atoms.length > 2) return { hamza: 0, lam: 1 };
  if (PREFIXES.has(at(0)) && at(1) === ALEF && at(2) === 'ل' && atoms.length > 3)
    return { hamza: 1, lam: 2 };
  // «للـ» : لام جارّة + لام التعريف، وقد حُذفت الألف رسماً
  if (at(0) === 'ل' && at(1) === 'ل' && atoms.length > 2 && !atoms[0].d.includes(SUKUN))
    return { hamza: -1, lam: 1 };
  return null;
}

/** هل الكلمة تبدأ بهمزة وصل؟ */
function startsWithWasl(bare: string): boolean {
  if (!bare.startsWith(ALEF)) return false;
  if (bare.startsWith('ال')) return true;
  if (WASL_WORDS.has(bare)) return true;
  // صيغ افتعل / انفعل / استفعل ومصادرها وأمرها
  if (/^است[^\s]{3,}/.test(bare)) return true;
  if (/^ان[^\s]{4,}/.test(bare)) return true;
  if (/^ا[^\s]ت[^\s]{2,}/.test(bare)) return true;
  return false;
}

interface BuildOptions {
  /** هل هذا الشطر مسبوق بكلام (فيدرج أوله)؟ الافتراضي لا. */
  continued?: boolean;
  /** تطبيق إشباع آخر الشطر. الافتراضي نعم. */
  saturate?: boolean;
}

/**
 * تحويل شطر إلى وحدات عروضية.
 * تُعاد أكثر من نسخة عندما يكون آخر الشطر غير مشكول (روي مطلق أو مقيّد).
 */
export function toUnits(input: string, opts: BuildOptions = {}): Unit[][] {
  const { continued = false, saturate = true } = opts;
  const text = applyExceptions(cleanText(input));
  const raw = toAtoms(text);
  if (!raw.length) return [];

  // ---- المرحلة 1: معالجة همزة الوصل ولام التعريف ----
  const stage1: Atom[] = [];
  const words = new Map<number, Atom[]>();
  for (const a of raw) {
    const list = words.get(a.word);
    if (list) list.push(a);
    else words.set(a.word, [a]);
  }

  for (const [wIndex, atoms] of words) {
    const drag = wIndex > 0 || continued;
    const bare = atoms.map((a) => a.l).join('');
    const art = findArticle(atoms);
    let skipUntil = -1;
    let pendingWordStart = true;

    // همزة وصل في غير «ال» (استخرج، ابن، اسم...)
    let waslIdx = -1;
    if (!art) {
      if (atoms[0].l === ALEF && startsWithWasl(bare)) waslIdx = 0;
      else if (
        PREFIXES.has(atoms[0].l) &&
        atoms[1]?.l === ALEF &&
        startsWithWasl(bare.slice(1))
      )
        waslIdx = 1;
    }

    for (let i = 0; i < atoms.length; i++) {
      if (i <= skipUntil) continue;
      const a = atoms[i];

      // ----- همزة الوصل المفردة -----
      if (i === waslIdx) {
        // تُنطق مكسورة عند الابتداء فقط، وتُحذف في الدرج
        if (!drag && i === 0) {
          const h = a.d.split('').find((c) => isHaraka(c)) ?? KASRA;
          stage1.push({
            ...a,
            l: h === KASRA ? ALEF_HAMZA_BELOW : ALEF_HAMZA,
            d: h,
            wordStart: true,
          });
          pendingWordStart = false;
        } else {
          pendingWordStart = false; // ما بعدها ساكن يتصل بما قبله
        }
        continue;
      }

      // ----- «ال» التعريفية -----
      if (art && i === art.hamza) {
        // تُنطق الهمزة مفتوحة عند ابتداء الشطر بها فقط
        if (!drag && i === 0) {
          stage1.push({ ...a, l: ALEF_HAMZA, d: FATHA, wordStart: true });
          pendingWordStart = false;
        } else {
          pendingWordStart = false;
        }
        continue;
      }
      if (art && i === art.lam) {
        const lam = a;
        const next = atoms[i + 1];
        // لام مشدّدة (الَّذي) ليست لام تعريف مدغمة، بل لام مضاعفة
        if (lam.d.includes(SHADDA)) {
          stage1.push({ ...lam, wordStart: false });
          pendingWordStart = false;
          continue;
        }
        if (next && SUN_LETTERS.has(next.l)) {
          // إدغام: تُحذف اللام ويُضاعَف الحرف الشمسي
          if (!next.d.includes(SHADDA)) {
            stage1.push({ ...next, d: SUKUN, virtual: true, wordStart: false });
          }
        } else {
          stage1.push({ ...lam, d: SUKUN, wordStart: false });
        }
        pendingWordStart = false;
        continue;
      }

      stage1.push({ ...a, wordStart: pendingWordStart });
      pendingWordStart = false;
    }
  }

  // ---- المرحلة 2: المدّة، الشدّة، التنوين، الحروف غير المنطوقة ----
  const bareWords = new Map<number, string>();
  for (const [w, atoms] of words) bareWords.set(w, atoms.map((a) => a.l).join(''));

  const stage2: Atom[] = [];
  for (let i = 0; i < stage1.length; i++) {
    const a = stage1[i];
    const next = stage1[i + 1];
    const bare = bareWords.get(a.word) ?? '';
    const isLastOfWord = !next || next.word !== a.word;

    // آ = همزة مفتوحة + ألف
    if (a.l === ALEF_MADDA) {
      stage2.push({ ...a, l: ALEF_HAMZA, d: FATHA });
      stage2.push({ ...a, l: ALEF, d: SUKUN, virtual: true, wordStart: false });
      continue;
    }

    // الألف الخنجرية
    if (a.d.includes(DAGGER_ALEF)) {
      stage2.push({ ...a, d: a.d.replace(DAGGER_ALEF, '') || FATHA });
      stage2.push({ ...a, l: ALEF, d: SUKUN, virtual: true, wordStart: false });
      continue;
    }

    // ألف الجماعة الصامتة: كتبوا ← كتبو
    if (
      a.l === ALEF &&
      isLastOfWord &&
      stage1[i - 1]?.l === WAW &&
      /(وا)$/.test(bare) &&
      bare.length > 2
    ) {
      continue;
    }

    // فكّ الشدّة: حرف ساكن + حرف متحرك
    if (a.d.includes(SHADDA)) {
      const rest = a.d.replace(SHADDA, '');
      stage2.push({ ...a, l: a.l, d: SUKUN, virtual: true, wordStart: false });
      const tan = rest.split('').find((c) => isTanween(c));
      if (tan) {
        stage2.push({ ...a, l: a.l, d: tanwenHaraka(tan), wordStart: a.wordStart });
        stage2.push({ ...a, l: 'ن', d: SUKUN, virtual: true, wordStart: false });
        // ألف التنوين لا تُنطق
        if (next && (next.l === ALEF || next.l === ALEF_MAKSURA) && next.word === a.word) i++;
      } else {
        stage2.push({ ...a, l: a.l, d: rest, wordStart: a.wordStart });
      }
      continue;
    }

    // التنوين ← نون ساكنة
    const tanween = a.d.split('').find((c) => isTanween(c));
    if (tanween) {
      stage2.push({ ...a, d: tanwenHaraka(tanween) });
      stage2.push({ ...a, l: 'ن', d: SUKUN, virtual: true, wordStart: false });
      // ألف التنوين (كتابًا) لا تُنطق
      if (next && (next.l === ALEF || next.l === ALEF_MAKSURA) && next.word === a.word) i++;
      continue;
    }

    stage2.push(a);
  }

  // ---- المرحلة 3: تحديد الحالة (متحرك/ساكن) ----
  const units: Unit[] = [];
  for (let i = 0; i < stage2.length; i++) {
    const a = stage2[i];
    const prev = stage2[i - 1];
    const haraka = a.d.split('').find((c) => isHaraka(c)) ?? '';
    let state: State;

    if (a.l === ALEF || a.l === ALEF_MAKSURA) {
      state = 0;
    } else if (a.d.includes(SUKUN)) {
      state = 0;
    } else if (haraka) {
      state = 1;
    } else if (a.l === WAW && prev && prev.d.includes(DAMMA)) {
      state = 0;
    } else if (a.l === YEH && prev && prev.d.includes(KASRA)) {
      state = 0;
    } else {
      state = null;
    }

    units.push({
      letter: a.l,
      haraka,
      state,
      wordStart: a.wordStart,
      src: a.src,
      word: a.word,
    });
  }

  // أول الكلمة لا يكون ساكناً أبداً
  for (const u of units) if (u.wordStart && u.state === null) u.state = 1;

  // حذف حرف المدّ عند التقاء الساكنين في الدرج: «في المدينة» ← «فِلْمَدِينَة»
  for (let i = units.length - 3; i >= 0; i--) {
    const u = units[i];
    const nx = units[i + 1];
    const isMadd =
      u.letter === ALEF || u.letter === ALEF_MAKSURA || u.letter === WAW || u.letter === YEH;
    if (u.state === 0 && nx.state === 0 && isMadd) units.splice(i, 1);
  }

  if (!units.length) return [];
  if (!saturate) return [units];

  // ---- المرحلة 4: إشباع آخر الشطر ----
  return saturateEnd(units);
}

function tanwenHaraka(t: string): string {
  if (t === FATHATAN) return FATHA;
  if (t === DAMMATAN) return DAMMA;
  if (t === KASRATAN) return KASRA;
  return FATHA;
}

const MADD_OF: Record<string, string> = { [FATHA]: ALEF, [DAMMA]: WAW, [KASRA]: YEH };

/**
 * إشباع حركة الروي: الحرف الأخير المتحرك يتولّد عنه حرف مدّ ساكن.
 * إن كان آخر الشطر غير مشكول أعدنا احتمالين: مطلق (متحرك+مدّ) ومقيّد (ساكن).
 */
function saturateEnd(units: Unit[]): Unit[][] {
  const last = units[units.length - 1];

  const withMadd = (haraka: string): Unit[] => {
    const copy = units.map((u) => ({ ...u }));
    const l = copy[copy.length - 1];
    l.state = 1;
    l.haraka = haraka;
    if (l.letter === TEH_MARBUTA) l.letter = 'ه';
    copy.push({
      letter: MADD_OF[haraka] ?? ALEF,
      haraka: '',
      state: 0,
      wordStart: false,
      src: l.src,
      word: l.word,
    });
    return copy;
  };

  const asSukun = (): Unit[] => {
    const copy = units.map((u) => ({ ...u }));
    const l = copy[copy.length - 1];
    l.state = 0;
    l.haraka = SUKUN;
    if (l.letter === TEH_MARBUTA) l.letter = 'ه';
    return copy;
  };

  // حرف مدّ في الآخر: الشطر منتهٍ بساكن أصلاً
  if (last.state === 0 && (last.letter === ALEF || last.letter === WAW || last.letter === YEH)) {
    return [units];
  }
  if (last.state === 1 && last.haraka) return [withMadd(last.haraka)];
  if (last.state === 0) return [asSukun()];
  // مجهول: جرّب المطلق بحركاته الثلاث ثم المقيّد
  return [withMadd(FATHA), withMadd(DAMMA), withMadd(KASRA), asSukun()];
}

/**
 * تمثيل نصّي للكتابة العروضية (للعرض للمستخدم).
 * لا تُوضع السكون على حروف المدّ لأنها لا تُشكَّل في الرسم المعتاد.
 */
export function unitsToText(units: Unit[]): string {
  return units.map((u, i) => u.letter + mark(u, units[i - 1])).join('');
}

/** علامة التشكيل المناسبة لوحدة عروضية. */
export function mark(u: Unit, prev?: Unit): string {
  if (u.state !== 0) return u.haraka || '';
  if (u.letter === ALEF || u.letter === ALEF_MAKSURA) return '';
  if (u.letter === WAW && prev?.haraka === DAMMA) return '';
  if (u.letter === YEH && prev?.haraka === KASRA) return '';
  return SUKUN;
}

/** التمثيل الرمزي: 1 متحرك، 0 ساكن، ? مجهول. */
export function unitsToBinary(units: Unit[]): string {
  return units.map((u) => (u.state === null ? '?' : String(u.state))).join('');
}

/** الرموز التقليدية: (/) للمتحرك و(°) للساكن. */
export function unitsToSymbols(units: Unit[]): string {
  return units.map((u) => (u.state === 1 ? '/' : u.state === 0 ? '°' : '؟')).join('');
}
