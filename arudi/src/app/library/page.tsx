import type { Metadata } from 'next';
import Link from 'next/link';
import { Info, Upload } from 'lucide-react';
import { libraryStats, searchLibrary } from '@/lib/nabati-library';

export const metadata: Metadata = {
  title: 'مكتبة الشعر النبطي',
  description:
    'أبيات الشعر النبطي مصنّفةً بالطَّرق والقالب والقافية والموضوع والشاعر والدولة والمدرسة الشعرية، ومصنَّفةً بالمحرّك لا بالتخمين.',
};

export default function LibraryPage() {
  const stats = libraryStats();
  const entries = searchLibrary();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="title text-3xl">مكتبة الشعر النبطي</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed muted">
          أبياتٌ مصنّفةٌ بالطَّرق والتفعيلات والقافية والموضوع والشاعر والدولة والمدرسة. والوزنُ
          والقالبُ والقافيةُ يصنّفها المحرّك من نصّ البيت نفسه — لا تُكتب بيد — فما دخل المكتبة
          فقد قِيس.
        </p>
      </header>

      {!stats.total ? (
        <section className="card space-y-4">
          <h2 className="title flex items-center gap-2 text-xl">
            <Info size={19} style={{ color: 'var(--gold)' }} />
            المكتبة فارغة — وهذا مقصود
          </h2>
          <div className="space-y-3 text-sm leading-relaxed muted">
            <p>
              البنية جاهزةٌ لآلاف الأبيات: التصنيف بالطَّرق والقالب والقافية والموضوع والشاعر
              والدولة والمدرسة، والبحثُ في ذلك كله، والإحصاءُ عليه.
            </p>
            <p>
              وأما الأبيات ونسبتُها إلى شعرائها فلا تُولَّد.{' '}
              <strong className="text-[color:var(--text)]">
                نسبةُ بيتٍ إلى شاعرٍ خبرٌ عن إنسانٍ حقيقيّ
              </strong>
              ، ونسبتُه إلى دولةٍ أو مدرسةٍ حكمٌ يُنقل عن مصدر. ولو مُلئت المكتبة بأبياتٍ مولَّدة
              ثم نُسبت إلى شعراء لصارت مرجعاً يُفسد ما بُنيت لتحفظه — والمرجع الذي لا يُوثَق به
              أسوأ من عدمه.
            </p>
            <p>ولذلك تُملأ من أبوابٍ ثلاثة، وكلُّها بيدك أنت:</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Door
              n={1}
              title="لوحة التحكّم"
              body="أدخِل البيت وشاعره ومصدره، فيقيسه المحرّك قبل أن يقبله."
              href="/admin"
              cta="افتح اللوحة"
            />
            <Door
              n={2}
              title="ملفّ المستودع"
              body="أضِف دفعةً واحدة في src/data/nabati-corpus.ts بالبنية نفسها."
            />
            <Door
              n={3}
              title="استيراد JSON"
              body="ملفٌّ بالبنية نفسها يُعرَض عليك حكمُ المحرّك على كل بيتٍ فيه قبل قبوله."
            />
          </div>

          <div className="card-quiet">
            <h3 className="mb-2 flex items-center gap-2 font-bold">
              <Upload size={15} />
              بنية المدخلة
            </h3>
            <pre
              dir="ltr"
              className="overflow-x-auto rounded-lg p-3 text-xs"
              style={{ background: 'var(--surface-2)' }}
            >
              {`{
  "id": "unique-id",
  "sadr": "صدر البيت",
  "ajz": "عجز البيت",
  "poet": "اسم الشاعر",          // شرطٌ — لا يُقبل بيتٌ بلا نسبة
  "country": "السعودية",
  "school": "نجدية",
  "topic": "الغزل",
  "source": "ديوان كذا، ص ٠٠",
  "claimedTariq": "المسحوب"       // اختياري: ما ينسبه المصدر
}`}
            </pre>
            <p className="mt-2 text-xs leading-relaxed muted">
              الطَّرق والتفعيلات والقافية وعدد الحروف لا تُكتب — يحسبها المحرّك. وإن خالف حكمُه ما
              نسبه المصدر عُرض الحكمان معاً ووُسم البيت «مختلَف فيه»، ولم يُرجَّح أحدهما بغير حجّة.
            </p>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-4">
            <Stat label="بيتاً" value={stats.total} />
            <Stat label="موزوناً على طَرقٍ معلوم" value={stats.sound} />
            <Stat label="يحتاج مراجعة" value={stats.needsReview} />
            <Stat label="مختلَفٌ في طَرقه" value={stats.disputed} />
          </section>

          <section className="card">
            <h2 className="title mb-3 text-xl">التصنيف</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Facet title="بالطَّرق" rows={stats.byTariq} />
              <Facet title="بالشاعر" rows={stats.byPoet} />
              <Facet title="بالدولة" rows={stats.byCountry} />
              <Facet title="بالمدرسة" rows={stats.bySchool} />
              <Facet title="بالموضوع" rows={stats.byTopic} />
              <Facet title="بالرويّ" rows={stats.byRawi} />
            </div>
          </section>

          <section className="space-y-3">
            {entries.map((e) => (
              <figure key={e.id} className="card">
                <blockquote className="verse text-lg leading-loose">
                  {e.sadr}
                  {e.ajz && <> … {e.ajz}</>}
                </blockquote>
                <figcaption className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="chip !py-0.5 !text-[10px]">{e.poet}</span>
                  {e.country && <span className="chip !py-0.5 !text-[10px]">{e.country}</span>}
                  {e.tariq && (
                    <Link
                      href={`/nabati/${e.tariqSlug}`}
                      className="chip chip-accent !py-0.5 !text-[10px]"
                    >
                      {e.tariq}
                    </Link>
                  )}
                  {e.rawi && <span className="chip chip-gold !py-0.5 !text-[10px]">رويّه {e.rawi}</span>}
                  {!e.sound && <span className="chip chip-bad !py-0.5 !text-[10px]">يحتاج مراجعة</span>}
                </figcaption>
                {e.note && <p className="mt-2 text-xs leading-relaxed muted">{e.note}</p>}
              </figure>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

function Door({
  n,
  title,
  body,
  href,
  cta,
}: {
  n: number;
  title: string;
  body: string;
  href?: string;
  cta?: string;
}) {
  return (
    <div className="card-quiet">
      <span
        className="grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold"
        style={{ background: 'var(--accent)', color: 'var(--bg-soft)' }}
      >
        {n}
      </span>
      <h3 className="mt-2 font-bold">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed muted">{body}</p>
      {href && (
        <Link href={href} className="chip mt-2 !py-0.5 !text-[10px] hover:opacity-80">
          {cta}
        </Link>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="card-quiet">
      <p className="title text-3xl" style={{ color: 'var(--accent)' }}>
        {value.toLocaleString('ar-EG')}
      </p>
      <p className="text-xs faint">{label}</p>
    </div>
  );
}

function Facet({ title, rows }: { title: string; rows: { key: string; count: number }[] }) {
  if (!rows.length) return null;
  return (
    <div className="card-quiet">
      <h3 className="mb-2 text-sm font-bold">{title}</h3>
      <ul className="space-y-1 text-xs">
        {rows.slice(0, 8).map((r) => (
          <li key={r.key} className="flex justify-between gap-2">
            <span className="muted">{r.key}</span>
            <span style={{ color: 'var(--accent)' }}>{r.count.toLocaleString('ar-EG')}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
