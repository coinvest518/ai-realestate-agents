-- Migration: Create listings table to store normalized property listings
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_listing_id TEXT NOT NULL,
  address TEXT,
  street TEXT,
  city TEXT,
  zip TEXT,
  state TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  price NUMERIC,
  beds INT,
  baths INT,
  sqft INT,
  lot_sqft INT,
  listing_url TEXT,
  status TEXT,
  price_history JSONB DEFAULT '[]'::jsonb,
  raw JSONB,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS listings_provider_listing_id_idx ON public.listings (provider, provider_listing_id);
CREATE INDEX IF NOT EXISTS listings_zip_idx ON public.listings (zip);
CREATE INDEX IF NOT EXISTS listings_price_idx ON public.listings (price);
