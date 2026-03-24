import type { BetClassification, BetEntry, RecalculatedBet } from '../types/bet';
import { recalculateBankroll } from '../utils/betting';
import { normalizeStoredBets } from '../utils/storage';
import { isSupabaseConfigured, supabase } from './supabase';

type SupabaseBetRow = {
  id?: string | null;
  sort_order?: number | null;
  date?: string | null;
  event?: string | null;
  market?: string | null;
  odds?: number | string | null;
  value_percent?: number | string | null;
  sample_size?: number | string | null;
  market_type?: string | null;
  league_type?: string | null;
  league_name?: string | null;
  is_suspicious?: boolean | string | number | null;
  is_high_risk?: boolean | string | number | null;
  result?: string | null;
  stake_amount?: number | string | null;
  profit?: number | string | null;
  bankroll_after?: number | string | null;
  notes?: string | null;
};

type SupabaseBetWriteRow = {
  id: string;
  sort_order: number;
  date: string;
  event: string;
  market: string;
  odds: number;
  value_percent: number;
  sample_size: number;
  market_type: BetEntry['marketType'];
  league_type: BetEntry['leagueType'];
  league_name: string;
  is_suspicious: boolean;
  is_high_risk: boolean;
  result: string;
  stake_amount: number;
  profit: number;
  bankroll_after: number;
  classification: string;
  notes: string;
};

interface PersistedNotesPayload {
  unstableLeague: boolean;
  classification: BetClassification;
  skipReason: string | null;
  bankrollBefore: number;
  baseStakePercent: number;
  sampleMultiplier: number;
  oddsMultiplier: number;
  marketMultiplier: number;
  leagueMultiplier: number;
  riskMultiplier: number;
  isSkip: boolean;
}

const SUPABASE_SELECT_COLUMNS = [
  'id',
  'sort_order',
  'date',
  'event',
  'market',
  'odds',
  'value_percent',
  'sample_size',
  'market_type',
  'league_type',
  'league_name',
  'is_suspicious',
  'is_high_risk',
  'result',
  'stake_amount',
  'profit',
  'bankroll_after',
  'notes',
].join(',');

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const resultToSupabaseMap: Record<BetEntry['result'], string> = {
  not_played: 'Не сыграно',
  won: 'Выиграно',
  lost: 'Проиграно',
  refund: 'Возврат',
};

const classificationToSupabaseMap: Record<BetClassification, string> = {
  green: 'Зелёная',
  yellow: 'Жёлтая',
  red: 'Красная',
  skip: 'Пропуск',
};

function debugLog(event: string, payload?: unknown) {
  if (payload === undefined) {
    console.debug(`[Supabase bets] ${event}`);
    return;
  }

  console.debug(`[Supabase bets] ${event}`, payload);
}

function debugError(event: string, error: unknown, payload?: unknown) {
  if (payload === undefined) {
    console.error(`[Supabase bets] ${event}`, error);
    return;
  }

  console.error(`[Supabase bets] ${event}`, error, payload);
}

function getSupabaseClient() {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase client is not configured.');
  }

  return supabase;
}

function isUuid(value: string) {
  return uuidPattern.test(value.trim());
}

function createUuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function parseNotes(value: unknown): Partial<PersistedNotesPayload> {
  if (typeof value !== 'string' || value.trim() === '') {
    return {};
  }

  try {
    const parsedValue = JSON.parse(value) as unknown;
    return typeof parsedValue === 'object' && parsedValue !== null
      ? (parsedValue as Partial<PersistedNotesPayload>)
      : {};
  } catch (error) {
    debugError('notes:parse-error', error, value);
    return {};
  }
}

function buildNotesPayload(bet: RecalculatedBet): PersistedNotesPayload {
  return {
    unstableLeague: bet.unstableLeague,
    classification: bet.classification,
    skipReason: bet.skipReason,
    bankrollBefore: bet.bankrollBefore,
    baseStakePercent: bet.baseStakePercent,
    sampleMultiplier: bet.sampleMultiplier,
    oddsMultiplier: bet.oddsMultiplier,
    marketMultiplier: bet.marketMultiplier,
    leagueMultiplier: bet.leagueMultiplier,
    riskMultiplier: bet.riskMultiplier,
    isSkip: bet.isSkip,
  };
}

function mapSupabaseRowToBet(row: SupabaseBetRow) {
  const notes = parseNotes(row.notes);
  const [normalizedBet] = normalizeStoredBets([
    {
      id: row.id ?? createUuid(),
      date: row.date,
      event: row.event,
      selection: row.market,
      odds: row.odds,
      edgePercent: row.value_percent,
      sampleSize: row.sample_size,
      marketType: row.market_type,
      leagueType: row.league_type,
      leagueName: row.league_name,
      suspiciousMarket: row.is_suspicious,
      unstableLeague: notes.unstableLeague,
      highRisk: row.is_high_risk,
      result: row.result,
    },
  ]);

  if (!normalizedBet) {
    return null;
  }

  return {
    ...normalizedBet,
    id: isUuid(normalizedBet.id) ? normalizedBet.id : createUuid(),
  };
}

function mapRecalculatedBetToRow(bet: RecalculatedBet, index: number): SupabaseBetWriteRow {
  return {
    id: bet.id,
    sort_order: index + 1,
    date: bet.date,
    event: bet.event,
    market: bet.selection,
    odds: bet.odds,
    value_percent: bet.edgePercent,
    sample_size: bet.sampleSize,
    market_type: bet.marketType,
    league_type: bet.leagueType,
    league_name: bet.leagueName,
    is_suspicious: bet.suspiciousMarket,
    is_high_risk: bet.highRisk,
    result: resultToSupabaseMap[bet.result],
    stake_amount: bet.stakeAmount,
    profit: bet.profit,
    bankroll_after: bet.bankrollAfter,
    classification: classificationToSupabaseMap[bet.classification],
    notes: JSON.stringify(buildNotesPayload(bet)),
  };
}

export function ensureSupabaseCompatibleBetIds(
  bets: ReadonlyArray<BetEntry>,
): BetEntry[] {
  return bets.map((bet) => ({
    ...bet,
    id: isUuid(bet.id) ? bet.id : createUuid(),
  }));
}

export async function fetchBetsFromSupabase() {
  const client = getSupabaseClient();

  debugLog('load:start');
  const { data, error } = await client
    .from('bets')
    .select(SUPABASE_SELECT_COLUMNS)
    .order('sort_order', {
      ascending: true,
    });

  if (error) {
    debugError('load:error', error);
    throw error;
  }

  const bets = ((data ?? []) as SupabaseBetRow[])
    .map((row) => mapSupabaseRowToBet(row))
    .filter((bet): bet is BetEntry => bet !== null);

  debugLog('load:success', { rows: bets.length });
  return bets;
}

export async function syncBetsToSupabase(
  bets: ReadonlyArray<BetEntry>,
  initialBank: number,
) {
  const client = getSupabaseClient();
  const normalizedBets = ensureSupabaseCompatibleBetIds(bets);
  const recalculatedBets = recalculateBankroll(initialBank, normalizedBets);
  const rows = recalculatedBets.map((bet, index) => mapRecalculatedBetToRow(bet, index));

  debugLog('sync:start', {
    rows: rows.length,
  });

  const { data: existingRows, error: existingRowsError } = await client
    .from('bets')
    .select('id');

  if (existingRowsError) {
    debugError('load-existing-ids:error', existingRowsError);
    throw existingRowsError;
  }

  const existingIds = new Set(
    (existingRows ?? [])
      .map((row) => String((row as { id?: string | null }).id ?? ''))
      .filter((id) => isUuid(id)),
  );

  const nextIds = new Set(rows.map((row) => row.id));
  const rowsToInsert = rows.filter((row) => !existingIds.has(row.id));
  const rowsToUpdate = rows.filter((row) => existingIds.has(row.id));
  const idsToDelete = [...existingIds].filter((id) => !nextIds.has(id));

  if (idsToDelete.length > 0) {
    const { error: deleteError } = await client.from('bets').delete().in('id', idsToDelete);

    if (deleteError) {
      debugError('delete:error', deleteError, { ids: idsToDelete });
      throw deleteError;
    }

    debugLog('delete:success', { count: idsToDelete.length, ids: idsToDelete });
  }

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await client.from('bets').insert(rowsToInsert);

    if (insertError) {
      debugError('insert:error', insertError, {
        ids: rowsToInsert.map((row) => row.id),
        rows: rowsToInsert,
      });
      throw insertError;
    }

    debugLog('insert:success', { count: rowsToInsert.length, ids: rowsToInsert.map((row) => row.id) });
  }

  if (rowsToUpdate.length > 0) {
    for (const row of rowsToUpdate) {
      const { id, ...updatePayload } = row;
      const { error: updateError } = await client.from('bets').update(updatePayload).eq('id', id);

      if (updateError) {
        debugError('update:error', updateError, { id, row });
        throw updateError;
      }
    }

    debugLog('update:success', { count: rowsToUpdate.length, ids: rowsToUpdate.map((row) => row.id) });
  }

  debugLog('sync:success', {
    inserted: rowsToInsert.length,
    updated: rowsToUpdate.length,
    deleted: idsToDelete.length,
  });

  return normalizedBets;
}
