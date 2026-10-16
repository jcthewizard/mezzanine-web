export type MarketPoint = { date: string; value: number };
export type MarketSeries = {
    points: MarketPoint[];
    fetchedAt: string;
    source: string;
    sourceUrl: string;
    historyKind: "daily-rate";
};
export type MarketSnapshot = {
    schemaVersion: 2;
    updatedAt: string | null;
    series: { sofr?: MarketSeries };
};
export type MarketDataErrorCode = "invalid_data" | "provider_unavailable" | "rate_limited" | "timeout" | "older_data";
export const SOFR_SOURCE_URL: string;
export const SOFR_API_URL: string;
export function normalizePoints(input: unknown): MarketPoint[];
export function parseSofrResponse(payload: unknown): MarketPoint[];
export function normalizeMarketSnapshot(input: unknown): MarketSnapshot | null;
export function fetchMarketSnapshot(options?: {
    previous?: unknown;
    fetchImpl?: typeof fetch;
    now?: Date | string | number;
    timeoutMs?: number;
}): Promise<{ snapshot: MarketSnapshot; errors: Partial<Record<"sofr", MarketDataErrorCode>> }>;
