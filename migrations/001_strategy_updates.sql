-- Strategy Updates table for creator portfolios
-- Allows creators to post short updates (max 280 chars) about their strategy

CREATE TABLE IF NOT EXISTS strategy_updates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id TEXT NOT NULL,  -- Wallet address of the creator
  portfolio_id TEXT NOT NULL, -- ID of the portfolio this update belongs to
  content TEXT NOT NULL CHECK (char_length(content) <= 280),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for fast lookups by portfolio
CREATE INDEX IF NOT EXISTS idx_strategy_updates_portfolio_id ON strategy_updates(portfolio_id);

-- Index for lookups by creator
CREATE INDEX IF NOT EXISTS idx_strategy_updates_creator_id ON strategy_updates(creator_id);

-- Index for ordering by date
CREATE INDEX IF NOT EXISTS idx_strategy_updates_created_at ON strategy_updates(created_at DESC);

-- Row Level Security (RLS)
ALTER TABLE strategy_updates ENABLE ROW LEVEL SECURITY;

-- Anyone can read updates
CREATE POLICY "Anyone can read updates" ON strategy_updates
  FOR SELECT USING (true);

-- Only creators can insert updates for their own portfolios
CREATE POLICY "Creators can insert own updates" ON strategy_updates
  FOR INSERT WITH CHECK (true);  -- Auth check done at API layer

-- Only creators can delete their own updates
CREATE POLICY "Creators can delete own updates" ON strategy_updates
  FOR DELETE USING (true);  -- Auth check done at API layer
