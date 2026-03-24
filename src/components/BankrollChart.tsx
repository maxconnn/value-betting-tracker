import type { ChartPoint } from '../types/bet';
import { formatCurrency } from '../utils/format';

interface BankrollChartProps {
  points: ChartPoint[];
}

function getPolylinePoints(points: ChartPoint[], width: number, height: number) {
  const values = points.map((point) => point.bankroll);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  return points
    .map((point, index) => {
      const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
      const y = height - ((point.bankroll - minValue) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');
}

function getValueMeta(points: ChartPoint[]) {
  const values = points.map((point) => point.bankroll);
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    latest: values[values.length - 1] ?? 0,
  };
}

export function BankrollChart({ points }: BankrollChartProps) {
  const chartWidth = 920;
  const chartHeight = 220;
  const polyline = getPolylinePoints(points, chartWidth, chartHeight);
  const valueMeta = getValueMeta(points);

  return (
    <section className="panel p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Bankroll chart
          </p>
          <h2 className="text-2xl font-bold text-ink">График роста банка</h2>
          <p className="mt-1 text-sm text-slate-600">
            Линия строится строго по порядку ставок и использует уже пересчитанный `bankrollAfter`
            каждой строки.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Минимум</p>
            <p className="mt-2 text-lg font-bold text-slate-950">{formatCurrency(valueMeta.min)}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Максимум</p>
            <p className="mt-2 text-lg font-bold text-slate-950">{formatCurrency(valueMeta.max)}</p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Текущее</p>
            <p className="mt-2 text-lg font-bold text-slate-950">
              {formatCurrency(valueMeta.latest)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <div className="min-w-[760px] rounded-[28px] border border-stone-200 bg-gradient-to-b from-stone-50 to-white p-4">
          <svg
            className="h-[260px] w-full"
            viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="График роста банка"
          >
            <defs>
              <linearGradient id="bankroll-line" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="#0f766e" />
                <stop offset="55%" stopColor="#0ea5e9" />
                <stop offset="100%" stopColor="#cb7c30" />
              </linearGradient>
            </defs>

            {[0, 1, 2, 3].map((line) => {
              const y = (chartHeight / 3) * line;
              return (
                <line
                  key={line}
                  x1="0"
                  x2={chartWidth}
                  y1={y}
                  y2={y}
                  stroke="rgba(148,163,184,0.25)"
                  strokeDasharray="6 8"
                />
              );
            })}

            <polyline
              fill="none"
              points={polyline}
              stroke="url(#bankroll-line)"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="5"
            />

            {points.map((point, index) => {
              const x = points.length === 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth;
              const values = points.map((item) => item.bankroll);
              const min = Math.min(...values);
              const max = Math.max(...values);
              const range = max - min || 1;
              const y = chartHeight - ((point.bankroll - min) / range) * chartHeight;

              return (
                <g key={`${point.label}-${index}`}>
                  <circle
                    cx={x}
                    cy={y}
                    fill={point.isSkip ? '#94a3b8' : point.profit >= 0 ? '#0f766e' : '#dc2626'}
                    r={index === points.length - 1 ? 6 : 4}
                  />
                  {index < points.length - 1 ? null : (
                    <text
                      x={x}
                      y={chartHeight + 24}
                      fill="currentColor"
                      fontSize="12"
                      textAnchor="end"
                      className="fill-slate-500"
                    >
                      {point.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            <span className="status-badge border border-emerald-200 bg-emerald-50 text-emerald-900">
              Зелёная точка: строка не ухудшила банк
            </span>
            <span className="status-badge border border-red-200 bg-red-50 text-red-900">
              Красная точка: строка ушла в минус
            </span>
            <span className="status-badge border border-slate-200 bg-slate-100 text-slate-800">
              Серая точка: пропуск
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
