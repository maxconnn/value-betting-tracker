import { useEffect, useState, type FormEvent } from 'react';
import {
  BET_RESULTS,
  LEAGUE_TYPES,
  MARKET_TYPES,
  createEmptyBetDraft,
  type BetDraft,
  type RecalculatedBet,
} from '../types/bet';
import { calculateProfit, calculateStakeAmount, isHighRiskLeague } from '../utils/betting';
import {
  classificationBadgeStyles,
  classificationLabels,
  formatCurrency,
  formatPercent,
  leagueTypeLabels,
  marketTypeLabels,
  resultBadgeStyles,
  resultLabels,
} from '../utils/format';

interface BetFormProps {
  editingBet: RecalculatedBet | null;
  bankrollAtBet: number;
  onSubmit: (bet: BetDraft) => void;
  onCancelEdit: () => void;
}

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

function PreviewMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/10 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-slate-300">{label}</p>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-300">{hint}</p> : null}
    </div>
  );
}

export function BetForm({
  editingBet,
  bankrollAtBet,
  onSubmit,
  onCancelEdit,
}: BetFormProps) {
  const [formState, setFormState] = useState<BetDraft>(createEmptyBetDraft);

  useEffect(() => {
    if (editingBet) {
      setFormState(toDraft(editingBet));
      return;
    }

    setFormState(createEmptyBetDraft());
  }, [editingBet?.id]);

  const preview = calculateStakeAmount(bankrollAtBet, formState);
  const previewProfit = calculateProfit(
    preview.stakeAmount,
    formState.odds,
    formState.result,
    preview.isSkip,
  );
  const previewBankAfter = bankrollAtBet + previewProfit;
  const autoHighRisk = isHighRiskLeague(formState.leagueName);

  function updateField<K extends keyof BetDraft>(field: K, value: BetDraft[K]) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formState.event.trim() || !formState.selection.trim()) {
      return;
    }

    onSubmit({
      ...formState,
      date: formState.date,
      event: formState.event.trim(),
      selection: formState.selection.trim(),
      leagueName: formState.leagueName.trim(),
    });

    if (!editingBet) {
      setFormState(createEmptyBetDraft());
    }
  }

  return (
    <section className="panel p-6">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Bet editor
          </p>
          <h2 className="text-2xl font-bold text-ink">
            {editingBet ? 'Редактирование существующей ставки' : 'Добавление новой ставки'}
          </h2>
          <p className="max-w-2xl text-sm text-slate-600">
            Форма работает по схеме: ввод данных, мгновенный предпросмотр ставки, затем
            сохранение или обновление строки без дублей.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className={`status-badge border ${classificationBadgeStyles[preview.classification]}`}>
            {classificationLabels[preview.classification]}
          </span>
          <span className={`status-badge border ${resultBadgeStyles[formState.result]}`}>
            {resultLabels[formState.result]}
          </span>
        </div>
      </div>

      <form className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]" onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div className="rounded-[26px] border border-stone-200 bg-stone-50/90 p-5">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-950">Матч и контекст</h3>
              <p className="mt-1 text-sm text-slate-500">
                Базовые поля события, рынка и типа лиги.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="field">
                <span className="field-label">Дата</span>
                <input
                  className="field-input"
                  type="date"
                  required
                  value={formState.date}
                  onChange={(event) => updateField('date', event.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">Событие</span>
                <input
                  className="field-input"
                  type="text"
                  required
                  placeholder="Arsenal - Chelsea"
                  value={formState.event}
                  onChange={(event) => updateField('event', event.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">Ставка / рынок</span>
                <input
                  className="field-input"
                  type="text"
                  required
                  placeholder="П1, ТБ 2.5, Ф2 (+1.5)"
                  value={formState.selection}
                  onChange={(event) => updateField('selection', event.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">Название лиги</span>
                <input
                  className="field-input"
                  type="text"
                  placeholder="Premier League, WHL, U19..."
                  value={formState.leagueName}
                  onChange={(event) => updateField('leagueName', event.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">Тип рынка</span>
                <select
                  className="field-input"
                  value={formState.marketType}
                  onChange={(event) =>
                    updateField('marketType', event.target.value as BetDraft['marketType'])
                  }
                >
                  {MARKET_TYPES.map((marketType) => (
                    <option key={marketType} value={marketType}>
                      {marketTypeLabels[marketType]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field">
                <span className="field-label">Тип лиги</span>
                <select
                  className="field-input"
                  value={formState.leagueType}
                  onChange={(event) =>
                    updateField('leagueType', event.target.value as BetDraft['leagueType'])
                  }
                >
                  {LEAGUE_TYPES.map((leagueType) => (
                    <option key={leagueType} value={leagueType}>
                      {leagueTypeLabels[leagueType]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="rounded-[26px] border border-stone-200 bg-white p-5">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-950">Value-параметры</h3>
              <p className="mt-1 text-sm text-slate-500">
                Эти поля участвуют в расчёте суммы ставки и классификации.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="field">
                <span className="field-label">Коэфф</span>
                <input
                  className="field-input"
                  type="number"
                  min="1.01"
                  max="50"
                  step="0.01"
                  value={formState.odds}
                  onChange={(event) => updateField('odds', Number(event.target.value) || 0)}
                />
              </label>

              <label className="field">
                <span className="field-label">Перевес (%)</span>
                <input
                  className="field-input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formState.edgePercent}
                  onChange={(event) =>
                    updateField('edgePercent', Number(event.target.value) || 0)
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
                  value={formState.sampleSize}
                  onChange={(event) =>
                    updateField('sampleSize', Number(event.target.value) || 0)
                  }
                />
              </label>

              <label className="field">
                <span className="field-label">Результат</span>
                <select
                  className="field-input"
                  value={formState.result}
                  onChange={(event) =>
                    updateField('result', event.target.value as BetDraft['result'])
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
          </div>

          <div className="rounded-[26px] border border-stone-200 bg-white p-5">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-950">Риски и исключения</h3>
              <p className="mt-1 text-sm text-slate-500">
                Эти настройки не меняют формулы, только корректно активируют риск или `skip`.
              </p>
            </div>

            <div className="grid gap-3">
              <label className="option-card">
                <input
                  className="mt-1 h-4 w-4 rounded border-stone-300"
                  type="checkbox"
                  checked={formState.suspiciousMarket}
                  onChange={(event) => updateField('suspiciousMarket', event.target.checked)}
                />
                <span>
                  <span className="option-card-title">Подозрительный рынок</span>
                  <span className="option-card-text">
                    Строка сохраняется, но ставка будет помечена как пропуск с суммой 0€.
                  </span>
                </span>
              </label>

              <label className="option-card">
                <input
                  className="mt-1 h-4 w-4 rounded border-stone-300"
                  type="checkbox"
                  checked={formState.unstableLeague}
                  onChange={(event) => updateField('unstableLeague', event.target.checked)}
                />
                <span>
                  <span className="option-card-title">Нестабильная лига</span>
                  <span className="option-card-text">
                    Такая строка тоже остаётся в журнале как пропуск.
                  </span>
                </span>
              </label>

              <label className="option-card">
                <input
                  className="mt-1 h-4 w-4 rounded border-stone-300"
                  type="checkbox"
                  checked={formState.highRisk}
                  onChange={(event) => updateField('highRisk', event.target.checked)}
                />
                <span>
                  <span className="option-card-title">Повышенный риск</span>
                  <span className="option-card-text">
                    Применяет множитель риска `0.8`. Автоопределение по названию лиги:{' '}
                    {autoHighRisk ? 'сработало' : 'не сработало'}.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>

        <aside className="rounded-[28px] bg-slate-950 p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-300">
            Live preview
          </p>
          <div className="mt-5 space-y-4">
            <PreviewMetric
              label="Банк на момент ставки"
              value={formatCurrency(bankrollAtBet)}
              hint="Если редактируете старую строку, здесь используется её bankrollBefore."
            />

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <PreviewMetric label="Сумма ставки" value={formatCurrency(preview.stakeAmount)} />
              <PreviewMetric
                label="Профит по выбранному результату"
                value={formatCurrency(previewProfit)}
                hint={`Банк после строки: ${formatCurrency(previewBankAfter)}`}
              />
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`status-badge border ${classificationBadgeStyles[preview.classification]}`}
                >
                  {classificationLabels[preview.classification]}
                </span>
                <span className={`status-badge border ${resultBadgeStyles[formState.result]}`}>
                  {resultLabels[formState.result]}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-300">База по перевесу</span>
                  <span>{formatPercent(preview.baseStakePercent * 100)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-300">Выборка</span>
                  <span>{preview.sampleMultiplier.toFixed(1)}x</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-300">Коэфф</span>
                  <span>{preview.oddsMultiplier.toFixed(1)}x</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-300">Рынок</span>
                  <span>{preview.marketMultiplier.toFixed(1)}x</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-300">Лига</span>
                  <span>{preview.leagueMultiplier.toFixed(1)}x</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-300">Риск</span>
                  <span>{preview.riskMultiplier.toFixed(1)}x</span>
                </div>
              </div>
            </div>

            <div
              className={`rounded-[22px] border px-4 py-4 text-sm ${
                preview.isSkip
                  ? 'border-rose-300 bg-rose-50 text-rose-900'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-900'
              }`}
            >
              {preview.isSkip
                ? `Строка будет сохранена как пропуск: ${preview.skipReason}`
                : 'Ставка валидна и будет участвовать в стандартном последовательном пересчёте банка.'}
            </div>

            <div className="flex flex-wrap gap-3 pt-1">
              <button className="toolbar-button" type="submit">
                {editingBet ? 'Сохранить изменения' : 'Добавить в журнал'}
              </button>

              {editingBet ? (
                <button className="toolbar-button-secondary" type="button" onClick={onCancelEdit}>
                  Отменить редактирование
                </button>
              ) : null}
            </div>
          </div>
        </aside>
      </form>
    </section>
  );
}
