'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, Check, RotateCcw, X } from 'lucide-react';
import type { Exercise } from '@/lib/exercises';
import { recordAnswer } from '@/lib/storage';

interface Props {
  exercises: Exercise[];
  onFinish?: (score: number, total: number) => void;
  compact?: boolean;
}

/** مشغّل التمارين: اختيار من متعدّد، وترتيب، ومطابقة. */
export function ExerciseRunner({ exercises, onFinish, compact }: Props) {
  const [index, setIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [right, setRight] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [order, setOrder] = useState<string[]>([]);
  const [matches, setMatches] = useState<Record<string, string>>({});
  const [activeLeft, setActiveLeft] = useState<string | null>(null);

  const ex = exercises[index];
  const done = index >= exercises.length;

  const rightOptions = useMemo(
    () => (ex?.pairs ? [...ex.pairs.map((p) => p.right)].sort((a, b) => a.localeCompare(b, 'ar')) : []),
    [ex],
  );

  if (!exercises.length) {
    return <p className="card text-sm muted">لا توجد تمارين متاحة الآن.</p>;
  }

  if (done) {
    const pct = Math.round((right / exercises.length) * 100);
    return (
      <div className="card text-center">
        <p className="title text-3xl" style={{ color: 'var(--accent)' }}>
          {right} / {exercises.length}
        </p>
        <p className="mt-1 muted">أصبت {pct}٪ وجمعت {score} نقطة.</p>
        <p className="mt-3 text-sm muted">
          {pct >= 80
            ? 'ممتاز — أذنك بدأت تلتقط الإيقاع. انتقل إلى المستوى التالي.'
            : pct >= 50
              ? 'جيّد. راجع درس التفعيلات ثم أعد المحاولة.'
              : 'ابدأ بدرس «الأسباب والأوتاد» ثم عد إلى هنا.'}
        </p>
        <button
          className="btn btn-primary mt-4"
          onClick={() => {
            setIndex(0);
            setScore(0);
            setRight(0);
            reset();
            onFinish?.(score, exercises.length);
          }}
        >
          <RotateCcw size={15} />
          إعادة
        </button>
      </div>
    );
  }

  function reset() {
    setAnswered(false);
    setCorrect(false);
    setChosen(null);
    setOrder([]);
    setMatches({});
    setActiveLeft(null);
  }

  function finish(ok: boolean) {
    setAnswered(true);
    setCorrect(ok);
    if (ok) {
      setScore((s) => s + ex.points);
      setRight((r) => r + 1);
    }
    recordAnswer(ex.level, ok, ex.points);
  }

  const next = () => {
    reset();
    setIndex((i) => i + 1);
  };

  return (
    <div className="card space-y-4">
      <header className="flex flex-wrap items-center gap-2">
        <span className="chip chip-accent">{ex.kind}</span>
        <span className="chip">{ex.level}</span>
        <span className="chip">{ex.points} نقاط</span>
        <span className="mr-auto text-xs faint">
          {index + 1} من {exercises.length}
        </span>
      </header>

      <div
        className="h-1.5 overflow-hidden rounded-full"
        style={{ background: 'var(--surface-2)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${(index / exercises.length) * 100}%`, background: 'var(--accent)' }}
        />
      </div>

      <p className="font-semibold">{ex.prompt}</p>
      {ex.context && (
        <p
          className={`card-quiet ${ex.context.match(/^[/°\s]+$/) ? 'font-mono tracking-[.3em]' : 'verse'}`}
          dir={ex.context.match(/^[/°\s]+$/) ? 'ltr' : 'rtl'}
        >
          {ex.context}
        </p>
      )}

      {/* اختيار من متعدّد */}
      {ex.options && (
        <div className={`grid gap-2 ${compact ? '' : 'sm:grid-cols-2'}`}>
          {ex.options.map((o, i) => {
            const isAnswer = i === ex.answerIndex;
            const picked = chosen === i;
            let style: React.CSSProperties = {};
            if (answered && isAnswer) style = { borderColor: 'var(--ok)', background: 'var(--ok-soft)' };
            else if (answered && picked)
              style = { borderColor: 'var(--danger)', background: 'var(--danger-soft)' };
            return (
              <button
                key={i}
                disabled={answered}
                onClick={() => {
                  setChosen(i);
                  finish(isAnswer);
                }}
                className="verse rounded-xl border px-4 py-3 text-right text-base transition-colors disabled:cursor-default"
                style={{ background: 'var(--surface-2)', ...style }}
              >
                {o}
                {answered && isAnswer && <Check size={15} className="mr-2 inline" />}
                {answered && picked && !isAnswer && <X size={15} className="mr-2 inline" />}
              </button>
            );
          })}
        </div>
      )}

      {/* ترتيب المقاطع */}
      {ex.items && (
        <div className="space-y-3">
          <div className="flex min-h-[3.2rem] flex-wrap items-center gap-2 rounded-xl border border-dashed p-2">
            {order.length ? (
              order.map((it, i) => (
                <button
                  key={it + i}
                  disabled={answered}
                  onClick={() => setOrder((o) => o.filter((_, k) => k !== i))}
                  className="chip verse !text-base"
                >
                  {it}
                </button>
              ))
            ) : (
              <span className="px-2 text-xs faint">اضغط المقاطع بالترتيب الصحيح…</span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {ex.items.map((it, i) => {
              const usedCount = order.filter((o) => o === it).length;
              const availableCount = ex.items!.filter((x) => x === it).length;
              return (
                <button
                  key={it + i}
                  disabled={answered || usedCount >= availableCount}
                  onClick={() => setOrder((o) => [...o, it])}
                  className="verse rounded-xl border px-4 py-2 text-base disabled:opacity-30"
                  style={{ background: 'var(--surface-2)' }}
                >
                  {it}
                </button>
              );
            })}
          </div>
          {!answered && (
            <button
              className="btn btn-primary"
              disabled={order.length !== ex.correctOrder!.length}
              onClick={() => finish(order.join('|') === ex.correctOrder!.join('|'))}
            >
              تحقّق
            </button>
          )}
        </div>
      )}

      {/* المطابقة */}
      {ex.pairs && (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-2">
              {ex.pairs.map((p) => (
                <button
                  key={p.left}
                  disabled={answered}
                  onClick={() => setActiveLeft(p.left)}
                  className="verse w-full rounded-xl border px-3 py-2.5 text-right text-base"
                  style={{
                    background: activeLeft === p.left ? 'var(--accent-soft)' : 'var(--surface-2)',
                    borderColor:
                      answered && matches[p.left] === p.right
                        ? 'var(--ok)'
                        : answered && matches[p.left]
                          ? 'var(--danger)'
                          : 'var(--border)',
                  }}
                >
                  {p.left}
                  {matches[p.left] && <span className="mr-2 text-xs faint">← {matches[p.left]}</span>}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {rightOptions.map((r) => (
                <button
                  key={r}
                  disabled={answered || !activeLeft}
                  onClick={() => {
                    if (!activeLeft) return;
                    setMatches((m) => ({ ...m, [activeLeft]: r }));
                    setActiveLeft(null);
                  }}
                  className="verse w-full rounded-xl border px-3 py-2.5 text-right text-base disabled:opacity-60"
                  style={{ background: 'var(--surface-2)' }}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {!answered && (
            <button
              className="btn btn-primary"
              disabled={Object.keys(matches).length !== ex.pairs.length}
              onClick={() => finish(ex.pairs!.every((p) => matches[p.left] === p.right))}
            >
              تحقّق
            </button>
          )}
        </div>
      )}

      {answered && (
        <div
          className="rounded-xl border p-3.5 text-sm"
          style={{
            background: correct ? 'var(--ok-soft)' : 'var(--danger-soft)',
            borderColor: correct ? 'var(--ok)' : 'var(--danger)',
          }}
        >
          <p className="font-bold" style={{ color: correct ? 'var(--ok)' : 'var(--danger)' }}>
            {correct ? 'إجابة صحيحة' : 'إجابة غير صحيحة'}
          </p>
          <p className="mt-1 leading-relaxed muted">{ex.explanation}</p>
          <button className="btn btn-primary mt-3" onClick={next}>
            {index + 1 === exercises.length ? 'إنهاء' : 'التالي'}
            <ArrowLeft size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
