'use client';

import { useEffect, useMemo, useState } from 'react';
import { RefreshCw, Star } from 'lucide-react';
import { CopyButton, SpeakButton } from './actions';
import { addFavorite, isFavorite, removeFavorite } from '@/lib/storage';

export interface WordRow {
  word: string;
  spoken: string;
  segments: string[];
  syllableKinds: string[];
  form: string;
  source: string;
  morph?: string;
  root?: string;
}

/**
 * جدول الكلمات المطابقة لتفعيلة، مع النطق والنسخ والحفظ في المفضّلة،
 * وزرّ لتوليد مجموعة جديدة.
 */
export function WordTable({
  pattern,
  footName,
  initial,
  total,
}: {
  pattern: string;
  footName: string;
  initial: WordRow[];
  total: number;
}) {
  const [rows, setRows] = useState<WordRow[]>(initial);
  const [loading, setLoading] = useState(false);
  const [curatedOnly, setCuratedOnly] = useState(false);
  const [favs, setFavs] = useState<string[]>([]);

  useEffect(() => {
    setFavs(rows.filter((r) => isFavorite('word', r.word)).map((r) => r.word));
  }, [rows]);

  const load = async (fresh: boolean) => {
    setLoading(true);
    try {
      const seed = fresh ? Math.floor(Math.random() * 1e6) : 1;
      const res = await fetch(
        `/api/words?pattern=${encodeURIComponent(pattern)}&limit=50&seed=${seed}&curated=${curatedOnly}`,
      );
      const data = await res.json();
      setRows(data.words ?? []);
    } finally {
      setLoading(false);
    }
  };

  // إعادة التحميل عند تبديل مصدر الكلمات
  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curatedOnly]);

  const toggleFav = (w: WordRow) => {
    if (isFavorite('word', w.word)) {
      removeFavorite('word', w.word);
      setFavs((f) => f.filter((x) => x !== w.word));
    } else {
      addFavorite({ kind: 'word', id: w.word, title: w.spoken, subtitle: footName });
      setFavs((f) => [...f, w.word]);
    }
  };

  const allText = useMemo(
    () => rows.map((r) => `${r.spoken}\t${r.segments.join('/')}\t${footName}`).join('\n'),
    [rows, footName],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-primary" onClick={() => load(true)} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          توليد ٥٠ كلمة جديدة
        </button>
        <label className="chip cursor-pointer select-none">
          <input
            type="checkbox"
            checked={curatedOnly}
            onChange={(e) => setCuratedOnly(e.target.checked)}
            className="ml-1.5 accent-current"
          />
          الكلمات المعتمدة فقط
        </label>
        <CopyButton text={allText} label="نسخ الجدول" className="btn px-3 py-2 text-xs" />
        <span className="chip chip-accent">{total.toLocaleString('ar-EG')} كلمة متاحة</span>
      </div>

      <div className="overflow-x-auto rounded-xl border">
        <table className="table-clean">
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              <th>الكلمة</th>
              <th>التقطيع</th>
              <th className="hidden sm:table-cell">القالب</th>
              <th>المقاطع</th>
              <th className="hidden md:table-cell">الحالة</th>
              <th className="hidden lg:table-cell">المصدر</th>
              <th>أدوات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w) => (
              <tr key={w.word}>
                <td className="verse !py-2 text-base">{w.spoken}</td>
                <td dir="rtl" className="font-mono text-xs">
                  {w.segments.join(' / ')}
                </td>
                <td className="hidden text-xs sm:table-cell">{footName}</td>
                <td>{w.segments.length}</td>
                <td className="hidden md:table-cell">
                  <span className="chip !py-0.5 !text-[10px]">{w.form}</span>
                </td>
                <td className="hidden lg:table-cell">
                  <span
                    className={`chip !py-0.5 !text-[10px] ${w.source === 'معتمدة' ? 'chip-ok' : ''}`}
                    title={
                      w.source === 'معتمدة'
                        ? 'كلمة مثبتة في المعاجم'
                        : `صيغة قياسية مولَّدة${w.morph ? ` على وزن ${w.morph}` : ''}`
                    }
                  >
                    {w.source}
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-0.5">
                    <SpeakButton text={w.spoken} />
                    <CopyButton text={w.spoken} label="" />
                    <button
                      onClick={() => toggleFav(w)}
                      className="btn btn-ghost px-2 py-1"
                      aria-label="حفظ في المفضّلة"
                      style={favs.includes(w.word) ? { color: 'var(--gold)' } : undefined}
                    >
                      <Star size={14} fill={favs.includes(w.word) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={7} className="py-8 text-center muted">
                  لا توجد كلمات مطابقة بهذه الشروط.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs faint">
        «معتمدة» كلماتٌ مثبتة في المعاجم. و«قياسية» صيغٌ مولَّدة من جذور صحيحة على الأوزان الصرفية
        المشهورة، تشكيلها قطعيّ وتقطيعها صحيح، وقد لا يكون بعضها مستعمَلاً في كلام العرب.
      </p>
    </div>
  );
}
