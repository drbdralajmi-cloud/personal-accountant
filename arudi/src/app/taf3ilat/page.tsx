import type { Metadata } from 'next';
import Link from 'next/link';
import { PatternStrip } from '@/components/Scansion';
import { FEET_LIST, PROSODIC_UNITS } from '@/lib/arud/feet';
import { wordsForPattern } from '@/lib/lexicon';

export const metadata: Metadata = {
  title: 'القوالب الشعرية — التفعيلات الثماني',
  description:
    'مستفعلن، فاعلاتن، مفاعيلن، فعولن، فاعلن، متفاعلن، مفاعلتن، مفعولات — شرح كل تفعيلة وتقطيعها ومقاطعها وكلمات على وزنها.',
};

export default function FeetPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="title text-3xl">القوالب الشعرية</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed muted">
          ركّب الخليل من الأسباب والأوتاد والفواصل ثماني تفعيلات لا تاسع لها، ومنها تُبنى البحور
          الستة عشر جميعاً. اضغط أيّ قالب لترى شرحه وطريقة نطقه وأمثلته وخمسين كلمة على وزنه.
        </p>
      </header>

      <section>
        <h2 className="title mb-4 text-xl">الوحدات الصغرى</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROSODIC_UNITS.map((u) => (
            <div key={u.name} className="card-quiet">
              <div className="flex items-baseline justify-between">
                <h3 className="font-bold">{u.name}</h3>
                <span dir="ltr" className="font-mono text-sm" style={{ color: 'var(--accent)' }}>
                  {u.pattern.replace(/1/g, '/').replace(/0/g, '°')}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed muted">{u.desc}</p>
              <p className="verse mt-1.5 text-base">{u.example}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="title mb-4 text-xl">التفعيلات الثماني</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEET_LIST.map((f) => {
            const count = wordsForPattern(f.pattern).length;
            return (
              <Link
                key={f.id}
                href={`/taf3ilat/${f.slug}`}
                className="card space-y-3 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="verse text-2xl">{f.name}</h3>
                  <span className="chip !py-0.5 !text-[10px]">
                    {f.pattern.length} حروف
                  </span>
                </div>
                <PatternStrip pattern={f.pattern} />
                <p className="text-xs leading-relaxed muted line-clamp-3">{f.description}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="chip chip-accent !py-0.5 !text-[10px]">
                    {f.syllables.length} مقاطع
                  </span>
                  <span className="chip !py-0.5 !text-[10px]">
                    {count.toLocaleString('ar-EG')} كلمة
                  </span>
                  <span className="chip chip-gold !py-0.5 !text-[10px]">
                    {f.meters.length} بحور
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
