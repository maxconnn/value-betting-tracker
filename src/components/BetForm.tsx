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
import {
  getMarketOptions,
  getMarketSelectionControlValue,
  MANUAL_MARKET_SELECTION_VALUE,
} from '../utils/marketOptions';
import { parsePastedBetText } from '../utils/pastedBetParser';

type BetFormNumericField = 'odds' | 'probability' | 'edgePercent' | 'sampleSize';
type BetFormState = Omit<BetDraft, BetFormNumericField> & {
  odds: string;
  probability: string;
  edgePercent: string;
  sampleSize: string;
};

const parseNoticeStyles = {
  success: 'border-emerald-300 bg-emerald-50 text-emerald-900',
  error: 'border-rose-300 bg-rose-50 text-rose-900',
  info: 'border-sky-300 bg-sky-50 text-sky-900',
} as const;

function toFormState(draft: BetDraft): BetFormState {
  return {
    ...draft,
    odds: String(draft.odds),
    probability: String(draft.probability),
    edgePercent: String(draft.edgePercent),
    sampleSize: String(draft.sampleSize),
  };
}

function createEmptyFormState() {
  return toFormState(createEmptyBetDraft());
}

function parseDraftNumber(value: string, fallback: number) {
  const normalized = value.trim().replace(',', '.');

  if (normalized === '') {
    return fallback;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBetDraft(formState: BetFormState): BetDraft {
  return {
    ...formState,
    odds: parseDraftNumber(formState.odds, 0),
    probability: parseDraftNumber(formState.probability, 0),
    edgePercent: parseDraftNumber(formState.edgePercent, 0),
    sampleSize: Math.max(0, Math.round(parseDraftNumber(formState.sampleSize, 0))),
  };
}

interface BetFormProps {
  editingBet: RecalculatedBet | null;
  bankrollAtBet: number;
  onSubmit: (bet: BetDraft) => void;
  onCancelEdit: () => void;
}

function toDraft(row: RecalculatedBet): BetDraft {
  return {
    bookmaker: row.bookmaker,
    sport: row.sport,
    date: row.date,
    time: row.time,
    event: row.event,
    selection: row.selection,
    odds: row.odds,
    probability: row.probability,
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
  const [formState, setFormState] = useState<BetFormState>(createEmptyFormState);
  const [selectionControlValue, setSelectionControlValue] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [parseNotice, setParseNotice] = useState<{
    tone: keyof typeof parseNoticeStyles;
    text: string;
  } | null>(null);
  const normalizedDraft = toBetDraft(formState);

  function applyDraftToForm(nextDraft: BetDraft) {
    setFormState(toFormState(nextDraft));
    setSelectionControlValue(
      getMarketSelectionControlValue(nextDraft.marketType, nextDraft.selection),
    );
  }

  useEffect(() => {
    if (editingBet) {
      applyDraftToForm(toDraft(editingBet));
      setPastedText('');
      setParseNotice(null);
      return;
    }

    applyDraftToForm(createEmptyBetDraft());
    setPastedText('');
    setParseNotice(null);
  }, [editingBet?.id]);

  const preview = calculateStakeAmount(bankrollAtBet, normalizedDraft);
  const previewProfit = calculateProfit(
    preview.stakeAmount,
    normalizedDraft.odds,
    normalizedDraft.result,
    preview.isSkip,
  );
  const previewBankAfter = bankrollAtBet + previewProfit;
  const autoHighRisk = isHighRiskLeague(formState.leagueName);
  const currentMarketOptions = getMarketOptions(formState.marketType);
  const isManualSelection = selectionControlValue === MANUAL_MARKET_SELECTION_VALUE;

  function updateField<K extends keyof BetFormState>(field: K, value: BetFormState[K]) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateNumericField(field: BetFormNumericField, value: string) {
    updateField(field, value);
  }

  function handleParsePastedText() {
    const { draft, parsedFields } = parsePastedBetText(pastedText);

    if (parsedFields.length === 0) {
      setParseNotice({
        tone: 'error',
        text: 'Не удалось распознать данные ставки. Проверьте формат вставленного текста.',
      });
      return;
    }

    const nextDraft: BetDraft = {
      ...normalizedDraft,
      ...draft,
    };

    applyDraftToForm(nextDraft);
    setParseNotice({
      tone: 'success',
      text: `Распознано ${parsedFields.length} полей. Проверьте форму и сохраните ставку обычным способом.`,
    });
  }

  function handleMarketTypeChange(nextMarketType: BetDraft['marketType']) {
    const currentSelection = formState.selection.trim();
    const nextSelection = getMarketOptions(nextMarketType).includes(currentSelection)
      ? currentSelection
      : '';

    setFormState((current) => ({
      ...current,
      marketType: nextMarketType,
      selection: nextSelection,
    }));
    setSelectionControlValue(
      getMarketSelectionControlValue(nextMarketType, nextSelection),
    );
  }

  function handleSelectionPresetChange(value: string) {
    setSelectionControlValue(value);

    if (value === '' || value === MANUAL_MARKET_SELECTION_VALUE) {
      updateField('selection', '');
      return;
    }

    updateField('selection', value);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !formState.event.trim() ||
      !formState.selection.trim() ||
      formState.odds.trim() === '' ||
      formState.edgePercent.trim() === '' ||
      formState.sampleSize.trim() === ''
    ) {
      return;
    }

    onSubmit({
      ...normalizedDraft,
      bookmaker: formState.bookmaker.trim(),
      sport: formState.sport.trim(),
      date: normalizedDraft.date,
      time: formState.time.trim(),
      event: formState.event.trim(),
      selection: formState.selection.trim(),
      leagueName: formState.leagueName.trim(),
    });

    if (!editingBet) {
      applyDraftToForm(createEmptyBetDraft());
      setPastedText('');
      setParseNotice(null);
    }
  }

  return (
    <section className="panel p-4 sm:p-6">
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

      <form className="grid gap-5 xl:grid-cols-[1.45fr_0.95fr] xl:gap-6" onSubmit={handleSubmit}>
        <div className="space-y-5">
          <div className="rounded-[26px] border border-stone-200 bg-stone-50/90 p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-950">Импорт из вставки</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Вставьте копируемый текст ставки, нажмите `Разобрать`, затем проверьте поля
                  формы вручную. OCR не используется.
                </p>
              </div>

              <button
                className="toolbar-button sm:w-auto"
                type="button"
                disabled={pastedText.trim() === ''}
                onClick={handleParsePastedText}
              >
                Разобрать
              </button>
            </div>

            <label className="field">
              <span className="field-label">Сырой текст ставки</span>
              <textarea
                className="field-input min-h-[180px] resize-y"
                placeholder={
                  'OlyBet (EU)\nФутбол\t29/03\n07:00\tКоманда 1 – Команда 2\nЛига\tТб(0.5) 2-я команда\n2.21\n47.9%\n+5.84%'
                }
                value={pastedText}
                onChange={(event) => setPastedText(event.target.value)}
              />
            </label>

            {parseNotice ? (
              <div
                className={`mt-4 rounded-[20px] border px-4 py-3 text-sm font-medium ${parseNoticeStyles[parseNotice.tone]}`}
              >
                {parseNotice.text}
              </div>
            ) : null}
          </div>

          <div className="rounded-[26px] border border-stone-200 bg-stone-50/90 p-4 sm:p-5">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-950">Матч и контекст</h3>
              <p className="mt-1 text-sm text-slate-500">
                Сначала выберите тип рынка, затем конкретный вариант или ручной ввод.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="field">
                <span className="field-label">Букмекер</span>
                <input
                  className="field-input"
                  type="text"
                  placeholder="OlyBet (EU)"
                  value={formState.bookmaker}
                  onChange={(event) => updateField('bookmaker', event.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">Спорт</span>
                <input
                  className="field-input"
                  type="text"
                  placeholder="Футбол"
                  value={formState.sport}
                  onChange={(event) => updateField('sport', event.target.value)}
                />
              </label>

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
                <span className="field-label">Время</span>
                <input
                  className="field-input"
                  type="time"
                  value={formState.time}
                  onChange={(event) => updateField('time', event.target.value)}
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
                <span className="field-label">Тип рынка</span>
                <select
                  className="field-input"
                  value={formState.marketType}
                  onChange={(event) =>
                    handleMarketTypeChange(event.target.value as BetDraft['marketType'])
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
                <span className="field-label">Конкретная ставка / рынок</span>
                <select
                  className="field-input"
                  required
                  value={selectionControlValue}
                  onChange={(event) => handleSelectionPresetChange(event.target.value)}
                >
                  <option value="">Выберите вариант</option>
                  {currentMarketOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  <option value={MANUAL_MARKET_SELECTION_VALUE}>Ввести вручную</option>
                </select>
              </label>

              {isManualSelection ? (
                <label className="field">
                  <span className="field-label">Свой вариант ставки</span>
                  <input
                    className="field-input"
                    type="text"
                    required
                    placeholder="Введите свой вариант рынка"
                    value={formState.selection}
                    onChange={(event) => updateField('selection', event.target.value)}
                  />
                </label>
              ) : null}

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

          <div className="rounded-[26px] border border-stone-200 bg-white p-4 sm:p-5">
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
                  required
                  value={formState.odds}
                  onChange={(event) => updateNumericField('odds', event.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">Вероятность (%)</span>
                <input
                  className="field-input"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formState.probability}
                  onChange={(event) => updateNumericField('probability', event.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">Перевес (%)</span>
                <input
                  className="field-input"
                  type="number"
                  min="0"
                  step="0.1"
                  required
                  value={formState.edgePercent}
                  onChange={(event) => updateNumericField('edgePercent', event.target.value)}
                />
              </label>

              <label className="field">
                <span className="field-label">Выборка</span>
                <input
                  className="field-input"
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={formState.sampleSize}
                  onChange={(event) => updateNumericField('sampleSize', event.target.value)}
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

          <div className="rounded-[26px] border border-stone-200 bg-white p-4 sm:p-5">
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

        <aside className="rounded-[28px] bg-slate-950 p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5">
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

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap">
              <button className="toolbar-button sm:w-auto" type="submit">
                {editingBet ? 'Сохранить изменения' : 'Добавить в журнал'}
              </button>

              {editingBet ? (
                <button className="toolbar-button-secondary sm:w-auto" type="button" onClick={onCancelEdit}>
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
