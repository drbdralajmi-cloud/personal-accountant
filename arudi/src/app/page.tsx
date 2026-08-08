import Link from 'next/link';
import { ArrowLeft, BookOpen, GraduationCap, PenLine, ScanLine, Sparkles } from 'lucide-react';
import { QuickAnalyze } from '@/components/QuickAnalyze';
import { PatternStrip } from '@/components/Scansion';
import { DailyDrill } from '@/components/DailyDrill';
import { Reveal, Stagger, StaggerItem } from '@/components/Motion';
import { FEET_LIST } from '@/lib/arud/feet';
import { METERS, METER_FAMILIES } from '@/lib/arud/meters';
import { TURUQ } from '@/lib/arud/nabati';
import { LESSONS } from '@/data/lessons';
import { lexiconStats } from '@/lib/lexicon';
import { wordsForPattern } from '@/lib/lexicon';

export default function HomePage() {
  const stats = lexiconStats();
  const lessons = [...LESSONS].sort((a, b) => a.order - b.order).slice(0, 4);
  const families = METER_FAMILIES.slice(0, 8);

  return (
    <div className="space-y-14">
      {/* ── الواجهة ── */}
      <section className="pt-6 text-center">
        <span className="chip chip-gold mb-4">
          <Sparkles size={13} />
          عروض الشعر النبطي الخليجي
        </span>
        <h1 className="title text-4xl leading-tight sm:text-5xl">
          اكتب نبطيّك موزوناً،
          <br className="sm:hidden" /> واعرف طَرقه في لحظة
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed muted sm:text-lg">
          منصّةٌ لأوزان الشعر النبطي الخليجي: اكتب بيتك — مشكولاً أو غير مشكول — فيقرأه المحرّك
          بالنطق الخليجي لا الفصيح، ثم يسمّي طَرقه، ويعرض تفعيلاته وتقطيعه، وإن انكسر الوزن أشار
          إلى الكلمة التي انكسر عندها وشرح سببها واقترح بدائل. وميزانُ الخليل حاضرٌ للفصيح، ثانياً
          لا أوّلاً.
        </p>

        <div className="mx-auto mt-8 max-w-3xl">
          <QuickAnalyze />
        </div>

        <dl className="mx-auto mt-8 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { n: TURUQ.length.toLocaleString('ar-EG'), l: 'طَرقاً نبطياً' },
            { n: METERS.length.toLocaleString('ar-EG'), l: 'صورة وزنية فصيحة' },
            { n: FEET_LIST.length.toLocaleString('ar-EG'), l: 'تفعيلات أصول' },
            { n: stats.total.toLocaleString('ar-EG'), l: 'كلمة موزونة' },
          ].map((s) => (
            <div key={s.l} className="card-quiet text-center">
              <dt className="title text-2xl" style={{ color: 'var(--accent)' }}>
                {s.n}
              </dt>
              <dd className="text-xs muted">{s.l}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── الأدوات ── */}
      <section>
        <SectionHead title="ماذا تريد أن تفعل؟" />
        <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tool
            href="/analyze"
            icon={ScanLine}
            title="حلّل بيتاً"
            body="اسم الطَّرق، التفعيلات، التقطيع بالنطق الخليجي، الكلمة التي انكسر عندها الوزن، واقتراح التصحيح."
          />
          <Tool
            href="/assistant"
            icon={PenLine}
            title="اكتب شعراً"
            body="محرّر يزن ما تكتبه فوراً على الطروق، ويقترح بدائل موزونة وقوافيَ مناسبة."
          />
          <Tool
            href="/training"
            icon={GraduationCap}
            title="تدرّب"
            body="ثلاثة مستويات على الطروق النبطية، تنتهي بأن تنظم شطراً يزنه المحرّك."
          />
          <Tool
            href="/lessons"
            icon={BookOpen}
            title="ادرس"
            body="عشرة دروس مرتّبة من تعريف العلم إلى النظم، مع اختبار بعد كل درس."
          />
        </Stagger>
      </section>

      {/* ── الطروق النبطية ── */}
      <section>
        <SectionHead
          title="الطروق النبطية"
          more={{ href: '/nabati', label: 'كل الطروق' }}
          sub="أوزان الشعر النبطي الخليجي بتفعيلاتها وعدد حروفها ومقاطعها. اضغط الطَّرق لترى تقطيعه وتغييراته الجائزة وطريقة الكتابة عليه وأخطاءه الشائعة."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TURUQ.slice(0, 8).map((t) => (
            <Link
              key={t.slug}
              href={`/nabati/${t.slug}`}
              className="card transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="title text-lg">{t.name}</h3>
                <span className="chip chip-gold !py-0.5 !text-[10px]">{t.difficulty}</span>
              </div>
              <p className="verse mt-2 text-sm leading-relaxed" style={{ color: 'var(--accent)' }}>
                {t.formulaVocalized}
              </p>
              <div className="my-2.5">
                <PatternStrip pattern={t.pattern} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="chip chip-accent !py-0.5 !text-[10px]">{t.letters} حرفاً</span>
                <span className="faint">{t.syllableCount} مقطعاً</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── القوالب ── */}
      <section>
        <SectionHead
          title="القوالب الشعرية (التفعيلات)"
          more={{ href: '/taf3ilat', label: 'كل القوالب' }}
          sub="التفعيلة هي اللبنة التي يتركّب منها البحر. هذه الأصول الثماني، ولها في صفحة القوالب صورٌ متفرّعة — كـ(فَعِلُنْ) و(مَفَاعِلُنْ). اضغط أيّ قالب لترى شرحه وتقطيعه وخمسين كلمة على وزنه."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEET_LIST.map((f) => {
            const count = wordsForPattern(f.pattern).length;
            return (
              <Link
                key={f.id}
                href={`/taf3ilat/${f.slug}`}
                className="card group transition-transform hover:-translate-y-0.5"
              >
                <div className="verse text-2xl">{f.name}</div>
                <div className="my-3">
                  <PatternStrip pattern={f.pattern} />
                </div>
                <p className="text-xs leading-relaxed muted line-clamp-2">{f.build.join(' + ')}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="chip chip-accent">{f.syllables.length} مقاطع</span>
                  <span className="faint">{count.toLocaleString('ar-EG')} كلمة</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── البحور ── */}
      <section>
        <SectionHead
          title="بحور الشعر الفصيح"
          more={{ href: '/buhur', label: 'كل البحور' }}
          sub="ميزانٌ ثانٍ للمنصّة: ستة عشر بحراً استخرجها الخليل من كلام العرب، لمن أراد الفصيح."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {families.map(({ family, meters }) => {
            const m = meters[0];
            return (
              <Link
                key={family}
                href={`/buhur/${m.slug}`}
                className="card transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-baseline justify-between">
                  <h3 className="title text-xl">{family}</h3>
                  <span className="chip !py-0.5 !text-[10px]">{meters.length} صور</span>
                </div>
                <p className="verse mt-2 text-sm leading-relaxed" style={{ color: 'var(--accent)' }}>
                  {m.formula}
                </p>
                <p className="mt-2 text-xs leading-relaxed muted line-clamp-2">{m.tone}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── النبطي ── */}
      <section>
        <SectionHead
          title="ميزانان لا ميزان"
          more={{ href: '/nabati', label: 'الفرق بينهما' }}
          sub="طروق النبط تُقاس باللحن وتُقرأ بالنطق الخليجي، وعروض الخليل يقيس الحرف. والمنصّة تُصرّح بأيّهما وزنت، ولا تخلط."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Link href="/library" className="card transition-transform hover:-translate-y-0.5">
            <h3 className="title text-lg">مكتبة الشعر النبطي</h3>
            <p className="mt-2 text-xs leading-relaxed muted">
              أبياتٌ مصنّفةٌ بالطَّرق والقافية والموضوع والشاعر والدولة والمدرسة — يصنّفها المحرّك
              من نصّ البيت لا بالتخمين.
            </p>
          </Link>
          <Link href="/analyze" className="card transition-transform hover:-translate-y-0.5">
            <h3 className="title text-lg">قِس على وزنٍ تُمليه</h3>
            <p className="mt-2 text-xs leading-relaxed muted">
              اكتب الوزن بالتفعيلات كما تعرفه، فيقيس المحرّك نصَّك عليه ويُريك كم حرفاً يقتضيه وزنك
              وكم في نصّك وأين الفرق.
            </p>
          </Link>
          <Link href="/taf3ilat" className="card transition-transform hover:-translate-y-0.5">
            <h3 className="title text-lg">الصور المتفرّعة</h3>
            <p className="mt-2 text-xs leading-relaxed muted">
              فَعِلُنْ وفَعْلُنْ ومَفَاعِلُنْ ومُفْتَعِلُنْ وغيرها — قوالبُ لها صفحاتها وكلماتها،
              لا مجرّد زحافاتٍ في جدول.
            </p>
          </Link>
        </div>
      </section>

      {/* ── التدريب اليومي ── */}
      <section>
        <SectionHead
          title="تدريب اليوم"
          more={{ href: '/training', label: 'التدريب الكامل' }}
          sub="خمسة أسئلة تتجدّد كل يوم — دقيقتان تكفيان."
        />
        <DailyDrill />
      </section>

      {/* ── الدروس ── */}
      <section>
        <SectionHead title="آخر الدروس" more={{ href: '/lessons', label: 'كل الدروس' }} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {lessons.map((l) => (
            <Link
              key={l.slug}
              href={`/lessons/${l.slug}`}
              className="card transition-transform hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="chip chip-gold !py-0.5">{l.level}</span>
                <span className="faint">{l.minutes} دقائق</span>
              </div>
              <h3 className="title mt-2 text-lg">{l.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed muted line-clamp-3">{l.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHead({
  title,
  sub,
  more,
}: {
  title: string;
  sub?: string;
  more?: { href: string; label: string };
}) {
  return (
    <header className="mb-5">
      <div className="flex items-end justify-between gap-4">
        <h2 className="title text-2xl">{title}</h2>
        {more && (
          <Link href={more.href} className="link flex shrink-0 items-center gap-1 text-sm">
            {more.label}
            <ArrowLeft size={15} />
          </Link>
        )}
      </div>
      {sub && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed muted">{sub}</p>}
    </header>
  );
}

function Tool({
  href,
  icon: Icon,
  title,
  body,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  body: string;
}) {
  return (
    <StaggerItem>
      <Link href={href} className="card block h-full transition-transform hover:-translate-y-0.5">
      <span
        className="mb-3 grid h-10 w-10 place-items-center rounded-xl"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
      >
        <Icon size={19} />
      </span>
      <h3 className="title text-lg">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed muted">{body}</p>
      </Link>
    </StaggerItem>
  );
}
