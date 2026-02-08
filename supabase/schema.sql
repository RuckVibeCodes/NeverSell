-- NeverSell Earn Database Schema
-- Created: Feb 8, 2026

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS & AUTH
-- ============================================

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  wallet_address TEXT UNIQUE,
  username TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CREATORS
-- ============================================

-- Creator profiles (users who can create/trade strategies)
CREATE TABLE IF NOT EXISTS public.creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  twitter_handle TEXT,
  youtube_handle TEXT,
  website_url TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  total_followers INTEGER DEFAULT 0,
  total_aum DECIMAL(20, 2) DEFAULT 0, -- Assets Under Management
  total_earnings DECIMAL(20, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creator followers
CREATE TABLE IF NOT EXISTS public.creator_followers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  follower_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(creator_id, follower_id)
);

-- ============================================
-- VAULTS & POSITIONS
-- ============================================

-- Tracked vault configurations
CREATE TABLE IF NOT EXISTS public.vaults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  beefy_vault_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  chain TEXT NOT NULL CHECK (chain IN ('arbitrum', 'base', 'optimism', 'polygon')),
  platform TEXT NOT NULL,
  token_address TEXT NOT NULL,
  vault_address TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User vault positions
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  vault_id UUID REFERENCES public.vaults(id) ON DELETE CASCADE,
  
  -- Deposit info
  deposit_amount DECIMAL(20, 8) NOT NULL,
  deposit_token TEXT NOT NULL,
  deposit_tx_hash TEXT,
  shares DECIMAL(20, 8) NOT NULL,
  
  -- Tracking
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'harvested'))
);

-- Position history (for tracking value over time)
CREATE TABLE IF NOT EXISTS public.position_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  position_id UUID REFERENCES public.positions(id) ON DELETE CASCADE,
  shares_at_time DECIMAL(20, 8) NOT NULL,
  value_usd DECIMAL(20, 2) NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SOCIAL PORTFOLIOS (COPY TRADING)
-- ============================================

-- Social/copy portfolios
CREATE TABLE IF NOT EXISTS public.social_portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Allocation targets
  allocations JSONB NOT NULL DEFAULT '[]', -- [{vault_id, percentage}]
  
  -- Performance
  total_value DECIMAL(20, 2) DEFAULT 0,
  total_return DECIMAL(20, 2) DEFAULT 0,
  return_percent DECIMAL(10, 2) DEFAULT 0,
  
  -- Tracking
  is_public BOOLEAN DEFAULT TRUE,
  copy_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy relationships (users copying a portfolio)
CREATE TABLE IF NOT EXISTS public.copier_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  portfolio_id UUID REFERENCES public.social_portfolios(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Copy settings
  copy_percent DECIMAL(5, 2) DEFAULT 100, -- Percentage of creator's trades to copy
  min_allocation DECIMAL(20, 2) DEFAULT 0,
  max_allocation DECIMAL(20, 2),
  
  -- Tracking
  is_active BOOLEAN DEFAULT TRUE,
  copied_value DECIMAL(20, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(portfolio_id, user_id)
);

-- ============================================
-- DEPOSITS & WITHDRAWALS
-- ============================================

-- Deposit history
CREATE TABLE IF NOT EXISTS public.deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  position_id UUID REFERENCES public.positions(id) ON DELETE CASCADE,
  
  amount DECIMAL(20, 8) NOT NULL,
  token TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  chain TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Withdrawal history
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  position_id UUID REFERENCES public.positions(id) ON DELETE CASCADE,
  
  shares DECIMAL(20, 8) NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  token TEXT NOT NULL,
  tx_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  chain TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EARNINGS & PAYOUTS
-- ============================================

-- Creator earnings (from copier fees + performance)
CREATE TABLE IF NOT EXISTS public.creator_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  
  source TEXT NOT NULL CHECK (source IN ('copier_fee', 'performance', 'deposit_bonus')),
  amount DECIMAL(20, 2) NOT NULL,
  currency TEXT DEFAULT 'USDC',
  
  -- Reference
  reference_type TEXT, -- 'copier_relationship', 'position', etc.
  reference_id UUID,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid', 'withdrawn')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ
);

-- Payout history
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE CASCADE,
  
  amount DECIMAL(20, 2) NOT NULL,
  currency TEXT DEFAULT 'USDC',
  method TEXT CHECK (method IN ('paypal', 'stripe', 'crypto')),
  
  -- Payment info
  wallet_address TEXT,
  paypal_email TEXT,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  tx_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_wallet ON public.users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_creators_user ON public.creators(user_id);
CREATE INDEX IF NOT EXISTS idx_creators_status ON public.creators(status);
CREATE INDEX IF NOT EXISTS idx_positions_user ON public.positions(user_id);
CREATE INDEX IF NOT EXISTS idx_positions_vault ON public.positions(vault_id);
CREATE INDEX IF NOT EXISTS idx_positions_status ON public.positions(status);
CREATE INDEX IF NOT EXISTS idx_deposits_user ON public.deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON public.withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_earnings_creator ON public.creator_earnings(creator_id);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON public.creator_earnings(status);
CREATE INDEX IF NOT EXISTS idx_copier_relationships_portfolio ON public.copier_relationships(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_copier_relationships_user ON public.copier_relationships(user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON public.creators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON public.positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_social_portfolios_updated_at BEFORE UPDATE ON public.social_portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_copier_relationships_updated_at BEFORE UPDATE ON public.copier_relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- POLICIES (Row Level Security)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

-- Users can see their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Positions are visible to owner
CREATE POLICY "Users can view own positions" ON public.positions
  FOR SELECT USING (auth.uid() = user_id);

-- Deposits/withdrawals visible to owner
CREATE POLICY "Users can view own deposits" ON public.deposits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own withdrawals" ON public.withdrawals
  FOR SELECT USING (auth.uid() = user_id);

-- Earnings visible to creator
CREATE POLICY "Creators can view own earnings" ON public.creator_earnings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.creators 
      WHERE creators.id = creator_earnings.creator_id 
      AND creators.user_id = auth.uid()
    )
  );
