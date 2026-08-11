/**
 * حراسة لوحة الإدارة.
 *
 * التحرير والحذف وقراءة بيانات المستخدمين تتطلّب جلسةً لمدير.
 * والمدير يُعرَف بأحد أمرين:
 *   - دوره في قاعدة البيانات = ADMIN
 *   - أو بريده مذكور في ADMIN_EMAILS (لتعيين أول مدير).
 *
 * وإن لم تُضبط جهة دخولٍ أصلاً فالكتابة ممنوعة على الجميع، لأن الموقع
 * حينئذٍ بلا هويّات، ولا يجوز أن يكون المحتوى مستباحاً لكل زائر.
 */

import { getServerSession } from 'next-auth';
import { authEnabled, authOptions } from './auth';
import { getPrisma } from './db';

export interface Denied {
  ok: false;
  status: 401 | 403;
  error: string;
}

export interface Allowed {
  ok: true;
  email: string;
}

export type Guard = Allowed | Denied;

/** قائمة بُرد المديرين المسموح لهم، من متغيّرات البيئة. */
function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin(): Promise<Guard> {
  if (!authEnabled()) {
    return {
      ok: false,
      status: 403,
      error:
        'التحرير معطّل: لم تُضبط جهة دخول على هذه النسخة، فلا سبيل إلى التحقّق من هويّة المدير. اضبط NextAuth وADMIN_EMAILS.',
    };
  }

  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();
  if (!email) {
    return { ok: false, status: 401, error: 'سجّل الدخول أولاً.' };
  }

  if (adminEmails().includes(email)) return { ok: true, email };

  const prisma = await getPrisma();
  if (prisma) {
    try {
      const user = await prisma.user.findUnique({ where: { email }, select: { role: true } });
      if (user?.role === 'ADMIN') return { ok: true, email };
    } catch {
      /* تعذّر الوصول إلى القاعدة — نمنع احتياطاً */
    }
  }

  return { ok: false, status: 403, error: 'هذا الإجراء مقصورٌ على المديرين.' };
}

/** هل المستخدم الحالي مدير؟ للاستعمال في الصفحات (لا يرمي). */
export async function isAdmin(): Promise<boolean> {
  const g = await requireAdmin();
  return g.ok;
}
