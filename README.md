# Mezzanine Properties, Inc.

A modern, luxurious website for Mezzanine Properties, Inc. - a commercial real estate and asset management company based in Bellevue, Washington.

## Tech Stack

- **Framework**: Next.js 16 (App Router, static export)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Fonts**: Montserrat (headings) + DM Sans (body)

## Getting Started

### Prerequisites

- Node.js 22+ (`nvm use`)
- npm

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
```

The production files are in `out/`; GitHub Pages serves this directory. `next start`
does not serve a static export. For a local preview, run `python3 -m http.server
8080 --directory out`.

## Market data — no accounts or subscriptions

Market charts update in the browser, independently of GitHub Actions or website
deployments. No API keys, Cloudflare account, or paid service is needed.

- **Gold:** TradingView's free embedded OANDA `XAUUSD` chart, labeled in USD per
  troy ounce. The provider supplies both chart history and its latest quote.
- **Equities:** TradingView's free embedded `AMEX:SPY` chart, explicitly labeled
  **SPDR S&P 500 ETF (SPY)** in USD per share. This is an ETF tracking the S&P 500,
  not the official index level. Quote delays and provider branding stay visible.
- **SOFR:** The browser requests the New York Fed's public SOFR API directly,
  refreshing periodically and when the page becomes visible. Dates are effective
  dates, not the publication date. The rate is normally published on business days
  for the preceding business day. Calendar dates are formatted without shifting
  them into the visitor's timezone.

SOFR can fall back to a validated snapshot in `public/data/markets.json`. A failed
request retains the last good data and displays a warning. An unavailable value
is never represented as zero. Gold and equities have provider links if embedded
charts are blocked or unavailable; their status and timestamps belong to the
provider, not to the site's build time.

`npm run fetch:data` updates the SOFR recovery snapshot and existing news feeds.
Each refresh reports failure explicitly; the deployment workflow can publish
available data and then report a failed refresh. The six-hour GitHub schedule is
only for recovery snapshots and news. Live market charts do not depend on it,
so GitHub's inactivity suspension no longer freezes their prices.

The legacy FRED gold strategy index and S&P index snapshots have been removed.
Neither is reused as gold spot history or ETF history.

```bash
npm run fetch:data
npm test
npm run lint
npm run build
```

Provider references: [NY Fed SOFR API](https://markets.newyorkfed.org/static/docs/markets-api.html),
[TradingView free widgets](https://www.tradingview.com/widget/),
[widget data and delay rules](https://www.tradingview.com/widget-docs/faq/data/).

## Project Structure

```
mezzanine-v2/
├── app/
│   ├── layout.tsx          # Root layout with header/footer
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles and brand colors
│   ├── about/page.tsx      # About Us page
│   └── contact/page.tsx    # Contact page
├── components/
│   ├── Header.tsx          # Navigation with logo
│   ├── Footer.tsx          # Contact info, links
│   ├── Hero.tsx            # Homepage hero section
│   ├── ServiceCard.tsx     # Service cards component
│   ├── ContactForm.tsx     # Contact form component
│   └── ScrollToTop.tsx     # Scroll to top button
├── public/
│   └── logo.png            # Company logo
└── ...config files
```

## Brand Colors

- **Primary Red**: #E31B23
- **Charcoal Black**: #1A1A1A
- **Warm Cream**: #FAF9F6
- **Stone Gray**: #6B6B6B

## Contact

- **Phone**: 888.262.2835
- **Email**: contact@mezzinc.com
- **Address**: 11245 SE 6th Street Suite 280, Bellevue, WA 98004
