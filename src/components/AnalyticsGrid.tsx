import type { AnalyticsGroupItem, BettingAnalyticsSummary } from '../types/bet';
import { formatCurrency } from '../utils/format';

interface AnalyticsGridProps {
  analytics: BettingAnalyticsSummary;
}

function AnalyticsList({
  title,
  subtitle,
  items,
  tone,
}: {
  title: string;
  subtitle: string;
  items: AnalyticsGroupItem[];
  tone: 'emerald' | 'rose' | 'sky' | 'amber';
}) {
  const tones = {
    emerald: 'border-emerald-200 bg-emerald-50/70',
    rose: 'border-red-200 bg-red-50/70',
    sky: 'border-sky-200 bg-sky-50/70',
    amber: 'border-amber-200 bg-amber-50/70',
  } as const;

  return (
    <section className="panel p-6">
      <div className="mb-5 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">{title}</p>
        <h3 className="text-2xl font-bold text-ink">{subtitle}</h3>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-5 text-sm text-slate-500">
            Пока недостаточно сыгранных данных для этого блока.
          </div>
        ) : null}

        {items.map((item) => (
          <article
            key={item.key}
            className={`rounded-[24px] border px-4 py-4 ${tones[tone]}`}
          >
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h4 className="text-lg font-bold text-slate-950">{item.label}</h4>
                <p className="mt-1 text-sm text-slate-600">
                  Строк: {item.rows} · сыграно: {item.settledRows} · не сыграно: {item.openRows}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">P/L</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    {formatCurrency(item.totalProfit)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">ROI</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">{item.roi.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.15em] text-slate-500">Winrate</p>
                  <p className="mt-1 text-sm font-bold text-slate-950">
                    {item.winRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function AnalyticsGrid({ analytics }: AnalyticsGridProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <AnalyticsList
        title="Top performance"
        subtitle="Лучшие типы ставок"
        items={analytics.bestBetTypes}
        tone="emerald"
      />
      <AnalyticsList
        title="Risk zones"
        subtitle="Худшие типы ставок"
        items={analytics.worstBetTypes}
        tone="rose"
      />
      <AnalyticsList
        title="Markets"
        subtitle="Аналитика по типам рынков"
        items={analytics.marketAnalytics}
        tone="sky"
      />
      <AnalyticsList
        title="Classifications"
        subtitle="Аналитика по классификации ставок"
        items={analytics.classificationAnalytics}
        tone="amber"
      />
      <section className="xl:col-span-2">
        <AnalyticsList
          title="Leagues"
          subtitle="Аналитика по лигам"
          items={analytics.leagueAnalytics}
          tone="sky"
        />
      </section>
    </div>
  );
}
