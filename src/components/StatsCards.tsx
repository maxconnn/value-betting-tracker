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
    accent: 'from-slate-950 via-slate-900 to-slate-800 text-white',
  },
  {
    title: 'Итоговый P/L',
    value: formatCurrency(stats.totalProfit),
    hint: 'Относительно стартового банка',
    accent:
      stats.totalProfit >= 0
        ? 'from-emerald-500 via-emerald-600 to-emerald-700 text-white'
        : 'from-rose-500 via-rose-600 to-rose-700 text-white',
  },
  {
    title: 'Активные / пропуски',
    value: `${stats.activeRows} / ${stats.skipRows}`,
    hint: `Не сыграно: ${stats.openRows}`,
    accent: 'from-amber-400 via-amber-500 to-amber-600 text-slate-950',
  },
  {
    title: 'ROI',
    value: `${stats.roi.toFixed(2)}%`,
    hint: `Сумма сыгранных ставок: ${formatCurrency(stats.totalSettledStake)}`,
    accent: 'from-sky-400 via-cyan-500 to-cyan-600 text-slate-950',
  },
  {
    title: 'Winrate',
    value: `${stats.winRate.toFixed(1)}%`,
    hint: 'Считается по сыгранным win/loss ставкам',
    accent: 'from-violet-300 via-fuchsia-400 to-rose-400 text-slate-950',
  },
];

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {cards(stats).map((card) => (
        <article
          key={card.title}
          className={`relative overflow-hidden rounded-[30px] bg-gradient-to-br p-[1px] shadow-[0_18px_60px_rgba(15,23,42,0.12)] ${card.accent}`}
        >
          <div className="h-full rounded-[29px] bg-black/10 p-5 backdrop-blur-sm">
            <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-white/10 blur-2xl" />
            <p className="relative text-xs font-semibold uppercase tracking-[0.28em] opacity-80">
              {card.title}
            </p>
            <p className="relative mt-5 text-3xl font-bold leading-tight">{card.value}</p>
            <p className="relative mt-3 max-w-[18rem] text-sm opacity-85">{card.hint}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
