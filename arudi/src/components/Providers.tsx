'use client';

import { SessionProvider } from 'next-auth/react';
import { useEffect } from 'react';

export function Providers({
  children,
  auth,
}: {
  children: React.ReactNode;
  /** هل ضُبطت جهةُ دخولٍ واحدة على الأقل؟ */
  auth: boolean;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* العمل دون اتصال ميزة إضافية، وفشلها لا يعطّل الموقع */
    });
  }, []);

  // بلا جهات دخول لا معنى لاستطلاع الجلسة، وهو يُخرج أخطاءً في وحدة التحكّم
  if (!auth) return <>{children}</>;
  return <SessionProvider>{children}</SessionProvider>;
}
