import { useEffect, useState } from 'react';
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
  const [bankInput, setBankInput] = useState(String(initialBank));

  useEffect(() => {
    setBankInput(String(initialBank));
  }, [initialBank]);

  return (
    <section className="panel p-4 sm:p-6">
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,220px)_repeat(2,minmax(0,1fr))]">
          <label className="field">
            <span className="field-label">Стартовый банк, €</span>
            <input
              className="field-input"
              type="number"
              min="0"
              step="0.5"
              value={bankInput}
              onChange={(event) => {
                const nextValue = event.target.value;
                setBankInput(nextValue);

                if (nextValue.trim() === '') {
                  return;
                }

                const parsed = Number(nextValue.replace(',', '.'));
                if (!Number.isFinite(parsed)) {
                  return;
                }

                onChange(Math.max(0, parsed));
              }}
              onBlur={() => {
                if (bankInput.trim() === '') {
                  setBankInput(String(initialBank));
                }
              }}
            />
          </label>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-white">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-300">Текущий банк</p>
            <p className="mt-2 text-xl font-semibold">{formatCurrency(currentBankroll)}</p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Строк в журнале</p>
            <p className="mt-2 text-xl font-semibold text-white">{rowsCount}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
