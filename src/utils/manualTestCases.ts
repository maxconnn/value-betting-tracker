import type { BetEntry } from '../types/bet';

export interface ManualAuditCase {
  name: string;
  initialBank: number;
  bets: BetEntry[];
  expected: {
    stakeAmounts: number[];
    profits: number[];
    bankrollAfterRows: number[];
    notes: string[];
  };
}

/**
 * Manual audit checklist for the bankroll logic.
 * These cases are stored next to the domain logic so they can be checked after any refactor,
 * even in environments where an automated runner is not available yet.
 */
export const manualAuditCases: ManualAuditCase[] = [
  {
    name: 'top_down_recalculation_with_win_and_loss',
    initialBank: 500,
    bets: [
      {
        id: 'case-1-row-1',
        date: '2026-03-24',
        event: 'Case 1 / Row 1',
        selection: 'П1',
        odds: 2.2,
        edgePercent: 5,
        sampleSize: 100,
        marketType: 'outcomes',
        leagueType: 'top',
        leagueName: 'Premier League',
        suspiciousMarket: false,
        unstableLeague: false,
        highRisk: false,
        result: 'won',
      },
      {
        id: 'case-1-row-2',
        date: '2026-03-25',
        event: 'Case 1 / Row 2',
        selection: 'ТБ 2.5',
        odds: 2,
        edgePercent: 5,
        sampleSize: 100,
        marketType: 'totals',
        leagueType: 'top',
        leagueName: 'Serie A',
        suspiciousMarket: false,
        unstableLeague: false,
        highRisk: false,
        result: 'lost',
      },
    ],
    expected: {
      stakeAmounts: [4.5, 4],
      profits: [5.4, -4],
      bankrollAfterRows: [505.4, 501.4],
      notes: ['Вторая строка обязана считать сумму от банка 505.40, а не от стартовых 500.00.'],
    },
  },
  {
    name: 'not_played_keeps_bankroll_unchanged',
    initialBank: 500,
    bets: [
      {
        id: 'case-2-row-1',
        date: '2026-03-24',
        event: 'Case 2 / Row 1',
        selection: 'П2',
        odds: 2,
        edgePercent: 12,
        sampleSize: 200,
        marketType: 'outcomes',
        leagueType: 'top',
        leagueName: 'La Liga',
        suspiciousMarket: false,
        unstableLeague: false,
        highRisk: false,
        result: 'not_played',
      },
    ],
    expected: {
      stakeAmounts: [10],
      profits: [0],
      bankrollAfterRows: [500],
      notes: ['Не сыграно хранится в журнале, но не двигает банк вверх или вниз.'],
    },
  },
  {
    name: 'skip_row_stays_zero_and_does_not_break_next_row',
    initialBank: 500,
    bets: [
      {
        id: 'case-3-row-1',
        date: '2026-03-24',
        event: 'Case 3 / Row 1',
        selection: 'П1',
        odds: 2,
        edgePercent: 2,
        sampleSize: 200,
        marketType: 'outcomes',
        leagueType: 'top',
        leagueName: 'Bundesliga',
        suspiciousMarket: false,
        unstableLeague: false,
        highRisk: false,
        result: 'won',
      },
      {
        id: 'case-3-row-2',
        date: '2026-03-25',
        event: 'Case 3 / Row 2',
        selection: 'Ф2 (+1.5)',
        odds: 2,
        edgePercent: 5,
        sampleSize: 100,
        marketType: 'handicaps',
        leagueType: 'top',
        leagueName: 'Bundesliga',
        suspiciousMarket: false,
        unstableLeague: false,
        highRisk: false,
        result: 'won',
      },
    ],
    expected: {
      stakeAmounts: [0, 4],
      profits: [0, 4],
      bankrollAfterRows: [500, 504],
      notes: ['Первая строка является пропуском: сумма 0, profit 0, вторая строка стартует от тех же 500.00.'],
    },
  },
  {
    name: 'refund_must_return_zero_profit',
    initialBank: 500,
    bets: [
      {
        id: 'case-4-row-1',
        date: '2026-03-24',
        event: 'Case 4 / Row 1',
        selection: 'ТБ 2.5',
        odds: 2.5,
        edgePercent: 12,
        sampleSize: 100,
        marketType: 'totals',
        leagueType: 'top',
        leagueName: 'Ligue 1',
        suspiciousMarket: false,
        unstableLeague: false,
        highRisk: false,
        result: 'refund',
      },
    ],
    expected: {
      stakeAmounts: [8],
      profits: [0],
      bankrollAfterRows: [500],
      notes: ['Возврат не должен менять банк даже при ненулевой сумме ставки.'],
    },
  },
];

/**
 * Additional operational checks that should stay green after manual QA:
 * 1. Edit row 1 from "lost" to "won" and confirm that all rows below receive new bankrollBefore values.
 * 2. Delete a row from the middle and confirm that numbering closes the gap and lower bankrolls are recalculated.
 * 3. Change the initial bankroll from 500 to 1000 and confirm that every stake amount is recalculated from row 1.
 * 4. Restore storage with duplicate ids or numeric fields stored as strings and confirm that the app self-heals.
 */
