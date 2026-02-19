-- Supabase Database Schema for AI Real Estate Scraper
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/vuoahwhnpxjwopeypqje/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    tier TEXT DEFAULT 'free', -- 'free', 'pro', 'enterprise'
    storage_limit_bytes BIGINT DEFAULT 104857600, -- 100MB for free tier
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- People searches table
CREATE TABLE IF NOT EXISTS public.people_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    search_query TEXT NOT NULL,
    search_type TEXT DEFAULT 'name', -- 'name', 'address', 'phone', 'email'
    results JSONB,
    result_count INTEGER DEFAULT 0,
    source TEXT, -- 'apify', 'tavily', 'browseract'
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.people_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for people_searches
CREATE POLICY "Users can view own searches" ON public.people_searches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own searches" ON public.people_searches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Property scrapes table
CREATE TABLE IF NOT EXISTS public.property_scrapes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    property_url TEXT NOT NULL,
    property_data JSONB,
    source TEXT, -- 'zillow', 'realtor', 'redfin', 'trulia'
    status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'failed'
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.property_scrapes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_scrapes
CREATE POLICY "Users can view own scrapes" ON public.property_scrapes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scrapes" ON public.property_scrapes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat history table
CREATE TABLE IF NOT EXISTS public.chat_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user', 'assistant'
    content TEXT NOT NULL,
    tool_used TEXT, -- 'people_search', 'property_scraper', 'web_search', null
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_history
CREATE POLICY "Users can view own chat" ON public.chat_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat" ON public.chat_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Saved searches table (favorites)
CREATE TABLE IF NOT EXISTS public.saved_searches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    search_name TEXT NOT NULL,
    search_type TEXT NOT NULL, -- 'people', 'property'
    search_params JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage logs table
CREATE TABLE IF NOT EXISTS public.usage_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_type TEXT NOT NULL, -- 'scrape', 'people_search'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usage_logs
CREATE POLICY "Users can view own usage" ON public.usage_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage" ON public.usage_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Enable RLS
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_searches
CREATE POLICY "Users can manage own saved searches" ON public.saved_searches
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_people_searches_user_id ON public.people_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_people_searches_created_at ON public.people_searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_scrapes_user_id ON public.property_scrapes(user_id);
CREATE INDEX IF NOT EXISTS idx_property_scrapes_created_at ON public.property_scrapes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_history_user_id ON public.chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created_at ON public.chat_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at DESC);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Storage bucket for scraped files (PDFs, images, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('scraped-data', 'scraped-data', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload own files" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'scraped-data' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'scraped-data' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'scraped-data' AND
        auth.uid()::text = (storage.foldername(name))[1]
    );
