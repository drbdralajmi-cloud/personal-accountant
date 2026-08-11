'use client';

import { useEffect, useState } from 'react';
import { Flame, RefreshCw, Trophy } from 'lucide-react';
import { ComposeTaskCard } from '@/components/ComposeTask';
import { ExerciseRunner } from '@/components/ExerciseRunner';
import { ProgressChart } from '@/components/ProgressChart';
import type { Exercise } from '@/lib/exercises';
import type { ComposeTask } from '@/lib/nabati-exercises';
import { LEVELS, type Level } from '@/data/lessons';
import { getProgress, onStorageChange, Progress, resetProgress } from '@/lib/storage';

const EMPTY: Progress = { points: 0, levels: {}, daily: {}, streak: 0 };

export function TrainingClient({
  initial,
  initialCompose,
}: {
  initial: Record<string, Exercise[]>;
  initialCompose: Record<string, ComposeTask[]>;
}) {
  const [level, setLevel] = useState<Level>('مبتدئ');
  const [system, setSystem] = useState<'نبطي' | 'خليلي'>('نبطي');
  const [sets, setSets] = useState(initial);
  const [compose, setCompose] = useState(initialCompose);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<Progress>(EMPTY);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setProgress(getProgress());
    return onStorageChange(() => setProgress(getProgress()));
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/exercises?level=${encodeURIComponent(level)}&count=8&system=${encodeURIComponent(
          system,
        )}&seed=${Math.floor(Math.random() * 1e6)}`,
      );
      const json = await res.json();
      if (json.exercises) setSets((s) => ({ ...s, [level]: json.exercises }));
      setCompose((c) => ({ ...c, [level]: json.compose ?? [] }));
    } finally {
      setLoading(false);
    }
  };

  const stats = progress.levels[level] ?? { right: 0, wrong: 0 };
  const attempts = stats.right + stats.wrong;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <div className="card space-y-2">
          <p className="text-sm font-semibold">الميزان</p>
          <div className="flex flex-wrap gap-1.5">
            {(['نبطي', 'خليلي'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSystem(s)}
                className={`chip ${s === system ? 'chip-accent' : 'hover:opacity-80'}`}
              >
                {s === 'نبطي' ? 'الطروق النبطية' : 'بحور الخليل'}
              </button>
            ))}
          </div>
          <p className="text-xs faint">
            {system === 'نبطي'
              ? 'تمارين على طروق النبط الخليجية، وتُقرأ نصوصها بالنطق الخليجي.'
              : 'تمارين على بحور الشعر الفصيح بعروض الخليل.'}
            {' '}اضغط «تمارين جديدة» بعد التبديل.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLevel(l)}
              className="btn"
              style={
                level === l
                  ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }
                  : undefined
              }
            >
              {l}
            </button>
          ))}
          <button className="btn mr-auto" onClick={refresh} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            تمارين جديدة
          </button>
        </div>

        <ExerciseRunner key={level + (sets[level]?.[0]?.id ?? '')} exercises={sets[level] ?? []} />

        {system === 'نبطي' && !!compose[level]?.length && (
          <section className="space-y-3">
            <div>
              <h2 className="title text-xl">اكتب أنت</h2>
              <p className="mt-1 text-sm leading-relaxed muted">
                آخر مراتب التدريب: أن تنظم شطراً على طَرقٍ بعينه، فيزنه المحرّك لا نموذجُ إجابةٍ
                محفوظ. وكل شطرٍ استقام وزنُه فهو صواب.
              </p>
            </div>
            {compose[level].map((t) => (
              <ComposeTaskCard key={t.id} task={t} />
            ))}
          </section>
        )}
      </div>

      <aside className="space-y-4">
        <div className="card">
          <h2 className="title mb-3 flex items-center gap-2 text-lg">
            <Trophy size={17} style={{ color: 'var(--gold)' }} />
            تقدّمك
          </h2>
          {mounted ? (
            <>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="card-quiet">
                  <p className="title text-2xl" style={{ color: 'var(--accent)' }}>
                    {progress.points}
                  </p>
                  <p className="text-xs faint">نقطة</p>
                </div>
                <div className="card-quiet">
                  <p
                    className="title flex items-center justify-center gap-1 text-2xl"
                    style={{ color: 'var(--gold)' }}
                  >
                    <Flame size={18} />
                    {progress.streak}
                  </p>
                  <p className="text-xs faint">يوماً متتالياً</p>
                </div>
              </div>

              <p className="mt-4 mb-1 text-xs faint">مستوى {level}</p>
              <div className="h-2 overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: attempts ? `${(stats.right / attempts) * 100}%` : '0%',
                    background: 'var(--ok)',
                  }}
                />
              </div>
              <p className="mt-1 text-xs muted">
                {stats.right} صحيحة من {attempts} محاولة
              </p>

              <div className="mt-4">
                <ProgressChart daily={progress.daily} />
              </div>

              <button
                className="btn mt-4 w-full text-xs"
                onClick={() => {
                  resetProgress();
                  setProgress(getProgress());
                }}
              >
                تصفير التقدّم
              </button>
            </>
          ) : (
            <p className="text-sm muted">جارٍ قراءة تقدّمك…</p>
          )}
        </div>

        <div className="card text-sm">
          <h3 className="title mb-2 text-base">أنواع التمارين</h3>
          <ul className="space-y-1.5 muted">
            <li>• تقطيع مقاطع من أبيات حقيقية</li>
            <li>• اختيار التفعيلة الموافقة للرموز</li>
            <li>• إكمال الشطر بالكلمة الموزونة</li>
            <li>• تحديد موضع الكسر وتصحيحه</li>
            <li>• إعادة ترتيب مقاطع التفعيلة</li>
            <li>• مطابقة الكلمات بالتفعيلات</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
