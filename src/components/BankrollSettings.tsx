import { formatCurrency } from '../utils/format';

interface BankrollSettingsProps {
  initialBank: number;
  currentBankroll: number;
  rowsCount: number;
  onChange: (value: number) => void;
}

export function BankrollSettings({
  initialBank,
  currentBankroll,
  rowsCount,
  onChange,
}: BankrollSettingsProps) {
  return (
    <section className="panel p-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-xl space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
            Bankroll control
          </p>
          <h2 className="text-2xl font-bold text-ink">Начальный банк</h2>
          <p className="text-sm text-slate-600">
            Любое изменение здесь запускает полный пересчёт всей истории сверху вниз.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_repeat(2,minmax(0,1fr))]">
          <label className="field">
            <span className="field-label">Стартовый банк, €</span>
            <input
              className="field-input"
              type="number"
              min="0"
              step="0.5"
              value={initialBank}
              onChange={(event) => onChange(Math.max(0, Number(event.target.value) || 0))}
            />
          </label>

          <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Текущий банк</p>
            <p className="mt-2 text-xl font-bold">{formatCurrency(currentBankroll)}</p>
          </div>

          <div className="rounded-2xl bg-slate-100 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Строк в журнале</p>
            <p className="mt-2 text-xl font-bold text-slate-900">{rowsCount}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
