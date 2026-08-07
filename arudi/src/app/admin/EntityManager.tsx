'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Pencil, Save, Search, Trash2, X } from 'lucide-react';
import type { Entity, Page, Row } from '@/lib/admin';

const TABS: { key: Entity; label: string }[] = [
  { key: 'words', label: 'الكلمات' },
  { key: 'verses', label: 'الأبيات' },
  { key: 'lessons', label: 'الدروس' },
  { key: 'meters', label: 'البحور' },
  { key: 'users', label: 'المستخدمون' },
];

/** إدارة محتوى المنصّة: بحث وتصفّح وتحرير وحذف. */
export function EntityManager() {
  const [entity, setEntity] = useState<Entity>('words');
  const [q, setQ] = useState('');
  const [skip, setSkip] = useState(0);
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [draft, setDraft] = useState<Record<string, string | boolean>>({});
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ entity, skip: String(skip) });
      if (q.trim()) p.set('q', q.trim());
      const res = await fetch(`/api/admin?${p}`);
      setPage(await res.json());
    } catch {
      setNote({ ok: false, text: 'تعذّر الاتصال بالخادم.' });
    } finally {
      setLoading(false);
    }
  }, [entity, q, skip]);

  useEffect(() => {
    const t = setTimeout(load, q ? 300 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const startEdit = (row: Row) => {
    setEditing(row);
    setDraft({
      ...Object.fromEntries(row.fields.map((f) => [f.name, f.value])),
      published: row.published,
    });
  };

  const save = async () => {
    if (!editing) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ entity, id: editing.id, data: draft }),
      });
      const json = await res.json();
      setNote({ ok: !!json.ok, text: json.ok ? 'حُفظ التعديل.' : (json.error ?? 'تعذّر الحفظ.') });
      if (json.ok) {
        setEditing(null);
        await load();
      }
    } finally {
      setLoading(false);
    }
  };

  const remove = async (row: Row) => {
    if (!confirm(`حذف «${row.title}»؟ لا يمكن التراجع.`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin?entity=${entity}&id=${encodeURIComponent(row.id)}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      setNote({ ok: !!json.ok, text: json.ok ? 'حُذف السجلّ.' : (json.error ?? 'تعذّر الحذف.') });
      if (json.ok) await load();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="title text-xl">إدارة المحتوى</h2>
        {page && (
          <>
            <span className={`chip ${page.editable ? 'chip-ok' : ''}`}>
              {page.editable ? 'قابل للتحرير' : 'قراءة فقط'}
            </span>
            <span className="chip">المصدر: {page.source}</span>
          </>
        )}
      </div>

      {page && !page.editable && (
        <p className="card-quiet text-xs leading-relaxed muted">
          {page.reason === 'auth' ? (
            <>
              التحرير مقصورٌ على المديرين. سجّل الدخول بحسابٍ بريدُه مذكورٌ في{' '}
              <code>ADMIN_EMAILS</code>، أو دورُه <code>ADMIN</code> في قاعدة البيانات.
            </>
          ) : (
            <>
              المحتوى معروضٌ من ملفات المشروع. لتحريره من هنا اضبط <code>DATABASE_URL</code> ثم شغّل{' '}
              <code>npm run db:push</code> و<code>npm run db:seed</code>، واضبط جهة دخولٍ
              و<code>ADMIN_EMAILS</code>.
            </>
          )}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setEntity(t.key);
              setSkip(0);
              setEditing(null);
            }}
            className="btn px-3 py-1.5 text-xs"
            style={
              entity === t.key
                ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#fff' }
                : undefined
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[12rem]">
          <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 faint" />
          <input
            className="input py-2 pr-9 text-sm"
            placeholder="بحث…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSkip(0);
            }}
          />
        </div>
        {loading && <Loader2 size={16} className="animate-spin faint" />}
        {page && (
          <span className="text-xs faint">
            {page.total.toLocaleString('ar-EG')} سجلّاً
          </span>
        )}
      </div>

      {note && (
        <p
          className="rounded-lg px-3 py-2 text-xs"
          style={{
            background: note.ok ? 'var(--ok-soft)' : 'var(--danger-soft)',
            color: note.ok ? 'var(--ok)' : 'var(--danger)',
          }}
        >
          {note.text}
        </p>
      )}

      {editing && (
        <div className="card-quiet space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold">تحرير: {editing.title}</h3>
            <button className="btn btn-ghost px-2 py-1" onClick={() => setEditing(null)}>
              <X size={15} />
            </button>
          </div>
          {editing.fields.map((f) => (
            <label key={f.name} className="block">
              <span className="mb-1 block text-xs font-semibold faint">{f.label}</span>
              {f.type === 'long' ? (
                <textarea
                  rows={3}
                  className="input text-sm"
                  value={String(draft[f.name] ?? '')}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.name]: e.target.value }))}
                />
              ) : (
                <input
                  className="input verse py-2"
                  value={String(draft[f.name] ?? '')}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.name]: e.target.value }))}
                />
              )}
            </label>
          ))}
          <label className="chip cursor-pointer select-none">
            <input
              type="checkbox"
              className="ml-1.5"
              checked={!!draft.published}
              onChange={(e) => setDraft((d) => ({ ...d, published: e.target.checked }))}
            />
            منشور
          </label>
          <button className="btn btn-primary" onClick={save} disabled={loading}>
            <Save size={15} />
            حفظ
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border">
        <table className="table-clean">
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              <th>العنوان</th>
              {page?.columns.map((c) => (
                <th key={c.key} className="hidden sm:table-cell">
                  {c.label}
                </th>
              ))}
              <th>أدوات</th>
            </tr>
          </thead>
          <tbody>
            {page?.rows.map((row) => (
              <tr key={row.id} style={row.published ? undefined : { opacity: 0.55 }}>
                <td className="verse max-w-[16rem] truncate text-base">{row.title}</td>
                {page.columns.map((c) => (
                  <td key={c.key} className="hidden max-w-[14rem] truncate text-xs sm:table-cell">
                    {row.cells[c.key]}
                  </td>
                ))}
                <td>
                  <div className="flex gap-0.5">
                    <button
                      className="btn btn-ghost px-2 py-1"
                      onClick={() => startEdit(row)}
                      disabled={!page.editable}
                      title={page.editable ? 'تحرير' : 'يتطلّب قاعدة بيانات'}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn btn-ghost px-2 py-1"
                      onClick={() => remove(row)}
                      disabled={!page.editable || entity === 'meters'}
                      title={page.editable ? 'حذف' : 'يتطلّب قاعدة بيانات'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {page && !page.rows.length && (
              <tr>
                <td colSpan={6} className="py-8 text-center muted">
                  {entity !== 'users'
                    ? 'لا سجلّات بهذه الشروط.'
                    : page.source === 'قاعدة البيانات'
                      ? 'لم يسجّل أحدٌ الدخول بعد.'
                      : 'الحسابات تتطلّب قاعدة بيانات وجهة دخول مضبوطة.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {page && page.total > 25 && (
        <div className="flex items-center justify-between text-xs">
          <button
            className="btn px-3 py-1.5"
            disabled={skip === 0}
            onClick={() => setSkip((s) => Math.max(0, s - 25))}
          >
            <ChevronRight size={14} />
            السابق
          </button>
          <span className="faint">
            {skip + 1}–{Math.min(skip + 25, page.total)} من {page.total.toLocaleString('ar-EG')}
          </span>
          <button
            className="btn px-3 py-1.5"
            disabled={skip + 25 >= page.total}
            onClick={() => setSkip((s) => s + 25)}
          >
            التالي
            <ChevronLeft size={14} />
          </button>
        </div>
      )}
    </section>
  );
}
