import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authEnabled, authOptions } from '@/lib/auth';
import { getPrisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * مزامنة بيانات المستخدم (المفضّلة والتقدّم وسجلّ البحث) بين أجهزته.
 *
 * الدمج يختار **الأكبر** في العدّادات لا الجمع، حتى تكون المزامنة قابلةً
 * للتكرار: تكرار الطلب نفسه لا يضاعف النقاط.
 */

interface Payload {
  favorites?: { kind: string; id: string; title: string; subtitle?: string; at?: number }[];
  history?: { text: string; meter?: string; ok?: boolean; at: number }[];
  progress?: {
    points?: number;
    levels?: Record<string, { right: number; wrong: number }>;
    daily?: Record<string, number>;
    streak?: number;
  };
}

const MAX_FAVORITES = 400;
const MAX_HISTORY = 60;

async function currentUser() {
  if (!authEnabled()) return null;
  const prisma = await getPrisma();
  if (!prisma) return null;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) return null;
  // أول دخولٍ للمستخدم قد يسبق إنشاء صفّه عند استعمال جلسات JWT
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name: session.user?.name ?? null },
  });
  return { prisma, user };
}

/** قراءة بيانات المستخدم من الخادم. */
export async function GET() {
  const ctx = await currentUser();
  if (!ctx) return NextResponse.json({ error: 'غير مسجَّل الدخول.' }, { status: 401 });
  return NextResponse.json(await snapshot(ctx.prisma, ctx.user.id));
}

/** رفع بيانات الجهاز ودمجها، ثم إعادة الحالة المدموجة. */
export async function POST(req: NextRequest) {
  const ctx = await currentUser();
  if (!ctx) return NextResponse.json({ error: 'غير مسجَّل الدخول.' }, { status: 401 });
  const { prisma, user } = ctx;

  let body: Payload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'صيغة الطلب غير صحيحة.' }, { status: 400 });
  }

  for (const f of (body.favorites ?? []).slice(0, MAX_FAVORITES)) {
    if (!f?.kind || !f?.id || !f?.title) continue;
    await prisma.favorite.upsert({
      where: { userId_kind_refId: { userId: user.id, kind: f.kind, refId: f.id } },
      update: { title: f.title, subtitle: f.subtitle ?? null },
      create: {
        userId: user.id,
        kind: f.kind,
        refId: f.id,
        title: f.title,
        subtitle: f.subtitle ?? null,
        at: f.at ? new Date(f.at) : new Date(),
      },
    });
  }

  for (const h of (body.history ?? []).slice(0, MAX_HISTORY)) {
    if (!h?.text) continue;
    const exists = await prisma.searchLog.findFirst({
      where: { userId: user.id, text: h.text },
      select: { id: true },
    });
    if (exists) continue;
    await prisma.searchLog.create({
      data: {
        userId: user.id,
        text: h.text.slice(0, 500),
        meter: h.meter ?? null,
        ok: !!h.ok,
        at: h.at ? new Date(h.at) : new Date(),
      },
    });
  }

  const p = body.progress;
  if (p) {
    for (const [level, v] of Object.entries(p.levels ?? {})) {
      const right = Math.max(0, Number(v?.right) || 0);
      const wrong = Math.max(0, Number(v?.wrong) || 0);
      const prev = await prisma.progress.findUnique({
        where: { userId_level: { userId: user.id, level } },
      });
      await prisma.progress.upsert({
        where: { userId_level: { userId: user.id, level } },
        update: { right: Math.max(prev?.right ?? 0, right), wrong: Math.max(prev?.wrong ?? 0, wrong) },
        create: { userId: user.id, level, right, wrong },
      });
    }
    for (const [day, points] of Object.entries(p.daily ?? {})) {
      const n = Math.max(0, Number(points) || 0);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue;
      const prev = await prisma.dailyPoints.findUnique({
        where: { userId_day: { userId: user.id, day } },
      });
      await prisma.dailyPoints.upsert({
        where: { userId_day: { userId: user.id, day } },
        update: { points: Math.max(prev?.points ?? 0, n) },
        create: { userId: user.id, day, points: n },
      });
    }
  }

  return NextResponse.json(await snapshot(prisma, user.id));
}

/** حذف كل بيانات المستخدم من الخادم. */
export async function DELETE() {
  const ctx = await currentUser();
  if (!ctx) return NextResponse.json({ error: 'غير مسجَّل الدخول.' }, { status: 401 });
  const { prisma, user } = ctx;
  await prisma.$transaction([
    prisma.favorite.deleteMany({ where: { userId: user.id } }),
    prisma.searchLog.deleteMany({ where: { userId: user.id } }),
    prisma.progress.deleteMany({ where: { userId: user.id } }),
    prisma.dailyPoints.deleteMany({ where: { userId: user.id } }),
  ]);
  return NextResponse.json({ ok: true });
}

type Prisma = NonNullable<Awaited<ReturnType<typeof getPrisma>>>;

async function snapshot(prisma: Prisma, userId: string) {
  const [favorites, history, levels, daily] = await Promise.all([
    prisma.favorite.findMany({ where: { userId }, orderBy: { at: 'desc' }, take: MAX_FAVORITES }),
    prisma.searchLog.findMany({ where: { userId }, orderBy: { at: 'desc' }, take: MAX_HISTORY }),
    prisma.progress.findMany({ where: { userId } }),
    prisma.dailyPoints.findMany({ where: { userId }, orderBy: { day: 'desc' }, take: 30 }),
  ]);

  const dailyMap = Object.fromEntries(daily.map((d) => [d.day, d.points]));
  return {
    favorites: favorites.map((f) => ({
      kind: f.kind,
      id: f.refId,
      title: f.title,
      subtitle: f.subtitle ?? undefined,
      at: f.at.getTime(),
    })),
    history: history.map((h) => ({
      text: h.text,
      meter: h.meter ?? undefined,
      ok: h.ok,
      at: h.at.getTime(),
    })),
    progress: {
      // مجموع النقاط يُشتقّ من نقاط الأيام فلا يُخزَّن مرّتين
      points: Object.values(dailyMap).reduce((a, b) => a + b, 0),
      levels: Object.fromEntries(levels.map((l) => [l.level, { right: l.right, wrong: l.wrong }])),
      daily: dailyMap,
      streak: streakOf(Object.keys(dailyMap)),
    },
  };
}

/** أطول سلسلة أيام متتالية منتهية باليوم أو أمس. */
function streakOf(days: string[]): number {
  const set = new Set(days);
  let n = 0;
  const d = new Date();
  if (!set.has(iso(d))) d.setDate(d.getDate() - 1);
  while (set.has(iso(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
