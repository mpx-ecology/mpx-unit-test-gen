"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.genKeyName = void 0;
function genKeyName(key, start, end) {
    return `${key}_${start}_${end}`;
}
exports.genKeyName = genKeyName;
