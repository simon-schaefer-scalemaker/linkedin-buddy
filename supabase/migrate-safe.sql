-- =============================================
-- SAFE MIGRATION - Only creates missing tables
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  email TEXT,
  name TEXT DEFAULT 'User',
  avatar_url TEXT,
  content_goals TEXT[] DEFAULT '{}',
  preferred_formats TEXT[] DEFAULT '{}',
  excluded_topics TEXT[] DEFAULT '{}',
  learning_mode TEXT DEFAULT 'bootstrap',
  model_confidence DECIMAL(3,2) DEFAULT 0.30,
  prediction_accuracy DECIMAL(3,2) DEFAULT 0.50,
  total_posts INTEGER DEFAULT 0,
  avg_engagement_rate DECIMAL(7,4) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.profiles (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'User')
ON CONFLICT (id) DO NOTHING;

-- 2. POSTS
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  body TEXT NOT NULL,
  url TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  impressions INTEGER,
  engagements INTEGER,
  engagement_rate DECIMAL(7,4) GENERATED ALWAYS AS (
    CASE WHEN impressions > 0 THEN (engagements::DECIMAL / impressions) ELSE NULL END
  ) STORED,
  comments INTEGER,
  reposts INTEGER,
  features JSONB DEFAULT '{}',
  performance_tier TEXT CHECK (performance_tier IN ('high', 'average', 'low')),
  source_type TEXT DEFAULT 'organic',
  source_id UUID,
  predicted_engagement DECIMAL(7,4),
  prediction_confidence DECIMAL(3,2),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_user ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_posts_performance ON public.posts(user_id, performance_tier);

-- 3. PATTERNS
CREATE TABLE IF NOT EXISTS public.patterns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  feature_name TEXT NOT NULL,
  feature_value TEXT NOT NULL,
  pattern_type TEXT DEFAULT 'positive',
  performance_delta DECIMAL(5,2) NOT NULL,
  sample_size INTEGER NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  example_post_ids UUID[] DEFAULT '{}',
  last_confirmed_at TIMESTAMPTZ,
  times_confirmed INTEGER DEFAULT 1,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_name, feature_value)
);

CREATE INDEX IF NOT EXISTS idx_patterns_user ON public.patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_patterns_type ON public.patterns(user_id, pattern_type);

-- 4. RECOMMENDATIONS
CREATE TABLE IF NOT EXISTS public.recommendations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  title TEXT NOT NULL,
  description TEXT,
  suggested_hook TEXT,
  suggested_outline JSONB DEFAULT '[]',
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  reasoning JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  resulting_post_id UUID REFERENCES public.posts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_user ON public.recommendations(user_id, status);

-- 5. PREDICTIONS
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  predicted_engagement DECIMAL(7,4) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  reasoning JSONB DEFAULT '{}',
  actual_engagement DECIMAL(7,4),
  accuracy_score DECIMAL(5,2),
  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_predictions_user ON public.predictions(user_id);

-- 6. DRAFTS
CREATE TABLE IF NOT EXISTS public.drafts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  body TEXT NOT NULL,
  current_score INTEGER,
  current_analysis JSONB DEFAULT '{}',
  predicted_engagement DECIMAL(7,4),
  status TEXT DEFAULT 'draft',
  published_post_id UUID REFERENCES public.posts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  related_post_ids UUID[] DEFAULT '{}',
  related_recommendation_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_user ON public.chat_messages(user_id, created_at DESC);

-- 8. LEARNING LOG
CREATE TABLE IF NOT EXISTS public.learning_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  related_pattern_id UUID REFERENCES public.patterns(id),
  related_post_id UUID REFERENCES public.posts(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_user ON public.learning_log(user_id, created_at DESC);

-- 9. LINKEDIN WEEKLY METRICS
CREATE TABLE IF NOT EXISTS public.linkedin_weekly_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
  week_start DATE NOT NULL,
  followers INTEGER,
  impressions INTEGER,
  engagement INTEGER,
  profile_views INTEGER,
  follower_growth INTEGER,
  engagement_rate DECIMAL(5,2),
  notes TEXT,
  skipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, week_number)
);

CREATE INDEX IF NOT EXISTS idx_linkedin_metrics_user ON public.linkedin_weekly_metrics(user_id, year DESC, week_number DESC);

-- 10. YOUTUBE WEEKLY METRICS
CREATE TABLE IF NOT EXISTS public.youtube_weekly_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
  week_start DATE NOT NULL,
  subscribers INTEGER,
  views INTEGER,
  watch_time_hours DECIMAL(10,1),
  avg_view_duration_seconds INTEGER,
  subscriber_growth INTEGER,
  notes TEXT,
  skipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, week_number)
);

CREATE INDEX IF NOT EXISTS idx_youtube_metrics_user ON public.youtube_weekly_metrics(user_id, year DESC, week_number DESC);

-- 11. INSTAGRAM WEEKLY METRICS
CREATE TABLE IF NOT EXISTS public.instagram_weekly_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
  week_start DATE NOT NULL,
  followers INTEGER,
  reach INTEGER,
  engagement INTEGER,
  saves INTEGER,
  profile_visits INTEGER,
  follower_growth INTEGER,
  engagement_rate DECIMAL(5,2),
  notes TEXT,
  skipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, week_number)
);

CREATE INDEX IF NOT EXISTS idx_instagram_metrics_user ON public.instagram_weekly_metrics(user_id, year DESC, week_number DESC);

-- 12. SKOOL WEEKLY METRICS
CREATE TABLE IF NOT EXISTS public.skool_weekly_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
  week_start DATE NOT NULL,
  members INTEGER,
  active_members INTEGER,
  post_views INTEGER,
  comments INTEGER,
  member_growth INTEGER,
  activity_rate DECIMAL(5,2),
  notes TEXT,
  skipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year, week_number)
);

CREATE INDEX IF NOT EXISTS idx_skool_metrics_user ON public.skool_weekly_metrics(user_id, year DESC, week_number DESC);

-- 13. CUTTER SHARES
CREATE TABLE IF NOT EXISTS public.cutter_shares (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  post_id TEXT NOT NULL,
  post_title TEXT,
  password TEXT NOT NULL,
  share_url TEXT,
  raw_video_url TEXT,
  final_video_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  instructions TEXT,
  cutter_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cutter_shares_password ON public.cutter_shares(password);
CREATE INDEX IF NOT EXISTS idx_cutter_shares_status ON public.cutter_shares(status);

-- 14. CONTENT POSTS (For Board/Workflow - Multi-Platform)
CREATE TABLE IF NOT EXISTS public.content_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Basic Info
  title TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'youtube', 'instagram', 'skool')),
  status TEXT NOT NULL DEFAULT 'idea' CHECK (status IN ('idea', 'draft', 'in_review', 'scheduled', 'published')),
  
  -- Content
  content TEXT,
  hook TEXT,
  
  -- Media
  thumbnail_url TEXT,
  video_url TEXT,
  
  -- LinkedIn specific
  workflow_url TEXT,
  loom_bulletpoints TEXT[],
  dm_reply TEXT,
  resource_name TEXT,
  resource_url TEXT,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Metrics (after publishing)
  impressions INTEGER,
  engagement INTEGER,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_posts_user ON public.content_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_content_posts_platform ON public.content_posts(user_id, platform);
CREATE INDEX IF NOT EXISTS idx_content_posts_status ON public.content_posts(user_id, status);

-- 15. TEMPLATES
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  category TEXT NOT NULL CHECK (category IN ('reply', 'comment', 'resource', 'affiliate')),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_templates_user ON public.templates(user_id, category);

-- 16. GOALS (OKRs)
CREATE TABLE IF NOT EXISTS public.goals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'youtube', 'instagram', 'skool')),
  weekly_target INTEGER NOT NULL DEFAULT 1,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

-- Insert default goals
INSERT INTO public.goals (user_id, platform, weekly_target, enabled) VALUES
  ('00000000-0000-0000-0000-000000000001', 'linkedin', 3, true),
  ('00000000-0000-0000-0000-000000000001', 'youtube', 1, true),
  ('00000000-0000-0000-0000-000000000001', 'instagram', 5, true),
  ('00000000-0000-0000-0000-000000000001', 'skool', 2, true)
ON CONFLICT (user_id, platform) DO NOTHING;

-- 17. GLOBAL SETTINGS
CREATE TABLE IF NOT EXISTS public.global_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' UNIQUE,
  resource_template TEXT DEFAULT 'Hey [NAME]! 🙂

Hier ist der Workflow, den du dir gewünscht hast – du kannst ihn direkt duplizieren:

[LINK]

Viel Spaß damit!',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings
INSERT INTO public.global_settings (user_id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (user_id) DO NOTHING;

-- 18. AFFILIATE LINKS
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_user ON public.affiliate_links(user_id);

-- Insert default affiliate link
INSERT INTO public.affiliate_links (user_id, name, url) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Weavy.ai', 'https://weavy.ai?ref=simon')
ON CONFLICT DO NOTHING;

-- =============================================
-- STORAGE BUCKET FOR VIDEOS
-- =============================================
-- Run this separately if needed:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true) ON CONFLICT DO NOTHING;
