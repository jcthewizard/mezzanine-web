"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMarketDate, getRangeStart, type TimeRange } from "@/lib/market-display";
import {
    GOLD_HISTORY_URL, GOLD_QUOTE_URL, GOLD_SOURCE_URL, formatGoldTimestamp, isGoldQuoteStale,
    latestGoldHistory, latestGoldQuote, parseGoldHistory, parseGoldQuote, type GoldHistory, type GoldQuote,
} from "@/lib/gold-data";

const QUOTE_INTERVAL = 60_000;
const HISTORY_INTERVAL = 15 * 60_000;
const price = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function GoldChart() {
    const [quote, setQuote] = useState<GoldQuote | null>(null);
    const [history, setHistory] = useState<GoldHistory | null>(null);
    const [quoteLoading, setQuoteLoading] = useState(true);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [quoteError, setQuoteError] = useState(false);
    const [historyError, setHistoryError] = useState(false);
    const [range, setRange] = useState<TimeRange>("90d");
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        let disposed = false;
        let quotePending = false;
        let historyPending = false;
        let lastQuoteAttempt = 0;
        let lastHistoryAttempt = 0;
        let lastQuote: GoldQuote | null = null;
        let lastHistory: GoldHistory | null = null;
        const controllers = new Set<AbortController>();

        async function fetchJson(url: string): Promise<unknown> {
            const controller = new AbortController();
            controllers.add(controller);
            const timeout = window.setTimeout(() => controller.abort(), 12_000);
            try {
                const response = await fetch(url, { signal: controller.signal, cache: "no-cache" });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return await response.json();
            } finally {
                window.clearTimeout(timeout);
                controllers.delete(controller);
            }
        }

        async function refreshQuote() {
            if (quotePending || disposed) return;
            quotePending = true;
            lastQuoteAttempt = Date.now();
            try {
                const incoming = parseGoldQuote(await fetchJson(GOLD_QUOTE_URL));
                if (!incoming || (lastQuote && (incoming.updatedAt < lastQuote.updatedAt
                    || (incoming.updatedAt === lastQuote.updatedAt && incoming.ask !== lastQuote.ask)))) {
                    throw new Error("Invalid or older gold quote");
                }
                lastQuote = latestGoldQuote(lastQuote, incoming);
                if (!disposed) {
                    setQuote(lastQuote);
                    setQuoteError(false);
                }
            } catch {
                if (!disposed) setQuoteError(true);
            } finally {
                quotePending = false;
                if (!disposed) setQuoteLoading(false);
            }
        }

        async function refreshHistory() {
            if (historyPending || disposed) return;
            historyPending = true;
            lastHistoryAttempt = Date.now();
            try {
                const incoming = parseGoldHistory(await fetchJson(GOLD_HISTORY_URL));
                if (!incoming || (lastHistory && incoming.points[incoming.points.length - 1].date
                    < lastHistory.points[lastHistory.points.length - 1].date)) {
                    throw new Error("Invalid or older gold history");
                }
                lastHistory = latestGoldHistory(lastHistory, incoming);
                if (!disposed) {
                    setHistory(lastHistory);
                    setHistoryError(false);
                }
            } catch {
                if (!disposed) setHistoryError(true);
            } finally {
                historyPending = false;
                if (!disposed) setHistoryLoading(false);
            }
        }

        function refreshVisible() {
            if (document.visibilityState === "hidden") return;
            setNow(new Date());
            if (Date.now() - lastQuoteAttempt >= QUOTE_INTERVAL) void refreshQuote();
            if (Date.now() - lastHistoryAttempt >= HISTORY_INTERVAL) void refreshHistory();
        }

        refreshVisible();
        const interval = window.setInterval(refreshVisible, QUOTE_INTERVAL);
        document.addEventListener("visibilitychange", refreshVisible);
        window.addEventListener("focus", refreshVisible);
        return () => {
            disposed = true;
            window.clearInterval(interval);
            document.removeEventListener("visibilitychange", refreshVisible);
            window.removeEventListener("focus", refreshVisible);
            for (const controller of controllers) controller.abort();
        };
    }, []);

    const data = now ? (history?.points ?? []).filter(point => point.date >= getRangeStart(range, now)) : [];
    const lastClose = history?.points[history.points.length - 1];
    const staleQuote = Boolean(quote && now && isGoldQuoteStale(quote, now));
    const staleHistory = Boolean(lastClose && now && now.getTime() - Date.parse(`${lastClose.date}T00:00:00Z`) > 5 * 24 * 60 * 60_000);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }} className="bg-white border border-border p-6 min-w-0">
            <h3 className="text-lg font-medium text-charcoal mb-2">Gold</h3>
            <p className="text-slate text-sm mb-5">Daily closes · USD per troy ounce</p>
            <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Gold history range">
                {(["30d", "90d", "1y", "ytd"] as TimeRange[]).map(option => (
                    <button key={option} type="button" onClick={() => setRange(option)} aria-pressed={range === option}
                        className={`px-4 py-2 text-sm tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${range === option ? "bg-red text-white" : "bg-cream text-charcoal hover:bg-red hover:text-white"}`}>
                        {option === "ytd" ? "YTD" : option.toUpperCase()}
                    </button>
                ))}
            </div>
            {data.length ? <div role="img" aria-label={`Gold daily closing prices, ${formatMarketDate(data[0].date, true)} to ${formatMarketDate(data[data.length - 1].date, true)}. Latest close ${price(data[data.length - 1].value)} per troy ounce.`}>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: 0 }} accessibilityLayer>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={value => formatMarketDate(value)} stroke="#6B7280"
                            style={{ fontSize: "12px", fontFamily: "inherit" }} tickLine={false} minTickGap={24} />
                        <YAxis stroke="#6B7280" style={{ fontSize: "12px", fontFamily: "inherit" }} tickLine={false} width={60}
                            tickFormatter={value => `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`} domain={["auto", "auto"]} />
                        <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "0", fontSize: "14px" }}
                            labelFormatter={value => formatMarketDate(String(value), true)}
                            formatter={(value: number | undefined) => [value === undefined ? "Unavailable" : price(value), "Daily close"]} />
                        <Line type="monotone" dataKey="value" stroke="#8B7355" strokeWidth={2} dot={data.length === 1} activeDot={{ r: 4 }} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div> : <div className="h-[250px] flex items-center justify-center bg-cream/40 px-5 text-center">
                <p className="text-slate text-sm leading-relaxed">{historyLoading ? "Loading gold history…" : history ? "No closes in this period. Select a longer range." : "Gold history is temporarily unavailable."}</p>
            </div>}
            <div className="mt-4 pt-4 border-t border-border text-xs text-slate space-y-2">
                <div aria-live="polite" aria-atomic="true">
                    {quote ? <>
                        <p className="mb-1">Latest dealer ask</p>
                        <p className="text-2xl font-medium text-charcoal">{price(quote.ask)}</p>
                        <p className="mt-1">Provider updated <time dateTime={quote.updatedAt}>{formatGoldTimestamp(quote.updatedAt)}</time></p>
                    </> : <p>{quoteLoading ? "Loading latest quote…" : "Latest quote temporarily unavailable."}</p>}
                </div>
                {lastClose && <p>Daily closes through {formatMarketDate(lastClose.date, true)}.</p>}
                {quoteError && quote && <p className="text-red" role="status">Quote refresh unavailable. Showing the last available quote.</p>}
                {staleQuote && !quoteError && <p role="status">The provider has not updated this quote recently. The market may be closed.</p>}
                {(historyError || staleHistory) && history && <p className="text-red" role="status">{staleHistory ? "History may be out of date." : "History refresh unavailable."} Showing the last available closes.</p>}
                <p><a className="underline underline-offset-2 hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                    href={GOLD_SOURCE_URL} target="_blank" rel="noopener noreferrer">Data by Standard Bullion</a></p>
            </div>
        </motion.div>
    );
}
