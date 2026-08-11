import { NextRequest, NextResponse } from 'next/server';
import { matchVerseToTuruq, searchTuruq } from '@/lib/arud/nabati';

export const runtime = 'nodejs';

/**
 * البحث في الطروق.
 *
 * `q` نصٌّ حرّ: اسم الطَّرق، أو جزء من تفعيلة، أو اسم بلد.
 * `verse` بيتٌ أو شطر: يُقاس على الطروق كلها وتُعاد مرتّبةً بأقربها إليه —
 * فيُجاب السائل بقائمةٍ يرى فيها كم بَعُد كلُّ طَرقٍ عن نصّه، لا بحكمٍ واحد.
 */
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const verse = (p.get('verse') ?? '').slice(0, 500).trim();

  if (verse) {
    const matches = matchVerseToTuruq(verse, 8);
    return NextResponse.json({
      kind: 'بيت',
      verse,
      matches: matches.map((m) => ({
        slug: m.tariq.slug,
        name: m.tariq.name,
        formula: m.tariq.formulaVocalized,
        pattern: m.tariq.pattern,
        difficulty: m.tariq.difficulty,
        description: m.tariq.description,
        ok: m.ok,
        confidence: m.confidence,
        feet: m.feet,
        letters: m.letters,
        required: m.required,
      })),
    });
  }

  const list = searchTuruq({
    q: p.get('q') ?? undefined,
    syllables: Number(p.get('syllables')) || undefined,
    letters: Number(p.get('letters')) || undefined,
    difficulty: p.get('difficulty') ?? undefined,
    region: p.get('region') ?? undefined,
  });
  return NextResponse.json({
    kind: 'بحث',
    count: list.length,
    turuq: list.map((t) => ({
      slug: t.slug,
      name: t.name,
      formula: t.formulaVocalized,
      pattern: t.pattern,
      letters: t.letters,
      syllableCount: t.syllableCount,
      difficulty: t.difficulty,
      regions: t.regions,
    })),
  });
}
