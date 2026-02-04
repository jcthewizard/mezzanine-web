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

interface RatesData {
    sofr: RateData[];
    obfr: RateData[];
    effr: RateData[];
}

type TimeRange = "30d" | "90d" | "1y" | "ytd";

const RATE_INFO = {
    sofr: {
        name: "SOFR",
        fullName: "Secured Overnight Financing Rate",
        color: "#C41E3A",
    },
    obfr: {
        name: "OBFR",
        fullName: "Overnight Bank Funding Rate",
        color: "#2C3E50",
    },
    effr: {
        name: "EFFR",
        fullName: "Effective Federal Funds Rate",
        color: "#8B4513",
    },
};

export default function RatesCharts() {
    const [ratesData, setRatesData] = useState<RatesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedRange, setSelectedRange] = useState<TimeRange>("90d");

    useEffect(() => {
        fetchRates(selectedRange);
    }, [selectedRange]);

    const fetchRates = async (range: TimeRange) => {
        setLoading(true);
        setError(false);

        const startDate = getStartDate(range);
        const apiKey = process.env.NEXT_PUBLIC_FRED_API_KEY;

        if (!apiKey) {
            console.error("FRED API key not found");
            setError(true);
            setLoading(false);
            return;
        }

        try {
            const [sofr, obfr, effr] = await Promise.all([
                fetchSeriesData("SOFR", startDate, apiKey),
                fetchSeriesData("OBFR", startDate, apiKey),
                fetchSeriesData("DFF", startDate, apiKey),
            ]);

            setRatesData({ sofr, obfr, effr });
        } catch (err) {
            console.error("Error fetching rates:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const getStartDate = (range: TimeRange): string => {
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
    };

    const fetchSeriesData = async (
        seriesId: string,
        startDate: string,
        apiKey: string,
        endDate?: string
    ): Promise<RateData[]> => {
        let fredUrl = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&api_key=${apiKey}&file_type=json&observation_start=${startDate}`;

        // Add end date if provided (for LIBOR historical data)
        if (endDate) {
            fredUrl += `&observation_end=${endDate}`;
        }

        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(fredUrl)}`;

        try {
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                console.error(`Failed to fetch ${seriesId}:`, response.statusText);
                return [];
            }

            const data = await response.json();

            return data.observations
                .filter((obs: { value: string }) => obs.value !== ".")
                .map((obs: { date: string; value: string }) => ({
                    date: obs.date,
                    value: parseFloat(obs.value),
                }));
        } catch (error) {
            console.error(`Error fetching ${seriesId}:`, error);
            return [];
        }
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
        rateKey: keyof RatesData,
        index: number
    ) => {
        const rateInfo = RATE_INFO[rateKey];
        const data = ratesData?.[rateKey] || [];

        return (
            <motion.div
                key={rateKey}
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
                            {rateInfo.name}
                        </h3>
                    </div>
                    <p className="text-slate text-sm">{rateInfo.fullName}</p>
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
                                tickFormatter={(value) => `${value.toFixed(2)}%`}
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
                                    value !== undefined ? `${value.toFixed(3)}%` : "N/A",
                                    rateInfo.name,
                                ]}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke={rateInfo.color}
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
                        <p className="text-slate text-xs mb-1">Latest Rate</p>
                        <p className="text-2xl font-medium text-charcoal">
                            {data[data.length - 1].value.toFixed(3)}%
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
        if (!ratesData || loading) {
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

        // Calculate trends and spreads
        const calculateTrend = (data: RateData[]) => {
            if (data.length < 2) return { change: 0, direction: "neutral" as "up" | "down" | "neutral" };
            const first = data[0].value;
            const last = data[data.length - 1].value;
            const change = ((last - first) / first) * 100;
            const direction: "up" | "down" | "neutral" = change > 0.01 ? "up" : change < -0.01 ? "down" : "neutral";
            return { change, direction };
        };

        const sofrTrend = calculateTrend(ratesData.sofr);
        const obfrTrend = calculateTrend(ratesData.obfr);
        const effrTrend = calculateTrend(ratesData.effr);

        const sofrCurrent = ratesData.sofr[ratesData.sofr.length - 1]?.value || 0;
        const obfrCurrent = ratesData.obfr[ratesData.obfr.length - 1]?.value || 0;
        const effrCurrent = ratesData.effr[ratesData.effr.length - 1]?.value || 0;

        const sofrEffrSpread = sofrCurrent - effrCurrent;
        const obfrEffrSpread = obfrCurrent - effrCurrent;

        // Determine key insight
        const rates = [
            { name: "SOFR", value: sofrCurrent },
            { name: "OBFR", value: obfrCurrent },
            { name: "EFFR", value: effrCurrent },
        ];
        const leadingRate = rates.reduce((max, rate) =>
            rate.value > max.value ? rate : max
        );
        const maxSpread = Math.max(Math.abs(sofrEffrSpread), Math.abs(obfrEffrSpread));

        const TrendIcon = ({ direction }: { direction: "up" | "down" | "neutral" }) => {
            if (direction === "up") return <TrendingUp size={14} className="text-red" />;
            if (direction === "down") return <TrendingDown size={14} className="text-green-600" />;
            return <Minus size={14} className="text-slate" />;
        };

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
                        Rate Comparison Summary
                    </h3>
                    <p className="text-slate text-sm">
                        Current rates and trends over selected period
                    </p>
                </div>

                {/* Current Rates with Trends */}
                <div className="space-y-4 mb-6">
                    {/* SOFR */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-charcoal">SOFR</span>
                            <div className="flex items-center gap-2">
                                <TrendIcon direction={sofrTrend.direction} />
                                <span className="text-sm text-slate">
                                    {sofrTrend.change > 0 ? "+" : ""}{sofrTrend.change.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div
                                className="h-2 bg-red/20 relative overflow-hidden flex-1"
                            >
                                <div
                                    className="h-full bg-red transition-all duration-500"
                                    style={{ width: `${(sofrCurrent / Math.max(sofrCurrent, obfrCurrent, effrCurrent)) * 100}%` }}
                                />
                            </div>
                            <span className="text-lg font-medium text-charcoal min-w-[4rem] text-right">
                                {sofrCurrent.toFixed(3)}%
                            </span>
                        </div>
                    </div>

                    {/* OBFR */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-charcoal">OBFR</span>
                            <div className="flex items-center gap-2">
                                <TrendIcon direction={obfrTrend.direction} />
                                <span className="text-sm text-slate">
                                    {obfrTrend.change > 0 ? "+" : ""}{obfrTrend.change.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div
                                className="h-2 bg-charcoal/20 relative overflow-hidden flex-1"
                            >
                                <div
                                    className="h-full bg-charcoal transition-all duration-500"
                                    style={{ width: `${(obfrCurrent / Math.max(sofrCurrent, obfrCurrent, effrCurrent)) * 100}%` }}
                                />
                            </div>
                            <span className="text-lg font-medium text-charcoal min-w-[4rem] text-right">
                                {obfrCurrent.toFixed(3)}%
                            </span>
                        </div>
                    </div>

                    {/* EFFR */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-charcoal">EFFR</span>
                            <div className="flex items-center gap-2">
                                <TrendIcon direction={effrTrend.direction} />
                                <span className="text-sm text-slate">
                                    {effrTrend.change > 0 ? "+" : ""}{effrTrend.change.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div
                                className="h-2 relative overflow-hidden flex-1"
                                style={{ backgroundColor: "rgba(139, 69, 19, 0.2)" }}
                            >
                                <div
                                    className="h-full transition-all duration-500"
                                    style={{
                                        backgroundColor: "#8B4513",
                                        width: `${(effrCurrent / Math.max(sofrCurrent, obfrCurrent, effrCurrent)) * 100}%`
                                    }}
                                />
                            </div>
                            <span className="text-lg font-medium text-charcoal min-w-[4rem] text-right">
                                {effrCurrent.toFixed(3)}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Key Insight */}
                <div className="pt-4 border-t border-border">
                    <p className="text-xs text-slate mb-2">Key Insight</p>
                    <p className="text-sm text-charcoal leading-relaxed">
                        {leadingRate.name} is currently the highest at {leadingRate.value.toFixed(3)}%.
                        {Math.abs(sofrTrend.change) > 5 || Math.abs(obfrTrend.change) > 5 || Math.abs(effrTrend.change) > 5
                            ? " Significant rate movement detected over this period."
                            : " Rates are relatively stable over the selected period."}
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
                            Interest Rate Benchmarks
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
                    {renderChart("obfr", 1)}
                    {renderChart("effr", 2)}
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
