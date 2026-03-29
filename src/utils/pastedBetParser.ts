import type { BetDraft, MarketType } from '../types/bet';

export interface ParsedBetDraftResult {
  draft: Partial<BetDraft>;
  parsedFields: Array<keyof BetDraft>;
}

export type PasteFormat = 'desktop' | 'mobile' | 'unknown';

function buildParsedResult(
  draft: Partial<BetDraft>,
  parsedFields: Array<keyof BetDraft>,
): ParsedBetDraftResult {
  return {
    draft,
    parsedFields: [...new Set(parsedFields)],
  };
}

function normalizeLine(line: string) {
  return line
    .replace(/\u00A0/g, ' ')
    .replace(/[—−]/g, '–')
    .replace(/\s-\s/g, ' – ')
    .replace(/\s*\t\s*/g, '\t')
    .replace(/[^\S\t]+/g, ' ')
    .trim();
}

function normalizeLines(rawText: string) {
  return rawText
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(normalizeLine)
    .filter(Boolean);
}

function normalizeSegment(segment: string) {
  return normalizeLine(segment).replace(/\s+/g, ' ');
}

function splitLine(line: string) {
  const normalized = normalizeLine(line);

  if (!normalized) {
    return [];
  }

  const tabSegments = normalized.split('\t').map(normalizeSegment).filter(Boolean);
  if (tabSegments.length > 1) {
    return tabSegments;
  }

  return normalized
    .split(/\s{2,}/)
    .map(normalizeSegment)
    .filter(Boolean);
}

function isDateToken(value: string) {
  return /^\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?$/.test(value.trim());
}

function isTimeToken(value: string) {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(value.trim());
}

function parseSportDateLine(line: string) {
  const segments = splitLine(line);
  if (segments.length >= 2) {
    return {
      sport: segments.slice(0, -1).join(' '),
      dateToken: segments[segments.length - 1],
    };
  }

  const match = normalizeLine(line).match(/^(.*\S)\s+(\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)$/);
  if (!match) {
    return null;
  }

  return {
    sport: normalizeSegment(match[1]),
    dateToken: match[2],
  };
}

function parseTimeEventLine(line: string) {
  const segments = splitLine(line);
  if (segments.length >= 2 && isTimeToken(segments[0])) {
    return {
      time: segments[0],
      event: segments.slice(1).join(' '),
    };
  }

  const match = normalizeLine(line).match(/^(([01]?\d|2[0-3]):[0-5]\d)\s+(.+)$/);
  if (!match) {
    return null;
  }

  return {
    time: match[1],
    event: normalizeSegment(match[3]),
  };
}

function parseDateTimeLine(line: string) {
  const match = normalizeLine(line).match(
    /^(\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)\s+(([01]?\d|2[0-3]):[0-5]\d)$/,
  );

  if (!match) {
    return null;
  }

  return {
    dateToken: match[1],
    time: match[2],
  };
}

function parseLeagueMarketLine(line: string) {
  const segments = splitLine(line);
  if (segments.length >= 2) {
    return {
      leagueName: segments[0],
      selection: segments.slice(1).join(' '),
    };
  }

  const normalized = normalizeLine(line);
  const marketMatch = normalized.match(
    /^(.*\S)\s+(ТБ|ТМ|Тб|Тм|Ф1|Ф2|ИТБ|ИТМ|ИФ1|ИФ2|Угловые|Углов|Corners?|Over|Under)(.*)$/i,
  );

  if (!marketMatch) {
    return null;
  }

  return {
    leagueName: normalizeSegment(marketMatch[1]),
    selection: normalizeSegment(`${marketMatch[2]}${marketMatch[3]}`),
  };
}

function formatIsoDate(year: number, month: number, day: number) {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseDateToken(value: string, referenceDate = new Date()) {
  const trimmed = value.trim();

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return trimmed;
  }

  const shortMatch = trimmed.match(/^(\d{1,2})[./-](\d{1,2})(?:[./-](\d{2,4}))?$/);
  if (!shortMatch) {
    return null;
  }

  const day = Number(shortMatch[1]);
  const month = Number(shortMatch[2]);
  const explicitYear = shortMatch[3];
  const currentYear = referenceDate.getFullYear();
  const year = explicitYear
    ? explicitYear.length === 2
      ? 2000 + Number(explicitYear)
      : Number(explicitYear)
    : currentYear;

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  let normalizedYear = year;

  if (!explicitYear) {
    const candidate = new Date(year, month - 1, day);
    const today = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
    );
    const diffDays = (candidate.getTime() - today.getTime()) / 86_400_000;

    if (diffDays < -180) {
      normalizedYear += 1;
    }
  }

  return formatIsoDate(normalizedYear, month, day);
}

function parsePercentValue(value: string) {
  const trimmed = value.trim();
  if (!/^[+-]?\d+(?:[.,]\d+)?%$/.test(trimmed)) {
    return null;
  }

  const normalized = trimmed.replace('%', '').replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDecimalValue(value: string) {
  const trimmed = value.trim();
  if (!/^[+-]?\d+(?:[.,]\d+)?$/.test(trimmed)) {
    return null;
  }

  const parsed = Number(trimmed.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function appendField<K extends keyof BetDraft>(
  draft: Partial<BetDraft>,
  parsedFields: Array<keyof BetDraft>,
  field: K,
  value: BetDraft[K] | undefined | null,
) {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return;
    }

    draft[field] = trimmed as BetDraft[K];
    parsedFields.push(field);
    return;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    draft[field] = value as BetDraft[K];
    parsedFields.push(field);
  }
}

function inferMarketType(selection: string): MarketType | null {
  const normalizedSelection = selection.trim().toLowerCase();

  if (!normalizedSelection) {
    return null;
  }

  if (/углов|corner/.test(normalizedSelection)) {
    return 'corners';
  }

  if (/период|тайм|quarter|set|period/.test(normalizedSelection)) {
    return 'periods';
  }

  const isTeamSpecific = /(1-я команда|2-я команда|команда 1|команда 2|team 1|team 2)/.test(
    normalizedSelection,
  );

  if (isTeamSpecific && /(ф1|ф2|handicap|fora|фора)/.test(normalizedSelection)) {
    return 'individual_handicaps';
  }

  if (isTeamSpecific && /(тб|тм|over|under)/.test(normalizedSelection)) {
    return 'individual_totals';
  }

  if (/(ф1|ф2|handicap|fora|фора)/.test(normalizedSelection)) {
    return 'handicaps';
  }

  if (/(тб|тм|over|under)/.test(normalizedSelection)) {
    return 'totals';
  }

  if (/^(п?1|п?2|х|x|1[хx]|[хx]2|12|1|2)$/.test(normalizedSelection)) {
    return 'outcomes';
  }

  return null;
}

function parsePercentLines(
  numericLines: string[],
  draft: Partial<BetDraft>,
  parsedFields: Array<keyof BetDraft>,
) {
  const percentLines = numericLines
    .map((line) => ({
      raw: line,
      value: parsePercentValue(line),
    }))
    .filter((item): item is { raw: string; value: number } => item.value !== null);

  const signedPercent = percentLines.find((item) => /^[+-]/.test(item.raw.trim()));
  if (signedPercent) {
    appendField(draft, parsedFields, 'edgePercent', Math.abs(signedPercent.value));
  }

  const probabilityCandidate = percentLines.find((item) => item.raw !== signedPercent?.raw);
  if (probabilityCandidate) {
    appendField(draft, parsedFields, 'probability', Math.abs(probabilityCandidate.value));
  }

  if (draft.edgePercent === undefined && percentLines.length >= 2) {
    appendField(draft, parsedFields, 'edgePercent', Math.abs(percentLines[1].value));
  }

  if (draft.probability === undefined && !signedPercent && percentLines.length >= 1) {
    appendField(draft, parsedFields, 'probability', Math.abs(percentLines[0].value));
  }
}

function parseDesktopLines(lines: string[]): ParsedBetDraftResult {
  const draft: Partial<BetDraft> = {};
  const parsedFields: Array<keyof BetDraft> = [];

  if (lines.length === 0) {
    return buildParsedResult(draft, parsedFields);
  }

  let cursor = 0;
  const firstLineLooksLikeSportDate = Boolean(parseSportDateLine(lines[0] ?? ''));

  const bookmakerLine = lines[0];
  if (
    bookmakerLine &&
    !isDateToken(bookmakerLine) &&
    !isTimeToken(bookmakerLine) &&
    !parseDateTimeLine(bookmakerLine) &&
    !firstLineLooksLikeSportDate
  ) {
    appendField(draft, parsedFields, 'bookmaker', bookmakerLine);
    cursor += 1;
  }

  const sportDateLine = parseSportDateLine(lines[cursor] ?? '');
  if (sportDateLine) {
    appendField(draft, parsedFields, 'sport', sportDateLine.sport);
    appendField(draft, parsedFields, 'date', parseDateToken(sportDateLine.dateToken));
    cursor += 1;
  }

  const timeEventLine = parseTimeEventLine(lines[cursor] ?? '');
  if (timeEventLine) {
    appendField(draft, parsedFields, 'time', timeEventLine.time);
    appendField(draft, parsedFields, 'event', timeEventLine.event);
    cursor += 1;
  }

  const leagueMarketLine = parseLeagueMarketLine(lines[cursor] ?? '');
  if (leagueMarketLine) {
    appendField(draft, parsedFields, 'leagueName', leagueMarketLine.leagueName);
    appendField(draft, parsedFields, 'selection', leagueMarketLine.selection);

    const marketType = inferMarketType(leagueMarketLine.selection);
    if (marketType) {
      appendField(draft, parsedFields, 'marketType', marketType);
    }

    cursor += 1;
  }

  const numericLines = lines.slice(cursor);
  const oddsLine = numericLines.find((line) => parseDecimalValue(line) !== null);
  const odds = oddsLine ? parseDecimalValue(oddsLine) : null;
  if (odds !== null) {
    appendField(draft, parsedFields, 'odds', odds);
  }

  parsePercentLines(numericLines, draft, parsedFields);
  return buildParsedResult(draft, parsedFields);
}

function parseMobileLines(lines: string[]): ParsedBetDraftResult {
  const draft: Partial<BetDraft> = {};
  const parsedFields: Array<keyof BetDraft> = [];

  if (lines.length === 0) {
    return buildParsedResult(draft, parsedFields);
  }

  const probability = parsePercentValue(lines[0] ?? '');
  if (probability !== null && !/^[+-]/.test((lines[0] ?? '').trim())) {
    appendField(draft, parsedFields, 'probability', Math.abs(probability));
  }

  const edgePercent = parsePercentValue(lines[1] ?? '');
  if (edgePercent !== null && /^[+-]/.test((lines[1] ?? '').trim())) {
    appendField(draft, parsedFields, 'edgePercent', Math.abs(edgePercent));
  }

  const dateTimeLine = parseDateTimeLine(lines[2] ?? '');
  if (dateTimeLine) {
    appendField(draft, parsedFields, 'date', parseDateToken(dateTimeLine.dateToken));
    appendField(draft, parsedFields, 'time', dateTimeLine.time);
  }

  appendField(draft, parsedFields, 'sport', lines[3] ?? '');
  appendField(draft, parsedFields, 'bookmaker', lines[4] ?? '');

  const oddsLine = lines[lines.length - 1] ?? '';
  const odds = parseDecimalValue(oddsLine);
  if (odds !== null) {
    appendField(draft, parsedFields, 'odds', odds);
  }

  const bodyLines = lines.slice(5, odds !== null ? -1 : lines.length);
  appendField(draft, parsedFields, 'event', bodyLines[0] ?? '');
  appendField(draft, parsedFields, 'leagueName', bodyLines[1] ?? '');
  appendField(draft, parsedFields, 'selection', bodyLines[2] ?? '');

  if (draft.selection) {
    const marketType = inferMarketType(draft.selection);
    if (marketType) {
      appendField(draft, parsedFields, 'marketType', marketType);
    }
  }

  return buildParsedResult(draft, parsedFields);
}

function detectPasteFormatFromLines(lines: string[]): PasteFormat {
  if (lines.length === 0) {
    return 'unknown';
  }

  const firstPercent = parsePercentValue(lines[0] ?? '');
  const secondPercent = parsePercentValue(lines[1] ?? '');
  const thirdLineDateTime = parseDateTimeLine(lines[2] ?? '');
  const trailingOdds = parseDecimalValue(lines[lines.length - 1] ?? '');

  if (
    firstPercent !== null &&
    secondPercent !== null &&
    !/^[+-]/.test((lines[0] ?? '').trim()) &&
    /^[+-]/.test((lines[1] ?? '').trim()) &&
    thirdLineDateTime &&
    trailingOdds !== null
  ) {
    return 'mobile';
  }

  const startsWithBookmaker =
    Boolean(lines[0]) &&
    Boolean(parseSportDateLine(lines[1] ?? '')) &&
    Boolean(parseTimeEventLine(lines[2] ?? ''));
  const startsWithSportDate =
    Boolean(parseSportDateLine(lines[0] ?? '')) &&
    Boolean(parseTimeEventLine(lines[1] ?? ''));

  if (startsWithBookmaker || startsWithSportDate) {
    return 'desktop';
  }

  return 'unknown';
}

export function detectPasteFormat(rawText: string): PasteFormat {
  return detectPasteFormatFromLines(normalizeLines(rawText));
}

export function parseDesktopBetText(rawText: string): ParsedBetDraftResult {
  return parseDesktopLines(normalizeLines(rawText));
}

export function parseMobileBetText(rawText: string): ParsedBetDraftResult {
  return parseMobileLines(normalizeLines(rawText));
}

export function parsePastedBetText(rawText: string): ParsedBetDraftResult {
  const normalizedLines = normalizeLines(rawText);
  const format = detectPasteFormatFromLines(normalizedLines);

  if (format === 'mobile') {
    return parseMobileLines(normalizedLines);
  }

  return parseDesktopLines(normalizedLines);
}
