-- Create withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(20,8) NOT NULL,
  fee DECIMAL(20,8) NOT NULL,
  net_amount DECIMAL(20,8) NOT NULL,
  destination_address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'failed'
  tx_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "withdrawals_select_own" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "withdrawals_insert_own" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "withdrawals_update_own" ON public.withdrawals FOR UPDATE USING (auth.uid() = user_id);
