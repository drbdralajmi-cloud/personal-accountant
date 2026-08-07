'use client';

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    setReady(true);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('arudi-theme', next ? 'dark' : 'light');
    } catch {
      /* التخزين قد يكون معطّلاً */
    }
  };

  return (
    <button
      className="btn btn-ghost px-2.5"
      onClick={toggle}
      aria-label={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}
      title={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}
    >
      {ready && dark ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}
