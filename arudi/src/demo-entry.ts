/**
 * نقطة دخول النسخة التجريبية المستقلّة.
 *
 * تُحزَم بـesbuild في ملفٍ واحد يُضمَّن داخل صفحة HTML قائمة بذاتها،
 * فتعمل في المتصفّح بلا خادم ولا تثبيت. المحرّك هو نفسه المستعمَل في
 * المنصّة الكاملة — لا نسخة مبسّطة منه.
 */

import {
  analyzeAgainstFormula,
  analyzeNabati,
  analyzeVerse,
  compareSystems,
} from './lib/arud/analyze';
import { suggestFixes } from './lib/arud/compose';
import { FEET_LIST } from './lib/arud/feet';
import { METERS } from './lib/arud/meters';
import { TURUQ } from './lib/arud/nabati';
import { describeRhyme } from './lib/arud/rhyme';
import { TEMPLATES } from './lib/arud/templates';
import { lexiconStats, wordsForPattern } from './lib/lexicon';

declare global {
  interface Window {
    Arud: typeof api;
  }
}

type Analysis = ReturnType<typeof analyzeVerse>;

const half = (h: Analysis['sadr']) =>
  h && {
    text: h.text,
    prosodic: h.prosodic,
    symbols: h.symbols,
    ok: h.ok,
    units: h.units.map((u) => ({ letter: u.letter, haraka: u.haraka, state: u.state })),
    feet: h.feet.map((f) => ({
      name: f.name,
      change: f.change,
      role: f.role,
      pattern: f.pattern,
      text: f.text,
      ok: f.ok,
      length: f.units.length,
    })),
  };

const shape = (a: Analysis) => ({
  ok: a.ok,
  confidence: a.confidence,
  shape: a.shape,
  system: a.system,
  letters: a.letters,
  meter: a.meter && {
    name: a.meter.name,
    formula: a.meter.formula,
    tone: a.meter.tone,
    family: a.meter.family,
    system: a.meter.system ?? 'خليلي',
  },
  sadr: half(a.sadr),
  ajz: half(a.ajz),
  issues: a.issues,
  culprits: a.culprits,
  explanation: a.explanation,
  candidates: a.candidates,
  rhyme: a.rhyme && { ...a.rhyme, described: describeRhyme(a.rhyme) },
  fixes: suggestFixes(a, 6),
});

const api = {
  /** الميزان الافتراضي هو النبطي، والفصيح يُطلب صراحةً. */
  analyze(text: string, system: 'نبطي' | 'خليلي' = 'نبطي') {
    return shape(system === 'خليلي' ? analyzeVerse(text) : analyzeNabati(text));
  },

  /** قياس النصّ بالميزانين معاً — للنظر في اختلافهما. */
  compare(text: string) {
    const c = compareSystems(text);
    return {
      letters: c.letters,
      differs: c.differs,
      khalili: shape(c.khalili),
      nabati: shape(c.nabati),
    };
  },

  /** قياس النصّ على وزنٍ يُمليه المستخدم بالتفعيلات. */
  onFormula(text: string, formula: string, strict = true) {
    const r = analyzeAgainstFormula(text, formula, {
      tolerant: !strict,
      ishbaa: !strict,
      single: true,
    });
    return {
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
      analysis: r.analysis ? shape(r.analysis) : null,
    };
  },

  /** طروق الشعر النبطي بكل ما يُحسب منها. */
  turuq: TURUQ.map((t) => ({
    slug: t.slug,
    name: t.name,
    aliases: t.aliases,
    formula: t.formulaVocalized,
    pattern: t.pattern,
    symbol: t.symbol,
    letters: t.letters,
    syllableCount: t.syllableCount,
    syllables: t.syllables,
    feet: t.feet,
    difficulty: t.difficulty,
    regions: t.regions,
    description: t.description,
    tone: t.tone,
    licenses: t.licenses,
    howToWrite: t.howToWrite,
    commonMistakes: t.commonMistakes,
    halves: t.halves,
  })),

  /** القوالب: الأصول الثماني وصورها المتفرّعة. */
  templates: TEMPLATES.map((t) => ({
    name: t.name,
    plain: t.plain,
    slug: t.slug,
    pattern: t.pattern,
    kind: t.kind,
    aliases: t.aliases,
    syllables: t.syllables,
    pronunciation: t.pronunciation,
    description: t.description,
    meters: t.meters,
    caution: t.caution ?? null,
  })),

  feet: FEET_LIST.map((f) => ({
    name: f.name,
    plain: f.plain,
    slug: f.slug,
    pattern: f.pattern,
    build: f.build,
    syllables: f.syllables,
    pronunciation: f.pronunciation,
    description: f.description,
    meters: f.meters,
  })),

  words(pattern: string, seed: number, curatedOnly: boolean) {
    const list = wordsForPattern(pattern, { limit: 50, seed, curatedOnly });
    return {
      total: wordsForPattern(pattern, { curatedOnly }).length,
      words: list.map((w) => ({
        word: w.spoken,
        segments: w.segments,
        form: w.form,
        source: w.source,
      })),
    };
  },

  stats() {
    const s = lexiconStats();
    return {
      total: s.total,
      curated: s.curated,
      derived: s.derived,
      meters: METERS.length,
      turuq: TURUQ.length,
      templates: TEMPLATES.length,
    };
  },
};

window.Arud = api;
