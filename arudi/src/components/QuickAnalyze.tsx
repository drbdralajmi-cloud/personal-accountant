'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

const SAMPLES = [
  'قفا نبك من ذكرى حبيب ومنزل … بسقط اللوى بين الدخول فحومل',
  'الخيل والليل والبيداء تعرفني … والسيف والرمح والقرطاس والقلم',
  'إذا الشعب يوما أراد الحياة … فلا بد أن يستجيب القدر',
];

/** مربّع البحث السريع في الصفحة الرئيسية. */
export function QuickAnalyze() {
  const router = useRouter();
  const [text, setText] = useState('');

  const go = (value: string) => {
    const q = value.trim();
    if (!q) return;
    router.push(`/analyze?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="space-y-3">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(text);
        }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <input
          className="input text-right"
          placeholder="اكتب بيتاً أو شطراً أو كلمة…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="نصّ للتحليل"
        />
        <button className="btn btn-primary shrink-0 px-6 py-3" type="submit">
          <Search size={16} />
          حلّل
        </button>
      </form>

      <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs">
        <span className="faint">جرّب:</span>
        {SAMPLES.map((s) => (
          <button key={s} onClick={() => go(s)} className="chip hover:opacity-80">
            {s.split('…')[0].slice(0, 26)}…
          </button>
        ))}
      </div>
    </div>
  );
}
