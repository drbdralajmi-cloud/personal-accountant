'use client';

import { useState } from 'react';
import { Check, Loader2, PenLine, X } from 'lucide-react';
import type { ComposeTask as Task } from '@/lib/nabati-exercises';
import type { ApiAnalysis } from '@/lib/types';
import { recordAnswer } from '@/lib/storage';

/**
 * آخر مراتب التدريب: أن يكتب المتدرّب شطراً على طَرقٍ بعينه، فيحكم عليه
 * المحرّك لا نموذجُ إجابةٍ محفوظ. ولذلك لا جواب «صحيح» واحداً هنا: كل شطرٍ
 * استقام وزنُه على الطَّرق فهو صواب.
 */
export function ComposeTaskCard({ task }: { task: Task }) {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ApiAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const judge = async () => {
    const q = text.trim();
    if (!q) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: q, system: 'نبطي', suggest: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'تعذّر التحليل.');
        setResult(null);
        return;
      }
      setResult(json as ApiAnalysis);
      const onTariq = json.ok && json.meter?.slug === task.tariqSlug;
      recordAnswer(task.level, onTariq, onTariq ? 40 : 0);
    } catch {
      setError('تعذّر الاتصال بالمحرّك.');
    } finally {
      setLoading(false);
    }
  };

  const onTariq = !!result?.ok && result.meter?.slug === task.tariqSlug;
  const soundButOther = !!result?.ok && !onTariq;

  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="title flex items-center gap-2 text-lg">
          <PenLine size={16} />
          {task.prompt}
        </h3>
        <span className="chip chip-gold !py-0.5 !text-[10px]">{task.level}</span>
      </div>

      <div className="card-quiet space-y-1">
        <p className="verse text-lg">{task.formula}</p>
        <p className="text-xs muted">
          الشطر {task.letters} حرفاً عروضياً و{task.syllables} مقطعاً.
        </p>
        {task.hint && <p className="text-xs faint">إرشاد: {task.hint}</p>}
      </div>

      <textarea
        rows={2}
        className="input verse resize-y leading-loose"
        placeholder={`اكتب شطرك على ${task.tariqName}…`}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="btn btn-primary"
          disabled={loading || !text.trim()}
          onClick={judge}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
          زِن ما كتبت
        </button>
        {result && (
          <button
            type="button"
            className="btn btn-ghost text-xs"
            onClick={() => {
              setText('');
              setResult(null);
            }}
          >
            جرّب غيره
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      {result && (
        <div
          className="rounded-xl px-4 py-3 text-sm leading-relaxed"
          style={{
            background: 'var(--surface-2)',
            borderInlineStart: `3px solid var(--${onTariq ? 'ok' : 'danger'})`,
          }}
        >
          <p className="flex items-center gap-2 font-semibold">
            {onTariq ? <Check size={16} /> : <X size={16} />}
            {onTariq
              ? `أحسنت — شطرك موزونٌ على ${task.tariqName}.`
              : soundButOther
                ? `شطرك موزون، لكنه على ${result.meter?.name} لا على ${task.tariqName}.`
                : `الشطر لم يستقم على ${task.tariqName}.`}
          </p>
          {result.sadr && (
            <p className="mt-2 text-xs muted">
              تقطيعه: <span className="verse">{result.sadr.feet.map((f) => f.name).join(' · ')}</span>
              {' — '}
              {result.letters ?? result.sadr.binary.length} حرفاً، والطَّرق يقتضي {task.letters}.
            </p>
          )}
          {!!result.issues?.length && !onTariq && (
            <ul className="mt-2 space-y-1 text-xs muted">
              {result.issues.slice(0, 3).map((i, k) => (
                <li key={k}>• {i.message}</li>
              ))}
            </ul>
          )}
          {!!result.fixes?.length && !onTariq && (
            <p className="mt-2 text-xs muted">
              جرّب في موضع الخلل:{' '}
              <span className="verse">
                {result.fixes[0].words.slice(0, 6).map((w) => w.word).join('، ')}
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
