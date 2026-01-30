-- =============================================
-- MIGRATION: OpenAI (1536 dim) → Voyage AI (1024 dim)
-- =============================================
-- Run this ONLY if you already ran eugene-brain.sql with 1536 dimensions
-- This will recreate the tables with the correct dimensions

-- Drop existing tables (if they exist)
DROP TABLE IF EXISTS public.eugene_insights CASCADE;
DROP TABLE IF EXISTS public.eugene_conversations CASCADE;
DROP TABLE IF EXISTS public.eugene_memory CASCADE;
DROP TABLE IF EXISTS public.eugene_style_profile CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS search_eugene_memory;
DROP FUNCTION IF EXISTS search_eugene_conversations;
DROP FUNCTION IF EXISTS touch_eugene_memory;

-- Now run the updated eugene-brain.sql which has 1024 dimensions
-- Or run the following directly:

-- =============================================
-- 1. EUGENE MEMORY - Embeddings for All Content
-- =============================================
CREATE TABLE IF NOT EXISTS public.eugene_memory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE 
    DEFAULT '00000000-0000-0000-0000-000000000001',
  
  content_type TEXT NOT NULL CHECK (content_type IN (
    'post', 'learning', 'pattern', 'conversation', 'style_rule', 'consolidated'
  )),
  content_id TEXT,
  title TEXT,
  content TEXT NOT NULL,
  platform TEXT CHECK (platform IN ('linkedin', 'youtube', 'instagram', 'skool', 'general')),
  metadata JSONB DEFAULT '{}',
  
  -- Voyage AI voyage-3 = 1024 dimensions
  embedding vector(1024),
  
  importance_score DECIMAL(3,2) DEFAULT 0.5,
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eugene_memory_embedding 
  ON public.eugene_memory 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_eugene_memory_type 
  ON public.eugene_memory(user_id, content_type);

CREATE INDEX IF NOT EXISTS idx_eugene_memory_platform 
  ON public.eugene_memory(user_id, platform);

-- =============================================
-- 2. EUGENE CONVERSATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.eugene_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE 
    DEFAULT '00000000-0000-0000-0000-000000000001',
  
  context_type TEXT NOT NULL CHECK (context_type IN (
    'post_creation', 'post_editing', 'learning', 'general', 'analysis'
  )),
  context_id TEXT,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  embedding vector(1024),
  tokens_used INTEGER,
  model_used TEXT DEFAULT 'claude-3-5-sonnet',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eugene_conversations_context 
  ON public.eugene_conversations(user_id, context_type, context_id);

-- =============================================
-- 3. EUGENE STYLE PROFILE
-- =============================================
CREATE TABLE IF NOT EXISTS public.eugene_style_profile (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE 
    DEFAULT '00000000-0000-0000-0000-000000000001',
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'youtube', 'instagram', 'skool')),
  
  tone JSONB DEFAULT '{}',
  structure JSONB DEFAULT '{}',
  vocabulary JSONB DEFAULT '{}',
  formatting JSONB DEFAULT '{}',
  example_post_ids TEXT[] DEFAULT '{}',
  style_prompt TEXT,
  posts_analyzed INTEGER DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, platform)
);

-- =============================================
-- 4. EUGENE INSIGHTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.eugene_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE 
    DEFAULT '00000000-0000-0000-0000-000000000001',
  
  category TEXT NOT NULL CHECK (category IN (
    'hook_pattern', 'content_pattern', 'timing_pattern', 
    'format_pattern', 'topic_pattern', 'general_learning'
  )),
  platform TEXT CHECK (platform IN ('linkedin', 'youtube', 'instagram', 'skool', 'general')),
  
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  supporting_post_ids TEXT[] DEFAULT '{}',
  sample_size INTEGER DEFAULT 0,
  embedding vector(1024),
  times_confirmed INTEGER DEFAULT 1,
  last_confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 5. SEARCH FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION search_eugene_memory(
  query_embedding vector(1024),
  match_count INT DEFAULT 10,
  filter_type TEXT DEFAULT NULL,
  filter_platform TEXT DEFAULT NULL,
  min_importance DECIMAL DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  content_type TEXT,
  content_id TEXT,
  title TEXT,
  content TEXT,
  platform TEXT,
  metadata JSONB,
  importance_score DECIMAL,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content_type,
    m.content_id,
    m.title,
    m.content,
    m.platform,
    m.metadata,
    m.importance_score,
    1 - (m.embedding <=> query_embedding) AS similarity
  FROM public.eugene_memory m
  WHERE m.user_id = '00000000-0000-0000-0000-000000000001'
    AND (filter_type IS NULL OR m.content_type = filter_type)
    AND (filter_platform IS NULL OR m.platform = filter_platform)
    AND m.importance_score >= min_importance
    AND m.embedding IS NOT NULL
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION search_eugene_conversations(
  query_embedding vector(1024),
  match_count INT DEFAULT 10,
  filter_context_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  context_type TEXT,
  context_id TEXT,
  role TEXT,
  content TEXT,
  created_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.context_type,
    c.context_id,
    c.role,
    c.content,
    c.created_at,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.eugene_conversations c
  WHERE c.user_id = '00000000-0000-0000-0000-000000000001'
    AND (filter_context_type IS NULL OR c.context_type = filter_context_type)
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

CREATE OR REPLACE FUNCTION touch_eugene_memory(memory_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.eugene_memory
  SET 
    last_accessed_at = NOW(),
    access_count = access_count + 1,
    importance_score = LEAST(1.0, importance_score + 0.01)
  WHERE id = memory_id;
END;
$$;

-- Grants
GRANT ALL ON public.eugene_memory TO anon, authenticated;
GRANT ALL ON public.eugene_conversations TO anon, authenticated;
GRANT ALL ON public.eugene_style_profile TO anon, authenticated;
GRANT ALL ON public.eugene_insights TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_eugene_memory TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_eugene_conversations TO anon, authenticated;
GRANT EXECUTE ON FUNCTION touch_eugene_memory TO anon, authenticated;
