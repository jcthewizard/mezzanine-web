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

interface RateData {
    date: string;
    value: number;
}

interface RatesData {
    sofr: RateData[];
    obfr: RateData[];
    effr: RateData[];
    libor: RateData[];
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
    libor: {
        name: "LIBOR",
        fullName: "3-Month USD LIBOR (2020-2023)",
        color: "#6B7280",
    },
};

export default function RatesCharts() {
    const [ratesData, setRatesData] = useState<RatesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedRange, setSelectedRange] = useState<TimeRange>("30d");

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
            // LIBOR static historical data (FRED removed the series in 2022)
            // This represents 3-Month USD LIBOR from July 2020 to June 2023
            const liborStaticData: RateData[] = [
                { date: "2020-07-01", value: 0.30 },
                { date: "2020-10-01", value: 0.24 },
                { date: "2021-01-01", value: 0.22 },
                { date: "2021-04-01", value: 0.18 },
                { date: "2021-07-01", value: 0.13 },
                { date: "2021-10-01", value: 0.14 },
                { date: "2022-01-01", value: 0.47 },
                { date: "2022-04-01", value: 1.41 },
                { date: "2022-07-01", value: 2.99 },
                { date: "2022-10-01", value: 4.54 },
                { date: "2023-01-01", value: 4.99 },
                { date: "2023-04-01", value: 5.21 },
                { date: "2023-06-30", value: 5.33 },
            ];

            const [sofr, obfr, effr] = await Promise.all([
                fetchSeriesData("SOFR", startDate, apiKey),
                fetchSeriesData("OBFR", startDate, apiKey),
                fetchSeriesData("DFF", startDate, apiKey),
            ]);

            setRatesData({ sofr, obfr, effr, libor: liborStaticData });
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

        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(fredUrl)}`;

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
        const isLibor = rateKey === "libor";

        return (
            <motion.div
                key={rateKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`bg-white border p-6 ${isLibor ? "border-slate/30 bg-slate/5" : "border-border"
                    }`}
            >
                {/* Chart Header */}
                <div className="mb-6">
                    <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className={`text-lg font-medium ${isLibor ? "text-slate" : "text-charcoal"}`}>
                            {rateInfo.name}
                        </h3>
                        {isLibor && (
                            <span className="px-2 py-1 bg-slate/20 text-slate text-xs font-medium tracking-wider">
                                DISCONTINUED
                            </span>
                        )}
                    </div>
                    <p className="text-slate text-sm">{rateInfo.fullName}</p>
                    {isLibor && (
                        <p className="text-slate/80 text-xs mt-2 italic">
                            Historical data only • Discontinued June 30, 2023
                        </p>
                    )}
                </div>

                {/* Chart */}
                {loading ? (
                    <div className="h-64 flex items-center justify-center">
                        <p className="text-slate text-sm">Loading data...</p>
                    </div>
                ) : error || data.length === 0 ? (
                    <div className="h-64 flex items-center justify-center">
                        <p className="text-slate text-sm">
                            {data.length === 0 && isLibor
                                ? "No data available (LIBOR discontinued)"
                                : "Unable to load data"}
                        </p>
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
                                strokeDasharray={isLibor ? "5 5" : undefined}
                                opacity={isLibor ? 0.6 : 1}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}

                {/* Current Value */}
                {!loading && !error && data.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                        <p className="text-slate text-xs mb-1">
                            {isLibor ? "Final Rate" : "Latest Rate"}
                        </p>
                        <p className={`text-2xl font-medium ${isLibor ? "text-slate" : "text-charcoal"}`}>
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
                    {renderChart("libor", 3)}
                </div>

                {/* Data Source Attribution */}
                <p className="text-slate text-xs mt-8 text-center">
                    Data source: Federal Reserve Economic Data (FRED)
                </p>
            </div>
        </section>
    );
}
