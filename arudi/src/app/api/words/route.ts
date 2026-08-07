import { NextRequest, NextResponse } from 'next/server';
import { searchWords, wordsForPattern, type WordMatch } from '@/lib/lexicon';

export const runtime = 'nodejs';

/** كلمات مطابقة لتفعيلة، أو بحثٌ عام في المعجم. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const pattern = q.get('pattern') ?? undefined;
  const limit = Math.min(Number(q.get('limit') ?? 50) || 50, 200);
  const seed = Number(q.get('seed') ?? 1) || 1;
  const curatedOnly = q.get('curated') === 'true';
  const text = q.get('text') ?? undefined;
  const rhyme = q.get('rhyme') ?? undefined;
  const syllables = q.get('syllables') ? Number(q.get('syllables')) : undefined;

  if (pattern && !/^[01]{2,12}$/.test(pattern)) {
    return NextResponse.json({ error: 'التمثيل الرمزي غير صالح.' }, { status: 400 });
  }

  const opts = { limit, seed, curatedOnly, text, rhyme, syllables };
  const words: WordMatch[] = pattern
    ? wordsForPattern(pattern, opts)
    : searchWords(opts).map((e) => ({ ...e, form: 'وقف' as const, spoken: e.word }));
  const total = pattern ? wordsForPattern(pattern, { curatedOnly }).length : words.length;

  return NextResponse.json({
    total,
    words: words.map((w) => ({
      word: w.word,
      spoken: w.spoken,
      segments: w.segments,
      syllableKinds: w.syllableKinds,
      form: w.form,
      source: w.source,
      morph: w.morph,
      root: w.root,
    })),
  });
}
