'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Loader2, Search } from 'lucide-react';
import { CopyButton, SpeakButton } from '@/components/actions';

interface FootInfo {
  name: string;
  plain: string;
  pattern: string;
  slug: string;
  variants: { name: string; pattern: string }[];
}

interface Row {
  word: string;
  spoken: string;
  segments: string[];
  form: string;
  source: string;
  morph?: string;
  root?: string;
}

export function SearchClient({
  feet,
  meters,
  total,
}: {
  feet: FootInfo[];
  meters: { name: string; slug: string; formula: string }[];
  total: number;
}) {
  const [pattern, setPattern] = useState('');
  const [text, setText] = useState('');
  const [rhyme, setRhyme] = useState('');
  const [syllables, setSyllables] = useState('');
  const [curatedOnly, setCuratedOnly] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);

  const search = useCallback(async () => {
    setLoading(true);
    setTouched(true);
    try {
      const q = new URLSearchParams({ limit: '80', curated: String(curatedOnly) });
      if (pattern) q.set('pattern', pattern);
      if (text.trim()) q.set('text', text.trim());
      if (rhyme.trim()) q.set('rhyme', rhyme.trim());
      if (syllables) q.set('syllables', syllables);
      const res = await fetch(`/api/words?${q}`);
      const json = await res.json();
      setRows(json.words ?? []);
      setCount(json.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [pattern, text, rhyme, syllables, curatedOnly]);

  // بحث فوري عند تغيّر المرشّحات
  useEffect(() => {
    if (!pattern && !text.trim() && !rhyme.trim() && !syllables) return;
    const t = setTimeout(search, 300);
    return () => clearTimeout(t);
  }, [pattern, text, rhyme, syllables, curatedOnly, search]);

  const allVariants = feet.flatMap((f) =>
    f.variants.map((v) => ({ ...v, foot: f.name })),
  );

  return (
    <div className="space-y-6">
      <div className="card grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold faint">التفعيلة / الوزن</span>
          <select className="input py-2.5" value={pattern} onChange={(e) => setPattern(e.target.value)}>
            <option value="">كل الأوزان</option>
            {feet.map((f) => (
              <option key={f.pattern} value={f.pattern}>
                {f.name}
              </option>
            ))}
            <optgroup label="الصور المزاحفة">
              {allVariants.map((v, i) => (
                <option key={i} value={v.pattern}>
                  {v.name} ({v.foot})
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold faint">نصّ الكلمة</span>
          <input
            className="input py-2.5"
            placeholder="جزء من الكلمة"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold faint">القافية (آخر الحروف)</span>
          <input
            className="input py-2.5"
            placeholder="مثل: ال، ين، مي"
            value={rhyme}
            onChange={(e) => setRhyme(e.target.value)}
            maxLength={4}
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold faint">عدد المقاطع</span>
          <select
            className="input py-2.5"
            value={syllables}
            onChange={(e) => setSyllables(e.target.value)}
          >
            <option value="">أيّ عدد</option>
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n} مقاطع
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-4">
          <button className="btn btn-primary" onClick={search} disabled={loading}>
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
            ابحث
          </button>
          <label className="chip cursor-pointer select-none">
            <input
              type="checkbox"
              checked={curatedOnly}
              onChange={(e) => setCuratedOnly(e.target.checked)}
              className="ml-1.5"
            />
            المعتمدة فقط
          </label>
          <button
            className="btn text-xs"
            onClick={() => {
              setPattern('');
              setText('');
              setRhyme('');
              setSyllables('');
              setRows([]);
              setTouched(false);
            }}
          >
            تصفير
          </button>
          <span className="mr-auto text-xs faint">
            {touched ? `${count.toLocaleString('ar-EG')} نتيجة` : `${total.toLocaleString('ar-EG')} كلمة في المعجم`}
          </span>
        </div>
      </div>

      {touched && (
        <div className="card overflow-x-auto">
          <table className="table-clean">
            <thead>
              <tr>
                <th>الكلمة</th>
                <th>التقطيع</th>
                <th>المقاطع</th>
                <th className="hidden sm:table-cell">الحالة</th>
                <th className="hidden md:table-cell">المصدر</th>
                <th className="hidden lg:table-cell">الوزن الصرفي</th>
                <th>أدوات</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w.word}>
                  <td className="verse text-base">{w.spoken}</td>
                  <td className="font-mono text-xs">{w.segments.join(' / ')}</td>
                  <td>{w.segments.length}</td>
                  <td className="hidden sm:table-cell">
                    <span className="chip !py-0.5 !text-[10px]">{w.form}</span>
                  </td>
                  <td className="hidden md:table-cell">
                    <span className={`chip !py-0.5 !text-[10px] ${w.source === 'معتمدة' ? 'chip-ok' : ''}`}>
                      {w.source}
                    </span>
                  </td>
                  <td className="hidden text-xs muted lg:table-cell">{w.morph ?? '—'}</td>
                  <td>
                    <div className="flex gap-0.5">
                      <SpeakButton text={w.spoken} />
                      <CopyButton text={w.spoken} label="" />
                    </div>
                  </td>
                </tr>
              ))}
              {!rows.length && !loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center muted">
                    لا نتائج بهذه الشروط. جرّب توسيعها.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <section className="card">
        <h2 className="title mb-3 text-lg">البحث بالبحر</h2>
        <div className="flex flex-wrap gap-2">
          {meters.map((m) => (
            <Link key={m.slug} href={`/buhur/${m.slug}`} className="chip hover:opacity-80" title={m.formula}>
              {m.name}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
