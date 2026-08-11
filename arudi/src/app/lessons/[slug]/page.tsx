import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { AnalyzeLink } from '@/components/AnalyzeLink';
import { LessonQuiz } from '@/components/LessonQuiz';
import { PrintButton } from '@/components/actions';
import { LESSONS, lessonBySlug } from '@/data/lessons';

export function generateStaticParams() {
  return LESSONS.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lesson = lessonBySlug(slug);
  if (!lesson) return { title: 'درس غير موجود' };
  return { title: lesson.title, description: lesson.summary };
}

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = lessonBySlug(slug);
  if (!lesson) notFound();

  const ordered = [...LESSONS].sort((a, b) => a.order - b.order);
  const at = ordered.findIndex((l) => l.slug === lesson.slug);
  const prev = ordered[at - 1];
  const next = ordered[at + 1];

  return (
    <article className="mx-auto max-w-3xl space-y-8">
      <header>
        <Link href="/lessons" className="text-xs faint hover:underline">
          الدروس
        </Link>
        <h1 className="title mt-1 text-3xl">{lesson.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="chip chip-gold">{lesson.level}</span>
          <span className="chip">
            <Clock size={11} />
            {lesson.minutes} دقائق
          </span>
          <span className="chip">الدرس {lesson.order}</span>
          <PrintButton label="تصدير الدرس PDF" />
        </div>
        <p className="mt-3 leading-relaxed muted">{lesson.summary}</p>
      </header>

      {lesson.sections.map((s, i) => (
        <section key={i} className="space-y-3">
          <h2 className="title text-xl" style={{ color: 'var(--accent)' }}>
            {s.heading}
          </h2>
          <p className="leading-loose">{s.body}</p>

          {s.examples && (
            <div className="space-y-2">
              {s.examples.map((ex, k) => (
                <div key={k} className="card-quiet">
                  <p className="verse text-base leading-loose">{ex.text}</p>
                  {ex.note && <p className="mt-1 text-xs faint">{ex.note}</p>}
                  {ex.text.includes('…') && (
                    <div className="mt-2">
                      <AnalyzeLink text={ex.text} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {s.table && (
            <div className="overflow-x-auto rounded-xl border">
              <table className="table-clean">
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    {s.table.head.map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.table.rows.map((row, k) => (
                    <tr key={k}>
                      {row.map((cell, c) => (
                        <td key={c} className={c === 0 ? 'font-semibold' : 'muted'}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}

      <section className="no-print">
        <h2 className="title mb-3 text-xl">اختبار الدرس</h2>
        <LessonQuiz quiz={lesson.quiz} level={lesson.level} />
      </section>

      <nav className="flex items-center justify-between gap-3 border-t pt-6 no-print">
        {prev ? (
          <Link href={`/lessons/${prev.slug}`} className="btn">
            <ArrowRight size={15} />
            {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/lessons/${next.slug}`} className="btn btn-primary">
            {next.title}
            <ArrowLeft size={15} />
          </Link>
        )}
      </nav>
    </article>
  );
}
