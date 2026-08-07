import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t no-print" style={{ background: 'var(--bg-soft)' }}>
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <h2 className="title text-lg">منصّة العَروض</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed muted">
            أداةٌ لتعلّم أوزان الشعر العربي وتحليلها. المحرّك يقرأ البيت كما يُنطق لا كما يُرسم،
            فيقطّعه ويسمّي بحره ويكشف مواضع الكسر فيه ويشرح سبب كل نتيجة.
          </p>
        </div>
        <nav className="text-sm">
          <h3 className="mb-2 font-bold">الأقسام</h3>
          <ul className="space-y-1.5 muted">
            <li>
              <Link className="hover:underline" href="/buhur">
                البحور الستة عشر
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/taf3ilat">
                القوالب والتفعيلات
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/analyze">
                تحليل الأوزان
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/assistant">
                مساعد النظم
              </Link>
            </li>
          </ul>
        </nav>
        <nav className="text-sm">
          <h3 className="mb-2 font-bold">التعلّم</h3>
          <ul className="space-y-1.5 muted">
            <li>
              <Link className="hover:underline" href="/lessons">
                الدروس
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/training">
                التدريب التفاعلي
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/search">
                البحث الذكي
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/admin">
                لوحة الإدارة
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t py-4 text-center text-xs faint">
        بُنيت على أصول الخليل بن أحمد الفراهيدي — تعمل دون اتصال بعد أول زيارة.
      </div>
    </footer>
  );
}
