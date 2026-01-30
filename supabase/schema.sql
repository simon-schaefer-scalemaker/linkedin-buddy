-- =============================================
-- LINKEDIN CONTENT LEARNING SYSTEM
-- Supabase Schema v3.0 (Single User - No Auth)
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES (Single User)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001',
  email TEXT,
  name TEXT DEFAULT 'User',
  avatar_url TEXT,
  
  -- Preferences
  content_goals TEXT[] DEFAULT '{}',
  preferred_formats TEXT[] DEFAULT '{}',
  excluded_topics TEXT[] DEFAULT '{}',
  
  -- Learning Status
  learning_mode TEXT DEFAULT 'bootstrap' 
    CHECK (learning_mode IN ('bootstrap', 'learning', 'confident', 'optimizing')),
  model_confidence DECIMAL(3,2) DEFAULT 0.30,
  prediction_accuracy DECIMAL(3,2) DEFAULT 0.50,
  total_posts INTEGER DEFAULT 0,
  
  -- Stats
  avg_engagement_rate DECIMAL(7,4) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the single user profile
INSERT INTO public.profiles (id, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'User')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. POSTS (Content)
-- =============================================
CREATE TABLE public.posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Content
  body TEXT NOT NULL,
  url TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  
  -- Metrics (User Input)
  impressions INTEGER,
  engagements INTEGER,
  engagement_rate DECIMAL(7,4) GENERATED ALWAYS AS (
    CASE WHEN impressions > 0 THEN (engagements::DECIMAL / impressions) ELSE NULL END
  ) STORED,
  comments INTEGER,
  reposts INTEGER,
  
  -- AI Features (Extracted)
  features JSONB DEFAULT '{}',
  
  -- Performance
  performance_tier TEXT CHECK (performance_tier IN ('high', 'average', 'low')),
  
  -- Lineage
  source_type TEXT DEFAULT 'organic' 
    CHECK (source_type IN ('recommendation', 'pattern', 'experiment', 'recycled', 'organic')),
  source_id UUID,
  
  -- Prediction
  predicted_engagement DECIMAL(7,4),
  prediction_confidence DECIMAL(3,2),
  
  -- Processing
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'analyzing', 'ready', 'metrics_needed', 'complete')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_user ON public.posts(user_id);
CREATE INDEX idx_posts_status ON public.posts(user_id, status);
CREATE INDEX idx_posts_performance ON public.posts(user_id, performance_tier);

-- =============================================
-- 3. PATTERNS
-- =============================================
CREATE TABLE public.patterns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Pattern Definition
  feature_name TEXT NOT NULL,
  feature_value TEXT NOT NULL,
  pattern_type TEXT DEFAULT 'positive' 
    CHECK (pattern_type IN ('positive', 'negative')),
  
  -- Metrics
  performance_delta DECIMAL(5,2) NOT NULL,
  sample_size INTEGER NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  
  -- Examples
  example_post_ids UUID[] DEFAULT '{}',
  
  -- Recency
  last_confirmed_at TIMESTAMPTZ,
  times_confirmed INTEGER DEFAULT 1,
  
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, feature_name, feature_value)
);

CREATE INDEX idx_patterns_user ON public.patterns(user_id);
CREATE INDEX idx_patterns_type ON public.patterns(user_id, pattern_type);

-- =============================================
-- 4. RECOMMENDATIONS
-- =============================================
CREATE TABLE public.recommendations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  suggested_hook TEXT,
  suggested_outline JSONB DEFAULT '[]',
  
  -- Reasoning
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  reasoning JSONB DEFAULT '{}',
  
  -- User Response
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'accepted', 'rejected', 'created')),
  rejection_reason TEXT,
  
  -- Outcome
  resulting_post_id UUID REFERENCES public.posts(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recommendations_user ON public.recommendations(user_id, status);

-- =============================================
-- 5. PREDICTIONS (für Accuracy Tracking)
-- =============================================
CREATE TABLE public.predictions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  
  -- Prediction
  predicted_engagement DECIMAL(7,4) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  reasoning JSONB DEFAULT '{}',
  
  -- Actual
  actual_engagement DECIMAL(7,4),
  
  -- Accuracy
  accuracy_score DECIMAL(5,2),
  
  predicted_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_predictions_user ON public.predictions(user_id);

-- =============================================
-- 6. DRAFTS
-- =============================================
CREATE TABLE public.drafts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Content
  body TEXT NOT NULL,
  
  -- Live Analysis
  current_score INTEGER,
  current_analysis JSONB DEFAULT '{}',
  predicted_engagement DECIMAL(7,4),
  
  -- Status
  status TEXT DEFAULT 'draft' 
    CHECK (status IN ('draft', 'ready', 'published')),
  
  -- After Publishing
  published_post_id UUID REFERENCES public.posts(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. CHAT MESSAGES
-- =============================================
CREATE TABLE public.chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  
  -- Context
  related_post_ids UUID[] DEFAULT '{}',
  related_recommendation_ids UUID[] DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_user ON public.chat_messages(user_id, created_at DESC);

-- =============================================
-- 8. LEARNING LOG
-- =============================================
CREATE TABLE public.learning_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  
  event_type TEXT NOT NULL CHECK (event_type IN (
    'pattern_discovered',
    'pattern_confirmed',
    'pattern_weakened',
    'prediction_accurate',
    'prediction_missed',
    'milestone_reached'
  )),
  
  title TEXT NOT NULL,
  description TEXT,
  
  related_pattern_id UUID REFERENCES public.patterns(id),
  related_post_id UUID REFERENCES public.posts(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_learning_user ON public.learning_log(user_id, created_at DESC);

-- =============================================
-- 9. PLATFORM WEEKLY METRICS (Multi-Platform Growth Tracking)
-- =============================================

-- LinkedIn Weekly Metrics
CREATE TABLE public.linkedin_weekly_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Time Period
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
  week_start DATE NOT NULL,
  
  -- Profile Metrics
  followers INTEGER,
  impressions INTEGER,
  engagement INTEGER,
  profile_views INTEGER,
  
  -- Calculated (stored for historical tracking)
  follower_growth INTEGER, -- vs previous week
  engagement_rate DECIMAL(5,2), -- engagement / impressions * 100
  
  -- Notes
  notes TEXT,
  skipped BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, year, week_number)
);

CREATE INDEX idx_linkedin_metrics_user ON public.linkedin_weekly_metrics(user_id, year DESC, week_number DESC);

-- YouTube Weekly Metrics
CREATE TABLE public.youtube_weekly_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Time Period
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
  week_start DATE NOT NULL,
  
  -- Channel Metrics
  subscribers INTEGER,
  views INTEGER,
  watch_time_hours DECIMAL(10,1), -- in hours
  avg_view_duration_seconds INTEGER, -- in seconds
  
  -- Calculated
  subscriber_growth INTEGER,
  
  -- Notes
  notes TEXT,
  skipped BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, year, week_number)
);

CREATE INDEX idx_youtube_metrics_user ON public.youtube_weekly_metrics(user_id, year DESC, week_number DESC);

-- Instagram Weekly Metrics
CREATE TABLE public.instagram_weekly_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Time Period
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
  week_start DATE NOT NULL,
  
  -- Profile Metrics
  followers INTEGER,
  reach INTEGER,
  engagement INTEGER, -- likes + comments
  saves INTEGER,
  profile_visits INTEGER,
  
  -- Calculated
  follower_growth INTEGER,
  engagement_rate DECIMAL(5,2),
  
  -- Notes
  notes TEXT,
  skipped BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, year, week_number)
);

CREATE INDEX idx_instagram_metrics_user ON public.instagram_weekly_metrics(user_id, year DESC, week_number DESC);

-- Skool Weekly Metrics
CREATE TABLE public.skool_weekly_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Time Period
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1 AND week_number <= 53),
  week_start DATE NOT NULL,
  
  -- Community Metrics
  members INTEGER,
  active_members INTEGER,
  post_views INTEGER,
  comments INTEGER,
  
  -- Calculated
  member_growth INTEGER,
  activity_rate DECIMAL(5,2), -- active_members / members * 100
  
  -- Notes
  notes TEXT,
  skipped BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, year, week_number)
);

CREATE INDEX idx_skool_metrics_user ON public.skool_weekly_metrics(user_id, year DESC, week_number DESC);

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Update learning mode based on post count
CREATE OR REPLACE FUNCTION update_user_learning_status()
RETURNS TRIGGER AS $$
DECLARE
  post_count INTEGER;
  new_mode TEXT;
  new_avg DECIMAL;
  target_user_id UUID;
BEGIN
  -- Get user_id from either NEW or OLD depending on operation
  IF TG_OP = 'DELETE' THEN
    target_user_id := OLD.user_id;
  ELSE
    target_user_id := NEW.user_id;
  END IF;

  -- Count posts
  SELECT COUNT(*) INTO post_count 
  FROM public.posts 
  WHERE user_id = target_user_id AND status = 'complete';
  
  -- Calculate avg engagement
  SELECT AVG(engagement_rate) INTO new_avg
  FROM public.posts
  WHERE user_id = target_user_id 
    AND status = 'complete' 
    AND engagement_rate IS NOT NULL;
  
  -- Determine mode
  IF post_count < 10 THEN
    new_mode := 'bootstrap';
  ELSIF post_count < 30 THEN
    new_mode := 'learning';
  ELSIF post_count < 50 THEN
    new_mode := 'confident';
  ELSE
    new_mode := 'optimizing';
  END IF;
  
  -- Update profile
  UPDATE public.profiles
  SET 
    total_posts = post_count,
    learning_mode = new_mode,
    avg_engagement_rate = COALESCE(new_avg, 0),
    updated_at = NOW()
  WHERE id = target_user_id;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_post_change
  AFTER INSERT OR UPDATE OR DELETE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION update_user_learning_status();

-- Calculate performance tier when metrics are updated
CREATE OR REPLACE FUNCTION calculate_performance_tier()
RETURNS TRIGGER AS $$
DECLARE
  user_avg DECIMAL;
BEGIN
  -- Only calculate if we have engagement rate
  IF NEW.engagement_rate IS NOT NULL THEN
    -- Get user's average
    SELECT avg_engagement_rate INTO user_avg
    FROM public.profiles
    WHERE id = NEW.user_id;
    
    -- Determine tier
    IF user_avg > 0 THEN
      IF NEW.engagement_rate >= user_avg * 1.5 THEN
        NEW.performance_tier := 'high';
      ELSIF NEW.engagement_rate <= user_avg * 0.5 THEN
        NEW.performance_tier := 'low';
      ELSE
        NEW.performance_tier := 'average';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_post_metrics_update
  BEFORE UPDATE OF impressions, engagements ON public.posts
  FOR EACH ROW EXECUTE FUNCTION calculate_performance_tier();

-- =============================================
-- ROW LEVEL SECURITY (Disabled for Single User)
-- =============================================
-- No RLS needed for single-user internal tool
-- If you later want to add multi-user support, 
-- uncomment and configure these policies:

-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.patterns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.learning_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 10. STORAGE FOR VIDEO UPLOADS
-- =============================================

-- Create videos storage bucket (run in Supabase Dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('videos', 'videos', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage Policies (run after bucket creation)
-- Allow anyone to upload videos
-- CREATE POLICY "Allow public uploads" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'videos');

-- Allow public read access
-- CREATE POLICY "Allow public reads" ON storage.objects
--   FOR SELECT USING (bucket_id = 'videos');

-- =============================================
-- 11. CUTTER SHARES (Video Collaboration)
-- =============================================
CREATE TABLE public.cutter_shares (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
  
  -- Post Reference
  post_id TEXT NOT NULL, -- References local post ID
  post_title TEXT,
  
  -- Sharing
  password TEXT NOT NULL,
  share_url TEXT,
  
  -- Videos
  raw_video_url TEXT,
  final_video_url TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' 
    CHECK (status IN ('pending', 'in_progress', 'completed')),
  
  -- Notes
  instructions TEXT,
  cutter_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cutter_shares_password ON public.cutter_shares(password);
CREATE INDEX idx_cutter_shares_status ON public.cutter_shares(status);
