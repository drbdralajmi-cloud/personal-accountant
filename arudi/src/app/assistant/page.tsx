import type { Metadata } from 'next';
import { AssistantClient } from './AssistantClient';

export const metadata: Metadata = {
  title: 'مساعد نظم الشعر النبطي',
  description:
    'محرّر يحلّل بيتك النبطي أثناء الكتابة: يحدّد الطَّرق والقالب، ويقطّعه بالنطق الخليجي، ويكشف الكسر ويشير إلى الكلمة التي سبّبته ويشرح السبب، ويقترح بدائل موزونة وقوافيَ وشطراً مكمّلاً.',
};

export default function AssistantPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="title text-3xl">مساعد نظم الشعر النبطي</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed muted">
          اكتب بيتك في المحرّر، فيُحلَّل أثناء الكتابة. سترى الطَّرق والقالب والتقطيع فوراً —
          مقروءاً بالنطق الخليجي لا الفصيح — وإن انكسر الوزن أُشير إلى الكلمة التي انكسر عندها
          وشُرح سببها، وعُرضت كلماتٌ بديلة تملأ الموضع بالوزن الصحيح، وقوافٍ توافق رويّك، وشطرٌ
          مكمّل على الطَّرق نفسه. والحكم كلُّه من محرّكٍ عروضيّ يحسب الحروف، لا من تخمين.
        </p>
      </header>
      <AssistantClient />
    </div>
  );
}
