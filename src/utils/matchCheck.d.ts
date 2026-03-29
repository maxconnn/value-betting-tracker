import type { MatchCheckDisplayStatus, MatchCheckRequest, MatchCheckResponse } from '../types/matchCheck';
interface MatchCheckEnvironment {
    sportsApiKey?: string;
    sportsApiFootballBaseUrl?: string;
    sportsApiBasketballBaseUrl?: string;
    sportsApiHockeyBaseUrl?: string;
}
interface MatchCheckOptions {
    debugLog?: (event: string, payload: unknown) => void;
}
export declare const MATCH_CHECK_REQUEST_TIMEOUT_MS = 12000;
export declare const matchCheckStatusLabels: Record<MatchCheckDisplayStatus, string>;
export declare const matchCheckStatusBadgeStyles: Record<MatchCheckDisplayStatus, string>;
type SupportedOutcomeSettlementResult = 'won' | 'lost' | 'refund';
export declare function isFootballSport(value: string): boolean;
export declare function isSupportedMatchCheckSport(value: string): boolean;
export declare function normalizeEventName(value: string): string;
export declare function splitEventTeams(value: string): readonly [string, string];
export declare function getMatchCheckRequestKey(request: Pick<MatchCheckRequest, 'sport' | 'date' | 'time' | 'event' | 'leagueName'>): string;
export declare function getSupportedMarketSettlementResult(marketType: string, selection: string, matchCheck: Pick<MatchCheckResponse, 'status' | 'firstTeamScore' | 'secondTeamScore'>): SupportedOutcomeSettlementResult | null;
export declare function checkMatchStatus(request: Partial<MatchCheckRequest> | null | undefined, env: MatchCheckEnvironment, fetchImpl?: typeof fetch, options?: MatchCheckOptions): Promise<MatchCheckResponse>;
export declare const checkFootballMatchStatus: typeof checkMatchStatus;
export {};
