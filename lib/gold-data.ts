import { formatMarketDate, type MarketPoint } from "./market-display";

export const GOLD_SOURCE_URL = "https://standardbullion.com";
export const GOLD_QUOTE_URL = `${GOLD_SOURCE_URL}/spot-prices.json`;
export const GOLD_HISTORY_URL = `${GOLD_SOURCE_URL}/api/v1/market/history?metal=XAU&range=1y`;

export interface GoldQuote {
    ask: number;
    updatedAt: string;
}

export interface GoldHistory {
    points: MarketPoint[];
    fetchedAt: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);
const isPrice = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value) && value > 0;

function parseTimestamp(value: unknown, now: Date): string | null {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) return null;
    const milliseconds = Date.parse(value);
    if (!Number.isFinite(milliseconds) || milliseconds > now.getTime()) return null;
    const canonical = new Date(milliseconds).toISOString();
    // Date.parse normalizes invalid calendar dates such as February 30.
    return canonical.slice(0, 19) === value.slice(0, 19) ? canonical : null;
}

function isGoldFeed(value: unknown): value is Record<string, unknown> {
    return isRecord(value) && value.source === "Standard Bullion" && value.unit === "USD per troy ounce";
}

export function parseGoldQuote(value: unknown, now = new Date()): GoldQuote | null {
    if (!isGoldFeed(value) || !Array.isArray(value.metals)) return null;
    const gold = value.metals.filter(metal => isRecord(metal) && metal.symbol === "XAU");
    const updatedAt = parseTimestamp(value.updated, now);
    if (gold.length !== 1 || !isRecord(gold[0]) || !isPrice(gold[0].ask) || !updatedAt) return null;
    // A dealer ask is not a bid, indicative midpoint, or historical benchmark.
    return { ask: gold[0].ask, updatedAt };
}

export function parseGoldHistory(value: unknown, now = new Date()): GoldHistory | null {
    if (!isGoldFeed(value) || value.metal !== "XAU" || value.grain !== "daily"
        || !Array.isArray(value.points) || value.points.length === 0 || value.points.length > 1_000) return null;
    const points = new Map<string, MarketPoint>();
    for (const point of value.points) {
        if (!isRecord(point) || !isPrice(point.price)) return null;
        const timestamp = parseTimestamp(point.t, now);
        // This endpoint supplies UTC calendar dates, not intraday observations.
        if (!timestamp || timestamp.slice(11) !== "00:00:00.000Z") return null;
        const date = timestamp.slice(0, 10);
        const existing = points.get(date);
        if (existing && existing.value !== point.price) return null;
        points.set(date, { date, value: point.price });
    }
    return {
        points: [...points.values()].sort((a, b) => a.date.localeCompare(b.date)),
        fetchedAt: now.toISOString(),
    };
}

export function latestGoldQuote(previous: GoldQuote | null, incoming: GoldQuote | null): GoldQuote | null {
    if (!incoming) return previous;
    if (!previous) return incoming;
    // Equal timestamps cannot justify a conflicting quote or an older cache overwriting it.
    return incoming.updatedAt > previous.updatedAt ? incoming : previous;
}

export function latestGoldHistory(previous: GoldHistory | null, incoming: GoldHistory | null): GoldHistory | null {
    if (!incoming) return previous;
    if (!previous) return incoming;
    const latestIncoming = incoming.points[incoming.points.length - 1];
    const latestPrevious = previous.points[previous.points.length - 1];
    if (latestIncoming.date < latestPrevious.date || incoming.fetchedAt <= previous.fetchedAt) return previous;
    // Preserve the visible history if an otherwise valid refresh returns only part of it.
    const byDate = new Map(previous.points.map(point => [point.date, point]));
    for (const point of incoming.points) byDate.set(point.date, point);
    return { ...incoming, points: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)) };
}

export function isGoldQuoteStale(quote: GoldQuote, now = new Date()): boolean {
    // Freshness describes the provider feed, not the time of the last market trade.
    return now.getTime() - Date.parse(quote.updatedAt) > 15 * 60_000;
}

export function formatGoldTimestamp(value: string): string {
    const time = new Date(value).toLocaleTimeString("en-US", {
        hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC",
    });
    return `${formatMarketDate(value.slice(0, 10), true)}, ${time} UTC`;
}
