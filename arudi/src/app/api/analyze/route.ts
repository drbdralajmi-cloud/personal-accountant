import { NextRequest, NextResponse } from 'next/server';
import { analyzePoem, analyzeVerse } from '@/lib/arud/analyze';
import { suggestCompletion, suggestFixes, suggestRhymes } from '@/lib/arud/compose';
import { describeRhyme } from '@/lib/arud/rhyme';

export const runtime = 'nodejs';

/** تحليل بيت أو قصيدة، مع اقتراحات التصحيح والقوافي. */
export async function POST(req: NextRequest) {
  let body: { text?: string; suggest?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'صيغة الطلب غير صحيحة.' }, { status: 400 });
  }

  const text = (body.text ?? '').toString().slice(0, 4000).trim();
  if (!text) return NextResponse.json({ error: 'أدخل نصّاً للتحليل.' }, { status: 400 });

  const multiline = text.includes('\n');
  if (multiline) {
    const poem = analyzePoem(text);
    return NextResponse.json({
      kind: 'قصيدة',
      meter: poem.meter ? { name: poem.meter.name, slug: poem.meter.slug } : null,
      soundCount: poem.soundCount,
      brokenCount: poem.brokenCount,
      verses: poem.verses.map(slim),
    });
  }

  const a = analyzeVerse(text);
  const payload: Record<string, unknown> = { kind: 'بيت', ...slim(a) };

  if (body.suggest) {
    payload.fixes = suggestFixes(a);
    if (a.rhyme) {
      payload.rhymes = suggestRhymes(a.rhyme.rawi, 18);
      payload.rhymeText = describeRhyme(a.rhyme);
    }
    if (a.meter) {
      const line = suggestCompletion(a.meter, a.rhyme?.rawi);
      if (line) payload.completion = { text: line.text, feet: line.feet };
    }
  }

  return NextResponse.json(payload);
}

/** تقليص نتيجة التحليل إلى ما تحتاجه الواجهة. */
function slim(a: ReturnType<typeof analyzeVerse>) {
  const half = (h: typeof a.sadr) =>
    h && {
      text: h.text,
      prosodic: h.prosodic,
      symbols: h.symbols,
      binary: h.binary,
      syllables: h.syllables,
      ok: h.ok,
      feet: h.feet.map((f) => ({
        role: f.role,
        name: f.name,
        change: f.change,
        pattern: f.pattern,
        text: f.text,
        ok: f.ok,
        missing: f.missing,
      })),
    };

  return {
    input: a.input,
    ok: a.ok,
    shape: a.shape,
    confidence: a.confidence,
    meter: a.meter
      ? {
          name: a.meter.name,
          slug: a.meter.slug,
          formula: a.meter.formula,
          family: a.meter.family,
          form: a.meter.form,
          tone: a.meter.tone,
          description: a.meter.description,
        }
      : null,
    sadr: half(a.sadr),
    ajz: half(a.ajz),
    candidates: a.candidates,
    issues: a.issues,
    explanation: a.explanation,
    rhyme: a.rhyme,
  };
}
