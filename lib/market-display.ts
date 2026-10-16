import { normalizePoints, parseSofrResponse, SOFR_SOURCE_URL } from "./market-data.mjs";

export { SOFR_SOURCE_URL } from "./market-data.mjs";

export interface MarketPoint {
    date: string;
    value: number;
}

export interface MarketSeries {
    points: MarketPoint[];
    fetchedAt: string | null;
    source: string;
    sourceUrl: string;
    historyKind: "daily-rate";
}

export type TimeRange = "30d" | "90d" | "1y" | "ytd";
const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

function rejectFutureDates(points: MarketPoint[]): MarketPoint[] {
    const today = new Date().toISOString().slice(0, 10);
    if (points.some(point => point.date > today)) throw new Error("Future SOFR observation");
    return points;
}

export function parseSofrBackup(value: unknown): MarketSeries | null {
    if (!isRecord(value) || !isRecord(value.series)) return null;
    const series = value.series.sofr;
    // Only SOFR is read from this file. The legacy gold series is an unrelated index.
    try {
        let rawPoints: unknown = series;
        let fetchedAt: string | null = null;
        if (value.schemaVersion === 2) {
            if (!isRecord(series) || series.historyKind !== "daily-rate"
                || series.source !== "Federal Reserve Bank of New York"
                || (series.type !== undefined && series.type !== "SOFR")
                || typeof series.fetchedAt !== "string" || !Number.isFinite(Date.parse(series.fetchedAt))) return null;
            rawPoints = series.points;
            fetchedAt = series.fetchedAt;
        }
        if (Array.isArray(rawPoints) && rawPoints.some(point => isRecord(point) && point.type !== undefined && point.type !== "SOFR")) return null;
        return {
            points: rejectFutureDates(normalizePoints(rawPoints)),
            fetchedAt,
            source: "Federal Reserve Bank of New York",
            sourceUrl: SOFR_SOURCE_URL,
            historyKind: "daily-rate",
        };
    } catch {
        return null;
    }
}

export function parseSofrHistory(value: unknown): MarketSeries | null {
    try {
        return {
            points: rejectFutureDates(parseSofrResponse(value)),
            fetchedAt: new Date().toISOString(),
            source: "Federal Reserve Bank of New York",
            sourceUrl: SOFR_SOURCE_URL,
            historyKind: "daily-rate",
        };
    } catch {
        return null;
    }
}

export function latestSofrSeries(previous: MarketSeries | null, incoming: MarketSeries): MarketSeries {
    if (!previous) return incoming;
    const incomingDate = incoming.points[incoming.points.length - 1].date;
    const previousDate = previous.points[previous.points.length - 1].date;
    if (incomingDate < previousDate) return previous;
    const newerFetch = incoming.fetchedAt !== null && (previous.fetchedAt === null
        || Date.parse(incoming.fetchedAt) > Date.parse(previous.fetchedAt));
    const pointsByDate = new Map(previous.points.map(point => [point.date, point]));
    let changed = false;
    for (const point of incoming.points) {
        const existing = pointsByDate.get(point.date);
        if (!existing || (newerFetch && existing.value !== point.value)) {
            pointsByDate.set(point.date, point);
            changed = true;
        }
    }
    if (!changed && !newerFetch) return previous;
    return {
        ...(incomingDate > previousDate || newerFetch ? incoming : previous),
        points: [...pointsByDate.values()].sort((a, b) => a.date.localeCompare(b.date)),
    };
}

export function getRangeStart(range: TimeRange, now = new Date()): string {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    if (range === "ytd") start.setUTCMonth(0, 1);
    else if (range === "1y") start.setUTCFullYear(start.getUTCFullYear() - 1);
    else start.setUTCDate(start.getUTCDate() - (range === "30d" ? 30 : 90));
    return start.toISOString().slice(0, 10);
}

export function formatMarketDate(value: string, includeYear = false): string {
    return new Date(`${value}T12:00:00Z`).toLocaleDateString("en-US", {
        month: "short", day: "numeric", ...(includeYear ? { year: "numeric" as const } : {}), timeZone: "UTC",
    });
}

function newYorkParts(now: Date): { day: string; hour: number; weekday: number } {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hourCycle: "h23",
    }).formatToParts(now);
    const part = (type: string) => parts.find(value => value.type === type)?.value ?? "";
    const day = `${part("year")}-${part("month")}-${part("day")}`;
    return { day, hour: Number(part("hour")), weekday: new Date(`${day}T12:00:00Z`).getUTCDay() };
}

function shiftDay(day: string, count: number): string {
    const date = new Date(`${day}T12:00:00Z`);
    date.setUTCDate(date.getUTCDate() + count);
    return date.toISOString().slice(0, 10);
}

function isSofrBusinessDay(day: string): boolean {
    const date = new Date(`${day}T12:00:00Z`);
    const weekday = date.getUTCDay();
    if (weekday === 0 || weekday === 6) return false;
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const number = date.getUTCDate();
    // Federal holidays (observed), plus Good Friday for the Treasury market.
    const fixedHolidays = [`${year}-01-01`, `${year}-06-19`, `${year}-07-04`, `${year}-11-11`, `${year}-12-25`, `${year + 1}-01-01`];
    if (fixedHolidays.some(holiday => {
        const holidayWeekday = new Date(`${holiday}T12:00:00Z`).getUTCDay();
        return day === shiftDay(holiday, holidayWeekday === 6 ? -1 : holidayWeekday === 0 ? 1 : 0);
    })) return false;
    if (weekday === 1 && ((month === 1 && number >= 15 && number <= 21)
        || (month === 2 && number >= 15 && number <= 21)
        || (month === 5 && number >= 25)
        || (month === 9 && number <= 7)
        || (month === 10 && number >= 8 && number <= 14))) return false;
    if (month === 11 && weekday === 4 && number >= 22 && number <= 28) return false;
    const a = year % 19, b = Math.floor(year / 100), c = year % 100;
    const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const easterMonth = Math.floor((h + l - 7 * m + 114) / 31);
    const easterDay = ((h + l - 7 * m + 114) % 31) + 1;
    const easter = new Date(Date.UTC(year, easterMonth - 1, easterDay)).toISOString().slice(0, 10);
    return day !== shiftDay(easter, -2);
}

export function isSofrStale(effectiveDate: string, now = new Date()): boolean {
    const local = newYorkParts(now);
    let publicationDay = local.day;
    // SOFR publishes at about 08:00 ET; allow one hour for publication and caching.
    if (local.hour < 9 || !isSofrBusinessDay(publicationDay)) publicationDay = shiftDay(publicationDay, -1);
    while (!isSofrBusinessDay(publicationDay)) publicationDay = shiftDay(publicationDay, -1);
    let expectedEffectiveDate = shiftDay(publicationDay, -1);
    while (!isSofrBusinessDay(expectedEffectiveDate)) expectedEffectiveDate = shiftDay(expectedEffectiveDate, -1);
    return effectiveDate < expectedEffectiveDate;
}
