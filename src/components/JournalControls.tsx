import { useRef } from 'react';
import {
  BET_CLASSIFICATIONS,
  BET_RESULTS,
  type ClassificationFilterOption,
  type JournalFilters,
  type ResultFilterOption,
} from '../types/bet';
import { classificationLabels, resultLabels } from '../utils/format';

interface JournalControlsProps {
  filters: JournalFilters;
  totalRows: number;
  visibleRows: number;
  onChange: (filters: JournalFilters) => void;
  onReset: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  notice: { tone: 'success' | 'error' | 'info'; text: string } | null;
}

const noticeStyles = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  error: 'border-red-500/30 bg-red-500/10 text-red-200',
  info: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
} as const;

export function JournalControls({
  filters,
  totalRows,
  visibleRows,
  onChange,
  onReset,
  onExport,
  onImport,
  notice,
}: JournalControlsProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const hasActiveFilters =
    filters.search.trim() !== '' || filters.result !== 'all' || filters.classification !== 'all';

  function updateFilter<K extends keyof JournalFilters>(key: K, value: JournalFilters[K]) {
    onChange({
      ...filters,
      [key]: value,
    });
  }

  return (
    <section className="panel p-4 sm:p-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
              Workspace
            </p>
            <h2 className="text-2xl font-bold text-ink">Поиск, фильтры и обмен CSV</h2>
            <p className="text-sm text-slate-600">
              Фильтры влияют только на отображение таблицы. Формулы, банк и сохранённые данные не
              пересчитываются от фильтрации.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300 xl:max-w-max">
            Показано <span className="font-bold text-slate-950">{visibleRows}</span> из{' '}
            <span className="font-bold text-slate-950">{totalRows}</span> строк
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_220px_220px_auto]">
          <label className="field">
            <span className="field-label">Поиск по событию</span>
            <input
              className="field-input"
              type="search"
              placeholder="Например, Arsenal, WHL, Junior Cup"
              value={filters.search}
              onChange={(event) => updateFilter('search', event.target.value)}
            />
          </label>

          <label className="field">
            <span className="field-label">Фильтр по результату</span>
            <select
              className="field-input"
              value={filters.result}
              onChange={(event) =>
                updateFilter('result', event.target.value as ResultFilterOption)
              }
            >
              <option value="all">Все результаты</option>
              {BET_RESULTS.map((result) => (
                <option key={result} value={result}>
                  {resultLabels[result]}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span className="field-label">Фильтр по классификации</span>
            <select
              className="field-input"
              value={filters.classification}
              onChange={(event) =>
                updateFilter('classification', event.target.value as ClassificationFilterOption)
              }
            >
              <option value="all">Все классификации</option>
              {BET_CLASSIFICATIONS.map((classification) => (
                <option key={classification} value={classification}>
                  {classificationLabels[classification]}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <button className="toolbar-button sm:w-auto" type="button" onClick={onExport}>
              Экспорт CSV
            </button>
            <button
              className="toolbar-button-secondary sm:w-auto"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              Импорт CSV
            </button>
            <button
              className="toolbar-button-secondary sm:w-auto"
              disabled={!hasActiveFilters}
              type="button"
              onClick={onReset}
            >
              Сбросить
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onImport(file);
            }
            event.target.value = '';
          }}
        />

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <p className="text-sm text-slate-500">
            CSV-импорт обновляет существующие строки по `ID`, а новые добавляет в конец журнала.
          </p>

          {notice ? (
            <div
              className={`rounded-2xl border px-4 py-3 text-sm font-medium xl:max-w-[32rem] ${noticeStyles[notice.tone]}`}
            >
              {notice.text}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
