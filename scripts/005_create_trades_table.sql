-- Create trades table
CREATE TABLE IF NOT EXISTS public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL DEFAULT 'EURUSD',
  direction TEXT NOT NULL, -- 'buy', 'sell'
  stake_amount DECIMAL(20,8) NOT NULL,
  multiplier DECIMAL(10,2) NOT NULL,
  potential_profit DECIMAL(20,8) NOT NULL,
  actual_profit DECIMAL(20,8),
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'won', 'lost'
  duration INTEGER NOT NULL, -- in seconds
  entry_price DECIMAL(20,8),
  exit_price DECIMAL(20,8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "trades_select_own" ON public.trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "trades_insert_own" ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trades_update_own" ON public.trades FOR UPDATE USING (auth.uid() = user_id);
