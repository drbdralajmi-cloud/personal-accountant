'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  BookOpen,
  GraduationCap,
  Menu,
  PenLine,
  ScanLine,
  Search,
  Shapes,
  Star,
  Waves,
  X,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const NAV = [
  { href: '/analyze', label: 'تحليل بيت', icon: ScanLine },
  { href: '/buhur', label: 'البحور', icon: Waves },
  { href: '/taf3ilat', label: 'القوالب', icon: Shapes },
  { href: '/assistant', label: 'مساعد النظم', icon: PenLine },
  { href: '/training', label: 'التدريب', icon: GraduationCap },
  { href: '/lessons', label: 'الدروس', icon: BookOpen },
  { href: '/search', label: 'البحث', icon: Search },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur-md"
      style={{ background: 'color-mix(in srgb, var(--bg) 82%, transparent)' }}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl text-lg font-bold"
            style={{ background: 'var(--accent)', color: 'var(--bg-soft)' }}
            aria-hidden
          >
            ع
          </span>
          <span className="title text-lg leading-none">
            العَروض
            <span className="mr-2 hidden text-xs font-normal muted sm:inline">منصّة أوزان الشعر</span>
          </span>
        </Link>

        <nav className="mr-auto hidden items-center gap-1 lg:flex">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
              style={
                active(href)
                  ? { background: 'var(--accent-soft)', color: 'var(--accent)' }
                  : { color: 'var(--text-soft)' }
              }
            >
              <Icon size={15} />
              {label}
            </Link>
          ))}
        </nav>

        <div className="mr-auto flex items-center gap-1 lg:mr-0">
          <Link href="/favorites" className="btn btn-ghost px-2.5" aria-label="المفضّلة">
            <Star size={17} />
          </Link>
          <ThemeToggle />
          <button
            className="btn btn-ghost px-2.5 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="القائمة"
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t px-4 pb-3 pt-2 lg:hidden" style={{ background: 'var(--surface)' }}>
          <div className="grid grid-cols-2 gap-1.5">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold"
                style={
                  active(href)
                    ? { background: 'var(--accent-soft)', color: 'var(--accent)' }
                    : { color: 'var(--text-soft)' }
                }
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
