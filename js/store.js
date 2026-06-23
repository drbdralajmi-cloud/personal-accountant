// طبقة البيانات — التخزين المحلي والعمليات الحسابية
const STORAGE_KEY = "personal_accountant_v1";

// العملات المدعومة
export const CURRENCIES = [
  { code: "SAR", symbol: "ر.س", ar: "ريال سعودي", en: "Saudi Riyal" },
  { code: "AED", symbol: "د.إ", ar: "درهم إماراتي", en: "UAE Dirham" },
  { code: "USD", symbol: "$", ar: "دولار أمريكي", en: "US Dollar" },
  { code: "EUR", symbol: "€", ar: "يورو", en: "Euro" },
  { code: "EGP", symbol: "ج.م", ar: "جنيه مصري", en: "Egyptian Pound" },
  { code: "KWD", symbol: "د.ك", ar: "دينار كويتي", en: "Kuwaiti Dinar" },
  { code: "QAR", symbol: "ر.ق", ar: "ريال قطري", en: "Qatari Riyal" },
  { code: "GBP", symbol: "£", ar: "جنيه إسترليني", en: "British Pound" },
];

// الفئات الافتراضية — تُترجم عبر nameKey
const DEFAULT_CATEGORIES = [
  // دخل
  { id: "salary", nameKey: "cat_salary", icon: "💰", color: "#10b981", type: "income" },
  { id: "business", nameKey: "cat_business", icon: "💼", color: "#0ea5e9", type: "income" },
  { id: "gift", nameKey: "cat_gift", icon: "🎁", color: "#a855f7", type: "income" },
  { id: "other_income", nameKey: "cat_other_income", icon: "➕", color: "#64748b", type: "income" },
  // مصروف
  { id: "food", nameKey: "cat_food", icon: "🍽️", color: "#f59e0b", type: "expense" },
  { id: "transport", nameKey: "cat_transport", icon: "🚗", color: "#3b82f6", type: "expense" },
  { id: "shopping", nameKey: "cat_shopping", icon: "🛍️", color: "#ec4899", type: "expense" },
  { id: "bills", nameKey: "cat_bills", icon: "🧾", color: "#ef4444", type: "expense" },
  { id: "health", nameKey: "cat_health", icon: "🏥", color: "#14b8a6", type: "expense" },
  { id: "entertainment", nameKey: "cat_entertainment", icon: "🎬", color: "#8b5cf6", type: "expense" },
  { id: "education", nameKey: "cat_education", icon: "📚", color: "#6366f1", type: "expense" },
  { id: "home", nameKey: "cat_home", icon: "🏠", color: "#f97316", type: "expense" },
  { id: "other_expense", nameKey: "cat_other_expense", icon: "📦", color: "#64748b", type: "expense" },
];

function defaultState() {
  return {
    transactions: [],
    categories: DEFAULT_CATEGORIES.map((c) => ({ ...c })),
    budgets: {}, // { "YYYY-MM": { overall: number, byCategory: { catId: number } } }
    settings: { lang: "ar", currency: "SAR", theme: "auto" },
  };
}

let state = defaultState();

// ---- التخزين ----
export function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...defaultState(), ...parsed };
      state.settings = { ...defaultState().settings, ...(parsed.settings || {}) };
    }
  } catch (e) {
    console.warn("تعذّر قراءة البيانات المحفوظة، سيتم البدء من جديد.", e);
    state = defaultState();
  }
  return state;
}

export function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("تعذّر حفظ البيانات", e);
  }
}

export function getState() {
  return state;
}

// ---- معرّف فريد ----
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---- العمليات (Transactions) ----
export function addTransaction({ amount, type, categoryId, date, note }) {
  const tx = { id: uid(), amount: Number(amount), type, categoryId, date, note: note || "" };
  state.transactions.push(tx);
  save();
  return tx;
}

export function updateTransaction(id, fields) {
  const tx = state.transactions.find((t) => t.id === id);
  if (tx) {
    Object.assign(tx, fields);
    if (fields.amount !== undefined) tx.amount = Number(fields.amount);
    save();
  }
  return tx;
}

export function deleteTransaction(id) {
  state.transactions = state.transactions.filter((t) => t.id !== id);
  save();
}

export function getTransactions() {
  return [...state.transactions].sort((a, b) => (a.date < b.date ? 1 : -1));
}

// ---- الفئات ----
export function getCategories(type) {
  return type ? state.categories.filter((c) => c.type === type) : state.categories;
}
export function getCategory(id) {
  return state.categories.find((c) => c.id === id);
}
export function addCategory({ name, icon, color, type }) {
  const cat = { id: uid(), name, icon: icon || "🏷️", color: color || "#64748b", type };
  state.categories.push(cat);
  save();
  return cat;
}
export function updateCategory(id, fields) {
  const cat = getCategory(id);
  if (cat) { Object.assign(cat, fields); save(); }
  return cat;
}
export function deleteCategory(id) {
  state.categories = state.categories.filter((c) => c.id !== id);
  save();
}

// ---- الميزانية ----
export function getBudget(monthKey) {
  return state.budgets[monthKey] || { overall: 0, byCategory: {} };
}
export function setBudget(monthKey, budget) {
  state.budgets[monthKey] = budget;
  save();
}

// ---- الإعدادات ----
export function getSettings() {
  return state.settings;
}
export function updateSettings(fields) {
  Object.assign(state.settings, fields);
  save();
}

// ---- استيراد/تصدير ----
export function exportData() {
  return JSON.stringify(state, null, 2);
}
export function importData(json) {
  const parsed = JSON.parse(json);
  state = { ...defaultState(), ...parsed };
  state.settings = { ...defaultState().settings, ...(parsed.settings || {}) };
  save();
}
export function clearAll() {
  state = defaultState();
  save();
}

// ---- أدوات مساعدة للتواريخ والحسابات ----
export function monthKey(date) {
  // date: ISO string "YYYY-MM-DD"
  return date.slice(0, 7); // "YYYY-MM"
}

export function txInMonth(mKey) {
  return state.transactions.filter((t) => monthKey(t.date) === mKey);
}

export function totals(transactions) {
  let income = 0, expense = 0;
  for (const t of transactions) {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  }
  return { income, expense, balance: income - expense };
}

// إجمالي الصرف لكل فئة ضمن مجموعة عمليات
export function expenseByCategory(transactions) {
  const map = {};
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
  }
  return map;
}
