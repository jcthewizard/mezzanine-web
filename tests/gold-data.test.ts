import assert from "node:assert/strict";
import test from "node:test";
import { formatGoldTimestamp, isGoldQuoteStale, latestGoldHistory, latestGoldQuote, parseGoldHistory, parseGoldQuote } from "../lib/gold-data";

const now = new Date("2026-10-16T23:00:00Z");
const feed = { source: "Standard Bullion", unit: "USD per troy ounce" };
const spot = { ...feed, updated: "2026-10-16T22:54:49.176Z", metals: [{ symbol: "XAU", ask: 4176.29, bid: 4152.62 }] };
const daily = {
    ...feed, metal: "XAU", grain: "daily",
    points: [{ t: "2026-10-14T00:00:00Z", price: 4108.31 }, { t: "2026-10-15T00:00:00Z", price: 4160.82 }],
};

test("gold quote reads only the XAU dealer ask, preserving the provider timestamp", () => {
    assert.deepEqual(parseGoldQuote(spot, now), { ask: 4176.29, updatedAt: "2026-10-16T22:54:49.176Z" });
    assert.equal(parseGoldQuote({ ...spot, metals: [{ symbol: "XAU", bid: 4152.62 }] }, now), null);
    assert.equal(parseGoldQuote({ ...spot, metals: [{ symbol: "XAG", ask: 56.3 }] }, now), null);
    assert.equal(parseGoldQuote({ ...spot, metals: [...spot.metals, ...spot.metals] }, now), null);
    assert.equal(parseGoldQuote({ ...spot, unit: "USD per gram" }, now), null);
    assert.equal(parseGoldQuote({ ...spot, source: "Another feed" }, now), null);
});

test("invalid prices and malformed or future quote timestamps cannot look current", () => {
    for (const ask of [null, undefined, "4176.29", 0, -1, NaN, Infinity]) {
        assert.equal(parseGoldQuote({ ...spot, metals: [{ symbol: "XAU", ask }] }, now), null);
    }
    for (const updated of ["not-a-date", "2026-02-30T10:00:00Z", "2026-10-16", "2026-10-16T23:01:00Z", "2026-10-16T12:00:00"]) {
        assert.equal(parseGoldQuote({ ...spot, updated }, now), null);
    }
});

test("daily gold history remains separate from the current quote and sorts UTC dates", () => {
    const history = parseGoldHistory({ ...daily, points: [...daily.points].reverse() }, now);
    assert.ok(history);
    assert.deepEqual(history.points, [{ date: "2026-10-14", value: 4108.31 }, { date: "2026-10-15", value: 4160.82 }]);
    assert.equal(history.fetchedAt, now.toISOString());
    assert.equal(history.points.some(point => point.date === "2026-10-16"), false);
});

test("history rejects a wrong metal, unit, grain, future date, or partly invalid response", () => {
    for (const patch of [{ metal: "XAG" }, { unit: "EUR per troy ounce" }, { grain: "tick" }, { points: [] }]) {
        assert.equal(parseGoldHistory({ ...daily, ...patch }, now), null);
    }
    for (const point of [
        { t: "2026-10-17T00:00:00Z", price: 4200 },
        { t: "2026-02-30T00:00:00Z", price: 4200 },
        { t: "2026-10-15T12:00:00Z", price: 4200 },
        { t: "2026-10-15", price: 4200 },
        { t: "2026-10-15T00:00:00Z", price: null },
        { t: "2026-10-15T00:00:00Z", price: -1 },
    ]) assert.equal(parseGoldHistory({ ...daily, points: [...daily.points, point] }, now), null);
});

test("conflicting duplicate closes invalidate history but identical repeats are harmless", () => {
    assert.equal(parseGoldHistory({ ...daily, points: [...daily.points, { t: "2026-10-15T00:00:00Z", price: 4200 }] }, now), null);
    assert.equal(parseGoldHistory({ ...daily, points: [...daily.points, daily.points[0]] }, now)?.points.length, 2);
});

test("failed and older quote refreshes retain the last good quote", () => {
    const current = parseGoldQuote(spot, now);
    assert.ok(current);
    assert.equal(latestGoldQuote(current, null), current);
    assert.equal(latestGoldQuote(current, { ask: 4100, updatedAt: "2026-10-15T22:54:49.176Z" }), current);
    assert.equal(latestGoldQuote(current, { ...current, ask: 4100 }), current);
    const newer = { ask: 4180, updatedAt: "2026-10-16T22:59:00.000Z" };
    assert.equal(latestGoldQuote(current, newer), newer);
});

test("a successful response with a frozen timestamp retains its quote but shows stale feed status after 15 minutes", () => {
    const current = parseGoldQuote(spot, now);
    assert.ok(current);
    assert.equal(isGoldQuoteStale(current, now), false);
    assert.equal(isGoldQuoteStale(current, new Date("2026-10-16T23:09:49.176Z")), false);
    const later = new Date("2026-10-16T23:09:49.177Z");
    const repeated = parseGoldQuote(spot, later);
    assert.ok(repeated);
    const retained = latestGoldQuote(current, repeated);
    assert.equal(retained, current);
    assert.equal(isGoldQuoteStale(retained, later), true);
    const fresh = parseGoldQuote({ ...spot, updated: later.toISOString() }, later);
    assert.ok(fresh);
    assert.equal(isGoldQuoteStale(fresh, later), false);
});

test("history refreshes never roll back the latest date or discard earlier chart points", () => {
    const current = parseGoldHistory(daily, now);
    const previous = parseGoldHistory({ ...daily, points: [daily.points[0]] }, new Date("2026-10-16T23:01:00Z"));
    assert.ok(current);
    assert.ok(previous);
    assert.equal(latestGoldHistory(current, null), current);
    assert.equal(latestGoldHistory(current, previous), current);
    const next = parseGoldHistory({ ...daily, points: [{ t: "2026-10-16T00:00:00Z", price: 4176 }] }, new Date("2026-10-17T01:00:00Z"));
    assert.ok(next);
    assert.deepEqual(latestGoldHistory(current, next)?.points, [...current.points, { date: "2026-10-16", value: 4176 }]);
    assert.equal(latestGoldHistory(next, current), next);
});

test("provider timestamps keep the same UTC calendar date in different browser time zones", () => {
    const original = process.env.TZ;
    try {
        for (const zone of ["America/Los_Angeles", "UTC", "Pacific/Auckland"]) {
            process.env.TZ = zone;
            assert.equal(formatGoldTimestamp("2026-10-16T00:15:00.000Z"), "Oct 16, 2026, 00:15 UTC");
            assert.equal(parseGoldHistory(daily, now)?.points[0].date, "2026-10-14");
        }
    } finally {
        if (original === undefined) delete process.env.TZ;
        else process.env.TZ = original;
    }
});
