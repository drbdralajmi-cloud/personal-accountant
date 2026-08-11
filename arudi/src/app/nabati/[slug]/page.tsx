import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { PatternStrip } from '@/components/Scansion';
import { SpeakButton } from '@/components/actions';
import { analyzeNabati } from '@/lib/arud/analyze';
import { composeHemistich } from '@/lib/arud/compose';
import { nabatiMeterBySlug, tariqBySlug, TURUQ, turuqWithFoot } from '@/lib/arud/nabati';
import { TEMPLATES } from '@/lib/arud/templates';
import { wordsForPattern } from '@/lib/lexicon';

export function generateStaticParams() {
  return TURUQ.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const t = tariqBySlug(slug);
  if (!t) return { title: 'طَرق غير موجود' };
  return {
    title: `طَرق ${t.name} — ${t.formulaVocalized}`,
    description: t.description,
  };
}

/**
 * أمثلة تدريبية مولَّدة بالمحرّك: موزونةٌ قطعاً على الطَّرق، ولا تُنسب إلى
 * شاعر. ونُوسمها صراحةً «مولَّدة» لئلّا يُظنّ أنها شواهد منقولة.
 */
function generatedExamples(slug: string, count: number) {
  const meter = nabatiMeterBySlug(slug);
  if (!meter) return [];
  const out: { text: string; feet: string[] }[] = [];
  const seen = new Set<string>();
  for (let seed = 1; out.length < count && seed < count * 12; seed++) {
    const line = composeHemistich(meter, 'sadr', { seed, curatedOnly: true });
    if (!line || seen.has(line.text)) continue;
    // لا نعرض إلا ما تحقّق المحرّك من وزنه على هذا الطَّرق بعينه
    if (analyzeNabati(line.text).meter?.slug !== slug) continue;
    seen.add(line.text);
    out.push({ text: line.text, feet: line.feet });
  }
  return out;
}

export default async function TariqPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = tariqBySlug(slug);
  if (!t) notFound();

  const examples = generatedExamples(slug, 4);
  const siblings = TURUQ.filter((x) => x.pattern === t.pattern && x.slug !== t.slug);

  return (
    <div className="space-y-8">
      <header className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/nabati" className="text-xs faint hover:underline">
              الطروق النبطية
            </Link>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <h1 className="title text-4xl">{t.name}</h1>
              <span className="chip chip-gold">{t.difficulty}</span>
              <span className="chip">{t.halves === 1 ? 'بيت من شطر' : 'بيت من شطرين'}</span>
            </div>
            <p className="verse mt-3 text-2xl" style={{ color: 'var(--accent)' }}>
              {t.formulaVocalized}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed muted">{t.description}</p>
            <p className="mt-1.5 text-xs faint">{t.tone}</p>
          </div>
          <SpeakButton text={t.formulaVocalized} className="btn px-3 py-2 text-xs" />
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="الرمز">
            <PatternStrip pattern={t.pattern} />
          </Fact>
          <Fact label="حروف الشطر">
            <Big>{t.letters}</Big>
          </Fact>
          <Fact label="مقاطع الشطر">
            <Big>{t.syllableCount}</Big>
          </Fact>
          <Fact label="حروف البيت">
            <Big>{t.lineLetters}</Big>
          </Fact>
        </div>
      </header>

      {!!t.aliases.length && (
        <section className="card">
          <h2 className="title mb-1 text-xl">أسماؤه المتداولة</h2>
          <p className="mb-3 text-sm muted">
            تختلف تسمية الطروق باختلاف المناطق والرواة، وهذه أشهر ما يُعرف به:
          </p>
          <div className="overflow-x-auto">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>أين يُتداول</th>
                </tr>
              </thead>
              <tbody>
                {t.aliases.map((a) => (
                  <tr key={a.name + a.where}>
                    <td className="font-bold">{a.name}</td>
                    <td className="text-xs muted">{a.where}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs faint">
            يشيع في: {t.regions.join('، ')}
          </p>
          {!!siblings.length && (
            <p className="mt-2 text-xs muted">
              ويشترك في الوزن نفسه حرفاً بحرف:{' '}
              {siblings.map((s, i) => (
                <span key={s.slug}>
                  {i > 0 && '، '}
                  <Link href={`/nabati/${s.slug}`} className="underline">
                    {s.name}
                  </Link>
                </span>
              ))}{' '}
              — والفرق بينها في الأداء واللحن لا في الميزان.
            </p>
          )}
        </section>
      )}

      <section className="card">
        <h2 className="title mb-1 text-xl">التقسيم الصوتي</h2>
        <p className="mb-4 text-sm muted">
          كل تفعيلةٍ ومقاطعُها وحروفُها. والمقطع الطويل (/°) حرفٌ متحرّك يليه ساكن، والقصير (/)
          حرفٌ متحرّك مفرد، والمديد (/°°) متحرّكٌ يليه ساكنان.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {t.feet.map((f, i) => {
            const page = TEMPLATES.find((x) => x.pattern === f.pattern);
            const words = wordsForPattern(f.pattern).length;
            return (
              <div key={i} className="card-quiet space-y-2">
                <div className="flex items-baseline justify-between">
                  {page ? (
                    <Link href={`/taf3ilat/${page.slug}`} className="verse text-xl hover:underline">
                      {f.name}
                    </Link>
                  ) : (
                    <span className="verse text-xl">{f.name}</span>
                  )}
                  <span className="chip !py-0.5 !text-[10px]">{f.letters} حروف</span>
                </div>
                <PatternStrip pattern={f.pattern} />
                <ul className="space-y-0.5 text-xs muted">
                  {f.syllables.map((s, k) => (
                    <li key={k} className="flex justify-between gap-2">
                      <span>{s.label}</span>
                      <span dir="ltr" className="font-mono">
                        {s.symbol}
                      </span>
                    </li>
                  ))}
                </ul>
                {!!words && (
                  <p className="text-[10px] faint">
                    {words.toLocaleString('ar-EG')} كلمة على وزنه
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="card">
          <h2 className="title mb-1 text-xl">التغييرات الجائزة</h2>
          <p className="mb-3 text-sm muted">
            ما يجوز للشاعر أن يغيّره من التفعيلة دون أن ينكسر الطَّرق.
          </p>
          <ul className="space-y-2">
            {t.licenses.map((l) => (
              <li key={l} className="flex gap-2 text-sm leading-relaxed">
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0"
                  style={{ color: 'var(--ok)' }}
                />
                <span>{l}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="title mb-1 text-xl">كيف تكتب عليه</h2>
          <ol className="mt-3 space-y-2">
            {t.howToWrite.map((h, i) => (
              <li key={h} className="flex gap-2.5 text-sm leading-relaxed">
                <span
                  className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold"
                  style={{ background: 'var(--accent)', color: 'var(--bg-soft)' }}
                >
                  {i + 1}
                </span>
                <span>{h}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="card">
        <h2 className="title mb-1 text-xl">الأخطاء الشائعة</h2>
        <p className="mb-3 text-sm muted">ما يقع فيه المبتدئون على هذا الطَّرق، وكيف يُصلَح.</p>
        <div className="space-y-3">
          {t.commonMistakes.map((m) => (
            <div key={m.mistake} className="card-quiet">
              <p className="flex gap-2 text-sm font-semibold">
                <AlertTriangle
                  size={16}
                  className="mt-0.5 shrink-0"
                  style={{ color: 'var(--danger)' }}
                />
                {m.mistake}
              </p>
              <p className="mt-1.5 pr-6 text-sm leading-relaxed muted">{m.fix}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h2 className="title mb-1 text-xl">شواهد موثّقة</h2>
        {t.attested.length ? (
          <div className="mt-3 space-y-3">
            {t.attested.map((a, i) => (
              <figure key={i} className="card-quiet">
                <blockquote className="verse text-lg leading-loose">
                  {a.sadr}
                  {a.ajz && <> … {a.ajz}</>}
                </blockquote>
                <figcaption className="mt-1.5 text-xs faint">
                  {a.poet}
                  {a.country && ` — ${a.country}`}
                  {a.source && ` · ${a.source}`}
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="mt-2 flex gap-2 text-sm leading-relaxed muted">
            <Info size={16} className="mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
            <span>
              لا شواهد موثّقة بعدُ لهذا الطَّرق. ونسبةُ بيتٍ إلى شاعرٍ خبرٌ عن إنسانٍ حقيقيّ، فلا
              يُولَّد ولا يُخمَّن — تُضاف الشواهد من لوحة التحكّم بيد من يعرف مصدرها ويضمن صحّة
              نسبتها.
            </span>
          </p>
        )}
      </section>

      {!!examples.length && (
        <section className="card">
          <h2 className="title mb-1 text-xl">أمثلة تدريبية مولَّدة</h2>
          <p className="mb-3 text-sm leading-relaxed muted">
            هذه أشطرٌ ركّبها المحرّك من كلمات المعجم، وتحقّق من وزنها على {t.name} حرفاً بحرف.
            وظيفتها تدريب الأذن على الإيقاع — <strong>وهي مولَّدة لا منقولة، ولا تُنسب إلى
            شاعر، ولا تدّعي معنًى شعرياً</strong>.
          </p>
          <ul className="space-y-2">
            {examples.map((e) => (
              <li key={e.text} className="card-quiet">
                <p className="verse text-lg">{e.text}</p>
                <p className="mt-1 text-[10px] faint">{e.feet.join(' · ')}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h2 className="title text-lg">جرّب بيتك على هذا الطَّرق</h2>
          <p className="text-sm muted">
            اكتب شطرك في صفحة التحليل، وسيقيسه المحرّك على الطروق كلها ويُريك أيّها أقرب وأين
            الخلل إن وُجد.
          </p>
        </div>
        <Link href="/analyze" className="btn btn-primary">
          حلّل بيتاً
        </Link>
        <Link href="/training" className="btn">
          تدرّب على الطروق
        </Link>
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

function Big({ children }: { children: React.ReactNode }) {
  return (
    <span className="title text-2xl" style={{ color: 'var(--accent)' }}>
      {typeof children === 'number' ? children.toLocaleString('ar-EG') : children}
    </span>
  );
}
