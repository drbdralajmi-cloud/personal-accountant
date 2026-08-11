'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { History, Loader2, ScanLine, Star, Trash2 } from 'lucide-react';
import { AnalysisView } from '@/components/AnalysisView';
import { FormulaResult } from '@/components/FormulaResult';
import { SystemPicker } from '@/components/SystemPicker';
import type { ApiAnalysis, ApiFormulaResult, ApiPoem, ApiSystem } from '@/lib/types';
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
  const [system, setSystem] = useState<ApiSystem>('نبطي');
  const [formula, setFormula] = useState('مستفعلن فاعلن مستفعلن فاعلن');
  const [strict, setStrict] = useState(true);
  const [data, setData] = useState<ApiAnalysis | null>(null);
  const [formulaData, setFormulaData] = useState<ApiFormulaResult | null>(null);
  const [poem, setPoem] = useState<ApiPoem | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const lastRun = useRef('');

  useEffect(() => {
    setHistory(getHistory());
    return onStorageChange(() => setHistory(getHistory()));
  }, []);

  const run = useCallback(
    async (value: string, o: { system: ApiSystem; formula: string; strict: boolean }) => {
      const q = value.trim();
      if (!q) return;
      lastRun.current = q;
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            text: q,
            suggest: true,
            compare: true,
            system: o.system,
            formula: o.formula,
            strict: o.strict,
          }),
        });
        const json = await res.json();
        setData(null);
        setPoem(null);
        setFormulaData(null);
        if (!res.ok) {
          setError(json.error ?? 'تعذّر التحليل.');
          return;
        }
        if (json.kind === 'وزن') {
          setFormulaData(json as ApiFormulaResult);
          pushHistory({ text: q, meter: json.formula?.normalized, ok: json.verbatim });
        } else if (json.kind === 'قصيدة') {
          setPoem(json as ApiPoem);
          pushHistory({ text: q, meter: json.meter?.name, ok: json.brokenCount === 0 });
        } else {
          setData(json as ApiAnalysis);
          pushHistory({ text: q, meter: json.meter?.name, ok: json.ok });
        }
      } catch {
        setError('تعذّر الاتصال بالمحرّك. تأكّد من اتصالك ثم أعد المحاولة.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // تحليل ما جاء في الرابط تلقائياً
  useEffect(() => {
    if (initial && lastRun.current !== initial) {
      run(initial, { system: 'نبطي', formula: '', strict: true });
    }
  }, [initial, run]);

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(text, { system, formula, strict });
        }}
        className="card space-y-4"
      >
        <div>
          <label htmlFor="verse" className="mb-2 block text-sm font-semibold">
            اكتب بيتاً أو شطراً أو قصيدة (كل بيت في سطر)
          </label>
          <textarea
            id="verse"
            rows={3}
            className="input verse min-h-[6rem] resize-y leading-loose"
            placeholder="يا مرحبا بالقمر لي طل من فوق … وشع نوره على دربي وضواني"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>

        <SystemPicker value={system} onChange={setSystem} />

        {system === 'مخصّص' && (
          <div className="space-y-2 rounded-xl p-3" style={{ background: 'var(--surface-2)' }}>
            <label htmlFor="formula" className="block text-sm font-semibold">
              الوزن بالتفعيلات
            </label>
            <input
              id="formula"
              className="input verse text-lg"
              placeholder="مستفعلن فاعلن مستفعلن فاعلن"
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
            />
            <label className="flex items-center gap-2 text-xs muted">
              <input
                type="checkbox"
                checked={strict}
                onChange={(e) => setStrict(e.target.checked)}
              />
              التزامٌ صارم بالصيغة (بلا زحافٍ ولا إشباع)
            </label>
            <p className="text-xs faint">
              اكتب التفعيلات بأسمائها، ويجوز الاختصار: «فاعلن ×4». وسيُريك المحرّك كم حرفاً يقتضيه
              وزنك وكم في نصّك وأين الفرق.
            </p>
          </div>
        )}

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

      {data?.comparison?.differs && (
        <div className="card space-y-2" style={{ borderColor: 'var(--gold)' }}>
          <h3 className="title text-lg">الميزانان يختلفان في هذا النصّ</h3>
          <p className="text-sm leading-relaxed muted">
            النصّ {data.comparison.letters.toLocaleString('ar-EG')} حرفاً عروضياً. وقد اختلف حكم
            الميزانين عليه، وليس أحدهما خطأً: الفصيح يُقاس بعروض الخليل حرفاً بحرف، والنبطي يُقاس
            بالطَّرق واللحن. فانظر أيّهما ميزانُ نصّك.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="card-quiet">
              <p className="text-xs faint">في عروض الخليل</p>
              <p className="verse text-xl">{data.comparison.khalili.meter ?? '—'}</p>
              <span className={`chip !py-0.5 !text-[10px] ${data.comparison.khalili.ok ? 'chip-ok' : 'chip-bad'}`}>
                {data.comparison.khalili.ok ? 'موزون' : 'فيه خلل'}
              </span>
            </div>
            <div className="card-quiet">
              <p className="text-xs faint">في طروق النبط</p>
              <p className="verse text-xl">{data.comparison.nabati.meter ?? '—'}</p>
              <span className={`chip !py-0.5 !text-[10px] ${data.comparison.nabati.ok ? 'chip-ok' : 'chip-bad'}`}>
                {data.comparison.nabati.ok ? 'موزون' : 'فيه خلل'}
              </span>
            </div>
          </div>
        </div>
      )}

      {formulaData && <FormulaResult data={formulaData} />}

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
                    run(h.text, { system, formula, strict });
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
