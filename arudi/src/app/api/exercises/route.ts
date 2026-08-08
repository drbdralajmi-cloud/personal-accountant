import { NextRequest, NextResponse } from 'next/server';
import { generateExercises } from '@/lib/exercises';
import { composeTasks, generateNabatiExercises } from '@/lib/nabati-exercises';
import { LEVELS, type Level } from '@/data/lessons';

export const runtime = 'nodejs';

/** توليد مجموعة تمارين لمستوى معيّن. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const level = (q.get('level') ?? 'مبتدئ') as Level;
  if (!LEVELS.includes(level)) {
    return NextResponse.json({ error: 'مستوى غير معروف.' }, { status: 400 });
  }
  const count = Math.min(Number(q.get('count') ?? 8) || 8, 20);
  const seed = Number(q.get('seed') ?? 1) || 1;
  // النبطي هو الأصل، والفصيح يُطلب صراحةً
  const fusha = q.get('system') === 'خليلي';
  return NextResponse.json({
    system: fusha ? 'خليلي' : 'نبطي',
    exercises: fusha
      ? generateExercises(level, count, seed)
      : generateNabatiExercises(level, count, seed),
    compose: fusha ? [] : composeTasks(level, 3, seed),
  });
}
