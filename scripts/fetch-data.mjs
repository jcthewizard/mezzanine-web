/**
 * Build-time data ingestion.
 *
 * Fetches FRED market series and FDIC / Federal Reserve RSS feeds, writing
 * them to public/data/*.json so the exported static site can serve them
 * same-origin (no CORS proxies, no API key in the client bundle).
 *
 * Run via `node scripts/fetch-data.mjs` before `next build`. Requires
 * FRED_API_KEY in the environment (or .env.local for local runs).
 *
 * Failure policy: each output file is only overwritten on a fully successful
 * fetch. On failure the previously committed data is left in place and the
 * script exits 0 so the build still deploys with slightly stale data.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "public", "data");
mkdirSync(dataDir, { recursive: true });

// Load .env.local for local runs; CI provides env vars directly.
if (!process.env.FRED_API_KEY) {
    const envPath = join(root, ".env.local");
    if (existsSync(envPath)) {
        for (const line of readFileSync(envPath, "utf8").split("\n")) {
            const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
            if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
        }
    }
}

const FRED_API_KEY = process.env.FRED_API_KEY || process.env.NEXT_PUBLIC_FRED_API_KEY;

const FETCH_TIMEOUT_MS = 20000;

async function fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        return await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
                "User-Agent": "Mozilla/5.0 (compatible; mezzanine-data-fetcher)",
                ...options.headers,
            },
        });
    } finally {
        clearTimeout(timeout);
    }
}

async function retry(label, fn, attempts = 3) {
    let lastError;
    for (let i = 1; i <= attempts; i++) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;
            console.warn(`[${label}] attempt ${i}/${attempts} failed: ${err.message}`);
            if (i < attempts) await new Promise((r) => setTimeout(r, 2000 * i));
        }
    }
    throw lastError;
}

// ---------------------------------------------------------------------------
// FRED market data
// ---------------------------------------------------------------------------

async function fetchFredSeries(seriesId, startDate) {
    const url =
        `https://api.stlouisfed.org/fred/series/observations` +
        `?series_id=${seriesId}&api_key=${FRED_API_KEY}&file_type=json` +
        `&observation_start=${startDate}`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`FRED ${seriesId} HTTP ${response.status}`);

    const data = await response.json();
    if (!Array.isArray(data.observations)) {
        throw new Error(`FRED ${seriesId}: no observations in response`);
    }

    const points = data.observations
        .filter((obs) => obs.value !== ".")
        .map((obs) => ({ date: obs.date, value: parseFloat(obs.value) }));

    if (points.length === 0) throw new Error(`FRED ${seriesId}: empty series`);
    return points;
}

async function buildMarkets() {
    if (!FRED_API_KEY) throw new Error("FRED_API_KEY not set");

    // 13 months back so the 1y view is always fully populated.
    const start = new Date();
    start.setMonth(start.getMonth() - 13);
    const startDate = start.toISOString().split("T")[0];

    const [sofr, sp500, gold] = await Promise.all([
        retry("SOFR", () => fetchFredSeries("SOFR", startDate)),
        retry("SP500", () => fetchFredSeries("SP500", startDate)),
        retry("NASDAQQGLDI", () => fetchFredSeries("NASDAQQGLDI", startDate)),
    ]);

    return { updatedAt: new Date().toISOString(), series: { sofr, sp500, gold } };
}

// ---------------------------------------------------------------------------
// RSS news feeds
// ---------------------------------------------------------------------------

function decodeEntities(text) {
    return text
        .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#0?39;/g, "'")
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&")
        .trim();
}

function parseRssItems(xml, maxItems = 5) {
    const items = [];
    const itemBlocks = xml.match(/<item[\s>][\s\S]*?<\/item>/g) || [];

    for (const block of itemBlocks.slice(0, maxItems)) {
        const pick = (tag) => {
            const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
            return m ? decodeEntities(m[1]) : "";
        };
        const title = pick("title");
        const link = pick("link");
        const pubDate = pick("pubDate");
        if (title && link) items.push({ title, link, pubDate });
    }
    return items;
}

async function fetchRss(label, url) {
    const response = await fetchWithTimeout(url, { headers: { Accept: "application/xml" } });
    if (!response.ok) throw new Error(`${label} HTTP ${response.status}`);
    const items = parseRssItems(await response.text());
    if (items.length === 0) throw new Error(`${label}: no items parsed`);
    return items;
}

async function buildNews() {
    const [fdic, fed] = await Promise.all([
        retry("FDIC RSS", () =>
            fetchRss("FDIC RSS", "https://public.govdelivery.com/topics/USFDIC_26/feed.rss")
        ),
        retry("Fed RSS", () =>
            fetchRss("Fed RSS", "https://www.federalreserve.gov/feeds/press_all.xml")
        ),
    ]);
    return { updatedAt: new Date().toISOString(), fdic, fed };
}

// ---------------------------------------------------------------------------

async function writeIfSuccessful(filename, builder) {
    const outPath = join(dataDir, filename);
    try {
        const data = await builder();
        writeFileSync(outPath, JSON.stringify(data, null, 2) + "\n");
        console.log(`✓ wrote ${filename}`);
        return true;
    } catch (err) {
        if (existsSync(outPath)) {
            console.error(`✗ ${filename}: ${err.message} — keeping existing file`);
        } else {
            console.error(`✗ ${filename}: ${err.message} — no existing file to fall back on`);
        }
        return false;
    }
}

const results = await Promise.all([
    writeIfSuccessful("markets.json", buildMarkets),
    writeIfSuccessful("news.json", buildNews),
]);

// Exit 0 even on partial failure so the site still builds with prior data.
console.log(results.every(Boolean) ? "All data fetched successfully." : "Completed with some failures.");
