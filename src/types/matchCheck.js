var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
export var MATCH_CHECK_STATUSES = [
    'not_started',
    'live',
    'finished',
    'not_found',
    'plan_limited',
];
export var MATCH_CHECK_DISPLAY_STATUSES = __spreadArray(__spreadArray([], MATCH_CHECK_STATUSES, true), ['checking'], false);
