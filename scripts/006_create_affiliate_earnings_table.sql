-- Create affiliate earnings table
CREATE TABLE IF NOT EXISTS public.affiliate_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- inviter
  from_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- referred user
  amount DECIMAL(20,8) NOT NULL,
  source TEXT NOT NULL, -- 'trade', 'spin'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.affiliate_earnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "affiliate_earnings_select_own" ON public.affiliate_earnings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "affiliate_earnings_insert_system" ON public.affiliate_earnings FOR INSERT WITH CHECK (true); -- System can insert
