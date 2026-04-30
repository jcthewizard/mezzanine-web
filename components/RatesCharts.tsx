"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface RateData {
    date: string;
    value: number;
}

interface MarketsData {
    sofr: RateData[];
    sp500: RateData[];
    gold: RateData[];
}

type TimeRange = "30d" | "90d" | "1y" | "ytd";

type MarketUnit = "rate" | "index" | "price";

const MARKET_INFO = {
    sofr: {
        name: "SOFR",
        fullName: "Secured Overnight Financing Rate",
        color: "#C41E3A",
        unit: "rate" as MarketUnit,
    },
    sp500: {
        name: "S&P 500",
        fullName: "S&P 500 Index",
        color: "#2C3E50",
        unit: "index" as MarketUnit,
    },
    gold: {
        name: "Gold",
        fullName: "NASDAQ Gold Index",
        color: "#8B4513",
        unit: "price" as MarketUnit,
    },
};

const formatValue = (value: number, unit: MarketUnit, compact = false): string => {
    switch (unit) {
        case "rate":
            return compact ? `${value.toFixed(2)}%` : `${value.toFixed(3)}%`;
        case "index":
            return compact
                ? value.toLocaleString("en-US", { maximumFractionDigits: 0 })
                : value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        case "price":
            return compact
                ? `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                : `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        default:
            return value.toString();
    }
};

export default function RatesCharts() {
    const [fullData, setFullData] = useState<MarketsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedRange, setSelectedRange] = useState<TimeRange>("90d");

    // Fetch 1 year of data once on mount — all time ranges are derived client-side
    useEffect(() => {
        const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

        const fetchAllData = async (attempt = 1): Promise<void> => {
            setLoading(true);
            setError(false);

            const apiKey = process.env.NEXT_PUBLIC_FRED_API_KEY;
            if (!apiKey) {
                console.error("FRED API key not found");
                setError(true);
                setLoading(false);
                return;
            }

            const today = new Date();
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(today.getFullYear() - 1);
            const startDate = oneYearAgo.toISOString().split("T")[0];

            try {
                const [sofr, sp500, gold] = await Promise.all([
                    fetchSeriesData("SOFR", startDate, apiKey),
                    fetchSeriesData("SP500", startDate, apiKey),
                    fetchSeriesData("NASDAQQGLDI", startDate, apiKey),
                ]);

                // If any series returned empty, retry
                const hasData = sofr.length > 0 && sp500.length > 0 && gold.length > 0;
                if (!hasData && attempt < 3) {
                    console.warn(`Some data missing on attempt ${attempt}, retrying in 2s...`);
                    await delay(2000);
                    return fetchAllData(attempt + 1);
                }

                setFullData({ sofr, sp500, gold });
            } catch (err) {
                console.error(`Error fetching market data (attempt ${attempt}):`, err);
                if (attempt < 3) {
                    await delay(2000);
                    return fetchAllData(attempt + 1);
                }
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    // Filter full dataset to the selected time range (instant, no network call)
    const marketsData: MarketsData | null = (() => {
        if (!fullData) return null;

        const cutoffDate = getStartDate(selectedRange);

        return {
            sofr: fullData.sofr.filter((d) => d.date >= cutoffDate),
            sp500: fullData.sp500.filter((d) => d.date >= cutoffDate),
            gold: fullData.gold.filter((d) => d.date >= cutoffDate),
        };
    })();

    function getStartDate(range: TimeRange): string {
        const today = new Date();
        let startDate = new Date();

        switch (range) {
            case "30d":
                startDate.setDate(today.getDate() - 30);
                break;
            case "90d":
                startDate.setDate(today.getDate() - 90);
                break;
            case "1y":
                startDate.setFullYear(today.getFullYear() - 1);
                break;
            case "ytd":
                startDate = new Date(today.getFullYear(), 0, 1);
                break;
            default:
                startDate.setDate(today.getDate() - 30);
        }

        return startDate.toISOString().split("T")[0];
    }

    const fetchSeriesData = async (
        seriesId: string,
        startDate: string,
        apiKey: string,
        endDate?: string
    ): Promise<RateData[]> => {
        let fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&observation_start=${startDate}`;

        if (endDate) {
            fredUrl += `&observation_end=${endDate}`;
        }

        // Cache-buster to prevent CORS proxies from serving stale data
        const cacheBuster = Date.now();

        // Try multiple CORS proxy strategies with cache-busting
        const proxyStrategies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(fredUrl)}&_t=${cacheBuster}`,
            `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(fredUrl)}&_t=${cacheBuster}`,
        ];

        for (const proxyUrl of proxyStrategies) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const response = await fetch(proxyUrl, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    console.warn(`Proxy failed for ${seriesId} with ${proxyUrl.split('?')[0]}:`, response.status);
                    continue;
                }

                const data = await response.json();

                if (data.observations) {
                    return data.observations
                        .filter((obs: { value: string }) => obs.value !== ".")
                        .map((obs: { date: string; value: string }) => ({
                            date: obs.date,
                            value: parseFloat(obs.value),
                        }));
                }
            } catch (error) {
                console.warn(`Proxy attempt failed for ${seriesId}:`, error);
                continue;
            }
        }

        console.error(`All proxy strategies failed for ${seriesId}`);
        return [];
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    const formatTooltipDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const renderChart = (
        marketKey: keyof MarketsData,
        index: number
    ) => {
        const info = MARKET_INFO[marketKey];
        const data = marketsData?.[marketKey] || [];

        return (
            <motion.div
                key={marketKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white border border-border p-6"
            >
                {/* Chart Header */}
                <div className="mb-6">
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-lg font-medium text-charcoal">
                            {info.name}
                        </h3>
                    </div>
                    <p className="text-slate text-sm">{info.fullName}</p>
                </div>

                {/* Chart */}
                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <p className="text-slate text-sm">Loading data...</p>
                    </div>
                ) : error || data.length === 0 ? (
                    <div className="h-64 flex items-center justify-center">
                        <p className="text-slate text-sm">Unable to load data</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={data}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#E5E7EB"
                                vertical={false}
                            />
                            <XAxis
                                dataKey="date"
                                tickFormatter={formatDate}
                                stroke="#6B7280"
                                style={{
                                    fontSize: "12px",
                                    fontFamily: "inherit",
                                }}
                                tickLine={false}
                            />
                            <YAxis
                                stroke="#6B7280"
                                style={{
                                    fontSize: "12px",
                                    fontFamily: "inherit",
                                }}
                                tickLine={false}
                                tickFormatter={(value) => formatValue(value, info.unit, true)}
                                domain={["auto", "auto"]}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "white",
                                    border: "1px solid #E5E7EB",
                                    borderRadius: "0",
                                    fontSize: "14px",
                                }}
                                labelFormatter={formatTooltipDate}
                                formatter={(value: number | undefined) => [
                                    value !== undefined ? formatValue(value, info.unit) : "N/A",
                                    info.name,
                                ]}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={info.color}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}

                {/* Current Value */}
                {!loading && !error && data.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-slate text-xs mb-1">Latest Value</p>
                        <p className="text-2xl font-medium text-charcoal">
                            {formatValue(data[data.length - 1].value, info.unit)}
                        </p>
                        <p className="text-slate text-xs mt-1">
                            as of {formatTooltipDate(data[data.length - 1].date)}
                        </p>
                    </div>
                )}
            </motion.div>
        );
    };

    const renderSummaryCard = () => {
        if (!marketsData || loading) {
            return (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="bg-gradient-to-br from-cream to-white border border-border p-6"
                >
                    <div className="h-full flex items-center justify-center">
                        <p className="text-slate text-sm">Loading comparison data...</p>
                    </div>
                </motion.div>
            );
        }

        const calculateTrend = (data: RateData[]) => {
            if (data.length < 2) return { change: 0, direction: "neutral" as "up" | "down" | "neutral" };
            const first = data[0].value;
            const last = data[data.length - 1].value;
            const change = ((last - first) / first) * 100;
            const direction: "up" | "down" | "neutral" = change > 0.01 ? "up" : change < -0.01 ? "down" : "neutral";
            return { change, direction };
        };

        const sofrTrend = calculateTrend(marketsData.sofr);
        const sp500Trend = calculateTrend(marketsData.sp500);
        const goldTrend = calculateTrend(marketsData.gold);

        const sofrCurrent = marketsData.sofr[marketsData.sofr.length - 1]?.value || 0;
        const sp500Current = marketsData.sp500[marketsData.sp500.length - 1]?.value || 0;
        const goldCurrent = marketsData.gold[marketsData.gold.length - 1]?.value || 0;

        const TrendIcon = ({ direction }: { direction: "up" | "down" | "neutral" }) => {
            if (direction === "up") return <TrendingUp size={14} className="text-green-600" />;
            if (direction === "down") return <TrendingDown size={14} className="text-red" />;
            return <Minus size={14} className="text-slate" />;
        };

        const summaryItems = [
            {
                name: "SOFR",
                current: formatValue(sofrCurrent, "rate"),
                trend: sofrTrend,
                color: MARKET_INFO.sofr.color,
                colorClass: "bg-red",
                bgClass: "bg-red/20",
            },
            {
                name: "S&P 500",
                current: formatValue(sp500Current, "index"),
                trend: sp500Trend,
                color: MARKET_INFO.sp500.color,
                colorClass: "bg-charcoal",
                bgClass: "bg-charcoal/20",
            },
            {
                name: "Gold",
                current: formatValue(goldCurrent, "price"),
                trend: goldTrend,
                color: MARKET_INFO.gold.color,
                colorClass: "",
                bgClass: "",
            },
        ];

        // Determine key insight
        const biggestMover = [
            { name: "SOFR", change: Math.abs(sofrTrend.change) },
            { name: "S&P 500", change: Math.abs(sp500Trend.change) },
            { name: "Gold", change: Math.abs(goldTrend.change) },
        ].reduce((max, item) => (item.change > max.change ? item : max));

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-gradient-to-br from-cream to-white border border-border p-6"
            >
                {/* Header */}
                <div className="mb-6">
                    <h3 className="text-lg font-medium text-charcoal mb-2">
                        Market Snapshot
                    </h3>
                    <p className="text-slate text-sm">
                        Current levels and trends over selected period
                    </p>
                </div>

                {/* Market Items */}
                <div className="space-y-4 mb-6">
                    {summaryItems.map((item) => (
                        <div key={item.name}>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-charcoal">{item.name}</span>
                                <div className="flex items-center gap-2">
                                    <TrendIcon direction={item.trend.direction} />
                                    <span className="text-sm text-slate">
                                        {item.trend.change > 0 ? "+" : ""}{item.trend.change.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div
                                    className="h-2 relative overflow-hidden flex-1"
                                    style={{ backgroundColor: `${item.color}33` }}
                                >
                                    <div
                                        className="h-full transition-all duration-500"
                                        style={{
                                            backgroundColor: item.color,
                                            width: `${Math.min(100, Math.max(20, 50 + item.trend.change * 2))}%`,
                                        }}
                                    />
                                </div>
                                <span className="text-lg font-medium text-charcoal min-w-[5.5rem] text-right">
                                    {item.current}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Key Insight */}
                <div className="pt-4 border-t border-border">
                    <p className="text-xs text-slate mb-2">Key Insight</p>
                    <p className="text-sm text-charcoal leading-relaxed">
                        {biggestMover.name} is the biggest mover over this period
                        ({biggestMover.change > 0 ? "+" : ""}{biggestMover.change.toFixed(1)}%).
                        {biggestMover.change > 5
                            ? " Significant market movement detected."
                            : " Markets are relatively stable over the selected period."}
                    </p>
                </div>
            </motion.div>
        );
    };

    return (
        <section className="py-24 lg:py-32 bg-white">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                {/* Section Header */}
                <div className="mb-12">
                    <p className="text-red text-sm tracking-[0.2em] uppercase mb-4">
                        Market Data
                    </p>
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <h2 className="font-serif text-3xl md:text-4xl text-charcoal leading-tight">
                            Market Indicators
                        </h2>

                        {/* Time Range Selector */}
                        <div className="flex gap-2">
                            {(["30d", "90d", "1y", "ytd"] as TimeRange[]).map(
                                (range) => (
                                    <button
                                        key={range}
                                        onClick={() => setSelectedRange(range)}
                                        className={`px-4 py-2 text-sm tracking-wide transition-colors ${selectedRange === range
                                            ? "bg-red text-white"
                                            : "bg-cream text-charcoal hover:bg-red hover:text-white"
                                            }`}
                                    >
                                        {range === "ytd" ? "YTD" : range.toUpperCase()}
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>

                {/* Charts Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {renderChart("sofr", 0)}
                    {renderChart("sp500", 1)}
                    {renderChart("gold", 2)}
                    {renderSummaryCard()}
                </div>

                {/* Data Source Attribution */}
                <p className="text-slate text-xs mt-8 text-center">
                    Data source: Federal Reserve Economic Data (FRED)
                </p>
            </div>
        </section>
    );
}
