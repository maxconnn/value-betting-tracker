import type { MarketType } from '../types/bet';

export const MANUAL_MARKET_SELECTION_VALUE = '__manual_market_selection__';

export const marketSelectionOptions: Record<MarketType, string[]> = {
  outcomes: ['П1', 'Х', 'П2', '1Х', '12', 'Х2'],
  handicaps: [
    'Ф1 (-0.5)',
    'Ф1 (-1.0)',
    'Ф1 (-1.5)',
    'Ф1 (-2.0)',
    'Ф1 (-2.5)',
    'Ф1 (+0.5)',
    'Ф1 (+1.0)',
    'Ф1 (+1.5)',
    'Ф1 (+2.0)',
    'Ф1 (+2.5)',
    'Ф2 (-0.5)',
    'Ф2 (-1.0)',
    'Ф2 (-1.5)',
    'Ф2 (-2.0)',
    'Ф2 (-2.5)',
    'Ф2 (+0.5)',
    'Ф2 (+1.0)',
    'Ф2 (+1.5)',
    'Ф2 (+2.0)',
    'Ф2 (+2.5)',
  ],
  totals: [
    'ТБ 0.5',
    'ТБ 1.5',
    'ТБ 2.5',
    'ТБ 3.5',
    'ТБ 4.5',
    'ТБ 5.5',
    'ТМ 0.5',
    'ТМ 1.5',
    'ТМ 2.5',
    'ТМ 3.5',
    'ТМ 4.5',
    'ТМ 5.5',
  ],
  individual_totals: [
    'ИТБ1 0.5',
    'ИТБ1 1.5',
    'ИТБ1 2.5',
    'ИТБ1 3.5',
    'ИТМ1 0.5',
    'ИТМ1 1.5',
    'ИТМ1 2.5',
    'ИТМ1 3.5',
    'ИТБ2 0.5',
    'ИТБ2 1.5',
    'ИТБ2 2.5',
    'ИТБ2 3.5',
    'ИТМ2 0.5',
    'ИТМ2 1.5',
    'ИТМ2 2.5',
    'ИТМ2 3.5',
  ],
  individual_handicaps: [
    'ИФ1 (-0.5)',
    'ИФ1 (+0.5)',
    'ИФ1 (-1.5)',
    'ИФ1 (+1.5)',
    'ИФ2 (-0.5)',
    'ИФ2 (+0.5)',
    'ИФ2 (-1.5)',
    'ИФ2 (+1.5)',
  ],
  corners: [
    'Угловые ТБ 8.5',
    'Угловые ТБ 9.5',
    'Угловые ТБ 10.5',
    'Угловые ТБ 11.5',
    'Угловые ТМ 8.5',
    'Угловые ТМ 9.5',
    'Угловые ТМ 10.5',
    'Угловые ТМ 11.5',
  ],
  periods: [
    '1 период ТБ 0.5',
    '1 период ТБ 1.5',
    '1 период ТБ 2.5',
    '1 период ТМ 0.5',
    '1 период ТМ 1.5',
    '1 период ТМ 2.5',
    '2 период ТБ 0.5',
    '2 период ТБ 1.5',
    '2 период ТБ 2.5',
    '2 период ТМ 0.5',
    '2 период ТМ 1.5',
    '2 период ТМ 2.5',
    '1 период Ф1 (-0.5)',
    '1 период Ф2 (+0.5)',
    '2 период Ф1 (-0.5)',
    '2 период Ф2 (+0.5)',
  ],
};

export function getMarketOptions(marketType: MarketType) {
  return marketSelectionOptions[marketType];
}

export function isPresetMarketSelection(marketType: MarketType, selection: string) {
  return marketSelectionOptions[marketType].includes(selection.trim());
}

export function getMarketSelectionControlValue(marketType: MarketType, selection: string) {
  const trimmedSelection = selection.trim();

  if (!trimmedSelection) {
    return '';
  }

  return isPresetMarketSelection(marketType, trimmedSelection)
    ? trimmedSelection
    : MANUAL_MARKET_SELECTION_VALUE;
}
