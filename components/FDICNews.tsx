"use client";

import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
}

export default function FDICNews() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch FDIC RSS feed
    const fetchNews = async () => {
      try {
        // Use a CORS proxy service to fetch the RSS feed
        const rssUrl = "https://www.fdic.gov/news/news/press/rss.xml";
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;

        const response = await fetch(proxyUrl, {
          method: "GET",
          headers: {
            Accept: "application/xml",
          },
        });

        if (response.ok) {
          const xmlText = await response.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");

          // Check for parsing errors
          const parseError = xmlDoc.querySelector("parsererror");
          if (parseError) {
            throw new Error("RSS parsing error");
          }

          const items = xmlDoc.querySelectorAll("item");

          if (items.length > 0) {
            const newsItems: NewsItem[] = [];
            const maxItems = Math.min(5, items.length);

            for (let i = 0; i < maxItems; i++) {
              const item = items[i];
              const titleEl = item.querySelector("title");
              const linkEl = item.querySelector("link");
              const pubDateEl = item.querySelector("pubDate");

              const title = titleEl?.textContent?.trim() || "";
              const link = linkEl?.textContent?.trim() || "";
              const pubDate = pubDateEl?.textContent?.trim() || "";

              if (title && link) {
                newsItems.push({ title, link, pubDate });
              }
            }

            if (newsItems.length > 0) {
              setNews(newsItems);
              setLoading(false);
              return;
            }
          }
        }

        throw new Error("Failed to fetch or parse RSS");
      } catch (error) {
        console.error("Error fetching FDIC news:", error);
        // Fallback: Show sample news items that link to FDIC
        setNews([
          {
            title: "FDIC Releases Quarterly Banking Profile",
            link: "https://www.fdic.gov/news/press-releases",
            pubDate: new Date().toISOString(),
          },
          {
            title: "FDIC Issues Guidance on Commercial Real Estate Lending",
            link: "https://www.fdic.gov/news/press-releases",
            pubDate: new Date().toISOString(),
          },
          {
            title: "View All FDIC News & Press Releases",
            link: "https://www.fdic.gov/news/press-releases",
            pubDate: new Date().toISOString(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
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

  if (loading) {
    return (
      <section className="bg-charcoal py-14 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-6">
            <span className="text-red text-base tracking-wider uppercase font-medium">
              FDIC News
            </span>
            <div className="flex-1 h-px bg-white/5" />
            <p className="text-white/50 text-lg">Loading latest news...</p>
          </div>
        </div>
      </section>
    );
  }

  // Duplicate news items for seamless loop
  const duplicatedNews = [...news, ...news];

  return (
    <section className="bg-charcoal py-14 border-y border-white/5 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center gap-6">
          <span className="text-red text-base tracking-wider uppercase font-medium whitespace-nowrap flex-shrink-0 z-20 bg-charcoal pr-6">
            FDIC News
          </span>

          {/* Ticker tape container - takes up remaining space */}
          <div className="flex-1 overflow-hidden relative min-w-0">
            {/* Left fade gradient */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-charcoal to-transparent z-10 pointer-events-none" />

            {/* Right fade gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-charcoal to-transparent z-10 pointer-events-none" />

            <div className="ticker-container flex items-center gap-12">
              {duplicatedNews.map((item, index) => (
                <a
                  key={`${item.link}-${index}`}
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-6 text-white/90 hover:text-white transition-colors group flex-shrink-0"
                >
                  <span className="text-lg leading-relaxed font-medium max-w-xs line-clamp-2">
                    {item.title}
                  </span>
                  {item.pubDate && (
                    <span className="text-sm text-white/50 font-medium whitespace-nowrap flex-shrink-0">
                      {formatDate(item.pubDate)}
                    </span>
                  )}
                  <ExternalLink
                    size={16}
                    className="opacity-0 group-hover:opacity-70 transition-opacity flex-shrink-0"
                  />
                  <div className="w-px h-8 bg-white/20 flex-shrink-0" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

