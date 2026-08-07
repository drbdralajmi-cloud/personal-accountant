'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Loader2, Mail } from 'lucide-react';

export function SignInButtons({
  providers,
}: {
  providers: { google: boolean; apple: boolean; email: boolean };
}) {
  const [busy, setBusy] = useState('');
  const [email, setEmail] = useState('');

  const go = (id: string, options?: Record<string, unknown>) => {
    setBusy(id);
    signIn(id, { callbackUrl: '/', ...options }).finally(() => setBusy(''));
  };

  return (
    <div className="card space-y-3">
      {providers.google && (
        <button className="btn w-full py-3" onClick={() => go('google')} disabled={!!busy}>
          {busy === 'google' ? <Loader2 size={16} className="animate-spin" /> : null}
          المتابعة بحساب جوجل
        </button>
      )}
      {providers.apple && (
        <button className="btn w-full py-3" onClick={() => go('apple')} disabled={!!busy}>
          {busy === 'apple' ? <Loader2 size={16} className="animate-spin" /> : null}
          المتابعة بحساب آبل
        </button>
      )}
      {providers.email && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            go('email', { email });
          }}
          className="space-y-2 border-t pt-3"
        >
          <input
            type="email"
            required
            className="input"
            placeholder="بريدك الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn btn-primary w-full py-3" disabled={!!busy}>
            {busy === 'email' ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
            أرسل رابط الدخول
          </button>
        </form>
      )}
    </div>
  );
}
