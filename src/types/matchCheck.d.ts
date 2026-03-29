export declare const MATCH_CHECK_STATUSES: readonly ["not_started", "live", "finished", "not_found", "plan_limited"];
export declare const MATCH_CHECK_DISPLAY_STATUSES: readonly ["not_started", "live", "finished", "not_found", "plan_limited", "checking"];
export type MatchCheckStatus = (typeof MATCH_CHECK_STATUSES)[number];
export type MatchCheckDisplayStatus = (typeof MATCH_CHECK_DISPLAY_STATUSES)[number];
export interface MatchCheckRequest {
    sport: string;
    date: string;
    time: string;
    event: string;
    leagueName?: string;
}
export interface MatchCheckResponse {
    status: MatchCheckStatus;
    fixtureId?: number;
    apiStatus?: string;
    matchedEvent?: string;
    firstTeamScore?: number;
    secondTeamScore?: number;
}
export interface BetMatchCheckState {
    status: MatchCheckDisplayStatus;
    requestKey: string;
}
