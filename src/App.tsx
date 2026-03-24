import { useEffect, useMemo, useState } from 'react';
import { AnalyticsGrid } from './components/AnalyticsGrid';
import { BankrollSettings } from './components/BankrollSettings';
import { BankrollChart } from './components/BankrollChart';
import { BetForm } from './components/BetForm';
import { BetsTable } from './components/BetsTable';
import { ConfirmDialog } from './components/ConfirmDialog';
import { JournalControls } from './components/JournalControls';
import { StatsCards } from './components/StatsCards';
import { useLocalStorage } from './hooks/useLocalStorage';
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

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const [initialBank, setInitialBank] = useLocalStorage<number>(
    STORAGE_KEYS.initialBank,
    DEFAULT_INITIAL_BANK,
    { sanitize: normalizeInitialBank },
  );
  const [bets, setBets] = useLocalStorage<BetEntry[]>(STORAGE_KEYS.bets, getDemoBets, {
    sanitize: normalizeStoredBets,
  });
  const [theme, setTheme] = useLocalStorage<ThemeMode>(STORAGE_KEYS.theme, 'light', {
    sanitize: (value) => (value === 'dark' ? 'dark' : 'light'),
  });
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

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

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
              Журнал стартует с demo-строк, хранит всё в localStorage и пересчитывает каждую
              строку строго сверху вниз при любом изменении.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Текущий банк</p>
              <p className="mt-3 text-3xl font-bold">{formatCurrency(stats.currentBankroll)}</p>
              <p className="mt-2 text-sm text-slate-300">Пересчитывается сверху вниз по всем строкам</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Контроль UX</p>
              <p className="mt-3 text-lg font-semibold text-white">CSV, фильтры, edit/update без дублей</p>
              <p className="mt-2 text-sm text-slate-300">Бизнес-логика и localStorage не меняются</p>
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
