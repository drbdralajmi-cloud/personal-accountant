/**
 * الأوزان الصرفية القياسية.
 * القالب يحمل أرقام 1 و2 و3 مكان حروف الجذر، وما عداها حروفٌ وحركاتٌ ثابتة،
 * فيتحدّد تشكيل الكلمة المشتقّة تحديداً تامّاً — وهذا ما يجعل التقطيع العروضي دقيقاً.
 */

export interface MorphPattern {
  /** اسم الوزن الصرفي، مثل: مَفْعُول. */
  name: string;
  template: string;
  /** دلالة الصيغة. */
  sense: string;
}

export const MORPH_PATTERNS: MorphPattern[] = [
  { name: 'فَعَلَ', template: '1َ2َ3َ', sense: 'فعل ماضٍ ثلاثي' },
  { name: 'يَفْعُلُ', template: 'يَ1ْ2ُ3ُ', sense: 'فعل مضارع' },
  { name: 'فَاعِل', template: '1َا2ِ3', sense: 'اسم الفاعل' },
  { name: 'فَاعِلَة', template: '1َا2ِ3َة', sense: 'اسم الفاعل مؤنثاً' },
  { name: 'مَفْعُول', template: 'مَ1ْ2ُو3', sense: 'اسم المفعول' },
  { name: 'فَعِيل', template: '1َ2ِي3', sense: 'صفة مشبّهة' },
  { name: 'فَعَّال', template: '1َ2َّا3', sense: 'صيغة مبالغة أو حرفة' },
  { name: 'فُعَّال', template: '1ُ2َّا3', sense: 'جمع فاعل' },
  { name: 'مَفْعَل', template: 'مَ1ْ2َ3', sense: 'اسم مكان أو مصدر ميمي' },
  { name: 'مَفْعِل', template: 'مَ1ْ2ِ3', sense: 'اسم مكان' },
  { name: 'مَفْعَلَة', template: 'مَ1ْ2َ3َة', sense: 'اسم مكان' },
  { name: 'مِفْعَال', template: 'مِ1ْ2َا3', sense: 'اسم آلة' },
  { name: 'مِفْعَل', template: 'مِ1ْ2َ3', sense: 'اسم آلة' },
  { name: 'فَعْلَة', template: '1َ2ْ3َة', sense: 'اسم المرّة' },
  { name: 'فِعْلَة', template: '1ِ2ْ3َة', sense: 'اسم الهيئة' },
  { name: 'فُعْلَة', template: '1ُ2ْ3َة', sense: 'اسم' },
  { name: 'فُعُول', template: '1ُ2ُو3', sense: 'مصدر' },
  { name: 'فِعَال', template: '1ِ2َا3', sense: 'مصدر أو جمع' },
  { name: 'أَفْعَال', template: 'أَ1ْ2َا3', sense: 'جمع تكسير' },
  { name: 'فَوَاعِل', template: '1َوَا2ِ3', sense: 'جمع تكسير' },
  { name: 'تَفْعِيل', template: 'تَ1ْ2ِي3', sense: 'مصدر فعّل' },
  { name: 'مُفَعِّل', template: 'مُ1َ2ِّ3', sense: 'اسم فاعل من فعّل' },
  { name: 'مُفَعَّل', template: 'مُ1َ2َّ3', sense: 'اسم مفعول من فعّل' },
  { name: 'مُفَاعَلَة', template: 'مُ1َا2َ3َة', sense: 'مصدر فاعَل' },
  { name: 'مُفَاعِل', template: 'مُ1َا2ِ3', sense: 'اسم فاعل من فاعَل' },
  { name: 'إِفْعَال', template: 'إِ1ْ2َا3', sense: 'مصدر أفعل' },
  { name: 'مُفْعِل', template: 'مُ1ْ2ِ3', sense: 'اسم فاعل من أفعل' },
  { name: 'مُفْعَل', template: 'مُ1ْ2َ3', sense: 'اسم مفعول من أفعل' },
  { name: 'تَفَعُّل', template: 'تَ1َ2ُّ3', sense: 'مصدر تفعّل' },
  { name: 'مُتَفَعِّل', template: 'مُتَ1َ2ِّ3', sense: 'اسم فاعل من تفعّل' },
  { name: 'تَفَاعُل', template: 'تَ1َا2ُ3', sense: 'مصدر تفاعل' },
  { name: 'مُتَفَاعِل', template: 'مُتَ1َا2ِ3', sense: 'اسم فاعل من تفاعل' },
  { name: 'انْفِعَال', template: 'اِنْ1ِ2َا3', sense: 'مصدر انفعل' },
  { name: 'مُنْفَعِل', template: 'مُنْ1َ2ِ3', sense: 'اسم فاعل من انفعل' },
  { name: 'افْتِعَال', template: 'اِ1ْتِ2َا3', sense: 'مصدر افتعل' },
  { name: 'مُفْتَعِل', template: 'مُ1ْتَ2ِ3', sense: 'اسم فاعل من افتعل' },
  { name: 'اسْتِفْعَال', template: 'اِسْتِ1ْ2َا3', sense: 'مصدر استفعل' },
  { name: 'مُسْتَفْعِل', template: 'مُسْتَ1ْ2ِ3', sense: 'اسم فاعل من استفعل' },
  // جموع وصيغ طويلة تملأ التفعيلات السباعية
  { name: 'فِعَالَات', template: '1ِ2َا3َات', sense: 'جمع مؤنث سالم' },
  { name: 'فَاعِلَات', template: '1َا2ِ3َات', sense: 'جمع اسم الفاعل' },
  { name: 'مَفْعُولَات', template: 'مَ1ْ2ُو3َات', sense: 'جمع اسم المفعول' },
  { name: 'مُفَاعَلَات', template: 'مُ1َا2َ3َات', sense: 'جمع مصدر فاعَل' },
  { name: 'تَفْعِيلَات', template: 'تَ1ْ2ِي3َات', sense: 'جمع مصدر فعّل' },
  { name: 'اسْتِفْعَالَات', template: 'اِسْتِ1ْ2َا3َات', sense: 'جمع مصدر استفعل' },
  { name: 'مَفَاعِل', template: 'مَ1َا2ِ3', sense: 'جمع تكسير' },
  { name: 'فُعَلَاء', template: '1ُ2َ3َاء', sense: 'جمع فعيل' },
  { name: 'أَفْعِلَة', template: 'أَ1ْ2ِ3َة', sense: 'جمع تكسير' },
  { name: 'فَعَالَة', template: '1َ2َا3َة', sense: 'مصدر' },
  { name: 'فَعَالِيّ', template: '1َ2َا3ِيّ', sense: 'نسب' },
  { name: 'انْفِعَالَات', template: 'اِنْ1ِ2َا3َات', sense: 'جمع مصدر انفعل' },
  { name: 'مُتَفَاعِلَات', template: 'مُتَ1َا2ِ3َات', sense: 'جمع اسم فاعل تفاعل' },
  { name: 'يَتَفَاعَلُ', template: 'يَتَ1َا2َ3ُ', sense: 'مضارع تفاعل' },
  { name: 'يَسْتَفْعِلُ', template: 'يَسْتَ1ْ2ِ3ُ', sense: 'مضارع استفعل' },
];

/** توليد كلمة مشكولة من جذر ووزن. */
export function derive(root: string, pattern: MorphPattern): string | null {
  if (root.length !== 3) return null;
  let out = '';
  for (const ch of pattern.template) {
    if (ch === '1') out += root[0];
    else if (ch === '2') out += root[1];
    else if (ch === '3') out += root[2];
    else out += ch;
  }
  return out;
}
