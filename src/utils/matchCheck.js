var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var FOOTBALL_SPORT_ALIASES = new Set(['football', 'soccer', 'футбол']);
var BASKETBALL_SPORT_ALIASES = new Set(['basketball', 'баскетбол', 'basket']);
var HOCKEY_SPORT_ALIASES = new Set(['hockey', 'ice hockey', 'ice-hockey', 'хоккей', 'хоккеи']);
var GENERIC_NOT_STARTED_API_STATUSES = new Set([
    'NS',
    'TBD',
    'SCHEDULED',
    'NOT STARTED',
    'NOT_STARTED',
    'UPCOMING',
]);
var GENERIC_LIVE_API_STATUSES = new Set([
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
var GENERIC_FINISHED_API_STATUSES = new Set([
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
var NOT_STARTED_API_STATUSES = new Set(['NS', 'TBD', 'PST']);
var LIVE_API_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT']);
var FINISHED_API_STATUSES = new Set(['FT', 'AET', 'PEN']);
var PLAN_LIMITED_MESSAGE_PATTERNS = [
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
var HARD_TEAM_STOPWORDS = new Set([
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
var SOFT_TEAM_TOKENS = new Set(['athletic', 'deportivo', 'real', 'united', 'city']);
var COMPETITION_STOPWORDS = new Set(['league', 'liga', 'division', 'professional']);
var TEAM_TOKEN_ALIASES = {
    st: 'saint',
    utd: 'united',
    untd: 'united',
    man: 'manchester',
};
var FALLBACK_DATE_OFFSETS = [-1, 1];
export var MATCH_CHECK_REQUEST_TIMEOUT_MS = 12000;
export var matchCheckStatusLabels = {
    checking: 'Проверяем',
    not_started: 'Не начался',
    live: 'В лайве',
    finished: 'Завершён',
    not_found: 'Не найден',
    plan_limited: 'недоступен на free API',
};
export var matchCheckStatusBadgeStyles = {
    checking: 'badge-neutral',
    not_started: 'badge-info-light',
    live: 'badge-warning-light',
    finished: 'badge-success-light',
    not_found: 'badge-neutral',
    plan_limited: 'badge-neutral',
};
var SUPPORTED_OUTCOME_MARKET_SELECTIONS = new Set(['P1', 'P2', 'X', '1X', '12', 'X2']);
function normalizeWhitespace(value) {
    return value.replace(/\s+/g, ' ').trim();
}
function stripDiacritics(value) {
    return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
}
function normalizeComparableText(value) {
    return normalizeWhitespace(stripDiacritics(value)
        .toLowerCase()
        .replace(/[’']/g, '')
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9\u0400-\u04ff\s-]/g, ' '));
}
function normalizeTimeValue(value) {
    var normalized = value.trim();
    return /^\d{2}:\d{2}$/.test(normalized) ? normalized : '';
}
function normalizeTeamToken(token) {
    var _a;
    return (_a = TEAM_TOKEN_ALIASES[token]) !== null && _a !== void 0 ? _a : token;
}
function deduplicateTokens(tokens) {
    return tokens.filter(function (token, index) { return token !== '' && tokens.indexOf(token) === index; });
}
function getComparableTeamTokens(name) {
    var baseTokens = normalizeComparableText(name)
        .split(/[\s-]+/)
        .map(normalizeTeamToken)
        .filter(function (token) { return token && !HARD_TEAM_STOPWORDS.has(token); });
    return deduplicateTokens(baseTokens);
}
function getComparableTeamLabel(name) {
    return getComparableTeamTokens(name).join(' ');
}
function getComparableCompetitionTokens(name) {
    var baseTokens = normalizeComparableText(name)
        .split(/[\s-]+/)
        .map(normalizeTeamToken)
        .filter(function (token) { return token && !COMPETITION_STOPWORDS.has(token); });
    return deduplicateTokens(baseTokens);
}
function getComparableCompetitionLabel(name) {
    return getComparableCompetitionTokens(name).join(' ');
}
function getTokenWeight(token) {
    return SOFT_TEAM_TOKENS.has(token) ? 0.35 : 1;
}
function getCharacterBigrams(value) {
    var normalized = value.replace(/\s+/g, ' ');
    if (normalized.length < 2) {
        return normalized === '' ? [] : [normalized];
    }
    var bigrams = [];
    for (var index = 0; index < normalized.length - 1; index += 1) {
        bigrams.push(normalized.slice(index, index + 2));
    }
    return bigrams;
}
function getDiceCoefficient(left, right) {
    if (!left || !right) {
        return 0;
    }
    if (left === right) {
        return 1;
    }
    var leftBigrams = getCharacterBigrams(left);
    var rightBigrams = getCharacterBigrams(right);
    if (leftBigrams.length === 0 || rightBigrams.length === 0) {
        return 0;
    }
    var rightCounts = new Map();
    rightBigrams.forEach(function (bigram) {
        var _a;
        rightCounts.set(bigram, ((_a = rightCounts.get(bigram)) !== null && _a !== void 0 ? _a : 0) + 1);
    });
    var sharedCount = 0;
    leftBigrams.forEach(function (bigram) {
        var _a;
        var currentCount = (_a = rightCounts.get(bigram)) !== null && _a !== void 0 ? _a : 0;
        if (currentCount <= 0) {
            return;
        }
        sharedCount += 1;
        rightCounts.set(bigram, currentCount - 1);
    });
    return (2 * sharedCount) / (leftBigrams.length + rightBigrams.length);
}
function getTokenSimilarity(left, right) {
    if (!left || !right) {
        return 0;
    }
    if (left === right) {
        return 1;
    }
    var shorter = left.length <= right.length ? left : right;
    var longer = left.length <= right.length ? right : left;
    if (shorter.length >= 3 && longer.startsWith(shorter)) {
        return 0.9;
    }
    if (shorter.length >= 4 && longer.includes(shorter)) {
        return 0.84;
    }
    var diceScore = getDiceCoefficient(left, right);
    return diceScore >= 0.78 ? diceScore : 0;
}
function getTokensInitialism(tokens) {
    return tokens
        .filter(function (token) { return token !== ''; })
        .map(function (token) { var _a; return (_a = token[0]) !== null && _a !== void 0 ? _a : ''; })
        .join('');
}
function getSharedSuffixTokenCount(leftTokens, rightTokens) {
    var sharedCount = 0;
    var leftIndex = leftTokens.length - 1;
    var rightIndex = rightTokens.length - 1;
    while (leftIndex >= 0 && rightIndex >= 0 && leftTokens[leftIndex] === rightTokens[rightIndex]) {
        sharedCount += 1;
        leftIndex -= 1;
        rightIndex -= 1;
    }
    return sharedCount;
}
function getLabelInitialismScore(leftTokens, rightTokens) {
    if (leftTokens.length === 0 || rightTokens.length === 0) {
        return 0;
    }
    var shorterTokens = leftTokens.length <= rightTokens.length ? leftTokens : rightTokens;
    var longerTokens = leftTokens.length <= rightTokens.length ? rightTokens : leftTokens;
    if (shorterTokens.length === 1 && longerTokens.length >= 2) {
        var shortToken = shorterTokens[0];
        var longerInitialism = getTokensInitialism(longerTokens);
        if (shortToken.length >= 2 &&
            shortToken.length <= 4 &&
            shortToken === longerInitialism) {
            return 0.9;
        }
    }
    var sharedSuffixCount = getSharedSuffixTokenCount(shorterTokens, longerTokens);
    if (sharedSuffixCount >= 1) {
        var shorterPrefix = shorterTokens.slice(0, shorterTokens.length - sharedSuffixCount);
        var longerPrefix = longerTokens.slice(0, longerTokens.length - sharedSuffixCount);
        if (shorterPrefix.length === 1 && longerPrefix.length >= 2) {
            var shortToken = shorterPrefix[0];
            var longerPrefixInitialism = getTokensInitialism(longerPrefix);
            if (shortToken.length >= 2 &&
                shortToken.length <= 4 &&
                shortToken === longerPrefixInitialism) {
                return 0.94;
            }
        }
    }
    return 0;
}
function getLabelContainmentScore(left, right) {
    if (!left || !right) {
        return 0;
    }
    if (left === right) {
        return 1;
    }
    var shorter = left.length <= right.length ? left : right;
    var longer = left.length <= right.length ? right : left;
    if (" ".concat(longer, " ").includes(" ".concat(shorter, " "))) {
        return shorter.length <= 4 ? 0.96 : 0.92;
    }
    if (shorter.length <= 4 && longer.startsWith("".concat(shorter, " "))) {
        return 0.95;
    }
    return 0;
}
function getWeightedTokenMatchScore(tokens, otherTokens) {
    if (tokens.length === 0 || otherTokens.length === 0) {
        return 0;
    }
    var weightedScore = 0;
    var totalWeight = 0;
    tokens.forEach(function (token) {
        var weight = getTokenWeight(token);
        var bestSimilarity = otherTokens.reduce(function (bestScore, otherToken) {
            var currentScore = getTokenSimilarity(token, otherToken);
            return currentScore > bestScore ? currentScore : bestScore;
        }, 0);
        weightedScore += bestSimilarity * weight;
        totalWeight += weight;
    });
    return totalWeight > 0 ? weightedScore / totalWeight : 0;
}
function getSharedTokenCount(leftTokens, rightTokens) {
    var rightSet = new Set(rightTokens);
    return leftTokens.filter(function (token) { return rightSet.has(token); }).length;
}
function getTeamSimilarity(left, right) {
    var leftTokens = getComparableTeamTokens(left);
    var rightTokens = getComparableTeamTokens(right);
    var normalizedLeft = leftTokens.join(' ');
    var normalizedRight = rightTokens.join(' ');
    if (leftTokens.length === 0 || rightTokens.length === 0) {
        return {
            score: 0,
            normalizedLeft: normalizedLeft,
            normalizedRight: normalizedRight,
            leftTokens: leftTokens,
            rightTokens: rightTokens,
        };
    }
    if (normalizedLeft === normalizedRight) {
        return {
            score: 1,
            normalizedLeft: normalizedLeft,
            normalizedRight: normalizedRight,
            leftTokens: leftTokens,
            rightTokens: rightTokens,
        };
    }
    var sharedTokenCount = getSharedTokenCount(leftTokens, rightTokens);
    var leftScore = getWeightedTokenMatchScore(leftTokens, rightTokens);
    var rightScore = getWeightedTokenMatchScore(rightTokens, leftTokens);
    var phraseScore = sharedTokenCount > 0 ? getDiceCoefficient(normalizedLeft, normalizedRight) : 0;
    var containmentScore = getLabelContainmentScore(normalizedLeft, normalizedRight);
    var initialismScore = getLabelInitialismScore(leftTokens, rightTokens);
    var score = Math.max((leftScore + rightScore) / 2, phraseScore * 0.92, containmentScore, initialismScore);
    if (sharedTokenCount > 0) {
        score += Math.min(0.12, sharedTokenCount * 0.04);
    }
    return {
        score: Math.min(1, score),
        normalizedLeft: normalizedLeft,
        normalizedRight: normalizedRight,
        leftTokens: leftTokens,
        rightTokens: rightTokens,
    };
}
function getLeagueSimilarity(left, right) {
    var normalizedLeft = getComparableCompetitionLabel(left);
    var normalizedRight = getComparableCompetitionLabel(right);
    if (!normalizedLeft || !normalizedRight) {
        return null;
    }
    if (normalizedLeft === normalizedRight) {
        return 1;
    }
    var leftTokens = getComparableCompetitionTokens(left);
    var rightTokens = getComparableCompetitionTokens(right);
    var sharedTokenCount = getSharedTokenCount(leftTokens, rightTokens);
    var leftScore = getWeightedTokenMatchScore(leftTokens, rightTokens);
    var rightScore = getWeightedTokenMatchScore(rightTokens, leftTokens);
    var phraseScore = sharedTokenCount > 0 ? getDiceCoefficient(normalizedLeft, normalizedRight) : 0;
    var containmentScore = getLabelContainmentScore(normalizedLeft, normalizedRight);
    var score = Math.max((leftScore + rightScore) / 2, phraseScore * 0.94, containmentScore);
    if (sharedTokenCount > 0) {
        score += Math.min(0.1, sharedTokenCount * 0.04);
    }
    return Math.min(1, score);
}
function getFixtureTeams(fixture) {
    var _a, _b, _c, _d, _e, _f;
    return {
        home: normalizeWhitespace((_c = (_b = (_a = fixture.teams) === null || _a === void 0 ? void 0 : _a.home) === null || _b === void 0 ? void 0 : _b.name) !== null && _c !== void 0 ? _c : ''),
        away: normalizeWhitespace((_f = (_e = (_d = fixture.teams) === null || _d === void 0 ? void 0 : _d.away) === null || _e === void 0 ? void 0 : _e.name) !== null && _f !== void 0 ? _f : ''),
    };
}
function getFixtureEventLabel(fixture) {
    var teams = getFixtureTeams(fixture);
    return teams.home && teams.away ? normalizeEventName("".concat(teams.home, " - ").concat(teams.away)) : '';
}
function getFixtureLeagueName(fixture) {
    var _a, _b;
    return normalizeWhitespace((_b = (_a = fixture.league) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : '');
}
function getFixtureDateValue(fixture) {
    var _a, _b, _c, _d, _e;
    return ((_e = (_d = (_b = (_a = fixture.fixture) === null || _a === void 0 ? void 0 : _a.date) !== null && _b !== void 0 ? _b : (_c = fixture.game) === null || _c === void 0 ? void 0 : _c.date) !== null && _d !== void 0 ? _d : fixture.date) !== null && _e !== void 0 ? _e : '');
}
function getFixtureId(fixture) {
    var _a, _b, _c, _d, _e;
    return (_e = (_d = (_b = (_a = fixture.fixture) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : (_c = fixture.game) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : fixture.id) !== null && _e !== void 0 ? _e : undefined;
}
function getFixtureStatusShortValue(fixture) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (typeof fixture.status === 'string') {
        return normalizeWhitespace(fixture.status).toUpperCase();
    }
    return normalizeWhitespace((_h = (_f = (_c = (_b = (_a = fixture.fixture) === null || _a === void 0 ? void 0 : _a.status) === null || _b === void 0 ? void 0 : _b.short) !== null && _c !== void 0 ? _c : (_e = (_d = fixture.game) === null || _d === void 0 ? void 0 : _d.status) === null || _e === void 0 ? void 0 : _e.short) !== null && _f !== void 0 ? _f : (_g = fixture.status) === null || _g === void 0 ? void 0 : _g.short) !== null && _h !== void 0 ? _h : '').toUpperCase();
}
function getFixtureStatusLongValue(fixture) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (typeof fixture.status === 'string') {
        return normalizeWhitespace(fixture.status).toUpperCase();
    }
    return normalizeWhitespace((_h = (_f = (_c = (_b = (_a = fixture.fixture) === null || _a === void 0 ? void 0 : _a.status) === null || _b === void 0 ? void 0 : _b.long) !== null && _c !== void 0 ? _c : (_e = (_d = fixture.game) === null || _d === void 0 ? void 0 : _d.status) === null || _e === void 0 ? void 0 : _e.long) !== null && _f !== void 0 ? _f : (_g = fixture.status) === null || _g === void 0 ? void 0 : _g.long) !== null && _h !== void 0 ? _h : '').toUpperCase();
}
function parseScoreValue(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === 'string' && value.trim() !== '') {
        var parsedValue = Number(value);
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
function getFixtureScores(fixture) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return {
        homeScore: parseScoreValue((_d = (_b = (_a = fixture.goals) === null || _a === void 0 ? void 0 : _a.home) !== null && _b !== void 0 ? _b : (_c = fixture.scores) === null || _c === void 0 ? void 0 : _c.home) !== null && _d !== void 0 ? _d : null),
        awayScore: parseScoreValue((_h = (_f = (_e = fixture.goals) === null || _e === void 0 ? void 0 : _e.away) !== null && _f !== void 0 ? _f : (_g = fixture.scores) === null || _g === void 0 ? void 0 : _g.away) !== null && _h !== void 0 ? _h : null),
    };
}
function getFixtureTimeValue(fixture) {
    var value = getFixtureDateValue(fixture);
    return value.length >= 16 ? value.slice(11, 16) : '';
}
function roundScore(value) {
    return Math.round(value * 100) / 100;
}
function getClockTimeDifferenceMinutes(left, right) {
    if (!left || !right) {
        return null;
    }
    var _a = left.split(':').map(Number), leftHours = _a[0], leftMinutes = _a[1];
    var _b = right.split(':').map(Number), rightHours = _b[0], rightMinutes = _b[1];
    if (!Number.isInteger(leftHours) ||
        !Number.isInteger(leftMinutes) ||
        !Number.isInteger(rightHours) ||
        !Number.isInteger(rightMinutes)) {
        return null;
    }
    var leftTotalMinutes = leftHours * 60 + leftMinutes;
    var rightTotalMinutes = rightHours * 60 + rightMinutes;
    var absoluteDifference = Math.abs(leftTotalMinutes - rightTotalMinutes);
    return Math.min(absoluteDifference, 1440 - absoluteDifference);
}
function getDateDifferenceDays(requestDate, fixtureDate) {
    if (!fixtureDate) {
        return Number.POSITIVE_INFINITY;
    }
    var requestDayStart = new Date("".concat(requestDate, "T00:00:00Z"));
    var fixtureDateObject = new Date(fixtureDate);
    if (Number.isNaN(requestDayStart.getTime()) ||
        Number.isNaN(fixtureDateObject.getTime())) {
        return Number.POSITIVE_INFINITY;
    }
    var fixtureDayStart = Date.UTC(fixtureDateObject.getUTCFullYear(), fixtureDateObject.getUTCMonth(), fixtureDateObject.getUTCDate());
    return Math.abs(Math.round((fixtureDayStart - requestDayStart.getTime()) / 86400000));
}
function getCandidateTimeScore(timeDeltaMinutes) {
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
function getCandidateDateScore(dateDeltaDays) {
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
function getCandidateRejectReason(candidate) {
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
    if (candidate.dateDeltaDays === 1 &&
        candidate.timeDeltaMinutes === null &&
        candidate.combinedScore < 0.9) {
        return 'Соседний день без подтверждения по времени и со слабым score.';
    }
    if (candidate.dateDeltaDays === 1 &&
        candidate.timeDeltaMinutes !== null &&
        candidate.combinedScore < 0.82) {
        return 'Соседний день, но similarity недостаточно высокий.';
    }
    if (candidate.leagueScore !== null &&
        candidate.leagueScore < 0.45 &&
        candidate.dateDeltaDays === 1 &&
        candidate.combinedScore < 0.9) {
        return 'Слабое совпадение лиги для соседней даты.';
    }
    if (candidate.timeDeltaMinutes !== null && candidate.timeDeltaMinutes > 720) {
        return 'Слишком большая разница во времени матча.';
    }
    return null;
}
function analyzeFixtureCandidate(request, requestTeams, fixture) {
    var fixtureTeams = getFixtureTeams(fixture);
    var requestTime = normalizeTimeValue(request.time);
    var fixtureTime = getFixtureTimeValue(fixture);
    var sameHome = getTeamSimilarity(requestTeams[0], fixtureTeams.home);
    var sameAway = getTeamSimilarity(requestTeams[1], fixtureTeams.away);
    var reverseHome = getTeamSimilarity(requestTeams[0], fixtureTeams.away);
    var reverseAway = getTeamSimilarity(requestTeams[1], fixtureTeams.home);
    var sameCombined = (sameHome.score + sameAway.score) / 2;
    var reverseCombined = (reverseHome.score + reverseAway.score) / 2;
    var useReverse = reverseCombined > sameCombined;
    var homeScore = useReverse ? reverseHome.score : sameHome.score;
    var awayScore = useReverse ? reverseAway.score : sameAway.score;
    var combinedScore = (homeScore + awayScore) / 2;
    var dateDeltaDays = getDateDifferenceDays(request.date, getFixtureDateValue(fixture));
    var timeDeltaMinutes = getClockTimeDifferenceMinutes(requestTime, fixtureTime);
    var eventLabel = getFixtureEventLabel(fixture);
    var leagueName = getFixtureLeagueName(fixture);
    var normalizedRequestEvent = normalizeComparableText(normalizeEventName(request.event));
    var normalizedFixtureEvent = normalizeComparableText(eventLabel);
    var exactEventMatch = normalizedRequestEvent !== '' &&
        normalizedRequestEvent === normalizedFixtureEvent;
    var apiStatus = getFixtureStatusShortValue(fixture);
    var leagueScore = typeof request.leagueName === 'string' && request.leagueName.trim() !== ''
        ? getLeagueSimilarity(request.leagueName, leagueName)
        : null;
    var totalScore = combinedScore * 100 +
        (useReverse ? -4 : 0) +
        (exactEventMatch ? 8 : 0) +
        ((leagueScore !== null && leagueScore !== void 0 ? leagueScore : 0) * 12) +
        getCandidateTimeScore(timeDeltaMinutes) +
        getCandidateDateScore(dateDeltaDays) +
        (getFixtureId(fixture) ? 1 : 0);
    var baseCandidate = {
        fixture: fixture,
        eventLabel: eventLabel,
        leagueName: leagueName,
        apiStatus: apiStatus,
        orientation: useReverse ? 'reverse' : 'same',
        homeScore: homeScore,
        awayScore: awayScore,
        combinedScore: combinedScore,
        leagueScore: leagueScore,
        timeDeltaMinutes: timeDeltaMinutes,
        dateDeltaDays: dateDeltaDays,
        totalScore: totalScore,
    };
    var rejectReason = getCandidateRejectReason(baseCandidate);
    return __assign(__assign({}, baseCandidate), { accepted: rejectReason === null, rejectReason: rejectReason });
}
function summarizeCandidateForDebug(candidate) {
    var _a;
    return {
        fixtureId: (_a = getFixtureId(candidate.fixture)) !== null && _a !== void 0 ? _a : null,
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
function getEventOrderScores(candidate) {
    var fixtureScores = getFixtureScores(candidate.fixture);
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
function findBestFixtureMatch(request, fixtures) {
    var _a, _b, _c, _d;
    var requestTeams = splitEventTeams(request.event);
    if (!requestTeams) {
        return {
            matchedFixture: null,
            matchedCandidate: null,
            requestTeams: null,
            topCandidates: [],
            rejectedReason: 'Не удалось разделить событие ставки на две команды.',
        };
    }
    var analyzedCandidates = fixtures
        .map(function (fixture) { return analyzeFixtureCandidate(request, requestTeams, fixture); })
        .sort(function (left, right) { return right.totalScore - left.totalScore; });
    var matchedCandidate = (_a = analyzedCandidates.find(function (candidate) { return candidate.accepted; })) !== null && _a !== void 0 ? _a : null;
    var bestRejectedCandidate = (_b = analyzedCandidates[0]) !== null && _b !== void 0 ? _b : null;
    return {
        matchedFixture: (_c = matchedCandidate === null || matchedCandidate === void 0 ? void 0 : matchedCandidate.fixture) !== null && _c !== void 0 ? _c : null,
        matchedCandidate: matchedCandidate,
        requestTeams: requestTeams,
        topCandidates: analyzedCandidates.slice(0, 5).map(summarizeCandidateForDebug),
        rejectedReason: matchedCandidate === null
            ? (_d = bestRejectedCandidate === null || bestRejectedCandidate === void 0 ? void 0 : bestRejectedCandidate.rejectReason) !== null && _d !== void 0 ? _d : 'API-Sports не вернул подходящих кандидатов.'
            : null,
    };
}
function buildSportsFixturesUrl(baseUrl, date, resourcePath) {
    var url = new URL(baseUrl);
    var normalizedPath = url.pathname.replace(/\/$/, '');
    url.pathname = normalizedPath.endsWith("/".concat(resourcePath))
        ? normalizedPath
        : "".concat(normalizedPath, "/").concat(resourcePath).replace(/\/{2,}/g, '/');
    url.searchParams.set('date', date);
    return url.toString();
}
function getMatchCheckSport(value) {
    var normalizedSport = normalizeComparableText(value);
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
function logDebugEvent(debugLog, event, payload) {
    if (!debugLog) {
        return;
    }
    debugLog(event, payload);
}
function getSportApiConfig(sport, env) {
    if (sport === 'football') {
        return {
            baseUrl: env.sportsApiFootballBaseUrl,
            resourcePath: 'fixtures',
        };
    }
    if (sport === 'basketball') {
        return {
            baseUrl: env.sportsApiBasketballBaseUrl,
            resourcePath: 'games',
        };
    }
    return {
        baseUrl: env.sportsApiHockeyBaseUrl,
        resourcePath: 'games',
    };
}
function fetchFixturesForDate(sport, date, env, fetchImpl, debugLog) {
    return __awaiter(this, void 0, void 0, function () {
        var sportApiConfig, requestUrl, response, rawBody, payload, debugMessages, planLimitedReason, responseCount;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    sportApiConfig = getSportApiConfig(sport, env);
                    if (!sportApiConfig.baseUrl) {
                        logDebugEvent(debugLog, 'match:config-error', {
                            sport: sport,
                            normalizedSportKey: sport,
                            requestedDate: date,
                            baseUrl: null,
                            reason: sport === 'football'
                                ? 'SPORTS_API_FOOTBALL_BASE_URL missing'
                                : sport === 'basketball'
                                    ? 'SPORTS_API_BASKETBALL_BASE_URL missing'
                                    : 'SPORTS_API_HOCKEY_BASE_URL missing',
                        });
                        throw new Error(sport === 'football'
                            ? 'SPORTS_API_FOOTBALL_BASE_URL не задан на сервере.'
                            : sport === 'basketball'
                                ? 'SPORTS_API_BASKETBALL_BASE_URL не задан на сервере.'
                                : 'SPORTS_API_HOCKEY_BASE_URL не задан на сервере.');
                    }
                    requestUrl = buildSportsFixturesUrl(sportApiConfig.baseUrl, date, sportApiConfig.resourcePath);
                    logDebugEvent(debugLog, 'match:lookup-request', {
                        sport: sport,
                        normalizedSportKey: sport,
                        requestedDate: date,
                        baseUrl: sportApiConfig.baseUrl,
                        requestUrl: requestUrl,
                    });
                    return [4 /*yield*/, fetchImpl(requestUrl, {
                            headers: {
                                Accept: 'application/json',
                                'x-apisports-key': env.sportsApiKey,
                            },
                        })];
                case 1:
                    response = _b.sent();
                    return [4 /*yield*/, response.text()];
                case 2:
                    rawBody = _b.sent();
                    payload = null;
                    if (rawBody.trim() !== '') {
                        try {
                            payload = JSON.parse(rawBody);
                        }
                        catch (_c) {
                            payload = null;
                        }
                    }
                    debugMessages = __spreadArray(__spreadArray(__spreadArray([], extractApiMessages(payload === null || payload === void 0 ? void 0 : payload.errors), true), extractApiMessages(payload === null || payload === void 0 ? void 0 : payload.message), true), (payload === null && rawBody.trim() !== '' ? [normalizeWhitespace(rawBody)] : []), true).filter(function (message, index, messages) { return message !== '' && messages.indexOf(message) === index; });
                    planLimitedReason = getPlanLimitedReason(response.status, debugMessages);
                    responseCount = Array.isArray(payload === null || payload === void 0 ? void 0 : payload.response) ? payload.response.length : 0;
                    logDebugEvent(debugLog, 'match:lookup-response', {
                        sport: sport,
                        normalizedSportKey: sport,
                        requestedDate: date,
                        baseUrl: sportApiConfig.baseUrl,
                        requestUrl: requestUrl,
                        apiStatus: response.status,
                        responseCount: responseCount,
                        planLimited: Boolean(planLimitedReason),
                        planLimitedReason: planLimitedReason,
                        apiMessages: debugMessages,
                    });
                    if (planLimitedReason) {
                        return [2 /*return*/, {
                                date: date,
                                fixtures: Array.isArray(payload === null || payload === void 0 ? void 0 : payload.response) ? payload.response : [],
                                planLimited: true,
                                planLimitedReason: planLimitedReason,
                                debugMessages: debugMessages,
                            }];
                    }
                    if (!response.ok) {
                        throw new Error((_a = debugMessages[0]) !== null && _a !== void 0 ? _a : "API-Sports \u0432\u0435\u0440\u043D\u0443\u043B \u043E\u0448\u0438\u0431\u043A\u0443 ".concat(response.status, "."));
                    }
                    if (payload !== null && !Array.isArray(payload.response) && debugMessages.length > 0) {
                        throw new Error(debugMessages[0]);
                    }
                    return [2 /*return*/, {
                            date: date,
                            fixtures: Array.isArray(payload === null || payload === void 0 ? void 0 : payload.response) ? payload.response : [],
                            planLimited: false,
                            planLimitedReason: null,
                            debugMessages: debugMessages,
                        }];
            }
        });
    });
}
function extractApiMessages(value) {
    if (typeof value === 'string') {
        var normalized = normalizeWhitespace(value);
        return normalized === '' ? [] : [normalized];
    }
    if (Array.isArray(value)) {
        return value.flatMap(function (item) { return extractApiMessages(item); });
    }
    if (typeof value === 'object' && value !== null) {
        return Object.values(value).flatMap(function (item) { return extractApiMessages(item); });
    }
    return [];
}
function getPlanLimitedReason(statusCode, messages) {
    var normalizedMessages = messages.map(function (message) { return normalizeComparableText(message); });
    var matchedMessageIndex = normalizedMessages.findIndex(function (message) {
        return PLAN_LIMITED_MESSAGE_PATTERNS.some(function (pattern) { return message.includes(pattern); });
    });
    if (matchedMessageIndex >= 0) {
        return messages[matchedMessageIndex];
    }
    if (statusCode === 429) {
        return 'API-Sports временно ограничил доступ по лимиту плана.';
    }
    return null;
}
function deduplicateFixtures(fixtures) {
    var seenKeys = new Set();
    return fixtures.filter(function (fixture) {
        var eventLabel = getFixtureEventLabel(fixture);
        var fixtureDate = getFixtureDateValue(fixture);
        var fallbackKey = "".concat(eventLabel, "::").concat(fixtureDate);
        var key = getFixtureId(fixture) !== null && getFixtureId(fixture) !== undefined
            ? "fixture:".concat(getFixtureId(fixture))
            : "fallback:".concat(fallbackKey);
        if (seenKeys.has(key)) {
            return false;
        }
        seenKeys.add(key);
        return true;
    });
}
function shiftDateString(date, offsetDays) {
    var parsedDate = new Date("".concat(date, "T00:00:00Z"));
    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }
    parsedDate.setUTCDate(parsedDate.getUTCDate() + offsetDays);
    return parsedDate.toISOString().slice(0, 10);
}
function buildFallbackDateList(date) {
    return FALLBACK_DATE_OFFSETS
        .map(function (offsetDays) { return shiftDateString(date, offsetDays); })
        .filter(function (value) { return value !== null && value !== date; });
}
function logMatchCheckDebug(debugLog, event, request, requestTeams, attemptedDates, fixtures, topCandidates, rejectedReason, planLimitedDates, planLimitedReasons) {
    var _a;
    if (!debugLog) {
        return;
    }
    debugLog(event, {
        request: {
            sport: request.sport,
            date: request.date,
            time: request.time,
            event: request.event,
            leagueName: (_a = request.leagueName) !== null && _a !== void 0 ? _a : '',
        },
        recognizedTeams: requestTeams === null
            ? null
            : {
                home: requestTeams[0],
                away: requestTeams[1],
                normalizedHome: getComparableTeamLabel(requestTeams[0]),
                normalizedAway: getComparableTeamLabel(requestTeams[1]),
            },
        normalizedLeagueName: request.leagueName && request.leagueName.trim() !== ''
            ? getComparableCompetitionLabel(request.leagueName)
            : '',
        attemptedDates: attemptedDates,
        fixtureCount: fixtures.length,
        planLimited: planLimitedDates.length > 0,
        planLimitedDates: planLimitedDates,
        planLimitedReasons: planLimitedReasons,
        topCandidates: topCandidates,
        rejectedReason: rejectedReason,
    });
}
export function isFootballSport(value) {
    return getMatchCheckSport(value) === 'football';
}
export function isSupportedMatchCheckSport(value) {
    return getMatchCheckSport(value) !== null;
}
export function normalizeEventName(value) {
    return normalizeWhitespace(value
        .replace(/\s*[–—]\s*/g, ' - ')
        .replace(/\s+-\s+/g, ' - '));
}
export function splitEventTeams(value) {
    var _a;
    var normalized = normalizeEventName(value);
    var strictParts = normalized
        .split(/\s+-\s+/)
        .map(function (part) { return normalizeWhitespace(part); })
        .filter(Boolean);
    if (strictParts.length === 2) {
        return [strictParts[0], strictParts[1]];
    }
    var rawDelimiterMatches = (_a = value.match(/[–—-]/g)) !== null && _a !== void 0 ? _a : [];
    if (rawDelimiterMatches.length === 1) {
        var looseParts = normalized
            .split('-')
            .map(function (part) { return normalizeWhitespace(part); })
            .filter(Boolean);
        if (looseParts.length === 2) {
            return [looseParts[0], looseParts[1]];
        }
    }
    return null;
}
export function getMatchCheckRequestKey(request) {
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
function normalizeSettlementSelection(value) {
    return value
        .trim()
        .toUpperCase()
        .replace(/\s+/g, '')
        .replace(/Х/g, 'X')
        .replace(/П/g, 'P');
}
function compareSettlementValues(left, right) {
    var difference = left - right;
    if (Math.abs(difference) < 1e-9) {
        return 0;
    }
    return difference > 0 ? 1 : -1;
}
function parseSettlementLineValue(value) {
    var parsedValue = Number(value.replace(',', '.'));
    return Number.isFinite(parsedValue) ? parsedValue : null;
}
function parseSupportedSettlementMarket(marketType, selection) {
    var normalizedSelection = normalizeSettlementSelection(selection);
    if (marketType === 'outcomes') {
        return SUPPORTED_OUTCOME_MARKET_SELECTIONS.has(normalizedSelection)
            ? {
                kind: 'outcomes',
                selection: normalizedSelection,
            }
            : null;
    }
    if (marketType === 'totals') {
        var totalsMatch = normalizedSelection.match(/^Т([БМ])\(?([+-]?\d+(?:\.\d+)?)\)?$/);
        if (!totalsMatch) {
            return null;
        }
        var line = parseSettlementLineValue(totalsMatch[2]);
        if (line === null) {
            return null;
        }
        return {
            kind: 'totals',
            direction: totalsMatch[1] === 'Б' ? 'over' : 'under',
            line: line,
        };
    }
    if (marketType === 'handicaps') {
        var handicapMatch = normalizedSelection.match(/^Ф([12])\(?([+-]?\d+(?:\.\d+)?)\)?$/);
        if (!handicapMatch) {
            return null;
        }
        var line = parseSettlementLineValue(handicapMatch[2]);
        if (line === null) {
            return null;
        }
        return {
            kind: 'handicaps',
            side: handicapMatch[1] === '1' ? 1 : 2,
            line: line,
        };
    }
    return null;
}
export function getSupportedMarketSettlementResult(marketType, selection, matchCheck) {
    if (matchCheck.status !== 'finished') {
        return null;
    }
    if (typeof matchCheck.firstTeamScore !== 'number' ||
        !Number.isFinite(matchCheck.firstTeamScore) ||
        typeof matchCheck.secondTeamScore !== 'number' ||
        !Number.isFinite(matchCheck.secondTeamScore)) {
        return null;
    }
    var parsedMarket = parseSupportedSettlementMarket(marketType, selection);
    if (!parsedMarket) {
        return null;
    }
    var firstTeamWon = matchCheck.firstTeamScore > matchCheck.secondTeamScore;
    var secondTeamWon = matchCheck.secondTeamScore > matchCheck.firstTeamScore;
    var isDraw = matchCheck.firstTeamScore === matchCheck.secondTeamScore;
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
        var totalScore = matchCheck.firstTeamScore + matchCheck.secondTeamScore;
        var comparison_1 = compareSettlementValues(totalScore, parsedMarket.line);
        if (comparison_1 === 0) {
            return 'refund';
        }
        if (parsedMarket.direction === 'over') {
            return comparison_1 > 0 ? 'won' : 'lost';
        }
        return comparison_1 < 0 ? 'won' : 'lost';
    }
    var adjustedFirstScore = parsedMarket.side === 1
        ? matchCheck.firstTeamScore + parsedMarket.line
        : matchCheck.firstTeamScore;
    var adjustedSecondScore = parsedMarket.side === 2
        ? matchCheck.secondTeamScore + parsedMarket.line
        : matchCheck.secondTeamScore;
    var comparison = compareSettlementValues(adjustedFirstScore, adjustedSecondScore);
    if (comparison === 0) {
        return 'refund';
    }
    if (parsedMarket.side === 1) {
        return comparison > 0 ? 'won' : 'lost';
    }
    return comparison < 0 ? 'won' : 'lost';
}
function mapFootballApiStatus(shortStatus) {
    var normalized = normalizeWhitespace(shortStatus !== null && shortStatus !== void 0 ? shortStatus : '').toUpperCase();
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
function mapGenericApiStatus(shortStatus, longStatus) {
    var normalizedShort = normalizeWhitespace(shortStatus !== null && shortStatus !== void 0 ? shortStatus : '').toUpperCase();
    var normalizedLong = normalizeWhitespace(longStatus !== null && longStatus !== void 0 ? longStatus : '').toUpperCase();
    if (GENERIC_NOT_STARTED_API_STATUSES.has(normalizedShort) ||
        GENERIC_NOT_STARTED_API_STATUSES.has(normalizedLong)) {
        return 'not_started';
    }
    if (GENERIC_LIVE_API_STATUSES.has(normalizedShort) ||
        GENERIC_LIVE_API_STATUSES.has(normalizedLong)) {
        return 'live';
    }
    if (GENERIC_FINISHED_API_STATUSES.has(normalizedShort) ||
        GENERIC_FINISHED_API_STATUSES.has(normalizedLong)) {
        return 'finished';
    }
    return 'not_found';
}
function mapMatchApiStatus(sport, shortStatus, longStatus) {
    if (sport === 'football') {
        return mapFootballApiStatus(shortStatus);
    }
    return mapGenericApiStatus(shortStatus, longStatus);
}
export function checkMatchStatus(request_1, env_1) {
    return __awaiter(this, arguments, void 0, function (request, env, fetchImpl, options) {
        var matchCheckSport, normalizedSportKey, normalizedRequest, selectedBaseUrl, queriedDates, exactDateResult, collectedFixtures, selection, planLimitedDates, planLimitedReasons, fallbackDates, fallbackResults, finalStatus, finalResult;
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (fetchImpl === void 0) { fetchImpl = fetch; }
        if (options === void 0) { options = {}; }
        return __generator(this, function (_k) {
            switch (_k.label) {
                case 0:
                    matchCheckSport = getMatchCheckSport(typeof (request === null || request === void 0 ? void 0 : request.sport) === 'string' ? request.sport.trim() : '');
                    normalizedSportKey = typeof (request === null || request === void 0 ? void 0 : request.sport) === 'string' ? normalizeComparableText(request.sport.trim()) : '';
                    normalizedRequest = {
                        sport: typeof (request === null || request === void 0 ? void 0 : request.sport) === 'string' ? request.sport.trim() : '',
                        date: typeof (request === null || request === void 0 ? void 0 : request.date) === 'string' ? request.date.trim() : '',
                        time: typeof (request === null || request === void 0 ? void 0 : request.time) === 'string' ? normalizeTimeValue(request.time) : '',
                        event: typeof (request === null || request === void 0 ? void 0 : request.event) === 'string' ? normalizeEventName(request.event) : '',
                        leagueName: typeof (request === null || request === void 0 ? void 0 : request.leagueName) === 'string' ? request.leagueName.trim() : '',
                    };
                    selectedBaseUrl = matchCheckSport === null ? null : (_a = getSportApiConfig(matchCheckSport, env).baseUrl) !== null && _a !== void 0 ? _a : null;
                    logDebugEvent(options.debugLog, 'match:request-start', {
                        sport: normalizedRequest.sport,
                        normalizedSportKey: normalizedSportKey,
                        resolvedSportKey: matchCheckSport,
                        selectedBaseUrl: selectedBaseUrl,
                        date: normalizedRequest.date,
                        time: normalizedRequest.time,
                        event: normalizedRequest.event,
                        leagueName: (_b = normalizedRequest.leagueName) !== null && _b !== void 0 ? _b : '',
                    });
                    if (matchCheckSport === null ||
                        normalizedRequest.date === '' ||
                        normalizedRequest.event === '') {
                        logDebugEvent(options.debugLog, 'match:invalid-request', {
                            sport: normalizedRequest.sport,
                            normalizedSportKey: normalizedSportKey,
                            resolvedSportKey: matchCheckSport,
                            selectedBaseUrl: selectedBaseUrl,
                            date: normalizedRequest.date,
                            time: normalizedRequest.time,
                            event: normalizedRequest.event,
                            reason: matchCheckSport === null
                                ? 'Unsupported sport mapping'
                                : normalizedRequest.date === ''
                                    ? 'Missing date'
                                    : 'Missing event',
                        });
                        return [2 /*return*/, { status: 'not_found' }];
                    }
                    if (!env.sportsApiKey) {
                        logDebugEvent(options.debugLog, 'match:config-error', {
                            sport: normalizedRequest.sport,
                            normalizedSportKey: normalizedSportKey,
                            resolvedSportKey: matchCheckSport,
                            selectedBaseUrl: selectedBaseUrl,
                            reason: 'SPORTS_API_KEY missing',
                        });
                        throw new Error('SPORTS_API_KEY не задан на сервере.');
                    }
                    queriedDates = [normalizedRequest.date];
                    return [4 /*yield*/, fetchFixturesForDate(matchCheckSport, normalizedRequest.date, env, fetchImpl, options.debugLog)];
                case 1:
                    exactDateResult = _k.sent();
                    collectedFixtures = deduplicateFixtures(exactDateResult.fixtures);
                    selection = findBestFixtureMatch(normalizedRequest, collectedFixtures);
                    planLimitedDates = exactDateResult.planLimited ? [exactDateResult.date] : [];
                    planLimitedReasons = exactDateResult.planLimitedReason
                        ? [exactDateResult.planLimitedReason]
                        : [];
                    if (!!selection.matchedFixture) return [3 /*break*/, 3];
                    fallbackDates = buildFallbackDateList(normalizedRequest.date);
                    queriedDates.push.apply(queriedDates, fallbackDates);
                    return [4 /*yield*/, Promise.allSettled(fallbackDates.map(function (date) {
                            return fetchFixturesForDate(matchCheckSport, date, env, fetchImpl, options.debugLog);
                        }))];
                case 2:
                    fallbackResults = _k.sent();
                    fallbackResults.forEach(function (result) {
                        if (result.status !== 'fulfilled') {
                            return;
                        }
                        collectedFixtures = deduplicateFixtures(__spreadArray(__spreadArray([], collectedFixtures, true), result.value.fixtures, true));
                        if (result.value.planLimited) {
                            planLimitedDates = __spreadArray(__spreadArray([], planLimitedDates, true), [result.value.date], false);
                        }
                        if (result.value.planLimitedReason) {
                            planLimitedReasons = __spreadArray(__spreadArray([], planLimitedReasons, true), [result.value.planLimitedReason], false);
                        }
                    });
                    planLimitedDates = planLimitedDates.filter(function (value, index) { return value !== '' && planLimitedDates.indexOf(value) === index; });
                    planLimitedReasons = planLimitedReasons.filter(function (value, index) { return value !== '' && planLimitedReasons.indexOf(value) === index; });
                    selection = findBestFixtureMatch(normalizedRequest, collectedFixtures);
                    _k.label = 3;
                case 3:
                    if (!selection.matchedFixture || !selection.matchedCandidate) {
                        finalStatus = planLimitedDates.length > 0 ? 'plan_limited' : 'not_found';
                        logMatchCheckDebug(options.debugLog, planLimitedDates.length > 0 ? 'match:plan-limited' : 'match:not-found', normalizedRequest, selection.requestTeams, queriedDates, collectedFixtures, selection.topCandidates, selection.rejectedReason, planLimitedDates, planLimitedReasons);
                        logDebugEvent(options.debugLog, 'match:result', {
                            sport: normalizedRequest.sport,
                            normalizedSportKey: normalizedSportKey,
                            resolvedSportKey: matchCheckSport,
                            selectedBaseUrl: selectedBaseUrl,
                            attemptedDates: queriedDates,
                            status: finalStatus,
                            matched: false,
                            fixtureId: null,
                            matchedEvent: null,
                            apiStatus: null,
                        });
                        return [2 /*return*/, { status: finalStatus }];
                    }
                    finalResult = {
                        status: mapMatchApiStatus(matchCheckSport, selection.matchedCandidate.apiStatus, getFixtureStatusLongValue(selection.matchedFixture)),
                        fixtureId: getFixtureId(selection.matchedFixture),
                        apiStatus: selection.matchedCandidate.apiStatus || undefined,
                        matchedEvent: selection.matchedCandidate.eventLabel || undefined,
                        firstTeamScore: (_c = getEventOrderScores(selection.matchedCandidate).firstTeamScore) !== null && _c !== void 0 ? _c : undefined,
                        secondTeamScore: (_d = getEventOrderScores(selection.matchedCandidate).secondTeamScore) !== null && _d !== void 0 ? _d : undefined,
                    };
                    logDebugEvent(options.debugLog, 'match:result', {
                        sport: normalizedRequest.sport,
                        normalizedSportKey: normalizedSportKey,
                        resolvedSportKey: matchCheckSport,
                        selectedBaseUrl: selectedBaseUrl,
                        attemptedDates: queriedDates,
                        status: finalResult.status,
                        matched: true,
                        fixtureId: (_e = finalResult.fixtureId) !== null && _e !== void 0 ? _e : null,
                        matchedEvent: (_f = finalResult.matchedEvent) !== null && _f !== void 0 ? _f : null,
                        apiStatus: (_g = finalResult.apiStatus) !== null && _g !== void 0 ? _g : null,
                        firstTeamScore: (_h = finalResult.firstTeamScore) !== null && _h !== void 0 ? _h : null,
                        secondTeamScore: (_j = finalResult.secondTeamScore) !== null && _j !== void 0 ? _j : null,
                    });
                    return [2 /*return*/, finalResult];
            }
        });
    });
}
export var checkFootballMatchStatus = checkMatchStatus;
