import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PatternStrip } from '@/components/Scansion';
import { WordTable } from '@/components/WordTable';
import { SpeakButton } from '@/components/actions';
import { FEET_LIST, footBySlug, SYLLABLE_LABEL, splitSyllables } from '@/lib/arud/feet';
import { METERS } from '@/lib/arud/meters';
import { wordsForPattern } from '@/lib/lexicon';

export function generateStaticParams() {
  return FEET_LIST.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const foot = footBySlug(slug);
  if (!foot) return { title: 'قالب غير موجود' };
  return {
    title: `قالب ${foot.plain} — الشرح والتقطيع وكلمات على وزنه`,
    description: foot.description,
  };
}

export default async function FootPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const foot = footBySlug(slug);
  if (!foot) notFound();

  const words = wordsForPattern(foot.pattern, { limit: 50, seed: 1 }).map((w) => ({
    word: w.word,
    spoken: w.spoken,
    segments: w.segments,
    syllableKinds: w.syllableKinds,
    form: w.form,
    source: w.source,
    morph: w.morph,
    root: w.root,
  }));
  const total = wordsForPattern(foot.pattern).length;
  const meters = METERS.filter((m) => m.sadr.some((s) => s.base === foot.id));
  const syllables = splitSyllables(foot.pattern);

  return (
    <div className="space-y-8">
      <header className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/taf3ilat" className="text-xs faint hover:underline">
              القوالب الشعرية
            </Link>
            <h1 className="verse mt-1 text-4xl">{foot.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed muted">{foot.description}</p>
          </div>
          <SpeakButton text={foot.name} className="btn px-3 py-2 text-xs" />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="التمثيل الرمزي">
            <PatternStrip pattern={foot.pattern} />
          </Fact>
          <Fact label="عدد المقاطع">
            <span className="title text-2xl" style={{ color: 'var(--accent)' }}>
              {syllables.length.toLocaleString('ar-EG')}
            </span>
          </Fact>
          <Fact label="عدد الحروف">
            <span className="title text-2xl" style={{ color: 'var(--accent)' }}>
              {foot.pattern.length.toLocaleString('ar-EG')}
            </span>
          </Fact>
          <Fact label="كلمات على وزنه">
            <span className="title text-2xl" style={{ color: 'var(--accent)' }}>
              {total.toLocaleString('ar-EG')}
            </span>
          </Fact>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card">
          <h2 className="title mb-3 text-xl">التقسيم الصوتي</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {foot.build.map((b) => (
              <span key={b} className="chip chip-accent">
                {b}
              </span>
            ))}
          </div>
          <table className="table-clean">
            <thead>
              <tr>
                <th>المقطع</th>
                <th>نوعه</th>
                <th>رمزه</th>
              </tr>
            </thead>
            <tbody>
              {syllables.map((s, i) => (
                <tr key={i}>
                  <td className="verse text-base">{foot.syllables[i] ?? '—'}</td>
                  <td>{SYLLABLE_LABEL[s] ?? s}</td>
                  <td dir="ltr" className="font-mono">
                    {s.replace(/1/g, '/').replace(/0/g, '°')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card space-y-4">
          <div>
            <h2 className="title mb-2 text-xl">طريقة النطق</h2>
            <p className="text-sm leading-relaxed muted">{foot.pronunciation}</p>
            <p className="verse mt-2 text-xl">{foot.syllables.join(' / ')}</p>
          </div>
          <div>
            <h3 className="mb-2 font-bold">كيف تُكوَّن الكلمات على هذا القالب؟</h3>
            <p className="text-sm leading-relaxed muted">
              الكلمة توافق القالب إذا تطابق ترتيب حركاتها وسكناتها مع رمزه حرفاً بحرف. وتُعتبر
              الكلمة في ثلاث حالات: موقوفةً (آخرها ساكن)، وموصولةً (آخرها متحرك داخل الشطر)،
              ومنوّنةً (آخرها متحرك فنونٌ ساكنة) — ولذلك قد توافق الكلمةُ القالبَ في حالٍ دون حال.
            </p>
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="title mb-3 text-xl">الزحافات الجائزة</h2>
        <p className="mb-3 text-sm muted">
          الزحاف تغييرٌ يصيب التفعيلة فلا يُفسد الوزن، وهو غير لازم؛ إن دخل بيتاً لم يلزم غيره.
        </p>
        <div className="overflow-x-auto">
          <table className="table-clean">
            <thead>
              <tr>
                <th>الصورة</th>
                <th>الرمز</th>
                <th>التغيير</th>
              </tr>
            </thead>
            <tbody>
              {[...foot.zihafat, ...foot.ilal].map((z) => (
                <tr key={z.pattern + z.name}>
                  <td className="verse text-base">{z.name}</td>
                  <td dir="ltr" className="font-mono text-xs">
                    {z.pattern.replace(/1/g, '/').replace(/0/g, '°')}
                  </td>
                  <td className="text-xs muted">{z.change}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <h2 className="title mb-1 text-xl">البحور التي تدخل فيها</h2>
        <p className="mb-3 text-sm muted">{foot.meters.join('، ')}</p>
        <div className="flex flex-wrap gap-2">
          {meters.map((m) => (
            <Link key={m.id} href={`/buhur/${m.slug}`} className="chip hover:opacity-80">
              {m.name}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="title mb-1 text-2xl">خمسون كلمة على وزن {foot.name}</h2>
        <p className="mb-4 text-sm muted">
          كل كلمة هنا يطابق تقطيعُها رمزَ القالب تماماً. اضغط زرّ النطق لسماعها، أو انسخها بضغطة.
        </p>
        <WordTable pattern={foot.pattern} footName={foot.name} initial={words} total={total} />
      </section>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="card-quiet">
      <p className="mb-1.5 text-xs faint">{label}</p>
      {children}
    </div>
  );
}
