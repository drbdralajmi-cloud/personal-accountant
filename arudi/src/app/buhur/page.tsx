import type { Metadata } from 'next';
import Link from 'next/link';
import { CIRCLES, METER_FAMILIES } from '@/lib/arud/meters';

export const metadata: Metadata = {
  title: 'بحور الشعر العربي الستة عشر',
  description:
    'الطويل والبسيط والكامل والوافر والخفيف والرمل والرجز والمتقارب وسائر البحور: تفعيلاتها ومفاتيحها وأمثلتها وجرسها.',
};

export default function MetersPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="title text-3xl">بحور الشعر</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed muted">
          استقرأ الخليل بن أحمد شعر العرب فاستخرج منه خمسة عشر بحراً، ثم استدرك الأخفشُ عليه بحر
          المتدارك فصارت ستة عشر. ولكل بحرٍ صورةٌ تامّة وقد يأتي مجزوءاً أو مشطوراً أو منهوكاً.
        </p>
      </header>

      <section className="space-y-4">
        {METER_FAMILIES.map(({ family, meters }) => (
          <article key={family} className="card">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="title text-2xl">{family}</h2>
              <span className="chip chip-gold">{meters[0].tone}</span>
            </div>

            <p className="mt-3 text-sm leading-relaxed muted">{meters[0].description}</p>

            <div className="mt-4 space-y-2">
              {meters.map((m) => (
                <Link
                  key={m.id}
                  href={`/buhur/${m.slug}`}
                  className="flex flex-wrap items-center gap-3 rounded-xl border p-3 transition-colors hover:opacity-90"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <span className="chip !py-0.5 !text-[10px]">{m.form}</span>
                  <span className="font-bold">{m.name}</span>
                  <span className="verse mr-auto text-sm" style={{ color: 'var(--accent)' }}>
                    {m.formula}
                  </span>
                </Link>
              ))}
            </div>

            <blockquote
              className="verse mt-4 border-r-4 pr-4 text-base leading-loose"
              style={{ borderColor: 'var(--gold)' }}
            >
              {meters[0].example.verse}
              <footer className="mt-1 text-xs faint">— {meters[0].example.poet}</footer>
            </blockquote>
          </article>
        ))}
      </section>

      <section>
        <h2 className="title mb-2 text-2xl">دوائر الخليل</h2>
        <p className="mb-4 max-w-3xl text-sm leading-relaxed muted">
          رتّب الخليل تفعيلات البحر في دائرة، فإذا ابتدأت من نقطةٍ مختلفة خرج لك بحرٌ آخر. والبحور
          المتولّدة من دائرة واحدة تشترك في عدد الأسباب والأوتاد وترتيبها.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CIRCLES.map((c) => (
            <div key={c.name} className="card">
              <h3 className="title text-lg">دائرة {c.name}</h3>
              <ul className="mt-2 space-y-1 text-sm muted">
                {c.meters.map((m) => (
                  <li key={m}>• {m}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
