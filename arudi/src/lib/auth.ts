/**
 * إعداد NextAuth — اختياري.
 * تُفعَّل كل جهة دخول عند توفّر متغيّرات بيئتها فقط، فيعمل الموقع بلا حسابات
 * إذا لم تُضبط أيّ منها.
 */

import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';
import type { Adapter } from 'next-auth/adapters';
import type { NextAuthOptions } from 'next-auth';
import AppleProvider from 'next-auth/providers/apple';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';

/**
 * مُهيِّئ قاعدة البيانات لـNextAuth.
 * قد يفشل إنشاء العميل إن لم يُشغَّل `prisma generate`، فنتحمّل ذلك ونعمل بلا مُهيِّئ.
 */
function buildAdapter(): Adapter | undefined {
  if (!process.env.DATABASE_URL) return undefined;
  const g = globalThis as { __authPrisma?: PrismaClient };
  try {
    g.__authPrisma ??= new PrismaClient();
    return PrismaAdapter(g.__authPrisma);
  } catch {
    return undefined;
  }
}

const adapter = buildAdapter();

const providers: NextAuthOptions['providers'] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET) {
  providers.push(
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID,
      clientSecret: process.env.APPLE_CLIENT_SECRET,
    }),
  );
}

/**
 * الدخول بالبريد يحتاج مُهيِّئ قاعدة بيانات ليحفظ رموز التحقّق.
 * وبدونه يرفض NextAuth كل الطلبات — حتى طلبات الجهات الأخرى — فلا نُسجّله
 * إلا إذا توفّر المُهيِّئ.
 */
export const emailNeedsDatabase = !!(
  process.env.EMAIL_SERVER &&
  process.env.EMAIL_FROM &&
  !adapter
);

if (process.env.EMAIL_SERVER && process.env.EMAIL_FROM && adapter) {
  providers.push(
    EmailProvider({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  );
}

export const authOptions: NextAuthOptions = {
  adapter,
  providers,
  pages: { signIn: '/signin' },
  session: { strategy: 'jwt' },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as { id?: string }).id = token.sub;
      }
      return session;
    },
  },
};

export const authEnabled = () => providers.length > 0;
