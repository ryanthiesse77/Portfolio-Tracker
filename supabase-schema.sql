-- ============================================================
-- PORTFOLIO TRACKER — Supabase SQL Schema
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- 1. TRADES — every buy/sell event
CREATE TABLE IF NOT EXISTS trades (
  id               BIGSERIAL PRIMARY KEY,
  ticker           TEXT NOT NULL,
  company_name     TEXT NOT NULL,
  sector           TEXT NOT NULL DEFAULT 'Other',
  trade_type       TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  date             DATE NOT NULL,
  shares           NUMERIC(18, 6) NOT NULL,
  price_per_share  NUMERIC(18, 4) NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- 2. POSITIONS — current holdings, rebuilt on every trade change
CREATE TABLE IF NOT EXISTS positions (
  id               BIGSERIAL PRIMARY KEY,
  ticker           TEXT NOT NULL UNIQUE,
  company_name     TEXT NOT NULL,
  sector           TEXT NOT NULL DEFAULT 'Other',
  shares_held      NUMERIC(18, 6) NOT NULL DEFAULT 0,
  avg_cost_basis   NUMERIC(18, 4) NOT NULL DEFAULT 0,
  is_open          BOOLEAN NOT NULL DEFAULT TRUE
);

-- 3. PORTFOLIO_SNAPSHOTS — daily total value (for the chart)
CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id               BIGSERIAL PRIMARY KEY,
  date             DATE NOT NULL UNIQUE,
  total_value      NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total_cost_basis NUMERIC(18, 2) NOT NULL DEFAULT 0
);

-- 4. STOCK_PRICES — end-of-day prices fetched by cron
CREATE TABLE IF NOT EXISTS stock_prices (
  id               BIGSERIAL PRIMARY KEY,
  ticker           TEXT NOT NULL,
  date             DATE NOT NULL,
  close_price      NUMERIC(18, 4) NOT NULL,
  UNIQUE (ticker, date)
);

-- 5. AI_RESEARCH_CACHE — Claude research per ticker, 14-day TTL
CREATE TABLE IF NOT EXISTS ai_research_cache (
  id               BIGSERIAL PRIMARY KEY,
  ticker           TEXT NOT NULL UNIQUE,
  research_json    JSONB NOT NULL,
  generated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trades_ticker ON trades(ticker);
CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(date DESC);
CREATE INDEX IF NOT EXISTS idx_stock_prices_ticker_date ON stock_prices(ticker, date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON portfolio_snapshots(date DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- This setup: positions/snapshots/prices/cache are public-readable,
-- trades are only readable/writable by authenticated admin.
-- ============================================================

ALTER TABLE trades             ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_prices       ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_research_cache  ENABLE ROW LEVEL SECURITY;

-- Public read policies (for portfolio view)
CREATE POLICY "public_read_positions"  ON positions          FOR SELECT USING (true);
CREATE POLICY "public_read_snapshots"  ON portfolio_snapshots FOR SELECT USING (true);
CREATE POLICY "public_read_prices"     ON stock_prices        FOR SELECT USING (true);
CREATE POLICY "public_read_cache"      ON ai_research_cache   FOR SELECT USING (true);

-- Authenticated admin full access (all tables)
CREATE POLICY "admin_all_trades"    ON trades              FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_positions" ON positions           FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_snapshots" ON portfolio_snapshots FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_prices"    ON stock_prices        FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "admin_all_cache"     ON ai_research_cache   FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- NOTE: After running this SQL, go to Supabase → Authentication
-- → Users → Add User to create your admin account.
-- ============================================================

-- ============================================================
-- CASH FLOWS — track deposits and withdrawals
-- ============================================================
CREATE TABLE IF NOT EXISTS cash_flows (
  id         BIGSERIAL PRIMARY KEY,
  date       DATE NOT NULL,
  amount     NUMERIC(18, 2) NOT NULL,  -- positive = deposit, negative = withdrawal
  label      TEXT NOT NULL DEFAULT 'Deposit',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cash_flows_date ON cash_flows(date ASC);

ALTER TABLE cash_flows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read_cash_flows" ON cash_flows FOR SELECT USING (true);
CREATE POLICY "admin_all_cash_flows"   ON cash_flows FOR ALL USING (auth.role() = 'authenticated');
