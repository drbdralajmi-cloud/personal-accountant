import type { AnalyzedFoot, AnalyzedHemistich } from '@/lib/arud/analyze';
import { CopyButton } from './actions';

/**
 * عرض التقطيع العروضي: كل تفعيلة في صندوق، وتحتها حروفها ورموزها.
 * المقاطع الصحيحة بالأخضر والمواضع المكسورة بالأحمر.
 */
export function Scansion({
  half,
  label,
}: {
  half: AnalyzedHemistich;
  label: string;
}) {
  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center gap-2">
        <span className={`chip ${half.ok ? 'chip-ok' : 'chip-bad'}`}>{label}</span>
        <span className="chip">{half.feet.length} تفعيلات</span>
        <span className="chip">{half.syllables.length} مقطعاً</span>
        <CopyButton text={half.prosodic} label="نسخ الكتابة العروضية" />
        <CopyButton text={half.symbols} label="نسخ التقطيع" />
      </header>

      <p className="verse">{half.text}</p>

      <div className="flex flex-wrap gap-2" dir="rtl">
        {half.feet.map((foot, i) => (
          <FootBox key={i} foot={foot} />
        ))}
      </div>

      <dl className="grid gap-1.5 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="shrink-0 font-semibold faint">الكتابة العروضية</dt>
          <dd className="verse text-base">{half.prosodic}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="shrink-0 font-semibold faint">الرموز</dt>
          <dd dir="ltr" className="font-mono tracking-widest">
            {half.symbols}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function FootBox({ foot }: { foot: AnalyzedFoot }) {
  const bad = !foot.ok;
  const roleChip =
    foot.role === 'عروض' ? 'chip-gold' : foot.role === 'ضرب' ? 'chip-gold' : '';

  return (
    <div
      className="min-w-[7.5rem] flex-1 rounded-xl border p-2.5 text-center"
      style={{
        background: bad ? 'var(--danger-soft)' : 'var(--surface-2)',
        borderColor: bad ? 'var(--danger)' : 'var(--border)',
      }}
    >
      <div className="verse text-base leading-snug">{foot.text || '—'}</div>
      <div dir="ltr" className="my-1 font-mono text-xs tracking-widest faint">
        {foot.pattern
          .split('')
          .map((c) => (c === '1' ? '/' : '°'))
          .join('')}
      </div>
      <div
        className="text-sm font-bold"
        style={{ color: bad ? 'var(--danger)' : 'var(--accent)' }}
      >
        {foot.name}
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-1">
        <span className={`chip ${roleChip} !px-2 !py-0.5 !text-[10px]`}>{foot.role}</span>
        {foot.change !== 'سالمة' && (
          <span className="chip !px-2 !py-0.5 !text-[10px]">{foot.change.split('—')[0].trim()}</span>
        )}
      </div>
    </div>
  );
}

/** شريط مبسّط للمقاطع، يُستعمل في بطاقات القوالب. */
export function PatternStrip({ pattern }: { pattern: string }) {
  return (
    <div dir="ltr" className="flex flex-wrap gap-1">
      {pattern.split('').map((c, i) => (
        <span
          key={i}
          className="grid h-6 w-6 place-items-center rounded-md font-mono text-xs"
          style={
            c === '1'
              ? { background: 'var(--accent-soft)', color: 'var(--accent)' }
              : { background: 'var(--surface-2)', color: 'var(--text-faint)' }
          }
          title={c === '1' ? 'حرف متحرك' : 'حرف ساكن'}
        >
          {c === '1' ? '/' : '°'}
        </span>
      ))}
    </div>
  );
}
