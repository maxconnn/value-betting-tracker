import {
  BET_RESULTS,
  LEAGUE_TYPES,
  MARKET_TYPES,
  getTodayDateString,
  type BetEntry,
  type BetResult,
  type LeagueType,
  type MarketType,
} from '../types/bet';

export const STORAGE_KEYS = {
  initialBank: 'value-betting-tracker:initial-bank',
  bets: 'value-betting-tracker:bets',
  theme: 'value-betting-tracker:theme',
} as const;

export const DEFAULT_INITIAL_BANK = 500;

const LEGACY_RESULT_MAP: Record<string, BetResult> = {
  'Не сыграно': 'not_played',
  Выиграно: 'won',
  Проиграно: 'lost',
  Возврат: 'refund',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function normalizeBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'y', 'да'].includes(normalizedValue)) return true;
    if (['false', '0', 'no', 'n', 'нет'].includes(normalizedValue)) return false;
  }
  if (typeof value === 'number') return value === 1;

  return fallback;
}

function normalizeNumber(value: unknown, fallback: number, minimum = 0) {
  const parsedValue =
    typeof value === 'string' ? Number(value.replace(',', '.').trim()) : Number(value);

  if (!Number.isFinite(parsedValue)) {
    return fallback;
  }

  return Math.max(minimum, parsedValue);
}

function normalizeEnum<T extends string>(value: unknown, allowedValues: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowedValues.includes(value as T) ? (value as T) : fallback;
}

function normalizeResult(value: unknown): BetResult {
  if (typeof value === 'string') {
    const normalizedValue = value.trim();

    if (BET_RESULTS.includes(normalizedValue as BetResult)) {
      return normalizedValue as BetResult;
    }

    if (normalizedValue in LEGACY_RESULT_MAP) {
      return LEGACY_RESULT_MAP[normalizedValue];
    }
  }

  return 'not_played';
}

function normalizeDate(value: unknown) {
  const rawDate = normalizeString(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(rawDate) ? rawDate : getTodayDateString();
}

function createUniqueId(rawId: unknown, index: number, usedIds: Set<string>) {
  const baseId = normalizeString(rawId, `restored-${index + 1}`).trim() || `restored-${index + 1}`;

  if (!usedIds.has(baseId)) {
    usedIds.add(baseId);
    return baseId;
  }

  let suffix = 2;
  let nextId = `${baseId}-${suffix}`;

  while (usedIds.has(nextId)) {
    suffix += 1;
    nextId = `${baseId}-${suffix}`;
  }

  usedIds.add(nextId);
  return nextId;
}

export function normalizeInitialBank(value: unknown) {
  return roundMoney(normalizeNumber(value, DEFAULT_INITIAL_BANK, 0));
}

function normalizeStoredBet(
  value: unknown,
  index: number,
  usedIds: Set<string>,
): BetEntry | null {
  if (!isRecord(value)) {
    return null;
  }

  return {
    id: createUniqueId(value.id, index, usedIds),
    date: normalizeDate(value.date),
    event: normalizeString(value.event).trim(),
    selection: normalizeString(value.selection).trim(),
    odds: roundMoney(normalizeNumber(value.odds, 2, 1.01)),
    edgePercent: roundMoney(normalizeNumber(value.edgePercent, 0, 0)),
    sampleSize: Math.round(normalizeNumber(value.sampleSize, 0, 0)),
    marketType: normalizeEnum<MarketType>(value.marketType, MARKET_TYPES, 'outcomes'),
    leagueType: normalizeEnum<LeagueType>(value.leagueType, LEAGUE_TYPES, 'top'),
    leagueName: normalizeString(value.leagueName).trim(),
    suspiciousMarket: normalizeBoolean(value.suspiciousMarket),
    unstableLeague: normalizeBoolean(value.unstableLeague),
    highRisk: normalizeBoolean(value.highRisk),
    result: normalizeResult(value.result),
  };
}

export function normalizeStoredBets(value: unknown): BetEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const usedIds = new Set<string>();

  return value
    .map((entry, index) => normalizeStoredBet(entry, index, usedIds))
    .filter((entry): entry is BetEntry => entry !== null);
}

export function getDemoBets(): BetEntry[] {
  return [
    {
      id: 'demo-1',
      date: '2026-03-18',
      event: 'Arsenal - Chelsea',
      selection: 'П1',
      odds: 2.2,
      edgePercent: 6.4,
      sampleSize: 140,
      marketType: 'outcomes',
      leagueType: 'top',
      leagueName: 'Premier League',
      suspiciousMarket: false,
      unstableLeague: false,
      highRisk: false,
      result: 'won',
    },
    {
      id: 'demo-2',
      date: '2026-03-19',
      event: 'Atalanta - Torino',
      selection: 'ТБ 2.5',
      odds: 1.95,
      edgePercent: 4.1,
      sampleSize: 88,
      marketType: 'totals',
      leagueType: 'top',
      leagueName: 'Serie A',
      suspiciousMarket: false,
      unstableLeague: false,
      highRisk: false,
      result: 'lost',
    },
    {
      id: 'demo-3',
      date: '2026-03-20',
      event: 'Vaxjo - Frolunda',
      selection: 'П2',
      odds: 3.4,
      edgePercent: 8.8,
      sampleSize: 44,
      marketType: 'outcomes',
      leagueType: 'mid',
      leagueName: 'SHL',
      suspiciousMarket: false,
      unstableLeague: false,
      highRisk: false,
      result: 'refund',
    },
    {
      id: 'demo-4',
      date: '2026-03-21',
      event: 'Spokane - Everett',
      selection: 'ТМ 6.5',
      odds: 2.7,
      edgePercent: 9.2,
      sampleSize: 76,
      marketType: 'totals',
      leagueType: 'youth_low',
      leagueName: 'WHL',
      suspiciousMarket: false,
      unstableLeague: false,
      highRisk: true,
      result: 'not_played',
    },
    {
      id: 'demo-5',
      date: '2026-03-22',
      event: 'Junior Cup',
      selection: 'Угловые ТБ 10.5',
      odds: 7.4,
      edgePercent: 12.5,
      sampleSize: 120,
      marketType: 'corners_periods',
      leagueType: 'youth_low',
      leagueName: 'Junior League',
      suspiciousMarket: true,
      unstableLeague: false,
      highRisk: true,
      result: 'not_played',
    },
  ];
}
