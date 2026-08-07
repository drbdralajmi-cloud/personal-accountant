'use client';

import { useState } from 'react';
import { Loader2, TestTube2 } from 'lucide-react';

interface Check {
  name: string;
  ok: boolean;
  detail: string;
}

/** أدوات فحص سريعة تتحقّق من سلامة المحرّك والمحتوى. */
export function AdminTools() {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      const json = await res.json();
      setChecks(json.checks ?? []);
    } catch {
      setChecks([{ name: 'الاتصال', ok: false, detail: 'تعذّر الوصول إلى الخادم.' }]);
    } finally {
      setLoading(false);
    }
  };

  const failed = checks?.filter((c) => !c.ok).length ?? 0;

  return (
    <section className="card">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="title text-lg">فحص سلامة المحتوى</h2>
          <p className="text-sm muted">
            يعيد تحليل أبيات المدوّنة وأمثلة البحور بالمحرّك ويتحقّق من تغطية المعجم.
          </p>
        </div>
        <button className="btn btn-primary" onClick={run} disabled={loading}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : <TestTube2 size={15} />}
          شغّل الفحص
        </button>
      </div>

      {checks && (
        <>
          <p className={`chip ${failed ? 'chip-bad' : 'chip-ok'} mb-3`}>
            {failed ? `${failed} فحصاً لم ينجح` : 'كل الفحوص ناجحة'}
          </p>
          <ul className="space-y-1.5 text-sm">
            {checks.map((c) => (
              <li key={c.name} className="flex flex-wrap items-center gap-2">
                <span className={`chip !py-0.5 !text-[10px] ${c.ok ? 'chip-ok' : 'chip-bad'}`}>
                  {c.ok ? 'ناجح' : 'فاشل'}
                </span>
                <span className="font-semibold">{c.name}</span>
                <span className="muted">— {c.detail}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
