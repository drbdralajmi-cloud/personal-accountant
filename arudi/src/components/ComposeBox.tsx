'use client';

import { useState } from 'react';
import { Loader2, Wand2 } from 'lucide-react';
import { CopyButton, SpeakButton } from './actions';

interface Composed {
  text: string;
  feet: string[];
  note: string;
  error?: string;
}

/** يطلب من الخادم شطراً موزوناً على بحرٍ معيّن. */
export function ComposeBox({ meterSlug, meterName }: { meterSlug: string; meterName: string }) {
  const [line, setLine] = useState<Composed | null>(null);
  const [loading, setLoading] = useState(false);
  const [rhyme, setRhyme] = useState('');

  const compose = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        meter: meterSlug,
        seed: String(Math.floor(Math.random() * 1e6)),
      });
      if (rhyme.trim()) q.set('rhyme', rhyme.trim());
      const res = await fetch(`/api/compose?${q}`);
      setLine(await res.json());
    } catch {
      setLine({ text: '', feet: [], note: '', error: 'تعذّر الاتصال بالخادم.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={compose} disabled={loading}>
          {loading ? <Loader2 size={15} className="animate-spin" /> : <Wand2 size={15} />}
          ألّف شطراً على {meterName}
        </button>
        <input
          className="input w-32 py-2 text-sm"
          placeholder="الرويّ (اختياري)"
          value={rhyme}
          onChange={(e) => setRhyme(e.target.value)}
          maxLength={2}
          aria-label="حرف الرويّ"
        />
      </div>

      {line?.error && (
        <p className="text-sm" style={{ color: 'var(--danger)' }}>
          {line.error}
        </p>
      )}

      {line?.text && (
        <div className="card-quiet">
          <div className="flex flex-wrap items-center gap-2">
            <p className="verse flex-1 text-lg">{line.text}</p>
            <SpeakButton text={line.text} />
            <CopyButton text={line.text} label="" />
          </div>
          <p className="mt-2 text-xs faint">{line.feet.join(' · ')}</p>
          <p className="mt-1 text-xs faint">{line.note}</p>
        </div>
      )}
    </div>
  );
}
