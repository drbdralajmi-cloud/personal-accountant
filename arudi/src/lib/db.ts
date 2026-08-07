/**
 * طبقة قاعدة البيانات — اختيارية.
 *
 * المنصّة تعمل كاملةً بلا قاعدة بيانات: المحتوى مُعرَّف في ملفات المشروع،
 * والمفضّلة والتقدّم يُحفظان في متصفّح المستخدم. وإذا ضُبط DATABASE_URL
 * أمكن حفظ الحسابات والتقدّم على الخادم.
 */

import type { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const isDbConfigured = () => !!process.env.DATABASE_URL;

/** عميل Prisma عند توفّر قاعدة بيانات، وإلا null. */
export async function getPrisma(): Promise<PrismaClient | null> {
  if (!isDbConfigured()) return null;
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  try {
    const { PrismaClient: Client } = await import('@prisma/client');
    const client = new Client();
    if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = client;
    return client;
  } catch {
    // العميل لم يُولَّد بعد (prisma generate)
    return null;
  }
}

export interface DbStatus {
  configured: boolean;
  provider: string;
  users: number | null;
  providers: { google: boolean; apple: boolean; email: boolean };
}

/** حالة قاعدة البيانات ومزوّدي الدخول — تُعرض في لوحة الإدارة. */
export async function dbStatus(): Promise<DbStatus> {
  const providers = {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    apple: !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET),
    email: !!process.env.EMAIL_SERVER,
  };
  const url = process.env.DATABASE_URL ?? '';
  const provider = url.startsWith('postgres') ? 'PostgreSQL' : url ? 'أخرى' : '—';

  let users: number | null = null;
  try {
    const prisma = await getPrisma();
    if (prisma) users = await prisma.user.count();
  } catch {
    users = null;
  }

  return { configured: isDbConfigured(), provider, users, providers };
}
