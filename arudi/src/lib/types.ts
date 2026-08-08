/** الأنواع المشتركة بين الخادم والواجهة (ناتج /api/analyze). */

export interface ApiFoot {
  role: string;
  name: string;
  change: string;
  pattern: string;
  text: string;
  ok: boolean;
  missing: number;
}

export interface ApiHalf {
  text: string;
  prosodic: string;
  symbols: string;
  binary: string;
  syllables: string[];
  ok: boolean;
  feet: ApiFoot[];
}

export interface ApiMeter {
  name: string;
  slug: string;
  formula: string;
  family: string;
  form: string;
  tone: string;
  description: string;
}

export interface ApiIssue {
  kind: string;
  hemistich: string;
  foot?: number;
  message: string;
  expected?: string;
  got?: string;
}

export interface ApiRhyme {
  rawi: string;
  harakaRawi: string;
  type: string;
  kind: string;
  text: string;
  ridf: string | null;
  tasees: boolean;
  wasl: string | null;
  key: string;
  pattern: string;
}

export interface ApiFix {
  hemistich: string;
  foot: number;
  expected: string;
  pattern: string;
  got: string;
  words: { word: string; segments: string[]; source: string }[];
  hint: string;
}

/** الميزان الذي قِيس به النصّ — يُصرَّح به في كل نتيجة. */
export type ApiSystem = 'خليلي' | 'نبطي' | 'مخصّص';

export interface ApiComparison {
  letters: number;
  differs: boolean;
  khalili: { meter: string | null; ok: boolean };
  nabati: { meter: string | null; ok: boolean };
}

export interface ApiAnalysis {
  kind: 'بيت' | 'قصيدة' | 'وزن';
  input: string;
  ok: boolean;
  shape: 'بيت' | 'شطر';
  system?: ApiSystem;
  /** عدد الحروف العروضية في النصّ. */
  letters?: number;
  confidence: number;
  meter: ApiMeter | null;
  sadr: ApiHalf | null;
  ajz: ApiHalf | null;
  candidates: { meter: string; slug: string; formula: string; confidence: number }[];
  issues: ApiIssue[];
  explanation: string[];
  rhyme: ApiRhyme | null;
  /** تُرجَع عند طلب الاقتراحات. */
  fixes?: ApiFix[];
  rhymes?: { word: string; segments: string[]; source: string }[];
  rhymeText?: string;
  completion?: { text: string; feet: string[] };
  comparison?: ApiComparison;
  error?: string;
}

/** ناتج القياس على وزنٍ يُمليه المستخدم بالتفعيلات. */
export interface ApiFormulaResult extends ApiAnalysis {
  kind: 'وزن';
  verdict: string;
  verbatim: boolean;
  assumedReading: string | null;
  budget: {
    required: number;
    requiredMin: number;
    requiredMax: number;
    found: number;
    delta: number;
  } | null;
  formula: {
    normalized: string;
    pattern: string;
    unknown: string[];
    feet: { raw: string; ok: boolean; options: { name: string; pattern: string }[] }[];
  };
}

export interface ApiPoem {
  kind: 'قصيدة';
  system?: ApiSystem;
  meter: { name: string; slug: string } | null;
  soundCount: number;
  brokenCount: number;
  verses: ApiAnalysis[];
}
