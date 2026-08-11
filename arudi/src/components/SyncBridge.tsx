'use client';

import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { CloudOff, RefreshCw, CheckCircle2 } from 'lucide-react';
import {
  Favorite,
  getFavorites,
  getHistory,
  getProgress,
  HistoryEntry,
  onStorageChange,
  Progress,
  replaceAll,
} from '@/lib/storage';

/**
 * جسر المزامنة: عند تسجيل الدخول يرفع ما في الجهاز إلى الحساب، ثم يكتب
 * الحالة المدموجة في الجهاز. وبلا حساب يبقى كل شيء محلّياً كما هو.
 */
export function SyncBridge() {
  const { status } = useSession();
  const [state, setState] = useState<'idle' | 'syncing' | 'done' | 'error'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  // مزامنة أولى عند الدخول، ثم عند كل تغيّر محلّي بعد مهلة
  useEffect(() => {
    if (status !== 'authenticated') return;
    void sync();
    const off = onStorageChange(() => {
      dirty.current = true;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (dirty.current) void sync();
      }, 4000);
    });
    return () => {
      off();
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function sync() {
    dirty.current = false;
    setState('syncing');
    try {
      const res = await fetch('/api/me', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          favorites: getFavorites(),
          history: getHistory(),
          progress: getProgress(),
        }),
      });
      if (!res.ok) {
        setState('error');
        return;
      }
      const merged = (await res.json()) as {
        favorites: Favorite[];
        history: HistoryEntry[];
        progress: Progress;
      };
      replaceAll(merged);
      setState('done');
      setTimeout(() => setState('idle'), 2500);
    } catch {
      setState('error');
    }
  }

  if (status !== 'authenticated' || state === 'idle') return null;

  const look = {
    syncing: { icon: RefreshCw, text: 'جارٍ المزامنة…', color: 'var(--text-faint)', spin: true },
    done: { icon: CheckCircle2, text: 'تمّت المزامنة', color: 'var(--ok)', spin: false },
    error: { icon: CloudOff, text: 'تعذّرت المزامنة — بياناتك محفوظة على جهازك', color: 'var(--danger)', spin: false },
  }[state];
  const Icon = look.icon;

  return (
    <div
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border px-3 py-2 text-xs shadow-lg no-print"
      style={{ background: 'var(--surface)', color: look.color }}
      role="status"
      aria-live="polite"
    >
      <Icon size={14} className={look.spin ? 'animate-spin' : ''} />
      {look.text}
    </div>
  );
}
