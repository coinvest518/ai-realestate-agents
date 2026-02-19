-- Migration: Create alert_events to record detected events for alerts
CREATE TABLE IF NOT EXISTS public.alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES public.alerts(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  notified BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS alert_events_listing_idx ON public.alert_events (listing_id);
