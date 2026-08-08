import type { Metadata } from 'next';
import { TrainingClient } from './TrainingClient';
import { composeTasks, generateNabatiExercises } from '@/lib/nabati-exercises';
import { LEVELS } from '@/data/lessons';

export const metadata: Metadata = {
  title: 'التدريب على الشعر النبطي',
  description:
    'تمارين متدرّجة على طروق الشعر النبطي الخليجي: التعرّف على الطَّرق، والتقطيع، وإكمال الأشطر، وكشف الكسر، والنظم على وزنٍ محدّد يزنه المحرّك — بثلاثة مستويات.',
};

export default function TrainingPage() {
  // نولّد على الخادم مجموعةً لكل مستوى — نبطيةً لأنها الأصل — ثم تُجدَّد
  // من الواجهة عند الطلب أو عند تبديل الميزان
  const initial = Object.fromEntries(
    LEVELS.map((l) => [l, generateNabatiExercises(l, 8, 1)]),
  ) as Record<string, ReturnType<typeof generateNabatiExercises>>;
  const initialCompose = Object.fromEntries(
    LEVELS.map((l) => [l, composeTasks(l, 3, 1)]),
  ) as Record<string, ReturnType<typeof composeTasks>>;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="title text-3xl">التدريب</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed muted">
          تمارين متدرّجة على طروق الشعر النبطي: التعرّف على الطَّرق، والتقطيع، وعدّ الحروف،
          والمطابقة، وإكمال الأشطر، وكشف موضع الكسر، ثم النظم على طَرقٍ بعينه يزنه المحرّك.
          وكلها تتولّد من قاعدة الطروق ومن المحرّك نفسه فلا تتكرّر عليك. ويمكنك التبديل إلى
          بحور الخليل — ويُحفظ تقدّمك على جهازك.
        </p>
      </header>
      <TrainingClient initial={initial} initialCompose={initialCompose} />
    </div>
  );
}
