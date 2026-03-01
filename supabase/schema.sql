-- ═══════════════════════════════════════════════════════════
--  SmartStockPicker — Supabase Database Schema
--  Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ═══════════════════════════════════════════════════════════

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── 1. Users ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT,
  email      TEXT UNIQUE NOT NULL,
  country    TEXT,               -- ISO 3166-1 alpha-2, e.g. "US", "PK", "GB"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Stocks ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stocks (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  symbol         TEXT NOT NULL,
  company        TEXT,
  country        TEXT NOT NULL,   -- ISO 3166-1 alpha-2
  sector         TEXT,
  pe_ratio       NUMERIC,
  revenue_growth NUMERIC,         -- percentage, e.g. 15.5 means 15.5%
  debt_equity    NUMERIC,
  market_cap     NUMERIC,         -- in USD millions
  last_updated   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (symbol, country)
);

CREATE INDEX IF NOT EXISTS idx_stocks_country ON stocks (country);
CREATE INDEX IF NOT EXISTS idx_stocks_symbol  ON stocks (symbol);

-- ── 3. Portfolio ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolio (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  stock_symbol TEXT NOT NULL,
  shares       NUMERIC NOT NULL DEFAULT 0,
  bought_price NUMERIC NOT NULL,           -- price per share at purchase
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, stock_symbol)
);

CREATE INDEX IF NOT EXISTS idx_portfolio_user ON portfolio (user_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_portfolio_updated
  BEFORE UPDATE ON portfolio
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 4. AI Response Cache ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_cache (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country      TEXT NOT NULL,
  query        TEXT NOT NULL,       -- normalized lowercase query string
  ai_response  JSONB NOT NULL,      -- full JSON from Claude
  hits         INT DEFAULT 1,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (country, query)
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_country_query ON ai_cache (country, query);

-- ── 5. Seed sample stocks ────────────────────────────────────────────────────
INSERT INTO stocks (symbol, company, country, sector, pe_ratio, revenue_growth, debt_equity, market_cap)
VALUES
  -- US
  ('AAPL',  'Apple Inc.',              'US', 'Technology',    28,   8.1,  1.8,   2800000),
  ('MSFT',  'Microsoft Corporation',   'US', 'Technology',    34,  15.0,  0.9,   3000000),
  ('NVDA',  'NVIDIA Corporation',      'US', 'Technology',    55,  122.0, 0.4,   1500000),
  ('AMZN',  'Amazon.com Inc.',         'US', 'Consumer',      43,  11.0,  0.8,   1800000),
  ('GOOGL', 'Alphabet Inc.',           'US', 'Technology',    22,   8.5,  0.1,   1700000),
  ('JNJ',   'Johnson & Johnson',       'US', 'Healthcare',    15,   6.3,  0.4,    380000),
  ('BRK.B', 'Berkshire Hathaway',      'US', 'Financials',    22,  21.0,  0.6,    780000),
  -- UK
  ('SHEL',  'Shell plc',               'GB', 'Energy',        10,   5.0,  0.4,    220000),
  ('AZN',   'AstraZeneca',             'GB', 'Healthcare',    30,  18.0,  0.7,    240000),
  ('HSBA',  'HSBC Holdings',           'GB', 'Financials',    11,   8.0,  5.2,    160000),
  -- Pakistan
  ('ENGRO', 'Engro Corporation',       'PK', 'Conglomerate',  12,   9.0,  1.1,      5000),
  ('HBL',   'Habib Bank Limited',      'PK', 'Financials',     8,  12.0,  6.0,      3000),
  ('PSO',   'Pakistan State Oil',      'PK', 'Energy',         6,   4.0,  1.5,      2000),
  -- India
  ('RELIANCE','Reliance Industries',   'IN', 'Conglomerate',  25,  12.0,  0.6,    250000),
  ('INFY',  'Infosys Ltd',             'IN', 'Technology',    23,  14.0,  0.1,     80000),
  ('HDFC',  'HDFC Bank',               'IN', 'Financials',    19,  18.0,  7.0,    150000),
  -- Germany
  ('SAP',   'SAP SE',                  'DE', 'Technology',    28,  10.0,  0.3,    230000),
  ('SIE',   'Siemens AG',              'DE', 'Industrials',   18,   7.0,  0.8,    140000),
  ('BMW',   'BMW AG',                  'DE', 'Automotive',     6,   5.0,  1.2,     60000)
ON CONFLICT (symbol, country) DO NOTHING;

-- ── Row Level Security (RLS) — enable after Auth setup ───────────────────────
-- ALTER TABLE users    ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;

-- Portfolio RLS: users can only see/edit their own rows
-- CREATE POLICY "own_portfolio" ON portfolio
--   USING (auth.uid() = user_id)
--   WITH CHECK (auth.uid() = user_id);
