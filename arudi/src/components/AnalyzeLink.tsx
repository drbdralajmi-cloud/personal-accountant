import Link from 'next/link';
import { ScanLine } from 'lucide-react';

/** رابط سريع لتحليل بيتٍ معروض في الصفحة. */
export function AnalyzeLink({ text, label = 'حلّل هذا البيت' }: { text: string; label?: string }) {
  return (
    <Link
      href={`/analyze?q=${encodeURIComponent(text)}`}
      className="chip chip-accent hover:opacity-80"
    >
      <ScanLine size={12} />
      {label}
    </Link>
  );
}
