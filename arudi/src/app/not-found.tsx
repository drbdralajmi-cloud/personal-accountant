import Link from 'next/link';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <span
        className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
      >
        <Compass size={26} />
      </span>
      <h1 className="title text-3xl">لا توجد هذه الصفحة</h1>
      <p className="verse mx-auto mt-4 max-w-md text-lg leading-loose muted">
        وَمَا كُلُّ مَا يَتَمَنَّى المَرْءُ يُدْرِكُهُ
        <br />
        تَجْرِي الرِّيَاحُ بِمَا لَا تَشْتَهِي السُّفُنُ
      </p>
      <p className="mt-2 text-xs faint">— المتنبي، من البسيط</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn btn-primary">
          الصفحة الرئيسية
        </Link>
        <Link href="/analyze" className="btn">
          تحليل بيت
        </Link>
        <Link href="/buhur" className="btn">
          البحور
        </Link>
      </div>
    </div>
  );
}
