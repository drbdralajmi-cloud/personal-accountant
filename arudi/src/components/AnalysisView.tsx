'use client';

import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Info, Lightbulb } from 'lucide-react';
import type { ApiAnalysis, ApiFoot, ApiHalf } from '@/lib/types';
import { CopyButton, PrintButton, ShareButton, SpeakButton } from './actions';
import { Pop } from './Motion';

/** عرض نتيجة التحليل كاملةً: البحر، التقطيع، الأخطاء، الشرح، القافية. */
export function AnalysisView({ data }: { data: ApiAnalysis }) {
  const sound = data.ok;

  return (
    <Pop className="space-y-5">
      {/* الخلاصة */}
      <div
        className="card flex flex-wrap items-center gap-4"
        style={{
          borderColor: sound ? 'var(--ok)' : 'var(--danger)',
          background: sound ? 'var(--ok-soft)' : 'var(--danger-soft)',
        }}
      >
        <span style={{ color: sound ? 'var(--ok)' : 'var(--danger)' }}>
          {sound ? <CheckCircle2 size={34} /> : <AlertTriangle size={34} />}
        </span>
        <div className="min-w-[12rem] flex-1">
          <p className="title text-2xl">
            {sound ? `البيت موزون على بحر ${data.meter?.name}` : `الوزن مكسور — أقرب البحور: ${data.meter?.name ?? '—'}`}
          </p>
          <p className="mt-1 text-sm muted">
            {data.meter?.formula} · درجة الثقة {data.confidence}٪ · {data.shape}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 no-print">
          {data.meter && (
            <Link href={`/buhur/${data.meter.slug}`} className="btn px-3 py-2 text-xs">
              صفحة البحر
            </Link>
          )}
          <ShareButton
            title="نتيجة التحليل العروضي"
            text={`${data.input}\n${sound ? 'موزون على' : 'أقرب بحر'}: ${data.meter?.name ?? '—'}`}
          />
          <PrintButton />
        </div>
      </div>

      {/* التقطيع */}
      <div className="card space-y-6">
        {data.sadr && <HalfView half={data.sadr} label={data.ajz ? 'الصدر' : 'الشطر'} />}
        {data.ajz && (
          <>
            <hr />
            <HalfView half={data.ajz} label="العجز" />
          </>
        )}
      </div>

      {/* الكلمة التي انكسر عندها الوزن */}
      {!!data.culprits?.length && (
        <div className="card" style={{ borderColor: 'var(--danger)' }}>
          <h3 className="title mb-1 flex items-center gap-2 text-lg">
            <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
            أين انكسر الوزن؟
          </h3>
          <p className="mb-3 text-sm muted">
            لا يكفي أن يُقال «الشطر مكسور»؛ فهذه الكلمات بعينها هي مواضع الخلل، وهذا سببه.
          </p>
          <ul className="space-y-2">
            {data.culprits.map((c, i) => (
              <li key={i} className="card-quiet">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="verse text-xl" style={{ color: 'var(--danger)' }}>
                    {c.word}
                  </span>
                  <span className="chip !py-0.5 !text-[10px]">
                    {c.hemistich} · الكلمة {c.index}
                  </span>
                  <span className="chip !py-0.5 !text-[10px]">التفعيلة {c.foot}</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed muted">{c.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* مواضع الخلل */}
      {!!data.issues.length && (
        <div className="card">
          <h3 className="title mb-3 flex items-center gap-2 text-lg">
            <AlertTriangle size={18} style={{ color: 'var(--danger)' }} />
            مواضع الخلل ({data.issues.length})
          </h3>
          <ul className="space-y-2">
            {data.issues.map((it, i) => (
              <li key={i} className="card-quiet text-sm">
                <span className="chip chip-bad !py-0.5 !text-[10px]">{it.kind}</span>
                <span className="mr-2 font-semibold">{it.hemistich}</span>
                <span className="muted"> — {it.message}</span>
                {it.expected && (
                  <span dir="ltr" className="mr-2 font-mono text-xs faint">
                    ({it.got} ← {it.expected})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* اقتراحات التصحيح */}
      {!!data.fixes?.length && (
        <div className="card">
          <h3 className="title mb-1 flex items-center gap-2 text-lg">
            <Lightbulb size={18} style={{ color: 'var(--gold)' }} />
            اقتراح التصحيح
          </h3>
          <p className="mb-3 text-sm muted">
            كلماتٌ من المعجم تملأ موضع الخلل بالوزن الصحيح — استبدل بها أو اهتدِ بوزنها.
          </p>
          <div className="space-y-3">
            {data.fixes.map((f, i) => (
              <div key={i} className="card-quiet">
                <p className="text-sm">
                  <span className="chip chip-bad !py-0.5 !text-[10px]">
                    {f.hemistich} — التفعيلة {f.foot}
                  </span>
                  <span className="mr-2 muted">{f.hint}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {f.words.map((w) => (
                    <span key={w.word} className="chip verse !text-sm">
                      {w.word}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* الشرح */}
      <div className="card">
        <h3 className="title mb-3 flex items-center gap-2 text-lg">
          <Info size={18} style={{ color: 'var(--accent)' }} />
          لماذا هذه النتيجة؟
        </h3>
        <ol className="space-y-2 text-sm leading-relaxed">
          {data.explanation.map((line, i) => (
            <li key={i} className="flex gap-2.5">
              <span
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
              >
                {i + 1}
              </span>
              <span className="muted">{line}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* القافية */}
        {data.rhyme && (
          <div className="card">
            <h3 className="title mb-3 text-lg">القافية</h3>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <Row k="الرويّ" v={data.rhyme.rawi} />
              <Row k="نوعها" v={`${data.rhyme.type} — ${data.rhyme.kind}`} />
              <Row k="نصّها" v={data.rhyme.text} verse />
              {data.rhyme.ridf && <Row k="الردف" v={data.rhyme.ridf} />}
              {data.rhyme.wasl && <Row k="الوصل" v={data.rhyme.wasl} />}
              <Row k="التأسيس" v={data.rhyme.tasees ? 'مؤسَّسة' : 'غير مؤسَّسة'} />
            </dl>
            {!!data.rhymes?.length && (
              <>
                <p className="mt-4 mb-2 text-sm font-semibold">كلمات تصلح قافيةً على الرويّ نفسه</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.rhymes.map((w) => (
                    <span key={w.word} className="chip verse !text-sm">
                      {w.word}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* البحور المرشّحة */}
        <div className="card">
          <h3 className="title mb-3 text-lg">أوزانٌ محتملة أخرى</h3>
          {data.candidates.length > 1 ? (
            <ul className="space-y-2">
              {data.candidates.map((c) => (
                <li key={c.slug + c.meter} className="flex items-center gap-3 text-sm">
                  <Link href={`/buhur/${c.slug}`} className="link w-28 shrink-0">
                    {c.meter}
                  </Link>
                  <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${c.confidence}%`, background: 'var(--accent)' }}
                    />
                  </div>
                  <span className="w-10 shrink-0 text-left text-xs faint">{c.confidence}٪</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm muted">لا يشبه هذا الوزنَ بحرٌ آخر — النتيجة قاطعة.</p>
          )}

          {data.completion && (
            <div className="mt-5">
              <p className="mb-1.5 text-sm font-semibold">شطرٌ مقترح على البحر نفسه</p>
              <p className="verse card-quiet !py-3 text-base">{data.completion.text}</p>
              <p className="mt-1.5 text-xs faint">
                {data.completion.feet.join(' · ')} — تركيبٌ موزون آلياً للتدريب على الإيقاع، لا
                يُقصد به معنًى شعري.
              </p>
            </div>
          )}
        </div>
      </div>
    </Pop>
  );
}

function Row({ k, v, verse }: { k: string; v: string; verse?: boolean }) {
  return (
    <>
      <dt className="faint">{k}</dt>
      <dd className={verse ? 'verse text-base' : 'font-semibold'}>{v}</dd>
    </>
  );
}

function HalfView({ half, label }: { half: ApiHalf; label: string }) {
  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center gap-2">
        <span className={`chip ${half.ok ? 'chip-ok' : 'chip-bad'}`}>{label}</span>
        <span className="chip">{half.feet.length} تفعيلات</span>
        <span className="chip">{half.syllables.length} مقطعاً</span>
        <div className="no-print flex gap-0.5">
          <SpeakButton text={half.text} />
          <CopyButton text={half.prosodic} label="الكتابة العروضية" />
          <CopyButton text={half.symbols} label="التقطيع" />
        </div>
      </header>

      <p className="verse">{half.text}</p>

      <div className="flex flex-wrap gap-2">
        {half.feet.map((f, i) => (
          <FootBox key={i} foot={f} />
        ))}
      </div>

      <dl className="grid gap-1.5 text-sm sm:grid-cols-2">
        <div className="flex flex-wrap gap-2">
          <dt className="shrink-0 font-semibold faint">الكتابة العروضية</dt>
          <dd className="verse text-base">{half.prosodic}</dd>
        </div>
        <div className="flex flex-wrap gap-2">
          <dt className="shrink-0 font-semibold faint">الرموز</dt>
          <dd dir="ltr" className="font-mono tracking-widest">
            {half.symbols}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function FootBox({ foot }: { foot: ApiFoot }) {
  const bad = !foot.ok;
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
        {foot.pattern.replace(/1/g, '/').replace(/0/g, '°')}
      </div>
      <div className="text-sm font-bold" style={{ color: bad ? 'var(--danger)' : 'var(--accent)' }}>
        {foot.name}
      </div>
      <div className="mt-1 flex flex-wrap justify-center gap-1">
        <span
          className={`chip !px-2 !py-0.5 !text-[10px] ${
            foot.role !== 'حشو' ? 'chip-gold' : ''
          }`}
        >
          {foot.role}
        </span>
        {foot.change !== 'سالمة' && (
          <span className="chip !px-2 !py-0.5 !text-[10px]">{foot.change.split('—')[0].trim()}</span>
        )}
      </div>
    </div>
  );
}
