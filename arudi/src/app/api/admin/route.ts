import { NextRequest, NextResponse } from 'next/server';
import { deleteEntity, Entity, ENTITIES, listEntity, updateEntity } from '@/lib/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const isEntity = (v: string): v is Entity => ENTITIES.some((e) => e.key === v);

/** قراءة صفحة من كيان. */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const entity = q.get('entity') ?? 'words';
  if (!isEntity(entity)) return NextResponse.json({ error: 'كيان غير معروف.' }, { status: 400 });
  const skip = Math.max(0, Number(q.get('skip') ?? 0) || 0);
  const page = await listEntity(entity, { q: q.get('q') ?? undefined, skip });
  return NextResponse.json(page);
}

/** تحديث سجلّ. */
export async function PATCH(req: NextRequest) {
  let body: { entity?: string; id?: string; data?: Record<string, string | boolean> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'صيغة الطلب غير صحيحة.' }, { status: 400 });
  }
  const { entity, id, data } = body;
  if (!entity || !isEntity(entity) || !id || !data) {
    return NextResponse.json({ error: 'بيانات ناقصة.' }, { status: 400 });
  }
  const res = await updateEntity(entity, id, data);
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}

/** حذف سجلّ. */
export async function DELETE(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const entity = q.get('entity') ?? '';
  const id = q.get('id') ?? '';
  if (!isEntity(entity) || !id) {
    return NextResponse.json({ error: 'بيانات ناقصة.' }, { status: 400 });
  }
  const res = await deleteEntity(entity, id);
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}
