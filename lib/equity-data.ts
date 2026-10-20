/** Browser-only SPY history. Prices are unadjusted and delayed at least 48 hours. */
export const EQUITY_SOURCE_URL = "https://getmarkethistory.com/";
const EQUITY_API_URL = "https://getmarkethistory.com/api/v1/bars/stocks/SPY/1h";
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const MAX_BARS = 10000;
const MAX_DAILY_POINTS = 380;
const STALE_AFTER_MS = 5 * DAY_MS;
const newYorkDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
});

export interface EquityPoint {
    /** New York date at the start of the last available real hourly bar. */
    date: string;
    value: number;
    /** End of that hourly bar, in UTC. This is not an official closing quote. */
    observedAt: string;
}

export interface EquityHistory {
    points: EquityPoint[];
    fetchedAt: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

/** This public hourly endpoint requires neither credentials nor an account. */
export function getEquityHistoryUrl(now = new Date()): string {
    const start = new Date(Date.UTC(now.getUTCFullYear() - 1, now.getUTCMonth(), now.getUTCDate()));
    // Include a short buffer before the one-year chart range for non-trading days.
    start.setUTCDate(start.getUTCDate() - 7);
    const url = new URL(EQUITY_API_URL);
    url.search = new URLSearchParams({
        start: start.toISOString().slice(0, 10),
        end: now.toISOString().slice(0, 10),
        limit: String(MAX_BARS),
        format: "json",
        columns: "symbol,timestamp,close,is_gap",
    }).toString();
    return url.toString();
}

function tradingDate(barOpen: number): string {
    const parts = newYorkDate.formatToParts(barOpen);
    const part = (type: string) => parts.find(item => item.type === type)?.value;
    return `${part("year")}-${part("month")}-${part("day")}`;
}

function parseHourOpen(value: unknown): number | null {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:00:00(?:\.000)?Z$/.test(value)) return null;
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) return null;
    const canonical = new Date(timestamp).toISOString();
    return value === canonical || value === canonical.replace(".000Z", "Z") ? timestamp : null;
}

/**
 * Reduce complete hourly bars to one real observation per New York date,
 * including extended trading hours. Reject a malformed or paginated response
 * as a whole so a broken refresh cannot silently replace good chart history.
 * The no-account endpoint may cap pages at 5,000 even when 10,000 is requested.
 */
export function parseEquityHistory(value: unknown, now = new Date()): EquityHistory | null {
    const nowMs = now.getTime();
    if (!Number.isFinite(nowMs) || !isRecord(value) || !Array.isArray(value.bars)
        || value.bars.length === 0 || value.bars.length > MAX_BARS
        || !Number.isInteger(value.count) || value.count !== value.bars.length
        || (value.next_cursor !== null && value.next_cursor !== "")) return null;

    const hours = new Map<number, { close: number | null; gap: boolean }>();
    const days = new Map<string, EquityPoint>();
    for (const row of value.bars) {
        if (!isRecord(row) || row.symbol !== "SPY" || typeof row.is_gap !== "boolean") return null;
        const open = parseHourOpen(row.timestamp);
        if (open === null || open + HOUR_MS > nowMs) return null;
        const close = row.close;
        // Explicit gaps may carry null or zero placeholders; they never become
        // prices. Real bars must have a positive finite numeric close.
        if (row.is_gap ? !(close === null || (typeof close === "number" && Number.isFinite(close) && close >= 0))
            : !(typeof close === "number" && Number.isFinite(close) && close > 0)) return null;

        const priorHour = hours.get(open);
        if (priorHour && (priorHour.close !== close || priorHour.gap !== row.is_gap)) return null;
        hours.set(open, { close: close as number | null, gap: row.is_gap });
        if (row.is_gap) continue;

        const date = tradingDate(open);
        const observedAt = new Date(open + HOUR_MS).toISOString();
        const priorDay = days.get(date);
        if (!priorDay || observedAt > priorDay.observedAt) {
            days.set(date, { date, value: close as number, observedAt });
        }
    }
    if (days.size === 0 || days.size > MAX_DAILY_POINTS) return null;
    return {
        points: [...days.values()].sort((a, b) => a.date.localeCompare(b.date)),
        fetchedAt: now.toISOString(),
    };
}

/** Preserve later intraday observations even when a newer response is partial. */
export function latestEquityHistory(previous: EquityHistory | null, incoming: EquityHistory): EquityHistory {
    if (!previous) return incoming;
    const incomingLast = incoming.points.at(-1);
    const previousLast = previous.points.at(-1);
    if (!incomingLast || (previousLast && incomingLast.observedAt < previousLast.observedAt)) return previous;

    const newerFetch = Date.parse(incoming.fetchedAt) > Date.parse(previous.fetchedAt);
    const points = new Map(previous.points.map(point => [point.date, point]));
    let changed = false;
    for (const point of incoming.points) {
        const existing = points.get(point.date);
        if (!existing || point.observedAt > existing.observedAt
            || (point.observedAt === existing.observedAt && newerFetch && point.value !== existing.value)) {
            points.set(point.date, point);
            changed = true;
        }
    }
    if (!changed && !newerFetch) return previous;
    return {
        points: [...points.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-MAX_DAILY_POINTS),
        fetchedAt: newerFetch ? incoming.fetchedAt : previous.fetchedAt,
    };
}

/**
 * This is a conservative freshness warning, not an exchange calendar. Five
 * elapsed days allow the stated 48-hour lag, a weekend, and one day of grace.
 * Fetching the same old history again must not make it appear fresh.
 */
export function isEquityHistoryStale(history: EquityHistory, now = new Date()): boolean {
    const observedAt = history.points.at(-1)?.observedAt;
    const observedMs = observedAt ? Date.parse(observedAt) : NaN;
    const nowMs = now.getTime();
    return !Number.isFinite(observedMs) || !Number.isFinite(nowMs)
        || observedMs > nowMs || nowMs - observedMs > STALE_AFTER_MS;
}
