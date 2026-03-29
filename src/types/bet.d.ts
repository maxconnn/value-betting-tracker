export declare const BET_RESULTS: readonly ["not_played", "won", "lost", "refund"];
export declare const MARKET_TYPES: readonly ["outcomes", "handicaps", "totals", "individual_totals", "individual_handicaps", "corners", "periods"];
export declare const LEAGUE_TYPES: readonly ["top", "mid", "youth_low"];
export declare const BET_CLASSIFICATIONS: readonly ["green", "yellow", "red", "skip"];
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
export declare function getTodayDateString(): string;
export declare function createEmptyBetDraft(): BetDraft;
