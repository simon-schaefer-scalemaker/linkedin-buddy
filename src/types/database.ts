export type LearningMode = 'bootstrap' | 'learning' | 'confident' | 'optimizing'
export type PerformanceTier = 'high' | 'average' | 'low'
export type PostStatus = 'pending' | 'analyzing' | 'ready' | 'metrics_needed' | 'complete'
export type SourceType = 'recommendation' | 'pattern' | 'experiment' | 'recycled' | 'organic'
export type PatternType = 'positive' | 'negative'
export type RecommendationStatus = 'pending' | 'accepted' | 'rejected' | 'created'
export type DraftStatus = 'draft' | 'ready' | 'published'
export type ChatRole = 'user' | 'assistant'
export type LearningEventType = 
  | 'pattern_discovered'
  | 'pattern_confirmed'
  | 'pattern_weakened'
  | 'prediction_accurate'
  | 'prediction_missed'
  | 'milestone_reached'

export interface Profile {
  id: string
  email: string | null
  name: string | null
  avatar_url: string | null
  content_goals: string[]
  preferred_formats: string[]
  excluded_topics: string[]
  learning_mode: LearningMode
  model_confidence: number
  prediction_accuracy: number
  total_posts: number
  avg_engagement_rate: number
  created_at: string
  updated_at: string
}

export interface PostFeatures {
  topics: string[]
  format: 'list' | 'story' | 'how-to' | 'opinion' | 'question' | 'announcement'
  hook_type: 'number' | 'question' | 'bold_claim' | 'curiosity' | 'personal' | 'pain_point'
  sentiment: 'positive' | 'neutral' | 'negative'
  has_personal_story: boolean
  has_call_to_action: boolean
  has_numbers_in_title: boolean
  has_question: boolean
  has_list: boolean
  word_count: number
  key_themes: string[]
  day_of_week: number
  hour_of_day: number
}

export interface Post {
  id: string
  user_id: string
  body: string
  url: string | null
  published_at: string
  impressions: number | null
  engagements: number | null
  engagement_rate: number | null
  comments: number | null
  reposts: number | null
  features: PostFeatures | null
  performance_tier: PerformanceTier | null
  source_type: SourceType
  source_id: string | null
  predicted_engagement: number | null
  prediction_confidence: number | null
  status: PostStatus
  created_at: string
  updated_at: string
}

export interface Pattern {
  id: string
  user_id: string
  feature_name: string
  feature_value: string
  pattern_type: PatternType
  performance_delta: number
  sample_size: number
  confidence: number
  example_post_ids: string[]
  last_confirmed_at: string | null
  times_confirmed: number
  calculated_at: string
}

export interface RecommendationReasoning {
  primary_patterns: string[]
  combined_delta?: number
  similar_posts?: string[]
  risk_factors?: string[]
  expected_delta?: string
  why_it_works?: string
}

export interface Recommendation {
  id: string
  user_id: string
  title: string
  description: string | null
  suggested_hook: string | null
  suggested_outline: string[]
  confidence_score: number
  reasoning: RecommendationReasoning
  status: RecommendationStatus
  rejection_reason: string | null
  resulting_post_id: string | null
  created_at: string
}

export interface Prediction {
  id: string
  user_id: string
  post_id: string
  predicted_engagement: number
  confidence: number
  reasoning: Record<string, unknown>
  actual_engagement: number | null
  accuracy_score: number | null
  predicted_at: string
  resolved_at: string | null
}

export interface DraftAnalysis {
  overall_score: number
  feedback: {
    hook: { status: 'good' | 'warning' | 'bad'; message: string; suggestion?: string }
    format: { status: 'good' | 'warning' | 'bad'; message: string }
    length: { status: 'good' | 'warning' | 'bad'; message: string; word_count: number }
    cta: { status: 'good' | 'warning' | 'bad'; message: string }
  }
  patterns_used: string[]
  patterns_missing: string[]
  warnings: string[]
  engagement_multiplier: number
  predicted_engagement: number
  avg_engagement: number
}

export interface Draft {
  id: string
  user_id: string
  body: string
  current_score: number | null
  current_analysis: DraftAnalysis | null
  predicted_engagement: number | null
  status: DraftStatus
  published_post_id: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  role: ChatRole
  content: string
  related_post_ids: string[]
  related_recommendation_ids: string[]
  created_at: string
}

export interface LearningLogEntry {
  id: string
  user_id: string
  event_type: LearningEventType
  title: string
  description: string | null
  related_pattern_id: string | null
  related_post_id: string | null
  created_at: string
}

export interface WeeklyMetrics {
  id: string
  user_id: string
  year: number
  week_number: number
  connections: number | null
  followers: number | null
  impressions: number | null
  profile_views: number | null
  posts_published: number
  total_engagements: number
  notes: string | null
  created_at: string
  updated_at: string
}

// Calculated growth data for UI
export interface WeeklyMetricsWithGrowth extends WeeklyMetrics {
  connections_growth: number | null
  followers_growth: number | null
  impressions_growth: number | null
  profile_views_growth: number | null
}
