
import { useMemo, useState } from 'react';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import dayjs from 'dayjs';
import type { Transaction } from '@/types';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

const compact = new Intl.NumberFormat("id-ID", { notation: "compact", compactDisplay: "short" });

const COLORS = [
  'rgba(215, 25, 33, 0.8)',
  'rgba(74, 158, 92, 0.8)',
  'rgba(212, 168, 67, 0.8)',
  'rgba(91, 155, 246, 0.8)',
  'rgba(168, 85, 247, 0.8)',
  'rgba(236, 72, 153, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(20, 184, 166, 0.8)',
];

interface CategoryChartProps {
  transactions: Transaction[];
  categories: string[];
}

export function CategoryChart({ transactions, categories }: CategoryChartProps) {
  const { data, categoryData } = useMemo(() => {
    const catTotals: Record<string, number> = {};
    transactions.forEach((t) => {
      catTotals[t.kategori] = (catTotals[t.kategori] || 0) + t.nominal;
    });

    // Sort by amount descending
    const sorted = Object.entries(catTotals)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1]);

    const labels = sorted.map(([k]) => k);
    const values = sorted.map(([, v]) => v);
    const total = values.reduce((s, v) => s + v, 0);

    return {
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: labels.map((_, i) => COLORS[i % COLORS.length]),
          borderWidth: 0,
          cutout: '65%',
        }],
      },
      categoryData: sorted.map(([k, v], i) => ({
        name: k,
        amount: v,
        pct: total > 0 ? (v / total * 100) : 0,
        color: COLORS[i % COLORS.length],
      })),
    };
  }, [transactions]);

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[13px]" style={{ color: 'var(--text-disabled)' }}>Belum ada data</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center">
      <div style={{ width: 160, height: 160, flexShrink: 0 }}>
        <Doughnut
          data={data}
          options={{
            plugins: { legend: { display: false }, tooltip: { enabled: true } },
            responsive: true,
            maintainAspectRatio: true,
          }}
        />
      </div>
      <div className="flex-1 w-full space-y-2">
        {categoryData.map((c) => (
          <div key={c.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
            <span className="text-[13px] flex-1 truncate" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
            <span className="text-[12px] font-mono" style={{ color: 'var(--text-secondary)' }}>
              {c.pct.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface WeeklyChartProps {
  transactions: Transaction[];
  selectedMonth: Date;
}

export function WeeklyChart({ transactions, selectedMonth }: WeeklyChartProps) {
  const [viewMode, setViewMode] = useState<'weekly' | 'daily' | 'monthly'>('weekly');

  const data = useMemo(() => {
    const month = dayjs(selectedMonth);
    const daysInMonth = month.daysInMonth();
    
    if (viewMode === 'weekly') {
      // Split into ~4 weeks
      const weekRanges: { start: number; end: number; label: string }[] = [];
      for (let i = 0; i < 4; i++) {
        const start = i * 7 + 1;
        const end = i === 3 ? daysInMonth : Math.min((i + 1) * 7, daysInMonth);
        weekRanges.push({ start, end, label: `${start}-${end}` });
      }

      const weekTotals = weekRanges.map(({ start, end }) =>
        transactions
          .filter((t) => {
            const d = dayjs(t.date).date();
            return d >= start && d <= end;
          })
          .reduce((sum, t) => sum + t.nominal, 0)
      );

      return {
        labels: weekRanges.map((w) => w.label),
        datasets: [{
          data: weekTotals,
          backgroundColor: 'rgba(215, 25, 33, 0.5)',
          hoverBackgroundColor: 'rgba(215, 25, 33, 0.8)',
          borderWidth: 0,
          borderRadius: 6,
          barPercentage: 0.6,
        }],
      };
    } else if (viewMode === 'monthly') {
      const monthlyMap: Record<string, number> = {};
      transactions.forEach((t) => {
        const key = dayjs(t.date).format("YYYY-MM");
        monthlyMap[key] = (monthlyMap[key] || 0) + t.nominal;
      });
      const sorted = Object.entries(monthlyMap).sort(([a], [b]) => a.localeCompare(b));
      return {
        labels: sorted.map(([k]) => dayjs(k + "-01").format("MMM YY")),
        datasets: [{
          data: sorted.map(([, v]) => v),
          backgroundColor: 'rgba(215, 25, 33, 0.5)',
          hoverBackgroundColor: 'rgba(215, 25, 33, 0.8)',
          borderWidth: 0,
          borderRadius: 6,
          barPercentage: 0.6,
        }],
      };
    } else {
      // Daily view
      const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
      const dailyTotals = days.map(day => 
        transactions
          .filter(t => dayjs(t.date).date() === day)
          .reduce((sum, t) => sum + t.nominal, 0)
      );

      return {
        labels: days.map(d => d.toString()),
        datasets: [{
          data: dailyTotals,
          backgroundColor: 'rgba(215, 25, 33, 0.5)',
          hoverBackgroundColor: 'rgba(215, 25, 33, 0.8)',
          borderWidth: 0,
          borderRadius: 2,
          barPercentage: 0.8,
        }],
      };
    }
  }, [transactions, selectedMonth, viewMode]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('weekly')}
          className="px-3 h-8 text-[12px] font-semibold rounded-lg transition-colors"
          style={{
            background: viewMode === 'weekly' ? 'var(--accent)' : 'transparent',
            color: viewMode === 'weekly' ? 'white' : 'var(--text-secondary)',
            border: viewMode === 'weekly' ? '1px solid var(--accent)' : '1px solid var(--border)',
          }}
        >
          Per Minggu
        </button>
        <button
          onClick={() => setViewMode('daily')}
          className="px-3 h-8 text-[12px] font-semibold rounded-lg transition-colors"
          style={{
            background: viewMode === 'daily' ? 'var(--accent)' : 'transparent',
            color: viewMode === 'daily' ? 'white' : 'var(--text-secondary)',
            border: viewMode === 'daily' ? '1px solid var(--accent)' : '1px solid var(--border)',
          }}
        >
          Per Hari
        </button>
        <button
          onClick={() => setViewMode('monthly')}
          className="px-3 h-8 text-[12px] font-semibold rounded-lg transition-colors"
          style={{
            background: viewMode === 'monthly' ? 'var(--accent)' : 'transparent',
            color: viewMode === 'monthly' ? 'white' : 'var(--text-secondary)',
            border: viewMode === 'monthly' ? '1px solid var(--accent)' : '1px solid var(--border)',
          }}
        >
          Per Bulan
        </button>
      </div>
      <div style={{ height: 160 }}>
        <Bar
          data={data}
          options={{
            plugins: { legend: { display: false } },
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: 'rgba(150, 150, 150, 0.8)', font: { size: 10 } },
                border: { display: false },
              },
              y: {
                grid: { color: 'rgba(150, 150, 150, 0.2)' },
                ticks: {
                  color: 'rgba(150, 150, 150, 0.8)', font: { size: 10 },
                  callback: (v) => compact.format(Number(v)),
                },
                border: { display: false },
              },
            },
            responsive: true,
            maintainAspectRatio: false,
          }}
        />
      </div>
    </div>
  );
}

interface SavingsChartProps {
  /** Array of { month: string (YYYY-MM), budget: number, spent: number } */
  monthlyData: { month: string; budget: number; spent: number }[];
}

export function SavingsChart({ monthlyData }: SavingsChartProps) {
  const data = useMemo(() => {
    const labels = monthlyData.map((d) => dayjs(d.month + '-01').format('MMM'));
    const savings = monthlyData.map((d) => d.budget - d.spent);

    return {
      labels,
      datasets: [
        {
          label: 'Sisa Budget',
          data: savings,
          borderColor: 'rgba(74, 158, 92, 0.9)',
          backgroundColor: 'rgba(74, 158, 92, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: savings.map((v) =>
            v >= 0 ? 'rgba(74, 158, 92, 1)' : 'rgba(215, 25, 33, 1)'
          ),
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  }, [monthlyData]);

  if (monthlyData.length < 2) {
    return (
      <div className="text-center py-8">
        <p className="text-[13px]" style={{ color: 'var(--text-disabled)' }}>
          Butuh data minimal 2 bulan
        </p>
      </div>
    );
  }

  return (
    <div style={{ height: 180 }}>
      <Line
        data={data}
        options={{
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => {
                  const val = ctx.parsed.y;
                  if (val === null || val === undefined) return '';
                  const prefix = val >= 0 ? '+' : '';
                  return `${prefix}${new Intl.NumberFormat('id-ID').format(val)}`;
                },
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: 'rgba(150, 150, 150, 0.8)', font: { size: 11 } },
              border: { display: false },
            },
            y: {
              grid: { color: 'rgba(150, 150, 150, 0.2)' },
              ticks: {
                color: 'rgba(150, 150, 150, 0.8)', font: { size: 10 },
                callback: (v) => compact.format(Number(v)),
              },
              border: { display: false },
            },
          },
          responsive: true,
          maintainAspectRatio: false,
        }}
      />
    </div>
  );
}