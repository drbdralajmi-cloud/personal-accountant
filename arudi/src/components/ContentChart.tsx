'use client';

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { useEffect, useState } from 'react';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export interface Slice {
  label: string;
  value: number;
}

/** مخطّطا الإحصاءات في لوحة الإدارة. */
export function ContentChart({ data }: { data: Slice[] }) {
  const [c, setC] = useState({ accent: '#0e6957', gold: '#a76e2c', faint: '#8b8f9f', grid: '#e2dbcb' });

  useEffect(() => {
    const s = getComputedStyle(document.documentElement);
    setC({
      accent: s.getPropertyValue('--accent').trim() || '#0e6957',
      gold: s.getPropertyValue('--gold').trim() || '#a76e2c',
      faint: s.getPropertyValue('--text-faint').trim() || '#8b8f9f',
      grid: s.getPropertyValue('--border').trim() || '#e2dbcb',
    });
  }, []);

  // الكلمات تفوق البقيّة بمراتب، فنعرضها في مخطّط مستقلّ حتى لا تسحق المقياس
  const words = data.find((d) => d.label === 'كلمات');
  const rest = data.filter((d) => d.label !== 'كلمات' && d.value > 0);

  const palette = [c.accent, c.gold, '#44be9b', '#cfa249', '#657592', '#20a382'];

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, grid: { color: c.grid }, ticks: { color: c.faint, font: { size: 10 }, precision: 0 } },
      y: { grid: { display: false }, ticks: { color: c.faint, font: { size: 11 } } },
    },
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: { position: 'bottom', labels: { color: c.faint, font: { size: 11 }, boxWidth: 10 } },
    },
  };

  return (
    <section className="card">
      <h2 className="title mb-1 text-xl">الإحصاءات</h2>
      <p className="mb-4 text-sm muted">توزيع محتوى المنصّة وحجم المعجم.</p>
      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs faint">عدد السجلّات لكل نوع</p>
          <div className="h-56">
            <Bar
              options={barOptions}
              data={{
                labels: rest.map((d) => d.label),
                datasets: [
                  {
                    data: rest.map((d) => d.value),
                    backgroundColor: rest.map((_, i) => palette[i % palette.length]),
                    borderRadius: 5,
                    barPercentage: 0.7,
                  },
                ],
              }}
            />
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs faint">
            المعجم: {(words?.value ?? 0).toLocaleString('ar-EG')} كلمة
          </p>
          <div className="h-56">
            <Doughnut
              options={doughnutOptions}
              data={{
                labels: rest.map((d) => d.label),
                datasets: [
                  {
                    data: rest.map((d) => d.value),
                    backgroundColor: rest.map((_, i) => palette[i % palette.length]),
                    borderWidth: 0,
                  },
                ],
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
