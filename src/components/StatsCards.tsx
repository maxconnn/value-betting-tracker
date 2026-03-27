import type { BetStatsSummary } from '../types/bet';
import { formatCurrency } from '../utils/format';

interface StatsCardsProps {
  stats: BetStatsSummary;
}

const cards = (stats: BetStatsSummary) => [
  {
    title: 'Текущий банк',
    value: formatCurrency(stats.currentBankroll),
    hint: `Строк в журнале: ${stats.totalRows}`,
    accent: 'border-slate-700 bg-slate-900/80',
  },
  {
    title: 'Итоговый P/L',
    value: formatCurrency(stats.totalProfit),
    hint: 'Относительно стартового банка',
    accent: stats.totalProfit >= 0 ? 'border-emerald-500/30 bg-emerald-500/6' : 'border-red-500/30 bg-red-500/6',
  },
  {
    title: 'Активные / пропуски',
    value: `${stats.activeRows} / ${stats.skipRows}`,
    hint: `Не сыграно: ${stats.openRows}`,
    accent: 'border-amber-500/30 bg-amber-500/6',
  },
  {
    title: 'ROI',
    value: `${stats.roi.toFixed(2)}%`,
    hint: `Сумма сыгранных ставок: ${formatCurrency(stats.totalSettledStake)}`,
    accent: 'border-sky-500/30 bg-sky-500/6',
  },
  {
    title: 'Winrate',
    value: `${stats.winRate.toFixed(1)}%`,
    hint: 'Считается по сыгранным win/loss ставкам',
    accent: 'border-violet-500/30 bg-violet-500/6',
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards(stats).map((card) => (
        <article key={card.title} className={`panel border p-5 ${card.accent}`}>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            {card.title}
          </p>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{card.value}</p>
          <p className="mt-3 max-w-[18rem] text-sm leading-6 text-slate-400">{card.hint}</p>
        </article>
      ))}
    </section>
  );
}
