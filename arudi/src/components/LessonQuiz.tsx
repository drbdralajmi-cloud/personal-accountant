'use client';

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { recordAnswer } from '@/lib/storage';

interface Q {
  question: string;
  options: string[];
  answer: number;
  why: string;
}

/** اختبار قصير في آخر كل درس. */
export function LessonQuiz({ quiz, level }: { quiz: Q[]; level: string }) {
  const [picks, setPicks] = useState<Record<number, number>>({});

  const answer = (qi: number, oi: number) => {
    if (picks[qi] !== undefined) return;
    setPicks((p) => ({ ...p, [qi]: oi }));
    recordAnswer(level, oi === quiz[qi].answer, 10);
  };

  const answered = Object.keys(picks).length;
  const right = Object.entries(picks).filter(([qi, oi]) => quiz[+qi].answer === oi).length;

  return (
    <div className="space-y-4">
      {quiz.map((q, qi) => (
        <div key={qi} className="card">
          <p className="mb-3 font-semibold">
            {qi + 1}. {q.question}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {q.options.map((o, oi) => {
              const picked = picks[qi];
              const isAnswer = oi === q.answer;
              const done = picked !== undefined;
              let style: React.CSSProperties = { background: 'var(--surface-2)' };
              if (done && isAnswer) style = { background: 'var(--ok-soft)', borderColor: 'var(--ok)' };
              else if (done && picked === oi)
                style = { background: 'var(--danger-soft)', borderColor: 'var(--danger)' };
              return (
                <button
                  key={oi}
                  onClick={() => answer(qi, oi)}
                  disabled={done}
                  className="rounded-xl border px-4 py-2.5 text-right text-sm disabled:cursor-default"
                  style={style}
                >
                  {o}
                  {done && isAnswer && <Check size={14} className="mr-2 inline" />}
                  {done && picked === oi && !isAnswer && <X size={14} className="mr-2 inline" />}
                </button>
              );
            })}
          </div>
          {picks[qi] !== undefined && (
            <p className="mt-3 rounded-lg p-3 text-sm leading-relaxed muted" style={{ background: 'var(--surface-2)' }}>
              {q.why}
            </p>
          )}
        </div>
      ))}

      {answered === quiz.length && (
        <p className="card text-center">
          <span className="title text-2xl" style={{ color: 'var(--accent)' }}>
            {right} / {quiz.length}
          </span>
          <span className="mt-1 block text-sm muted">
            {right === quiz.length ? 'أتقنت الدرس — انتقل إلى التالي.' : 'راجع الأقسام أعلاه ثم أعد القراءة.'}
          </span>
        </p>
      )}
    </div>
  );
}
