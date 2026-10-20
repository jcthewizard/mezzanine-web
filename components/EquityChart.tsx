"use client";

import { useEffect, useState } from "react";
import EquityHistoryChart from "@/components/EquityHistoryChart";
import { getRangeStart, type TimeRange } from "@/lib/market-display";
import {
    getEquityHistoryUrl, isEquityHistoryStale, latestEquityHistory, parseEquityHistory, type EquityHistory,
} from "@/lib/equity-data";

const HISTORY_INTERVAL = 60 * 60_000;

export default function EquityChart() {
    const [history, setHistory] = useState<EquityHistory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [range, setRange] = useState<TimeRange>("90d");
    const [now, setNow] = useState<Date | null>(null);

    useEffect(() => {
        let disposed = false;
        let pending = false;
        let lastAttempt = 0;
        let refreshFailed = false;
        let lastHistory: EquityHistory | null = null;
        let controller: AbortController | null = null;

        async function refreshHistory() {
            if (pending || disposed) return;
            pending = true;
            lastAttempt = Date.now();
            controller = new AbortController();
            const timeout = window.setTimeout(() => controller?.abort(), 12_000);
            try {
                const response = await fetch(getEquityHistoryUrl(), {
                    signal: controller.signal,
                    credentials: "omit",
                });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const incoming = parseEquityHistory(await response.json());
                if (!incoming || (lastHistory && incoming.points[incoming.points.length - 1].observedAt
                    < lastHistory.points[lastHistory.points.length - 1].observedAt)) {
                    throw new Error("Invalid or older SPY history");
                }
                lastHistory = latestEquityHistory(lastHistory, incoming);
                refreshFailed = false;
                if (!disposed) {
                    setHistory(lastHistory);
                    setError(false);
                }
            } catch {
                refreshFailed = true;
                if (!disposed) setError(true);
            } finally {
                window.clearTimeout(timeout);
                controller = null;
                pending = false;
                if (!disposed) setLoading(false);
            }
        }

        function refreshVisible() {
            if (document.visibilityState === "hidden") return;
            setNow(new Date());
            if (Date.now() - lastAttempt >= (refreshFailed ? 60_000 : HISTORY_INTERVAL)) void refreshHistory();
        }

        refreshVisible();
        const interval = window.setInterval(refreshVisible, 60_000);
        document.addEventListener("visibilitychange", refreshVisible);
        window.addEventListener("focus", refreshVisible);
        return () => {
            disposed = true;
            window.clearInterval(interval);
            document.removeEventListener("visibilitychange", refreshVisible);
            window.removeEventListener("focus", refreshVisible);
            controller?.abort();
        };
    }, []);

    const points = now ? (history?.points ?? []).filter(point => point.date >= getRangeStart(range, now)) : [];
    const latest = history?.points[history.points.length - 1] ?? null;

    return <EquityHistoryChart points={points} latest={latest} loading={loading} error={error}
        stale={Boolean(history && now && isEquityHistoryStale(history, now))}
        range={range} onRangeChange={setRange} />;
}
