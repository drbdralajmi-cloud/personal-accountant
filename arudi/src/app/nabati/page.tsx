import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { TuruqBrowser } from './TuruqBrowser';
import { NABATI_REGIONS } from '@/data/nabati';
import { nabatiFeetUsage, TURUQ } from '@/lib/arud/nabati';

export const metadata: Metadata = {
  title: 'الطروق النبطية — أوزان الشعر النبطي الخليجي',
  description:
    'قاعدة أوزان الشعر النبطي الخليجي: المسحوب والهجيني والصخري والسامري والهلالي والمروبّع والحداء والقلطة والعرضة وغيرها — بتفعيلاتها وتقطيعها ومقاطعها وتغييراتها الجائزة وطريقة الكتابة عليها وأخطائها الشائعة.',
};

export default function NabatiPage() {
  const rows = TURUQ.map((t) => ({
    slug: t.slug,
    name: t.name,
    aliases: t.aliases,
    formula: t.formulaVocalized,
    pattern: t.pattern,
    symbol: t.symbol,
    letters: t.letters,
    syllableCount: t.syllableCount,
    difficulty: t.difficulty,
    regions: t.regions,
    description: t.description,
    tone: t.tone,
    halves: t.halves,
  }));
  const usage = nabatiFeetUsage();

  return (
    <div className="space-y-9">
      <header>
        <h1 className="title text-3xl">الطروق النبطية</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed muted">
          {TURUQ.length} طَرقاً من أوزان الشعر النبطي الخليجي، لكلٍّ منها تفعيلاتُه وتقطيعُه
          وعددُ مقاطعه وحروفه، والتغييراتُ الجائزة فيه، وطريقةُ الكتابة عليه، والأخطاءُ الشائعة
          عند استعماله. وكلُّ رقمٍ هنا محسوبٌ من الصيغة نفسها لا مكتوبٌ بيد، فلا يقع فيه سهو.
        </p>
      </header>

      <section className="card space-y-4">
        <h2 className="title text-xl">كيف يُقاس النبطي؟</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card-quiet space-y-2">
            <h3 className="font-bold">الطَّرق لحنٌ قبل أن يكون تفعيلات</h3>
            <p className="text-sm leading-relaxed muted">
              يُنشئ الشاعر النبطي على طَرقٍ يحفظه ويُنشده به، ثم يسمّي وزنه بتفعيلاتٍ تقارب
              اللحن. ولذلك تختلف التسمية باختلاف المناطق والرواة: الطَّرق الواحد يُسمّى باسمين،
              والاسم الواحد يُروى بصيغتين. فالصيغ هنا <strong>متداولة لا قطعية</strong>،
              والمعوَّل عليه عند الاختلاف هو الحساب لا الاسم.
            </p>
          </div>
          <div className="card-quiet space-y-2">
            <h3 className="font-bold">النطق الخليجي يغيّر الوزن</h3>
            <p className="text-sm leading-relaxed muted">
              يقرأ المحرّك نصَّك بالنطق الخليجي لا الفصيح: يُسهّل الهمز («سماء» ← «سما»)، ويردّ
              «الذي» إلى «اللي»، ويقرأ «هالـ» إشارةً مختصرة، ويجعل سكون أواخر الكلم هو الأصل إذ
              لا إعراب في النبط. أما قلب القاف گافاً والكاف تشاً فلا أثر له في الوزن، لأن العروض
              يعدّ الحروف ولا يصفها.
            </p>
          </div>
        </div>
        <p
          className="rounded-xl px-4 py-3 text-sm leading-relaxed"
          style={{ background: 'var(--surface-2)', borderInlineStart: '3px solid var(--gold)' }}
        >
          إن كانت عندك صيغةٌ لطَرقٍ غير المذكورة، أو خالفتك المنصّة في وزنٍ تعرفه — فلا تجادلها،
          بل{' '}
          <Link href="/analyze" className="underline">
            أمْلِ عليها وزنك بالتفعيلات
          </Link>{' '}
          واختر «وزنٌ تُمليه أنت»، تُرِك كم حرفاً يقتضيه وزنك وكم في نصّك وأين الفرق بالضبط.
        </p>
      </section>

      <Suspense fallback={<div className="card">جارٍ التحميل…</div>}>
        <TuruqBrowser rows={rows} regions={NABATI_REGIONS} />
      </Suspense>

      <section className="card">
        <h2 className="title mb-1 text-xl">القوالب المستعملة في النبط</h2>
        <p className="mb-3 text-sm muted">
          التفعيلات التي تتركّب منها الطروق، وعددُ الطروق التي تدخلها. اضغط القالب لترى شرحه
          وخمسين كلمة على وزنه.
        </p>
        <div className="overflow-x-auto">
          <table className="table-clean">
            <thead>
              <tr>
                <th>القالب</th>
                <th>الرمز</th>
                <th>الحروف</th>
                <th>الطروق</th>
              </tr>
            </thead>
            <tbody>
              {usage.map((f) => (
                <tr key={f.pattern}>
                  <td className="verse text-base">{f.name}</td>
                  <td dir="ltr" className="font-mono text-xs">
                    {f.pattern.replace(/1/g, '/').replace(/0/g, '°')}
                  </td>
                  <td>{f.pattern.length}</td>
                  <td className="text-xs muted">{f.turuq.join('، ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
