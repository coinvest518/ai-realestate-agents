-- Migration: Create alerts (user subscriptions)
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  zip TEXT NOT NULL,
  radius_miles INT DEFAULT 0,
  type TEXT NOT NULL,
  price_drop_pct NUMERIC DEFAULT 5,
  min_price NUMERIC NULL,
  max_price NUMERIC NULL,
  notify_via TEXT DEFAULT 'email',
  webhook_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS alerts_zip_idx ON public.alerts (zip);
