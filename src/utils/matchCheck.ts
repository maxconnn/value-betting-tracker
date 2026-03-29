import type {
  MatchCheckDisplayStatus,
  MatchCheckRequest,
  MatchCheckResponse,
  MatchCheckStatus,
} from '../types/matchCheck';

interface MatchCheckEnvironment {
  sportsApiKey?: string;
  sportsApiFootballBaseUrl?: string;
  sportsApiBasketballBaseUrl?: string;
  sportsApiHockeyBaseUrl?: string;
}

interface MatchCheckOptions {
  debugLog?: (event: string, payload: unknown) => void;
}

interface SportsFixtureEntry {
  fixture?: {
    id?: number | null;
    date?: string | null;
    status?: {
      short?: string | null;
      long?: string | null;
    } | null;
  } | null;
  game?: {
    id?: number | null;
    date?: string | null;
    status?: {
      short?: string | null;
      long?: string | null;
    } | null;
  } | null;
  id?: number | null;
  date?: string | null;
  status?:
    | {
        short?: string | null;
        long?: string | null;
      }
    | string
    | null;
  league?: {
    name?: string | null;
  } | null;
  goals?: {
    home?: unknown;
    away?: unknown;
  } | null;
  scores?: {
    home?: unknown;
    away?: unknown;
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

interface SportsFixturesApiResponse {
  response?: SportsFixtureEntry[] | null;
  errors?: unknown;
  message?: unknown;
}

interface TeamSimilarityResult {
  score: number;
  normalizedLeft: string;
  normalizedRight: string;
  leftTokens: string[];
  rightTokens: string[];
}

interface FixtureCandidateAnalysis {
  fixture: SportsFixtureEntry;
  eventLabel: string;
  leagueName: string;
  apiStatus: string;
  orientation: 'same' | 'reverse';
  homeScore: number;
  awayScore: number;
  combinedScore: number;
  leagueScore: number | null;
  timeDeltaMinutes: number | null;
  dateDeltaDays: number;
  totalScore: number;
  accepted: boolean;
  rejectReason: string | null;
}

interface SportsDateLookupResult {
  date: string;
  fixtures: SportsFixtureEntry[];
  planLimited: boolean;
  planLimitedReason: string | null;
  debugMessages: string[];
}

const FOOTBALL_SPORT_ALIASES = new Set(['football', 'soccer', 'футбол']);
const BASKETBALL_SPORT_ALIASES = new Set(['basketball', 'баскетбол', 'basket']);
const HOCKEY_SPORT_ALIASES = new Set(['hockey', 'ice hockey', 'ice-hockey', 'хоккей', 'хоккеи']);
const GENERIC_NOT_STARTED_API_STATUSES = new Set([
  'NS',
  'TBD',
  'SCHEDULED',
  'NOT STARTED',
  'NOT_STARTED',
  'UPCOMING',
]);
const GENERIC_LIVE_API_STATUSES = new Set([
  'LIVE',
  'IN PLAY',
  'INPLAY',
  'IN PROGRESS',
  'IN_PROGRESS',
  'Q1',
  'Q2',
  'Q3',
  'Q4',
  '1P',
  '2P',
  '3P',
  'OT',
  '1OT',
  '2OT',
  '3OT',
  'HT',
  'INT',
]);
const GENERIC_FINISHED_API_STATUSES = new Set([
  'FT',
  'AET',
  'PEN',
  'FINAL',
  'FINISHED',
  'ENDED',
  'AFTER OT',
  'AFTER OVERTIME',
  'AFTER PENALTIES',
]);
const NOT_STARTED_API_STATUSES = new Set(['NS', 'TBD', 'PST']);
const LIVE_API_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT']);
const FINISHED_API_STATUSES = new Set(['FT', 'AET', 'PEN']);
const PLAN_LIMITED_MESSAGE_PATTERNS = [
  'current plan',
  'available in your plan',
  'not available in your plan',
  'free plan',
  'paid plan',
  'subscription',
  'upgrade',
  'coverage',
  'historical',
  'historic',
  'quota',
  'daily limit',
  'rate limit',
  'not allowed',
  'access denied',
  'restricted',
  'plan',
];
const HARD_TEAM_STOPWORDS = new Set([
  'fc',
  'cf',
  'cd',
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
const SOFT_TEAM_TOKENS = new Set(['athletic', 'deportivo', 'real', 'united', 'city']);
const COMPETITION_STOPWORDS = new Set(['league', 'liga', 'division', 'professional']);
const TEAM_TOKEN_ALIASES: Record<string, string> = {
  st: 'saint',
  utd: 'united',
  untd: 'united',
  man: 'manchester',
};
const FALLBACK_DATE_OFFSETS = [-1, 1] as const;

type MatchCheckSport = 'football' | 'basketball' | 'hockey';

export const MATCH_CHECK_REQUEST_TIMEOUT_MS = 12_000;

export const matchCheckStatusLabels: Record<MatchCheckDisplayStatus, string> = {
  checking: 'Проверяем',
  not_started: 'Не начался',
  live: 'В лайве',
  finished: 'Завершён',
  not_found: 'Не найден',
  plan_limited: 'недоступен на free API',
};

export const matchCheckStatusBadgeStyles: Record<MatchCheckDisplayStatus, string> = {
  checking: 'badge-neutral',
  not_started: 'badge-info-light',
  live: 'badge-warning-light',
  finished: 'badge-success-light',
  not_found: 'badge-neutral',
  plan_limited: 'badge-neutral',
};

const SUPPORTED_OUTCOME_MARKET_SELECTIONS = new Set(['P1', 'P2', 'X', '1X', '12', 'X2']);

type SupportedOutcomeSettlementResult = 'won' | 'lost' | 'refund';
type ParsedSettlementMarket =
  | {
      kind: 'outcomes';
      selection: string;
    }
  | {
      kind: 'totals';
      direction: 'over' | 'under';
      line: number;
    }
  | {
      kind: 'handicaps';
      side: 1 | 2;
      line: number;
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

function deduplicateTokens(tokens: string[]) {
  return tokens.filter((token, index) => token !== '' && tokens.indexOf(token) === index);
}

function getComparableTeamTokens(name: string) {
  const baseTokens = normalizeComparableText(name)
    .split(/[\s-]+/)
    .map(normalizeTeamToken)
    .filter((token) => token && !HARD_TEAM_STOPWORDS.has(token));

  return deduplicateTokens(baseTokens);
}

function getComparableTeamLabel(name: string) {
  return getComparableTeamTokens(name).join(' ');
}

function getComparableCompetitionTokens(name: string) {
  const baseTokens = normalizeComparableText(name)
    .split(/[\s-]+/)
    .map(normalizeTeamToken)
    .filter((token) => token && !COMPETITION_STOPWORDS.has(token));

  return deduplicateTokens(baseTokens);
}

function getComparableCompetitionLabel(name: string) {
  return getComparableCompetitionTokens(name).join(' ');
}

function getTokenWeight(token: string) {
  return SOFT_TEAM_TOKENS.has(token) ? 0.35 : 1;
}

function getCharacterBigrams(value: string) {
  const normalized = value.replace(/\s+/g, ' ');

  if (normalized.length < 2) {
    return normalized === '' ? [] : [normalized];
  }

  const bigrams: string[] = [];

  for (let index = 0; index < normalized.length - 1; index += 1) {
    bigrams.push(normalized.slice(index, index + 2));
  }

  return bigrams;
}

function getDiceCoefficient(left: string, right: string) {
  if (!left || !right) {
    return 0;
  }

  if (left === right) {
    return 1;
  }

  const leftBigrams = getCharacterBigrams(left);
  const rightBigrams = getCharacterBigrams(right);

  if (leftBigrams.length === 0 || rightBigrams.length === 0) {
    return 0;
  }

  const rightCounts = new Map<string, number>();

  rightBigrams.forEach((bigram) => {
    rightCounts.set(bigram, (rightCounts.get(bigram) ?? 0) + 1);
  });

  let sharedCount = 0;

  leftBigrams.forEach((bigram) => {
    const currentCount = rightCounts.get(bigram) ?? 0;

    if (currentCount <= 0) {
      return;
    }

    sharedCount += 1;
    rightCounts.set(bigram, currentCount - 1);
  });

  return (2 * sharedCount) / (leftBigrams.length + rightBigrams.length);
}

function getTokenSimilarity(left: string, right: string) {
  if (!left || !right) {
    return 0;
  }

  if (left === right) {
    return 1;
  }

  const shorter = left.length <= right.length ? left : right;
  const longer = left.length <= right.length ? right : left;

  if (shorter.length >= 3 && longer.startsWith(shorter)) {
    return 0.9;
  }

  if (shorter.length >= 4 && longer.includes(shorter)) {
    return 0.84;
  }

  const diceScore = getDiceCoefficient(left, right);
  return diceScore >= 0.78 ? diceScore : 0;
}

function getTokensInitialism(tokens: string[]) {
  return tokens
    .filter((token) => token !== '')
    .map((token) => token[0] ?? '')
    .join('');
}

function getSharedSuffixTokenCount(leftTokens: string[], rightTokens: string[]) {
  let sharedCount = 0;
  let leftIndex = leftTokens.length - 1;
  let rightIndex = rightTokens.length - 1;

  while (leftIndex >= 0 && rightIndex >= 0 && leftTokens[leftIndex] === rightTokens[rightIndex]) {
    sharedCount += 1;
    leftIndex -= 1;
    rightIndex -= 1;
  }

  return sharedCount;
}

function getLabelInitialismScore(leftTokens: string[], rightTokens: string[]) {
  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return 0;
  }

  const shorterTokens = leftTokens.length <= rightTokens.length ? leftTokens : rightTokens;
  const longerTokens = leftTokens.length <= rightTokens.length ? rightTokens : leftTokens;

  if (shorterTokens.length === 1 && longerTokens.length >= 2) {
    const shortToken = shorterTokens[0];
    const longerInitialism = getTokensInitialism(longerTokens);

    if (
      shortToken.length >= 2 &&
      shortToken.length <= 4 &&
      shortToken === longerInitialism
    ) {
      return 0.9;
    }
  }

  const sharedSuffixCount = getSharedSuffixTokenCount(shorterTokens, longerTokens);

  if (sharedSuffixCount >= 1) {
    const shorterPrefix = shorterTokens.slice(0, shorterTokens.length - sharedSuffixCount);
    const longerPrefix = longerTokens.slice(0, longerTokens.length - sharedSuffixCount);

    if (shorterPrefix.length === 1 && longerPrefix.length >= 2) {
      const shortToken = shorterPrefix[0];
      const longerPrefixInitialism = getTokensInitialism(longerPrefix);

      if (
        shortToken.length >= 2 &&
        shortToken.length <= 4 &&
        shortToken === longerPrefixInitialism
      ) {
        return 0.94;
      }
    }
  }

  return 0;
}

function getLabelContainmentScore(left: string, right: string) {
  if (!left || !right) {
    return 0;
  }

  if (left === right) {
    return 1;
  }

  const shorter = left.length <= right.length ? left : right;
  const longer = left.length <= right.length ? right : left;

  if (` ${longer} `.includes(` ${shorter} `)) {
    return shorter.length <= 4 ? 0.96 : 0.92;
  }

  if (shorter.length <= 4 && longer.startsWith(`${shorter} `)) {
    return 0.95;
  }

  return 0;
}

function getWeightedTokenMatchScore(tokens: string[], otherTokens: string[]) {
  if (tokens.length === 0 || otherTokens.length === 0) {
    return 0;
  }

  let weightedScore = 0;
  let totalWeight = 0;

  tokens.forEach((token) => {
    const weight = getTokenWeight(token);
    const bestSimilarity = otherTokens.reduce((bestScore, otherToken) => {
      const currentScore = getTokenSimilarity(token, otherToken);
      return currentScore > bestScore ? currentScore : bestScore;
    }, 0);

    weightedScore += bestSimilarity * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? weightedScore / totalWeight : 0;
}

function getSharedTokenCount(leftTokens: string[], rightTokens: string[]) {
  const rightSet = new Set(rightTokens);
  return leftTokens.filter((token) => rightSet.has(token)).length;
}

function getTeamSimilarity(left: string, right: string): TeamSimilarityResult {
  const leftTokens = getComparableTeamTokens(left);
  const rightTokens = getComparableTeamTokens(right);
  const normalizedLeft = leftTokens.join(' ');
  const normalizedRight = rightTokens.join(' ');

  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return {
      score: 0,
      normalizedLeft,
      normalizedRight,
      leftTokens,
      rightTokens,
    };
  }

  if (normalizedLeft === normalizedRight) {
    return {
      score: 1,
      normalizedLeft,
      normalizedRight,
      leftTokens,
      rightTokens,
    };
  }

  const sharedTokenCount = getSharedTokenCount(leftTokens, rightTokens);
  const leftScore = getWeightedTokenMatchScore(leftTokens, rightTokens);
  const rightScore = getWeightedTokenMatchScore(rightTokens, leftTokens);
  const phraseScore =
    sharedTokenCount > 0 ? getDiceCoefficient(normalizedLeft, normalizedRight) : 0;
  const containmentScore = getLabelContainmentScore(normalizedLeft, normalizedRight);
  const initialismScore = getLabelInitialismScore(leftTokens, rightTokens);

  let score = Math.max(
    (leftScore + rightScore) / 2,
    phraseScore * 0.92,
    containmentScore,
    initialismScore,
  );

  if (sharedTokenCount > 0) {
    score += Math.min(0.12, sharedTokenCount * 0.04);
  }

  return {
    score: Math.min(1, score),
    normalizedLeft,
    normalizedRight,
    leftTokens,
    rightTokens,
  };
}

function getLeagueSimilarity(left: string, right: string) {
  const normalizedLeft = getComparableCompetitionLabel(left);
  const normalizedRight = getComparableCompetitionLabel(right);

  if (!normalizedLeft || !normalizedRight) {
    return null;
  }

  if (normalizedLeft === normalizedRight) {
    return 1;
  }

  const leftTokens = getComparableCompetitionTokens(left);
  const rightTokens = getComparableCompetitionTokens(right);
  const sharedTokenCount = getSharedTokenCount(leftTokens, rightTokens);
  const leftScore = getWeightedTokenMatchScore(leftTokens, rightTokens);
  const rightScore = getWeightedTokenMatchScore(rightTokens, leftTokens);
  const phraseScore =
    sharedTokenCount > 0 ? getDiceCoefficient(normalizedLeft, normalizedRight) : 0;
  const containmentScore = getLabelContainmentScore(normalizedLeft, normalizedRight);

  let score = Math.max((leftScore + rightScore) / 2, phraseScore * 0.94, containmentScore);

  if (sharedTokenCount > 0) {
    score += Math.min(0.1, sharedTokenCount * 0.04);
  }

  return Math.min(1, score);
}

function getFixtureTeams(fixture: SportsFixtureEntry) {
  return {
    home: normalizeWhitespace(fixture.teams?.home?.name ?? ''),
    away: normalizeWhitespace(fixture.teams?.away?.name ?? ''),
  };
}

function getFixtureEventLabel(fixture: SportsFixtureEntry) {
  const teams = getFixtureTeams(fixture);
  return teams.home && teams.away ? normalizeEventName(`${teams.home} - ${teams.away}`) : '';
}

function getFixtureLeagueName(fixture: SportsFixtureEntry) {
  return normalizeWhitespace(fixture.league?.name ?? '');
}

function getFixtureDateValue(fixture: SportsFixtureEntry) {
  return (
    fixture.fixture?.date ??
    fixture.game?.date ??
    fixture.date ??
    ''
  );
}

function getFixtureId(fixture: SportsFixtureEntry) {
  return fixture.fixture?.id ?? fixture.game?.id ?? fixture.id ?? undefined;
}

function getFixtureStatusShortValue(fixture: SportsFixtureEntry) {
  if (typeof fixture.status === 'string') {
    return normalizeWhitespace(fixture.status).toUpperCase();
  }

  return normalizeWhitespace(
    fixture.fixture?.status?.short ??
      fixture.game?.status?.short ??
      fixture.status?.short ??
      '',
  ).toUpperCase();
}

function getFixtureStatusLongValue(fixture: SportsFixtureEntry) {
  if (typeof fixture.status === 'string') {
    return normalizeWhitespace(fixture.status).toUpperCase();
  }

  return normalizeWhitespace(
    fixture.fixture?.status?.long ??
      fixture.game?.status?.long ??
      fixture.status?.long ??
      '',
  ).toUpperCase();
}

function parseScoreValue(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  if (typeof value === 'object' && value !== null) {
    if ('total' in value) {
      return parseScoreValue(value.total);
    }

    if ('points' in value) {
      return parseScoreValue(value.points);
    }

    if ('score' in value) {
      return parseScoreValue(value.score);
    }

    if ('goals' in value) {
      return parseScoreValue(value.goals);
    }
  }

  return null;
}

function getFixtureScores(fixture: SportsFixtureEntry) {
  return {
    homeScore: parseScoreValue(fixture.goals?.home ?? fixture.scores?.home ?? null),
    awayScore: parseScoreValue(fixture.goals?.away ?? fixture.scores?.away ?? null),
  };
}

function getFixtureTimeValue(fixture: SportsFixtureEntry) {
  const value = getFixtureDateValue(fixture);
  return value.length >= 16 ? value.slice(11, 16) : '';
}

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

function getClockTimeDifferenceMinutes(left: string, right: string) {
  if (!left || !right) {
    return null;
  }

  const [leftHours, leftMinutes] = left.split(':').map(Number);
  const [rightHours, rightMinutes] = right.split(':').map(Number);

  if (
    !Number.isInteger(leftHours) ||
    !Number.isInteger(leftMinutes) ||
    !Number.isInteger(rightHours) ||
    !Number.isInteger(rightMinutes)
  ) {
    return null;
  }

  const leftTotalMinutes = leftHours * 60 + leftMinutes;
  const rightTotalMinutes = rightHours * 60 + rightMinutes;
  const absoluteDifference = Math.abs(leftTotalMinutes - rightTotalMinutes);

  return Math.min(absoluteDifference, 1440 - absoluteDifference);
}

function getDateDifferenceDays(requestDate: string, fixtureDate: string | null | undefined) {
  if (!fixtureDate) {
    return Number.POSITIVE_INFINITY;
  }

  const requestDayStart = new Date(`${requestDate}T00:00:00Z`);
  const fixtureDateObject = new Date(fixtureDate);

  if (
    Number.isNaN(requestDayStart.getTime()) ||
    Number.isNaN(fixtureDateObject.getTime())
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const fixtureDayStart = Date.UTC(
    fixtureDateObject.getUTCFullYear(),
    fixtureDateObject.getUTCMonth(),
    fixtureDateObject.getUTCDate(),
  );

  return Math.abs(Math.round((fixtureDayStart - requestDayStart.getTime()) / 86_400_000));
}

function getCandidateTimeScore(timeDeltaMinutes: number | null) {
  if (timeDeltaMinutes === null) {
    return 0;
  }

  if (timeDeltaMinutes === 0) {
    return 7;
  }

  if (timeDeltaMinutes <= 30) {
    return 5;
  }

  if (timeDeltaMinutes <= 90) {
    return 3;
  }

  if (timeDeltaMinutes <= 180) {
    return 1;
  }

  if (timeDeltaMinutes <= 360) {
    return 0;
  }

  if (timeDeltaMinutes <= 720) {
    return -3;
  }

  return -7;
}

function getCandidateDateScore(dateDeltaDays: number) {
  if (!Number.isFinite(dateDeltaDays)) {
    return -10;
  }

  if (dateDeltaDays === 0) {
    return 6;
  }

  if (dateDeltaDays === 1) {
    return 1;
  }

  return -12;
}

function getCandidateRejectReason(candidate: Omit<FixtureCandidateAnalysis, 'accepted' | 'rejectReason'>) {
  if (candidate.homeScore < 0.52) {
    return 'Слабое совпадение первой команды.';
  }

  if (candidate.awayScore < 0.52) {
    return 'Слабое совпадение второй команды.';
  }

  if (candidate.combinedScore < 0.74) {
    return 'Недостаточный общий similarity обеих команд.';
  }

  if (!Number.isFinite(candidate.dateDeltaDays) || candidate.dateDeltaDays > 1) {
    return 'Кандидат слишком далеко по дате.';
  }

  if (
    candidate.dateDeltaDays === 1 &&
    candidate.timeDeltaMinutes === null &&
    candidate.combinedScore < 0.9
  ) {
    return 'Соседний день без подтверждения по времени и со слабым score.';
  }

  if (
    candidate.dateDeltaDays === 1 &&
    candidate.timeDeltaMinutes !== null &&
    candidate.combinedScore < 0.82
  ) {
    return 'Соседний день, но similarity недостаточно высокий.';
  }

  if (
    candidate.leagueScore !== null &&
    candidate.leagueScore < 0.45 &&
    candidate.dateDeltaDays === 1 &&
    candidate.combinedScore < 0.9
  ) {
    return 'Слабое совпадение лиги для соседней даты.';
  }

  if (candidate.timeDeltaMinutes !== null && candidate.timeDeltaMinutes > 720) {
    return 'Слишком большая разница во времени матча.';
  }

  return null;
}

function analyzeFixtureCandidate(
  request: MatchCheckRequest,
  requestTeams: readonly [string, string],
  fixture: SportsFixtureEntry,
): FixtureCandidateAnalysis {
  const fixtureTeams = getFixtureTeams(fixture);
  const requestTime = normalizeTimeValue(request.time);
  const fixtureTime = getFixtureTimeValue(fixture);
  const sameHome = getTeamSimilarity(requestTeams[0], fixtureTeams.home);
  const sameAway = getTeamSimilarity(requestTeams[1], fixtureTeams.away);
  const reverseHome = getTeamSimilarity(requestTeams[0], fixtureTeams.away);
  const reverseAway = getTeamSimilarity(requestTeams[1], fixtureTeams.home);
  const sameCombined = (sameHome.score + sameAway.score) / 2;
  const reverseCombined = (reverseHome.score + reverseAway.score) / 2;
  const useReverse = reverseCombined > sameCombined;
  const homeScore = useReverse ? reverseHome.score : sameHome.score;
  const awayScore = useReverse ? reverseAway.score : sameAway.score;
  const combinedScore = (homeScore + awayScore) / 2;
  const dateDeltaDays = getDateDifferenceDays(request.date, getFixtureDateValue(fixture));
  const timeDeltaMinutes = getClockTimeDifferenceMinutes(requestTime, fixtureTime);
  const eventLabel = getFixtureEventLabel(fixture);
  const leagueName = getFixtureLeagueName(fixture);
  const normalizedRequestEvent = normalizeComparableText(normalizeEventName(request.event));
  const normalizedFixtureEvent = normalizeComparableText(eventLabel);
  const exactEventMatch =
    normalizedRequestEvent !== '' &&
    normalizedRequestEvent === normalizedFixtureEvent;
  const apiStatus = getFixtureStatusShortValue(fixture);
  const leagueScore =
    typeof request.leagueName === 'string' && request.leagueName.trim() !== ''
      ? getLeagueSimilarity(request.leagueName, leagueName)
      : null;
  const totalScore =
    combinedScore * 100 +
    (useReverse ? -4 : 0) +
    (exactEventMatch ? 8 : 0) +
    ((leagueScore ?? 0) * 12) +
    getCandidateTimeScore(timeDeltaMinutes) +
    getCandidateDateScore(dateDeltaDays) +
    (getFixtureId(fixture) ? 1 : 0);

  const baseCandidate = {
    fixture,
    eventLabel,
    leagueName,
    apiStatus,
    orientation: useReverse ? 'reverse' : 'same',
    homeScore,
    awayScore,
    combinedScore,
    leagueScore,
    timeDeltaMinutes,
    dateDeltaDays,
    totalScore,
  } as const;
  const rejectReason = getCandidateRejectReason(baseCandidate);

  return {
    ...baseCandidate,
    accepted: rejectReason === null,
    rejectReason,
  };
}

function summarizeCandidateForDebug(candidate: FixtureCandidateAnalysis) {
  return {
      fixtureId: getFixtureId(candidate.fixture) ?? null,
    event: candidate.eventLabel || null,
    leagueName: candidate.leagueName || null,
    apiStatus: candidate.apiStatus || null,
    orientation: candidate.orientation,
    homeScore: roundScore(candidate.homeScore),
    awayScore: roundScore(candidate.awayScore),
    combinedScore: roundScore(candidate.combinedScore),
    leagueScore: candidate.leagueScore === null ? null : roundScore(candidate.leagueScore),
    totalScore: roundScore(candidate.totalScore),
    dateDeltaDays: Number.isFinite(candidate.dateDeltaDays) ? candidate.dateDeltaDays : null,
    timeDeltaMinutes: candidate.timeDeltaMinutes,
    accepted: candidate.accepted,
    rejectReason: candidate.rejectReason,
  };
}

function getEventOrderScores(candidate: FixtureCandidateAnalysis) {
  const fixtureScores = getFixtureScores(candidate.fixture);

  if (candidate.orientation === 'reverse') {
    return {
      firstTeamScore: fixtureScores.awayScore,
      secondTeamScore: fixtureScores.homeScore,
    };
  }

  return {
    firstTeamScore: fixtureScores.homeScore,
    secondTeamScore: fixtureScores.awayScore,
  };
}

function findBestFixtureMatch(
  request: MatchCheckRequest,
  fixtures: SportsFixtureEntry[],
) {
  const requestTeams = splitEventTeams(request.event);

  if (!requestTeams) {
    return {
      matchedFixture: null,
      matchedCandidate: null,
      requestTeams: null,
      topCandidates: [],
      rejectedReason: 'Не удалось разделить событие ставки на две команды.',
    };
  }

  const analyzedCandidates = fixtures
    .map((fixture) => analyzeFixtureCandidate(request, requestTeams, fixture))
    .sort((left, right) => right.totalScore - left.totalScore);

  const matchedCandidate = analyzedCandidates.find((candidate) => candidate.accepted) ?? null;
  const bestRejectedCandidate = analyzedCandidates[0] ?? null;

  return {
    matchedFixture: matchedCandidate?.fixture ?? null,
    matchedCandidate,
    requestTeams,
    topCandidates: analyzedCandidates.slice(0, 5).map(summarizeCandidateForDebug),
    rejectedReason:
      matchedCandidate === null
        ? bestRejectedCandidate?.rejectReason ?? 'API-Sports не вернул подходящих кандидатов.'
        : null,
  };
}

function buildSportsFixturesUrl(baseUrl: string, date: string, resourcePath: 'fixtures' | 'games') {
  const url = new URL(baseUrl);
  const normalizedPath = url.pathname.replace(/\/$/, '');

  url.pathname = normalizedPath.endsWith(`/${resourcePath}`)
    ? normalizedPath
    : `${normalizedPath}/${resourcePath}`.replace(/\/{2,}/g, '/');
  url.searchParams.set('date', date);

  return url.toString();
}

function getMatchCheckSport(value: string): MatchCheckSport | null {
  const normalizedSport = normalizeComparableText(value);

  if (FOOTBALL_SPORT_ALIASES.has(normalizedSport)) {
    return 'football';
  }

  if (BASKETBALL_SPORT_ALIASES.has(normalizedSport)) {
    return 'basketball';
  }

  if (HOCKEY_SPORT_ALIASES.has(normalizedSport)) {
    return 'hockey';
  }

  return null;
}

function logDebugEvent(
  debugLog: MatchCheckOptions['debugLog'],
  event: string,
  payload: unknown,
) {
  if (!debugLog) {
    return;
  }

  debugLog(event, payload);
}

function getSportApiConfig(sport: MatchCheckSport, env: MatchCheckEnvironment) {
  if (sport === 'football') {
    return {
      baseUrl: env.sportsApiFootballBaseUrl,
      resourcePath: 'fixtures' as const,
    };
  }

  if (sport === 'basketball') {
    return {
      baseUrl: env.sportsApiBasketballBaseUrl,
      resourcePath: 'games' as const,
    };
  }

  return {
    baseUrl: env.sportsApiHockeyBaseUrl,
    resourcePath: 'games' as const,
  };
}

async function fetchFixturesForDate(
  sport: MatchCheckSport,
  date: string,
  env: MatchCheckEnvironment,
  fetchImpl: typeof fetch,
  debugLog?: MatchCheckOptions['debugLog'],
) : Promise<SportsDateLookupResult> {
  const sportApiConfig = getSportApiConfig(sport, env);

  if (!sportApiConfig.baseUrl) {
    logDebugEvent(debugLog, 'match:config-error', {
      sport,
      normalizedSportKey: sport,
      requestedDate: date,
      baseUrl: null,
      reason:
        sport === 'football'
          ? 'SPORTS_API_FOOTBALL_BASE_URL missing'
          : sport === 'basketball'
            ? 'SPORTS_API_BASKETBALL_BASE_URL missing'
            : 'SPORTS_API_HOCKEY_BASE_URL missing',
    });

    throw new Error(
      sport === 'football'
        ? 'SPORTS_API_FOOTBALL_BASE_URL не задан на сервере.'
        : sport === 'basketball'
          ? 'SPORTS_API_BASKETBALL_BASE_URL не задан на сервере.'
          : 'SPORTS_API_HOCKEY_BASE_URL не задан на сервере.',
    );
  }

  const requestUrl = buildSportsFixturesUrl(
    sportApiConfig.baseUrl,
    date,
    sportApiConfig.resourcePath,
  );

  logDebugEvent(debugLog, 'match:lookup-request', {
    sport,
    normalizedSportKey: sport,
    requestedDate: date,
    baseUrl: sportApiConfig.baseUrl,
    requestUrl,
  });

  const response = await fetchImpl(
    requestUrl,
    {
      headers: {
        Accept: 'application/json',
        'x-apisports-key': env.sportsApiKey!,
      },
    },
  );
  const rawBody = await response.text();
  let payload: SportsFixturesApiResponse | null = null;

  if (rawBody.trim() !== '') {
    try {
      payload = JSON.parse(rawBody) as SportsFixturesApiResponse;
    } catch {
      payload = null;
    }
  }

  const debugMessages = [
    ...extractApiMessages(payload?.errors),
    ...extractApiMessages(payload?.message),
    ...(payload === null && rawBody.trim() !== '' ? [normalizeWhitespace(rawBody)] : []),
  ].filter((message, index, messages) => message !== '' && messages.indexOf(message) === index);
  const planLimitedReason = getPlanLimitedReason(response.status, debugMessages);
  const responseCount = Array.isArray(payload?.response) ? payload.response.length : 0;

  logDebugEvent(debugLog, 'match:lookup-response', {
    sport,
    normalizedSportKey: sport,
    requestedDate: date,
    baseUrl: sportApiConfig.baseUrl,
    requestUrl,
    apiStatus: response.status,
    responseCount,
    planLimited: Boolean(planLimitedReason),
    planLimitedReason,
    apiMessages: debugMessages,
  });

  if (planLimitedReason) {
    return {
      date,
      fixtures: Array.isArray(payload?.response) ? payload.response : [],
      planLimited: true,
      planLimitedReason,
      debugMessages,
    };
  }

  if (!response.ok) {
    throw new Error(debugMessages[0] ?? `API-Sports вернул ошибку ${response.status}.`);
  }

  if (payload !== null && !Array.isArray(payload.response) && debugMessages.length > 0) {
    throw new Error(debugMessages[0]);
  }

  return {
    date,
    fixtures: Array.isArray(payload?.response) ? payload.response : [],
    planLimited: false,
    planLimitedReason: null,
    debugMessages,
  };
}

function extractApiMessages(value: unknown): string[] {
  if (typeof value === 'string') {
    const normalized = normalizeWhitespace(value);
    return normalized === '' ? [] : [normalized];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractApiMessages(item));
  }

  if (typeof value === 'object' && value !== null) {
    return Object.values(value).flatMap((item) => extractApiMessages(item));
  }

  return [];
}

function getPlanLimitedReason(statusCode: number, messages: string[]) {
  const normalizedMessages = messages.map((message) => normalizeComparableText(message));
  const matchedMessageIndex = normalizedMessages.findIndex((message) =>
    PLAN_LIMITED_MESSAGE_PATTERNS.some((pattern) => message.includes(pattern)),
  );

  if (matchedMessageIndex >= 0) {
    return messages[matchedMessageIndex];
  }

  if (statusCode === 429) {
    return 'API-Sports временно ограничил доступ по лимиту плана.';
  }

  return null;
}

function deduplicateFixtures(fixtures: SportsFixtureEntry[]) {
  const seenKeys = new Set<string>();

  return fixtures.filter((fixture) => {
    const eventLabel = getFixtureEventLabel(fixture);
    const fixtureDate = getFixtureDateValue(fixture);
    const fallbackKey = `${eventLabel}::${fixtureDate}`;
    const key =
      getFixtureId(fixture) !== null && getFixtureId(fixture) !== undefined
        ? `fixture:${getFixtureId(fixture)}`
        : `fallback:${fallbackKey}`;

    if (seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
}

function shiftDateString(date: string, offsetDays: number) {
  const parsedDate = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  parsedDate.setUTCDate(parsedDate.getUTCDate() + offsetDays);
  return parsedDate.toISOString().slice(0, 10);
}

function buildFallbackDateList(date: string) {
  return FALLBACK_DATE_OFFSETS
    .map((offsetDays) => shiftDateString(date, offsetDays))
    .filter((value): value is string => value !== null && value !== date);
}

function logMatchCheckDebug(
  debugLog: MatchCheckOptions['debugLog'],
  event: 'match:not-found' | 'match:plan-limited',
  request: MatchCheckRequest,
  requestTeams: readonly [string, string] | null,
  attemptedDates: string[],
  fixtures: SportsFixtureEntry[],
  topCandidates: ReturnType<typeof summarizeCandidateForDebug>[],
  rejectedReason: string | null,
  planLimitedDates: string[],
  planLimitedReasons: string[],
) {
  if (!debugLog) {
    return;
  }

  debugLog(event, {
    request: {
      sport: request.sport,
      date: request.date,
      time: request.time,
      event: request.event,
      leagueName: request.leagueName ?? '',
    },
    recognizedTeams:
      requestTeams === null
        ? null
        : {
            home: requestTeams[0],
            away: requestTeams[1],
            normalizedHome: getComparableTeamLabel(requestTeams[0]),
            normalizedAway: getComparableTeamLabel(requestTeams[1]),
          },
    normalizedLeagueName:
      request.leagueName && request.leagueName.trim() !== ''
        ? getComparableCompetitionLabel(request.leagueName)
        : '',
    attemptedDates,
    fixtureCount: fixtures.length,
    planLimited: planLimitedDates.length > 0,
    planLimitedDates,
    planLimitedReasons,
    topCandidates,
    rejectedReason,
  });
}

export function isFootballSport(value: string) {
  return getMatchCheckSport(value) === 'football';
}

export function isSupportedMatchCheckSport(value: string) {
  return getMatchCheckSport(value) !== null;
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
    .split(/\s+-\s+/)
    .map((part) => normalizeWhitespace(part))
    .filter(Boolean);

  if (strictParts.length === 2) {
    return [strictParts[0], strictParts[1]] as const;
  }

  const rawDelimiterMatches = value.match(/[–—-]/g) ?? [];

  if (rawDelimiterMatches.length === 1) {
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
  request: Pick<MatchCheckRequest, 'sport' | 'date' | 'time' | 'event' | 'leagueName'>,
) {
  return [
    normalizeComparableText(request.sport),
    request.date.trim(),
    normalizeTimeValue(request.time),
    normalizeEventName(request.event),
    typeof request.leagueName === 'string'
      ? getComparableCompetitionLabel(request.leagueName)
      : '',
  ].join('::');
}

function normalizeSettlementSelection(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/Х/g, 'X')
    .replace(/П/g, 'P');
}

function compareSettlementValues(left: number, right: number) {
  const difference = left - right;

  if (Math.abs(difference) < 1e-9) {
    return 0;
  }

  return difference > 0 ? 1 : -1;
}

function parseSettlementLineValue(value: string) {
  const parsedValue = Number(value.replace(',', '.'));
  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function parseSupportedSettlementMarket(
  marketType: string,
  selection: string,
): ParsedSettlementMarket | null {
  const normalizedSelection = normalizeSettlementSelection(selection);

  if (marketType === 'outcomes') {
    return SUPPORTED_OUTCOME_MARKET_SELECTIONS.has(normalizedSelection)
      ? {
          kind: 'outcomes',
          selection: normalizedSelection,
        }
      : null;
  }

  if (marketType === 'totals') {
    const totalsMatch = normalizedSelection.match(/^Т([БМ])\(?([+-]?\d+(?:\.\d+)?)\)?$/);

    if (!totalsMatch) {
      return null;
    }

    const line = parseSettlementLineValue(totalsMatch[2]);

    if (line === null) {
      return null;
    }

    return {
      kind: 'totals',
      direction: totalsMatch[1] === 'Б' ? 'over' : 'under',
      line,
    };
  }

  if (marketType === 'handicaps') {
    const handicapMatch = normalizedSelection.match(/^Ф([12])\(?([+-]?\d+(?:\.\d+)?)\)?$/);

    if (!handicapMatch) {
      return null;
    }

    const line = parseSettlementLineValue(handicapMatch[2]);

    if (line === null) {
      return null;
    }

    return {
      kind: 'handicaps',
      side: handicapMatch[1] === '1' ? 1 : 2,
      line,
    };
  }

  return null;
}

export function getSupportedMarketSettlementResult(
  marketType: string,
  selection: string,
  matchCheck: Pick<MatchCheckResponse, 'status' | 'firstTeamScore' | 'secondTeamScore'>,
): SupportedOutcomeSettlementResult | null {
  if (matchCheck.status !== 'finished') {
    return null;
  }

  if (
    typeof matchCheck.firstTeamScore !== 'number' ||
    !Number.isFinite(matchCheck.firstTeamScore) ||
    typeof matchCheck.secondTeamScore !== 'number' ||
    !Number.isFinite(matchCheck.secondTeamScore)
  ) {
    return null;
  }

  const parsedMarket = parseSupportedSettlementMarket(marketType, selection);

  if (!parsedMarket) {
    return null;
  }

  const firstTeamWon = matchCheck.firstTeamScore > matchCheck.secondTeamScore;
  const secondTeamWon = matchCheck.secondTeamScore > matchCheck.firstTeamScore;
  const isDraw = matchCheck.firstTeamScore === matchCheck.secondTeamScore;

  if (parsedMarket.kind === 'outcomes') {
    switch (parsedMarket.selection) {
      case 'P1':
        return firstTeamWon ? 'won' : 'lost';
      case 'P2':
        return secondTeamWon ? 'won' : 'lost';
      case 'X':
        return isDraw ? 'won' : 'lost';
      case '1X':
        return firstTeamWon || isDraw ? 'won' : 'lost';
      case '12':
        return isDraw ? 'lost' : 'won';
      case 'X2':
        return secondTeamWon || isDraw ? 'won' : 'lost';
      default:
        return null;
    }
  }

  if (parsedMarket.kind === 'totals') {
    const totalScore = matchCheck.firstTeamScore + matchCheck.secondTeamScore;
    const comparison = compareSettlementValues(totalScore, parsedMarket.line);

    if (comparison === 0) {
      return 'refund';
    }

    if (parsedMarket.direction === 'over') {
      return comparison > 0 ? 'won' : 'lost';
    }

    return comparison < 0 ? 'won' : 'lost';
  }

  const adjustedFirstScore =
    parsedMarket.side === 1
      ? matchCheck.firstTeamScore + parsedMarket.line
      : matchCheck.firstTeamScore;
  const adjustedSecondScore =
    parsedMarket.side === 2
      ? matchCheck.secondTeamScore + parsedMarket.line
      : matchCheck.secondTeamScore;
  const comparison = compareSettlementValues(adjustedFirstScore, adjustedSecondScore);

  if (comparison === 0) {
    return 'refund';
  }

  if (parsedMarket.side === 1) {
    return comparison > 0 ? 'won' : 'lost';
  }

  return comparison < 0 ? 'won' : 'lost';
}

function mapFootballApiStatus(shortStatus: string | null | undefined): MatchCheckStatus {
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

function mapGenericApiStatus(
  shortStatus: string | null | undefined,
  longStatus: string | null | undefined,
): MatchCheckStatus {
  const normalizedShort = normalizeWhitespace(shortStatus ?? '').toUpperCase();
  const normalizedLong = normalizeWhitespace(longStatus ?? '').toUpperCase();

  if (
    GENERIC_NOT_STARTED_API_STATUSES.has(normalizedShort) ||
    GENERIC_NOT_STARTED_API_STATUSES.has(normalizedLong)
  ) {
    return 'not_started';
  }

  if (
    GENERIC_LIVE_API_STATUSES.has(normalizedShort) ||
    GENERIC_LIVE_API_STATUSES.has(normalizedLong)
  ) {
    return 'live';
  }

  if (
    GENERIC_FINISHED_API_STATUSES.has(normalizedShort) ||
    GENERIC_FINISHED_API_STATUSES.has(normalizedLong)
  ) {
    return 'finished';
  }

  return 'not_found';
}

function mapMatchApiStatus(
  sport: MatchCheckSport,
  shortStatus: string | null | undefined,
  longStatus: string | null | undefined,
): MatchCheckStatus {
  if (sport === 'football') {
    return mapFootballApiStatus(shortStatus);
  }

  return mapGenericApiStatus(shortStatus, longStatus);
}

export async function checkMatchStatus(
  request: Partial<MatchCheckRequest> | null | undefined,
  env: MatchCheckEnvironment,
  fetchImpl: typeof fetch = fetch,
  options: MatchCheckOptions = {},
): Promise<MatchCheckResponse> {
  const matchCheckSport = getMatchCheckSport(
    typeof request?.sport === 'string' ? request.sport.trim() : '',
  );
  const normalizedSportKey =
    typeof request?.sport === 'string' ? normalizeComparableText(request.sport.trim()) : '';
  const normalizedRequest: MatchCheckRequest = {
    sport: typeof request?.sport === 'string' ? request.sport.trim() : '',
    date: typeof request?.date === 'string' ? request.date.trim() : '',
    time: typeof request?.time === 'string' ? normalizeTimeValue(request.time) : '',
    event: typeof request?.event === 'string' ? normalizeEventName(request.event) : '',
    leagueName: typeof request?.leagueName === 'string' ? request.leagueName.trim() : '',
  };
  const selectedBaseUrl =
    matchCheckSport === null ? null : getSportApiConfig(matchCheckSport, env).baseUrl ?? null;

  logDebugEvent(options.debugLog, 'match:request-start', {
    sport: normalizedRequest.sport,
    normalizedSportKey,
    resolvedSportKey: matchCheckSport,
    selectedBaseUrl,
    date: normalizedRequest.date,
    time: normalizedRequest.time,
    event: normalizedRequest.event,
    leagueName: normalizedRequest.leagueName ?? '',
  });

  if (
    matchCheckSport === null ||
    normalizedRequest.date === '' ||
    normalizedRequest.event === ''
  ) {
    logDebugEvent(options.debugLog, 'match:invalid-request', {
      sport: normalizedRequest.sport,
      normalizedSportKey,
      resolvedSportKey: matchCheckSport,
      selectedBaseUrl,
      date: normalizedRequest.date,
      time: normalizedRequest.time,
      event: normalizedRequest.event,
      reason:
        matchCheckSport === null
          ? 'Unsupported sport mapping'
          : normalizedRequest.date === ''
            ? 'Missing date'
            : 'Missing event',
    });

    return { status: 'not_found' };
  }

  if (!env.sportsApiKey) {
    logDebugEvent(options.debugLog, 'match:config-error', {
      sport: normalizedRequest.sport,
      normalizedSportKey,
      resolvedSportKey: matchCheckSport,
      selectedBaseUrl,
      reason: 'SPORTS_API_KEY missing',
    });

    throw new Error('SPORTS_API_KEY не задан на сервере.');
  }

  const queriedDates = [normalizedRequest.date];
  const exactDateResult = await fetchFixturesForDate(
    matchCheckSport,
    normalizedRequest.date,
    env,
    fetchImpl,
    options.debugLog,
  );
  let collectedFixtures = deduplicateFixtures(exactDateResult.fixtures);
  let selection = findBestFixtureMatch(normalizedRequest, collectedFixtures);
  let planLimitedDates = exactDateResult.planLimited ? [exactDateResult.date] : [];
  let planLimitedReasons = exactDateResult.planLimitedReason
    ? [exactDateResult.planLimitedReason]
    : [];

  if (!selection.matchedFixture) {
    const fallbackDates = buildFallbackDateList(normalizedRequest.date);
    queriedDates.push(...fallbackDates);
    const fallbackResults = await Promise.allSettled(
      fallbackDates.map((date) =>
        fetchFixturesForDate(matchCheckSport, date, env, fetchImpl, options.debugLog),
      ),
    );

    fallbackResults.forEach((result) => {
      if (result.status !== 'fulfilled') {
        return;
      }

      collectedFixtures = deduplicateFixtures([...collectedFixtures, ...result.value.fixtures]);

      if (result.value.planLimited) {
        planLimitedDates = [...planLimitedDates, result.value.date];
      }

      if (result.value.planLimitedReason) {
        planLimitedReasons = [...planLimitedReasons, result.value.planLimitedReason];
      }
    });

    planLimitedDates = planLimitedDates.filter(
      (value, index) => value !== '' && planLimitedDates.indexOf(value) === index,
    );
    planLimitedReasons = planLimitedReasons.filter(
      (value, index) => value !== '' && planLimitedReasons.indexOf(value) === index,
    );
    selection = findBestFixtureMatch(normalizedRequest, collectedFixtures);
  }

  if (!selection.matchedFixture || !selection.matchedCandidate) {
    const finalStatus: MatchCheckStatus = planLimitedDates.length > 0 ? 'plan_limited' : 'not_found';

    logMatchCheckDebug(
      options.debugLog,
      planLimitedDates.length > 0 ? 'match:plan-limited' : 'match:not-found',
      normalizedRequest,
      selection.requestTeams,
      queriedDates,
      collectedFixtures,
      selection.topCandidates,
      selection.rejectedReason,
      planLimitedDates,
      planLimitedReasons,
    );

    logDebugEvent(options.debugLog, 'match:result', {
      sport: normalizedRequest.sport,
      normalizedSportKey,
      resolvedSportKey: matchCheckSport,
      selectedBaseUrl,
      attemptedDates: queriedDates,
      status: finalStatus,
      matched: false,
      fixtureId: null,
      matchedEvent: null,
      apiStatus: null,
    });

    return { status: finalStatus };
  }

  const finalResult: MatchCheckResponse = {
    status: mapMatchApiStatus(
      matchCheckSport,
      selection.matchedCandidate.apiStatus,
      getFixtureStatusLongValue(selection.matchedFixture),
    ),
    fixtureId: getFixtureId(selection.matchedFixture),
    apiStatus: selection.matchedCandidate.apiStatus || undefined,
    matchedEvent: selection.matchedCandidate.eventLabel || undefined,
    firstTeamScore: getEventOrderScores(selection.matchedCandidate).firstTeamScore ?? undefined,
    secondTeamScore: getEventOrderScores(selection.matchedCandidate).secondTeamScore ?? undefined,
  };

  logDebugEvent(options.debugLog, 'match:result', {
    sport: normalizedRequest.sport,
    normalizedSportKey,
    resolvedSportKey: matchCheckSport,
    selectedBaseUrl,
    attemptedDates: queriedDates,
    status: finalResult.status,
    matched: true,
    fixtureId: finalResult.fixtureId ?? null,
    matchedEvent: finalResult.matchedEvent ?? null,
    apiStatus: finalResult.apiStatus ?? null,
    firstTeamScore: finalResult.firstTeamScore ?? null,
    secondTeamScore: finalResult.secondTeamScore ?? null,
  });

  return finalResult;
}

export const checkFootballMatchStatus = checkMatchStatus;
