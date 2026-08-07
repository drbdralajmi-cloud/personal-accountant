/**
 * اختبارات المحرّك العروضي — تُشغَّل بـ: npm test
 * كل بيت مشكول تشكيلاً كاملاً مع بحره المعروف.
 */

import { CORPUS, fullVerse } from '../../../data/corpus';
import { lexiconStats, wordsForPattern } from '../../lexicon';
import { analyzeVerse } from '../analyze';
import { composeHemistich } from '../compose';
import { FEET_LIST } from '../feet';
import { METERS } from '../meters';
import { toUnits, unitsToText } from '../prosodic';

interface Case {
  verse: string;
  meter: string;
  note?: string;
}

const CASES: Case[] = [
  {
    verse: 'قِفَا نَبْكِ مِنْ ذِكْرَى حَبِيبٍ وَمَنْزِلِ … بِسِقْطِ اللِّوَى بَيْنَ الدَّخُولِ فَحَوْمَلِ',
    meter: 'الطويل',
  },
  {
    verse: 'وَإِذَا أَتَتْكَ مَذَمَّتِي مِنْ نَاقِصٍ … فَهِيَ الشَّهَادَةُ لِي بِأَنِّي كَامِلُ',
    meter: 'الكامل',
  },
  {
    verse: 'الخَيْلُ وَاللَّيْلُ وَالبَيْدَاءُ تَعْرِفُنِي … وَالسَّيْفُ وَالرُّمْحُ وَالقِرْطَاسُ وَالقَلَمُ',
    meter: 'البسيط',
  },
  {
    verse: 'أَلَا لَا يَجْهَلَنْ أَحَدٌ عَلَيْنَا … فَنَجْهَلَ فَوْقَ جَهْلِ الجَاهِلِينَا',
    meter: 'الوافر',
  },
  {
    verse: 'وَمَا نَيْلُ المَطَالِبِ بِالتَّمَنِّي … وَلَكِنْ تُؤْخَذُ الدُّنْيَا غِلَابَا',
    meter: 'الوافر',
  },
  {
    verse: 'أَخَاكَ أَخَاكَ إِنَّ مَنْ لَا أَخَا لَهُ … كَسَاعٍ إِلَى الهَيْجَا بِغَيْرِ سِلَاحِ',
    meter: 'الطويل',
  },
  {
    verse: 'دَعْ عَنْكَ لَوْمِي فَإِنَّ اللَّوْمَ إِغْرَاءُ … وَدَاوِنِي بِالَّتِي كَانَتْ هِيَ الدَّاءُ',
    meter: 'البسيط',
  },
  {
    verse: 'إِنَّ الشَّبَابَ الَّذِي مَجْدٌ عَوَاقِبُهُ … فِيهِ نَلَذُّ وَلَا لَذَّاتِ لِلشِّيبِ',
    meter: 'البسيط',
  },
  {
    verse: 'يَا لَيْلُ الصَّبُّ مَتَى غَدُهُ … أَقِيَامُ السَّاعَةِ مَوْعِدُهُ',
    meter: 'الخبَب',
    note: 'المتدارك الخبَبي',
  },
  {
    verse: 'دَارٌ لِسَلْمَى إِذْ سُلَيْمَى جَارَةٌ … قَفْرٌ تَرَى آيَاتِهَا مِثْلَ الزُّبُرْ',
    meter: 'الرجز',
  },
  {
    verse: 'إِذَا الشَّعْبُ يَوْمًا أَرَادَ الْحَيَاةَ … فَلَا بُدَّ أَنْ يَسْتَجِيبَ الْقَدَرْ',
    meter: 'المتقارب',
  },
  {
    verse: 'لَيْتَ شِعْرِي وَأَيْنَ مِنِّيَ لَيْتٌ … إِنَّ لَيْتًا وَإِنَّ لَوًّا عَنَاءُ',
    meter: 'الخفيف',
  },
  {
    verse: 'قُلْ لِمَنْ يَبْكِي عَلَى رَسْمٍ دَرَسْ … وَاقِفًا مَا ضَرَّ لَوْ كَانَ جَلَسْ',
    meter: 'الرمل',
  },
  {
    verse: 'إِنَّ ابْنَ زَيْدٍ لَا زَالَ مُسْتَعْمَلًا … لِلْخَيْرِ يُفْشِي فِي مِصْرِهِ العُرُفَا',
    meter: 'المنسرح',
  },
  {
    verse: 'أَيَا مَنْ يَدَّعِي الفَهْمَ … إِلَى كَمْ يَا أَخَا الوَهْمِ',
    meter: 'الهزج',
  },
];

const PROSODIC_CASES: { text: string; expect: string }[] = [
  { text: 'العِلْمُ', expect: 'أَلْعِلْمُو' },
  { text: 'الشَّمْسُ', expect: 'أَشْشَمْسُو' },
  { text: 'كِتَابًا', expect: 'كِتَابَنْ' },
];

let pass = 0;
let fail = 0;

console.log('\n=== اختبار الكتابة العروضية ===\n');
for (const c of PROSODIC_CASES) {
  const u = toUnits(c.text)[0];
  const got = unitsToText(u);
  const ok = got.replace(/[ًٌٍَُِّْ]/g, '') === c.expect.replace(/[ًٌٍَُِّْ]/g, '');
  console.log(`${ok ? '✔' : '✘'} ${c.text} → ${got}   ${ok ? '' : `(المتوقع ${c.expect})`}`);
  ok ? pass++ : fail++;
}

console.log('\n=== اختبار كشف البحور ===\n');
for (const c of CASES) {
  const r = analyzeVerse(c.verse);
  const got = r.meter?.name ?? '—';
  const ok = got === c.meter && r.ok;
  ok ? pass++ : fail++;
  console.log(`${ok ? '✔' : '✘'} المتوقع: ${c.meter.padEnd(10)} | الناتج: ${got.padEnd(14)} | موزون: ${r.ok ? 'نعم' : 'لا'} | ثقة: ${r.confidence}%`);
  if (!ok) {
    console.log(`   ${c.verse}`);
    console.log(`   الصدر: ${r.sadr?.prosodic ?? ''}`);
    console.log(`   الرموز: ${r.sadr?.symbols ?? ''}`);
    console.log(`   التفعيلات: ${r.sadr?.feet.map((f) => f.name).join(' ') ?? ''}`);
    if (r.ajz) {
      console.log(`   العجز: ${r.ajz.prosodic}`);
      console.log(`   الرموز: ${r.ajz.symbols}`);
      console.log(`   التفعيلات: ${r.ajz.feet.map((f) => f.name).join(' ')}`);
    }
    console.log(`   المرشحون: ${r.candidates.map((x) => x.meter).join('، ')}`);
    console.log(`   الملاحظات: ${r.issues.map((i) => i.message).join(' | ')}`);
  }
}

console.log('\n=== كشف الكسر ===\n');
const broken = analyzeVerse('قِفَا نَبْكِ مِنْ ذِكْرَى حَبِيبٍ جَمِيلٍ وَمَنْزِلِ … بِسِقْطِ اللِّوَى بَيْنَ الدَّخُولِ فَحَوْمَلِ');
console.log(`مكسور؟ ${broken.ok ? 'لا' : 'نعم'} | أقرب بحر: ${broken.meter?.name} | مواضع: ${broken.issues.length}`);
broken.issues.slice(0, 3).forEach((i) => console.log(`   - ${i.hemistich}: ${i.message}`));
if (!broken.ok) pass++;
else fail++;

console.log('\n=== أمثلة البحور ===\n');
for (const m of METERS) {
  const r = analyzeVerse(m.example.verse);
  const good = r.ok && r.meter?.family === m.family;
  good ? pass++ : fail++;
  if (!good)
    console.log(`✘ ${m.name} → ${r.meter?.name ?? '—'} (موزون: ${r.ok ? 'نعم' : 'لا'})`);
}
console.log(`تحقّق من ${METERS.length} مثالاً.`);

console.log('\n=== المدوّنة الشعرية ===\n');
for (const v of CORPUS) {
  const r = analyzeVerse(fullVerse(v));
  const good = r.ok && r.meter?.name === v.meter;
  good ? pass++ : fail++;
  if (!good) console.log(`✘ ${v.meter} → ${r.meter?.name ?? '—'} | ${v.sadr}`);
}
console.log(`تحقّق من ${CORPUS.length} بيتاً.`);

console.log('\n=== المعجم الموزون ===\n');
const stats = lexiconStats();
console.log(`${stats.total} كلمة (معتمدة ${stats.curated} / قياسية ${stats.derived}).`);
if (stats.total < 5000) {
  console.log('✘ المعجم أصغر من المطلوب (٥٠٠٠ كلمة).');
  fail++;
} else pass++;
for (const f of FEET_LIST) {
  const n = wordsForPattern(f.pattern).length;
  const good = n > 0;
  good ? pass++ : fail++;
  console.log(`${good ? '✔' : '✘'} ${f.name.padEnd(14)} ${String(n).padStart(5)} كلمة`);
}

console.log('\n=== التأليف الموزون ===\n');
for (const slug of ['kamil', 'taweel', 'baseet', 'wafir', 'khafeef', 'mutaqarib']) {
  const m = METERS.find((x) => x.slug === slug)!;
  const line = composeHemistich(m, 'sadr');
  const good = !!line && analyzeVerse(line.text).meter?.family === m.family;
  good ? pass++ : fail++;
  console.log(`${good ? '✔' : '✘'} ${m.name.padEnd(10)} ${line?.text ?? '— تعذّر التأليف'}`);
}

console.log(`\nالنتيجة: ${pass} ناجح / ${fail} فاشل\n`);
process.exit(fail > 0 ? 1 : 0);
