'use client';

import { AlertTriangle, Check, Minus, Plus } from 'lucide-react';
import { AnalysisView } from './AnalysisView';
import type { ApiFormulaResult } from '@/lib/types';

const sym = (p: string) => p.replace(/1/g, '/').replace(/0/g, '°');

/**
 * نتيجة القياس على وزنٍ أملاه المستخدم.
 *
 * المقصود أن يُرى الحسابُ لا الحكمُ وحده: كم حرفاً يقتضيه وزنك، وكم حرفاً في
 * نصّك، وأين الفرق. فإن اختلفنا في الوزن فالفيصل عددٌ يُعدّ، لا رأيٌ يُدَّعى.
 */
export function FormulaResult({ data }: { data: ApiFormulaResult }) {
  const b = data.budget;
  const short = (b?.delta ?? 0) < 0;
  const long = (b?.delta ?? 0) > 0;
  const good = data.verbatim;

  return (
    <div className="space-y-5">
      <div className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs faint">الوزن الذي أمليتَه</p>
            <p className="verse mt-1 text-2xl">{data.formula.normalized}</p>
          </div>
          <span className={`chip ${good ? 'chip-ok' : short || long ? 'chip-bad' : ''}`}>
            {good ? (
              <>
                <Check size={14} /> موافق حرفاً بحرف
              </>
            ) : short ? (
              <>
                <Minus size={14} /> ينقص {Math.abs(b!.delta)} حرفاً
              </>
            ) : long ? (
              <>
                <Plus size={14} /> يزيد {b!.delta} حرفاً
              </>
            ) : (
              <>
                <AlertTriangle size={14} /> يخالف الترتيب
              </>
            )}
          </span>
        </div>

        <p className="text-sm leading-relaxed">{data.verdict}</p>

        {!!data.formula.unknown.length && (
          <p className="text-sm" style={{ color: 'var(--danger)' }}>
            لم أعرف من الوزن: {data.formula.unknown.join('، ')}
          </p>
        )}

        {b && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="يقتضيه الوزن" value={b.required} unit="حرفاً" />
            <Stat label="في نصّك" value={b.found} unit="حرفاً" />
            <Stat
              label="الفرق"
              value={b.delta === 0 ? 0 : Math.abs(b.delta)}
              unit={b.delta === 0 ? 'مطابق' : b.delta < 0 ? 'حرفاً ناقصاً' : 'حرفاً زائداً'}
              bad={b.delta !== 0}
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="table-clean">
            <thead>
              <tr>
                <th>التفعيلة كما كتبتَها</th>
                <th>الصورة</th>
                <th>الرمز</th>
                <th>حروفها</th>
              </tr>
            </thead>
            <tbody>
              {data.formula.feet.map((f, i) => (
                <tr key={i}>
                  <td className="verse text-base">{f.raw}</td>
                  <td className="verse text-base">
                    {f.ok ? f.options.map((o) => o.name).join(' أو ') : '—'}
                  </td>
                  <td dir="ltr" className="font-mono text-xs">
                    {f.ok ? f.options.map((o) => sym(o.pattern)).join(' / ') : '؟'}
                  </td>
                  <td className="text-xs muted">
                    {f.ok ? f.options.map((o) => o.pattern.length).join(' / ') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.assumedReading && (
          <p
            className="rounded-xl px-4 py-3 text-sm leading-relaxed"
            style={{ background: 'var(--surface-2)', borderInlineStart: '3px solid var(--gold)' }}
          >
            نصُّك غير مشكول، فحسم المحرّك حركاتِه بما يُقيم الوزن، وقرأه هكذا:{' '}
            <span className="verse">{data.assumedReading}</span> — فإن كنت لا تقرؤه بهذه القراءة
            فشكِّله ثم أعِد القياس.
          </p>
        )}
      </div>

      {data.sadr && <AnalysisView data={data} />}
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
  bad,
}: {
  label: string;
  value: number;
  unit: string;
  bad?: boolean;
}) {
  return (
    <div className="card-quiet">
      <p className="mb-1 text-xs faint">{label}</p>
      <p className="title text-3xl" style={{ color: bad ? 'var(--danger)' : 'var(--accent)' }}>
        {value.toLocaleString('ar-EG')}
      </p>
      <p className="text-xs muted">{unit}</p>
    </div>
  );
}
