import { Fragment, useEffect, useMemo, useState } from 'react';
import { BET_RESULTS, type BetDraft, type RecalculatedBet } from '../types/bet';
import {
  classificationBadgeStyles,
  classificationLabels,
  formatCurrency,
  formatDate,
  formatOdds,
  formatPercent,
  leagueTypeLabels,
  marketTypeLabels,
  resultBadgeStyles,
  resultLabels,
} from '../utils/format';

interface BetsTableProps {
  bets: RecalculatedBet[];
  totalRows: number;
  hasActiveFilters: boolean;
  editingBetId: string | null;
  onEdit: (id: string) => void;
  onQuickSave: (id: string, draft: BetDraft) => void;
  onDelete: (id: string) => void;
}

type QuickEditNumericField = 'odds' | 'edgePercent' | 'sampleSize';
type QuickEditDraft = Omit<BetDraft, QuickEditNumericField> & {
  odds: string;
  edgePercent: string;
  sampleSize: string;
};

function toDraft(row: RecalculatedBet): BetDraft {
  return {
    date: row.date,
    event: row.event,
    selection: row.selection,
    odds: row.odds,
    edgePercent: row.edgePercent,
    sampleSize: row.sampleSize,
    marketType: row.marketType,
    leagueType: row.leagueType,
    leagueName: row.leagueName,
    suspiciousMarket: row.suspiciousMarket,
    unstableLeague: row.unstableLeague,
    highRisk: row.highRisk,
    result: row.result,
  };
}

function toQuickEditDraft(row: RecalculatedBet): QuickEditDraft {
  return {
    ...toDraft(row),
    odds: String(row.odds),
    edgePercent: String(row.edgePercent),
    sampleSize: String(row.sampleSize),
  };
}

function parseQuickEditNumber(value: string, fallback: number) {
  const normalized = value.trim().replace(',', '.');

  if (normalized === '') {
    return fallback;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBetDraft(quickEditDraft: QuickEditDraft): BetDraft {
  return {
    ...quickEditDraft,
    odds: parseQuickEditNumber(quickEditDraft.odds, 0),
    edgePercent: parseQuickEditNumber(quickEditDraft.edgePercent, 0),
    sampleSize: Math.max(0, Math.round(parseQuickEditNumber(quickEditDraft.sampleSize, 0))),
  };
}

export function BetsTable({
  bets,
  totalRows,
  hasActiveFilters,
  editingBetId,
  onEdit,
  onQuickSave,
  onDelete,
}: BetsTableProps) {
  const [quickEditId, setQuickEditId] = useState<string | null>(null);
  const [quickEditDraft, setQuickEditDraft] = useState<QuickEditDraft | null>(null);
  const quickEditExists = useMemo(
    () => (quickEditId ? bets.some((bet) => bet.id === quickEditId) : false),
    [bets, quickEditId],
  );

  useEffect(() => {
    if (quickEditId && !quickEditExists) {
      closeQuickEdit();
    }
  }, [quickEditExists, quickEditId]);

  function openQuickEdit(row: RecalculatedBet) {
    setQuickEditId(row.id);
    setQuickEditDraft(toQuickEditDraft(row));
  }

  function closeQuickEdit() {
    setQuickEditId(null);
    setQuickEditDraft(null);
  }

  function updateQuickField<K extends keyof QuickEditDraft>(field: K, value: QuickEditDraft[K]) {
    setQuickEditDraft((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
  }

  function saveQuickEdit() {
    if (!quickEditId || !quickEditDraft) {
      return;
    }

    const normalizedDraft = toBetDraft(quickEditDraft);

    onQuickSave(quickEditId, {
      ...normalizedDraft,
      event: quickEditDraft.event.trim(),
      selection: quickEditDraft.selection.trim(),
      leagueName: quickEditDraft.leagueName.trim(),
    });
    closeQuickEdit();
  }

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-stone-200 px-4 py-4 sm:px-6 sm:py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Journal</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink">Таблица ставок</h2>
            <p className="mt-1 text-sm text-slate-600">
              Фильтрация влияет только на видимый список строк. Для полного редактирования
              используйте форму, для быстрых правок есть inline режим прямо в таблице.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-slate-700">
              В таблице {bets.length} из {totalRows} строк
            </div>
            {quickEditExists ? (
              <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900">
                Открыт быстрый режим редактирования
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="bets-table-scroll pb-1">
        <table className="min-w-[1040px] border-separate border-spacing-0 text-left text-sm md:min-w-full">
          <thead className="bg-slate-950 text-white lg:sticky lg:top-0 lg:z-10">
            <tr>
              <th className="px-3 py-3 font-semibold md:px-4">№</th>
              <th className="px-3 py-3 font-semibold md:px-4">Дата</th>
              <th className="px-3 py-3 font-semibold md:px-4">Событие</th>
              <th className="px-3 py-3 font-semibold md:px-4">Ставка / Рынок</th>
              <th className="px-3 py-3 font-semibold md:px-4">Коэфф</th>
              <th className="px-3 py-3 font-semibold md:px-4">Перевес (%)</th>
              <th className="px-3 py-3 font-semibold md:px-4">Выборка</th>
              <th className="px-3 py-3 font-semibold md:px-4">Сумма</th>
              <th className="px-3 py-3 font-semibold md:px-4">Результат</th>
              <th className="px-3 py-3 font-semibold md:px-4">+/-</th>
              <th className="px-3 py-3 font-semibold md:px-4">Банк после</th>
            </tr>
          </thead>

          <tbody>
            {bets.length === 0 ? (
              <tr>
                <td className="px-6 py-12 text-center" colSpan={11}>
                  <div className="mx-auto max-w-xl space-y-2">
                    <p className="text-lg font-semibold text-slate-900">
                      {hasActiveFilters ? 'По текущим фильтрам ничего не найдено' : 'Пока нет ставок'}
                    </p>
                    <p className="text-sm text-slate-500">
                      {hasActiveFilters
                        ? 'Сбросьте поиск или фильтры, чтобы снова увидеть все строки журнала.'
                        : 'Добавьте первую ставку через форму выше или импортируйте CSV.'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : null}

            {bets.map((bet) => (
              <Fragment key={bet.id}>
                <tr
                  className={`border-b border-stone-200/80 align-top ${
                    editingBetId === bet.id ? 'ring-2 ring-inset ring-accent/40' : ''
                  }`}
                >
                  <td className="px-3 py-4 align-top font-semibold text-slate-700 md:px-4">{bet.index}</td>
                  <td className="px-3 py-4 align-top whitespace-nowrap md:px-4">{formatDate(bet.date)}</td>
                  <td className="px-3 py-4 align-top md:px-4">
                    <div className="min-w-[210px] space-y-3 sm:min-w-[240px]">
                      <div>
                        <p className="font-semibold text-slate-950">{bet.event}</p>
                        <p className="text-xs text-slate-500">
                          {bet.leagueName || 'Без названия лиги'} · {leagueTypeLabels[bet.leagueType]}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span
                          className={`status-badge border ${classificationBadgeStyles[bet.classification]}`}
                        >
                          {classificationLabels[bet.classification]}
                        </span>
                        {bet.riskMultiplier < 1 ? (
                          <span className="status-badge border badge-neutral">
                            Risk 0.8
                          </span>
                        ) : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button className="table-action" type="button" onClick={() => onEdit(bet.id)}>
                          Полное редактирование
                        </button>
                        <button
                          className="table-action"
                          type="button"
                          onClick={() =>
                            quickEditId === bet.id ? closeQuickEdit() : openQuickEdit(bet)
                          }
                        >
                          {quickEditId === bet.id ? 'Скрыть быстрый режим' : 'Быстро редактировать'}
                        </button>
                        <button
                          className="table-action table-action-danger"
                          type="button"
                          onClick={() => onDelete(bet.id)}
                        >
                          Удалить
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 align-top md:px-4">
                    <div className="min-w-[190px] space-y-2 sm:min-w-[200px]">
                      <p className="font-semibold text-slate-950">{bet.selection}</p>
                      <div className="flex flex-wrap gap-2">
                        <span className="status-badge border badge-neutral">
                          {marketTypeLabels[bet.marketType]}
                        </span>
                        {bet.suspiciousMarket ? (
                          <span className="status-badge border badge-danger-fill">
                            Подозрительный рынок
                          </span>
                        ) : null}
                        {bet.unstableLeague ? (
                          <span className="status-badge border badge-danger-fill">
                            Нестабильная лига
                          </span>
                        ) : null}
                      </div>
                      {bet.skipReason ? (
                        <p className="text-xs font-medium text-rose-700">{bet.skipReason}</p>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-4 align-top font-medium md:px-4">{formatOdds(bet.odds)}</td>
                  <td className="px-3 py-4 align-top font-medium md:px-4">{formatPercent(bet.edgePercent)}</td>
                  <td className="px-3 py-4 align-top font-medium md:px-4">{bet.sampleSize}</td>
                  <td className="px-3 py-4 align-top font-semibold md:px-4">{formatCurrency(bet.stakeAmount)}</td>
                  <td className="px-3 py-4 align-top md:px-4">
                    <span className={`status-badge border ${resultBadgeStyles[bet.result]}`}>
                      {resultLabels[bet.result]}
                    </span>
                  </td>
                  <td
                    className={`px-3 py-4 align-top font-semibold md:px-4 ${
                      bet.profit > 0
                        ? 'text-emerald-700'
                        : bet.profit < 0
                          ? 'text-rose-700'
                          : 'text-slate-600'
                    }`}
                  >
                    {formatCurrency(bet.profit)}
                  </td>
                  <td className="px-3 py-4 align-top font-semibold text-slate-950 md:px-4">
                    {formatCurrency(bet.bankrollAfter)}
                  </td>
                </tr>

                {quickEditId === bet.id && quickEditDraft ? (
                  <tr className="bg-slate-950/4">
                    <td className="px-3 py-4 md:px-4" colSpan={11}>
                      <div className="rounded-[24px] border border-stone-200 bg-white p-4 shadow-none">
                        <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-accent">
                              Quick edit
                            </p>
                            <h4 className="mt-1 text-lg font-bold text-slate-950">
                              Быстрое редактирование строки #{bet.index}
                            </h4>
                          </div>
                          <p className="text-sm text-slate-500">
                            Для глубоких изменений по рынку, лиге и флагам риска используйте
                            полную форму.
                          </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                          <label className="field sm:col-span-2 lg:col-span-2">
                            <span className="field-label">Событие</span>
                            <input
                              className="field-input"
                              type="text"
                              value={quickEditDraft.event}
                              onChange={(event) => updateQuickField('event', event.target.value)}
                            />
                          </label>

                          <label className="field sm:col-span-2 lg:col-span-2">
                            <span className="field-label">Ставка / рынок</span>
                            <input
                              className="field-input"
                              type="text"
                              value={quickEditDraft.selection}
                              onChange={(event) =>
                                updateQuickField('selection', event.target.value)
                              }
                            />
                          </label>

                          <label className="field">
                            <span className="field-label">Коэфф</span>
                            <input
                              className="field-input"
                              type="number"
                              min="1.01"
                              step="0.01"
                              value={quickEditDraft.odds}
                              onChange={(event) => updateQuickField('odds', event.target.value)}
                            />
                          </label>

                          <label className="field">
                            <span className="field-label">Перевес</span>
                            <input
                              className="field-input"
                              type="number"
                              min="0"
                              step="0.1"
                              value={quickEditDraft.edgePercent}
                              onChange={(event) =>
                                updateQuickField('edgePercent', event.target.value)
                              }
                            />
                          </label>

                          <label className="field">
                            <span className="field-label">Выборка</span>
                            <input
                              className="field-input"
                              type="number"
                              min="0"
                              step="1"
                              value={quickEditDraft.sampleSize}
                              onChange={(event) =>
                                updateQuickField('sampleSize', event.target.value)
                              }
                            />
                          </label>

                          <label className="field">
                            <span className="field-label">Результат</span>
                            <select
                              className="field-input"
                              value={quickEditDraft.result}
                              onChange={(event) =>
                                updateQuickField('result', event.target.value as BetDraft['result'])
                              }
                            >
                              {BET_RESULTS.map((result) => (
                                <option key={result} value={result}>
                                  {resultLabels[result]}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                          <button className="toolbar-button sm:w-auto" type="button" onClick={saveQuickEdit}>
                            Сохранить быстро
                          </button>
                          <button
                            className="toolbar-button-secondary sm:w-auto"
                            type="button"
                            onClick={closeQuickEdit}
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
