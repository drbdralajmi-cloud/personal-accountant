// ===== المحاسب الشخصي — المنطق الرئيسي =====
import { t, setLang, getLang, isRTL, translations } from "./i18n.js";
import * as store from "./store.js";
import { renderCategoryChart, renderTrendChart, destroyAll } from "./charts.js";

let route = "dashboard";
let txFilter = "all"; // "all" | "income" | "expense"

const $ = (sel, root = document) => root.querySelector(sel);
const el = (html) => { const d = document.createElement("div"); d.innerHTML = html.trim(); return d.firstElementChild; };
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// ===== أدوات التنسيق =====
function locale() { return getLang() === "ar" ? "ar" : "en"; }

function currencySymbol() {
  const c = store.CURRENCIES.find((x) => x.code === store.getSettings().currency);
  return c ? c.symbol : "";
}
function fmtMoney(amount) {
  const n = new Intl.NumberFormat(locale() === "ar" ? "ar-EG-u-nu-latn" : "en-US", {
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  const sign = amount < 0 ? "-" : "";
  return `${sign}${n} ${currencySymbol()}`;
}
function fmtDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${t("months_short")[m - 1]} ${y}`;
}
function todayISO() {
  const d = new Date();
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
}
function currentMonthKey() { return todayISO().slice(0, 7); }
function monthLabel(mKey) {
  const [y, m] = mKey.split("-").map(Number);
  return `${t("months")[m - 1]} ${y}`;
}
function catName(cat) {
  if (!cat) return t("none");
  return cat.nameKey ? t(cat.nameKey) : cat.name;
}

// ===== Toast =====
let toastTimer;
function toast(msg) {
  const el = $("#toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 2200);
}

// ===== Modal =====
function openModal(contentEl) {
  const modal = $("#modal");
  modal.innerHTML = "";
  modal.append(el('<div class="grab"></div>'));
  modal.append(contentEl);
  $("#modal-overlay").classList.remove("hidden");
}
function closeModal() { $("#modal-overlay").classList.add("hidden"); }

// ===== الثيم =====
function applyTheme() {
  const pref = store.getSettings().theme;
  let dark = pref === "dark";
  if (pref === "auto") dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  $("#theme-toggle").textContent = dark ? "☀️" : "🌙";
}

// ===== اللغة =====
function applyI18n() {
  const lang = store.getSettings().lang;
  setLang(lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = isRTL() ? "rtl" : "ltr";
  document.title = t("appName");
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t(node.getAttribute("data-i18n"));
  });
}

// ============================================================
// الصفحات
// ============================================================
function render() {
  destroyAll();
  const view = $("#view");
  view.innerHTML = "";
  ({ dashboard: renderDashboard, transactions: renderTransactions, budget: renderBudget, reports: renderReports, settings: renderSettings }[route] || renderDashboard)(view);
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("active", b.dataset.route === route));
}

// ---- الرئيسية ----
function renderDashboard(view) {
  const mKey = currentMonthKey();
  const txs = store.txInMonth(mKey);
  const { income, expense, balance } = store.totals(txs);
  const budget = store.getBudget(mKey);

  view.append(el(`
    <div class="balance-card">
      <div class="label">${t("monthly_balance")}</div>
      <div class="value">${esc(fmtMoney(balance))}</div>
      <div class="month-tag">${esc(monthLabel(mKey))}</div>
    </div>`));

  view.append(el(`
    <div class="stat-row">
      <div class="stat">
        <div class="stat-head"><span class="dot" style="background:var(--income)"></span>${t("total_income")}</div>
        <div class="stat-val income-text">${esc(fmtMoney(income))}</div>
      </div>
      <div class="stat">
        <div class="stat-head"><span class="dot" style="background:var(--expense)"></span>${t("total_expense")}</div>
        <div class="stat-val expense-text">${esc(fmtMoney(expense))}</div>
      </div>
    </div>`));

  // تقدّم الميزانية
  if (budget.overall > 0) {
    const pct = Math.min(100, Math.round((expense / budget.overall) * 100));
    const cls = expense > budget.overall ? "over" : pct >= 80 ? "warn" : "";
    view.append(el(`<div class="section-title">${t("budget_progress")}</div>`));
    view.append(el(`
      <div class="card">
        <div class="progress ${cls}"><span style="width:${pct}%"></span></div>
        <div class="budget-meta">
          <span>${esc(t("spent_of", { spent: fmtMoney(expense), limit: fmtMoney(budget.overall) }))}</span>
          <span>${pct}%</span>
        </div>
      </div>`));
  }

  // آخر العمليات
  view.append(el(`<div class="section-title">${t("recent_transactions")}<button class="chip" id="see-all">${t("nav_transactions")}</button></div>`));
  const recent = store.getTransactions().slice(0, 6);
  if (recent.length === 0) {
    view.append(el(`<div class="empty"><span class="emoji">📭</span>${t("no_transactions")}</div>`));
  } else {
    const list = el('<div class="tx-list"></div>');
    recent.forEach((tx) => list.append(txItem(tx)));
    view.append(list);
  }
  $("#see-all")?.addEventListener("click", () => go("transactions"));
}

// عنصر عملية
function txItem(tx) {
  const cat = store.getCategory(tx.categoryId);
  const color = cat?.color || "#64748b";
  const sign = tx.type === "income" ? "+" : "-";
  const node = el(`
    <div class="tx-item">
      <div class="tx-icon" style="background:${color}22;color:${color}">${cat?.icon || "🏷️"}</div>
      <div class="tx-body">
        <div class="tx-cat">${esc(catName(cat))}</div>
        <div class="tx-meta">${esc(fmtDate(tx.date))}${tx.note ? " · " + esc(tx.note) : ""}</div>
      </div>
      <div class="tx-amount ${tx.type === "income" ? "income-text" : "expense-text"}">${sign}${esc(fmtMoney(tx.amount))}</div>
    </div>`);
  node.addEventListener("click", () => openTxModal(tx));
  return node;
}

// ---- العمليات ----
function renderTransactions(view) {
  const bar = el(`<div class="filter-bar"></div>`);
  [["all", t("all")], ["income", t("income")], ["expense", t("expense")]].forEach(([key, label]) => {
    const chip = el(`<button class="chip ${txFilter === key ? "active" : ""}">${esc(label)}</button>`);
    chip.addEventListener("click", () => { txFilter = key; render(); });
    bar.append(chip);
  });
  view.append(bar);

  let txs = store.getTransactions();
  if (txFilter !== "all") txs = txs.filter((tx) => tx.type === txFilter);

  if (txs.length === 0) {
    view.append(el(`<div class="empty"><span class="emoji">🔍</span>${t("no_transactions")}</div>`));
    return;
  }

  // تجميع حسب الشهر مع عنوان لكل مجموعة
  const wrap = el("<div></div>");
  let cur = "";
  let group;
  txs.forEach((tx) => {
    const mk = tx.date.slice(0, 7);
    if (mk !== cur) {
      cur = mk;
      wrap.append(el(`<div class="tx-date-group">${esc(monthLabel(mk))}</div>`));
      group = el('<div class="tx-list"></div>');
      wrap.append(group);
    }
    group.append(txItem(tx));
  });
  view.append(wrap);
}

// ---- الميزانية ----
function renderBudget(view) {
  const mKey = currentMonthKey();
  const budget = store.getBudget(mKey);
  const txs = store.txInMonth(mKey);
  const { expense } = store.totals(txs);

  view.append(el(`<div class="section-title">${t("monthly_budget")} · ${esc(monthLabel(mKey))}</div>`));

  // الميزانية العامة
  const card = el(`<div class="card"></div>`);
  if (budget.overall > 0) {
    const pct = Math.min(100, Math.round((expense / budget.overall) * 100));
    const over = expense > budget.overall;
    const cls = over ? "over" : pct >= 80 ? "warn" : "";
    const remaining = budget.overall - expense;
    card.append(el(`
      <div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>${t("overall_budget")}</strong>
          <span class="chip" id="edit-budget">${t("edit")}</span>
        </div>
        <div class="progress ${cls}" style="margin-top:14px"><span style="width:${pct}%"></span></div>
        <div class="budget-meta">
          <span>${esc(fmtMoney(expense))} / ${esc(fmtMoney(budget.overall))}</span>
          <span style="color:${over ? "var(--expense)" : "var(--text-muted)"}">${over ? t("over_budget") : t("remaining") + ": " + fmtMoney(remaining)}</span>
        </div>
        ${pct >= 80 && !over ? `<div style="color:#f59e0b;font-size:12px;margin-top:8px">⚠️ ${t("near_budget")}</div>` : ""}
      </div>`));
  } else {
    card.append(el(`<div style="text-align:center;padding:8px 0"><p style="color:var(--text-muted);margin-bottom:14px">${t("no_budget")}</p><button class="btn" id="edit-budget">${t("set_budget")}</button></div>`));
  }
  view.append(card);
  view.querySelector("#edit-budget")?.addEventListener("click", () => openBudgetModal(mKey));

  // ميزانية الفئات (عرض الصرف لكل فئة)
  const byCat = store.expenseByCategory(txs);
  const cats = Object.keys(byCat);
  if (cats.length) {
    view.append(el(`<div class="section-title">${t("spending_by_category")}</div>`));
    const list = el('<div class="tx-list"></div>');
    cats.sort((a, b) => byCat[b] - byCat[a]).forEach((cid) => {
      const cat = store.getCategory(cid);
      const color = cat?.color || "#64748b";
      list.append(el(`
        <div class="tx-item" style="cursor:default">
          <div class="tx-icon" style="background:${color}22;color:${color}">${cat?.icon || "🏷️"}</div>
          <div class="tx-body"><div class="tx-cat">${esc(catName(cat))}</div></div>
          <div class="tx-amount expense-text">${esc(fmtMoney(byCat[cid]))}</div>
        </div>`));
    });
    view.append(list);
  }
}

function openBudgetModal(mKey) {
  const budget = store.getBudget(mKey);
  const form = el(`
    <div>
      <div class="modal-title">${t("set_budget")}</div>
      <div class="field">
        <label>${t("budget_limit")}</label>
        <input id="b-amount" type="number" inputmode="decimal" min="0" step="0.01" value="${budget.overall || ""}" placeholder="0" />
      </div>
      <button class="btn block" id="b-save">${t("save")}</button>
    </div>`);
  form.querySelector("#b-save").addEventListener("click", () => {
    const v = parseFloat(form.querySelector("#b-amount").value) || 0;
    store.setBudget(mKey, { ...budget, overall: v });
    closeModal(); render(); toast(t("save"));
  });
  openModal(form);
  setTimeout(() => form.querySelector("#b-amount").focus(), 100);
}

// ---- التقارير ----
function renderReports(view) {
  const mKey = currentMonthKey();
  const txs = store.txInMonth(mKey);
  const byCat = store.expenseByCategory(txs);
  const catIds = Object.keys(byCat);

  // مخطط الصرف حسب الفئة
  view.append(el(`<div class="section-title">${t("spending_by_category")} · ${esc(monthLabel(mKey))}</div>`));
  if (catIds.length) {
    const card = el(`<div class="card"><div class="chart-box"><canvas id="cat-chart"></canvas></div></div>`);
    view.append(card);
    renderCategoryChart(card.querySelector("#cat-chart"), {
      labels: catIds.map((id) => catName(store.getCategory(id))),
      data: catIds.map((id) => byCat[id]),
      colors: catIds.map((id) => store.getCategory(id)?.color || "#64748b"),
    });
  } else {
    view.append(el(`<div class="empty"><span class="emoji">📊</span>${t("no_data")}</div>`));
  }

  // الاتجاه الشهري (آخر ٦ أشهر)
  view.append(el(`<div class="section-title">${t("income_vs_expense")} · ${t("last_6_months")}</div>`));
  const months = last6Months();
  const hasAny = store.getTransactions().length > 0;
  if (hasAny) {
    const card = el(`<div class="card"><div class="chart-box tall"><canvas id="trend-chart"></canvas></div></div>`);
    view.append(card);
    const income = [], expense = [];
    months.forEach((mk) => {
      const tot = store.totals(store.txInMonth(mk));
      income.push(tot.income); expense.push(tot.expense);
    });
    renderTrendChart(card.querySelector("#trend-chart"), {
      labels: months.map((mk) => { const [, m] = mk.split("-").map(Number); return t("months_short")[m - 1]; }),
      income, expense,
      incomeLabel: t("income"), expenseLabel: t("expense"),
    });
  } else {
    view.append(el(`<div class="empty"><span class="emoji">📈</span>${t("no_data")}</div>`));
  }
}

function last6Months() {
  const out = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 5; i >= 0; i--) {
    const dd = new Date(d.getFullYear(), d.getMonth() - i, 1);
    out.push(`${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

// ---- الإعدادات ----
function renderSettings(view) {
  const s = store.getSettings();

  // اللغة
  const langRow = el(`<div class="setting-row"><span class="label">${t("language")}</span>
    <div class="seg">
      <button data-lang="ar" class="${s.lang === "ar" ? "active" : ""}">العربية</button>
      <button data-lang="en" class="${s.lang === "en" ? "active" : ""}">English</button>
    </div></div>`);
  langRow.querySelectorAll("[data-lang]").forEach((b) => b.addEventListener("click", () => {
    store.updateSettings({ lang: b.dataset.lang }); applyI18n(); render();
  }));

  // العملة
  const curOpts = store.CURRENCIES.map((c) =>
    `<option value="${c.code}" ${s.currency === c.code ? "selected" : ""}>${getLang() === "ar" ? c.ar : c.en} (${c.symbol})</option>`).join("");
  const curRow = el(`<div class="setting-row"><span class="label">${t("currency")}</span>
    <select class="select-inline" id="cur-sel">${curOpts}</select></div>`);
  curRow.querySelector("#cur-sel").addEventListener("change", (e) => { store.updateSettings({ currency: e.target.value }); render(); });

  // المظهر
  const themeRow = el(`<div class="setting-row"><span class="label">${t("theme")}</span>
    <div class="seg">
      <button data-th="light" class="${s.theme === "light" ? "active" : ""}">${t("theme_light")}</button>
      <button data-th="dark" class="${s.theme === "dark" ? "active" : ""}">${t("theme_dark")}</button>
      <button data-th="auto" class="${s.theme === "auto" ? "active" : ""}">${t("theme_auto")}</button>
    </div></div>`);
  themeRow.querySelectorAll("[data-th]").forEach((b) => b.addEventListener("click", () => {
    store.updateSettings({ theme: b.dataset.th }); applyTheme(); render();
  }));

  const card1 = el(`<div class="card"></div>`);
  card1.append(langRow, curRow, themeRow);
  view.append(card1);

  // إدارة الفئات
  view.append(el(`<div class="section-title">${t("manage_categories")}<button class="chip" id="add-cat">＋ ${t("add_category")}</button></div>`));
  const catCard = el(`<div class="card"></div>`);
  const manageList = el(`<div class="manage-list"></div>`);
  store.getCategories().forEach((c) => {
    const item = el(`<div class="manage-item">
        <div class="tx-icon" style="width:34px;height:34px;font-size:16px;background:${c.color}22;color:${c.color}">${c.icon}</div>
        <span class="name">${esc(catName(c))}</span>
        <span class="chip" style="font-size:11px">${c.type === "income" ? t("income") : t("expense")}</span>
        <button class="del" title="${t("delete")}">🗑</button>
      </div>`);
    item.querySelector(".del").addEventListener("click", () => {
      if (confirm(t("confirm_delete"))) { store.deleteCategory(c.id); render(); }
    });
    manageList.append(item);
  });
  catCard.append(manageList);
  view.append(catCard);
  view.querySelector("#add-cat").addEventListener("click", openCategoryModal);

  // البيانات
  view.append(el(`<div class="section-title">${t("data")}</div>`));
  const dataCard = el(`<div class="card"><div style="display:flex;flex-direction:column;gap:10px">
      <button class="btn ghost" id="exp-btn">⬇️ ${t("export_data")}</button>
      <button class="btn ghost" id="imp-btn">⬆️ ${t("import_data")}</button>
      <button class="btn danger" id="clr-btn">🗑 ${t("clear_data")}</button>
    </div></div>`);
  view.append(dataCard);
  dataCard.querySelector("#exp-btn").addEventListener("click", doExport);
  dataCard.querySelector("#imp-btn").addEventListener("click", doImport);
  dataCard.querySelector("#clr-btn").addEventListener("click", () => {
    if (confirm(t("clear_data_confirm"))) { store.clearAll(); applyI18n(); applyTheme(); render(); toast("✓"); }
  });

  view.append(el(`<div class="empty" style="padding:24px 0"><small>${t("appName")} — v1.0 · ${t("about")}</small></div>`));
}

function openCategoryModal() {
  const icons = ["🏷️","💰","🍽️","🚗","🛍️","🧾","🏥","🎬","📚","🏠","✈️","☕","🎮","💊","👕","🐾","🎁","💼"];
  const colors = ["#10b981","#0ea5e9","#a855f7","#f59e0b","#3b82f6","#ec4899","#ef4444","#14b8a6","#8b5cf6","#6366f1","#f97316","#64748b"];
  let pickedIcon = icons[0], pickedColor = colors[0], pickedType = "expense";
  const form = el(`
    <div>
      <div class="modal-title">${t("add_category")}</div>
      <div class="type-toggle">
        <button class="active expense" data-type="expense">${t("expense")}</button>
        <button data-type="income">${t("income")}</button>
      </div>
      <div class="field"><label>${t("category_name")}</label><input id="c-name" type="text" /></div>
      <div class="field"><label>${t("icon")}</label><div class="cat-grid" id="icon-grid"></div></div>
      <div class="field"><label>${t("color")}</label><div class="filter-bar" id="color-row"></div></div>
      <button class="btn block" id="c-save">${t("save")}</button>
    </div>`);

  const typeBtns = form.querySelectorAll(".type-toggle button");
  typeBtns.forEach((b) => b.addEventListener("click", () => {
    pickedType = b.dataset.type;
    typeBtns.forEach((x) => { x.classList.remove("active", "income", "expense"); });
    b.classList.add("active", pickedType);
  }));

  const ig = form.querySelector("#icon-grid");
  icons.forEach((ic, i) => {
    const b = el(`<button type="button" class="cat-pick ${i === 0 ? "active" : ""}"><span class="ci">${ic}</span></button>`);
    b.addEventListener("click", () => { pickedIcon = ic; ig.querySelectorAll(".cat-pick").forEach((x) => x.classList.remove("active")); b.classList.add("active"); });
    ig.append(b);
  });
  const cr = form.querySelector("#color-row");
  colors.forEach((col, i) => {
    const b = el(`<button type="button" class="chip" style="width:34px;height:34px;border-radius:50%;background:${col};${i === 0 ? "outline:3px solid var(--primary);outline-offset:2px" : ""}"></button>`);
    b.addEventListener("click", () => { pickedColor = col; cr.querySelectorAll("button").forEach((x) => x.style.outline = "none"); b.style.outline = "3px solid var(--primary)"; b.style.outlineOffset = "2px"; });
    cr.append(b);
  });

  form.querySelector("#c-save").addEventListener("click", () => {
    const name = form.querySelector("#c-name").value.trim();
    if (!name) { form.querySelector("#c-name").focus(); return; }
    store.addCategory({ name, icon: pickedIcon, color: pickedColor, type: pickedType });
    closeModal(); render(); toast(t("save"));
  });
  openModal(form);
}

function doExport() {
  const blob = new Blob([store.exportData()], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `personal-accountant-${todayISO()}.json`; a.click();
  URL.revokeObjectURL(url);
  toast(t("export_data"));
}
function doImport() {
  const input = document.createElement("input");
  input.type = "file"; input.accept = "application/json";
  input.addEventListener("change", () => {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { store.importData(reader.result); applyI18n(); applyTheme(); render(); toast("✓"); }
      catch (e) { toast("⚠️ " + e.message); }
    };
    reader.readAsText(file);
  });
  input.click();
}

// ============================================================
// نافذة إضافة/تعديل عملية
// ============================================================
function openTxModal(existing) {
  const editing = !!existing;
  let type = existing?.type || "expense";
  let pickedCat = existing?.categoryId || null;

  const form = el(`
    <div>
      <div class="modal-title">${editing ? t("edit_transaction") : t("add_transaction")}</div>
      <div class="type-toggle">
        <button class="${type === "expense" ? "active expense" : ""}" data-type="expense">${t("expense")}</button>
        <button class="${type === "income" ? "active income" : ""}" data-type="income">${t("income")}</button>
      </div>
      <div class="field">
        <label>${t("amount")}</label>
        <input id="t-amount" type="number" inputmode="decimal" min="0" step="0.01" value="${existing?.amount ?? ""}" placeholder="0" />
        <div class="error hidden" id="err-amount">${t("err_amount")}</div>
      </div>
      <div class="field">
        <label>${t("category")}</label>
        <div class="cat-grid" id="cat-grid"></div>
        <div class="error hidden" id="err-cat">${t("err_category")}</div>
      </div>
      <div class="field-row">
        <div class="field"><label>${t("date")}</label><input id="t-date" type="date" value="${existing?.date || todayISO()}" /></div>
      </div>
      <div class="field"><label>${t("note")} <small style="color:var(--text-muted)">(${t("optional")})</small></label><input id="t-note" type="text" value="${esc(existing?.note || "")}" /></div>
      <div style="display:flex;gap:10px">
        ${editing ? `<button class="btn danger" id="t-del" style="flex:0 0 auto">🗑</button>` : ""}
        <button class="btn block" id="t-save">${t("save")}</button>
      </div>
    </div>`);

  const grid = form.querySelector("#cat-grid");
  function renderCats() {
    grid.innerHTML = "";
    store.getCategories(type).forEach((c) => {
      const active = c.id === pickedCat;
      const b = el(`<button type="button" class="cat-pick ${active ? "active" : ""}">
          <span class="ci" style="background:${c.color}22;color:${c.color}">${c.icon}</span>
          <span class="cl">${esc(catName(c))}</span>
        </button>`);
      b.addEventListener("click", () => { pickedCat = c.id; renderCats(); form.querySelector("#err-cat").classList.add("hidden"); });
      grid.append(b);
    });
  }
  renderCats();

  const typeBtns = form.querySelectorAll(".type-toggle button");
  typeBtns.forEach((b) => b.addEventListener("click", () => {
    type = b.dataset.type;
    typeBtns.forEach((x) => x.classList.remove("active", "income", "expense"));
    b.classList.add("active", type);
    pickedCat = null; renderCats();
  }));

  form.querySelector("#t-save").addEventListener("click", () => {
    const amount = parseFloat(form.querySelector("#t-amount").value);
    const date = form.querySelector("#t-date").value || todayISO();
    const note = form.querySelector("#t-note").value.trim();
    let ok = true;
    if (!amount || amount <= 0) { form.querySelector("#err-amount").classList.remove("hidden"); ok = false; }
    if (!pickedCat) { form.querySelector("#err-cat").classList.remove("hidden"); ok = false; }
    if (!ok) return;
    if (editing) store.updateTransaction(existing.id, { amount, type, categoryId: pickedCat, date, note });
    else store.addTransaction({ amount, type, categoryId: pickedCat, date, note });
    closeModal(); render(); toast(t("save"));
  });

  form.querySelector("#t-del")?.addEventListener("click", () => {
    if (confirm(t("confirm_delete"))) { store.deleteTransaction(existing.id); closeModal(); render(); }
  });

  openModal(form);
  setTimeout(() => form.querySelector("#t-amount").focus(), 120);
}

// ============================================================
// التنقل والتهيئة
// ============================================================
function go(r) { route = r; render(); }

function init() {
  store.load();
  applyI18n();
  applyTheme();
  render();

  document.querySelectorAll(".nav-btn").forEach((b) => b.addEventListener("click", () => go(b.dataset.route)));
  $("#fab").addEventListener("click", () => openTxModal(null));
  $("#theme-toggle").addEventListener("click", () => {
    const order = { light: "dark", dark: "auto", auto: "light" };
    store.updateSettings({ theme: order[store.getSettings().theme] });
    applyTheme();
    if (route === "settings") render();
    toast(t("theme") + ": " + t("theme_" + store.getSettings().theme));
  });
  $("#modal-overlay").addEventListener("click", (e) => { if (e.target.id === "modal-overlay") closeModal(); });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => { if (store.getSettings().theme === "auto") applyTheme(); });
}

init();
