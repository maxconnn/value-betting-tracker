export var BET_RESULTS = ['not_played', 'won', 'lost', 'refund'];
export var MARKET_TYPES = [
    'outcomes',
    'handicaps',
    'totals',
    'individual_totals',
    'individual_handicaps',
    'corners',
    'periods',
];
export var LEAGUE_TYPES = ['top', 'mid', 'youth_low'];
export var BET_CLASSIFICATIONS = ['green', 'yellow', 'red', 'skip'];
export function getTodayDateString() {
    var now = new Date();
    var normalized = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return normalized.toISOString().slice(0, 10);
}
export function createEmptyBetDraft() {
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
