import test from "node:test";
import assert from "node:assert/strict";
import {
    getEquityHistoryUrl, isEquityHistoryStale, latestEquityHistory, parseEquityHistory,
    type EquityHistory,
} from "../lib/equity-data.ts";

const NOW = new Date("2026-10-19T18:00:00Z");
const bar = (timestamp: string, close: number | null = 761.26, is_gap = false) => ({ symbol: "SPY", timestamp, close, is_gap });
const payload = (bars: unknown[]) => ({ bars, count: bars.length, next_cursor: null });
const history = (bars: unknown[], now = NOW): EquityHistory => {
    const result = parseEquityHistory(payload(bars), now);
    assert.ok(result);
    return result;
};

test("account-free URL requests only SPY hourly fields and a year plus a short buffer", () => {
    const url = new URL(getEquityHistoryUrl(NOW));
    assert.equal(url.origin, "https://getmarkethistory.com");
    assert.equal(url.pathname, "/api/v1/bars/stocks/SPY/1h");
    assert.equal(url.searchParams.get("start"), "2025-10-12");
    assert.equal(url.searchParams.get("end"), "2026-10-19");
    assert.equal(url.searchParams.get("limit"), "10000");
    assert.equal(url.searchParams.get("format"), "json");
    assert.equal(url.searchParams.get("columns"), "symbol,timestamp,close,is_gap");
    assert.equal(url.searchParams.has("api_key"), false);
});

test("daily point uses the last real hourly bar, including extended hours, and its end time", () => {
    const result = history([
        bar("2026-10-16T23:00:00Z", 761.26),
        bar("2026-10-15T23:00:00Z", 760),
        bar("2026-10-16T19:00:00Z", 762),
        bar("2026-10-16T23:00:00.000Z", 761.26),
    ]);
    assert.deepEqual(result.points, [
        { date: "2026-10-15", value: 760, observedAt: "2026-10-16T00:00:00.000Z" },
        { date: "2026-10-16", value: 761.26, observedAt: "2026-10-17T00:00:00.000Z" },
    ]);
    assert.equal(result.fetchedAt, NOW.toISOString());
});

test("UTC-midnight bars use their New York opening date, with winter and summer DST offsets", () => {
    const result = history([
        bar("2026-01-10T00:00:00Z", 700), // 7 p.m. Friday, New York standard time
        bar("2026-07-11T00:00:00Z", 750), // 8 p.m. Friday, New York daylight time
        bar("2026-01-10T04:00:00Z", 701), // 11 p.m. Friday, still January 9
        bar("2026-07-11T04:00:00Z", 751), // midnight Saturday, July 11
    ]);
    assert.deepEqual(result.points, [
        { date: "2026-01-09", value: 701, observedAt: "2026-01-10T05:00:00.000Z" },
        { date: "2026-07-10", value: 750, observedAt: "2026-07-11T01:00:00.000Z" },
        { date: "2026-07-11", value: 751, observedAt: "2026-07-11T05:00:00.000Z" },
    ]);
});

test("DST transition hours keep chronological bar ends without inventing local hours", () => {
    const result = history([
        bar("2026-03-08T06:00:00Z", 700), // 1 a.m. EST; next hour starts at 3 a.m. EDT
        bar("2026-03-08T07:00:00Z", 701),
        bar("2026-11-01T05:00:00Z", 702), // First 1 a.m., in EDT
        bar("2026-11-01T06:00:00Z", 703), // Second 1 a.m., in EST
    ], new Date("2026-11-02T12:00:00Z"));
    assert.deepEqual(result.points, [
        { date: "2026-03-08", value: 701, observedAt: "2026-03-08T08:00:00.000Z" },
        { date: "2026-11-01", value: 703, observedAt: "2026-11-01T07:00:00.000Z" },
    ]);
});

test("explicit gap placeholders are skipped and never become a zero-price chart point", () => {
    const result = history([
        bar("2026-10-16T21:00:00Z", 761),
        bar("2026-10-16T22:00:00Z", 0, true),
        bar("2026-10-16T23:00:00Z", null, true),
    ]);
    assert.deepEqual(result.points, [{ date: "2026-10-16", value: 761, observedAt: "2026-10-16T22:00:00.000Z" }]);
    assert.equal(parseEquityHistory(payload([bar("2026-10-16T22:00:00Z", 0, true)]), NOW), null);
    assert.equal(parseEquityHistory(payload([bar("2026-10-16T22:00:00Z", 0)]), NOW), null);
});

test("one malformed row rejects the whole response instead of silently losing history", () => {
    const valid = bar("2026-10-16T23:00:00Z");
    for (const invalid of [
        { ...valid, symbol: "QQQ" }, { ...valid, symbol: "spy" },
        { ...valid, close: -1 }, { ...valid, close: 0 }, { ...valid, close: null },
        { ...valid, close: Infinity }, { ...valid, close: NaN }, { ...valid, close: "761.26" },
        { ...valid, is_gap: "false" }, { ...valid, is_gap: undefined },
        { ...valid, timestamp: "2026-02-30T23:00:00Z" },
        { ...valid, timestamp: "2026-10-16T24:00:00Z" },
        { ...valid, timestamp: "2026-10-16T23:30:00Z" },
        { ...valid, timestamp: "2026-10-16T23:00:00+00:00" },
        { ...valid, timestamp: "2026-10-20T00:00:00Z" },
        { ...valid, is_gap: true, timestamp: "invalid" },
        null,
    ]) {
        assert.equal(parseEquityHistory(payload([valid, invalid]), NOW), null, JSON.stringify(invalid));
    }
});

test("only completed hourly bars are accepted, including exactly at the hour boundary", () => {
    const value = payload([bar("2026-10-19T17:00:00Z")]);
    assert.equal(parseEquityHistory(value, new Date("2026-10-19T17:59:59.999Z")), null);
    assert.ok(parseEquityHistory(value, new Date("2026-10-19T18:00:00.000Z")));
});

test("conflicting duplicates, mismatched counts, missing metadata, and pagination are rejected", () => {
    const valid = bar("2026-10-16T23:00:00Z");
    for (const value of [
        payload([valid, { ...valid, close: 762 }]),
        payload([valid, { ...valid, is_gap: true }]),
        { ...payload([valid]), count: 0 },
        { ...payload([valid]), count: "1" },
        { ...payload([valid]), next_cursor: "more-bars" },
        { ...payload([valid]), next_cursor: undefined },
        { ...payload([valid]), next_cursor: false },
        { bars: [valid] }, payload([]), null,
    ]) assert.equal(parseEquityHistory(value, NOW), null);
});

test("out-of-order or partial refreshes cannot regress a previously observed hour", () => {
    const previous = history([bar("2026-10-15T23:00:00Z", 760), bar("2026-10-16T23:00:00Z", 761)]);
    const older = history([bar("2026-10-15T23:00:00Z", 755)], new Date("2026-10-19T19:00:00Z"));
    const earlierHour = history([bar("2026-10-16T19:00:00Z", 762)], new Date("2026-10-19T19:00:00Z"));
    assert.equal(latestEquityHistory(previous, older), previous);
    assert.equal(latestEquityHistory(previous, earlierHour), previous);
    const partial = history([
        bar("2026-10-15T19:00:00Z", 755),
        bar("2026-10-19T16:00:00Z", 765),
    ]);
    const merged = latestEquityHistory(previous, partial);
    assert.equal(merged.points.length, 3);
    assert.equal(merged.points[0].value, 760, "earlier hour does not replace an existing later hour");
    assert.equal(merged.points[1].value, 761, "missing previous dates survive a partial response");
    assert.equal(merged.points[2].value, 765);
    assert.equal(previous.points.length, 2, "input history remains unchanged");
});

test("same-hour corrections require a newer fetch timestamp", () => {
    const previous = history([bar("2026-10-16T23:00:00Z", 761)]);
    const revision = history([bar("2026-10-16T23:00:00Z", 762)], new Date("2026-10-19T19:00:00Z"));
    assert.equal(latestEquityHistory(previous, revision).points[0].value, 762);
    assert.equal(latestEquityHistory(revision, previous), revision);
});

test("freshness tolerates 48-hour lag and weekends, then flags stuck history despite new fetches", () => {
    const friday = history([bar("2026-10-16T23:00:00Z")]);
    assert.equal(isEquityHistoryStale(friday, new Date("2026-10-19T23:00:00Z")), false, "Friday remains usable on Monday");
    assert.equal(isEquityHistoryStale(friday, new Date("2026-10-22T00:00:00Z")), false, "five-day grace is inclusive");
    const refetched = { ...friday, fetchedAt: "2026-10-22T18:00:00Z" };
    assert.equal(isEquityHistoryStale(refetched, new Date("2026-10-22T18:00:00Z")), true);
    assert.equal(isEquityHistoryStale({ points: [], fetchedAt: NOW.toISOString() }, NOW), true);
});

test("daily history remains bounded after repeated partial merges", () => {
    const start = Date.parse("2025-01-01T12:00:00Z");
    const previous: EquityHistory = { fetchedAt: NOW.toISOString(), points: Array.from({ length: 380 }, (_, index) => {
        const observedAt = new Date(start + index * 24 * 60 * 60 * 1000).toISOString();
        return { date: observedAt.slice(0, 10), value: 700 + index, observedAt };
    }) };
    const incoming = history([bar("2026-10-16T23:00:00Z")]);
    const result = latestEquityHistory(previous, incoming);
    assert.equal(result.points.length, 380);
    assert.equal(result.points[0].date, "2025-01-02");
    assert.equal(result.points.at(-1)?.date, "2026-10-16");
});
