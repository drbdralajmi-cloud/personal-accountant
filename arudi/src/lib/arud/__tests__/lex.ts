import { lexiconStats, wordsForPattern } from '../../lexicon';
import { FEET_LIST } from '../feet';

const t0 = Date.now();
const s = lexiconStats();
console.log(`المعجم: ${s.total} كلمة (معتمدة ${s.curated} / قياسية ${s.derived}) — ${s.distinctPatterns} تمثيلاً رمزياً — بُني في ${Date.now() - t0}ms\n`);

for (const f of FEET_LIST) {
  const all = wordsForPattern(f.pattern, { limit: 4 });
  const cur = wordsForPattern(f.pattern, { curatedOnly: true });
  const total = wordsForPattern(f.pattern).length;
  console.log(`${f.name.padEnd(14)} ${f.pattern.padEnd(8)} → ${String(total).padStart(4)} كلمة (معتمدة ${cur.length})`);
  console.log(`   ${all.map((w) => `${w.spoken} [${w.segments.join('/')}] ${w.form}`).join('  ·  ') || '—'}`);
}

for (const p of ['1110', '10110', '110110', '101110', '11010', '1010']) {
  console.log(`${p.padEnd(8)} → ${wordsForPattern(p).length}`);
}
