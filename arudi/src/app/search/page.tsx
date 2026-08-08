import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchClient } from './SearchClient';
import { FEET_LIST } from '@/lib/arud/feet';
import { METERS } from '@/lib/arud/meters';
import { TEMPLATES } from '@/lib/arud/templates';
import { lexiconStats } from '@/lib/lexicon';

export const metadata: Metadata = {
  title: 'البحث الذكي',
  description:
    'ابحث في المعجم الموزون بالبحر أو التفعيلة أو الكلمة أو القافية أو عدد المقاطع أو نوع الوزن.',
};

export default function SearchPage() {
  const stats = lexiconStats();
  // القوالب كلها: الأصول الثماني وما تفرّع عنها، ليجد الباحث «فعلن» كما يجد «فاعلن»
  const feet = TEMPLATES.map((t) => {
    const root = FEET_LIST.find((f) => f.slug === t.slug);
    return {
      name: t.name,
      plain: t.plain,
      pattern: t.pattern,
      slug: t.slug,
      variants: (root?.zihafat ?? []).map((z) => ({ name: z.name, pattern: z.pattern })),
    };
  });
  const meters = METERS.map((m) => ({ name: m.name, slug: m.slug, formula: m.formula }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="title text-3xl">البحث الذكي</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed muted">
          {stats.total.toLocaleString('ar-EG')} كلمة موزونة، مفهرسةً بتقطيعها. ابحث بالتفعيلة أو
          نصّ الكلمة أو الرويّ أو عدد المقاطع، أو اجمع بينها.
        </p>
      </header>
      <Suspense fallback={<div className="card">جارٍ التحميل…</div>}>
        <SearchClient feet={feet} meters={meters} total={stats.total} />
      </Suspense>
    </div>
  );
}
