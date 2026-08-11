import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AnalyzeClient } from './AnalyzeClient';

export const metadata: Metadata = {
  title: 'تحليل الأوزان والتقطيع العروضي',
  description:
    'أدخل بيتاً أو شطراً أو قصيدة، واعرف بحرها وتقطيعها وتفعيلاتها ومواضع الكسر فيها مع اقتراح التصحيح.',
};

export default function AnalyzePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="title text-3xl">تحليل الأوزان</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed muted">
          يكتب المحرّك بيتك كتابةً عروضية أولاً — يفكّ الشدّة، ويحوّل التنوين نوناً ساكنة، ويحذف
          همزة الوصل ولام التعريف المدغمة، ويشبع حركة آخر الشطر — ثم يرمز لكل حرف ويقابل السلسلة
          بأوزان البحور، ويشرح لك كل خطوة.
        </p>
      </header>
      <Suspense fallback={<div className="card">جارٍ التحميل…</div>}>
        <AnalyzeClient />
      </Suspense>
    </div>
  );
}
