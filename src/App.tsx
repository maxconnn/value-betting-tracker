import { useEffect, useMemo, useRef, useState } from 'react';
import { AnalyticsGrid } from './components/AnalyticsGrid';
import { AppShell, type AppShellSection } from './components/AppShell';
import { BankrollSettings } from './components/BankrollSettings';
import { BankrollChart } from './components/BankrollChart';
import { BetForm } from './components/BetForm';
import { BetsTable } from './components/BetsTable';
import { ConfirmDialog } from './components/ConfirmDialog';
import { JournalControls } from './components/JournalControls';
import { SectionHeader } from './components/SectionHeader';
import { StatsCards } from './components/StatsCards';
import { useLocalStorage } from './hooks/useLocalStorage';
import { fetchBetsFromSupabase, syncBetsToSupabase } from './lib/betsRepository';
import { isSupabaseConfigured } from './lib/supabase';
import type { BetDraft, BetEntry, JournalFilters, ThemeMode } from './types/bet';
import type { BetMatchCheckState, MatchCheckRequest, MatchCheckResponse } from './types/matchCheck';
import { buildBettingAnalytics } from './utils/analytics';
import { getBetStatsSummary, recalculateBankroll } from './utils/betting';
import { downloadCsvFile, exportBetsToCsv, importBetsFromCsv } from './utils/csv';
import { formatCurrency } from './utils/format';
import {
  MATCH_CHECK_REQUEST_TIMEOUT_MS,
  getMatchCheckRequestKey,
  getSupportedMarketSettlementResult,
  isSupportedMatchCheckSport,
} from './utils/matchCheck';
import {
  DEFAULT_INITIAL_BANK,
  STORAGE_KEYS,
  getDemoBets,
  normalizeInitialBank,
  normalizeStoredBets,
} from './utils/storage';

type DashboardSectionId = 'journal' | 'bankroll' | 'analytics' | 'tools';

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

function hasEqualMatchCheckStateMap(
  left: Record<string, BetMatchCheckState>,
  right: Record<string, BetMatchCheckState>,
) {
  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  return leftKeys.every((key) => {
    const leftValue = left[key];
    const rightValue = right[key];

    return (
      rightValue !== undefined &&
      leftValue.status === rightValue.status &&
      leftValue.requestKey === rightValue.requestKey
    );
  });
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
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
  const [theme, setTheme] = useLocalStorage<ThemeMode>(STORAGE_KEYS.theme, 'dark', {
    sanitize: (value) => (value === 'dark' ? 'dark' : 'light'),
  });
  const [isLoadingRemoteBets, setIsLoadingRemoteBets] = useState(isSupabaseConfigured);
  const [isSyncingRemoteBets, setIsSyncingRemoteBets] = useState(false);
  const [remoteSyncError, setRemoteSyncError] = useState<string | null>(null);
  const [betsDataSource, setBetsDataSource] = useState<'supabase' | 'local_backup'>(
    isSupabaseConfigured ? 'supabase' : 'local_backup',
  );
  const [editingBetId, setEditingBetId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<DashboardSectionId>('journal');
  const [filters, setFilters] = useState<JournalFilters>({
    search: '',
    result: 'all',
    classification: 'all',
  });
  const [notice, setNotice] = useState<{ tone: 'success' | 'error' | 'info'; text: string } | null>(
    null,
  );
  const [matchChecksByBetId, setMatchChecksByBetId] = useState<Record<string, BetMatchCheckState>>(
    {},
  );
  const [isCheckingMatches, setIsCheckingMatches] = useState(false);
  const hasHydratedSupabaseRef = useRef(false);
  const remoteSyncErrorRef = useRef<string | null>(null);

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
  const checkableMatchBets = useMemo(
    () =>
      recalculatedBets.filter(
        (bet) => bet.result === 'not_played' && isSupportedMatchCheckSport(bet.sport),
      ),
    [recalculatedBets],
  );

  const hasActiveFilters =
    filters.search.trim() !== '' || filters.result !== 'all' || filters.classification !== 'all';
  const betsDataSourceLabel =
    betsDataSource === 'supabase' ? 'Supabase' : 'Резервный localStorage';
  const betsSyncStatus = isLoadingRemoteBets
    ? 'Загружаем журнал из общей базы.'
    : isSyncingRemoteBets
      ? 'Изменения ставок синхронизируются с Supabase.'
      : betsDataSource === 'local_backup'
        ? 'При недоступности Supabase журнал продолжает работать локально.'
      : remoteSyncError
        ? 'Последняя синхронизация с Supabase завершилась ошибкой. Изменения в общей базе не подтверждены.'
        : 'Ставки читаются и записываются в общую базу.';

  const dashboardSections: AppShellSection[] = [
    {
      id: 'journal',
      label: 'Журнал',
      description: 'Таблица ставок, inline edit и полная форма.',
      meta: `${recalculatedBets.length}`,
    },
    {
      id: 'bankroll',
      label: 'Банкролл',
      description: 'Стартовый банк, P/L, ROI и ключевые метрики.',
      meta: formatCurrency(stats.currentBankroll),
    },
    {
      id: 'analytics',
      label: 'Аналитика',
      description: 'График банка и аналитические разрезы по журналу.',
    },
    {
      id: 'tools',
      label: 'Поиск / CSV',
      description: 'Фильтрация, импорт и экспорт журнала.',
      meta: hasActiveFilters ? 'Фильтры' : undefined,
    },
  ];

  const activeSectionMeta: Record<DashboardSectionId, { title: string; description: string }> = {
    journal: {
      title: 'Журнал ставок',
      description:
        'Основной рабочий экран для ведения ставок, просмотра строк и редактирования без нарушения top-down пересчёта банка.',
    },
    bankroll: {
      title: 'Банкролл и метрики',
      description:
        'Отдельный раздел для контроля стартового банка, общего результата журнала, ROI и winrate без смешивания с рабочей таблицей.',
    },
    analytics: {
      title: 'Аналитика результатов',
      description:
        'График и аналитические срезы строятся по уже пересчитанным строкам и помогают быстрее оценить качество стратегии.',
    },
    tools: {
      title: 'Поиск, фильтры и обмен CSV',
      description:
        'Фильтры влияют только на отображение таблицы, а CSV-операции работают поверх текущего журнала без поломки ID и порядка строк.',
    },
  };

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    remoteSyncErrorRef.current = remoteSyncError;
  }, [remoteSyncError]);

  useEffect(() => {
    let isCancelled = false;

    async function hydrateBets() {
      if (!isSupabaseConfigured) {
        setBetsDataSource('local_backup');
        setRemoteSyncError(null);
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
          setRemoteSyncError(null);
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
          setRemoteSyncError(null);
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
        setRemoteSyncError(null);
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
        setRemoteSyncError(getErrorMessage(error));
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

    void hydrateBets();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (isSupabaseConfigured && betsDataSource === 'supabase') {
      return;
    }

    setLocalBackupBets(bets);
  }, [bets, betsDataSource, setLocalBackupBets]);

  useEffect(() => {
    setMatchChecksByBetId((current) => {
      const next: Record<string, BetMatchCheckState> = {};

      bets.forEach((bet) => {
        if (bet.result !== 'not_played' || !isSupportedMatchCheckSport(bet.sport)) {
          return;
        }

        const existingState = current[bet.id];
        const requestKey = getMatchCheckRequestKey(bet);

        if (existingState && existingState.requestKey === requestKey) {
          next[bet.id] = existingState;
        }
      });

      return hasEqualMatchCheckStateMap(current, next) ? current : next;
    });
  }, [bets]);

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

        if (remoteSyncErrorRef.current) {
          setNotice({
            tone: 'success',
            text: 'Синхронизация с Supabase восстановлена. Последние изменения подтверждены в общей базе.',
          });
        }

        setRemoteSyncError(null);
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

        setRemoteSyncError(getErrorMessage(error));
        setNotice({
          tone: 'error',
          text: `Не удалось синхронизировать изменения с Supabase: ${getErrorMessage(error)}. Изменения не подтверждены в общей базе.`,
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
  }, [bets, betsDataSource, initialBank, setLocalBackupBets]);

  const usesSharedSupabase = isSupabaseConfigured && betsDataSource === 'supabase';

  function handleSaveBet(draft: BetDraft) {
    if (editingBetId) {
      setBets((current) =>
        current.map((bet) => (bet.id === editingBetId ? { ...draft, id: editingBetId } : bet)),
      );
      setEditingBetId(null);
      setNotice({
        tone: usesSharedSupabase ? 'info' : 'success',
        text: usesSharedSupabase
          ? 'Ставка обновлена локально без создания дубля. Ждём подтверждения от Supabase.'
          : 'Ставка обновлена без создания дубля.',
      });
      return;
    }

    setBets((current) => [...current, { ...draft, id: createBetId() }]);
    setNotice({
      tone: usesSharedSupabase ? 'info' : 'success',
      text: usesSharedSupabase
        ? 'Новая ставка добавлена в журнал. Ждём подтверждения от Supabase.'
        : 'Новая ставка добавлена в журнал.',
    });
  }

  function handleQuickSaveBet(id: string, draft: BetDraft) {
    setBets((current) => current.map((bet) => (bet.id === id ? { ...draft, id } : bet)));
    setNotice({
      tone: usesSharedSupabase ? 'info' : 'success',
      text: usesSharedSupabase
        ? 'Строка обновлена локально. Ждём подтверждения от Supabase.'
        : 'Строка обновлена в быстром режиме.',
    });
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
    setNotice({
      tone: usesSharedSupabase ? 'info' : 'success',
      text: usesSharedSupabase
        ? 'Строка удалена локально, нумерация и банк пересчитаны. Ждём подтверждения от Supabase.'
        : 'Строка удалена, нумерация и банк пересчитаны.',
    });
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

  async function handleCheckMatches() {
    if (isCheckingMatches || checkableMatchBets.length === 0) {
      return;
    }

    const groupedRequests = new Map<
      string,
      {
        betIds: string[];
        request: MatchCheckRequest;
      }
    >();

    checkableMatchBets.forEach((bet) => {
      const requestKey = getMatchCheckRequestKey(bet);
      const existingGroup = groupedRequests.get(requestKey);

      if (existingGroup) {
        existingGroup.betIds.push(bet.id);
        return;
      }

      groupedRequests.set(requestKey, {
        betIds: [bet.id],
        request: {
          sport: bet.sport,
          date: bet.date,
          time: bet.time,
          event: bet.event,
          leagueName: bet.leagueName,
        },
      });
    });

    const previousStates = new Map<string, BetMatchCheckState | undefined>();
    const betSnapshotById = new Map(checkableMatchBets.map((bet) => [bet.id, bet]));
    const autoSettlements = new Map<string, BetEntry['result']>();
    checkableMatchBets.forEach((bet) => {
      previousStates.set(bet.id, matchChecksByBetId[bet.id]);
    });

    setIsCheckingMatches(true);
    setMatchChecksByBetId((current) => {
      const next = { ...current };

      checkableMatchBets.forEach((bet) => {
        next[bet.id] = {
          status: 'checking',
          requestKey: getMatchCheckRequestKey(bet),
        };
      });

      return next;
    });

    let successfulChecks = 0;
    let failedChecks = 0;
    let firstErrorMessage = '';

    try {
      for (const [requestKey, requestGroup] of groupedRequests.entries()) {
        try {
          const controller = new AbortController();
          const timeoutId = window.setTimeout(() => controller.abort(), MATCH_CHECK_REQUEST_TIMEOUT_MS);
          const response = await fetch('/api/check-football-match', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestGroup.request),
            signal: controller.signal,
          }).finally(() => {
            window.clearTimeout(timeoutId);
          });

          if (!response.ok) {
            const errorPayload = (await response.json().catch(() => null)) as
              | { message?: string }
              | null;

            throw new Error(errorPayload?.message ?? `HTTP ${response.status}`);
          }

          const payload = (await response.json()) as MatchCheckResponse;

          setMatchChecksByBetId((current) => {
            const next = { ...current };

            requestGroup.betIds.forEach((betId) => {
              next[betId] = {
                status: payload.status,
                requestKey,
              };
            });

            return next;
          });

          requestGroup.betIds.forEach((betId) => {
            const betSnapshot = betSnapshotById.get(betId);

            if (!betSnapshot) {
              return;
            }

            const autoSettledResult = getSupportedMarketSettlementResult(
              betSnapshot.marketType,
              betSnapshot.selection,
              payload,
            );

            if (!autoSettledResult) {
              return;
            }

            autoSettlements.set(betId, autoSettledResult);
          });

          successfulChecks += 1;
        } catch (error) {
          failedChecks += 1;
          firstErrorMessage =
            firstErrorMessage ||
            (isAbortError(error)
              ? 'Таймаут проверки матча.'
              : error instanceof Error && error.message.trim()
                ? error.message.trim()
                : 'Неизвестная ошибка проверки матчей.');

          setMatchChecksByBetId((current) => {
            const next = { ...current };

            requestGroup.betIds.forEach((betId) => {
              const previousState = previousStates.get(betId);

              if (previousState && previousState.status !== 'checking') {
                next[betId] = previousState;
                return;
              }

              next[betId] = {
                status: 'not_found',
                requestKey,
              };
            });

            return next;
          });
        }
      }
    } finally {
      setIsCheckingMatches(false);
    }

    if (autoSettlements.size > 0) {
      setBets((current) =>
        current.map((bet) => {
          const autoSettledResult = autoSettlements.get(bet.id);

          if (!autoSettledResult || bet.result !== 'not_played') {
            return bet;
          }

          return {
            ...bet,
            result: autoSettledResult,
          };
        }),
      );
    }

    if (failedChecks === 0) {
      setNotice({
        tone: 'info',
        text:
          autoSettlements.size > 0
            ? `Проверено ${successfulChecks} матчей. Для ${autoSettlements.size} ставок результат определён автоматически.`
            : `Проверено ${successfulChecks} матчей по открытым строкам журнала.`,
      });
      return;
    }

    if (successfulChecks > 0) {
      setNotice({
        tone: 'error',
        text:
          autoSettlements.size > 0
            ? `Часть матчей проверена, ${autoSettlements.size} ставок обновлены автоматически, но ${failedChecks} запросов завершились ошибкой: ${firstErrorMessage}`
            : `Часть матчей проверена, но ${failedChecks} запросов завершились ошибкой: ${firstErrorMessage}`,
      });
      return;
    }

    setNotice({
      tone: 'error',
      text: `Не удалось проверить статусы матчей: ${firstErrorMessage}`,
    });
  }

  const themeToggleButtonClass =
    theme === 'dark' ? 'theme-light-button' : 'theme-dark-button';

  return (
    <div className="dashboard-app">
      <AppShell
        appTitle="Value Betting Tracker"
        appSubtitle="Минималистичная операционная панель для журнала ставок, банкролла и аналитики."
        sections={dashboardSections}
        activeSection={activeSection}
        onSelectSection={(sectionId) => setActiveSection(sectionId as DashboardSectionId)}
        headerTitle={activeSectionMeta[activeSection].title}
        headerDescription={activeSectionMeta[activeSection].description}
        headerActions={
          <>
            <span className="stat-pill hidden lg:inline-flex">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              {betsDataSourceLabel}
            </span>
            <button
              className={`${themeToggleButtonClass} hidden lg:inline-flex`}
              type="button"
              onClick={handleToggleTheme}
            >
              {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            </button>
          </>
        }
        headerSummary={
          <>
            <span className="stat-pill">Банк: {formatCurrency(stats.currentBankroll)}</span>
            <span className="stat-pill">Строк: {stats.totalRows}</span>
            <span className="stat-pill">Видимо: {visibleBets.length}</span>
            <span className="stat-pill">{betsSyncStatus}</span>
          </>
        }
        sidebarFooter={
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
              Data source
            </p>
            <p className="text-sm font-medium text-white">{betsDataSourceLabel}</p>
            <p className="text-xs leading-5 text-slate-400">{betsSyncStatus}</p>
            <button
              className={`${themeToggleButtonClass} lg:hidden`}
              type="button"
              onClick={handleToggleTheme}
            >
              {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            </button>
          </div>
        }
        mobileSidebarFooter={
          <div className="mobile-drawer-meta space-y-3">
            <div className="mobile-drawer-meta-block space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                Data source
              </p>
              <p className="text-sm font-medium text-white">{betsDataSourceLabel}</p>
            </div>
            <p className="mobile-drawer-sync text-xs leading-5 text-slate-400">{betsSyncStatus}</p>
            <button
              className={`${themeToggleButtonClass} lg:hidden`}
              type="button"
              onClick={handleToggleTheme}
            >
              {theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            </button>
          </div>
        }
      >
        {activeSection === 'journal' ? (
          <div className="section-stack">
            <SectionHeader
              eyebrow="Journal workspace"
              title="Журнал и редактор ставок"
              description="Основной рабочий экран для таблицы, полного ввода новой ставки и быстрых правок существующих строк."
              actions={
                hasActiveFilters ? (
                  <button
                    className="toolbar-button-secondary"
                    type="button"
                    onClick={() => setActiveSection('tools')}
                  >
                    Открыть фильтры
                  </button>
                ) : undefined
              }
            />

            <BetsTable
              bets={visibleBets}
              totalRows={recalculatedBets.length}
              hasActiveFilters={hasActiveFilters}
              editingBetId={editingBetId}
              checkableMatchesCount={checkableMatchBets.length}
              isCheckingMatches={isCheckingMatches}
              matchChecksByBetId={matchChecksByBetId}
              onEdit={(id) => setEditingBetId(id)}
              onCheckMatches={handleCheckMatches}
              onQuickSave={handleQuickSaveBet}
              onDelete={handleRequestDelete}
            />

            <BetForm
              editingBet={editingBet}
              bankrollAtBet={bankrollAtBet}
              onSubmit={handleSaveBet}
              onCancelEdit={() => setEditingBetId(null)}
            />
          </div>
        ) : null}

        {activeSection === 'bankroll' ? (
          <div className="section-stack">
            <SectionHeader
              eyebrow="Bankroll control"
              title="Банкролл и ключевые метрики"
              description="Чистый отдельный раздел для изменения стартового банка и контроля основных метрик журнала."
            />

            <BankrollSettings
              initialBank={initialBank}
              currentBankroll={stats.currentBankroll}
              rowsCount={stats.totalRows}
              onChange={(value) => setInitialBank(value)}
            />

            <StatsCards stats={stats} />
          </div>
        ) : null}

        {activeSection === 'analytics' ? (
          <div className="section-stack">
            <SectionHeader
              eyebrow="Analytics"
              title="График и аналитические разрезы"
              description="Рост банка по порядку ставок и аналитика по рынкам, классификациям, типам ставок и лигам."
            />

            <BankrollChart points={analytics.bankrollChart} />
            <AnalyticsGrid analytics={analytics} />
          </div>
        ) : null}

        {activeSection === 'tools' ? (
          <div className="section-stack">
            <SectionHeader
              eyebrow="Search and data"
              title="Поиск, фильтры и обмен CSV"
              description="Здесь сосредоточены фильтрация журнала, импорт, экспорт и текущие notice-сообщения по операциям с данными."
            />

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
          </div>
        ) : null}
      </AppShell>

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
    </div>
  );
}
