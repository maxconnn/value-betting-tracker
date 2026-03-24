import type {
  AnalyticsGroupItem,
  BetClassification,
  BettingAnalyticsSummary,
  ChartPoint,
  MarketType,
  RecalculatedBet,
} from '../types/bet';
import {
  classificationLabels,
  leagueTypeLabels,
  marketTypeLabels,
} from './format';

function roundMetric(value: number) {
  return Math.round(value * 100) / 100;
}

type GroupAccumulator = {
  key: string;
  label: string;
  rows: number;
  settledRows: number;
  wins: number;
  losses: number;
  openRows: number;
  totalStake: number;
  totalProfit: number;
};

function toAnalyticsItem(group: GroupAccumulator): AnalyticsGroupItem {
  const winRateBase = group.wins + group.losses;

  return {
    ...group,
    totalStake: roundMetric(group.totalStake),
    totalProfit: roundMetric(group.totalProfit),
    roi: group.totalStake > 0 ? roundMetric((group.totalProfit / group.totalStake) * 100) : 0,
    winRate: winRateBase > 0 ? roundMetric((group.wins / winRateBase) * 100) : 0,
  };
}

function buildGroupedAnalytics(
  bets: RecalculatedBet[],
  getGroup: (bet: RecalculatedBet) => { key: string; label: string },
) {
  const groups = new Map<string, GroupAccumulator>();

  bets.forEach((bet) => {
    const { key, label } = getGroup(bet);
    const current =
      groups.get(key) ??
      ({
        key,
        label,
        rows: 0,
        settledRows: 0,
        wins: 0,
        losses: 0,
        openRows: 0,
        totalStake: 0,
        totalProfit: 0,
      } satisfies GroupAccumulator);

    current.rows += 1;
    current.totalProfit += bet.profit;

    if (bet.result === 'won') {
      current.wins += 1;
      current.settledRows += 1;
      current.totalStake += bet.stakeAmount;
    } else if (bet.result === 'lost') {
      current.losses += 1;
      current.settledRows += 1;
      current.totalStake += bet.stakeAmount;
    } else if (bet.result === 'refund') {
      current.settledRows += 1;
      current.totalStake += bet.stakeAmount;
    } else {
      current.openRows += 1;
    }

    groups.set(key, current);
  });

  return Array.from(groups.values()).map(toAnalyticsItem);
}

function sortAnalytics(items: AnalyticsGroupItem[]) {
  return [...items].sort((left, right) => {
    if (right.totalProfit !== left.totalProfit) {
      return right.totalProfit - left.totalProfit;
    }

    if (right.roi !== left.roi) {
      return right.roi - left.roi;
    }

    return right.rows - left.rows;
  });
}

export function buildBankrollChart(bets: RecalculatedBet[], initialBank: number): ChartPoint[] {
  const chart: ChartPoint[] = [
    {
      label: 'Старт',
      bankroll: roundMetric(initialBank),
      profit: 0,
      isSkip: false,
      result: 'start',
    },
  ];

  bets.forEach((bet) => {
    chart.push({
      label: `#${bet.index}`,
      bankroll: roundMetric(bet.bankrollAfter),
      profit: roundMetric(bet.profit),
      isSkip: bet.isSkip,
      result: bet.result,
    });
  });

  return chart;
}

export function buildBettingAnalytics(
  bets: RecalculatedBet[],
  initialBank: number,
): BettingAnalyticsSummary {
  const activeBets = bets.filter((bet) => !bet.isSkip);
  const settledActiveBets = activeBets.filter((bet) => bet.result !== 'not_played');
  const marketAnalytics = sortAnalytics(
    buildGroupedAnalytics(activeBets, (bet) => ({
      key: bet.marketType,
      label: marketTypeLabels[bet.marketType as MarketType],
    })),
  );

  const classificationAnalytics = sortAnalytics(
    buildGroupedAnalytics(bets, (bet) => ({
      key: bet.classification,
      label: classificationLabels[bet.classification as BetClassification],
    })),
  );

  const leagueAnalytics = sortAnalytics(
    buildGroupedAnalytics(activeBets, (bet) => ({
      key: bet.leagueName.trim().toLowerCase() || `league-type:${bet.leagueType}`,
      label: bet.leagueName.trim() || leagueTypeLabels[bet.leagueType],
    })),
  );

  const betTypeAnalytics = sortAnalytics(
    buildGroupedAnalytics(settledActiveBets, (bet) => ({
      key: bet.selection.trim().toLowerCase() || 'unknown-selection',
      label: bet.selection.trim() || 'Без типа ставки',
    })),
  );

  return {
    bankrollChart: buildBankrollChart(bets, initialBank),
    bestBetTypes: betTypeAnalytics.slice(0, 5),
    worstBetTypes: [...betTypeAnalytics].reverse().slice(0, 5),
    marketAnalytics: marketAnalytics.slice(0, 8),
    classificationAnalytics,
    leagueAnalytics: leagueAnalytics.slice(0, 8),
  };
}
