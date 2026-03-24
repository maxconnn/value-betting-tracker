import type { BetClassification, BetResult, LeagueType, MarketType } from '../types/bet';

const currencyFormatter = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

export const resultLabels: Record<BetResult, string> = {
  not_played: 'Не сыграно',
  won: 'Выиграно',
  lost: 'Проиграно',
  refund: 'Возврат',
};

export const marketTypeLabels: Record<MarketType, string> = {
  outcomes: 'Исходы',
  handicaps: 'Форы',
  totals: 'Тоталы',
  corners_periods: 'Угловые / периоды',
};

export const leagueTypeLabels: Record<LeagueType, string> = {
  top: 'Топ-лиги',
  mid: 'Средние лиги',
  youth_low: 'Молодёжные / низкие',
};

export const classificationLabels: Record<BetClassification, string> = {
  green: 'Зелёная',
  yellow: 'Жёлтая',
  red: 'Красная',
  skip: 'Пропуск',
};

export const classificationBadgeStyles: Record<BetClassification, string> = {
  green:
    'border-emerald-300 bg-emerald-100 text-emerald-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
  yellow:
    'border-amber-300 bg-amber-100 text-amber-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
  red:
    'border-rose-300 bg-rose-100 text-rose-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
  skip:
    'border-slate-300 bg-slate-200 text-slate-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
};

export const resultBadgeStyles: Record<BetResult, string> = {
  not_played:
    'border-sky-300 bg-sky-100 text-sky-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
  won:
    'border-emerald-300 bg-emerald-100 text-emerald-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
  lost:
    'border-rose-300 bg-rose-100 text-rose-900 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
  refund:
    'border-stone-300 bg-stone-100 text-stone-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]',
};

export function formatCurrency(value: number) {
  return currencyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatOdds(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '0.00';
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatDate(value: string) {
  if (!value) return '—';
  return dateFormatter.format(new Date(`${value}T00:00:00`));
}
