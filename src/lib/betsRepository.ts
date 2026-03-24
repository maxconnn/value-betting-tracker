import type { BetEntry, RecalculatedBet } from '../types/bet';
import { recalculateBankroll } from '../utils/betting';
import { normalizeStoredBets } from '../utils/storage';
import { isSupabaseConfigured, supabase } from './supabase';

type SupabaseBetRow = {
  id?: string | null;
  sort_order?: number | null;
  date?: string | null;
  event?: string | null;
  selection?: string | null;
  odds?: number | string | null;
  edge_percent?: number | string | null;
  sample_size?: number | string | null;
  market_type?: string | null;
  league_type?: string | null;
  league_name?: string | null;
  suspicious_market?: boolean | string | number | null;
  unstable_league?: boolean | string | number | null;
  high_risk?: boolean | string | number | null;
  result?: string | null;
};

type SupabaseBetWriteRow = {
  id: string;
  sort_order: number;
  date: string;
  event: string;
  selection: string;
  odds: number;
  edge_percent: number;
  sample_size: number;
  market_type: BetEntry['marketType'];
  league_type: BetEntry['leagueType'];
  league_name: string;
  suspicious_market: boolean;
  unstable_league: boolean;
  high_risk: boolean;
  result: BetEntry['result'];
  stake_amount: number;
  profit: number;
  bankroll_before: number;
  bankroll_after: number;
  base_stake_percent: number;
  sample_multiplier: number;
  odds_multiplier: number;
  market_multiplier: number;
  league_multiplier: number;
  risk_multiplier: number;
  is_skip: boolean;
  skip_reason: string | null;
  classification: RecalculatedBet['classification'];
};

function getSupabaseClient() {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase client is not configured.');
  }

  return supabase;
}

function mapSupabaseRowToBet(row: SupabaseBetRow, index: number) {
  const [normalizedBet] = normalizeStoredBets([
    {
      id: row.id ?? `supabase-${index + 1}`,
      date: row.date,
      event: row.event,
      selection: row.selection,
      odds: row.odds,
      edgePercent: row.edge_percent,
      sampleSize: row.sample_size,
      marketType: row.market_type,
      leagueType: row.league_type,
      leagueName: row.league_name,
      suspiciousMarket: row.suspicious_market,
      unstableLeague: row.unstable_league,
      highRisk: row.high_risk,
      result: row.result,
    },
  ]);

  return normalizedBet ?? null;
}

function mapRecalculatedBetToRow(bet: RecalculatedBet, index: number): SupabaseBetWriteRow {
  return {
    id: bet.id,
    sort_order: index + 1,
    date: bet.date,
    event: bet.event,
    selection: bet.selection,
    odds: bet.odds,
    edge_percent: bet.edgePercent,
    sample_size: bet.sampleSize,
    market_type: bet.marketType,
    league_type: bet.leagueType,
    league_name: bet.leagueName,
    suspicious_market: bet.suspiciousMarket,
    unstable_league: bet.unstableLeague,
    high_risk: bet.highRisk,
    result: bet.result,
    stake_amount: bet.stakeAmount,
    profit: bet.profit,
    bankroll_before: bet.bankrollBefore,
    bankroll_after: bet.bankrollAfter,
    base_stake_percent: bet.baseStakePercent,
    sample_multiplier: bet.sampleMultiplier,
    odds_multiplier: bet.oddsMultiplier,
    market_multiplier: bet.marketMultiplier,
    league_multiplier: bet.leagueMultiplier,
    risk_multiplier: bet.riskMultiplier,
    is_skip: bet.isSkip,
    skip_reason: bet.skipReason,
    classification: bet.classification,
  };
}

export async function fetchBetsFromSupabase() {
  const client = getSupabaseClient();
  const { data, error } = await client.from('bets').select('*').order('sort_order', {
    ascending: true,
  });

  if (error) {
    throw error;
  }

  return ((data ?? []) as SupabaseBetRow[])
    .map((row, index) => mapSupabaseRowToBet(row, index))
    .filter((bet): bet is BetEntry => bet !== null);
}

export async function syncBetsToSupabase(
  bets: ReadonlyArray<BetEntry>,
  initialBank: number,
) {
  const client = getSupabaseClient();
  const recalculatedBets = recalculateBankroll(initialBank, bets);
  const rows = recalculatedBets.map((bet, index) => mapRecalculatedBetToRow(bet, index));

  if (rows.length > 0) {
    const { error: upsertError } = await client.from('bets').upsert(rows, {
      onConflict: 'id',
    });

    if (upsertError) {
      throw upsertError;
    }
  }

  const { data: existingRows, error: existingRowsError } = await client.from('bets').select('id');

  if (existingRowsError) {
    throw existingRowsError;
  }

  const currentIds = new Set(rows.map((row) => row.id));
  const staleIds = (existingRows ?? [])
    .map((row) => String((row as { id?: string | number | null }).id ?? ''))
    .filter((id) => id && !currentIds.has(id));

  if (staleIds.length > 0) {
    const { error: deleteError } = await client.from('bets').delete().in('id', staleIds);

    if (deleteError) {
      throw deleteError;
    }
  }

  return recalculatedBets;
}
