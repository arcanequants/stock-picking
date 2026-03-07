-- ============================================
-- STOCK PICKING - Database Schema
-- ============================================

-- Stocks: master list of all researched stocks
CREATE TABLE stocks (
  id SERIAL PRIMARY KEY,
  ticker VARCHAR(10) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  sector VARCHAR(100),
  industry VARCHAR(100),
  country VARCHAR(100),
  region VARCHAR(50), -- 'North America', 'Europe', 'Asia', 'LatAm', etc.
  currency VARCHAR(10) DEFAULT 'USD',

  -- Key metrics (updated periodically)
  price DECIMAL(12,2),
  pe_ratio DECIMAL(8,2),
  pe_forward DECIMAL(8,2),
  dividend_yield DECIMAL(6,2), -- as percentage e.g. 2.5
  market_cap_b DECIMAL(12,2), -- in billions
  eps DECIMAL(10,2),

  -- Research
  summary_short TEXT, -- WhatsApp-friendly 2-3 sentences
  summary_what TEXT, -- "Qué hace" in simple terms
  summary_why TEXT, -- "Por qué nos gusta"
  summary_risk TEXT, -- Main risk
  research_full TEXT, -- Full markdown research
  analyst_consensus VARCHAR(20), -- 'Strong Buy', 'Buy', 'Hold', 'Sell'
  analyst_target DECIMAL(12,2),
  analyst_upside DECIMAL(6,2), -- as percentage

  -- Status
  status VARCHAR(20) DEFAULT 'watchlist', -- 'active', 'watchlist', 'avoid'

  -- Dates
  first_researched_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  next_review_at TIMESTAMPTZ, -- 6 months from last update

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions: every buy/rebuy
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  stock_id INTEGER REFERENCES stocks(id),
  ticker VARCHAR(10) NOT NULL,

  type VARCHAR(10) NOT NULL, -- 'new' or 'rebuy'
  cycle_number INTEGER NOT NULL, -- which cycle (1, 2, 3...)

  price DECIMAL(12,2) NOT NULL, -- price at time of pick
  date DATE NOT NULL,
  day_of_week VARCHAR(10), -- 'monday', 'tuesday', etc.

  -- WhatsApp message sent
  wa_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cycles: track the alternating new/rebuy cycles
CREATE TABLE cycles (
  id SERIAL PRIMARY KEY,
  cycle_number INTEGER NOT NULL,
  type VARCHAR(10) NOT NULL, -- 'new' or 'rebuy'
  target_count INTEGER DEFAULT 5, -- always 5
  current_count INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed'
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Portfolio summary view
CREATE VIEW portfolio_summary AS
SELECT
  s.ticker,
  s.name,
  s.sector,
  s.region,
  s.price AS current_price,
  s.dividend_yield,
  s.analyst_upside,
  COUNT(t.id) AS total_picks,
  COUNT(CASE WHEN t.type = 'new' THEN 1 END) AS new_picks,
  COUNT(CASE WHEN t.type = 'rebuy' THEN 1 END) AS rebuys,
  MIN(t.date) AS first_pick_date,
  MAX(t.date) AS last_pick_date
FROM stocks s
LEFT JOIN transactions t ON s.id = t.stock_id
WHERE s.status = 'active'
GROUP BY s.id, s.ticker, s.name, s.sector, s.region,
         s.price, s.dividend_yield, s.analyst_upside
ORDER BY COUNT(t.id) DESC;

-- Sector allocation view
CREATE VIEW sector_allocation AS
SELECT
  s.sector,
  COUNT(DISTINCT s.ticker) AS num_stocks,
  ROUND(COUNT(DISTINCT s.ticker)::DECIMAL /
    (SELECT COUNT(DISTINCT ticker) FROM stocks WHERE status = 'active') * 100, 1
  ) AS pct_of_portfolio
FROM stocks s
WHERE s.status = 'active'
GROUP BY s.sector
ORDER BY num_stocks DESC;

-- Region allocation view
CREATE VIEW region_allocation AS
SELECT
  s.region,
  COUNT(DISTINCT s.ticker) AS num_stocks,
  ROUND(COUNT(DISTINCT s.ticker)::DECIMAL /
    (SELECT COUNT(DISTINCT ticker) FROM stocks WHERE status = 'active') * 100, 1
  ) AS pct_of_portfolio
FROM stocks s
WHERE s.status = 'active'
GROUP BY s.region
ORDER BY num_stocks DESC;

-- Weekly schedule helper
CREATE VIEW weekly_schedule AS
SELECT
  date,
  CASE EXTRACT(DOW FROM date)
    WHEN 1 THEN 2  -- Monday: 2 stocks
    WHEN 2 THEN 2  -- Tuesday: 2 stocks
    WHEN 3 THEN 1  -- Wednesday: 1 stock
    WHEN 4 THEN 1  -- Thursday: 1 stock
    WHEN 5 THEN 1  -- Friday: 1 stock
  END AS stocks_to_pick
FROM generate_series(
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  '1 day'
) AS date
WHERE EXTRACT(DOW FROM date) BETWEEN 1 AND 5;

-- Insert first cycle
INSERT INTO cycles (cycle_number, type, target_count, current_count, status)
VALUES (1, 'new', 5, 0, 'active');
