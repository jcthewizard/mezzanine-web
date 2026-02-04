"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

interface NewsItem {
    title: string;
    link: string;
    pubDate: string;
    description?: string;
}

interface NewsFeed {
    source: "FDIC" | "Federal Reserve";
    items: NewsItem[];
    loading: boolean;
    error: boolean;
}

export default function NewsSection() {
    const [fdicFeed, setFdicFeed] = useState<NewsFeed>({
        source: "FDIC",
        items: [],
        loading: true,
        error: false,
    });

    const [fedFeed, setFedFeed] = useState<NewsFeed>({
        source: "Federal Reserve",
        items: [],
        loading: true,
        error: false,
    });

    useEffect(() => {
        // Fetch FDIC RSS feed
        const fetchFDICNews = async () => {
            try {
                const rssUrl = "https://public.govdelivery.com/topics/USFDIC_26/feed.rss";
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;

                const response = await fetch(proxyUrl, {
                    method: "GET",
                    headers: { Accept: "application/xml" },
                });

                if (response.ok) {
                    const xmlText = await response.text();
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

                    const parseError = xmlDoc.querySelector("parsererror");
                    if (parseError) throw new Error("RSS parsing error");

                    const items = xmlDoc.querySelectorAll("item");
                    const newsItems: NewsItem[] = [];
                    const maxItems = Math.min(5, items.length);

                    for (let i = 0; i < maxItems; i++) {
                        const item = items[i];
                        const title = item.querySelector("title")?.textContent?.trim() || "";
                        const link = item.querySelector("link")?.textContent?.trim() || "";
                        const pubDate = item.querySelector("pubDate")?.textContent?.trim() || "";
                        const description = item.querySelector("description")?.textContent?.trim() || "";

                        if (title && link) {
                            newsItems.push({ title, link, pubDate, description });
                        }
                    }

                    setFdicFeed({ source: "FDIC", items: newsItems, loading: false, error: false });
                    return;
                }

                throw new Error("Failed to fetch FDIC RSS");
            } catch (error) {
                console.error("Error fetching FDIC news:", error);
                setFdicFeed({
                    source: "FDIC",
                    items: [
                        {
                            title: "FDIC Press Releases",
                            link: "https://www.fdic.gov/news/press-releases",
                            pubDate: new Date().toISOString(),
                        },
                    ],
                    loading: false,
                    error: true,
                });
            }
        };

        // Fetch Federal Reserve RSS feed
        const fetchFedNews = async () => {
            try {
                const rssUrl = "https://www.federalreserve.gov/feeds/press_all.xml";
                const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;

                const response = await fetch(proxyUrl, {
                    method: "GET",
                    headers: { Accept: "application/xml" },
                });

                if (response.ok) {
                    const xmlText = await response.text();
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

                    const parseError = xmlDoc.querySelector("parsererror");
                    if (parseError) throw new Error("RSS parsing error");

                    const items = xmlDoc.querySelectorAll("item");
                    const newsItems: NewsItem[] = [];
                    const maxItems = Math.min(5, items.length);

                    for (let i = 0; i < maxItems; i++) {
                        const item = items[i];
                        const title = item.querySelector("title")?.textContent?.trim() || "";
                        const link = item.querySelector("link")?.textContent?.trim() || "";
                        const pubDate = item.querySelector("pubDate")?.textContent?.trim() || "";
                        const description = item.querySelector("description")?.textContent?.trim() || "";

                        if (title && link) {
                            newsItems.push({ title, link, pubDate, description });
                        }
                    }

                    setFedFeed({ source: "Federal Reserve", items: newsItems, loading: false, error: false });
                    return;
                }

                throw new Error("Failed to fetch Federal Reserve RSS");
            } catch (error) {
                console.error("Error fetching Federal Reserve news:", error);
                setFedFeed({
                    source: "Federal Reserve",
                    items: [
                        {
                            title: "Federal Reserve Press Releases",
                            link: "https://www.federalreserve.gov/newsevents/pressreleases.htm",
                            pubDate: new Date().toISOString(),
                        },
                    ],
                    loading: false,
                    error: true,
                });
            }
        };

        fetchFDICNews();
        fetchFedNews();
    }, []);

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        } catch {
            return "";
        }
    };

    const renderNewsFeed = (feed: NewsFeed) => {
        return (
            <div className="bg-white border border-border p-8">
                {/* Header */}
                <div className="mb-6">
                    <h3 className="text-red text-sm tracking-[0.2em] uppercase font-medium mb-2">
                        {feed.source}
                    </h3>
                    <div className="w-12 h-px bg-red" />
                </div>

                {/* Loading State */}
                {feed.loading && (
                    <p className="text-slate text-sm">Loading latest news...</p>
                )}

                {/* News Items */}
                {!feed.loading && (
                    <div className="space-y-4">
                        {feed.items.map((item, index) => (
                            <a
                                key={`${item.link}-${index}`}
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-charcoal text-base leading-snug mb-1 group-hover:text-red transition-colors line-clamp-2">
                                            {item.title}
                                        </h4>
                                        {item.pubDate && (
                                            <p className="text-slate text-sm">
                                                {formatDate(item.pubDate)}
                                            </p>
                                        )}
                                    </div>
                                    <ExternalLink
                                        size={16}
                                        className="text-slate opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1"
                                    />
                                </div>
                            </a>
                        ))}
                    </div>
                )}

                {/* View All Link */}
                {!feed.loading && !feed.error && (
                    <a
                        href={
                            feed.source === "FDIC"
                                ? "https://www.fdic.gov/news/press-releases"
                                : "https://www.federalreserve.gov/newsevents/pressreleases.htm"
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-charcoal text-sm mt-6 hover:text-red transition-colors group"
                    >
                        View All {feed.source} News
                        <ExternalLink
                            size={14}
                            className="transition-transform group-hover:translate-x-0.5"
                        />
                    </a>
                )}
            </div>
        );
    };

    return (
        <section className="py-24 lg:py-32 bg-cream">
            <div className="max-w-7xl mx-auto px-6 lg:px-12">
                {/* Section Header */}
                <div className="mb-12">
                    <p className="text-red text-sm tracking-[0.2em] uppercase mb-4">
                        Latest News
                    </p>
                    <h2 className="font-serif text-3xl md:text-4xl text-charcoal leading-tight">
                        Regulatory Updates
                    </h2>
                </div>

                {/* News Grid */}
                <div className="grid lg:grid-cols-2 gap-8">
                    {renderNewsFeed(fdicFeed)}
                    {renderNewsFeed(fedFeed)}
                </div>
            </div>
        </section>
    );
}
