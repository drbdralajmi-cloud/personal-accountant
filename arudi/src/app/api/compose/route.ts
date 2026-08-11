import { NextRequest, NextResponse } from 'next/server';
import { composeHemistich } from '@/lib/arud/compose';
import { meterBySlug } from '@/lib/arud/meters';

export const runtime = 'nodejs';

/** تأليف شطر موزون على بحرٍ معيّن — للتدريب على الإيقاع. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const meter = meterBySlug(q.get('meter') ?? 'kamil');
  if (!meter) return NextResponse.json({ error: 'بحر غير معروف.' }, { status: 404 });

  const side = q.get('side') === 'ajz' ? 'ajz' : 'sadr';
  const seed = Number(q.get('seed') ?? Date.now() % 100000) || 1;
  const rhyme = q.get('rhyme') ?? undefined;

  const line = composeHemistich(meter, side, { seed, rhyme });
  if (!line) {
    return NextResponse.json(
      { error: 'تعذّر تأليف شطر بهذه الشروط. جرّب بحراً آخر أو رويّاً أشيع.' },
      { status: 422 },
    );
  }

  return NextResponse.json({
    meter: meter.name,
    text: line.text,
    feet: line.feet,
    pattern: line.pattern,
    words: line.words.map((w) => w.word),
    note: 'شطرٌ صحيح الوزن مؤلَّف آلياً من المعجم، غرضه التدريب على الإيقاع لا إنشاء الشعر.',
  });
}
