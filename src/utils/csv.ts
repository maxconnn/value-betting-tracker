import type { BetEntry, LeagueType, MarketType } from '../types/bet';
import {
  leagueTypeLabels,
  marketTypeLabels,
  resultLabels,
} from './format';
import { normalizeStoredBets } from './storage';

const CSV_COLUMNS: Array<{ key: keyof BetEntry; label: string }> = [
  { key: 'id', label: 'ID' },
  { key: 'date', label: 'Дата' },
  { key: 'event', label: 'Событие' },
  { key: 'selection', label: 'Ставка / Рынок' },
  { key: 'odds', label: 'Коэфф' },
  { key: 'edgePercent', label: 'Перевес (%)' },
  { key: 'sampleSize', label: 'Выборка' },
  { key: 'marketType', label: 'Тип рынка' },
  { key: 'leagueType', label: 'Тип лиги' },
  { key: 'leagueName', label: 'Название лиги' },
  { key: 'suspiciousMarket', label: 'Подозрительный рынок' },
  { key: 'unstableLeague', label: 'Нестабильная лига' },
  { key: 'highRisk', label: 'Повышенный риск' },
  { key: 'result', label: 'Результат' },
];

const marketTypeImportMap: Record<string, MarketType> = Object.fromEntries(
  Object.entries(marketTypeLabels).map(([key, label]) => [label.toLowerCase(), key as MarketType]),
) as Record<string, MarketType>;

const leagueTypeImportMap: Record<string, LeagueType> = Object.fromEntries(
  Object.entries(leagueTypeLabels).map(([key, label]) => [label.toLowerCase(), key as LeagueType]),
) as Record<string, LeagueType>;

const resultImportMap: Record<string, string> = Object.fromEntries(
  Object.entries(resultLabels).map(([key, label]) => [label.toLowerCase(), key]),
) as Record<string, string>;

const csvHeaderToField: Record<string, keyof BetEntry> = {
  id: 'id',
  'дата': 'date',
  'событие': 'event',
  'ставка / рынок': 'selection',
  'ставка/рынок': 'selection',
  'коэфф': 'odds',
  'коэффициент': 'odds',
  'перевес (%)': 'edgePercent',
  'перевес': 'edgePercent',
  'выборка': 'sampleSize',
  'тип рынка': 'marketType',
  'тип лиги': 'leagueType',
  'название лиги': 'leagueName',
  'подозрительный рынок': 'suspiciousMarket',
  'нестабильная лига': 'unstableLeague',
  'повышенный риск': 'highRisk',
  'результат': 'result',
  'event': 'event',
  'selection': 'selection',
  'odds': 'odds',
  'edgepercent': 'edgePercent',
  'samplesize': 'sampleSize',
  'markettype': 'marketType',
  'leaguetype': 'leagueType',
  'leaguename': 'leagueName',
  'suspiciousmarket': 'suspiciousMarket',
  'unstableleague': 'unstableLeague',
  'highrisk': 'highRisk',
  'result': 'result',
};

function escapeCsvCell(value: string | number | boolean) {
  const stringValue = String(value);
  if (!/[,"\n]/.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/"/g, '""')}"`;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  const normalizedText = text.replace(/^\uFEFF/, '');

  for (let index = 0; index < normalizedText.length; index += 1) {
    const char = normalizedText[index];
    const nextChar = normalizedText[index + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        index += 1;
      }

      currentRow.push(currentCell);
      if (currentRow.some((cell) => cell.trim() !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
      continue;
    }

    currentCell += char;
  }

  currentRow.push(currentCell);
  if (currentRow.some((cell) => cell.trim() !== '')) {
    rows.push(currentRow);
  }

  return rows;
}

function normalizeHeader(header: string) {
  return header.trim().toLowerCase();
}

function transformImportedValue(field: keyof BetEntry, value: string) {
  const trimmedValue = value.trim();

  if (field === 'marketType') {
    return marketTypeImportMap[trimmedValue.toLowerCase()] ?? trimmedValue;
  }

  if (field === 'leagueType') {
    return leagueTypeImportMap[trimmedValue.toLowerCase()] ?? trimmedValue;
  }

  if (field === 'result') {
    return resultImportMap[trimmedValue.toLowerCase()] ?? trimmedValue;
  }

  return trimmedValue;
}

export function exportBetsToCsv(bets: ReadonlyArray<BetEntry>) {
  const headerRow = CSV_COLUMNS.map((column) => escapeCsvCell(column.label)).join(',');
  const dataRows = bets.map((bet) =>
    CSV_COLUMNS.map((column) => {
      const value = bet[column.key];

      if (column.key === 'marketType') {
        return escapeCsvCell(marketTypeLabels[value as MarketType]);
      }

      if (column.key === 'leagueType') {
        return escapeCsvCell(leagueTypeLabels[value as LeagueType]);
      }

      if (column.key === 'result') {
        return escapeCsvCell(resultLabels[value as BetEntry['result']]);
      }

      return escapeCsvCell(value as string | number | boolean);
    }).join(','),
  );

  return `\uFEFF${[headerRow, ...dataRows].join('\n')}`;
}

export function downloadCsvFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function importBetsFromCsv(content: string) {
  const rows = parseCsv(content);
  if (rows.length <= 1) {
    return [];
  }

  const headers = rows[0].map((header) => csvHeaderToField[normalizeHeader(header)] ?? null);
  const hasRecognizedHeaders = headers.some(Boolean);

  if (!hasRecognizedHeaders) {
    return [];
  }

  const rawEntries = rows.slice(1).map((cells) => {
    const rawEntry: Record<string, unknown> = {};
    let hasMeaningfulValue = false;

    headers.forEach((field, index) => {
      if (!field) {
        return;
      }

      const sourceValue = cells[index] ?? '';
      if (sourceValue.trim() !== '') {
        hasMeaningfulValue = true;
      }

      rawEntry[field] = transformImportedValue(field, sourceValue);
    });

    return hasMeaningfulValue ? rawEntry : null;
  });

  return normalizeStoredBets(rawEntries.filter((entry): entry is Record<string, unknown> => entry !== null));
}
