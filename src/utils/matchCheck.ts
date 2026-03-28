import type {
  MatchCheckDisplayStatus,
  MatchCheckRequest,
  MatchCheckResponse,
  MatchCheckStatus,
} from '../types/matchCheck';

interface MatchCheckEnvironment {
  sportsApiKey?: string;
  sportsApiFootballBaseUrl?: string;
}

interface FootballFixtureEntry {
  fixture?: {
    id?: number | null;
    date?: string | null;
    status?: {
      short?: string | null;
    } | null;
  } | null;
  teams?: {
    home?: {
      name?: string | null;
    } | null;
    away?: {
      name?: string | null;
    } | null;
  } | null;
}

interface FootballFixturesApiResponse {
  response?: FootballFixtureEntry[] | null;
}

const FOOTBALL_SPORT_ALIASES = new Set(['football', 'soccer', 'футбол']);
const NOT_STARTED_API_STATUSES = new Set(['NS', 'TBD', 'PST']);
const LIVE_API_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT']);
const FINISHED_API_STATUSES = new Set(['FT', 'AET', 'PEN']);
const TEAM_STOPWORDS = new Set([
  'fc',
  'cf',
  'sc',
  'ac',
  'as',
  'afc',
  'fk',
  'nk',
  'bk',
  'if',
  'ff',
  'club',
  'clube',
  'football',
  'futbol',
  'futebol',
]);
const TEAM_TOKEN_ALIASES: Record<string, string> = {
  st: 'saint',
  utd: 'united',
  untd: 'united',
};

export const matchCheckStatusLabels: Record<MatchCheckDisplayStatus, string> = {
  checking: 'Проверяем',
  not_started: 'Не началось',
  live: 'В лайве',
  finished: 'Завершено',
  not_found: 'Не найдено',
};

export const matchCheckStatusBadgeStyles: Record<MatchCheckDisplayStatus, string> = {
  checking: 'badge-neutral',
  not_started: 'badge-info-light',
  live: 'badge-warning-light',
  finished: 'badge-success-light',
  not_found: 'badge-neutral',
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function stripDiacritics(value: string) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}

function normalizeComparableText(value: string) {
  return normalizeWhitespace(
    stripDiacritics(value)
      .toLowerCase()
      .replace(/[’']/g, '')
      .replace(/&/g, ' and ')
      .replace(/[^a-z0-9\u0400-\u04ff\s-]/g, ' '),
  );
}

function normalizeTimeValue(value: string) {
  const normalized = value.trim();
  return /^\d{2}:\d{2}$/.test(normalized) ? normalized : '';
}

function normalizeTeamToken(token: string) {
  return TEAM_TOKEN_ALIASES[token] ?? token;
}

function getComparableTeamTokens(name: string) {
  return normalizeComparableText(name)
    .split(/[\s-]+/)
    .map(normalizeTeamToken)
    .filter((token) => token && !TEAM_STOPWORDS.has(token));
}

function compareTeamNames(left: string, right: string) {
  const leftTokens = getComparableTeamTokens(left);
  const rightTokens = getComparableTeamTokens(right);

  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return false;
  }

  if (leftTokens.join(' ') === rightTokens.join(' ')) {
    return true;
  }

  const shorter = leftTokens.length <= rightTokens.length ? leftTokens : rightTokens;
  const longer = new Set(leftTokens.length <= rightTokens.length ? rightTokens : leftTokens);
  const sharedCount = shorter.filter((token) => longer.has(token)).length;

  if (shorter.length === 1) {
    return sharedCount === 1 && shorter[0].length >= 4;
  }

  return sharedCount === shorter.length;
}

function getFixtureTeams(fixture: FootballFixtureEntry) {
  return {
    home: normalizeWhitespace(fixture.teams?.home?.name ?? ''),
    away: normalizeWhitespace(fixture.teams?.away?.name ?? ''),
  };
}

function getFixtureEventLabel(fixture: FootballFixtureEntry) {
  const teams = getFixtureTeams(fixture);
  return teams.home && teams.away ? normalizeEventName(`${teams.home} - ${teams.away}`) : '';
}

function getFixtureTimeValue(fixture: FootballFixtureEntry) {
  const value = fixture.fixture?.date ?? '';
  return value.length >= 16 ? value.slice(11, 16) : '';
}

function getFixtureMatchScore(request: MatchCheckRequest, fixture: FootballFixtureEntry) {
  const teams = splitEventTeams(request.event);
  const fixtureTeams = getFixtureTeams(fixture);

  if (!teams || !fixtureTeams.home || !fixtureTeams.away) {
    return -1;
  }

  const sameOrder =
    compareTeamNames(teams[0], fixtureTeams.home) && compareTeamNames(teams[1], fixtureTeams.away);
  const reverseOrder =
    compareTeamNames(teams[0], fixtureTeams.away) && compareTeamNames(teams[1], fixtureTeams.home);

  if (!sameOrder && !reverseOrder) {
    return -1;
  }

  let score = sameOrder ? 100 : 96;

  if (normalizeEventName(request.event) === getFixtureEventLabel(fixture)) {
    score += 4;
  }

  const requestTime = normalizeTimeValue(request.time);
  const fixtureTime = getFixtureTimeValue(fixture);

  if (requestTime && fixtureTime && requestTime === fixtureTime) {
    score += 2;
  }

  if (fixture.fixture?.id) {
    score += 1;
  }

  return score;
}

function findBestFixtureMatch(
  request: MatchCheckRequest,
  fixtures: FootballFixtureEntry[],
): FootballFixtureEntry | null {
  let bestMatch: FootballFixtureEntry | null = null;
  let bestScore = -1;

  fixtures.forEach((fixture) => {
    const score = getFixtureMatchScore(request, fixture);

    if (score > bestScore) {
      bestMatch = fixture;
      bestScore = score;
    }
  });

  return bestMatch;
}

function buildFootballFixturesUrl(baseUrl: string, date: string) {
  const url = new URL(baseUrl);
  const normalizedPath = url.pathname.replace(/\/$/, '');

  url.pathname = normalizedPath.endsWith('/fixtures')
    ? normalizedPath
    : `${normalizedPath}/fixtures`.replace(/\/{2,}/g, '/');
  url.searchParams.set('date', date);

  return url.toString();
}

export function isFootballSport(value: string) {
  return FOOTBALL_SPORT_ALIASES.has(normalizeComparableText(value));
}

export function normalizeEventName(value: string) {
  return normalizeWhitespace(
    value
      .replace(/\s*[–—]\s*/g, ' - ')
      .replace(/\s+-\s+/g, ' - '),
  );
}

export function splitEventTeams(value: string) {
  const normalized = normalizeEventName(value);
  const strictParts = normalized
    .split(' - ')
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean);

  if (strictParts.length === 2) {
    return [strictParts[0], strictParts[1]] as const;
  }

  const hyphenCount = (normalized.match(/-/g) ?? []).length;
  if (hyphenCount === 1) {
    const looseParts = normalized
      .split('-')
      .map((part) => normalizeWhitespace(part))
      .filter(Boolean);

    if (looseParts.length === 2) {
      return [looseParts[0], looseParts[1]] as const;
    }
  }

  return null;
}

export function getMatchCheckRequestKey(
  request: Pick<MatchCheckRequest, 'sport' | 'date' | 'time' | 'event'>,
) {
  return [
    normalizeComparableText(request.sport),
    request.date.trim(),
    normalizeTimeValue(request.time),
    normalizeEventName(request.event),
  ].join('::');
}

export function mapFootballApiStatus(shortStatus: string | null | undefined): MatchCheckStatus {
  const normalized = normalizeWhitespace(shortStatus ?? '').toUpperCase();

  if (NOT_STARTED_API_STATUSES.has(normalized)) {
    return 'not_started';
  }

  if (LIVE_API_STATUSES.has(normalized)) {
    return 'live';
  }

  if (FINISHED_API_STATUSES.has(normalized)) {
    return 'finished';
  }

  return 'not_found';
}

export async function checkFootballMatchStatus(
  request: Partial<MatchCheckRequest> | null | undefined,
  env: MatchCheckEnvironment,
  fetchImpl: typeof fetch = fetch,
): Promise<MatchCheckResponse> {
  const normalizedRequest: MatchCheckRequest = {
    sport: typeof request?.sport === 'string' ? request.sport.trim() : '',
    date: typeof request?.date === 'string' ? request.date.trim() : '',
    time: typeof request?.time === 'string' ? normalizeTimeValue(request.time) : '',
    event: typeof request?.event === 'string' ? normalizeEventName(request.event) : '',
  };

  if (
    !isFootballSport(normalizedRequest.sport) ||
    normalizedRequest.date === '' ||
    normalizedRequest.event === ''
  ) {
    return { status: 'not_found' };
  }

  if (!env.sportsApiKey || !env.sportsApiFootballBaseUrl) {
    throw new Error('SPORTS_API_KEY или SPORTS_API_FOOTBALL_BASE_URL не заданы на сервере.');
  }

  const response = await fetchImpl(buildFootballFixturesUrl(env.sportsApiFootballBaseUrl, normalizedRequest.date), {
    headers: {
      Accept: 'application/json',
      'x-apisports-key': env.sportsApiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`API-Sports вернул ошибку ${response.status}.`);
  }

  const payload = (await response.json()) as FootballFixturesApiResponse;
  const fixtures: FootballFixtureEntry[] = Array.isArray(payload.response) ? payload.response : [];
  const matchedFixture = findBestFixtureMatch(normalizedRequest, fixtures);

  if (!matchedFixture) {
    return { status: 'not_found' };
  }

  const matchedEvent = getFixtureEventLabel(matchedFixture);
  const apiStatus = normalizeWhitespace(matchedFixture.fixture?.status?.short ?? '').toUpperCase();

  return {
    status: mapFootballApiStatus(apiStatus),
    fixtureId: matchedFixture.fixture?.id ?? undefined,
    apiStatus: apiStatus || undefined,
    matchedEvent: matchedEvent || undefined,
  };
}
