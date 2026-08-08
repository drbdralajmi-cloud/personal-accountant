/**
 * نقطة دخول النسخة التجريبية المستقلّة.
 *
 * تُحزَم بـesbuild في ملفٍ واحد يُضمَّن داخل صفحة HTML قائمة بذاتها،
 * فتعمل في المتصفّح بلا خادم ولا تثبيت. المحرّك هو نفسه المستعمَل في
 * المنصّة الكاملة — لا نسخة مبسّطة منه.
 */

import { analyzeVerse } from './lib/arud/analyze';
import { describeRhyme } from './lib/arud/rhyme';
import { suggestFixes } from './lib/arud/compose';
import { FEET_LIST } from './lib/arud/feet';
import { METERS } from './lib/arud/meters';
import { lexiconStats, wordsForPattern } from './lib/lexicon';

declare global {
  interface Window {
    Arud: typeof api;
  }
}

const api = {
  analyze(text: string) {
    const a = analyzeVerse(text);
    const half = (h: typeof a.sadr) =>
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
    return {
      ok: a.ok,
      confidence: a.confidence,
      shape: a.shape,
      meter: a.meter && {
        name: a.meter.name,
        formula: a.meter.formula,
        tone: a.meter.tone,
        family: a.meter.family,
      },
      sadr: half(a.sadr),
      ajz: half(a.ajz),
      issues: a.issues,
      explanation: a.explanation,
      candidates: a.candidates,
      rhyme: a.rhyme && { ...a.rhyme, described: describeRhyme(a.rhyme) },
      fixes: suggestFixes(a, 6),
    };
  },

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
    return { total: s.total, curated: s.curated, derived: s.derived, meters: METERS.length };
  },
};

window.Arud = api;
