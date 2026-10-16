/** Build a recoverable snapshot. Live charts refresh independently of deployments. */
import { readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchMarketSnapshot, normalizeMarketSnapshot } from "../lib/market-data.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = join(root, "public", "data");
mkdirSync(dataDir, { recursive: true });

async function fetchWithTimeout(url, options = {}) {
    return fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
}

async function retry(label, fn, attempts = 3) {
    for (let i = 1; i <= attempts; i++) {
        try { return await fn(); }
        catch {
            // Never log a provider URL, credential, or response body.
            if (i === attempts) throw new Error(`${label}: fetch failed after ${attempts} attempts`);
            await new Promise(resolve => setTimeout(resolve, 1000 * i));
        }
    }
}

function writeSnapshot(filename, data) {
    const path = join(dataDir, filename);
    const temporary = `${path}.tmp`;
    writeFileSync(temporary, JSON.stringify(data, null, 2) + "\n");
    renameSync(temporary, path);
}

async function readPublishedSnapshot(filename) {
    try {
        const response = await fetchWithTimeout(`https://mezzinc.com/data/${filename}`, { cache: "no-cache" });
        if (!response.ok) return null;
        return await response.json();
    } catch {
        return null;
    }
}

async function buildMarkets() {
    let previous;
    try { previous = normalizeMarketSnapshot(JSON.parse(readFileSync(join(dataDir, "markets.json"), "utf8"))); }
    catch { /* A missing or invalid snapshot cannot be used as a fallback. */ }
    // Each CI run starts from a clean checkout. Recover the latest deployment so
    // an upstream outage cannot roll the website back to an older committed file.
    const published = normalizeMarketSnapshot(await readPublishedSnapshot("markets.json"));
    const localSeries = previous?.series.sofr;
    const publishedSeries = published?.series.sofr;
    if (publishedSeries && (!localSeries
        || publishedSeries.points.at(-1).date > localSeries.points.at(-1).date
        || (publishedSeries.points.at(-1).date === localSeries.points.at(-1).date
            && Date.parse(publishedSeries.fetchedAt) > Date.parse(localSeries.fetchedAt)))) previous = published;
    const { snapshot, errors } = await fetchMarketSnapshot({ previous });
    writeSnapshot("markets.json", snapshot);
    console.log(`Market snapshot: ${Object.keys(snapshot.series).join(", ") || "no available series"}`);
    for (const [series, code] of Object.entries(errors)) console.warn(`::warning::${series}: ${code}; retained last successful history if available.`);
    if (Object.keys(errors).length) process.exitCode = 1;
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


await buildMarkets();
// News has the same clean-checkout issue as the SOFR recovery snapshot.
const publishedNews = await readPublishedSnapshot("news.json");
if (publishedNews && Array.isArray(publishedNews.fdic) && publishedNews.fdic.length
    && Array.isArray(publishedNews.fed) && publishedNews.fed.length
    && Number.isFinite(Date.parse(publishedNews.updatedAt))) {
    let localUpdated = 0;
    try { localUpdated = Date.parse(JSON.parse(readFileSync(join(dataDir, "news.json"), "utf8")).updatedAt) || 0; }
    catch { /* Use a valid published snapshot if no local news is available. */ }
    if (Date.parse(publishedNews.updatedAt) > localUpdated) writeSnapshot("news.json", publishedNews);
}
try {
    writeSnapshot("news.json", await buildNews());
    console.log("News snapshot updated.");
} catch {
    console.warn("::warning::News refresh failed; retained existing news snapshot.");
    process.exitCode = 1;
}
