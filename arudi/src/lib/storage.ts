/**
 * تخزين محلّي للمفضّلة وسجلّ البحث وتقدّم التدريب.
 * يعمل دون حساب ودون اتصال؛ وإذا سجّل المستخدم الدخول أمكن مزامنته لاحقاً.
 */

export type FavoriteKind = 'word' | 'verse' | 'meter' | 'foot';

export interface Favorite {
  kind: FavoriteKind;
  id: string;
  title: string;
  subtitle?: string;
  at?: number;
}

export interface HistoryEntry {
  text: string;
  meter?: string;
  ok?: boolean;
  at: number;
}

export interface Progress {
  /** مجموع النقاط. */
  points: number;
  /** عدد التمارين الصحيحة والخاطئة لكل مستوى. */
  levels: Record<string, { right: number; wrong: number }>;
  /** آخر خمسة عشر يوماً: التاريخ ← النقاط. */
  daily: Record<string, number>;
  streak: number;
  lastDay?: string;
}

const KEYS = {
  favorites: 'arudi-favorites',
  history: 'arudi-history',
  progress: 'arudi-progress',
} as const;

const canUse = () => typeof window !== 'undefined' && !!window.localStorage;

function read<T>(key: string, fallback: T): T {
  if (!canUse()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (!canUse()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent('arudi-storage', { detail: key }));
  } catch {
    /* الحصّة ممتلئة أو التخزين معطّل */
  }
}

/* ------------------------------- المفضّلة ------------------------------ */

export const getFavorites = (): Favorite[] => read<Favorite[]>(KEYS.favorites, []);

export function addFavorite(fav: Favorite) {
  const list = getFavorites().filter((f) => !(f.kind === fav.kind && f.id === fav.id));
  write(KEYS.favorites, [{ ...fav, at: Date.now() }, ...list].slice(0, 400));
}

export function removeFavorite(kind: FavoriteKind, id: string) {
  write(
    KEYS.favorites,
    getFavorites().filter((f) => !(f.kind === kind && f.id === id)),
  );
}

export const isFavorite = (kind: FavoriteKind, id: string) =>
  getFavorites().some((f) => f.kind === kind && f.id === id);

/* -------------------------------- السجلّ ------------------------------- */

export const getHistory = (): HistoryEntry[] => read<HistoryEntry[]>(KEYS.history, []);

export function pushHistory(entry: Omit<HistoryEntry, 'at'>) {
  if (!entry.text.trim()) return;
  const list = getHistory().filter((h) => h.text !== entry.text);
  write(KEYS.history, [{ ...entry, at: Date.now() }, ...list].slice(0, 60));
}

export const clearHistory = () => write(KEYS.history, []);

/* ------------------------------- التقدّم ------------------------------- */

const emptyProgress: Progress = { points: 0, levels: {}, daily: {}, streak: 0 };

export const getProgress = (): Progress => read<Progress>(KEYS.progress, emptyProgress);

export function recordAnswer(level: string, right: boolean, points: number) {
  const p = getProgress();
  const today = new Date().toISOString().slice(0, 10);
  const lvl = p.levels[level] ?? { right: 0, wrong: 0 };
  if (right) lvl.right++;
  else lvl.wrong++;
  p.levels[level] = lvl;
  if (right) p.points += points;
  p.daily[today] = (p.daily[today] ?? 0) + (right ? points : 0);

  if (p.lastDay !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    p.streak = p.lastDay === yesterday ? p.streak + 1 : 1;
    p.lastDay = today;
  }
  // نحتفظ بآخر ثلاثين يوماً فقط
  const days = Object.keys(p.daily).sort();
  for (const d of days.slice(0, Math.max(0, days.length - 30))) delete p.daily[d];

  write(KEYS.progress, p);
  return p;
}

export const resetProgress = () => write(KEYS.progress, emptyProgress);

/** الاشتراك في تغيّر التخزين لتحديث الواجهة. */
export function onStorageChange(cb: () => void) {
  if (typeof window === 'undefined') return () => {};
  const handler = () => cb();
  window.addEventListener('arudi-storage', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('arudi-storage', handler);
    window.removeEventListener('storage', handler);
  };
}
