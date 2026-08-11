'use client';

import { Scale } from 'lucide-react';
import type { ApiSystem } from '@/lib/types';

export const SYSTEMS: { id: ApiSystem; label: string; hint: string }[] = [
  {
    id: 'نبطي',
    label: 'النبطي الخليجي',
    hint: 'ميزان المنصّة الأصل: يُقاس على طروق النبط، ويُقرأ النصّ بالنطق الخليجي — تسهيلُ الهمز، وسكونُ أواخر الكلم، و«اللي» و«هالـ» — ويُتسامح بالزحاف والإشباع.',
  },
  {
    id: 'خليلي',
    label: 'الفصيح — عروض الخليل',
    hint: 'ميزان الشعر الفصيح: كل حرفٍ يُحسب، ولا تتغيّر التفعيلة إلا بزحافٍ معلوم محصور.',
  },
  {
    id: 'مخصّص',
    label: 'وزنٌ تُمليه أنت',
    hint: 'اكتب الوزن بالتفعيلات، فيقيس المحرّك النصَّ عليه ويُريك الحساب حرفاً بحرف.',
  },
];

/**
 * اختيار الميزان الذي يُقاس به النصّ.
 *
 * وجود هذا الاختيار ظاهراً هو المقصود: كان المحرّك يقيس كل نصٍّ بعروض الخليل
 * ولا يُعلن ذلك، فيُحكم على البيت النبطي بميزان الفصيح ثم يُسمّى له بحرٌ لا
 * يعرفه أهله. فلا بدّ أن يعرف القارئ بأيّ ميزانٍ وُزِن.
 */
export function SystemPicker({
  value,
  onChange,
}: {
  value: ApiSystem;
  onChange: (s: ApiSystem) => void;
}) {
  const active = SYSTEMS.find((s) => s.id === value)!;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Scale size={15} />
        الميزان
      </div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="الميزان العروضي">
        {SYSTEMS.map((s) => (
          <button
            key={s.id}
            type="button"
            role="radio"
            aria-checked={s.id === value}
            onClick={() => onChange(s.id)}
            className={`chip transition-opacity ${s.id === value ? 'chip-accent' : 'hover:opacity-80'}`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <p className="text-xs leading-relaxed faint">{active.hint}</p>
    </div>
  );
}
