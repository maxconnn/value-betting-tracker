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
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
var FOOTBALL_SPORT_ALIASES = new Set(['football', 'soccer', 'футбол']);
var NOT_STARTED_API_STATUSES = new Set(['NS', 'TBD', 'PST']);
var LIVE_API_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT']);
var FINISHED_API_STATUSES = new Set(['FT', 'AET', 'PEN']);
var TEAM_STOPWORDS = new Set([
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
var TEAM_TOKEN_ALIASES = {
    st: 'saint',
    utd: 'united',
    untd: 'united',
};
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
function normalizeEventName(value) {
    return normalizeWhitespace(value
        .replace(/\s*[–—]\s*/g, ' - ')
        .replace(/\s+-\s+/g, ' - '));
}
function splitEventTeams(value) {
    var _a;
    var normalized = normalizeEventName(value);
    var strictParts = normalized
        .split(' - ')
        .map(function (part) { return normalizeWhitespace(part); })
        .filter(Boolean);
    if (strictParts.length === 2) {
        return [strictParts[0], strictParts[1]];
    }
    var hyphenCount = ((_a = normalized.match(/-/g)) !== null && _a !== void 0 ? _a : []).length;
    if (hyphenCount === 1) {
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
function normalizeTeamToken(token) {
    var _a;
    return (_a = TEAM_TOKEN_ALIASES[token]) !== null && _a !== void 0 ? _a : token;
}
function getComparableTeamTokens(name) {
    return normalizeComparableText(name)
        .split(/[\s-]+/)
        .map(normalizeTeamToken)
        .filter(function (token) { return token && !TEAM_STOPWORDS.has(token); });
}
function compareTeamNames(left, right) {
    var leftTokens = getComparableTeamTokens(left);
    var rightTokens = getComparableTeamTokens(right);
    if (leftTokens.length === 0 || rightTokens.length === 0) {
        return false;
    }
    if (leftTokens.join(' ') === rightTokens.join(' ')) {
        return true;
    }
    var shorter = leftTokens.length <= rightTokens.length ? leftTokens : rightTokens;
    var longer = new Set(leftTokens.length <= rightTokens.length ? rightTokens : leftTokens);
    var sharedCount = shorter.filter(function (token) { return longer.has(token); }).length;
    if (shorter.length === 1) {
        return sharedCount === 1 && shorter[0].length >= 4;
    }
    return sharedCount === shorter.length;
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
function getFixtureTimeValue(fixture) {
    var _a, _b;
    var value = (_b = (_a = fixture.fixture) === null || _a === void 0 ? void 0 : _a.date) !== null && _b !== void 0 ? _b : '';
    return value.length >= 16 ? value.slice(11, 16) : '';
}
function getFixtureMatchScore(request, fixture) {
    var _a;
    var teams = splitEventTeams(request.event);
    var fixtureTeams = getFixtureTeams(fixture);
    if (!teams || !fixtureTeams.home || !fixtureTeams.away) {
        return -1;
    }
    var sameOrder = compareTeamNames(teams[0], fixtureTeams.home) && compareTeamNames(teams[1], fixtureTeams.away);
    var reverseOrder = compareTeamNames(teams[0], fixtureTeams.away) && compareTeamNames(teams[1], fixtureTeams.home);
    if (!sameOrder && !reverseOrder) {
        return -1;
    }
    var score = sameOrder ? 100 : 96;
    if (normalizeEventName(request.event) === getFixtureEventLabel(fixture)) {
        score += 4;
    }
    var requestTime = normalizeTimeValue(request.time);
    var fixtureTime = getFixtureTimeValue(fixture);
    if (requestTime && fixtureTime && requestTime === fixtureTime) {
        score += 2;
    }
    if ((_a = fixture.fixture) === null || _a === void 0 ? void 0 : _a.id) {
        score += 1;
    }
    return score;
}
function findBestFixtureMatch(request, fixtures) {
    var bestMatch = null;
    var bestScore = -1;
    fixtures.forEach(function (fixture) {
        var score = getFixtureMatchScore(request, fixture);
        if (score > bestScore) {
            bestMatch = fixture;
            bestScore = score;
        }
    });
    return bestMatch;
}
function buildFootballFixturesUrl(baseUrl, date) {
    var url = new URL(baseUrl);
    var normalizedPath = url.pathname.replace(/\/$/, '');
    url.pathname = normalizedPath.endsWith('/fixtures')
        ? normalizedPath
        : "".concat(normalizedPath, "/fixtures").replace(/\/{2,}/g, '/');
    url.searchParams.set('date', date);
    return url.toString();
}
function isFootballSport(value) {
    return FOOTBALL_SPORT_ALIASES.has(normalizeComparableText(value));
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
function checkFootballMatchStatus(request_1, env_1) {
    return __awaiter(this, arguments, void 0, function (request, env, fetchImpl) {
        var normalizedRequest, response, payload, fixtures, matchedFixture, matchedEvent, apiStatus;
        var _a, _b, _c, _d, _e;
        if (fetchImpl === void 0) { fetchImpl = fetch; }
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    normalizedRequest = {
                        sport: typeof (request === null || request === void 0 ? void 0 : request.sport) === 'string' ? request.sport.trim() : '',
                        date: typeof (request === null || request === void 0 ? void 0 : request.date) === 'string' ? request.date.trim() : '',
                        time: typeof (request === null || request === void 0 ? void 0 : request.time) === 'string' ? normalizeTimeValue(request.time) : '',
                        event: typeof (request === null || request === void 0 ? void 0 : request.event) === 'string' ? normalizeEventName(request.event) : '',
                    };
                    if (!isFootballSport(normalizedRequest.sport) ||
                        normalizedRequest.date === '' ||
                        normalizedRequest.event === '') {
                        return [2 /*return*/, { status: 'not_found' }];
                    }
                    if (!env.sportsApiKey || !env.sportsApiFootballBaseUrl) {
                        throw new Error('SPORTS_API_KEY или SPORTS_API_FOOTBALL_BASE_URL не заданы на сервере.');
                    }
                    return [4 /*yield*/, fetchImpl(buildFootballFixturesUrl(env.sportsApiFootballBaseUrl, normalizedRequest.date), {
                            headers: {
                                Accept: 'application/json',
                                'x-apisports-key': env.sportsApiKey,
                            },
                        })];
                case 1:
                    response = _f.sent();
                    if (!response.ok) {
                        throw new Error("API-Sports \u0432\u0435\u0440\u043D\u0443\u043B \u043E\u0448\u0438\u0431\u043A\u0443 ".concat(response.status, "."));
                    }
                    return [4 /*yield*/, response.json()];
                case 2:
                    payload = (_f.sent());
                    fixtures = Array.isArray(payload.response) ? payload.response : [];
                    matchedFixture = findBestFixtureMatch(normalizedRequest, fixtures);
                    if (!matchedFixture) {
                        return [2 /*return*/, { status: 'not_found' }];
                    }
                    matchedEvent = getFixtureEventLabel(matchedFixture);
                    apiStatus = normalizeWhitespace((_c = (_b = (_a = matchedFixture.fixture) === null || _a === void 0 ? void 0 : _a.status) === null || _b === void 0 ? void 0 : _b.short) !== null && _c !== void 0 ? _c : '').toUpperCase();
                    return [2 /*return*/, {
                            status: mapFootballApiStatus(apiStatus),
                            fixtureId: (_e = (_d = matchedFixture.fixture) === null || _d === void 0 ? void 0 : _d.id) !== null && _e !== void 0 ? _e : undefined,
                            apiStatus: apiStatus || undefined,
                            matchedEvent: matchedEvent || undefined,
                        }];
            }
        });
    });
}
function getErrorMessage(error) {
    if (error instanceof Error && error.message.trim()) {
        return error.message.trim();
    }
    return 'Не удалось проверить матч через локальный server route.';
}
function sendJson(response, statusCode, payload) {
    response.statusCode = statusCode;
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify(payload));
}
function readJsonBody(request) {
    return new Promise(function (resolve, reject) {
        var rawBody = '';
        request.on('data', function (chunk) {
            rawBody += String(chunk !== null && chunk !== void 0 ? chunk : '');
        });
        request.on('end', function () {
            if (rawBody.trim() === '') {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(rawBody));
            }
            catch (_a) {
                reject(new Error('Некорректный JSON body.'));
            }
        });
        request.on('error', function () {
            reject(new Error('Не удалось прочитать тело запроса.'));
        });
    });
}
function footballMatchRoutePlugin(mode) {
    var env = loadEnv(mode, process.cwd(), '');
    return {
        name: 'football-match-route',
        configureServer: function (server) {
            var _this = this;
            server.middlewares.use('/api/check-football-match', function (request, response) { return __awaiter(_this, void 0, void 0, function () {
                var body, result, error_1, message, statusCode;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (request.method !== 'POST') {
                                sendJson(response, 405, { message: 'Method not allowed.' });
                                return [2 /*return*/];
                            }
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 4, , 5]);
                            return [4 /*yield*/, readJsonBody(request)];
                        case 2:
                            body = _a.sent();
                            return [4 /*yield*/, checkFootballMatchStatus(body, {
                                    sportsApiKey: env.SPORTS_API_KEY,
                                    sportsApiFootballBaseUrl: env.SPORTS_API_FOOTBALL_BASE_URL,
                                })];
                        case 3:
                            result = _a.sent();
                            sendJson(response, 200, result);
                            return [3 /*break*/, 5];
                        case 4:
                            error_1 = _a.sent();
                            message = getErrorMessage(error_1);
                            statusCode = message === 'Некорректный JSON body.' ? 400 : 500;
                            sendJson(response, statusCode, { message: message });
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            }); });
        },
    };
}
export default defineConfig(function (_a) {
    var mode = _a.mode;
    return ({
        plugins: [react(), footballMatchRoutePlugin(mode)],
    });
});
