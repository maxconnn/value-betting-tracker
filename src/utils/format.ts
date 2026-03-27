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
  individual_totals: 'Индивидуальные тоталы',
  individual_handicaps: 'Индивидуальные форы',
  corners: 'Угловые',
  periods: 'Периоды',
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
  green: 'badge-success-light',
  yellow: 'badge-warning-light',
  red: 'badge-danger-fill',
  skip: 'badge-neutral',
};

export const resultBadgeStyles: Record<BetResult, string> = {
  not_played: 'badge-info-light',
  won: 'badge-success-light',
  lost: 'badge-danger-fill',
  refund: 'badge-neutral',
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
