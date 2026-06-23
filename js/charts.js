// رسوم بيانية باستخدام Chart.js (محمّلة عالمياً عبر window.Chart)
const charts = {}; // الاحتفاظ بالمخططات لتدميرها قبل إعادة الرسم

function destroy(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// مخطط دائري (Doughnut) للصرف حسب الفئة
export function renderCategoryChart(canvas, { labels, data, colors }) {
  const id = canvas.id;
  destroy(id);
  charts[id] = new window.Chart(canvas, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: cssVar("--card") }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: cssVar("--text"), font: { family: "inherit", size: 13 }, padding: 14, usePointStyle: true },
        },
      },
    },
  });
}

// مخطط أعمدة للدخل مقابل المصروفات عبر الأشهر
export function renderTrendChart(canvas, { labels, income, expense, incomeLabel, expenseLabel }) {
  const id = canvas.id;
  destroy(id);
  charts[id] = new window.Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        { label: incomeLabel, data: income, backgroundColor: "#10b981", borderRadius: 6, maxBarThickness: 28 },
        { label: expenseLabel, data: expense, backgroundColor: "#ef4444", borderRadius: 6, maxBarThickness: 28 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: cssVar("--text"), usePointStyle: true, padding: 14, font: { size: 13 } } },
      },
      scales: {
        x: { ticks: { color: cssVar("--text-muted") }, grid: { display: false } },
        y: { ticks: { color: cssVar("--text-muted") }, grid: { color: cssVar("--border") }, beginAtZero: true },
      },
    },
  });
}

export function destroyAll() {
  Object.keys(charts).forEach(destroy);
}
