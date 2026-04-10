-- SPY Benchmark — add S&P 500 return % column to portfolio_snapshots
-- Workers consensus: always-visible benchmark comparison on portfolio chart.
-- spy_return_pct = ((SPY_close_today - SPY_close_firstPortfolioDate) / SPY_close_firstPortfolioDate) * 100

ALTER TABLE portfolio_snapshots
  ADD COLUMN IF NOT EXISTS spy_return_pct REAL DEFAULT 0;
