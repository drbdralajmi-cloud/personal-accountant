import type { Metadata } from 'next';
import Link from 'next/link';
import { Database, FileText, Shapes, Users, Waves } from 'lucide-react';
import { AdminTools } from './AdminTools';
import { CORPUS } from '@/data/corpus';
import { LESSONS } from '@/data/lessons';
import { MORPH_PATTERNS } from '@/data/morphology';
import { SOUND_ROOTS } from '@/data/roots';
import { FEET_LIST } from '@/lib/arud/feet';
import { METERS, METER_FAMILIES } from '@/lib/arud/meters';
import { generateExercises } from '@/lib/exercises';
import { lexiconStats, wordsForPattern } from '@/lib/lexicon';
import { dbStatus } from '@/lib/db';

export const metadata: Metadata = {
  title: 'لوحة الإدارة',
  description: 'إحصاءات المحتوى وأدوات إدارة البحور والتفعيلات والكلمات والدروس والتمارين.',
};

export default async function AdminPage() {
  const stats = lexiconStats();
  const db = await dbStatus();
  const exercisesPerLevel = generateExercises('متوسط', 8, 1).length;

  const coverage = FEET_LIST.map((f) => ({
    name: f.name,
    pattern: f.pattern,
    slug: f.slug,
    total: wordsForPattern(f.pattern).length,
    curated: wordsForPattern(f.pattern, { curatedOnly: true }).length,
  }));
  const maxTotal = Math.max(...coverage.map((c) => c.total), 1);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="title text-3xl">لوحة الإدارة</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed muted">
          نظرةٌ على محتوى المنصّة ومصادره. المحتوى الأساسي مُعرَّف في ملفات المشروع ويُبنى مع
          الموقع، فلا يحتاج قاعدة بيانات لتشغيله. وعند ضبط قاعدة بيانات تصير هذه الشاشة قابلةً
          للتحرير المباشر.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Waves} label="البحور" value={METERS.length} sub={`${METER_FAMILIES.length} عائلة`} href="/buhur" />
        <Stat icon={Shapes} label="التفعيلات" value={FEET_LIST.length} sub="بزحافاتها وعللها" href="/taf3ilat" />
        <Stat
          icon={Database}
          label="الكلمات"
          value={stats.total}
          sub={`${stats.curated} معتمدة · ${stats.derived} قياسية`}
          href="/search"
        />
        <Stat icon={FileText} label="الدروس" value={LESSONS.length} sub={`${CORPUS.length} بيتاً في المدوّنة`} href="/lessons" />
      </section>

      <section className="card">
        <h2 className="title mb-1 text-xl">تغطية المعجم لكل تفعيلة</h2>
        <p className="mb-4 text-sm muted">
          عدد الكلمات المطابقة لكل تفعيلة في حالات الوقف والوصل والتنوين.
        </p>
        <div className="space-y-2.5">
          {coverage.map((c) => (
            <div key={c.slug} className="flex items-center gap-3 text-sm">
              <Link href={`/taf3ilat/${c.slug}`} className="verse w-28 shrink-0 link text-base">
                {c.name}
              </Link>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: 'var(--surface-2)' }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(c.total / maxTotal) * 100}%`, background: 'var(--accent)' }}
                />
              </div>
              <span className="w-24 shrink-0 text-left text-xs faint">
                {c.total.toLocaleString('ar-EG')} ({c.curated})
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="card">
          <h2 className="title mb-3 text-lg">مصادر المحتوى</h2>
          <table className="table-clean">
            <tbody>
              <Row k="جذور صحيحة سالمة" v={`${SOUND_ROOTS.length} جذراً`} />
              <Row k="أوزان صرفية" v={`${MORPH_PATTERNS.length} وزناً`} />
              <Row k="كلمات معتمدة" v={`${stats.curated} كلمة`} />
              <Row k="صيغ مولَّدة" v={`${stats.derived} صيغة`} />
              <Row k="أنماط رمزية مميّزة" v={`${stats.distinctPatterns} نمطاً`} />
              <Row k="أبيات المدوّنة" v={`${CORPUS.length} بيتاً`} />
              <Row k="تمارين لكل مستوى" v={`${exercisesPerLevel} تمارين متجدّدة`} />
            </tbody>
          </table>
        </div>

        <div className="card">
          <h2 className="title mb-3 flex items-center gap-2 text-lg">
            <Users size={17} />
            الحسابات وقاعدة البيانات
          </h2>
          <table className="table-clean">
            <tbody>
              <Row k="قاعدة البيانات" v={db.configured ? `متّصلة (${db.provider})` : 'غير مضبوطة'} />
              <Row k="عدد المستخدمين" v={db.users === null ? '—' : String(db.users)} />
              <Row k="تسجيل الدخول بجوجل" v={db.providers.google ? 'مفعّل' : 'غير مضبوط'} />
              <Row k="تسجيل الدخول بآبل" v={db.providers.apple ? 'مفعّل' : 'غير مضبوط'} />
              <Row k="الدخول بالبريد" v={db.providers.email ? 'مفعّل' : 'غير مضبوط'} />
            </tbody>
          </table>
          <p className="mt-3 text-xs leading-relaxed faint">
            {db.configured
              ? 'قاعدة البيانات مضبوطة؛ يمكن حفظ تقدّم المستخدمين ومفضّلاتهم على الخادم.'
              : 'الموقع يعمل كاملاً بلا قاعدة بيانات: المحتوى من ملفات المشروع، والمفضّلة والتقدّم في المتصفّح. لتفعيل الحسابات اضبط DATABASE_URL ومتغيّرات NextAuth ثم شغّل الترحيل والبذر.'}
          </p>
        </div>
      </section>

      <AdminTools />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  sub,
  href,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: number;
  sub: string;
  href: string;
}) {
  return (
    <Link href={href} className="card">
      <span
        className="mb-3 grid h-9 w-9 place-items-center rounded-xl"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
      >
        <Icon size={17} />
      </span>
      <p className="title text-2xl">{value.toLocaleString('ar-EG')}</p>
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-0.5 text-xs faint">{sub}</p>
    </Link>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <tr>
      <td className="font-semibold">{k}</td>
      <td className="muted">{v}</td>
    </tr>
  );
}
