/**
 * طبقة الإدارة: قراءة المحتوى وتحريره.
 *
 * المحتوى مصدره ملفات المشروع، فإن ضُبطت قاعدة بيانات صار قابلاً للتحرير
 * وحُفظت التعديلات فيها. وبلا قاعدة بيانات تعمل الشاشة في وضع القراءة فقط.
 */

import { CORPUS } from '@/data/corpus';
import { LESSONS } from '@/data/lessons';
import { METERS } from '@/lib/arud/meters';
import { FEET_LIST } from '@/lib/arud/feet';
import { lexicon } from '@/lib/lexicon';
import { getPrisma, isDbConfigured } from '@/lib/db';

export type Entity = 'words' | 'verses' | 'lessons' | 'meters' | 'users';

export const ENTITIES: { key: Entity; label: string; editable: boolean }[] = [
  { key: 'words', label: 'الكلمات', editable: true },
  { key: 'verses', label: 'الأبيات', editable: true },
  { key: 'lessons', label: 'الدروس', editable: true },
  { key: 'meters', label: 'البحور', editable: true },
  { key: 'users', label: 'المستخدمون', editable: false },
];

export interface Row {
  id: string;
  /** العمود الأول — العنوان. */
  title: string;
  /** أعمدة إضافية للعرض. */
  cells: Record<string, string>;
  /** الحقول القابلة للتحرير. */
  fields: { name: string; label: string; value: string; type?: 'text' | 'long' }[];
  published: boolean;
}

export interface Page {
  entity: Entity;
  rows: Row[];
  total: number;
  columns: { key: string; label: string }[];
  editable: boolean;
  source: 'قاعدة البيانات' | 'ملفات المشروع';
  /** سبب تعطيل التحرير، تضيفه طبقة الواجهة البرمجية. */
  reason?: 'db' | 'auth' | null;
  isAdmin?: boolean;
}

const PAGE = 25;

/** قراءة صفحة من كيان، من قاعدة البيانات إن وُجدت وإلا من ملفات المشروع. */
export async function listEntity(
  entity: Entity,
  opts: { q?: string; skip?: number } = {},
): Promise<Page> {
  const prisma = await getPrisma();
  const q = (opts.q ?? '').trim();
  const skip = opts.skip ?? 0;
  const source = prisma ? 'قاعدة البيانات' : 'ملفات المشروع';
  const editable = !!prisma && ENTITIES.find((e) => e.key === entity)!.editable;

  if (entity === 'users') {
    const columns = [
      { key: 'email', label: 'البريد' },
      { key: 'role', label: 'الدور' },
      { key: 'createdAt', label: 'التسجيل' },
    ];
    if (!prisma) return { entity, rows: [], total: 0, columns, editable: false, source };
    const where = q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }] } : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({ where, take: PAGE, skip, orderBy: { createdAt: 'desc' } }),
      prisma.user.count({ where }),
    ]);
    return {
      entity,
      total,
      columns,
      editable: false,
      source,
      rows: users.map((u) => ({
        id: u.id,
        title: u.name ?? u.email ?? u.id,
        cells: {
          email: u.email ?? '—',
          role: u.role,
          createdAt: u.createdAt.toISOString().slice(0, 10),
        },
        fields: [],
        published: true,
      })),
    };
  }

  if (entity === 'words') {
    const columns = [
      { key: 'segments', label: 'التقطيع' },
      { key: 'waqf', label: 'الوقف' },
      { key: 'source', label: 'المصدر' },
      { key: 'morph', label: 'الوزن الصرفي' },
    ];
    if (prisma) {
      const where = q ? { plain: { contains: q } } : {};
      const [rows, total] = await Promise.all([
        prisma.word.findMany({ where, take: PAGE, skip, orderBy: { word: 'asc' } }),
        prisma.word.count({ where }),
      ]);
      return {
        entity,
        total,
        columns,
        editable,
        source,
        rows: rows.map((w) => ({
          id: w.id,
          title: w.word,
          cells: {
            segments: w.segments.join(' / '),
            waqf: w.waqf,
            source: w.source,
            morph: w.morph ?? '—',
          },
          fields: [{ name: 'word', label: 'الكلمة', value: w.word }],
          published: w.approved,
        })),
      };
    }
    const all = lexicon().filter((w) => !q || w.plain.includes(q));
    return {
      entity,
      total: all.length,
      columns,
      editable: false,
      source,
      rows: all.slice(skip, skip + PAGE).map((w) => ({
        id: w.word,
        title: w.word,
        cells: {
          segments: w.segments.join(' / '),
          waqf: w.waqf,
          source: w.source,
          morph: w.morph ?? '—',
        },
        fields: [{ name: 'word', label: 'الكلمة', value: w.word }],
        published: true,
      })),
    };
  }

  if (entity === 'verses') {
    const columns = [
      { key: 'ajz', label: 'العجز' },
      { key: 'poet', label: 'القائل' },
      { key: 'meter', label: 'البحر' },
    ];
    if (prisma) {
      const where = q ? { OR: [{ sadr: { contains: q } }, { poet: { contains: q } }] } : {};
      const [rows, total] = await Promise.all([
        prisma.verse.findMany({ where, take: PAGE, skip, include: { meter: true } }),
        prisma.verse.count({ where }),
      ]);
      return {
        entity,
        total,
        columns,
        editable,
        source,
        rows: rows.map((v) => ({
          id: v.id,
          title: v.sadr,
          cells: { ajz: v.ajz, poet: v.poet, meter: v.meter?.name ?? '—' },
          fields: [
            { name: 'sadr', label: 'الصدر', value: v.sadr },
            { name: 'ajz', label: 'العجز', value: v.ajz },
            { name: 'poet', label: 'القائل', value: v.poet },
          ],
          published: true,
        })),
      };
    }
    const all = CORPUS.filter((v) => !q || v.sadr.includes(q) || v.poet.includes(q));
    return {
      entity,
      total: all.length,
      columns,
      editable: false,
      source,
      rows: all.slice(skip, skip + PAGE).map((v, i) => ({
        id: String(i),
        title: v.sadr,
        cells: { ajz: v.ajz, poet: v.poet, meter: v.meter },
        fields: [
          { name: 'sadr', label: 'الصدر', value: v.sadr },
          { name: 'ajz', label: 'العجز', value: v.ajz },
          { name: 'poet', label: 'القائل', value: v.poet },
        ],
        published: true,
      })),
    };
  }

  if (entity === 'lessons') {
    const columns = [
      { key: 'level', label: 'المستوى' },
      { key: 'order', label: 'الترتيب' },
      { key: 'minutes', label: 'الدقائق' },
    ];
    if (prisma) {
      const where = q ? { title: { contains: q } } : {};
      const [rows, total] = await Promise.all([
        prisma.lesson.findMany({ where, take: PAGE, skip, orderBy: { order: 'asc' } }),
        prisma.lesson.count({ where }),
      ]);
      return {
        entity,
        total,
        columns,
        editable,
        source,
        rows: rows.map((l) => ({
          id: l.id,
          title: l.title,
          cells: { level: l.level, order: String(l.order), minutes: String(l.minutes) },
          fields: [
            { name: 'title', label: 'العنوان', value: l.title },
            { name: 'summary', label: 'الملخّص', value: l.summary, type: 'long' as const },
          ],
          published: l.published,
        })),
      };
    }
    const all = LESSONS.filter((l) => !q || l.title.includes(q));
    return {
      entity,
      total: all.length,
      columns,
      editable: false,
      source,
      rows: all.slice(skip, skip + PAGE).map((l) => ({
        id: l.slug,
        title: l.title,
        cells: { level: l.level, order: String(l.order), minutes: String(l.minutes) },
        fields: [
          { name: 'title', label: 'العنوان', value: l.title },
          { name: 'summary', label: 'الملخّص', value: l.summary, type: 'long' as const },
        ],
        published: true,
      })),
    };
  }

  // البحور
  const columns = [
    { key: 'formula', label: 'التفعيلات' },
    { key: 'family', label: 'العائلة' },
    { key: 'form', label: 'الصورة' },
  ];
  if (prisma) {
    const where = q ? { name: { contains: q } } : {};
    const [rows, total] = await Promise.all([
      prisma.meter.findMany({ where, take: PAGE, skip, orderBy: { frequency: 'desc' } }),
      prisma.meter.count({ where }),
    ]);
    return {
      entity,
      total,
      columns,
      editable,
      source,
      rows: rows.map((m) => ({
        id: m.id,
        title: m.name,
        cells: { formula: m.formula, family: m.family, form: m.form },
        fields: [
          { name: 'description', label: 'الوصف', value: m.description, type: 'long' as const },
          { name: 'tone', label: 'الجرس', value: m.tone, type: 'long' as const },
        ],
        published: m.published,
      })),
    };
  }
  const all = METERS.filter((m) => !q || m.name.includes(q));
  return {
    entity,
    total: all.length,
    columns,
    editable: false,
    source,
    rows: all.slice(skip, skip + PAGE).map((m) => ({
      id: m.id,
      title: m.name,
      cells: { formula: m.formula, family: m.family, form: m.form },
      fields: [
        { name: 'description', label: 'الوصف', value: m.description, type: 'long' as const },
        { name: 'tone', label: 'الجرس', value: m.tone, type: 'long' as const },
      ],
      published: true,
    })),
  };
}

/** تحديث سجلّ. يتطلّب قاعدة بيانات. */
export async function updateEntity(
  entity: Entity,
  id: string,
  data: Record<string, string | boolean>,
): Promise<{ ok: boolean; error?: string }> {
  const prisma = await getPrisma();
  if (!prisma) {
    return { ok: false, error: 'التحرير يتطلّب قاعدة بيانات — اضبط DATABASE_URL.' };
  }
  const meta = ENTITIES.find((e) => e.key === entity);
  if (!meta?.editable) return { ok: false, error: 'هذا الكيان غير قابل للتحرير.' };

  try {
    switch (entity) {
      case 'words':
        await prisma.word.update({
          where: { id },
          data: pick(data, ['word'], { approved: 'published' }),
        });
        break;
      case 'verses':
        await prisma.verse.update({ where: { id }, data: pick(data, ['sadr', 'ajz', 'poet']) });
        break;
      case 'lessons':
        await prisma.lesson.update({
          where: { id },
          data: pick(data, ['title', 'summary'], { published: 'published' }),
        });
        break;
      case 'meters':
        await prisma.meter.update({
          where: { id },
          data: pick(data, ['description', 'tone'], { published: 'published' }),
        });
        break;
      default:
        return { ok: false, error: 'كيان غير معروف.' };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'تعذّر الحفظ.' };
  }
}

/** حذف سجلّ. يتطلّب قاعدة بيانات. */
export async function deleteEntity(entity: Entity, id: string) {
  const prisma = await getPrisma();
  if (!prisma) return { ok: false, error: 'الحذف يتطلّب قاعدة بيانات.' };
  try {
    if (entity === 'words') await prisma.word.delete({ where: { id } });
    else if (entity === 'verses') await prisma.verse.delete({ where: { id } });
    else if (entity === 'lessons') await prisma.lesson.delete({ where: { id } });
    else return { ok: false, error: 'الحذف غير متاح لهذا الكيان.' };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'تعذّر الحذف.' };
  }
}

/** انتقاء الحقول المسموح تحريرها فقط — لا تُمرَّر مدخلات المستخدم كما هي. */
function pick(
  data: Record<string, string | boolean>,
  allowed: string[],
  flags: Record<string, string> = {},
) {
  const out: Record<string, string | boolean> = {};
  for (const k of allowed) {
    if (typeof data[k] === 'string') out[k] = data[k];
  }
  for (const [field, key] of Object.entries(flags)) {
    if (typeof data[key] === 'boolean') out[field] = data[key];
  }
  return out;
}

/** أرقامٌ عامّة للوحة الإدارة. */
export async function adminStats() {
  const prisma = await getPrisma();
  const base = {
    meters: METERS.length,
    feet: FEET_LIST.length,
    words: lexicon().length,
    verses: CORPUS.length,
    lessons: LESSONS.length,
    users: 0,
    dbConfigured: isDbConfigured(),
    live: false,
  };
  if (!prisma) return base;
  try {
    const [meters, feet, words, verses, lessons, users] = await Promise.all([
      prisma.meter.count(),
      prisma.foot.count(),
      prisma.word.count(),
      prisma.verse.count(),
      prisma.lesson.count(),
      prisma.user.count(),
    ]);
    return { meters, feet, words, verses, lessons, users, dbConfigured: true, live: true };
  } catch {
    return base;
  }
}
