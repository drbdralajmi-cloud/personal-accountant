import type { MetadataRoute } from 'next';
import { LESSONS } from '@/data/lessons';
import { METERS } from '@/lib/arud/meters';
import { TURUQ } from '@/lib/arud/nabati';
import { TEMPLATES } from '@/lib/arud/templates';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:4600';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const pages = ['', '/analyze', '/buhur', '/taf3ilat', '/nabati', '/assistant', '/training', '/lessons', '/search'];

  return [
    ...pages.map((p) => ({
      url: `${BASE}${p}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: p === '' ? 1 : 0.8,
    })),
    ...TURUQ.map((t) => ({
      url: `${BASE}/nabati/${t.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    })),
    ...METERS.map((m) => ({
      url: `${BASE}/buhur/${m.slug}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...TEMPLATES.map((t) => ({
      url: `${BASE}/taf3ilat/${t.slug}`,
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
