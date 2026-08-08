'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { PatternStrip } from '@/components/Scansion';

export interface TariqRow {
  slug: string;
  name: string;
  aliases: { name: string; where: string }[];
  formula: string;
  pattern: string;
  symbol: string;
  letters: number;
  syllableCount: number;
  difficulty: string;
  regions: string[];
  description: string;
  tone: string;
  halves: 1 | 2;
}

const bare = (s: string) =>
  s
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .trim();

const DIFFICULTIES = ['مبتدئ', 'متوسط', 'متقدّم'];

/**
 * تصفّح الطروق والبحث فيها.
 *
 * يبحث بالاسم، وبالأسماء المتداولة في كل بلد، وبجزءٍ من التفعيلة،
 * وبعدد المقاطع، وبعدد الحروف، وبالبلد، وبمستوى الصعوبة.
 */
export function TuruqBrowser({ rows, regions }: { rows: TariqRow[]; regions: string[] }) {
  const [q, setQ] = useState('');
  const [syllables, setSyllables] = useState('');
  const [region, setRegion] = useState('');
  const [difficulty, setDifficulty] = useState('');

  const syllableOptions = useMemo(
    () => [...new Set(rows.map((r) => r.syllableCount))].sort((a, b) => a - b),
    [rows],
  );

  const filtered = useMemo(() => {
    const needle = bare(q);
    const syl = Number(syllables) || 0;
    return rows.filter((r) => {
      if (syl && r.syllableCount !== syl) return false;
      if (region && !r.regions.includes(region)) return false;
      if (difficulty && r.difficulty !== difficulty) return false;
      if (!needle) return true;
      // رقمٌ في البحث يُفهم عدداً للحروف أو المقاطع
      if (/^\d+$/.test(needle)) {
        const n = Number(needle);
        return r.letters === n || r.syllableCount === n;
      }
      const hay = bare(
        [
          r.name,
          ...r.aliases.map((a) => `${a.name} ${a.where}`),
          r.formula,
          r.description,
          r.tone,
          ...r.regions,
        ].join(' | '),
      );
      return hay.includes(needle);
    });
  }, [rows, q, syllables, region, difficulty]);

  const dirty = q || syllables || region || difficulty;

  return (
    <section className="space-y-4">
      <div className="card space-y-3">
        <label htmlFor="tq" className="flex items-center gap-2 text-sm font-semibold">
          <Search size={15} />
          ابحث في الطروق
        </label>
        <input
          id="tq"
          className="input"
          placeholder="اسم الطَّرق، أو جزء من تفعيلة (فاعلاتن)، أو عدد المقاطع، أو اسم بلد…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <select
            className="input !w-auto !py-1.5 text-xs"
            value={syllables}
            onChange={(e) => setSyllables(e.target.value)}
            aria-label="عدد المقاطع"
          >
            <option value="">كل عدد المقاطع</option>
            {syllableOptions.map((n) => (
              <option key={n} value={n}>
                {n} مقاطع
              </option>
            ))}
          </select>
          <select
            className="input !w-auto !py-1.5 text-xs"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            aria-label="البلد"
          >
            <option value="">كل الدول</option>
            {regions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <select
            className="input !w-auto !py-1.5 text-xs"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            aria-label="الصعوبة"
          >
            <option value="">كل المستويات</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          {dirty && (
            <button
              type="button"
              className="btn btn-ghost px-2 py-1 text-xs"
              onClick={() => {
                setQ('');
                setSyllables('');
                setRegion('');
                setDifficulty('');
              }}
            >
              <X size={14} />
              مسح
            </button>
          )}
          <span className="chip !py-0.5 !text-[10px]">{filtered.length} طَرقاً</span>
        </div>
      </div>

      {!filtered.length && (
        <p className="card text-sm muted">
          لا طَرق بهذه الصفة. جرّب البحث بجزءٍ من التفعيلة، أو أمْلِ وزنك في{' '}
          <Link href="/analyze" className="underline">
            صفحة التحليل
          </Link>
          .
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((t) => (
          <Link
            key={t.slug}
            href={`/nabati/${t.slug}`}
            className="card space-y-3 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="title text-xl">{t.name}</h3>
              <span className="chip chip-gold !py-0.5 !text-[10px]">{t.difficulty}</span>
            </div>
            <p className="verse text-lg">{t.formula}</p>
            <PatternStrip pattern={t.pattern} />
            <p className="text-xs leading-relaxed muted line-clamp-2">{t.description}</p>
            <div className="flex flex-wrap gap-1.5">
              <span className="chip chip-accent !py-0.5 !text-[10px]">{t.letters} حرفاً</span>
              <span className="chip !py-0.5 !text-[10px]">{t.syllableCount} مقطعاً</span>
              <span className="chip !py-0.5 !text-[10px]">
                {t.halves === 1 ? 'شطر واحد' : 'شطران'}
              </span>
            </div>
            <p className="text-[10px] faint">{t.regions.join(' · ')}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
