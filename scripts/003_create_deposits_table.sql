-- Create deposits table
CREATE TABLE IF NOT EXISTS public.deposits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(20,8) NOT NULL,
  method TEXT NOT NULL, -- 'ecocash', 'onemoney', 'telecash', 'crypto'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'failed'
  tx_hash TEXT,
  deposit_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "deposits_select_own" ON public.deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "deposits_insert_own" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "deposits_update_own" ON public.deposits FOR UPDATE USING (auth.uid() = user_id);
