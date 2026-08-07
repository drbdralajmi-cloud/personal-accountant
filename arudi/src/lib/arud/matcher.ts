/**
 * محرّك المطابقة: يقابل الوحدات العروضية بخانات البحر.
 *
 *  - `matchExact`  : بحث عميق مع تراجع، يستفيد من البحر نفسه في ترميم
 *                     الحركات الناقصة في النصّ غير المشكول.
 *  - `matchNearest`: مطابقة تقريبية بمسافة تحرير (0-1 BFS) لكشف مواضع الكسر
 *                     واقتراح البنية الصحيحة.
 */

import { FootVariant } from './feet';
import { Meter, Slot } from './meters';
import { Unit } from './prosodic';

export interface FootMatch {
  role: Slot['role'];
  /** التفعيلة الأصلية للخانة. */
  base: string;
  variant: FootVariant;
  /** مؤشّرات الوحدات المطابقة [start, end). */
  start: number;
  end: number;
  units: Unit[];
  /** صحيح إن طابقت الخانة دون أخطاء. */
  ok: boolean;
  /** مواضع الأخطاء داخل الخانة (مؤشرات مطلقة في مصفوفة الوحدات). */
  badUnits: number[];
  /** أخطاء الحذف: عدد الحروف الناقصة. */
  missing: number;
}

export interface HemistichMatch {
  units: Unit[];
  feet: FootMatch[];
  /** 0 يعني مطابقة تامّة. */
  cost: number;
  exact: boolean;
}

const MAX_NODES = 60_000;

/* ------------------------------------------------------------------ */
/*                          المطابقة التامّة                           */
/* ------------------------------------------------------------------ */

/**
 * يحاول مطابقة الوحدات بخانات الشطر مطابقة تامّة.
 * الوحدات المجهولة الحركة (state === null) تُحسم وفق ما يقتضيه الوزن.
 */
export function matchExact(units: Unit[], slots: Slot[]): HemistichMatch | null {
  const n = units.length;
  const failed = new Set<number>();
  let nodes = 0;

  const dfs = (li: number, si: number): FootMatch[] | null => {
    if (si === slots.length) return li === n ? [] : null;
    if (li >= n) return null;
    if (++nodes > MAX_NODES) return null;

    const key = li * 64 + si;
    if (failed.has(key)) return null;

    const slot = slots[si];
    for (const variant of slot.variants) {
      const len = variant.pattern.length;
      if (li + len > n) continue;
      let fits = true;
      for (let k = 0; k < len; k++) {
        const bit = variant.pattern[k] === '1' ? 1 : 0;
        const st = units[li + k].state;
        if (st !== null && st !== bit) {
          fits = false;
          break;
        }
      }
      if (!fits) continue;
      const rest = dfs(li + len, si + 1);
      if (rest) {
        const chunk = units.slice(li, li + len).map((u, k) => ({
          ...u,
          state: (variant.pattern[k] === '1' ? 1 : 0) as 1 | 0,
        }));
        const foot: FootMatch = {
          role: slot.role,
          base: slot.base,
          variant,
          start: li,
          end: li + len,
          units: chunk,
          ok: true,
          badUnits: [],
          missing: 0,
        };
        return [foot, ...rest];
      }
    }
    failed.add(key);
    return null;
  };

  const feet = dfs(0, 0);
  if (!feet) return null;

  // إسقاط الحركات المحسومة على الوحدات
  const resolved = units.map((u) => ({ ...u }));
  for (const f of feet) {
    for (let k = 0; k < f.units.length; k++) resolved[f.start + k] = f.units[k];
  }

  return {
    units: resolved,
    feet,
    cost: feet.reduce((s, f) => s + f.variant.cost, 0),
    exact: true,
  };
}

/* ------------------------------------------------------------------ */
/*                        المطابقة التقريبية                           */
/* ------------------------------------------------------------------ */

interface Node {
  i: number; // الموضع في سلسلة الرموز
  s: number; // رقم الخانة
  v: number; // رقم الصورة داخل الخانة
  k: number; // الموضع داخل الصورة
}

type Op =
  | { kind: 'match'; i: number }
  | { kind: 'sub'; i: number }
  | { kind: 'del'; i: number } // حرف زائد في النص
  | { kind: 'ins' }; // حرف ناقص في النص

interface Trace {
  prev: string | null;
  op: Op | null;
  s: number;
  v: number;
}

const encode = (n: Node) => `${n.i}|${n.s}|${n.v}|${n.k}`;

/**
 * أقرب مطابقة ممكنة بين الوحدات وخانات البحر، مع تحديد مواضع الخلل.
 * تُستعمل عند فشل المطابقة التامّة (البيت مكسور أو ناقص).
 */
export function matchNearest(units: Unit[], slots: Slot[]): HemistichMatch | null {
  if (!slots.length) return null;
  const bits = units.map((u) => (u.state === null ? -1 : u.state));
  const n = bits.length;

  const dist = new Map<string, number>();
  const trace = new Map<string, Trace>();
  // طابور ذو أولويتين (تكلفة 0 / تكلفة 1)
  let front: string[] = [];
  let back: string[] = [];

  const push = (node: Node, d: number, t: Trace, weight: 0 | 1) => {
    const key = encode(node);
    const cur = dist.get(key);
    if (cur !== undefined && cur <= d) return;
    dist.set(key, d);
    trace.set(key, t);
    (weight === 0 ? front : back).push(key);
  };

  const decode = (key: string): Node => {
    const [i, s, v, k] = key.split('|').map(Number);
    return { i, s, v, k };
  };

  slots[0].variants.forEach((_, v) =>
    push({ i: 0, s: 0, v, k: 0 }, 0, { prev: null, op: null, s: 0, v }, 0),
  );

  const TERMINAL = 'END';
  let best = Infinity;
  let guard = 0;

  while (front.length || back.length) {
    if (++guard > MAX_NODES * 4) break;
    const key = front.length ? front.pop()! : back.shift()!;
    if (key === TERMINAL) continue;
    const d = dist.get(key)!;
    if (d >= best) continue;
    const node = decode(key);
    const slot = slots[node.s];
    const variant = slot.variants[node.v];
    const pat = variant.pattern;

    if (node.k === pat.length) {
      // انتهت الصورة: انتقل إلى الخانة التالية
      if (node.s + 1 === slots.length) {
        if (node.i === n) {
          if (d < best) {
            best = d;
            dist.set(TERMINAL, d);
            trace.set(TERMINAL, { prev: key, op: null, s: node.s, v: node.v });
          }
        } else {
          // حروف زائدة في آخر الشطر
          push(
            { i: node.i + 1, s: node.s, v: node.v, k: node.k },
            d + 1,
            { prev: key, op: { kind: 'del', i: node.i }, s: node.s, v: node.v },
            1,
          );
        }
      } else {
        slots[node.s + 1].variants.forEach((_, v2) =>
          push(
            { i: node.i, s: node.s + 1, v: v2, k: 0 },
            d,
            { prev: key, op: null, s: node.s + 1, v: v2 },
            0,
          ),
        );
      }
      continue;
    }

    const want = pat[node.k] === '1' ? 1 : 0;
    if (node.i < n) {
      const got = bits[node.i];
      const same = got === -1 || got === want;
      push(
        { i: node.i + 1, s: node.s, v: node.v, k: node.k + 1 },
        d + (same ? 0 : 1),
        {
          prev: key,
          op: { kind: same ? 'match' : 'sub', i: node.i },
          s: node.s,
          v: node.v,
        },
        same ? 0 : 1,
      );
      push(
        { i: node.i + 1, s: node.s, v: node.v, k: node.k },
        d + 1,
        { prev: key, op: { kind: 'del', i: node.i }, s: node.s, v: node.v },
        1,
      );
    }
    push(
      { i: node.i, s: node.s, v: node.v, k: node.k + 1 },
      d + 1,
      { prev: key, op: { kind: 'ins' }, s: node.s, v: node.v },
      1,
    );
  }

  if (best === Infinity) return null;

  // إعادة بناء المسار
  const path: { key: string; t: Trace }[] = [];
  let cursor: string | null = TERMINAL;
  while (cursor) {
    const t: Trace | undefined = trace.get(cursor);
    if (!t) break;
    path.push({ key: cursor, t });
    cursor = t.prev;
  }
  path.reverse();

  const feet: FootMatch[] = [];
  let current: FootMatch | null = null;
  let currentSlot = -1;
  for (const step of path) {
    const { t } = step;
    if (!current || currentSlot !== t.s) {
      const slot = slots[t.s];
      current = {
        role: slot.role,
        base: slot.base,
        variant: slot.variants[t.v],
        start: n,
        end: 0,
        units: [],
        ok: true,
        badUnits: [],
        missing: 0,
      };
      currentSlot = t.s;
      feet.push(current);
    } else {
      current.variant = slots[t.s].variants[t.v];
    }
    if (!t.op) continue;
    if (t.op.kind === 'ins') {
      current.missing++;
      current.ok = false;
      continue;
    }
    const idx = t.op.i;
    current.start = Math.min(current.start, idx);
    current.end = Math.max(current.end, idx + 1);
    current.units.push(units[idx]);
    if (t.op.kind !== 'match') {
      current.badUnits.push(idx);
      current.ok = false;
    }
  }

  for (const f of feet) {
    if (!f.units.length) {
      f.start = 0;
      f.end = 0;
      f.ok = false;
    }
  }

  return { units, feet, cost: best, exact: best === 0 };
}

/* ------------------------------------------------------------------ */

export interface MeterFit {
  meter: Meter;
  sadr: HemistichMatch | null;
  ajz: HemistichMatch | null;
  /** كلفة إجمالية: كلما قلّت كان الترجيح أقوى. */
  score: number;
  exact: boolean;
}

/** ترجيح: المطابقة التامّة أولاً، ثم قلّة الزحافات، ثم شيوع البحر. */
export function scoreFit(meter: Meter, parts: (HemistichMatch | null)[]): number {
  let score = 0;
  for (const p of parts) {
    if (!p) return Infinity;
    score += p.exact ? p.cost * 0.5 : 20 + p.cost * 6;
  }
  score += (10 - meter.frequency) * 0.35;
  return score;
}
