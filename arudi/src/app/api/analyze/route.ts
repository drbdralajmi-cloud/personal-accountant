import { NextRequest, NextResponse } from 'next/server';
import {
  analyzeAgainstFormula,
  analyzePoem,
  analyzeVerse,
  compareSystems,
} from '@/lib/arud/analyze';
import { repairVerse, suggestCompletion, suggestFixes, suggestRhymes } from '@/lib/arud/compose';
import { NABATI_METERS } from '@/lib/arud/nabati';
import { describeRhyme } from '@/lib/arud/rhyme';

export const runtime = 'nodejs';

type System = 'خليلي' | 'نبطي' | 'مخصّص';

/** تحليل بيت أو قصيدة، مع اقتراحات التصحيح والقوافي. */
export async function POST(req: NextRequest) {
  let body: {
    text?: string;
    suggest?: boolean;
    system?: string;
    formula?: string;
    strict?: boolean;
    compare?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'صيغة الطلب غير صحيحة.' }, { status: 400 });
  }

  const text = (body.text ?? '').toString().slice(0, 4000).trim();
  if (!text) return NextResponse.json({ error: 'أدخل نصّاً للتحليل.' }, { status: 400 });

  // التركيز الأول للمنصّة على النبطي، فهو الميزان الافتراضي، والفصيح يُطلب صراحةً
  const system: System =
    body.system === 'خليلي' ? 'خليلي' : body.system === 'مخصّص' ? 'مخصّص' : 'نبطي';

  // القياس على وزنٍ يُمليه المستخدم بالتفعيلات
  if (system === 'مخصّص') {
    const formula = (body.formula ?? '').toString().slice(0, 300).trim();
    if (!formula) {
      return NextResponse.json(
        { error: 'اكتب الوزن بالتفعيلات، مثل: مستفعلن فاعلن مستفعلن فاعلن.' },
        { status: 400 },
      );
    }
    const strict = body.strict !== false;
    // الوزن المُملى يصف شطراً واحداً، إلا أن يفصل المستخدم بين شطرين بفاصل صريح
    const twoHalves = /(?:\.{3,}|…|\*{2,}|\||—|={2,})/.test(text);
    const r = analyzeAgainstFormula(text, formula, {
      tolerant: !strict,
      ishbaa: !strict,
      single: !twoHalves,
    });
    return NextResponse.json({
      kind: 'وزن',
      system,
      verdict: r.verdict,
      verbatim: r.verbatim,
      assumedReading: r.assumedReading,
      budget: r.budget,
      formula: {
        normalized: r.parsed.normalized,
        pattern: r.parsed.pattern,
        unknown: r.parsed.unknown,
        feet: r.parsed.tokens.map((t) => ({
          raw: t.raw,
          ok: t.ok,
          options: t.options.map((o) => ({ name: o.name, pattern: o.pattern })),
        })),
      },
      ...(r.analysis ? slim(r.analysis) : {}),
    });
  }

  const pool = system === 'نبطي' ? NABATI_METERS : undefined;
  const opts = { pool, system } as const;

  const multiline = text.includes('\n');
  if (multiline) {
    const poem = analyzePoem(text, opts);
    return NextResponse.json({
      kind: 'قصيدة',
      system,
      meter: poem.meter ? { name: poem.meter.name, slug: poem.meter.slug } : null,
      soundCount: poem.soundCount,
      brokenCount: poem.brokenCount,
      verses: poem.verses.map(slim),
    });
  }

  const a = analyzeVerse(text, opts);
  const payload: Record<string, unknown> = { kind: 'بيت', ...slim(a) };

  // مقارنة الميزانين: الحكم في الفصيح قد يخالف الحكم في النبط، وكلاهما صحيح في بابه
  if (body.compare) {
    const cmp = compareSystems(text);
    payload.comparison = {
      letters: cmp.letters,
      differs: cmp.differs,
      khalili: { meter: cmp.khalili.meter?.name ?? null, ok: cmp.khalili.ok },
      nabati: { meter: cmp.nabati.meter?.name ?? null, ok: cmp.nabati.ok },
    };
  }

  // إعادة الصياغة: تُطلب حين ينكسر الوزن، ولا تُعرض إلا إن تحقّق المحرّك منها
  if (!a.ok && a.meter) {
    const r = repairVerse(a, { pool: system === 'نبطي' ? NABATI_METERS : undefined });
    if (r.ok && r.text) {
      payload.repair = {
        text: r.text,
        meter: r.sadr?.meter ?? r.ajz?.meter ?? null,
        swaps: [...(r.sadr?.swaps ?? []), ...(r.ajz?.swaps ?? [])],
      };
    }
  }

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
    system: a.system,
    letters: a.letters,
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
    culprits: a.culprits,
    explanation: a.explanation,
    rhyme: a.rhyme,
  };
}
