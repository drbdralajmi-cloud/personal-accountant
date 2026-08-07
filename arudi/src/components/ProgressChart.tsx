'use client';

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useEffect, useMemo, useState } from 'react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

/** مخطّط نقاط آخر أربعة عشر يوماً. */
export function ProgressChart({ daily }: { daily: Record<string, number> }) {
  const [colors, setColors] = useState({ accent: '#0e6957', faint: '#8b8f9f', grid: '#e2dbcb' });

  useEffect(() => {
    const s = getComputedStyle(document.documentElement);
    setColors({
      accent: s.getPropertyValue('--accent').trim() || '#0e6957',
      faint: s.getPropertyValue('--text-faint').trim() || '#8b8f9f',
      grid: s.getPropertyValue('--border').trim() || '#e2dbcb',
    });
  }, []);

  const { labels, values } = useMemo(() => {
    const days: string[] = [];
    const vals: number[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days.push(String(d.getDate()));
      vals.push(daily[key] ?? 0);
    }
    return { labels: days, values: vals };
  }, [daily]);

  const empty = values.every((v) => v === 0);

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: (c) => `${c.parsed.y} نقطة` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: colors.faint, font: { size: 9 } } },
      y: {
        beginAtZero: true,
        grid: { color: colors.grid },
        ticks: { color: colors.faint, font: { size: 9 }, precision: 0 },
      },
    },
  };

  return (
    <div>
      <p className="mb-2 text-xs faint">نقاط آخر ١٤ يوماً</p>
      <div className="h-28">
        <Bar
          options={options}
          data={{
            labels,
            datasets: [
              {
                data: values,
                backgroundColor: colors.accent,
                borderRadius: 4,
                barPercentage: 0.65,
              },
            ],
          }}
        />
      </div>
      {empty && <p className="mt-1 text-center text-xs faint">ابدأ التدريب لترى تقدّمك هنا.</p>}
    </div>
  );
}
