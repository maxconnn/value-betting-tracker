import type {
  BetClassification,
  BetDraft,
  BetEntry,
  BetResult,
  BetStatsSummary,
  LeagueType,
  MarketType,
  RecalculatedBet,
} from '../types/bet';

const HIGH_RISK_LEAGUE_PATTERN = /(whl|mhl|junior|u17|u18|u19|u20|u21|u23|youth|academy)/i;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function roundToHalfEuro(value: number) {
  return Math.round(value * 2) / 2;
}

export function getBaseStakePercentByValue(edgePercent: number) {
  if (edgePercent < 3) return 0;
  if (edgePercent < 5) return 0.0075;
  if (edgePercent < 8) return 0.01;
  if (edgePercent < 12) return 0.015;
  return 0.02;
}

export function getSampleMultiplier(sampleSize: number) {
  if (sampleSize >= 200) return 1;
  if (sampleSize >= 100) return 0.9;
  if (sampleSize >= 50) return 0.8;
  if (sampleSize >= 30) return 0.7;
  return 0;
}

export function getOddsMultiplier(odds: number) {
  if (odds <= 3) return 1;
  if (odds <= 5) return 0.8;
  if (odds <= 7) return 0.6;
  return 0;
}

export function getMarketMultiplier(marketType: MarketType) {
  if (marketType === 'outcomes') return 1;
  return 0.9;
}

export function getLeagueMultiplier(leagueType: LeagueType) {
  if (leagueType === 'top') return 1;
  return 0.9;
}

export function isHighRiskLeague(leagueName: string) {
  return HIGH_RISK_LEAGUE_PATTERN.test(leagueName.trim());
}

export function getSkipReason(bet: BetDraft) {
  if (bet.edgePercent < 3) return 'Перевес ниже 3%';
  if (bet.sampleSize < 30) return 'Выборка ниже 30';
  if (bet.odds > 7) return 'Коэффициент выше 7.00';
  if (bet.unstableLeague) return 'Лига помечена как нестабильная';
  if (bet.suspiciousMarket) return 'Рынок помечен как подозрительный';
  return null;
}

export function getBetClassification(bet: BetDraft): BetClassification {
  if (getSkipReason(bet)) return 'skip';

  const riskyLeague = bet.highRisk || isHighRiskLeague(bet.leagueName);

  if (
    bet.edgePercent >= 8 &&
    bet.sampleSize >= 100 &&
    bet.odds <= 3 &&
    bet.leagueType === 'top' &&
    !riskyLeague
  ) {
    return 'green';
  }

  if (
    bet.edgePercent < 5 ||
    bet.sampleSize < 50 ||
    bet.odds > 5 ||
    bet.leagueType === 'youth_low' ||
    riskyLeague
  ) {
    return 'red';
  }

  return 'yellow';
}

export function calculateStakeAmount(bankroll: number, bet: BetDraft) {
  const baseStakePercent = getBaseStakePercentByValue(bet.edgePercent);
  const sampleMultiplier = getSampleMultiplier(bet.sampleSize);
  const oddsMultiplier = getOddsMultiplier(bet.odds);
  const marketMultiplier = getMarketMultiplier(bet.marketType);
  const leagueMultiplier = getLeagueMultiplier(bet.leagueType);
  const riskMultiplier = bet.highRisk || isHighRiskLeague(bet.leagueName) ? 0.8 : 1;
  const blockedByBankroll = bankroll <= 0;
  const skipReason = getSkipReason(bet) ?? (blockedByBankroll ? 'Банк равен 0' : null);
  const isSkip = Boolean(
    skipReason || baseStakePercent === 0 || sampleMultiplier === 0 || oddsMultiplier === 0,
  );
  const classification = isSkip ? 'skip' : getBetClassification(bet);

  if (isSkip) {
    return {
      stakeAmount: 0,
      baseStakePercent,
      sampleMultiplier,
      oddsMultiplier,
      marketMultiplier,
      leagueMultiplier,
      riskMultiplier,
      isSkip,
      skipReason,
      classification,
    };
  }

  const rawStake =
    bankroll *
    baseStakePercent *
    sampleMultiplier *
    oddsMultiplier *
    marketMultiplier *
    leagueMultiplier *
    riskMultiplier;

  let stakeAmount = roundToHalfEuro(rawStake);
  if (rawStake > 0 && stakeAmount < 1) {
    stakeAmount = 1;
  }

  return {
    stakeAmount: roundMoney(stakeAmount),
    baseStakePercent,
    sampleMultiplier,
    oddsMultiplier,
    marketMultiplier,
    leagueMultiplier,
    riskMultiplier,
    isSkip,
    skipReason,
    classification,
  };
}

export function calculateProfit(
  stakeAmount: number,
  odds: number,
  result: BetResult,
  isSkip = false,
) {
  if (isSkip || stakeAmount <= 0) return 0;
  if (result === 'won') return roundMoney(stakeAmount * (odds - 1));
  if (result === 'lost') return roundMoney(-stakeAmount);
  return 0;
}

// The bankroll must always be recalculated sequentially, row by row, from top to bottom.
export function recalculateBankroll(initialBank: number, bets: ReadonlyArray<BetEntry>) {
  let runningBank = roundMoney(initialBank);

  return bets.map((bet, rowIndex) => {
    const calculation = calculateStakeAmount(runningBank, bet);
    const profit = calculateProfit(
      calculation.stakeAmount,
      bet.odds,
      bet.result,
      calculation.isSkip,
    );
    const bankrollAfter = roundMoney(runningBank + profit);

    const row: RecalculatedBet = {
      ...bet,
      ...calculation,
      index: rowIndex + 1,
      bankrollBefore: runningBank,
      profit,
      bankrollAfter,
    };

    runningBank = bankrollAfter;
    return row;
  });
}

export function getBetStatsSummary(
  recalculatedBets: RecalculatedBet[],
  initialBank: number,
): BetStatsSummary {
  const lastBet = recalculatedBets[recalculatedBets.length - 1];
  const activeRows = recalculatedBets.filter((bet) => !bet.isSkip);
  const skipRows = recalculatedBets.length - activeRows.length;
  const openRows = activeRows.filter((bet) => bet.result === 'not_played').length;
  const wins = activeRows.filter((bet) => bet.result === 'won').length;
  const losses = activeRows.filter((bet) => bet.result === 'lost').length;
  const totalSettledStake = activeRows
    .filter((bet) => bet.result !== 'not_played')
    .reduce((sum, bet) => sum + bet.stakeAmount, 0);
  const totalProfit = recalculatedBets.reduce((sum, bet) => sum + bet.profit, 0);
  const winRateBase = wins + losses;

  return {
    totalRows: recalculatedBets.length,
    activeRows: activeRows.length,
    skipRows,
    openRows,
    totalProfit: roundMoney(totalProfit),
    currentBankroll: lastBet ? lastBet.bankrollAfter : roundMoney(initialBank),
    totalSettledStake: roundMoney(totalSettledStake),
    roi: totalSettledStake > 0 ? roundMoney((totalProfit / totalSettledStake) * 100) : 0,
    winRate: winRateBase > 0 ? roundMoney((wins / winRateBase) * 100) : 0,
  };
}
