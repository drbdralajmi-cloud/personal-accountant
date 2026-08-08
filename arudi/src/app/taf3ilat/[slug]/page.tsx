import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PatternStrip } from '@/components/Scansion';
import { WordTable } from '@/components/WordTable';
import { SpeakButton } from '@/components/actions';
import { phrasesForPattern } from '@/lib/arud/compose';
import { FEET, FEET_LIST, SYLLABLE_LABEL, splitSyllables } from '@/lib/arud/feet';
import { METERS } from '@/lib/arud/meters';
import { TEMPLATES, templateBySlug, templatesByPlain } from '@/lib/arud/templates';
import { wordsForPattern } from '@/lib/lexicon';

export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = templateBySlug(slug);
  if (!t) return { title: 'قالب غير موجود' };
  return {
    title: `قالب ${t.plain} (${t.name}) — الشرح والتقطيع وكلمات على وزنه`,
    description: t.description,
  };
}

export default async function FootPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const template = templateBySlug(slug);
  if (!template) notFound();

  /** الأصل، إن كان هذا القالب واحداً من الثمانية — لعرض جدول زحافاته. */
  const foot = FEET_LIST.find((f) => f.slug === template.slug);

  const words = wordsForPattern(template.pattern, { limit: 50, seed: 1 }).map((w) => ({
    word: w.word,
    spoken: w.spoken,
    segments: w.segments,
    syllableKinds: w.syllableKinds,
    form: w.form,
    source: w.source,
    morph: w.morph,
    root: w.root,
  }));
  const total = wordsForPattern(template.pattern).length;
  // بعض الصور لا تقع على كلمة مفردة، فتُملأ بتركيبٍ من كلمتين كما يفعل الشاعر
  const phrases = total ? [] : phrasesForPattern(template.pattern, { limit: 24, seed: 3 });

  const meters = METERS.filter((m) =>
    m.sadr.some((s) => s.variants.some((v) => v.pattern === template.pattern)),
  );
  const syllables = splitSyllables(template.pattern);
  const twins = templatesByPlain(template.plain).filter((t) => t.slug !== template.slug);

  return (
    <div className="space-y-8">
      <header className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/taf3ilat" className="text-xs faint hover:underline">
              القوالب الشعرية
            </Link>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <h1 className="verse text-4xl">{template.name}</h1>
              <span className={`chip ${template.kind === 'أصل' ? 'chip-gold' : ''}`}>
                {template.kind === 'أصل' ? 'من الأصول الثماني' : 'صورة متفرّعة'}
              </span>
            </div>
            {!!template.aliases.length && (
              <p className="mt-1.5 text-xs faint">وتُسمّى أيضاً: {template.aliases.join('، ')}</p>
            )}
            <p className="mt-2 max-w-2xl text-sm leading-relaxed muted">{template.description}</p>
          </div>
          <SpeakButton text={template.name} className="btn px-3 py-2 text-xs" />
        </div>

        {template.caution && (
          <p
            className="mt-4 rounded-xl px-4 py-3 text-sm leading-relaxed"
            style={{ background: 'var(--surface-2)', borderInlineStart: '3px solid var(--gold)' }}
          >
            {template.caution}
          </p>
        )}

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="التمثيل الرمزي">
            <PatternStrip pattern={template.pattern} />
          </Fact>
          <Fact label="عدد المقاطع">
            <span className="title text-2xl" style={{ color: 'var(--accent)' }}>
              {syllables.length.toLocaleString('ar-EG')}
            </span>
          </Fact>
          <Fact label="عدد الحروف">
            <span className="title text-2xl" style={{ color: 'var(--accent)' }}>
              {template.pattern.length.toLocaleString('ar-EG')}
            </span>
          </Fact>
          <Fact label={total ? 'كلمات على وزنه' : 'تراكيب على وزنه'}>
            <span className="title text-2xl" style={{ color: 'var(--accent)' }}>
              {(total || phrases.length).toLocaleString('ar-EG')}
            </span>
          </Fact>
        </div>
      </header>

      {!!twins.length && (
        <section className="card-quiet">
          <h2 className="title mb-2 text-lg">قوالب تشترك معه في الاسم</h2>
          <p className="mb-3 text-sm muted">
            يُكتب «{template.plain}» بلا تشكيل فيلتبس بغيره، وهذه الصور تحمل الاسم نفسه ووزنها
            مختلف:
          </p>
          <div className="flex flex-wrap gap-2">
            {twins.map((t) => (
              <Link key={t.slug} href={`/taf3ilat/${t.slug}`} className="chip hover:opacity-80">
                {t.name} — {t.pattern.replace(/1/g, '/').replace(/0/g, '°')}
              </Link>
            ))}
          </div>
        </section>
      )}

      {template.kind === 'فرع' && (
        <section className="card">
          <h2 className="title mb-1 text-xl">أصولها وكيف تولّدت</h2>
          <p className="mb-3 text-sm muted">
            الصورة الواحدة قد تتفرّع عن أكثر من أصل، فتتّفق في الرمز وتختلف في البحر الذي جاءت منه.
          </p>
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>الأصل</th>
                  <th>رمزه</th>
                  <th>التغيير</th>
                </tr>
              </thead>
              <tbody>
                {template.origins.map((o) => (
                  <tr key={o.foot + o.change}>
                    <td>
                      <Link href={`/taf3ilat/${FEET[o.foot].slug}`} className="verse text-base hover:underline">
                        {FEET[o.foot].name}
                      </Link>
                    </td>
                    <td dir="ltr" className="font-mono text-xs">
                      {FEET[o.foot].pattern.replace(/1/g, '/').replace(/0/g, '°')}
                    </td>
                    <td className="text-xs muted">{o.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card">
          <h2 className="title mb-3 text-xl">التقسيم الصوتي</h2>
          <div className="mb-4 flex flex-wrap gap-2">
            {template.build.map((b) => (
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
                  <td className="verse text-base">{template.syllables[i] ?? '—'}</td>
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
            <p className="text-sm leading-relaxed muted">{template.pronunciation}</p>
            <p className="verse mt-2 text-xl">{template.syllables.join(' / ')}</p>
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

      {foot && (
        <section className="card">
          <h2 className="title mb-3 text-xl">الزحافات والعلل الجارية فيه</h2>
          <p className="mb-3 text-sm muted">
            الزحاف تغييرٌ يصيب التفعيلة فلا يُفسد الوزن، وهو غير لازم؛ إن دخل بيتاً لم يلزم غيره.
            والعلّة تختصّ بالعروض والضرب وتلزم إذا وقعت.
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
                {[...foot.zihafat, ...foot.ilal].map((z) => {
                  const page = TEMPLATES.find((t) => t.pattern === z.pattern && t.slug !== slug);
                  return (
                    <tr key={z.pattern + z.name}>
                      <td className="verse text-base">
                        {page ? (
                          <Link href={`/taf3ilat/${page.slug}`} className="hover:underline">
                            {z.name}
                          </Link>
                        ) : (
                          z.name
                        )}
                      </td>
                      <td dir="ltr" className="font-mono text-xs">
                        {z.pattern.replace(/1/g, '/').replace(/0/g, '°')}
                      </td>
                      <td className="text-xs muted">{z.change}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="card">
        <h2 className="title mb-1 text-xl">البحور التي تدخل فيها</h2>
        <p className="mb-3 text-sm muted">{template.meters.join('، ')}</p>
        <div className="flex flex-wrap gap-2">
          {meters.map((m) => (
            <Link key={m.id} href={`/buhur/${m.slug}`} className="chip hover:opacity-80">
              {m.name}
            </Link>
          ))}
        </div>
      </section>

      {total > 0 ? (
        <section>
          <h2 className="title mb-1 text-2xl">خمسون كلمة على وزن {template.name}</h2>
          <p className="mb-4 text-sm muted">
            كل كلمة هنا يطابق تقطيعُها رمزَ القالب تماماً. اضغط زرّ النطق لسماعها، أو انسخها بضغطة.
          </p>
          <WordTable
            pattern={template.pattern}
            footName={template.name}
            initial={words}
            total={total}
          />
        </section>
      ) : (
        <section className="card">
          <h2 className="title mb-1 text-2xl">تراكيب على وزن {template.name}</h2>
          <p className="mb-4 max-w-3xl text-sm leading-relaxed muted">
            هذا القالب لا يقع على كلمةٍ مفردة في العربية — وطولُه يتجاوز بنية الكلمة الواحدة —
            فيملؤه الشاعر بتركيبٍ من كلمتين. وهذه تراكيب يطابق مجموعُ تقطيعها رمزَ القالب حرفاً
            بحرف:
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {phrases.map((p) => (
              <li key={p.text} className="card-quiet verse text-lg">
                {p.text}
              </li>
            ))}
          </ul>
        </section>
      )}
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
