-- =============================================
-- EUGENE'S BRAIN - Vector Database Schema
-- Semantic Search & Long-term Memory for Eugene
-- =============================================

-- Enable pgvector extension (run this first in Supabase Dashboard > SQL Editor)
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================
-- 1. EUGENE MEMORY - Embeddings for All Content
-- =============================================
CREATE TABLE IF NOT EXISTS public.eugene_memory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE 
    DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Content Reference
  content_type TEXT NOT NULL CHECK (content_type IN (
    'post',           -- LinkedIn/YouTube/Instagram/Skool posts
    'learning',       -- Key insights and learnings
    'pattern',        -- Recognized patterns
    'conversation',   -- Important conversation snippets
    'style_rule',     -- Writing style rules
    'consolidated'    -- Consolidated memories (summaries)
  )),
  content_id TEXT,                    -- Reference to original content (post_id, learning_id, etc.)
  
  -- The actual content (for display/context)
  title TEXT,
  content TEXT NOT NULL,
  
  -- Metadata
  platform TEXT CHECK (platform IN ('linkedin', 'youtube', 'instagram', 'skool', 'general')),
  metadata JSONB DEFAULT '{}',        -- Flexible metadata (metrics, tags, etc.)
  
  -- Vector Embedding (Voyage AI voyage-3 = 1024 dimensions)
  embedding vector(1024),
  
  -- Importance & Recency
  importance_score DECIMAL(3,2) DEFAULT 0.5,  -- 0-1, higher = more important
  last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast similarity search
CREATE INDEX IF NOT EXISTS idx_eugene_memory_embedding 
  ON public.eugene_memory 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_eugene_memory_type 
  ON public.eugene_memory(user_id, content_type);

CREATE INDEX IF NOT EXISTS idx_eugene_memory_platform 
  ON public.eugene_memory(user_id, platform);

CREATE INDEX IF NOT EXISTS idx_eugene_memory_importance 
  ON public.eugene_memory(user_id, importance_score DESC);

-- =============================================
-- 2. EUGENE CONVERSATIONS - Persistent Chat History
-- =============================================
CREATE TABLE IF NOT EXISTS public.eugene_conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE 
    DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Conversation Context
  context_type TEXT NOT NULL CHECK (context_type IN (
    'post_creation',  -- While creating a post
    'post_editing',   -- While editing a post
    'learning',       -- Discussing learnings
    'general',        -- General chat
    'analysis'        -- Analyzing performance
  )),
  context_id TEXT,                    -- e.g., post_id if context_type = 'post_creation'
  
  -- Conversation
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  
  -- Embedding for semantic search through conversations (Voyage AI voyage-3 = 1024 dimensions)
  embedding vector(1024),
  
  -- Metadata
  tokens_used INTEGER,
  model_used TEXT DEFAULT 'claude-3-5-sonnet',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eugene_conversations_context 
  ON public.eugene_conversations(user_id, context_type, context_id);

CREATE INDEX IF NOT EXISTS idx_eugene_conversations_time 
  ON public.eugene_conversations(user_id, created_at DESC);

-- =============================================
-- 3. EUGENE STYLE PROFILE - Cached Writing Style
-- =============================================
CREATE TABLE IF NOT EXISTS public.eugene_style_profile (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE 
    DEFAULT '00000000-0000-0000-0000-000000000001',
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'youtube', 'instagram', 'skool')),
  
  -- Style Analysis (cached)
  tone JSONB DEFAULT '{}',           -- {formal, emotional, direct, description}
  structure JSONB DEFAULT '{}',      -- {avgParagraphs, usesEmojis, hookStyle, etc.}
  vocabulary JSONB DEFAULT '{}',     -- {commonWords, signaturePhrases}
  formatting JSONB DEFAULT '{}',     -- {usesCapitalization, commonSymbols}
  
  -- Example Posts (IDs of winner posts)
  example_post_ids TEXT[] DEFAULT '{}',
  
  -- Computed Style Prompt (ready to use)
  style_prompt TEXT,
  
  -- Metadata
  posts_analyzed INTEGER DEFAULT 0,
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, platform)
);

-- =============================================
-- 4. EUGENE CONSOLIDATED INSIGHTS - Memory Consolidation
-- =============================================
CREATE TABLE IF NOT EXISTS public.eugene_insights (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE 
    DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Insight Details
  category TEXT NOT NULL CHECK (category IN (
    'hook_pattern',       -- What hooks work
    'content_pattern',    -- What content types work
    'timing_pattern',     -- When to post
    'format_pattern',     -- Formatting that works
    'topic_pattern',      -- Topics that resonate
    'general_learning'    -- Other learnings
  )),
  platform TEXT CHECK (platform IN ('linkedin', 'youtube', 'instagram', 'skool', 'general')),
  
  -- The Insight
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,  -- 0-1
  
  -- Evidence
  supporting_post_ids TEXT[] DEFAULT '{}',
  sample_size INTEGER DEFAULT 0,
  
  -- Embedding for semantic search
  embedding vector(1024),
  
  -- Lifecycle
  times_confirmed INTEGER DEFAULT 1,
  last_confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_eugene_insights_category 
  ON public.eugene_insights(user_id, category);

CREATE INDEX IF NOT EXISTS idx_eugene_insights_platform 
  ON public.eugene_insights(user_id, platform);

-- =============================================
-- 5. HELPER FUNCTIONS
-- =============================================

-- Function to search similar memories
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

-- Function to search similar conversations
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

-- Function to update memory access (for importance scoring)
CREATE OR REPLACE FUNCTION touch_eugene_memory(memory_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.eugene_memory
  SET 
    last_accessed_at = NOW(),
    access_count = access_count + 1,
    -- Increase importance slightly when accessed (max 1.0)
    importance_score = LEAST(1.0, importance_score + 0.01)
  WHERE id = memory_id;
END;
$$;

-- =============================================
-- 6. GRANTS (for Edge Functions)
-- =============================================
-- Allow edge functions to access these tables
GRANT ALL ON public.eugene_memory TO anon, authenticated;
GRANT ALL ON public.eugene_conversations TO anon, authenticated;
GRANT ALL ON public.eugene_style_profile TO anon, authenticated;
GRANT ALL ON public.eugene_insights TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_eugene_memory TO anon, authenticated;
GRANT EXECUTE ON FUNCTION search_eugene_conversations TO anon, authenticated;
GRANT EXECUTE ON FUNCTION touch_eugene_memory TO anon, authenticated;
