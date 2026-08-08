/**
 * البحور الشعرية: تفعيلات كل شطر، وما يجوز فيها من زحافات وعلل.
 * كل بحر يُمثَّل بقائمة «خانات» (slots)، وكل خانة تحمل الصور الجائزة لتفعيلتها.
 */

import { FEET, FootId, FootVariant } from './feet';

export type SlotRole = 'حشو' | 'عروض' | 'ضرب';

export interface Slot {
  role: SlotRole;
  base: FootId;
  variants: FootVariant[];
}

export type MeterForm = 'تام' | 'مجزوء' | 'مشطور' | 'منهوك' | 'مخلّع';

/**
 * النظام العروضي الذي ينتمي إليه الوزن.
 *  - «خليلي»: عروض الخليل بن أحمد، وهو ميزان الشعر الفصيح، ويُقاس بالحرف.
 *  - «نبطي»: طروق الشعر النبطي (الشعبي)، وتُسمَّى بتفعيلاتها على وجه التقريب،
 *            وتُقاس باللحن قبل الحرف، فتتّسع لما لا يتّسع له الخليلي.
 * الحقل اختياريّ، وغيابه يعني «خليلي».
 */
export type ProsodySystem = 'خليلي' | 'نبطي';

export interface Meter {
  id: string;
  slug: string;
  system?: ProsodySystem;
  /** اسم البحر كاملاً، مثل: «الكامل» أو «مجزوء الكامل». */
  name: string;
  /** العائلة، مثل: «الكامل» — تجمع التام والمجزوء. */
  family: string;
  form: MeterForm;
  /** مفتاح البحر (البيت الذي يُحفظ به). */
  key: string;
  /** التفعيلات كما تُكتب في الكتب. */
  formula: string;
  sadr: Slot[];
  /** يكون فارغاً في المشطور والمنهوك (البيت شطر واحد). */
  ajz: Slot[];
  description: string;
  /** الجرس والاستعمال. */
  tone: string;
  example: { verse: string; poet: string };
  /** وزن الشيوع 0–10، يُستعمل في ترجيح النتائج المتشابهة. */
  frequency: number;
}

const hashw = (base: FootId): Slot => ({
  role: 'حشو',
  base,
  variants: FEET[base].zihafat,
});

/** خانة عروض أو ضرب: تُنتقى صورها بالتمثيل الرمزي من زحافات التفعيلة وعللها. */
const end = (role: SlotRole, base: FootId, patterns: string[]): Slot => {
  const pool = [...FEET[base].zihafat, ...FEET[base].ilal];
  const variants = patterns.map((p) => {
    const found = pool.find((x) => x.pattern === p);
    if (!found) throw new Error(`صورة غير معرّفة للتفعيلة ${base}: ${p}`);
    return { ...found, cost: 0 };
  });
  return { role, base, variants };
};

const arud = (base: FootId, patterns: string[]) => end('عروض', base, patterns);
const darb = (base: FootId, patterns: string[]) => end('ضرب', base, patterns);

/**
 * خانة عروض/ضرب «صحيحة»: تقبل التفعيلة سالمةً وبكل زحافاتها الجائزة،
 * إضافةً إلى ما يُذكر من العلل. الزحاف يدخل العروض والضرب كما يدخل الحشو.
 */
const endZ = (role: SlotRole, base: FootId, extra: string[] = []): Slot => {
  const zihafat = FEET[base].zihafat.map((x) => ({ ...x, cost: x.cost === 0 ? 0 : 0.5 }));
  const ilal = end(role, base, extra).variants;
  return { role, base, variants: [...zihafat, ...ilal] };
};

const arudZ = (base: FootId, extra: string[] = []) => endZ('عروض', base, extra);
const darbZ = (base: FootId, extra: string[] = []) => endZ('ضرب', base, extra);

export const METERS: Meter[] = [
  {
    id: 'taweel',
    slug: 'taweel',
    name: 'الطويل',
    family: 'الطويل',
    form: 'تام',
    key: 'طَوِيلٌ لَهُ دُونَ البُحُورِ فَضَائِلُ — فَعُولُنْ مَفَاعِيلُنْ فَعُولُنْ مَفَاعِلُ',
    formula: 'فَعُولُنْ مَفَاعِيلُنْ فَعُولُنْ مَفَاعِيلُنْ',
    sadr: [hashw('faulun'), hashw('mafailun'), hashw('faulun'), arud('mafailun', ['110110', '1101010'])],
    ajz: [
      hashw('faulun'),
      hashw('mafailun'),
      hashw('faulun'),
      darb('mafailun', ['1101010', '110110', '11010']),
    ],
    description:
      'أكثر البحور استعمالاً في الشعر العربي القديم. عروضه مقبوضة دائماً (مَفَاعِلُنْ)، وله ثلاثة أضرب: صحيح ومقبوض ومحذوف.',
    tone: 'رحب النَّفَس، يصلح للحكمة والفخر والوصف الطويل.',
    example: {
      verse: 'قِفَا نَبْكِ مِنْ ذِكْرَى حَبِيبٍ وَمَنْزِلِ … بِسِقْطِ اللِّوَى بَيْنَ الدَّخُولِ فَحَوْمَلِ',
      poet: 'امرؤ القيس',
    },
    frequency: 10,
  },
  {
    id: 'madeed',
    slug: 'madeed',
    name: 'المديد',
    family: 'المديد',
    form: 'تام',
    key: 'لِمَدِيدِ الشِّعْرِ عِنْدِي صِفَاتُ — فَاعِلَاتُنْ فَاعِلُنْ فَاعِلَاتُ',
    formula: 'فَاعِلَاتُنْ فَاعِلُنْ فَاعِلَاتُنْ',
    sadr: [hashw('failatun'), hashw('failun'), arudZ('failatun', ['10110', '1110', '101100'])],
    ajz: [hashw('failatun'), hashw('failun'), darbZ('failatun', ['10110', '1110', '101100'])],
    description:
      'بحر قليل الورود، لا يأتي إلا مجزوءاً عن أصله السداسي. عروضه محذوفة في الأشهر.',
    tone: 'رقيق النغم، يميل إلى الغناء والرثاء.',
    example: {
      verse: 'يَا لَبَكْرٍ أَنْشِرُوا لِي كُلَيْبًا … يَا لَبَكْرٍ أَيْنَ أَيْنَ الفِرَارُ',
      poet: 'المهلهل',
    },
    frequency: 3,
  },
  {
    id: 'baseet',
    slug: 'baseet',
    name: 'البسيط',
    family: 'البسيط',
    form: 'تام',
    key: 'إِنَّ البَسِيطَ لَدَيْهِ يُبْسَطُ الأَمَلُ — مُسْتَفْعِلُنْ فَعِلُنْ مُسْتَفْعِلُنْ فَعِلُ',
    formula: 'مُسْتَفْعِلُنْ فَاعِلُنْ مُسْتَفْعِلُنْ فَاعِلُنْ',
    sadr: [
      hashw('mustafilun'),
      hashw('failun'),
      hashw('mustafilun'),
      arudZ('failun', ['1010', '101100']),
    ],
    ajz: [
      hashw('mustafilun'),
      hashw('failun'),
      hashw('mustafilun'),
      darbZ('failun', ['1010', '101100']),
    ],
    description:
      'من أشهر البحور وأكثرها طواعية. عروضه مخبونة (فَعِلُنْ)، وأضربه: مخبون ومقطوع ومذيَّل.',
    tone: 'جزل واضح، يصلح للمدح والحكمة والوصف.',
    example: {
      verse: 'الخَيْلُ وَاللَّيْلُ وَالبَيْدَاءُ تَعْرِفُنِي … وَالسَّيْفُ وَالرُّمْحُ وَالقِرْطَاسُ وَالقَلَمُ',
      poet: 'المتنبي',
    },
    frequency: 9,
  },
  {
    id: 'baseet-majzu',
    slug: 'baseet-majzu',
    name: 'مجزوء البسيط',
    family: 'البسيط',
    form: 'مجزوء',
    key: 'مُسْتَفْعِلُنْ فَاعِلُنْ مُسْتَفْعِلُنْ',
    formula: 'مُسْتَفْعِلُنْ فَاعِلُنْ مُسْتَفْعِلُنْ',
    sadr: [hashw('mustafilun'), hashw('failun'), arudZ('mustafilun', ['101010', '10101100'])],
    ajz: [
      hashw('mustafilun'),
      hashw('failun'),
      darbZ('mustafilun', ['101010', '10101100']),
    ],
    description: 'صورة مجزوءة من البسيط بحذف التفعيلة الأخيرة من كل شطر.',
    tone: 'خفيف سريع، كثير في الموشحات والشعر الغنائي.',
    example: {
      verse: 'مَاذَا وَقُوفِي عَلَى رَبْعٍ عَفَا … مُخْلَوْلِقٍ دَارِسٍ مُسْتَعْجِمِ',
      poet: 'من شواهد العروضيين',
    },
    frequency: 5,
  },
  {
    id: 'baseet-mukhalla',
    slug: 'baseet-mukhalla',
    name: 'مخلّع البسيط',
    family: 'البسيط',
    form: 'مخلّع',
    key: 'مُسْتَفْعِلُنْ فَاعِلُنْ فَعُولُنْ',
    formula: 'مُسْتَفْعِلُنْ فَاعِلُنْ فَعُولُنْ',
    sadr: [hashw('mustafilun'), hashw('failun'), arud('mustafilun', ['11010'])],
    ajz: [hashw('mustafilun'), hashw('failun'), darb('mustafilun', ['11010'])],
    description: 'مجزوء البسيط الذي دخل ضربه وعروضه الخبن مع القطع فصارا (فَعُولُنْ).',
    tone: 'رشيق قصير، شائع في الشعر التعليمي والزهديات.',
    example: {
      verse: 'مُسْتَفْعِلُنْ فَاعِلُنْ فَعُولُنْ … مُسْتَفْعِلُنْ فَاعِلُنْ فَعُولُنْ',
      poet: 'من شواهد العروضيين',
    },
    frequency: 4,
  },
  {
    id: 'wafir',
    slug: 'wafir',
    name: 'الوافر',
    family: 'الوافر',
    form: 'تام',
    key: 'بُحُورُ الشِّعْرِ وَافِرُهَا جَمِيلُ — مُفَاعَلَتُنْ مُفَاعَلَتُنْ فَعُولُنْ',
    formula: 'مُفَاعَلَتُنْ مُفَاعَلَتُنْ فَعُولُنْ',
    sadr: [hashw('mufaalatun'), hashw('mufaalatun'), arud('mufaalatun', ['11010'])],
    ajz: [hashw('mufaalatun'), hashw('mufaalatun'), darb('mufaalatun', ['11010'])],
    description:
      'بحر مطرب تنفرد تفعيلته (مُفَاعَلَتُنْ) بالفاصلة الصغرى. عروضه وضربه مقطوفان دائماً.',
    tone: 'قوي متدفّق، يصلح للفخر والحماسة والغزل.',
    example: {
      verse: 'أَلَا لَا يَجْهَلَنْ أَحَدٌ عَلَيْنَا … فَنَجْهَلَ فَوْقَ جَهْلِ الجَاهِلِينَا',
      poet: 'عمرو بن كلثوم',
    },
    frequency: 9,
  },
  {
    id: 'wafir-majzu',
    slug: 'wafir-majzu',
    name: 'مجزوء الوافر',
    family: 'الوافر',
    form: 'مجزوء',
    key: 'مُفَاعَلَتُنْ مُفَاعَلَتُنْ',
    formula: 'مُفَاعَلَتُنْ مُفَاعَلَتُنْ',
    sadr: [hashw('mufaalatun'), arudZ('mufaalatun')],
    ajz: [hashw('mufaalatun'), darbZ('mufaalatun')],
    description: 'صورة مجزوءة من الوافر، عروضها وضربها صحيحان أو معصوبان.',
    tone: 'خفيف غنائي.',
    example: {
      verse: 'مُفَاعَلَتُنْ مُفَاعَلَتُنْ … مُفَاعَلَتُنْ مُفَاعَلَتُنْ',
      poet: 'من شواهد العروضيين',
    },
    frequency: 4,
  },
  {
    id: 'kamil',
    slug: 'kamil',
    name: 'الكامل',
    family: 'الكامل',
    form: 'تام',
    key: 'كَمُلَ الجَمَالُ مِنَ البُحُورِ الكَامِلُ — مُتَفَاعِلُنْ مُتَفَاعِلُنْ مُتَفَاعِلُ',
    formula: 'مُتَفَاعِلُنْ مُتَفَاعِلُنْ مُتَفَاعِلُنْ',
    sadr: [
      hashw('mutafailun'),
      hashw('mutafailun'),
      arudZ('mutafailun', ['111010', '1110', '1010', '101010']),
    ],
    ajz: [
      hashw('mutafailun'),
      hashw('mutafailun'),
      darbZ('mutafailun', ['111010', '1110', '1010', '101010', '11101100', '10101100']),
    ],
    description:
      'ثاني البحور شيوعاً بعد الطويل. تفعيلته (مُتَفَاعِلُنْ) وأشهر زحافه الإضمار الذي يحوّلها إلى (مُسْتَفْعِلُنْ).',
    tone: 'رصين موسيقي، يستوعب الحماسة والرثاء والغزل.',
    example: {
      verse: 'وَإِذَا أَتَتْكَ مَذَمَّتِي مِنْ نَاقِصٍ … فَهِيَ الشَّهَادَةُ لِي بِأَنِّي كَامِلُ',
      poet: 'المتنبي',
    },
    frequency: 10,
  },
  {
    id: 'kamil-majzu',
    slug: 'kamil-majzu',
    name: 'مجزوء الكامل',
    family: 'الكامل',
    form: 'مجزوء',
    key: 'مُتَفَاعِلُنْ مُتَفَاعِلُنْ',
    formula: 'مُتَفَاعِلُنْ مُتَفَاعِلُنْ',
    sadr: [hashw('mutafailun'), arudZ('mutafailun', ['111010', '1110', '1010', '101010'])],
    ajz: [
      hashw('mutafailun'),
      darbZ('mutafailun', ['11101100', '10101100', '111010', '1110', '1010', '101010']),
    ],
    description: 'صورة مجزوءة من الكامل، وأشهر أضربها المذيَّل (مُتَفَاعِلَانْ).',
    tone: 'غنائي سريع، كثير في شعر المعاصرين.',
    example: {
      verse: 'مُتَفَاعِلُنْ مُتَفَاعِلُنْ … مُتَفَاعِلُنْ مُتَفَاعِلُنْ',
      poet: 'من شواهد العروضيين',
    },
    frequency: 7,
  },
  {
    id: 'hazaj',
    slug: 'hazaj',
    name: 'الهزج',
    family: 'الهزج',
    form: 'مجزوء',
    key: 'عَلَى الأَهْزَاجِ تَسْهِيلُ — مَفَاعِيلُنْ مَفَاعِيلُنْ',
    formula: 'مَفَاعِيلُنْ مَفَاعِيلُنْ',
    sadr: [hashw('mafailun'), arudZ('mafailun', ['11010', '110100'])],
    ajz: [hashw('mafailun'), darbZ('mafailun', ['11010', '110100'])],
    description: 'بحر لا يُستعمل إلا مجزوءاً، تفعيلته (مَفَاعِيلُنْ) مرتين في كل شطر.',
    tone: 'راقص خفيف، أقرب إلى الغناء.',
    example: {
      verse: 'عَلَى الأَهْزَاجِ تَسْهِيلُ … مَفَاعِيلُنْ مَفَاعِيلُنْ',
      poet: 'من شواهد العروضيين',
    },
    frequency: 4,
  },
  {
    id: 'rajaz',
    slug: 'rajaz',
    name: 'الرجز',
    family: 'الرجز',
    form: 'تام',
    key: 'فِي أَبْحُرِ الأَرْجَازِ بَحْرٌ يَسْهُلُ — مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ',
    formula: 'مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ',
    sadr: [hashw('mustafilun'), hashw('mustafilun'), arudZ('mustafilun', ['101010', '10101100'])],
    ajz: [hashw('mustafilun'), hashw('mustafilun'), darbZ('mustafilun', ['101010', '10101100'])],
    description:
      'يسمّى «حمار الشعراء» لسهولته. تفعيلته (مُسْتَفْعِلُنْ) ثلاثاً في كل شطر، ويكثر فيه الخبن والطيّ.',
    tone: 'سهل مرن، بحر المتون التعليمية والأراجيز.',
    example: {
      verse: 'دَارٌ لِسَلْمَى إِذْ سُلَيْمَى جَارَةٌ … قَفْرٌ تَرَى آيَاتِهَا مِثْلَ الزُّبُرْ',
      poet: 'من شواهد العروضيين',
    },
    frequency: 7,
  },
  {
    id: 'rajaz-majzu',
    slug: 'rajaz-majzu',
    name: 'مجزوء الرجز',
    family: 'الرجز',
    form: 'مجزوء',
    key: 'مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ',
    formula: 'مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ',
    sadr: [hashw('mustafilun'), arudZ('mustafilun', ['101010', '10101100'])],
    ajz: [hashw('mustafilun'), darbZ('mustafilun', ['101010', '10101100'])],
    description: 'صورة مجزوءة من الرجز بتفعيلتين في كل شطر.',
    tone: 'سريع النبض، كثير في الأناشيد.',
    example: {
      verse: 'قَدْ هَاجَ قَلْبِي مَنْزِلٌ … مِنْ أُمِّ عَمْرٍو مُقْفِرُ',
      poet: 'من شواهد العروضيين',
    },
    frequency: 5,
  },
  {
    id: 'rajaz-mashtoor',
    slug: 'rajaz-mashtoor',
    name: 'مشطور الرجز',
    family: 'الرجز',
    form: 'مشطور',
    key: 'مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ (شطر واحد)',
    formula: 'مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ',
    sadr: [hashw('mustafilun'), hashw('mustafilun'), darbZ('mustafilun', ['101010', '10101100'])],
    ajz: [],
    description: 'بيت الرجز إذا صار شطراً واحداً — كثير في أراجيز الحرب.',
    tone: 'حماسي مقتضب.',
    example: { verse: 'يَا لَيْتَنِي فِيهَا جَذَعْ', poet: 'من شواهد العروضيين' },
    frequency: 3,
  },
  {
    id: 'raml',
    slug: 'raml',
    name: 'الرمل',
    family: 'الرمل',
    form: 'تام',
    key: 'رَمَلُ الأَبْحُرِ تَرْوِيهِ الثِّقَاتْ — فَاعِلَاتُنْ فَاعِلَاتُنْ فَاعِلَاتْ',
    formula: 'فَاعِلَاتُنْ فَاعِلَاتُنْ فَاعِلَاتُنْ',
    sadr: [hashw('failatun'), hashw('failatun'), arudZ('failatun', ['10110', '1110', '101100'])],
    ajz: [hashw('failatun'), hashw('failatun'), darbZ('failatun', ['10110', '1110', '101100'])],
    description: 'تفعيلته (فَاعِلَاتُنْ) ثلاثاً في كل شطر، وعروضه محذوفة في الأشهر.',
    tone: 'ليّن حزين، يصلح للرثاء والشكوى.',
    example: {
      verse: 'رَمَلُ الأَبْحُرِ تَرْوِيهِ الثِّقَاتْ … فَاعِلَاتُنْ فَاعِلَاتُنْ فَاعِلَاتْ',
      poet: 'من شواهد العروضيين',
    },
    frequency: 7,
  },
  {
    id: 'raml-majzu',
    slug: 'raml-majzu',
    name: 'مجزوء الرمل',
    family: 'الرمل',
    form: 'مجزوء',
    key: 'فَاعِلَاتُنْ فَاعِلَاتُنْ',
    formula: 'فَاعِلَاتُنْ فَاعِلَاتُنْ',
    sadr: [hashw('failatun'), arudZ('failatun', ['10110', '101100'])],
    ajz: [hashw('failatun'), darbZ('failatun', ['10110', '101100'])],
    description: 'صورة مجزوءة من الرمل بتفعيلتين في كل شطر.',
    tone: 'غنائي رقيق.',
    example: {
      verse: 'لَيْتَ شِعْرِي هَلْ أَبِيتَنْ … لَيْلَةً لَا أَسْتَكِينُ',
      poet: 'من شواهد العروضيين',
    },
    frequency: 5,
  },
  {
    id: 'sari',
    slug: 'sari',
    name: 'السريع',
    family: 'السريع',
    form: 'تام',
    key: 'بَحْرٌ سَرِيعٌ مَا لَهُ سَاحِلُ — مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ فَاعِلُ',
    formula: 'مُسْتَفْعِلُنْ مُسْتَفْعِلُنْ مَفْعُولَاتُ',
    sadr: [hashw('mustafilun'), hashw('mustafilun'), arud('mafulatu', ['10110', '1110', '1010', '101010', '1010100'])],
    ajz: [hashw('mustafilun'), hashw('mustafilun'), darb('mafulatu', ['10110', '1110', '1010', '101010', '1010100'])],
    description:
      'عروضه وضربه مطويّان مكشوفان فيصيران (فَاعِلُنْ). يكثر فيه الطيّ والخبن في الحشو.',
    tone: 'سريع الإيقاع كاسمه، يصلح للحكمة والهجاء.',
    example: {
      verse: 'وَالنَّاسُ لِلْمَوْتِ كَأَفْرَاسِهِمْ … فَسَابِقٌ يَجْرِي وَمَسْبُوقُ',
      poet: 'من شواهد العروضيين',
    },
    frequency: 5,
  },
  {
    id: 'munsarih',
    slug: 'munsarih',
    name: 'المنسرح',
    family: 'المنسرح',
    form: 'تام',
    key: 'مُنْسَرِحٌ فِيهِ يُضْرَبُ المَثَلُ — مُسْتَفْعِلُنْ مَفْعُولَاتُ مُفْتَعِلُ',
    formula: 'مُسْتَفْعِلُنْ مَفْعُولَاتُ مُسْتَفْعِلُنْ',
    sadr: [hashw('mustafilun'), hashw('mafulatu'), arudZ('mustafilun', ['101010'])],
    ajz: [hashw('mustafilun'), hashw('mafulatu'), darbZ('mustafilun', ['101010'])],
    description: 'يتوسّطه (مَفْعُولَاتُ) بوتده المفروق، وضربه مطويّ (مُفْتَعِلُنْ) في الأشهر.',
    tone: 'متموّج، يصلح للحكمة والوصف.',
    example: {
      verse: 'إِنَّ ابْنَ زَيْدٍ لَا زَالَ مُسْتَعْمَلًا … لِلْخَيْرِ يُفْشِي فِي مِصْرِهِ العُرُفَا',
      poet: 'من شواهد العروضيين',
    },
    frequency: 4,
  },
  {
    id: 'khafeef',
    slug: 'khafeef',
    name: 'الخفيف',
    family: 'الخفيف',
    form: 'تام',
    key: 'يَا خَفِيفًا خَفَّتْ بِهِ الحَرَكَاتُ — فَاعِلَاتُنْ مُسْتَفْعِلُنْ فَاعِلَاتُ',
    formula: 'فَاعِلَاتُنْ مُسْتَفْعِ لُنْ فَاعِلَاتُنْ',
    sadr: [hashw('failatun'), hashw('mustafilun'), arudZ('failatun', ['10110', '1110'])],
    ajz: [hashw('failatun'), hashw('mustafilun'), darbZ('failatun', ['10110', '1110'])],
    description:
      'من أعذب البحور. تفعيلته الوسطى (مُسْتَفْعِ لُنْ) بوتد مفروق، وعروضه صحيحة في الأشهر.',
    tone: 'عذب سلس، من أكثر البحور في الشعر الأندلسي والحديث.',
    example: {
      verse: 'إِنَّ فِي الشَّكِّ وَالتَّرَدُّدِ مَوْتًا … وَلَقَاءُ اليَقِينِ خَيْرٌ لِنَفْسِي',
      poet: 'من شواهد العروضيين',
    },
    frequency: 8,
  },
  {
    id: 'khafeef-majzu',
    slug: 'khafeef-majzu',
    name: 'مجزوء الخفيف',
    family: 'الخفيف',
    form: 'مجزوء',
    key: 'فَاعِلَاتُنْ مُسْتَفْعِ لُنْ',
    formula: 'فَاعِلَاتُنْ مُسْتَفْعِ لُنْ',
    sadr: [hashw('failatun'), arudZ('mustafilun')],
    ajz: [hashw('failatun'), darbZ('mustafilun')],
    description: 'صورة مجزوءة من الخفيف بتفعيلتين في كل شطر.',
    tone: 'خفيف غنائي.',
    example: {
      verse: 'لَيْتَ شِعْرِي مَاذَا تَرَى … أَعُيُونٌ أَمِ الظُّبَى',
      poet: 'من شواهد العروضيين',
    },
    frequency: 4,
  },
  {
    id: 'mudari',
    slug: 'mudari',
    name: 'المضارع',
    family: 'المضارع',
    form: 'مجزوء',
    key: 'تُعَدُّ المُضَارِعَاتُ — مَفَاعِيلُ فَاعِلَاتُنْ',
    formula: 'مَفَاعِيلُنْ فَاعِلَاتُنْ',
    sadr: [hashw('mafailun'), arudZ('failatun')],
    ajz: [hashw('mafailun'), darbZ('failatun')],
    description: 'بحر نادر لا يأتي إلا مجزوءاً، وأكثر ما ترد أولاه مكفوفة (مَفَاعِيلُ).',
    tone: 'رقيق نادر الاستعمال.',
    example: {
      verse: 'دَعَانِي مِنَ المَلَامِ … فَإِنِّي أُحِبُّ سَلْمَى',
      poet: 'من شواهد العروضيين',
    },
    frequency: 2,
  },
  {
    id: 'muqtadab',
    slug: 'muqtadab',
    name: 'المقتضب',
    family: 'المقتضب',
    form: 'مجزوء',
    key: 'اقْتُضِبَ كَمَا سَأَلُوا — مَفْعُولَاتُ مُفْتَعِلُنْ',
    formula: 'مَفْعُولَاتُ مُسْتَفْعِلُنْ',
    sadr: [hashw('mafulatu'), arud('mustafilun', ['101110', '11110'])],
    ajz: [hashw('mafulatu'), darb('mustafilun', ['101110', '11110'])],
    description: 'بحر نادر مجزوء، ضربه مطويّ دائماً (مُفْتَعِلُنْ).',
    tone: 'مقتضب سريع.',
    example: {
      verse: 'مَفْعُولَاتُ مُفْتَعِلُنْ … مَفْعُولَاتُ مُفْتَعِلُنْ',
      poet: 'من شواهد العروضيين',
    },
    frequency: 2,
  },
  {
    id: 'mujtath',
    slug: 'mujtath',
    name: 'المجتث',
    family: 'المجتث',
    form: 'مجزوء',
    key: 'أَنِ اجْتُثَّتْ حَرَكَاتُ — مُسْتَفْعِ لُنْ فَاعِلَاتُنْ',
    formula: 'مُسْتَفْعِ لُنْ فَاعِلَاتُنْ',
    sadr: [hashw('mustafilun'), arudZ('failatun', ['10110'])],
    ajz: [hashw('mustafilun'), darbZ('failatun', ['10110'])],
    description: 'بحر مجزوء دائماً، قريب الجرس من الخفيف.',
    tone: 'هادئ رقيق.',
    example: {
      verse: 'البَطْنُ مِنْهُ خَمِيصٌ … وَالوَجْهُ مِثْلُ الهِلَالِ',
      poet: 'من شواهد العروضيين',
    },
    frequency: 3,
  },
  {
    id: 'mutaqarib',
    slug: 'mutaqarib',
    name: 'المتقارب',
    family: 'المتقارب',
    form: 'تام',
    key: 'عَنِ المُتَقَارِبِ قَالَ الخَلِيلُ — فَعُولُنْ فَعُولُنْ فَعُولُنْ فَعُولُ',
    formula: 'فَعُولُنْ فَعُولُنْ فَعُولُنْ فَعُولُنْ',
    sadr: [hashw('faulun'), hashw('faulun'), hashw('faulun'), arudZ('faulun', ['110', '1100', '10'])],
    ajz: [
      hashw('faulun'),
      hashw('faulun'),
      hashw('faulun'),
      darbZ('faulun', ['110', '1100', '10']),
    ],
    description: 'تفعيلته (فَعُولُنْ) أربعاً في كل شطر، وأشهر زحافه القبض (فَعُولُ).',
    tone: 'متسارع النبض، يصلح للملاحم والحكايات.',
    example: {
      verse: 'عَنِ المُتَقَارِبِ قَالَ الخَلِيلُ … فَعُولُنْ فَعُولُنْ فَعُولُنْ فَعُولُ',
      poet: 'من شواهد العروضيين',
    },
    frequency: 7,
  },
  {
    id: 'mutaqarib-majzu',
    slug: 'mutaqarib-majzu',
    name: 'مجزوء المتقارب',
    family: 'المتقارب',
    form: 'مجزوء',
    key: 'فَعُولُنْ فَعُولُنْ فَعُولُنْ',
    formula: 'فَعُولُنْ فَعُولُنْ فَعُولُنْ',
    sadr: [hashw('faulun'), hashw('faulun'), arudZ('faulun', ['110', '1100', '10'])],
    ajz: [hashw('faulun'), hashw('faulun'), darbZ('faulun', ['110', '1100', '10'])],
    description: 'صورة مجزوءة من المتقارب بثلاث تفعيلات في كل شطر.',
    tone: 'سريع خفيف.',
    example: { verse: 'وَمَا ذَاكَ إِلَّا لِأَنِّي … رَأَيْتُ الهَوَى قَاتِلِي', poet: 'من شواهد العروضيين' },
    frequency: 3,
  },
  {
    id: 'mutadarik',
    slug: 'mutadarik',
    name: 'المتدارك',
    family: 'المتدارك',
    form: 'تام',
    key: 'حَرَكَاتُ المُحْدَثِ تَنْتَقِلُ — فَعِلُنْ فَعِلُنْ فَعِلُنْ فَعِلُ',
    formula: 'فَاعِلُنْ فَاعِلُنْ فَاعِلُنْ فَاعِلُنْ',
    sadr: [hashw('failun'), hashw('failun'), hashw('failun'), arudZ('failun', ['1010', '101100'])],
    ajz: [
      hashw('failun'),
      hashw('failun'),
      hashw('failun'),
      darbZ('failun', ['1010', '101100']),
    ],
    description:
      'استدركه الأخفش على الخليل، ويسمّى المحدَث والخبَب. تفعيلته (فَاعِلُنْ) أربعاً في كل شطر.',
    tone: 'راقص سريع، كثير في شعر الأطفال والأناشيد.',
    example: {
      verse: 'حَرَكَاتُ المُحْدَثِ تَنْتَقِلُ … فَعِلُنْ فَعِلُنْ فَعِلُنْ فَعِلُ',
      poet: 'من شواهد العروضيين',
    },
    frequency: 5,
  },
];

/** الخبب: صورة خاصة من المتدارك تتعاقب فيها (فَعْلُنْ) و(فَعِلُنْ) بحرية. */
const khababVariants: FootVariant[] = [
  { pattern: '1010', name: 'فَعْلُنْ', change: 'خبَبية', cost: 0 },
  { pattern: '1110', name: 'فَعِلُنْ', change: 'خبَبية', cost: 0 },
];

METERS.push({
  id: 'khabab',
  slug: 'khabab',
  name: 'الخبَب',
  family: 'المتدارك',
  form: 'تام',
  key: 'فَعْلُنْ فَعْلُنْ فَعْلُنْ فَعْلُنْ',
  formula: 'فَعْلُنْ / فَعِلُنْ × ٤',
  sadr: Array.from({ length: 4 }, (_, i) => ({
    role: (i === 3 ? 'عروض' : 'حشو') as SlotRole,
    base: 'failun' as FootId,
    variants: khababVariants,
  })),
  ajz: Array.from({ length: 4 }, (_, i) => ({
    role: (i === 3 ? 'ضرب' : 'حشو') as SlotRole,
    base: 'failun' as FootId,
    variants: khababVariants,
  })),
  description:
    'صورة من المتدارك تتعاقب فيها (فَعْلُنْ) و(فَعِلُنْ) بلا التزام، ولا يجتمع فيها وتد. يسمّيه العروضيون «الخبب» أو «ركض الخيل».',
  tone: 'راقص شديد الحركة، بحر الأناشيد والأهازيج.',
  example: {
    verse: 'يَا لَيْلُ الصَّبُّ مَتَى غَدُهُ … أَقِيَامُ السَّاعَةِ مَوْعِدُهُ',
    poet: 'من شواهد العروضيين',
  },
  frequency: 4,
});

/**
 * التصريع: أن تُلحَق عروضُ البيت بضربه وزناً وقافية، وهو كثير في مطالع القصائد.
 * لذلك نُجيز في خانة العروض كلَّ ما يجوز في خانة الضرب.
 */
for (const m of METERS) {
  if (!m.ajz.length) continue;
  const arudSlot = m.sadr[m.sadr.length - 1];
  const darbSlot = m.ajz[m.ajz.length - 1];
  if (arudSlot.role !== 'عروض') continue;
  const seen = new Set(arudSlot.variants.map((v) => v.pattern));
  for (const variant of darbSlot.variants) {
    if (seen.has(variant.pattern)) continue;
    seen.add(variant.pattern);
    // التصريع أقلّ شيوعاً من العروض الأصلية، فنرفع كلفته قليلاً
    arudSlot.variants.push({ ...variant, cost: variant.cost + 0.6 });
  }
}

export const meterBySlug = (slug: string) => METERS.find((m) => m.slug === slug);
export const meterById = (id: string) => METERS.find((m) => m.id === id);

/** البحور الستة عشر مجموعةً بعائلاتها — للعرض في الصفحة الرئيسية. */
export const METER_FAMILIES = Array.from(new Set(METERS.map((m) => m.family))).map((family) => ({
  family,
  meters: METERS.filter((m) => m.family === family),
}));

/** دوائر الخليل العروضية. */
export const CIRCLES = [
  { name: 'دائرة المختلِف', meters: ['الطويل', 'المديد', 'البسيط'] },
  { name: 'دائرة المؤتلِف', meters: ['الوافر', 'الكامل'] },
  { name: 'دائرة المجتلَب', meters: ['الهزج', 'الرجز', 'الرمل'] },
  { name: 'دائرة المشتبِه', meters: ['السريع', 'المنسرح', 'الخفيف', 'المضارع', 'المقتضب', 'المجتث'] },
  { name: 'دائرة المتفِق', meters: ['المتقارب', 'المتدارك'] },
];
