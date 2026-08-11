import type { Metadata } from 'next';
import Link from 'next/link';
import { SignInButtons } from './SignInButtons';
import { authEnabled, emailNeedsDatabase } from '@/lib/auth';

// تعتمد على متغيّرات البيئة لتحديد جهات الدخول المتاحة
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'تسجيل الدخول',
  description: 'سجّل الدخول لحفظ تقدّمك ومفضّلاتك ومزامنتها بين أجهزتك.',
};

export default function SignInPage() {
  const enabled = authEnabled();
  const providers = {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    apple: !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET),
    email: !!(process.env.EMAIL_SERVER && process.env.EMAIL_FROM && !emailNeedsDatabase),
  };

  return (
    <div className="mx-auto max-w-md space-y-6 py-10">
      <header className="text-center">
        <h1 className="title text-3xl">تسجيل الدخول</h1>
        <p className="mt-2 text-sm leading-relaxed muted">
          الدخول اختياري: كل أدوات المنصّة تعمل بدونه، ومفضّلاتك وتقدّمك محفوظة على جهازك.
          ويفيدك الحساب في مزامنتها بين أجهزتك.
        </p>
      </header>

      {emailNeedsDatabase && (
        <p
          className="card text-xs leading-relaxed"
          style={{ borderColor: 'var(--gold)', background: 'var(--gold-soft)' }}
        >
          ضُبط <code>EMAIL_SERVER</code> بلا قاعدة بيانات، والدخول بالبريد يحتاجها ليحفظ رموز
          التحقّق — فعُطِّل وحده كي لا يتعطّل الدخول كلّه. اضبط <code>DATABASE_URL</code> لتفعيله.
        </p>
      )}

      {enabled ? (
        <SignInButtons providers={providers} />
      ) : (
        <div className="card space-y-3 text-sm">
          <p className="font-semibold">جهات الدخول غير مضبوطة على هذه النسخة.</p>
          <p className="muted">
            لتفعيلها اضبط في ملف البيئة متغيّرات <code>NEXTAUTH_SECRET</code> و
            <code>NEXTAUTH_URL</code>، ثم مفاتيح الجهة التي تريدها:
          </p>
          <ul className="space-y-1 muted">
            <li>
              • جوجل: <code>GOOGLE_CLIENT_ID</code> و<code>GOOGLE_CLIENT_SECRET</code>
            </li>
            <li>
              • آبل: <code>APPLE_CLIENT_ID</code> و<code>APPLE_CLIENT_SECRET</code>
            </li>
            <li>
              • البريد: <code>EMAIL_SERVER</code> و<code>EMAIL_FROM</code>
            </li>
          </ul>
          <Link href="/" className="btn btn-primary mt-2 w-full">
            العودة إلى الرئيسية
          </Link>
        </div>
      )}
    </div>
  );
}
