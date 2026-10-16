import test from "node:test";
import assert from "node:assert/strict";
import { fetchMarketSnapshot, normalizeMarketSnapshot, parseSofrResponse } from "../lib/market-data.mjs";

const NOW = "2026-10-16T16:00:00.000Z";
const OLD_TIME = "2026-10-08T16:00:00.000Z";
const ratePayload = { refRates: [
    { type: "SOFR", effectiveDate: "2026-10-15", percentRate: 3.89 },
    { type: "SOFR", effectiveDate: "2026-10-14", percentRate: 3.88 },
] };
const json = (value) => new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } });
const goodFetch = async () => json(ratePayload);

function previousSnapshot() {
    return {
        schemaVersion: 2, updatedAt: OLD_TIME,
        series: {
            sofr: { points: [{ date: "2026-10-08", value: 3.87 }], fetchedAt: OLD_TIME, source: "Federal Reserve Bank of New York", sourceUrl: "https://www.newyorkfed.org/markets/reference-rates/sofr", historyKind: "daily-rate" },
        },
    };
}

test("official SOFR responses yield sorted, finite daily values", () => {
    assert.deepEqual(parseSofrResponse(ratePayload), [{ date: "2026-10-14", value: 3.88 }, { date: "2026-10-15", value: 3.89 }]);
    assert.throws(() => parseSofrResponse({ refRates: [{ type: "EFFR", effectiveDate: "2026-10-15", percentRate: 3.89 }] }));
    for (const value of [null, "", "4junk", Infinity]) {
        assert.throws(() => parseSofrResponse({ refRates: [{ type: "SOFR", effectiveDate: "2026-10-15", percentRate: value }] }));
    }
    assert.throws(() => parseSofrResponse({ refRates: [{ type: "SOFR", effectiveDate: "2026-02-30", percentRate: 3.89 }] }));
    assert.throws(() => parseSofrResponse({ refRates: [
        { type: "SOFR", effectiveDate: "2026-10-15", percentRate: 3.89 },
        { type: "SOFR", effectiveDate: "2026-10-15", percentRate: 3.90 },
    ] }));
});

test("request uses the official account-free endpoint and a 13-month UTC date range", async () => {
    const requests = [];
    const result = await fetchMarketSnapshot({ now: NOW, fetchImpl: async (url, init) => {
        requests.push({ url: new URL(url), init });
        return goodFetch();
    } });
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url.origin, "https://markets.newyorkfed.org");
    assert.equal(requests[0].url.pathname, "/api/rates/secured/sofr/search.json");
    assert.equal(requests[0].url.searchParams.get("startDate"), "2025-09-16");
    assert.equal(requests[0].url.searchParams.get("endDate"), "2026-10-16");
    assert.deepEqual(requests[0].init.headers, { Accept: "application/json" });
    assert.equal(result.snapshot.updatedAt, NOW);
    assert.equal(result.snapshot.series.sofr.fetchedAt, NOW);
    assert.deepEqual(result.errors, {});
});

test("successful refresh preserves older history and does not mutate the previous snapshot", async () => {
    const previous = previousSnapshot();
    const result = await fetchMarketSnapshot({ previous, now: NOW, fetchImpl: goodFetch });
    assert.equal(result.snapshot.series.sofr.points.at(-1).date, "2026-10-15");
    assert.equal(result.snapshot.series.sofr.points[0].date, "2026-10-08");
    assert.equal(result.snapshot.series.sofr.fetchedAt, NOW);
    assert.equal(previous.series.sofr.fetchedAt, OLD_TIME);
    assert.equal(previous.series.sofr.points.length, 1);
});

test("provider failures preserve history and its timestamps without leaking upstream errors", async () => {
    const previous = previousSnapshot();
    const result = await fetchMarketSnapshot({ previous, now: NOW, fetchImpl: async () => { throw new Error("private provider details"); } });
    assert.deepEqual(result.snapshot, previous);
    assert.deepEqual(result.errors, { sofr: "provider_unavailable" });
    assert.ok(!JSON.stringify(result).includes("private provider details"));
    const rateLimited = await fetchMarketSnapshot({ previous, now: NOW, fetchImpl: async () => new Response("error", { status: 429 }) });
    assert.deepEqual(rateLimited.snapshot, previous);
    assert.equal(rateLimited.errors.sofr, "rate_limited");
});

test("timeouts cover a hung response body as well as connecting", async () => {
    const previous = previousSnapshot();
    for (const fetchImpl of [
        async () => new Promise(() => {}),
        async () => ({ ok: true, headers: new Headers(), text: () => new Promise(() => {}) }),
    ]) {
        const result = await fetchMarketSnapshot({ previous, now: NOW, timeoutMs: 10, fetchImpl });
        assert.deepEqual(result.snapshot, previous);
        assert.deepEqual(result.errors, { sofr: "timeout" });
    }
});

test("older, future, and malformed upstream series never replace good data", async () => {
    for (const rows of [
        [{ type: "SOFR", effectiveDate: "2026-10-07", percentRate: 3.87 }],
        [{ type: "SOFR", effectiveDate: "2026-10-17", percentRate: 3.87 }],
        [{ type: "SOFR", effectiveDate: "2026-10-16", percentRate: null }],
        [],
    ]) {
        const previous = previousSnapshot();
        const result = await fetchMarketSnapshot({ previous, now: NOW, fetchImpl: async () => json({ refRates: rows }) });
        assert.deepEqual(result.snapshot, previous);
        assert.ok(result.errors.sofr);
    }
});

test("old FRED gold-index schema is discarded during migration", async () => {
    const legacy = { updatedAt: OLD_TIME, series: { gold: [{ date: "2026-10-08", value: 100 }], sofr: [{ date: "2026-10-08", value: 3.87 }] } };
    assert.equal(normalizeMarketSnapshot(legacy), null);
    const result = await fetchMarketSnapshot({ previous: legacy, now: NOW, fetchImpl: goodFetch });
    assert.deepEqual(Object.keys(result.snapshot.series), ["sofr"]);
    assert.equal(result.snapshot.schemaVersion, 2);
});

test("an initial failure returns no invented values or success timestamp", async () => {
    const result = await fetchMarketSnapshot({ now: NOW, fetchImpl: async () => new Response("bad gateway", { status: 502 }) });
    assert.deepEqual(result.snapshot, { schemaVersion: 2, updatedAt: null, series: {} });
    assert.deepEqual(result.errors, { sofr: "provider_unavailable" });
});
