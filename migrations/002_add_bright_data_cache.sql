-- Bright Data marketplace cache table
CREATE TABLE IF NOT EXISTS public.bright_data_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_url TEXT NOT NULL UNIQUE,
    property_data JSONB,
    source TEXT DEFAULT 'bright_data_marketplace',
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '30 days'
);

CREATE INDEX IF NOT EXISTS idx_bright_data_cache_url ON public.bright_data_cache(property_url);
CREATE INDEX IF NOT EXISTS idx_bright_data_cache_expires ON public.bright_data_cache(expires_at);
