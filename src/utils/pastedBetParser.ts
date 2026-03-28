import type { BetDraft, MarketType } from '../types/bet';

export interface ParsedBetDraftResult {
  draft: Partial<BetDraft>;
  parsedFields: Array<keyof BetDraft>;
}

function normalizeLine(line: string) {
  return line.replace(/\u00A0/g, ' ').trim();
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

function isDateToken(value: string) {
  return /^\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?$/.test(value.trim());
}

function isTimeToken(value: string) {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(value.trim());
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

  if (/^(п1|п2|х|1х|12|х2)$/.test(normalizedSelection)) {
    return 'outcomes';
  }

  return null;
}

export function parsePastedBetText(rawText: string): ParsedBetDraftResult {
  const lines = rawText
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(normalizeLine)
    .filter(Boolean);

  const draft: Partial<BetDraft> = {};
  const parsedFields: Array<keyof BetDraft> = [];

  if (lines.length === 0) {
    return { draft, parsedFields };
  }

  let cursor = 0;
  const firstLineLooksLikeSportDate = Boolean(parseSportDateLine(lines[0] ?? ''));

  const bookmakerLine = lines[0];
  if (
    bookmakerLine &&
    !isDateToken(bookmakerLine) &&
    !isTimeToken(bookmakerLine) &&
    !firstLineLooksLikeSportDate
  ) {
    draft.bookmaker = bookmakerLine;
    parsedFields.push('bookmaker');
    cursor += 1;
  }

  const sportDateLine = parseSportDateLine(lines[cursor] ?? '');
  if (sportDateLine) {
    const sport = sportDateLine.sport;
    const date = parseDateToken(sportDateLine.dateToken);

    if (sport) {
      draft.sport = sport;
      parsedFields.push('sport');
    }

    if (date) {
      draft.date = date;
      parsedFields.push('date');
    }

    cursor += 1;
  }

  const timeEventLine = parseTimeEventLine(lines[cursor] ?? '');
  if (timeEventLine) {
    draft.time = timeEventLine.time;
    parsedFields.push('time');

    draft.event = timeEventLine.event;
    parsedFields.push('event');

    cursor += 1;
  }

  const leagueMarketSegments = splitLine(lines[cursor] ?? '');
  if (leagueMarketSegments.length >= 2) {
    const leagueName = leagueMarketSegments[0];
    const selection = leagueMarketSegments.slice(1).join(' ');

    if (leagueName) {
      draft.leagueName = leagueName;
      parsedFields.push('leagueName');
    }

    if (selection) {
      draft.selection = selection;
      parsedFields.push('selection');

      const marketType = inferMarketType(selection);
      if (marketType) {
        draft.marketType = marketType;
        parsedFields.push('marketType');
      }
    }

    cursor += 1;
  }

  const numericLines = lines.slice(cursor);
  const oddsLine = numericLines.find((line) => !line.includes('%'));
  const odds = oddsLine ? parseDecimalValue(oddsLine) : null;
  if (odds !== null) {
    draft.odds = odds;
    parsedFields.push('odds');
  }

  const percentLines = numericLines
    .map((line) => ({
      raw: line,
      value: parsePercentValue(line),
    }))
    .filter((item): item is { raw: string; value: number } => item.value !== null);

  const signedPercent = percentLines.find((item) => /^[+-]/.test(item.raw.trim()));
  if (signedPercent) {
    draft.edgePercent = Math.abs(signedPercent.value);
    parsedFields.push('edgePercent');
  }

  const probabilityCandidate = percentLines.find((item) => item.raw !== signedPercent?.raw);
  if (probabilityCandidate) {
    draft.probability = Math.abs(probabilityCandidate.value);
    parsedFields.push('probability');
  }

  if (draft.edgePercent === undefined && percentLines.length >= 2) {
    draft.edgePercent = Math.abs(percentLines[1].value);
    parsedFields.push('edgePercent');
  }

  if (draft.probability === undefined && !signedPercent && percentLines.length >= 1) {
    draft.probability = Math.abs(percentLines[0].value);
    parsedFields.push('probability');
  }

  return {
    draft,
    parsedFields: [...new Set(parsedFields)],
  };
}
