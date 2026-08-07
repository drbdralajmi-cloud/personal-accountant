'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { History, Loader2, ScanLine, Star, Trash2 } from 'lucide-react';
import { AnalysisView } from '@/components/AnalysisView';
import type { ApiAnalysis, ApiPoem } from '@/lib/types';
import {
  addFavorite,
  clearHistory,
  getHistory,
  HistoryEntry,
  onStorageChange,
  pushHistory,
} from '@/lib/storage';

export function AnalyzeClient() {
  const params = useSearchParams();
  const initial = params.get('q') ?? '';
  const [text, setText] = useState(initial);
  const [data, setData] = useState<ApiAnalysis | null>(null);
  const [poem, setPoem] = useState<ApiPoem | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const lastRun = useRef('');

  useEffect(() => {
    setHistory(getHistory());
    return onStorageChange(() => setHistory(getHistory()));
  }, []);

  const run = useCallback(async (value: string) => {
    const q = value.trim();
    if (!q) return;
    lastRun.current = q;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: q, suggest: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'تعذّر التحليل.');
        setData(null);
        setPoem(null);
        return;
      }
      if (json.kind === 'قصيدة') {
        setPoem(json as ApiPoem);
        setData(null);
        pushHistory({ text: q, meter: json.meter?.name, ok: json.brokenCount === 0 });
      } else {
        setData(json as ApiAnalysis);
        setPoem(null);
        pushHistory({ text: q, meter: json.meter?.name, ok: json.ok });
      }
    } catch {
      setError('تعذّر الاتصال بالمحرّك. تأكّد من اتصالك ثم أعد المحاولة.');
    } finally {
      setLoading(false);
    }
  }, []);

  // تحليل ما جاء في الرابط تلقائياً
  useEffect(() => {
    if (initial && lastRun.current !== initial) run(initial);
  }, [initial, run]);

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(text);
        }}
        className="card space-y-3"
      >
        <label htmlFor="verse" className="block text-sm font-semibold">
          اكتب بيتاً أو شطراً أو قصيدة (كل بيت في سطر)
        </label>
        <textarea
          id="verse"
          rows={3}
          className="input verse min-h-[6rem] resize-y leading-loose"
          placeholder="قفا نبك من ذكرى حبيب ومنزل … بسقط اللوى بين الدخول فحومل"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn btn-primary" disabled={loading || !text.trim()}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
            حلّل الوزن
          </button>
          {data?.meter && (
            <button
              type="button"
              className="btn"
              onClick={() =>
                addFavorite({
                  kind: 'verse',
                  id: data.input,
                  title: data.input,
                  subtitle: data.meter?.name,
                })
              }
            >
              <Star size={15} />
              حفظ في المفضّلة
            </button>
          )}
          <p className="text-xs faint">
            التشكيل يزيد الدقّة، وبدونه يستنبط المحرّك الحركات من الوزن نفسه.
          </p>
        </div>
      </form>

      {error && (
        <p className="card text-sm" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
          {error}
        </p>
      )}

      {data && <AnalysisView data={data} />}

      {poem && (
        <div className="space-y-4">
          <div className="card flex flex-wrap items-center gap-3">
            <div className="flex-1">
              <p className="title text-xl">
                القصيدة على بحر {poem.meter?.name ?? 'غير محدّد'}
              </p>
              <p className="text-sm muted">
                {poem.soundCount} بيتاً موزوناً · {poem.brokenCount} بيتاً فيه خلل
              </p>
            </div>
            <span className={`chip ${poem.brokenCount ? 'chip-bad' : 'chip-ok'}`}>
              {poem.verses.length} أبيات
            </span>
          </div>
          {poem.verses.map((v, i) => (
            <details key={i} className="card" open={!v.ok}>
              <summary className="cursor-pointer list-none">
                <span className={`chip ${v.ok ? 'chip-ok' : 'chip-bad'} ml-2`}>{i + 1}</span>
                <span className="verse">{v.input}</span>
                <span className="mr-2 text-xs faint">{v.meter?.name}</span>
              </summary>
              <div className="mt-4">
                <AnalysisView data={v} />
              </div>
            </details>
          ))}
        </div>
      )}

      {!!history.length && (
        <div className="card no-print">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="title flex items-center gap-2 text-lg">
              <History size={17} />
              آخر عمليات البحث
            </h3>
            <button className="btn btn-ghost px-2 py-1 text-xs" onClick={() => clearHistory()}>
              <Trash2 size={14} />
              مسح
            </button>
          </div>
          <ul className="space-y-1.5">
            {history.slice(0, 8).map((h) => (
              <li key={h.text + h.at}>
                <button
                  className="w-full rounded-lg px-3 py-2 text-right text-sm transition-colors hover:opacity-80"
                  style={{ background: 'var(--surface-2)' }}
                  onClick={() => {
                    setText(h.text);
                    run(h.text);
                  }}
                >
                  <span className={`chip !py-0.5 !text-[10px] ${h.ok ? 'chip-ok' : 'chip-bad'}`}>
                    {h.meter ?? '—'}
                  </span>
                  <span className="mr-2 muted">{h.text.slice(0, 70)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
