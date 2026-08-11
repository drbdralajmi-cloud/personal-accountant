/**
 * بيانٌ عدديّ للخلاف حول قياس «مرحبا يا قمر مرحبا يا بدر».
 * يُشغَّل بـ: npx tsx src/lib/arud/__tests__/nab.ts
 */

import { analyzeAgainstFormula, analyzeVerse, compareSystems } from '../analyze';
import { parseFormula } from '../formula';
import { toUnits, unitsToBinary, unitsToText } from '../prosodic';

const LINE = 'مرحبا يا قمر مرحبا يا بدر';

const bar = (t: string) => console.log(`\n=== ${t} ===`);

bar('قراءات مختلفة للشطر');
const readings: [string, string][] = [
  ['غير مشكول', LINE],
  ['مَرْحَبًا (تنوين)', 'مَرْحَبًا يَا قَمَرْ مَرْحَبًا يَا بَدْرْ'],
  ['مَرْحَبَا … بَدَرْ', 'مَرْحَبَا يَا قَمَرْ مَرْحَبَا يَا بَدَرْ'],
];
for (const [label, text] of readings) {
  const u = toUnits(text, { continued: false })[0];
  const b = unitsToBinary(u);
  console.log(`${label.padEnd(22)} ${unitsToText(u)}`);
  console.log(`${''.padEnd(22)} ${b}  (${b.length} حرفاً)`);
}

bar('ما يقتضيه كل وزن من الحروف');
for (const f of [
  'فاعلن فاعلن فاعلن فاعلن',
  'مستفعلن فاعلن مستفعلن فاعلن',
  'مستفعلن مستفعلن فاعلاتن',
]) {
  const p = parseFormula(f);
  console.log(`${f.padEnd(30)} ${p.pattern}  (${p.pattern.length} حرفاً)`);
}

bar('القياس على الوزن الذي يذكره المستخدم');
for (const [label, o] of [
  ['التزام صارم بالصيغة', { single: true }],
  ['مع التسامح النبطي', { single: true, tolerant: true, ishbaa: true }],
] as const) {
  const claim = analyzeAgainstFormula(LINE, 'مستفعلن فاعلن مستفعلن فاعلن', o);
  console.log(`— ${label}: ${claim.verdict}`);
  console.log(`  الحساب: ${JSON.stringify(claim.budget)}`);
  if (claim.assumedReading) console.log(`  اقتضى فرضَ هذه القراءة: ${claim.assumedReading}`);
}

bar('الميزانان جنباً إلى جنب');
const cmp = compareSystems(LINE);
console.log(`حروف النصّ العروضية: ${cmp.letters}`);
console.log(
  `الخليلي : ${cmp.khalili.meter?.name} | موزون: ${cmp.khalili.ok} | ${cmp.khalili.sadr?.feet.map((f) => f.name).join(' · ')}`,
);
console.log(
  `النبطي  : ${cmp.nabati.meter?.name} | موزون: ${cmp.nabati.ok} | ${cmp.nabati.sadr?.feet.map((f) => f.name).join(' · ')}`,
);

bar('شطرٌ يوافق وزن المستخدم فعلاً');
const fits = 'يَا مَرْحَبَا بِالْقَمَرْ أَهْلًا بِكُمْ يَا سَمَرْ';
const chk = analyzeAgainstFormula(fits, 'مستفعلن فاعلن مستفعلن فاعلن', { single: true });
console.log(`${fits}\n${chk.verdict}`);
console.log('الحساب:', JSON.stringify(chk.budget));
console.log('التفعيلات:', chk.analysis?.sadr?.feet.map((f) => f.name).join(' · '));

bar('حكم المحرّك الخليلي');
const a = analyzeVerse(LINE);
console.log(`البحر: ${a.meter?.name} | موزون: ${a.ok} | ثقة: ${a.confidence}`);
console.log('المرشّحون:', a.candidates.map((c) => `${c.meter} ${c.confidence}٪`).join(' | '));
