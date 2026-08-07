import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AnalyzeLink } from '@/components/AnalyzeLink';
import { ComposeBox } from '@/components/ComposeBox';
import { SpeakButton } from '@/components/actions';
import { FEET } from '@/lib/arud/feet';
import { METERS, Meter, meterBySlug, Slot } from '@/lib/arud/meters';
import { corpusByMeter } from '@/data/corpus';

export function generateStaticParams() {
  return METERS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const m = meterBySlug(slug);
  if (!m) return { title: 'بحر غير موجود' };
  return {
    title: `بحر ${m.name} — تفعيلاته وزحافاته وأمثلته`,
    description: m.description,
  };
}

export default async function MeterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meter = meterBySlug(slug);
  if (!meter) notFound();

  const siblings = METERS.filter((m) => m.family === meter.family && m.id !== meter.id);
  const examples = corpusByMeter(meter.name);

  return (
    <div className="space-y-8">
      <header className="card">
        <Link href="/buhur" className="text-xs faint hover:underline">
          بحور الشعر
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="title text-4xl">{meter.name}</h1>
          <span className="chip chip-gold">{meter.form}</span>
          <SpeakButton text={meter.formula} className="btn px-3 py-2 text-xs" />
        </div>
        <p className="verse mt-3 text-xl" style={{ color: 'var(--accent)' }}>
          {meter.formula}
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed muted">{meter.description}</p>
        <p className="mt-2 text-sm">
          <span className="font-semibold">جرسه: </span>
          <span className="muted">{meter.tone}</span>
        </p>

        <div className="mt-5 card-quiet">
          <p className="mb-1 text-xs faint">مفتاح البحر</p>
          <p className="verse text-base leading-loose">{meter.key}</p>
        </div>
      </header>

      <section className="card">
        <h2 className="title mb-1 text-xl">بنية البيت</h2>
        <p className="mb-4 text-sm muted">
          كل خانة تُبيّن التفعيلة الأصلية وما يجوز فيها من صور. الأخيرة في الصدر هي العروض، وفي
          العجز هي الضرب.
        </p>
        <div className="space-y-4">
          <HemistichSpec label="الصدر" slots={meter.sadr} />
          {meter.ajz.length ? (
            <HemistichSpec label="العجز" slots={meter.ajz} />
          ) : (
            <p className="text-sm muted">هذا البحر مشطور: بيته شطرٌ واحد.</p>
          )}
        </div>
      </section>

      {!!examples.length && (
        <section className="card">
          <h2 className="title mb-3 text-xl">أمثلة شعرية</h2>
          <div className="space-y-4">
            {examples.map((v, i) => (
              <blockquote key={i} className="border-r-4 pr-4" style={{ borderColor: 'var(--gold)' }}>
                <p className="verse leading-loose">{v.sadr}</p>
                <p className="verse leading-loose">{v.ajz}</p>
                <footer className="mt-1 flex flex-wrap items-center gap-2 text-xs faint">
                  <span>— {v.poet}</span>
                  {v.theme && <span className="chip !py-0.5 !text-[10px]">{v.theme}</span>}
                  <AnalyzeLink text={`${v.sadr} … ${v.ajz}`} />
                </footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h2 className="title mb-1 text-xl">جرّب النظم على هذا البحر</h2>
        <p className="mb-4 text-sm muted">
          يؤلّف المحرّك شطراً صحيح الوزن من كلمات المعجم لتسمع إيقاع البحر. الغرض التدريب على
          الجرس، لا إنشاء شعرٍ ذي معنى.
        </p>
        <ComposeBox meterSlug={meter.slug} meterName={meter.name} />
      </section>

      {!!siblings.length && (
        <section>
          <h2 className="title mb-3 text-xl">صورٌ أخرى من {meter.family}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {siblings.map((m) => (
              <Link key={m.id} href={`/buhur/${m.slug}`} className="card">
                <div className="flex items-center gap-2">
                  <span className="chip !py-0.5 !text-[10px]">{m.form}</span>
                  <h3 className="font-bold">{m.name}</h3>
                </div>
                <p className="verse mt-2 text-sm" style={{ color: 'var(--accent)' }}>
                  {m.formula}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function HemistichSpec({ label, slots }: { label: string; slots: Slot[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-bold">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {slots.map((s, i) => (
          <div key={i} className="min-w-[10rem] flex-1 rounded-xl border p-3" style={{ background: 'var(--surface-2)' }}>
            <div className="flex items-baseline justify-between gap-2">
              <Link href={`/taf3ilat/${FEET[s.base].slug}`} className="verse text-lg link">
                {FEET[s.base].name}
              </Link>
              <span className={`chip !py-0.5 !text-[10px] ${s.role !== 'حشو' ? 'chip-gold' : ''}`}>
                {s.role}
              </span>
            </div>
            <ul className="mt-2 space-y-1 text-xs muted">
              {s.variants.slice(0, 6).map((v) => (
                <li key={v.pattern + v.name} className="flex items-baseline justify-between gap-2">
                  <span className="verse text-sm">{v.name}</span>
                  <span dir="ltr" className="font-mono text-[10px] faint">
                    {v.pattern.replace(/1/g, '/').replace(/0/g, '°')}
                  </span>
                </li>
              ))}
              {s.variants.length > 6 && <li className="faint">+ {s.variants.length - 6} صور أخرى</li>}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
