// Platform Types
export type PlatformId = 'linkedin' | 'youtube' | 'instagram' | 'skool'

export interface Platform {
  id: PlatformId
  name: string
  color: string
  bgColor: string
  icon: string
}

// Workflow Status Types
export type WorkflowStatusId = 'idea' | 'content' | 'cutting' | 'review' | 'planned' | 'published'

export interface WorkflowStatus {
  id: WorkflowStatusId
  name: string
  emoji: string
  color: string
  bgColor: string
}

// Content Tag Types
export type ContentTagId = 'leadmagnet' | 'video' | 'gif' | 'carousel' | 'story' | 'reel' | 'short' | 'long-form' | 'thread' | 'poll' | 'event'

export interface ContentTag {
  id: ContentTagId
  name: string
  color: string
  bgColor: string
}

// Hook Type - für AI-Analyse welche Hook-Typen funktionieren
export type HookType = 
  | 'question'      // Frage stellen
  | 'statistic'     // Zahl/Statistik
  | 'story'         // Persönliche Geschichte
  | 'provocation'   // Provokante Aussage
  | 'list'          // "5 Dinge die..."
  | 'how-to'        // "So machst du..."
  | 'mistake'       // "Der größte Fehler..."
  | 'contrarian'    // Gegenmeinung
  | 'news'          // Aktuelle News/Trend
  | 'quote'         // Zitat
  | 'other'

export const HOOK_TYPES: Record<HookType, { name: string; description: string; emoji: string }> = {
  question: { name: 'Frage', description: 'Startet mit einer Frage', emoji: '❓' },
  statistic: { name: 'Statistik', description: 'Startet mit einer Zahl/Statistik', emoji: '📊' },
  story: { name: 'Story', description: 'Persönliche Geschichte/Erfahrung', emoji: '📖' },
  provocation: { name: 'Provokation', description: 'Provokante/kontroverse Aussage', emoji: '🔥' },
  list: { name: 'Liste', description: '"X Dinge die...", "X Gründe warum..."', emoji: '📝' },
  'how-to': { name: 'How-To', description: '"So machst du...", "Wie du..."', emoji: '🎯' },
  mistake: { name: 'Fehler', description: '"Der größte Fehler...", "Vermeide..."', emoji: '⚠️' },
  contrarian: { name: 'Gegenmeinung', description: 'Gegen den Mainstream', emoji: '🔄' },
  news: { name: 'News/Trend', description: 'Aktuelles Thema/Trend', emoji: '📰' },
  quote: { name: 'Zitat', description: 'Startet mit einem Zitat', emoji: '💬' },
  other: { name: 'Andere', description: 'Anderer Hook-Typ', emoji: '✨' }
}

// Topic/Theme - für AI-Analyse welche Themen funktionieren
export type ContentTopic = 
  | 'career'        // Karriere, Jobs
  | 'productivity'  // Produktivität, Tools
  | 'leadership'    // Führung, Management
  | 'marketing'     // Marketing, Sales
  | 'tech'          // Technologie, AI
  | 'startup'       // Gründung, Entrepreneurship
  | 'personal'      // Persönliches, Lifestyle
  | 'failure'       // Fails, Learnings aus Fehlern
  | 'success'       // Erfolge, Wins
  | 'industry'      // Branchenspezifisch
  | 'education'     // Lernen, Weiterbildung
  | 'networking'    // Netzwerken, Community
  | 'mindset'       // Mindset, Motivation
  | 'other'

export const CONTENT_TOPICS: Record<ContentTopic, { name: string; emoji: string }> = {
  career: { name: 'Karriere', emoji: '💼' },
  productivity: { name: 'Produktivität', emoji: '⚡' },
  leadership: { name: 'Leadership', emoji: '👑' },
  marketing: { name: 'Marketing & Sales', emoji: '📈' },
  tech: { name: 'Tech & AI', emoji: '🤖' },
  startup: { name: 'Startup & Gründung', emoji: '🚀' },
  personal: { name: 'Persönliches', emoji: '🧑' },
  failure: { name: 'Fails & Learnings', emoji: '💡' },
  success: { name: 'Erfolge & Wins', emoji: '🏆' },
  industry: { name: 'Branche', emoji: '🏢' },
  education: { name: 'Lernen & Wissen', emoji: '📚' },
  networking: { name: 'Networking', emoji: '🤝' },
  mindset: { name: 'Mindset', emoji: '🧠' },
  other: { name: 'Sonstiges', emoji: '📌' }
}

// Content Format - wie der Content präsentiert wird
export type ContentFormat = 
  | 'text-only'     // Nur Text
  | 'text-image'    // Text + Bild
  | 'carousel'      // Carousel/Slider
  | 'video'         // Video
  | 'poll'          // Umfrage
  | 'document'      // PDF/Dokument
  | 'link'          // Link-Post

export const CONTENT_FORMATS: Record<ContentFormat, { name: string; emoji: string }> = {
  'text-only': { name: 'Nur Text', emoji: '📝' },
  'text-image': { name: 'Text + Bild', emoji: '🖼️' },
  'carousel': { name: 'Carousel', emoji: '🎠' },
  'video': { name: 'Video', emoji: '🎬' },
  'poll': { name: 'Umfrage', emoji: '📊' },
  'document': { name: 'Dokument/PDF', emoji: '📄' },
  'link': { name: 'Link-Post', emoji: '🔗' }
}

// Post Types
export interface BasePost {
  id: string
  platform: PlatformId
  status: WorkflowStatusId
  tags: ContentTagId[]
  createdAt: string
  updatedAt: string
  scheduledFor?: string
  publishedAt?: string
  
  // AI Learning Fields
  hookType?: HookType
  topic?: ContentTopic
  format?: ContentFormat
  hypothesis?: string           // Warum wird dieser Post funktionieren?
  targetAudience?: string       // Für wen ist dieser Post?
  goalMetric?: 'impressions' | 'engagement' | 'comments' | 'shares' | 'clicks' | 'saves'
}

export interface LinkedInPost extends BasePost {
  platform: 'linkedin'
  content: {
    text: string
    hook?: string
    bulletPoints?: string[]
    cta?: string
    hashtags?: string[]
  }
  metrics?: {
    impressions: number
    likes: number
    comments: number
    shares: number
    clicks: number
  }
}

export interface YouTubePost extends BasePost {
  platform: 'youtube'
  content: {
    title: string
    description: string
    thumbnail?: string
    tags?: string[]
    category?: string
    isShort: boolean
  }
  metrics?: {
    views: number
    likes: number
    comments: number
    shares: number
    watchTime: number
    subscribers: number
  }
}

export interface InstagramPost extends BasePost {
  platform: 'instagram'
  content: {
    caption: string
    type: 'post' | 'reel' | 'story' | 'carousel'
    mediaUrls?: string[]
    hashtags?: string[]
    location?: string
  }
  metrics?: {
    impressions: number
    reach: number
    likes: number
    comments: number
    saves: number
    shares: number
  }
}

export interface SkoolPost extends BasePost {
  platform: 'skool'
  content: {
    title: string
    body: string
    category?: string
    isPinned?: boolean
  }
  metrics?: {
    views: number
    likes: number
    comments: number
  }
}

export type Post = LinkedInPost | YouTubePost | InstagramPost | SkoolPost

// Tracked Profile Types
export interface TrackedProfile {
  id: string
  platform: PlatformId
  name: string
  handle: string
  avatarUrl?: string
  bio?: string
  followers: number
  following?: number
  postsCount?: number
  addedAt: string
  lastScrapedAt?: string
  url: string
}

export interface TrackedContent {
  id: string
  profileId: string
  platform: PlatformId
  status: 'new' | 'backlog' | 'repurpose' | 'done' | 'skipped'
  title?: string
  content: string
  url: string
  publishedAt: string
  scrapedAt: string
  metrics?: {
    views?: number
    likes?: number
    comments?: number
    shares?: number
  }
  notes?: string
}

// Analytics Types
export interface PlatformAnalytics {
  platform: PlatformId
  period: 'week' | 'month' | 'year'
  totalPosts: number
  totalImpressions: number
  totalEngagement: number
  engagementRate: number
  followerGrowth: number
  topPost?: Post
  chartData: {
    date: string
    impressions: number
    engagement: number
  }[]
}

export interface DashboardStats {
  totalPosts: number
  postsThisWeek: number
  scheduledPosts: number
  totalImpressions: number
  avgEngagement: number
  platformBreakdown: {
    platform: PlatformId
    posts: number
    engagement: number
  }[]
}

// Weekly Metrics Types
export interface BaseWeeklyMetrics {
  id: string
  year: number
  weekNumber: number
  weekStart: string
  notes?: string
  skipped: boolean
  createdAt: string
  updatedAt: string
}

export interface LinkedInWeeklyMetrics extends BaseWeeklyMetrics {
  platform: 'linkedin'
  followers?: number
  impressions?: number
  engagement?: number
  profileViews?: number
  // Calculated
  followerGrowth?: number
  engagementRate?: number
}

export interface YouTubeWeeklyMetrics extends BaseWeeklyMetrics {
  platform: 'youtube'
  subscribers?: number
  views?: number
  watchTimeHours?: number
  avgViewDurationSeconds?: number
  // Calculated
  subscriberGrowth?: number
}

export interface InstagramWeeklyMetrics extends BaseWeeklyMetrics {
  platform: 'instagram'
  followers?: number
  reach?: number
  engagement?: number
  saves?: number
  profileVisits?: number
  // Calculated
  followerGrowth?: number
  engagementRate?: number
}

export interface SkoolWeeklyMetrics extends BaseWeeklyMetrics {
  platform: 'skool'
  members?: number
  activeMembers?: number
  postViews?: number
  comments?: number
  // Calculated
  memberGrowth?: number
  activityRate?: number
}

export type WeeklyMetrics = LinkedInWeeklyMetrics | YouTubeWeeklyMetrics | InstagramWeeklyMetrics | SkoolWeeklyMetrics

// Weekly Check-in State
export interface WeeklyCheckInData {
  year: number
  weekNumber: number
  weekStart: string
  linkedin: Partial<LinkedInWeeklyMetrics> & { skipped: boolean }
  youtube: Partial<YouTubeWeeklyMetrics> & { skipped: boolean }
  instagram: Partial<InstagramWeeklyMetrics> & { skipped: boolean }
  skool: Partial<SkoolWeeklyMetrics> & { skipped: boolean }
}

// User Types
export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

// Learning Types - für AI-gestützte Performance-Analyse
export interface PostLearning {
  id: string
  postId: string
  platform: PlatformId
  createdAt: string
  
  // Pre-Post (Hypothese)
  hypothesis: string           // "Warum wird dieser Post funktionieren?"
  targetMetric?: string        // "Mehr Kommentare", "Höhere CTR", etc.
  
  // Post-Post (Ergebnis)
  outcome?: 'exceeded' | 'met' | 'missed'  // Hat die Hypothese gestimmt?
  actualResult?: string        // Was ist tatsächlich passiert?
  
  // Learnings
  whatWorked?: string          // Was hat funktioniert?
  whatDidntWork?: string       // Was hat nicht funktioniert?
  keyInsight?: string          // Wichtigste Erkenntnis
  applyToFuture?: string       // Wie auf zukünftige Posts anwenden?
  
  // Metriken-Snapshot zum Zeitpunkt des Learnings
  metricsSnapshot?: {
    impressions?: number
    engagement?: number
    engagementRate?: number
    [key: string]: number | undefined
  }
}

// Performance Pattern - erkannte Muster über mehrere Posts
export interface PerformancePattern {
  id: string
  platform: PlatformId
  patternType: 'content' | 'timing' | 'format' | 'topic' | 'hook'
  description: string
  confidence: 'low' | 'medium' | 'high'
  basedOnPosts: string[]       // Post IDs
  avgPerformanceMultiplier: number  // 1.5 = 50% besser als Durchschnitt
  createdAt: string
  validatedAt?: string
}
