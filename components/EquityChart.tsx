"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const MARKETS = {
    equity: {
        title: "S&P 500 ETF", name: "SPDR S&P 500 ETF (SPY)", symbol: "AMEX:SPY",
        subtitle: "SPDR S&P 500 ETF (SPY) · USD per share",
        url: "https://www.tradingview.com/symbols/AMEX-SPY/", linkLabel: "SPY chart",
        description: "SPY is a fund that tracks the S&P 500. Its share price differs from the index level.",
        color: "#2C3E50", delay: 0.1,
    },
    gold: {
        title: "Gold", name: "Gold / U.S. dollar", symbol: "OANDA:XAUUSD",
        subtitle: "Gold / U.S. dollar · USD per troy ounce",
        url: "https://www.tradingview.com/symbols/XAUUSD/?exchange=OANDA", linkLabel: "Gold chart",
        description: "Gold prices are from OANDA. The chart’s quote and historical prices use the same instrument.",
        color: "#8B4513", delay: 0.2,
    },
};

export default function EquityChart({ market }: { market: keyof typeof MARKETS }) {
    const info = MARKETS[market];
    const containerRef = useRef<HTMLDivElement>(null);
    const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        let disposed = false;
        let loaded = false;
        const ready = () => {
            loaded = true;
            if (!disposed) setStatus("ready");
        };
        const observer = new MutationObserver(() => {
            const frame = container.querySelector("iframe");
            if (frame) {
                frame.title = `${info.name} price chart from TradingView`;
                frame.addEventListener("load", ready, { once: true });
                observer.disconnect();
            }
        });
        observer.observe(container, { childList: true, subtree: true });
        const widget = document.createElement("div");
        widget.className = "tradingview-widget-container__widget";
        widget.style.height = "100%";
        container.appendChild(widget);
        const script = document.createElement("script");
        script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
        script.type = "text/javascript";
        script.async = true;
        script.textContent = JSON.stringify({
            symbols: [[info.name, `${info.symbol}|1D`]],
            chartOnly: false, width: "100%", height: "100%", autosize: true,
            locale: "en", colorTheme: "light", isTransparent: false,
            showVolume: false, showMA: false, hideDateRanges: false,
            hideMarketStatus: false, hideSymbolLogo: false,
            scalePosition: "right", scaleMode: "Normal",
            fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
            fontSize: "12", noTimeScale: false,
            valuesTracking: "1", changeMode: "price-and-percent", chartType: "line",
            lineColor: info.color, lineWidth: 2,
            dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
        });
        script.onerror = () => { if (!disposed) setStatus("failed"); };
        container.appendChild(script);
        // Keep a source link visible even if a blocker prevents the third-party chart.
        const timeout = window.setTimeout(() => {
            if (!disposed && !loaded) setStatus("failed");
        }, 15_000);
        return () => {
            disposed = true;
            window.clearTimeout(timeout);
            observer.disconnect();
            container.querySelector("iframe")?.removeEventListener("load", ready);
            script.onerror = null;
            container.replaceChildren();
        };
    }, [info]);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: info.delay }} className="bg-white border border-border p-6 min-w-0">
            <h3 className="text-lg font-medium text-charcoal mb-2">{info.title}</h3>
            <p className="text-slate text-sm mb-2">{info.subtitle}</p>
            <p className="text-slate text-xs mb-5">Prices may be delayed · see the chart for quote time and market status.</p>
            {status === "loading" && <p role="status" className="text-slate text-xs mb-3">Loading market chart…</p>}
            {status === "failed" && <p role="status" className="text-slate text-sm bg-cream px-4 py-3 mb-4">The embedded chart could not load. Open the source below for the latest available prices.</p>}
            <div className="h-[350px] w-full min-w-0">
                <div className="tradingview-widget-container h-full w-full min-w-0" ref={containerRef} aria-label={`${info.name} price chart from TradingView`} />
            </div>
            <div className="tradingview-widget-copyright text-xs text-slate mt-3">
                <a href={info.url} target="_blank" rel="noopener nofollow" className="underline underline-offset-2 hover:text-charcoal"><span className="blue-text">{info.linkLabel}</span></a><span className="trademark"> by TradingView</span>
            </div>
            <p className="text-slate text-xs leading-relaxed border-t border-border pt-4 mt-4">{info.description}</p>
        </motion.div>
    );
}
