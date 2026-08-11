import type { Metadata } from 'next';
import Link from 'next/link';
import { PatternStrip } from '@/components/Scansion';
import { PROSODIC_UNITS } from '@/lib/arud/feet';
import { DERIVED_TEMPLATE_LIST, ROOT_TEMPLATE_LIST, Template } from '@/lib/arud/templates';
import { wordsForPattern } from '@/lib/lexicon';

export const metadata: Metadata = {
  title: 'القوالب الشعرية — الأصول الثماني وصورها المتفرّعة',
  description:
    'مستفعلن، فاعلاتن، مفاعيلن، فعولن، فاعلن، متفاعلن، مفاعلتن، مفعولات — والصور المتفرّعة عنها: فعلن، فعْلن، مفاعلن، مفتعلن وغيرها. شرح كل قالب وتقطيعه ومقاطعه وكلمات على وزنه.',
};

export default function FeetPage() {
  return (
    <div className="space-y-10">
      <header>
        <h1 className="title text-3xl">القوالب الشعرية</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed muted">
          ركّب الخليل من الأسباب والأوتاد والفواصل ثماني تفعيلات لا تاسع لها، ومنها تُبنى البحور
          الستة عشر جميعاً. ثم إن الشعر لا يجري على هذه الثماني سالمةً وحدها، فالزحافات والعلل
          تولّد منها صوراً أخرى لها أسماءٌ مستقلّة يتداولها الناس — كـ(فَعِلُنْ) و(مَفَاعِلُنْ).
          وهنا القسمان معاً: الأصول وما تفرّع عنها. اضغط أيّ قالب لترى شرحه ونطقه وخمسين كلمة على
          وزنه.
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
        <h2 className="title mb-1 text-xl">الأصول الثماني</h2>
        <p className="mb-4 text-sm muted">
          هذه وحدها هي «التفعيلات» عند العروضيين، وما عداها صورٌ متفرّعة عنها.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROOT_TEMPLATE_LIST.map((t) => (
            <Card key={t.slug} t={t} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="title mb-1 text-xl">الصور المتفرّعة</h2>
        <p className="mb-4 max-w-3xl text-sm leading-relaxed muted">
          كلٌّ من هذه صورةٌ لتفعيلةٍ أصلٍ دخلها زحافٌ أو علّة، فصار لها اسمٌ ووزنٌ مستقلّان.
          وهي في الشعر أكثر دوراناً من بعض الأصول: عروض البسيط لا تأتي إلا (فَعِلُنْ)، وعروض
          الطويل لا تأتي إلا (مَفَاعِلُنْ). وقد يشترك في الصورة الواحدة أكثر من أصل، فتُذكر أصولها
          كلها في صفحتها.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DERIVED_TEMPLATE_LIST.map((t) => (
            <Card key={t.slug} t={t} />
          ))}
        </div>
      </section>

      <section className="card-quiet">
        <h2 className="title mb-2 text-lg">تنبيه في اسم «فعلن»</h2>
        <p className="text-sm leading-relaxed muted">
          يقع اسم «فعلن» بلا تشكيل على صورتين مختلفتَي الوزن، ولا يُفرَّق بينهما إلا بالتشكيل:
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Link href="/taf3ilat/failun-makhbun" className="card-quiet hover:opacity-90">
            <p className="verse text-2xl">فَعِلُنْ</p>
            <PatternStrip pattern="1110" />
            <p className="mt-2 text-xs muted">أربعة أحرف: متحركان ثم متحرك فساكن — خبن (فَاعِلُنْ).</p>
          </Link>
          <Link href="/taf3ilat/faalun-maqtu" className="card-quiet hover:opacity-90">
            <p className="verse text-2xl">فَعْلُنْ</p>
            <PatternStrip pattern="1010" />
            <p className="mt-2 text-xs muted">أربعة أحرف: سببان خفيفان — قطع (فَاعِلُنْ).</p>
          </Link>
        </div>
      </section>
    </div>
  );
}

function Card({ t }: { t: Template }) {
  const count = wordsForPattern(t.pattern).length;
  return (
    <Link
      href={`/taf3ilat/${t.slug}`}
      className="card space-y-3 transition-transform hover:-translate-y-0.5"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="verse text-2xl">{t.name}</h3>
        <span className="chip !py-0.5 !text-[10px]">{t.pattern.length} حروف</span>
      </div>
      <PatternStrip pattern={t.pattern} />
      <p className="text-xs leading-relaxed muted line-clamp-3">{t.description}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="chip chip-accent !py-0.5 !text-[10px]">{t.syllables.length} مقاطع</span>
        <span className="chip !py-0.5 !text-[10px]">
          {count ? `${count.toLocaleString('ar-EG')} كلمة` : 'تراكيب'}
        </span>
        <span className="chip chip-gold !py-0.5 !text-[10px]">{t.meters.length} بحور</span>
        {t.kind === 'فرع' && (
          <span className="chip !py-0.5 !text-[10px]">عن {t.origins.length} أصل</span>
        )}
      </div>
    </Link>
  );
}
