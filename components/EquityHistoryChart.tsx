"use client";

import { motion } from "framer-motion";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMarketDate, type MarketPoint, type TimeRange } from "@/lib/market-display";
import { EQUITY_SOURCE_URL } from "@/lib/equity-data";

interface EquityHistoryChartProps {
    points: MarketPoint[];
    latest: (MarketPoint & { observedAt: string }) | null;
    loading: boolean;
    error: boolean;
    stale: boolean;
    range: TimeRange;
    onRangeChange: (range: TimeRange) => void;
}

const price = (value: number) => value.toLocaleString("en-US", { style: "currency", currency: "USD" });
const observedTime = (value: string) => new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
    timeZoneName: "short",
});

export default function EquityHistoryChart({
    points, latest, loading, error, stale, range, onRangeChange,
}: EquityHistoryChartProps) {
    const latestPoint = points[points.length - 1];

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }} className="bg-white border border-border p-6 min-w-0">
            <h3 className="text-lg font-medium text-charcoal mb-2">S&amp;P 500 ETF</h3>
            <p className="text-slate text-sm mb-5">SPY · USD per share</p>
            <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="SPY history range">
                {(["30d", "90d", "1y", "ytd"] as TimeRange[]).map(option => (
                    <button key={option} type="button" onClick={() => onRangeChange(option)} aria-pressed={range === option}
                        className={`px-4 py-2 text-sm tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${range === option ? "bg-red text-white" : "bg-cream text-charcoal hover:bg-red hover:text-white"}`}>
                        {option === "ytd" ? "YTD" : option.toUpperCase()}
                    </button>
                ))}
            </div>
            {points.length ? <div role="img" aria-label={`SPY historical prices, ${formatMarketDate(points[0].date, true)} to ${formatMarketDate(latestPoint.date, true)}. Most recent price in this period ${price(latestPoint.value)} per share. Data delayed at least 48 hours.`}>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={points} margin={{ top: 8, right: 10, bottom: 0, left: 0 }} accessibilityLayer>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                        <XAxis dataKey="date" tickFormatter={value => formatMarketDate(value)} stroke="#6B7280"
                            style={{ fontSize: "12px", fontFamily: "inherit" }} tickLine={false} minTickGap={24} />
                        <YAxis stroke="#6B7280" style={{ fontSize: "12px", fontFamily: "inherit" }} tickLine={false} width={60}
                            tickFormatter={value => `$${Number(value).toLocaleString("en-US", { maximumFractionDigits: 0 })}`} domain={["auto", "auto"]} />
                        <Tooltip contentStyle={{ backgroundColor: "white", border: "1px solid #E5E7EB", borderRadius: "0", fontSize: "14px" }}
                            labelFormatter={value => formatMarketDate(String(value), true)}
                            formatter={(value: number | undefined) => [value === undefined ? "Unavailable" : price(value), "SPY"]} />
                        <Line type="monotone" dataKey="value" stroke="#2C3E50" strokeWidth={2} dot={points.length === 1} activeDot={{ r: 4 }} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div> : <div className="h-[250px] flex items-center justify-center bg-cream/40 px-5 text-center">
                <p className="text-slate text-sm leading-relaxed">{loading ? "Loading SPY history…" : latest ? "No prices in this period. Select a longer range." : "SPY history is temporarily unavailable."}</p>
            </div>}
            <div className="mt-4 pt-4 border-t border-border text-xs text-slate space-y-2">
                <div aria-live="polite" aria-atomic="true">
                    <p className="mb-1">Latest available price</p>
                    {latest ? <>
                        <p className="text-2xl font-medium text-charcoal">{price(latest.value)}</p>
                        <p className="mt-1">Price as of <time dateTime={latest.observedAt}>{observedTime(latest.observedAt)}</time></p>
                    </> : <p>{loading ? "Loading latest available price…" : "Latest price temporarily unavailable."}</p>}
                </div>
                <p>Includes extended hours · Delayed at least 48 hours.</p>
                {(error || stale) && (latest || points.length > 0) && <p className="text-red" role="status">
                    {stale ? "Price history may be older than the normal delay." : "Price refresh unavailable."} Showing the last available observations.
                </p>}
                <p><a className="underline underline-offset-2 hover:text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
                    href={EQUITY_SOURCE_URL} target="_blank" rel="noopener noreferrer">Data by GetMarketHistory</a></p>
            </div>
        </motion.div>
    );
}
