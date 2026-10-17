"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

const CHART_TITLE = "SPDR S&P 500 ETF (SPY) price chart from TradingView";
const SOURCE_URL = "https://www.tradingview.com/symbols/AMEX-SPY/";

export default function EquityChart() {
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
                frame.title = CHART_TITLE;
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
            symbols: [["SPY", "AMEX:SPY|3M"]],
            chartOnly: false, width: "100%", height: "100%", autosize: true,
            locale: "en", colorTheme: "light", isTransparent: true,
            showVolume: false, showMA: false, hideDateRanges: false,
            hideMarketStatus: false, hideSymbolLogo: true, headerFontSize: "small",
            scalePosition: "right", scaleMode: "Normal",
            fontFamily: "Arial, sans-serif", fontSize: "10", noTimeScale: false,
            fontColor: "#5A5A5A", gridLineColor: "rgba(90,90,90,0.08)",
            valuesTracking: "1", changeMode: "price-and-percent", chartType: "area",
            lineColor: "#2C3E50", lineWidth: 2, lineType: 0,
            topColor: "rgba(44,62,80,0.04)", bottomColor: "rgba(44,62,80,0)",
            dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D"],
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
    }, []);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.1 }} className="bg-white border border-border p-6 min-w-0">
            <h3 className="text-lg font-medium text-charcoal mb-2">S&amp;P 500 ETF</h3>
            <p className="text-slate text-sm mb-5">SPY · USD per share</p>
            <div className="relative h-[300px] w-full min-w-0">
                <div className="tradingview-widget-container h-full w-full min-w-0" ref={containerRef} aria-label={CHART_TITLE} />
                {status === "loading" && <p role="status" className="absolute inset-0 flex items-center justify-center bg-white text-slate text-xs">Loading market chart…</p>}
                {status === "failed" && <p role="status" className="absolute inset-0 flex items-center justify-center bg-cream px-4 text-slate text-sm">Chart unavailable. Open the SPY source below for the latest prices.</p>}
            </div>
            <div className="tradingview-widget-copyright text-xs text-slate mt-3">
                <a href={SOURCE_URL} target="_blank" rel="noopener nofollow" className="underline underline-offset-2 hover:text-charcoal"><span className="blue-text">SPY chart</span></a><span className="trademark"> by TradingView</span>
            </div>
            <p className="text-slate text-xs leading-relaxed mt-3">Quotes may be delayed. SPY tracks the S&amp;P 500; its share price differs from the index.</p>
        </motion.div>
    );
}
