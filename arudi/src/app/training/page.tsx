import type { Metadata } from 'next';
import { TrainingClient } from './TrainingClient';
import { generateExercises } from '@/lib/exercises';
import { LEVELS } from '@/data/lessons';

export const metadata: Metadata = {
  title: 'التدريب التفاعلي على العروض',
  description:
    'تمارين على التقطيع واختيار التفعيلة وإكمال الشطر وتصحيح الوزن وترتيب المقاطع ومطابقة الكلمات، بثلاثة مستويات.',
};

export default function TrainingPage() {
  // نولّد على الخادم مجموعةً لكل مستوى، ثم تُجدَّد من الواجهة عند الطلب
  const initial = Object.fromEntries(
    LEVELS.map((l) => [l, generateExercises(l, 8, 1)]),
  ) as Record<string, ReturnType<typeof generateExercises>>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="title text-3xl">التدريب</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed muted">
          ستة أنواع من التمارين تتولّد من المدوّنة الشعرية والمعجم الموزون، فلا تتكرّر عليك. اختر
          مستواك وابدأ — ويُحفظ تقدّمك على جهازك.
        </p>
      </header>
      <TrainingClient initial={initial} />
    </div>
  );
}
