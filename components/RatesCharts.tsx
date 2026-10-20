"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import EquityChart from "@/components/EquityChart";
import GoldChart from "@/components/GoldChart";
import {
    SOFR_SOURCE_URL, formatMarketDate, getRangeStart, isSofrStale,
    latestSofrSeries, parseSofrBackup, parseSofrHistory, type MarketSeries, type TimeRange,
} from "@/lib/market-display";

const HISTORY_INTERVAL = 15 * 60_000;

export default function RatesCharts() {
    const [sofr, setSofr] = useState<MarketSeries | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshError, setRefreshError] = useState(false);
    const [selectedRange, setSelectedRange] = useState<TimeRange>("90d");
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        let disposed = false;
        let pending = false;
        let lastAttempt = 0;
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

        function acceptSeries(incoming: MarketSeries) {
            if (!disposed) setSofr(previous => latestSofrSeries(previous, incoming));
        }

        async function refreshHistory() {
            if (pending || disposed) return;
            pending = true;
            lastAttempt = Date.now();
            try {
                const endDate = new Date().toISOString().slice(0, 10);
                const startDate = getRangeStart("1y");
                const incoming = parseSofrHistory(await fetchJson(
                    `https://markets.newyorkfed.org/api/rates/secured/sofr/search.json?startDate=${startDate}&endDate=${endDate}`,
                ));
                if (!incoming) throw new Error("No SOFR observations returned");
                acceptSeries(incoming);
                if (!disposed) setRefreshError(false);
            } catch {
                if (!disposed) setRefreshError(true);
            } finally {
                pending = false;
                if (!disposed) setLoading(false);
            }
        }

        async function loadBackup() {
            try {
                const incoming = parseSofrBackup(await fetchJson("/data/markets.json"));
                if (incoming) acceptSeries(incoming);
            } catch {
                // The direct NY Fed feed remains useful if the static backup is unavailable.
            }
        }

        function refreshVisible() {
            if (document.visibilityState === "hidden") return;
            setNow(new Date());
            if (Date.now() - lastAttempt >= HISTORY_INTERVAL) void refreshHistory();
        }

        void loadBackup();
        refreshVisible();
        const interval = window.setInterval(refreshVisible, 60_000);
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

    const latest = sofr?.points[sofr.points.length - 1];
    const data = now ? (sofr?.points ?? []).filter(point => point.date >= getRangeStart(selectedRange, now)) : [];
    const stale = Boolean(latest && now && isSofrStale(latest.date, now));

    return (
        <section className="py-24 lg:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                <div className="mb-12">
                    <p className="text-red text-sm tracking-[0.2em] uppercase mb-4">Market Data</p>
                    <h2 className="font-serif text-3xl md:text-4xl text-charcoal leading-tight">Market Indicators</h2>
                    <p className="text-slate text-sm mt-4">Current market charts and the latest published overnight financing rate.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="bg-white border border-border p-6 min-w-0">
                        <h3 className="text-lg font-medium text-charcoal mb-2">SOFR</h3>
                        <p className="text-slate text-sm mb-5">Secured Overnight Financing Rate</p>
                        <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="SOFR history range">
                            {(["30d", "90d", "1y", "ytd"] as TimeRange[]).map(range => (
                                <button key={range} type="button" onClick={() => setSelectedRange(range)} aria-pressed={selectedRange === range}
                                    className={`px-4 py-2 text-sm tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${selectedRange === range ? "bg-red text-white" : "bg-cream text-charcoal hover:bg-red hover:text-white"}`}>
                                    {range === "ytd" ? "YTD" : range.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        {data.length ? <div role="img" aria-label={`SOFR history, ${formatMarketDate(data[0].date, true)} to ${formatMarketDate(data[data.length - 1].date, true)}. Most recent rate ${data[data.length - 1].value.toFixed(3)} percent.`}>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: 0 }} accessibilityLayer>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                    <XAxis dataKey="date" tickFormatter={value => formatMarketDate(value)} stroke="#6B7280" style={{ fontSize: "12px", fontFamily: "inherit" }} tickLine={false} minTickGap={24} />
                                    <YAxis stroke="#6B7280" style={{ fontSize: "12px", fontFamily: "inherit" }} tickLine={false} width={60} tickFormatter={value => `${value.toFixed(2)}%`} domain={["auto", "auto"]} />
                                    <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "0", fontSize: "14px" }}
                                        labelFormatter={value => formatMarketDate(String(value), true)}
                                        formatter={(value: number | undefined) => [value === undefined ? "Unavailable" : `${value.toFixed(3)}%`, "SOFR"]} />
                                    <Line type="monotone" dataKey="value" stroke="#C41E3A" strokeWidth={2} dot={data.length === 1} activeDot={{ r: 4 }} isAnimationActive={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div> : <div className="h-[250px] flex items-center justify-center bg-cream/40 px-5 text-center">
                            <p className="text-slate text-sm leading-relaxed">{loading ? "Loading history…" : sofr ? "No observations in this period. Select a longer range." : "Rate history is temporarily unavailable. Open the source below for published rates."}</p>
                        </div>}
                        <div className="mt-4 pt-4 border-t border-border text-xs text-slate space-y-2">
                            <div aria-live="polite" aria-atomic="true">
                                <p className="mb-1">Latest published rate</p>
                                {latest ? <>
                                    <p className="text-2xl font-medium text-charcoal">{latest.value.toFixed(3)}%</p>
                                    <p className="mt-1">Effective {formatMarketDate(latest.date, true)}</p>
                                </> : <p>{loading ? "Loading published rate…" : "Published rate temporarily unavailable."}</p>}
                            </div>
                            {(refreshError || stale) && latest && <p className="text-red" role="status">{stale ? "Rate data may be out of date." : "Rate refresh unavailable."} Showing the last available observations.</p>}
                            <p>Source: <a className="underline underline-offset-2 hover:text-charcoal" href={SOFR_SOURCE_URL} target="_blank" rel="noopener noreferrer">Federal Reserve Bank of New York</a></p>
                        </div>
                    </motion.div>
                    <EquityChart />
                    <GoldChart />
                    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3 }} className="bg-gradient-to-br from-cream to-white border border-border p-6">
                        <h3 className="text-lg font-medium text-charcoal mb-5">About these indicators</h3>
                        <dl className="space-y-5 text-sm">
                            <div><dt className="font-medium text-charcoal mb-1">Gold</dt><dd className="text-slate leading-relaxed">Standard Bullion’s latest dealer ask and daily price history, in USD per troy ounce. Earlier history includes published benchmark prices.</dd></div>
                            <div><dt className="font-medium text-charcoal mb-1">SOFR</dt><dd className="text-slate leading-relaxed">The New York Fed’s overnight financing rate, published the next business day. Dates show when the rate applies.</dd></div>
                            <div><dt className="font-medium text-charcoal mb-1">S&amp;P 500 exposure</dt><dd className="text-slate leading-relaxed">SPY tracks the S&amp;P 500; its share price differs from the index level. The chart shows each day’s last available hourly price, including extended hours, delayed at least 48 hours.</dd></div>
                        </dl>
                        <p className="mt-5 pt-4 border-t border-border text-xs text-slate leading-relaxed">Prices refresh automatically. Each source follows its own publication schedule and market hours.</p>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
