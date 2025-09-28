-- Create spin chances table
CREATE TABLE IF NOT EXISTS public.spin_chances (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  chances_left INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.spin_chances ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "spin_chances_select_own" ON public.spin_chances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "spin_chances_insert_own" ON public.spin_chances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "spin_chances_update_own" ON public.spin_chances FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to create spin chances for new users
CREATE OR REPLACE FUNCTION public.create_user_spin_chances()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.spin_chances (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_created_spin ON public.users;
CREATE TRIGGER on_user_created_spin
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_spin_chances();
