'use client';

import { Check, Copy, Share2, Volume2 } from 'lucide-react';
import { useCallback, useState } from 'react';

/** نسخ أي نصّ بضغطة واحدة. */
export function CopyButton({
  text,
  label = 'نسخ',
  className = 'btn btn-ghost px-2 py-1 text-xs',
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [done, setDone] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // متصفّحات قديمة أو سياق غير آمن
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      el.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1400);
  }, [text]);

  return (
    <button onClick={copy} className={className} title={label} aria-label={label}>
      {done ? <Check size={14} /> : <Copy size={14} />}
      {label && <span className="hidden sm:inline">{done ? 'نُسخ' : label}</span>}
    </button>
  );
}

/** نطق النصّ بالعربية عبر محرّك النطق المدمج في المتصفّح. */
export function SpeakButton({
  text,
  className = 'btn btn-ghost px-2 py-1 text-xs',
}: {
  text: string;
  className?: string;
}) {
  const [busy, setBusy] = useState(false);

  const speak = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ar-SA';
    u.rate = 0.75;
    u.onend = () => setBusy(false);
    u.onerror = () => setBusy(false);
    setBusy(true);
    window.speechSynthesis.speak(u);
  }, [text]);

  return (
    <button
      onClick={speak}
      className={className}
      title="استمع للنطق"
      aria-label="استمع للنطق"
      style={busy ? { color: 'var(--accent)' } : undefined}
    >
      <Volume2 size={14} />
    </button>
  );
}

/** مشاركة النتيجة عبر واجهة المشاركة، أو نسخ الرابط عند تعذّرها. */
export function ShareButton({ title, text }: { title: string; text: string }) {
  const [done, setDone] = useState(false);
  const share = useCallback(async () => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        /* ألغى المستخدم المشاركة */
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {
      /* لا شيء */
    }
  }, [title, text]);

  return (
    <button onClick={share} className="btn px-3 py-2 text-xs">
      <Share2 size={14} />
      {done ? 'نُسخ الرابط' : 'مشاركة'}
    </button>
  );
}

/** تصدير الصفحة أو النتيجة إلى PDF عبر طباعة المتصفّح. */
export function PrintButton({ label = 'تصدير PDF' }: { label?: string }) {
  return (
    <button onClick={() => window.print()} className="btn px-3 py-2 text-xs no-print">
      {label}
    </button>
  );
}
