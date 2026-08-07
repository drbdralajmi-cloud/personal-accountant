import type { Metadata, Viewport } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Providers } from '@/components/Providers';
import { authEnabled } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'العَروض — منصّة تعلّم أوزان الشعر العربي',
    template: '%s · منصّة العَروض',
  },
  description:
    'منصّة عربية لتعلّم علم العروض: البحور الستة عشر، التفعيلات، تحليل الأبيات وتقطيعها، كشف الكسر، معجم موزون بأكثر من ١٢ ألف كلمة، وتدريبات تفاعلية.',
  keywords: [
    'العروض',
    'بحور الشعر',
    'التفعيلات',
    'التقطيع العروضي',
    'أوزان الشعر',
    'القافية',
    'الخليل بن أحمد',
    'تعلم الشعر',
  ],
  applicationName: 'منصّة العَروض',
  manifest: '/manifest.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'ar_AR',
    title: 'العَروض — منصّة تعلّم أوزان الشعر العربي',
    description:
      'حلّل بيتك، اعرف بحره وتقطيعه ومواضع الكسر فيه، وتدرّب على النظم خطوةً خطوة.',
    siteName: 'منصّة العَروض',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/icon-192.png',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f4ed' },
    { media: '(prefers-color-scheme: dark)', color: '#14161c' },
  ],
  width: 'device-width',
  initialScale: 1,
};

/** يضبط السمة قبل الرسم الأول تفادياً لوميض الشاشة. */
const themeScript = `
(function () {
  try {
    var t = localStorage.getItem('arudi-theme');
    var dark = t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen">
        <Providers auth={authEnabled()}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:right-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
          >
            تخطّي إلى المحتوى
          </a>
          <SiteHeader />
          <main id="main" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
            {children}
          </main>
          <SiteFooter />
        </Providers>
      </body>
    </html>
  );
}
