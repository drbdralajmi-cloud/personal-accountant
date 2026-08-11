'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { History, Star, Trash2 } from 'lucide-react';
import { CopyButton, SpeakButton } from '@/components/actions';
import {
  clearHistory,
  Favorite,
  getFavorites,
  getHistory,
  HistoryEntry,
  onStorageChange,
  removeFavorite,
} from '@/lib/storage';

const KIND_LABEL: Record<string, string> = {
  word: 'كلمة',
  verse: 'بيت',
  meter: 'بحر',
  foot: 'تفعيلة',
};

export default function FavoritesPage() {
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const load = () => {
      setFavs(getFavorites());
      setHistory(getHistory());
    };
    load();
    setMounted(true);
    return onStorageChange(load);
  }, []);

  if (!mounted) {
    return <p className="card">جارٍ قراءة بياناتك المحفوظة…</p>;
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="title text-3xl">المفضّلة والسجلّ</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed muted">
          كل ما تحفظه يبقى على جهازك وحده — لا يُرسل إلى خادم ولا يحتاج حساباً.
        </p>
      </header>

      <section>
        <h2 className="title mb-4 flex items-center gap-2 text-xl">
          <Star size={18} style={{ color: 'var(--gold)' }} />
          المحفوظات ({favs.length})
        </h2>
        {favs.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {favs.map((f) => (
              <div key={f.kind + f.id} className="card">
                <div className="flex items-start justify-between gap-2">
                  <span className="chip !py-0.5 !text-[10px]">{KIND_LABEL[f.kind] ?? f.kind}</span>
                  <button
                    className="btn btn-ghost px-2 py-1"
                    onClick={() => removeFavorite(f.kind, f.id)}
                    aria-label="حذف"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="verse mt-2 text-base leading-relaxed">{f.title}</p>
                {f.subtitle && <p className="mt-1 text-xs faint">{f.subtitle}</p>}
                <div className="mt-2 flex gap-0.5">
                  <SpeakButton text={f.title} />
                  <CopyButton text={f.title} label="" />
                  {f.kind === 'verse' && (
                    <Link
                      href={`/analyze?q=${encodeURIComponent(f.id)}`}
                      className="btn btn-ghost px-2 py-1 text-xs"
                    >
                      تحليل
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="card text-sm muted">
            لم تحفظ شيئاً بعد. اضغط النجمة بجانب أي كلمة أو بيت لحفظه هنا.
          </p>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="title flex items-center gap-2 text-xl">
            <History size={18} />
            سجلّ البحث ({history.length})
          </h2>
          {!!history.length && (
            <button className="btn text-xs" onClick={clearHistory}>
              <Trash2 size={14} />
              مسح السجلّ
            </button>
          )}
        </div>
        {history.length ? (
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.text + h.at} className="card flex flex-wrap items-center gap-3 !py-3">
                <span className={`chip !py-0.5 !text-[10px] ${h.ok ? 'chip-ok' : 'chip-bad'}`}>
                  {h.meter ?? 'غير محدّد'}
                </span>
                <span className="verse flex-1 text-sm">{h.text}</span>
                <Link href={`/analyze?q=${encodeURIComponent(h.text)}`} className="btn px-3 py-1.5 text-xs">
                  إعادة التحليل
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="card text-sm muted">لا يوجد سجلّ بعد.</p>
        )}
      </section>
    </div>
  );
}
