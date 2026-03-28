export const BET_RESULTS = ['not_played', 'won', 'lost', 'refund'] as const;
export const MARKET_TYPES = [
  'outcomes',
  'handicaps',
  'totals',
  'individual_totals',
  'individual_handicaps',
  'corners',
  'periods',
] as const;
export const LEAGUE_TYPES = ['top', 'mid', 'youth_low'] as const;
export const BET_CLASSIFICATIONS = ['green', 'yellow', 'red', 'skip'] as const;

export type BetResult = (typeof BET_RESULTS)[number];
export type MarketType = (typeof MARKET_TYPES)[number];
export type LeagueType = (typeof LEAGUE_TYPES)[number];
export type BetClassification = (typeof BET_CLASSIFICATIONS)[number];
export type ResultFilterOption = BetResult | 'all';
export type ClassificationFilterOption = BetClassification | 'all';
export type ThemeMode = 'light' | 'dark';

export interface BetEntry {
  id: string;
  bookmaker: string;
  sport: string;
  date: string;
  time: string;
  event: string;
  selection: string;
  odds: number;
  probability: number;
  edgePercent: number;
  sampleSize: number;
  marketType: MarketType;
  leagueType: LeagueType;
  leagueName: string;
  suspiciousMarket: boolean;
  unstableLeague: boolean;
  highRisk: boolean;
  result: BetResult;
}

export type BetDraft = Omit<BetEntry, 'id'>;

export interface StakeCalculation {
  bankrollBefore: number;
  bankrollAfter: number;
  stakeAmount: number;
  profit: number;
  baseStakePercent: number;
  sampleMultiplier: number;
  oddsMultiplier: number;
  marketMultiplier: number;
  leagueMultiplier: number;
  riskMultiplier: number;
  isSkip: boolean;
  skipReason: string | null;
  classification: BetClassification;
}

export interface RecalculatedBet extends BetEntry, StakeCalculation {
  index: number;
}

export interface BetStatsSummary {
  totalRows: number;
  activeRows: number;
  skipRows: number;
  openRows: number;
  totalProfit: number;
  currentBankroll: number;
  totalSettledStake: number;
  roi: number;
  winRate: number;
}

export interface JournalFilters {
  search: string;
  result: ResultFilterOption;
  classification: ClassificationFilterOption;
}

export interface ChartPoint {
  label: string;
  bankroll: number;
  profit: number;
  isSkip: boolean;
  result: BetResult | 'start';
}

export interface AnalyticsGroupItem {
  key: string;
  label: string;
  rows: number;
  settledRows: number;
  wins: number;
  losses: number;
  openRows: number;
  totalStake: number;
  totalProfit: number;
  roi: number;
  winRate: number;
}

export interface BettingAnalyticsSummary {
  bankrollChart: ChartPoint[];
  bestBetTypes: AnalyticsGroupItem[];
  worstBetTypes: AnalyticsGroupItem[];
  marketAnalytics: AnalyticsGroupItem[];
  classificationAnalytics: AnalyticsGroupItem[];
  leagueAnalytics: AnalyticsGroupItem[];
}

export function getTodayDateString() {
  const now = new Date();
  const normalized = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return normalized.toISOString().slice(0, 10);
}

export function createEmptyBetDraft(): BetDraft {
  return {
    bookmaker: '',
    sport: '',
    date: getTodayDateString(),
    time: '',
    event: '',
    selection: '',
    odds: 2,
    probability: 0,
    edgePercent: 5,
    sampleSize: 100,
    marketType: 'outcomes',
    leagueType: 'top',
    leagueName: '',
    suspiciousMarket: false,
    unstableLeague: false,
    highRisk: false,
    result: 'not_played',
  };
}
