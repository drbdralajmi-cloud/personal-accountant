/**
 * بذر قاعدة البيانات من ملفات المحتوى.
 * يُشغَّل بـ: npm run db:seed  (بعد ضبط DATABASE_URL و prisma db push)
 */

import { PrismaClient } from '@prisma/client';

// يُشغَّل خارج Next، فلا تُحمَّل متغيّرات البيئة تلقائياً
try {
  process.loadEnvFile?.('.env');
} catch {
  /* لا ملف .env — نعتمد على متغيّرات البيئة المضبوطة مسبقاً */
}

import { CORPUS } from '../src/data/corpus';
import { LESSONS } from '../src/data/lessons';
import { FEET_LIST } from '../src/lib/arud/feet';
import { METERS } from '../src/lib/arud/meters';
import { lexicon } from '../src/lib/lexicon';

const prisma = new PrismaClient();

async function main() {
  console.log('بذر البحور…');
  for (const m of METERS) {
    await prisma.meter.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id,
        slug: m.slug,
        name: m.name,
        family: m.family,
        form: m.form,
        key: m.key,
        formula: m.formula,
        description: m.description,
        tone: m.tone,
        frequency: m.frequency,
        examples: { create: [{ text: m.example.verse, note: m.example.poet }] },
      },
    });
  }

  console.log('بذر التفعيلات…');
  for (const f of FEET_LIST) {
    await prisma.foot.upsert({
      where: { id: f.id },
      update: {},
      create: {
        id: f.id,
        slug: f.slug,
        name: f.name,
        plain: f.plain,
        pattern: f.pattern,
        description: f.description,
        pronunciation: f.pronunciation,
      },
    });
  }

  console.log('بذر المدوّنة…');
  for (const v of CORPUS) {
    const meter = METERS.find((m) => m.name === v.meter);
    await prisma.verse.create({
      data: { sadr: v.sadr, ajz: v.ajz, poet: v.poet, theme: v.theme, meterId: meter?.id },
    });
  }

  console.log('بذر الدروس…');
  for (const l of LESSONS) {
    await prisma.lesson.upsert({
      where: { slug: l.slug },
      update: {},
      create: {
        slug: l.slug,
        title: l.title,
        level: l.level,
        order: l.order,
        summary: l.summary,
        minutes: l.minutes,
        body: l.sections as unknown as object,
        quiz: l.quiz as unknown as object,
      },
    });
  }

  console.log('بذر المعجم…');
  const words = lexicon();
  const chunk = 1000;
  for (let i = 0; i < words.length; i += chunk) {
    await prisma.word.createMany({
      data: words.slice(i, i + chunk).map((w) => ({
        word: w.word,
        plain: w.plain,
        waqf: w.waqf,
        wasl: w.wasl,
        tanween: w.tanween,
        segments: w.segments,
        source: w.source,
        morph: w.morph,
        root: w.root,
      })),
      skipDuplicates: true,
    });
    process.stdout.write(`\r  ${Math.min(i + chunk, words.length)} / ${words.length}`);
  }
  console.log('\nتمّ البذر.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
