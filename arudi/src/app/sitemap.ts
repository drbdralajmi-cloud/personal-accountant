import type { MetadataRoute } from 'next';
import { LESSONS } from '@/data/lessons';
import { FEET_LIST } from '@/lib/arud/feet';
import { METERS } from '@/lib/arud/meters';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ['', '/analyze', '/buhur', '/taf3ilat', '/assistant', '/training', '/lessons', '/search'];

  return [
    ...pages.map((p) => ({
      url: `${BASE}${p}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: p === '' ? 1 : 0.8,
    })),
    ...METERS.map((m) => ({
      url: `${BASE}/buhur/${m.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...FEET_LIST.map((f) => ({
      url: `${BASE}/taf3ilat/${f.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...LESSONS.map((l) => ({
      url: `${BASE}/lessons/${l.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
