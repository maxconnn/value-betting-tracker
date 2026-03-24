import { useEffect, useMemo, useRef, useState } from 'react';
import { AnalyticsGrid } from './components/AnalyticsGrid';
import { BankrollSettings } from './components/BankrollSettings';
import { BankrollChart } from './components/BankrollChart';
import { BetForm } from './components/BetForm';
import { BetsTable } from './components/BetsTable';
import { ConfirmDialog } from './components/ConfirmDialog';
import { JournalControls } from './components/JournalControls';
import { StatsCards } from './components/StatsCards';
import { useLocalStorage } from './hooks/useLocalStorage';
import { fetchBetsFromSupabase, syncBetsToSupabase } from './lib/betsRepository';
import { isSupabaseConfigured } from './lib/supabase';
import type { BetDraft, BetEntry, JournalFilters, ThemeMode } from './types/bet';
import { buildBettingAnalytics } from './utils/analytics';
import { getBetStatsSummary, recalculateBankroll } from './utils/betting';
import { downloadCsvFile, exportBetsToCsv, importBetsFromCsv } from './utils/csv';
import { formatCurrency } from './utils/format';
import {
  DEFAULT_INITIAL_BANK,
  STORAGE_KEYS,
  getDemoBets,
  normalizeInitialBank,
  normalizeStoredBets,
} from './utils/storage';

function createBetId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error === 'object' && error !== null) {
    const maybeMessage = 'message' in error ? error.message : null;
    if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
      return maybeMessage.trim();
    }
  }

  return 'Unknown Supabase error';
}

export default function App() {
  const [initialBank, setInitialBank] = useLocalStorage<number>(
    STORAGE_KEYS.initialBank,
    DEFAULT_INITIAL_BANK,
    { sanitize: normalizeInitialBank },
  );
  const [localBackupBets, setLocalBackupBets] = useLocalStorage<BetEntry[]>(
    STORAGE_KEYS.bets,
    getDemoBets,
    {
      sanitize: normalizeStoredBets,
    },
  );
  const [bets, setBets] = useState<BetEntry[]>(isSupabaseConfigured ? [] : localBackupBets);
  const [theme, setTheme] = useLocalStorage<ThemeMode>(STORAGE_KEYS.theme, 'light', {
    sanitize: (value) => (value === 'dark' ? 'dark' : 'light'),
  });
  const [isLoadingRemoteBets, setIsLoadingRemoteBets] = useState(isSupabaseConfigured);
  const [isSyncingRemoteBets, setIsSyncingRemoteBets] = useState(false);
  const [betsDataSource, setBetsDataSource] = useState<'supabase' | 'local_backup'>(
    isSupabaseConfigured ? 'supabase' : 'local_backup',
  );
  const [editingBetId, setEditingBetId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [filters, setFilters] = useState<JournalFilters>({
    search: '',
    result: 'all',
    classification: 'all',
  });
  const [notice, setNotice] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(
    null,
  );
  const hasHydratedSupabaseRef = useRef(false);

  const recalculatedBets = recalculateBankroll(initialBank, bets);
  const stats = getBetStatsSummary(recalculatedBets, initialBank);
  const analytics = useMemo(
    () => buildBettingAnalytics(recalculatedBets, initialBank),
    [initialBank, recalculatedBets],
  );
  const editingBet = recalculatedBets.find((bet) => bet.id === editingBetId) ?? null;
  const pendingDeleteBet = recalculatedBets.find((bet) => bet.id === pendingDeleteId) ?? null;
  const lastBet = recalculatedBets[recalculatedBets.length - 1];
  const bankrollAtBet = editingBet
    ? editingBet.bankrollBefore
    : lastBet?.bankrollAfter ?? initialBank;
  const visibleBets = useMemo(() => {
    const searchTerm = filters.search.trim().toLowerCase();

    return recalculatedBets.filter((bet) => {
      if (searchTerm && !bet.event.toLowerCase().includes(searchTerm)) {
        return false;
      }

      if (filters.result !== 'all' && bet.result !== filters.result) {
        return false;
      }

      if (filters.classification !== 'all' && bet.classification !== filters.classification) {
        return false;
      }

      return true;
    });
  }, [filters, recalculatedBets]);
  const betsDataSourceLabel =
    betsDataSource === 'supabase' ? 'Supabase' : 'Резервный localStorage';
  const betsSyncStatus = isLoadingRemoteBets
    ? 'Загружаем журнал из общей базы.'
    : isSyncingRemoteBets
      ? 'Изменения ставок синхронизируются с Supabase.'
      : betsDataSource === 'supabase'
        ? 'Ставки читаются и записываются в общую базу.'
        : 'При недоступности Supabase журнал продолжает работать локально.';

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    let isCancelled = false;

    async function hydrateBets() {
      if (!isSupabaseConfigured) {
        setBetsDataSource('local_backup');
        setIsLoadingRemoteBets(false);
        setNotice({
          tone: 'info',
          text: 'Supabase env не найдены. Журнал работает из резервного localStorage.',
        });
        return;
      }

      try {
        const remoteBets = await fetchBetsFromSupabase();

        if (isCancelled) {
          return;
        }

        if (remoteBets.length > 0) {
          setBets(remoteBets);
          setLocalBackupBets(remoteBets);
          setBetsDataSource('supabase');
          hasHydratedSupabaseRef.current = true;
          return;
        }

        const seedBets = localBackupBets.length > 0 ? localBackupBets : getDemoBets();

        if (seedBets.length > 0) {
          const syncedSeedBets = await syncBetsToSupabase(seedBets, initialBank);

          if (isCancelled) {
            return;
          }

          setBets(syncedSeedBets);
          setLocalBackupBets(syncedSeedBets);
          setBetsDataSource('supabase');
          hasHydratedSupabaseRef.current = true;
          setNotice({
            tone: 'info',
            text: 'Пустая таблица Supabase была инициализирована текущими ставками.',
          });
          return;
        }

        setBets(seedBets);
        setLocalBackupBets(seedBets);
        setBetsDataSource('supabase');
        hasHydratedSupabaseRef.current = true;
        setNotice({
          tone: 'info',
          text: 'Пустая таблица Supabase была инициализирована текущими ставками.',
        });
      } catch (error) {
        console.error('[Supabase bets] hydrate:error', error);

        if (isCancelled) {
          return;
        }

        setBetsDataSource('local_backup');
        setBets(localBackupBets);
        setNotice({
          tone: 'error',
          text: `Не удалось загрузить ставки из Supabase: ${getErrorMessage(error)}. Включён резервный localStorage.`,
        });
      } finally {
        if (!isCancelled) {
          setIsLoadingRemoteBets(false);
        }
      }
    }

    hydrateBets();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    setLocalBackupBets(bets);
  }, [bets, setLocalBackupBets]);

  useEffect(() => {
    if (!hasHydratedSupabaseRef.current || betsDataSource !== 'supabase') {
      return;
    }

    let isCancelled = false;

    async function syncSnapshot() {
      setIsSyncingRemoteBets(true);

      try {
        const syncedBets = await syncBetsToSupabase(bets, initialBank);

        if (isCancelled) {
          return;
        }

        setLocalBackupBets(syncedBets);
        const betsChanged =
          syncedBets.length !== bets.length ||
          syncedBets.some((bet, index) => bet.id !== bets[index]?.id);

        if (betsChanged) {
          setBets(syncedBets);
        }
      } catch (error) {
        console.error('[Supabase bets] sync:error', error);

        if (isCancelled) {
          return;
        }

        setBetsDataSource('local_backup');
        setNotice({
          tone: 'error',
          text: `Не удалось синхронизировать изменения с Supabase: ${getErrorMessage(error)}. Данные сохранены только локально.`,
        });
      } finally {
        if (!isCancelled) {
          setIsSyncingRemoteBets(false);
        }
      }
    }

    void syncSnapshot();

    return () => {
      isCancelled = true;
    };
  }, [bets, betsDataSource, initialBank]);

  function handleSaveBet(draft: BetDraft) {
    if (editingBetId) {
      setBets((current) =>
        current.map((bet) => (bet.id === editingBetId ? { ...draft, id: editingBetId } : bet)),
      );
      setEditingBetId(null);
      setNotice({ tone: 'success', text: 'Ставка обновлена без создания дубля.' });
      return;
    }

    setBets((current) => [...current, { ...draft, id: createBetId() }]);
    setNotice({ tone: 'success', text: 'Новая ставка добавлена в журнал.' });
  }

  function handleQuickSaveBet(id: string, draft: BetDraft) {
    setBets((current) => current.map((bet) => (bet.id === id ? { ...draft, id } : bet)));
    setNotice({ tone: 'success', text: 'Строка обновлена в быстром режиме.' });
  }

  function handleDeleteBet(id: string) {
    setBets((current) => current.filter((bet) => bet.id !== id));
    if (editingBetId === id) {
      setEditingBetId(null);
    }
  }

  function handleRequestDelete(id: string) {
    setPendingDeleteId(id);
  }

  function handleConfirmDelete() {
    if (!pendingDeleteId) {
      return;
    }

    handleDeleteBet(pendingDeleteId);
    setPendingDeleteId(null);
    setNotice({ tone: 'success', text: 'Строка удалена, нумерация и банк пересчитаны.' });
  }

  function handleExportCsv() {
    const csvContent = exportBetsToCsv(bets);
    const filename = `value-betting-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCsvFile(csvContent, filename);
    setNotice({ tone: 'info', text: 'CSV выгружен из текущего журнала.' });
  }

  async function handleImportCsv(file: File) {
    try {
      const text = await file.text();
      const importedBets = importBetsFromCsv(text);

      if (importedBets.length === 0) {
        setNotice({ tone: 'error', text: 'В CSV не найдено ни одной валидной строки.' });
        return;
      }

      setBets((current) => {
        const currentIds = current.map((bet) => bet.id);
        const mergedMap = new Map(current.map((bet) => [bet.id, bet]));

        importedBets.forEach((bet) => {
          mergedMap.set(bet.id, bet);
        });

        const newIds = importedBets
          .map((bet) => bet.id)
          .filter((id) => !currentIds.includes(id));

        return [...currentIds, ...newIds]
          .map((id) => mergedMap.get(id))
          .filter((bet): bet is BetEntry => Boolean(bet));
      });

      setNotice({
        tone: 'success',
        text: `Импортировано ${importedBets.length} строк. Совпавшие ID были обновлены.`,
      });
    } catch (error) {
      console.error(error);
      setNotice({ tone: 'error', text: 'Не удалось прочитать CSV-файл.' });
    }
  }

  function handleResetFilters() {
    setFilters({
      search: '',
      result: 'all',
      classification: 'all',
    });
    setNotice({ tone: 'info', text: 'Поиск и фильтры очищены.' });
  }

  function handleCloseDeleteDialog() {
    setPendingDeleteId(null);
  }

  function handleToggleTheme() {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'));
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <BetsTable
        bets={visibleBets}
        totalRows={recalculatedBets.length}
        hasActiveFilters={
          filters.search.trim() !== '' || filters.result !== 'all' || filters.classification !== 'all'
        }
        editingBetId={editingBetId}
        onEdit={(id) => setEditingBetId(id)}
        onQuickSave={handleQuickSaveBet}
        onDelete={handleRequestDelete}
      />

      <BetForm
        editingBet={editingBet}
        bankrollAtBet={bankrollAtBet}
        onSubmit={handleSaveBet}
        onCancelEdit={() => setEditingBetId(null)}
      />

      <section className="overflow-hidden rounded-[34px] border border-slate-900/10 bg-slate-900 text-white shadow-[0_25px_90px_rgba(15,23,42,0.24)]">
        <div className="grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr] lg:p-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent">
                Value betting tracker
              </p>
              <button
                className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/20"
                type="button"
                onClick={handleToggleTheme}
              >
                {theme === 'dark' ? 'Light mode' : 'Dark mode'}
              </button>
            </div>
            <h1 className="max-w-2xl text-4xl font-bold leading-tight md:text-5xl">
              Чистый рабочий журнал ставок с точным пересчётом банка.
            </h1>
            <p className="max-w-2xl text-base text-slate-300">
              Журнал загружает ставки из Supabase, а стартовый банк и тема остаются локально в
              браузере. Пересчёт каждой строки по-прежнему идёт строго сверху вниз.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Текущий банк</p>
              <p className="mt-3 text-3xl font-bold">{formatCurrency(stats.currentBankroll)}</p>
              <p className="mt-2 text-sm text-slate-300">Пересчитывается сверху вниз по всем строкам</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Источник данных</p>
              <p className="mt-3 text-lg font-semibold text-white">{betsDataSourceLabel}</p>
              <p className="mt-2 text-sm text-slate-300">{betsSyncStatus}</p>
            </div>
          </div>
        </div>
      </section>

      <BankrollSettings
        initialBank={initialBank}
        currentBankroll={stats.currentBankroll}
        rowsCount={stats.totalRows}
        onChange={(value) => setInitialBank(value)}
      />

      <StatsCards stats={stats} />
      <BankrollChart points={analytics.bankrollChart} />
      <AnalyticsGrid analytics={analytics} />

      <JournalControls
        filters={filters}
        totalRows={recalculatedBets.length}
        visibleRows={visibleBets.length}
        onChange={setFilters}
        onReset={handleResetFilters}
        onExport={handleExportCsv}
        onImport={handleImportCsv}
        notice={notice}
      />

      <ConfirmDialog
        open={Boolean(pendingDeleteBet)}
        title="Удалить строку из журнала?"
        description={
          pendingDeleteBet
            ? `Будет удалена ставка "${pendingDeleteBet.event}". После этого нумерация и банк для строк ниже пересчитаются заново.`
            : ''
        }
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteDialog}
      />
    </main>
  );
}
