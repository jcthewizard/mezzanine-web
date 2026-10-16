import assert from "node:assert/strict";
import test from "node:test";
import {
    formatMarketDate,
    getRangeStart,
    isSofrStale,
    latestSofrSeries,
    parseSofrBackup,
    parseSofrHistory,
} from "../lib/market-display";

test("an October 8 observation stays October 8 in Pacific time and UTC", () => {
    const original = process.env.TZ;
    try {
        for (const zone of ["America/Los_Angeles", "UTC", "Pacific/Auckland"]) {
            process.env.TZ = zone;
            assert.equal(formatMarketDate("2026-10-08", true), "Oct 8, 2026");
        }
    } finally {
        if (original === undefined) delete process.env.TZ;
        else process.env.TZ = original;
    }
});

test("SOFR freshness follows publication days rather than elapsed calendar days", () => {
    assert.equal(isSofrStale("2026-10-15", new Date("2026-10-16T16:00:00Z")), false);
    assert.equal(isSofrStale("2026-10-08", new Date("2026-10-16T16:00:00Z")), true);
    // Before Monday's publication, Thursday is still the latest published observation.
    assert.equal(isSofrStale("2026-10-15", new Date("2026-10-19T11:00:00Z")), false);
    assert.equal(isSofrStale("2026-10-15", new Date("2026-10-19T15:00:00Z")), true);
    assert.equal(isSofrStale("2026-10-16", new Date("2026-10-19T15:00:00Z")), false);
    // Columbus Day does not create a missing daily observation.
    assert.equal(isSofrStale("2026-10-08", new Date("2026-10-12T16:00:00Z")), false);
    assert.equal(isSofrStale("2026-10-09", new Date("2026-10-13T16:00:00Z")), false);
});

test("legacy index history cannot be interpreted as gold or ETF prices", () => {
    const parsed = parseSofrBackup({
        updatedAt: "2026-10-09T12:00:00Z",
        series: {
            sofr: [{ date: "2026-10-08", value: 3.87 }],
            gold: [{ date: "2026-10-08", value: 2524.7 }],
            sp500: [{ date: "2026-10-08", value: 7765.36 }],
        },
    });
    assert.ok(parsed);
    assert.deepEqual(parsed.points, [{ date: "2026-10-08", value: 3.87 }]);
    assert.equal("gold" in parsed, false);
    assert.equal("sp500" in parsed, false);
});

test("empty or malformed SOFR responses stay unavailable, not zero", () => {
    assert.equal(parseSofrHistory({ refRates: [] }), null);
    assert.equal(parseSofrHistory({ refRates: [{ type: "SOFR", effectiveDate: "2026-02-30", percentRate: 3.5 }] }), null);
    assert.equal(parseSofrHistory({ refRates: [{ type: "SOFR", effectiveDate: "2026-10-15", percentRate: null }] }), null);
});

test("a future or partly malformed response cannot be presented as current", () => {
    assert.equal(parseSofrHistory({ refRates: [{ type: "SOFR", effectiveDate: "2099-01-01", percentRate: 3.5 }] }), null);
    assert.equal(parseSofrHistory({ refRates: [
        { type: "SOFR", effectiveDate: "2026-10-15", percentRate: 3.89 },
        { type: "SOFR", effectiveDate: "not-a-date", percentRate: 3.88 },
    ] }), null);
});

test("a late fallback response cannot roll back newer observations", () => {
    const latest = parseSofrHistory({ refRates: [{ type: "SOFR", effectiveDate: "2026-10-15", percentRate: 3.89 }] });
    const older = parseSofrHistory({ refRates: [{ type: "SOFR", effectiveDate: "2026-10-08", percentRate: 3.87 }] });
    assert.ok(latest);
    assert.ok(older);
    assert.equal(latestSofrSeries(latest, older), latest);
    assert.equal(latestSofrSeries(null, latest), latest);
});

test("partial updates retain history and older backups cannot undo a rate revision", () => {
    const previous = parseSofrHistory({ refRates: [
        { type: "SOFR", effectiveDate: "2026-10-14", percentRate: 3.88 },
        { type: "SOFR", effectiveDate: "2026-10-15", percentRate: 3.89 },
    ] });
    const update = parseSofrHistory({ refRates: [{ type: "SOFR", effectiveDate: "2026-10-15", percentRate: 3.90 }] });
    assert.ok(previous);
    assert.ok(update);
    previous.fetchedAt = "2026-10-16T12:00:00Z";
    update.fetchedAt = "2026-10-16T19:00:00Z";
    const revised = latestSofrSeries(previous, update);
    assert.deepEqual(revised.points, [
        { date: "2026-10-14", value: 3.88 },
        { date: "2026-10-15", value: 3.90 },
    ]);
    assert.equal(latestSofrSeries(revised, previous), revised);
});

test("range cutoffs use calendar dates consistently at year boundaries", () => {
    const now = new Date("2026-01-01T01:00:00Z");
    assert.equal(getRangeStart("ytd", now), "2026-01-01");
    assert.equal(getRangeStart("1y", now), "2025-01-01");
    assert.equal(getRangeStart("30d", now), "2025-12-02");
});
