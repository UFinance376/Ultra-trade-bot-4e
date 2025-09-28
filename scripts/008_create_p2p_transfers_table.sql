-- Create P2P transfers table
CREATE TABLE IF NOT EXISTS public.p2p_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(20,8) NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.p2p_transfers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "p2p_transfers_select_own" ON public.p2p_transfers 
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "p2p_transfers_insert_sender" ON public.p2p_transfers 
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
