'use client';

import Link from 'next/link';
import { LogIn, LogOut, User } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

/**
 * زرّ الحساب. لا يظهر إلا عند ضبط جهة دخول واحدة على الأقل،
 * لأن الموقع يعمل كاملاً بلا حساب.
 */
export function UserMenu({ enabled }: { enabled: boolean }) {
  if (!enabled) return null;
  return <SessionAware />;
}

function SessionAware() {
  const { data, status } = useSession();

  if (status === 'loading') {
    return <span className="btn btn-ghost px-2.5 opacity-50" aria-hidden />;
  }

  if (!data?.user) {
    return (
      <Link href="/signin" className="btn btn-ghost px-2.5" aria-label="تسجيل الدخول" title="تسجيل الدخول">
        <LogIn size={17} />
      </Link>
    );
  }

  return (
    <button
      onClick={() => signOut({ callbackUrl: '/' })}
      className="btn btn-ghost gap-1.5 px-2.5"
      title={`خروج (${data.user.email ?? data.user.name ?? ''})`}
    >
      <User size={16} />
      <LogOut size={14} />
    </button>
  );
}
