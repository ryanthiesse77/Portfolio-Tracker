# 📈 Portfolio Tracker

A mobile-first, shareable stock portfolio tracking app with AI-powered research.

**Stack:** Next.js · Supabase · Polygon.io · Anthropic Claude · Recharts · Tailwind CSS · Vercel

---

## 🚀 Deploy in ~15 Minutes

### Step 1 — Supabase Setup

1. Go to [supabase.com](https://supabase.com) → Create a new project (free tier)
2. Go to **SQL Editor** → paste the contents of `supabase-schema.sql` → Run it
3. Go to **Authentication → Users → Add User** → create your admin email/password
4. Go to **Settings → API** → copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Step 2 — Get API Keys

- **Polygon.io** (free): [polygon.io](https://polygon.io) → Sign up → Dashboard → API Keys
- **Anthropic** (pay-as-you-go): [console.anthropic.com](https://console.anthropic.com) → API Keys

### Step 3 — Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. In **Environment Variables**, add all 4 variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   POLYGON_API_KEY
   ANTHROPIC_API_KEY
   ```
4. Deploy — Vercel reads `vercel.json` and sets up the daily price cron automatically

### Step 4 — Use It

- **Public URL**: `https://yourapp.vercel.app` — share this with anyone
- **Admin**: `https://yourapp.vercel.app/admin` → log in with your Supabase credentials

---

## 📱 Features

| Feature | Details |
|---|---|
| Public portfolio view | No login required, shareable URL |
| Performance chart | Area chart with 1W/1M/3M/6M/1Y/All range toggles |
| Sector breakdown | Donut chart with $ values and % allocation |
| Open positions table | Current prices, returns, clickable for AI research |
| Closed positions table | Realized gain/loss |
| AI Research Modal | Claude + web search, cached 14 days per ticker |
| Admin trade entry | Buy/sell, auto-calculate shares ↔ dollar amount |
| Trade history | Edit and delete with auto-recalculation |
| Daily price updates | Vercel Cron at 4:30 PM ET weekdays via Polygon.io |
| Manual price refresh | One-click from admin panel |

---

## 🗂 Project Structure

```
portfolio-tracker/
├── pages/
│   ├── index.jsx          # Public portfolio view
│   ├── admin.jsx          # Admin dashboard (auth required)
│   ├── login.jsx          # Admin login
│   └── api/
│       ├── portfolio.js   # Fetch all portfolio data
│       ├── trades.js      # CRUD trades + rebuild positions
│       ├── update-prices.js # Polygon price fetch + snapshot
│       └── research.js    # Claude AI research with cache
├── components/
│   ├── StatCard.jsx
│   ├── PerformanceChart.jsx
│   ├── SectorChart.jsx
│   ├── PositionsTable.jsx
│   ├── ResearchModal.jsx
│   ├── TradeForm.jsx
│   └── TradeHistory.jsx
├── lib/
│   ├── supabase.js        # Supabase client
│   └── utils.js           # Calculations + formatters
├── styles/globals.css
├── supabase-schema.sql    # Run this in Supabase SQL Editor
├── vercel.json            # Cron job config
└── .env.local.example     # Copy to .env.local with your keys
```

---

## 💡 Notes

- **Polygon free tier**: 5 API calls/minute, end-of-day data only (no intraday)
- **Claude AI research**: ~$0.003 per ticker per 2 weeks (very cheap)
- **Supabase free tier**: 500MB DB, 2GB bandwidth — plenty for personal use
- **Vercel free tier**: 100GB bandwidth, cron jobs included

---

## 🔒 Security

- Admin page is protected by Supabase Auth
- Supabase RLS policies ensure public users can only READ positions/prices
- Only authenticated users can write to any table
- API keys are server-side only (`POLYGON_API_KEY`, `ANTHROPIC_API_KEY`)
