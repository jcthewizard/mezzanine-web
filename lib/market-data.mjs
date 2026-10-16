/** Official SOFR history, shared by browser refreshes and the static fallback. */
export const SOFR_SOURCE_URL = "https://www.newyorkfed.org/markets/reference-rates/sofr";
export const SOFR_API_URL = "https://markets.newyorkfed.org/api/rates/secured/sofr/search.json";
const MAX_RESPONSE_BYTES = 512 * 1024;

class MarketDataError extends Error {
    constructor(code) {
        super(code);
        this.code = code;
    }
}

function validDate(date) {
    if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const time = Date.parse(`${date}T00:00:00.000Z`);
    return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date;
}

function validTimestamp(value) {
    return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function numericValue(value) {
    if (typeof value !== "number" && !(typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value))) {
        throw new MarketDataError("invalid_data");
    }
    const number = Number(value);
    if (!Number.isFinite(number)) throw new MarketDataError("invalid_data");
    return number;
}

/** Reject malformed rows instead of accidentally replacing good history with them. */
export function normalizePoints(input) {
    if (!Array.isArray(input) || input.length === 0 || input.length > 5000) {
        throw new MarketDataError("invalid_data");
    }
    const byDate = new Map();
    for (const point of input) {
        if (!point || !validDate(point.date)) throw new MarketDataError("invalid_data");
        const value = numericValue(point.value);
        if (byDate.has(point.date) && byDate.get(point.date) !== value) {
            throw new MarketDataError("invalid_data");
        }
        byDate.set(point.date, value);
    }
    return [...byDate].sort(([a], [b]) => a.localeCompare(b)).map(([date, value]) => ({ date, value }));
}

/** NY Fed's documented /api/rates/secured/sofr/search.json response. */
export function parseSofrResponse(payload) {
    if (!payload || !Array.isArray(payload.refRates) || payload.refRates.some((row) => row?.type !== "SOFR")) {
        throw new MarketDataError("invalid_data");
    }
    return normalizePoints(payload.refRates.map((row) => ({ date: row.effectiveDate, value: row.percentRate })));
}

const SOFR_METADATA = { source: "Federal Reserve Bank of New York", sourceUrl: SOFR_SOURCE_URL, historyKind: "daily-rate" };

/** Recover only validated SOFR history; retired market indexes are never imported. */
export function normalizeMarketSnapshot(input) {
    if (!input || input.schemaVersion !== 2 || !input.series) return null;
    const series = {};
    const value = input.series.sofr;
    if (value && validTimestamp(value.fetchedAt) && value.source === SOFR_METADATA.source && value.historyKind === SOFR_METADATA.historyKind) {
        try {
            series.sofr = { points: normalizePoints(value.points), fetchedAt: value.fetchedAt, ...SOFR_METADATA };
        } catch {
            // Never use malformed cached data as the last good history.
        }
    }
    return { schemaVersion: 2, updatedAt: validTimestamp(input.updatedAt) ? input.updatedAt : null, series };
}

function dateRange(now) {
    const endDate = now.toISOString().slice(0, 10);
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 13, 1));
    const daysInMonth = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
    start.setUTCDate(Math.min(now.getUTCDate(), daysInMonth));
    return { start, startDate: start.toISOString().slice(0, 10), endDate };
}

async function fetchJson(url, { headers = {}, fetchImpl, timeoutMs }) {
    const controller = new AbortController();
    let timeout;
    try {
        return await Promise.race([
            (async () => {
                const response = await fetchImpl(url, { headers: { Accept: "application/json", ...headers }, signal: controller.signal });
                if (!response.ok) throw new MarketDataError(response.status === 429 ? "rate_limited" : "provider_unavailable");
                if (Number(response.headers.get("content-length")) > MAX_RESPONSE_BYTES) throw new MarketDataError("invalid_data");
                const body = await response.text();
                if (body.length > MAX_RESPONSE_BYTES) throw new MarketDataError("invalid_data");
                try {
                    return JSON.parse(body);
                } catch {
                    throw new MarketDataError("invalid_data");
                }
            })(),
            new Promise((_, reject) => {
                timeout = setTimeout(() => {
                    reject(new MarketDataError("timeout"));
                    controller.abort();
                }, timeoutMs);
            }),
        ]);
    } finally {
        clearTimeout(timeout);
    }
}

function mergeHistory(previous, incoming, startDate, endDate) {
    if (incoming.some(({ date }) => date < startDate || date > endDate)) throw new MarketDataError("invalid_data");
    const latest = incoming.at(-1).date;
    if (previous?.points.at(-1)?.date > latest) throw new MarketDataError("older_data");
    const byDate = new Map((previous?.points || []).filter(({ date }) => date >= startDate).map((point) => [point.date, point]));
    for (const point of incoming) byDate.set(point.date, point);
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Fetch the public NY Fed API once; no account, key, or paid service is needed.
 * An outage never erases the last good series or changes its fetchedAt timestamp.
 * Error codes contain no response bodies or arbitrary upstream exception text.
 */
export async function fetchMarketSnapshot({ previous, fetchImpl = fetch, now = new Date(), timeoutMs = 12000 } = {}) {
    const currentTime = new Date(now);
    const fetchedAt = currentTime.toISOString();
    const { startDate, endDate } = dateRange(currentTime);
    const snapshot = normalizeMarketSnapshot(previous) || { schemaVersion: 2, updatedAt: null, series: {} };
    const errors = {};
    const sofrUrl = new URL(SOFR_API_URL);
    sofrUrl.searchParams.set("startDate", startDate);
    sofrUrl.searchParams.set("endDate", endDate);
    try {
        const payload = await fetchJson(sofrUrl, { fetchImpl, timeoutMs });
        const points = parseSofrResponse(payload);
        snapshot.series.sofr = { points: mergeHistory(snapshot.series.sofr, points, startDate, endDate), fetchedAt, ...SOFR_METADATA };
        snapshot.updatedAt = fetchedAt;
    } catch (error) {
        errors.sofr = error instanceof MarketDataError ? error.code : "provider_unavailable";
    }
    return { snapshot, errors };
}
