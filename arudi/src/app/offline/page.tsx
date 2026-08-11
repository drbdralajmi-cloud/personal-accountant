import type { Metadata } from 'next';
import Link from 'next/link';
import { WifiOff } from 'lucide-react';

export const metadata: Metadata = {
  title: 'لا يوجد اتصال',
  description: 'الصفحات التي زرتها من قبل تبقى متاحة دون اتصال.',
};

export default function OfflinePage() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <span
        className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl"
        style={{ background: 'var(--gold-soft)', color: 'var(--gold)' }}
      >
        <WifiOff size={26} />
      </span>
      <h1 className="title text-3xl">أنت غير متّصل الآن</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed muted">
        الصفحات التي زرتها من قبل محفوظة على جهازك وتعمل دون اتصال، ومنها الدروس والبحور
        والقوالب. أمّا التحليل والتوليد فيحتاجان الاتصال بالخادم.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link href="/lessons" className="btn btn-primary">
          الدروس
        </Link>
        <Link href="/buhur" className="btn">
          البحور
        </Link>
        <Link href="/taf3ilat" className="btn">
          القوالب
        </Link>
      </div>
    </div>
  );
}
