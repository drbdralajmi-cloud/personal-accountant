import { NextResponse } from 'next/server';
import { CORPUS, fullVerse } from '@/data/corpus';
import { analyzeVerse } from '@/lib/arud/analyze';
import { composeHemistich } from '@/lib/arud/compose';
import { FEET_LIST } from '@/lib/arud/feet';
import { METERS } from '@/lib/arud/meters';
import { lexiconStats, wordsForPattern } from '@/lib/lexicon';

export const runtime = 'nodejs';

/** فحوص سلامة تُشغَّل من لوحة الإدارة. */
export async function GET() {
  const checks: { name: string; ok: boolean; detail: string }[] = [];

  const corpusBad = CORPUS.filter((v) => {
    const r = analyzeVerse(fullVerse(v));
    return !r.ok || r.meter?.name !== v.meter;
  });
  checks.push({
    name: 'المدوّنة الشعرية',
    ok: corpusBad.length === 0,
    detail: `${CORPUS.length - corpusBad.length} من ${CORPUS.length} بيتاً يوافق بحره المعلن.`,
  });

  const exampleBad = METERS.filter((m) => {
    const r = analyzeVerse(m.example.verse);
    return !r.ok || r.meter?.family !== m.family;
  });
  checks.push({
    name: 'أمثلة البحور',
    ok: exampleBad.length === 0,
    detail: `${METERS.length - exampleBad.length} من ${METERS.length} مثالاً يتحقّق بالمحرّك.`,
  });

  const stats = lexiconStats();
  checks.push({
    name: 'حجم المعجم',
    ok: stats.total >= 5000,
    detail: `${stats.total.toLocaleString('ar-EG')} كلمة (${stats.curated} معتمدة).`,
  });

  const emptyFeet = FEET_LIST.filter((f) => wordsForPattern(f.pattern).length === 0);
  checks.push({
    name: 'تغطية التفعيلات',
    ok: emptyFeet.length === 0,
    detail: emptyFeet.length
      ? `تفعيلات بلا كلمات: ${emptyFeet.map((f) => f.name).join('، ')}`
      : 'كل تفعيلة لها كلمات في المعجم.',
  });

  const failedCompose = ['kamil', 'taweel', 'baseet', 'wafir', 'khafeef'].filter((slug) => {
    const m = METERS.find((x) => x.slug === slug)!;
    const line = composeHemistich(m, 'sadr', { seed: 11 });
    return !line || analyzeVerse(line.text).meter?.family !== m.family;
  });
  checks.push({
    name: 'التأليف الموزون',
    ok: failedCompose.length === 0,
    detail: failedCompose.length
      ? `تعذّر التأليف على: ${failedCompose.join('، ')}`
      : 'يؤلّف أشطراً صحيحة الوزن على البحور المختبَرة.',
  });

  return NextResponse.json({ checks, ok: checks.every((c) => c.ok) });
}
