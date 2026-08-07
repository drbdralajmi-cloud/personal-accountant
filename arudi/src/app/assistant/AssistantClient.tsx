'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, CircleDashed, Loader2, PenLine, TriangleAlert } from 'lucide-react';
import { AnalysisView } from '@/components/AnalysisView';
import type { ApiAnalysis } from '@/lib/types';

const DEBOUNCE = 550;

export function AssistantClient() {
  const [text, setText] = useState('');
  const [data, setData] = useState<ApiAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const q = text.trim();
    if (q.length < 6) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const id = ++seq.current;
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ text: q.split('\n')[0], suggest: true }),
        });
        const json = await res.json();
        // نتجاهل النتائج المتأخّرة عن آخر طلب
        if (id === seq.current && !json.error) setData(json);
      } catch {
        /* الاتصال منقطع — نُبقي آخر نتيجة */
      } finally {
        if (id === seq.current) setLoading(false);
      }
    }, DEBOUNCE);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [text]);

  const status = loading
    ? { icon: Loader2, label: 'جارٍ التحليل…', color: 'var(--text-faint)', spin: true }
    : !data
      ? { icon: CircleDashed, label: 'اكتب بيتاً لتبدأ', color: 'var(--text-faint)', spin: false }
      : data.ok
        ? { icon: CheckCircle2, label: `موزون على ${data.meter?.name}`, color: 'var(--ok)', spin: false }
        : { icon: TriangleAlert, label: 'الوزن مكسور', color: 'var(--danger)', spin: false };

  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="editor" className="flex items-center gap-2 text-sm font-semibold">
            <PenLine size={16} />
            المحرّر
          </label>
          <span
            className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: status.color }}
          >
            <StatusIcon size={14} className={status.spin ? 'animate-spin' : ''} />
            {status.label}
          </span>
        </div>

        <textarea
          id="editor"
          rows={3}
          className="input verse min-h-[7rem] resize-y leading-loose"
          placeholder="اكتب بيتك هنا… واستعمل (…) للفصل بين الصدر والعجز"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="faint">أدخل فاصلاً بين الشطرين:</span>
          <button className="chip" onClick={() => setText((t) => t + ' … ')}>
            …
          </button>
          {data?.meter && <span className="chip chip-accent">{data.meter.formula}</span>}
          {data?.rhymeText && <span className="chip chip-gold">{data.rhymeText}</span>}
        </div>
      </div>

      {data ? (
        <AnalysisView data={data} />
      ) : (
        <div className="card">
          <h2 className="title mb-2 text-lg">كيف يعمل المساعد؟</h2>
          <ul className="space-y-1.5 text-sm leading-relaxed muted">
            <li>• يحوّل ما تكتبه إلى كتابةٍ عروضية، ثم إلى سلسلة حركاتٍ وسكنات.</li>
            <li>• يقابل السلسلة بأوزان البحور كلّها ويرجّح أقربها.</li>
            <li>• إن لم يستقم الوزن حدّد التفعيلة المختلّة وقال لك ما ينقصها أو يزيد فيها.</li>
            <li>• يقترح كلمات من المعجم تملأ الموضع بالوزن الصحيح.</li>
            <li>• يستخرج قافيتك ويقترح كلماتٍ على رويّها، وشطراً مكمّلاً على بحرك.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
