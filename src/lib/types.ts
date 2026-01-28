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
export type WorkflowStatusId = 'backlog' | 'idea' | 'draft' | 'review' | 'scheduled' | 'published' | 'archived'

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

// User Types
export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
}
