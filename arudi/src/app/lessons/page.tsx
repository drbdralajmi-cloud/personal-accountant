import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { LESSONS, LEVELS, lessonsByLevel } from '@/data/lessons';

export const metadata: Metadata = {
  title: 'دروس العروض',
  description:
    'عشرة دروس مرتّبة من تعريف علم العروض إلى النظم: الكتابة العروضية، الأسباب والأوتاد، التفعيلات، الزحافات والعلل، التقطيع، الدوائر، القافية.',
};

export default function LessonsPage() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="title text-3xl">الدروس</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed muted">
          {LESSONS.length} دروس مرتّبة ترتيباً تصاعدياً. ابدأ من الأول ولا تقفز؛ فكل درسٍ يبني على
          ما قبله، وفي آخر كل درس اختبارٌ قصير.
        </p>
      </header>

      {LEVELS.map((level) => (
        <section key={level}>
          <h2 className="title mb-4 flex items-center gap-2 text-xl">
            {level}
            <span className="chip !py-0.5 !text-[10px]">{lessonsByLevel(level).length} دروس</span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {lessonsByLevel(level).map((l) => (
              <Link
                key={l.slug}
                href={`/lessons/${l.slug}`}
                className="card transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span
                    className="grid h-7 w-7 place-items-center rounded-lg font-bold"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                  >
                    {l.order}
                  </span>
                  <span className="flex items-center gap-1 faint">
                    <Clock size={12} />
                    {l.minutes} د
                  </span>
                </div>
                <h3 className="title mt-3 text-lg">{l.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed muted">{l.summary}</p>
                <p className="mt-3 text-xs faint">
                  {l.sections.length} أقسام · {l.quiz.length} أسئلة
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
