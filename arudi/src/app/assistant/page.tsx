import type { Metadata } from 'next';
import { AssistantClient } from './AssistantClient';

export const metadata: Metadata = {
  title: 'مساعد كتابة الشعر',
  description:
    'محرّر ذكيّ يحلّل بيتك أثناء الكتابة: يحدّد البحر، ويكشف الكسر، ويقترح كلمات بديلة موزونة وقوافيَ مناسبة وشطراً مكمّلاً.',
};

export default function AssistantPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="title text-3xl">مساعد كتابة الشعر</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed muted">
          اكتب بيتك في المحرّر، فيُحلَّل أثناء الكتابة. سترى البحر والتقطيع فوراً، ومواضع الكسر إن
          وُجدت، وكلماتٍ بديلة تملأ الموضع بالوزن الصحيح، وقوافيَ توافق رويّك، وشطراً مكمّلاً على
          البحر نفسه.
        </p>
      </header>
      <AssistantClient />
    </div>
  );
}
