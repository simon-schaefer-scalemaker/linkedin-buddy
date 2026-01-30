/**
 * Eugene's Memory System
 * 
 * Provides semantic search and long-term memory capabilities for Eugene.
 * Uses OpenAI embeddings and Supabase pgvector for similarity search.
 */

import { supabase, SINGLE_USER_ID } from './supabase'
import type { Post, PlatformId } from './types'

// Types
export type ContentType = 'post' | 'learning' | 'pattern' | 'conversation' | 'style_rule' | 'consolidated'

export interface MemoryItem {
  id: string
  content_type: ContentType
  content_id?: string
  title?: string
  content: string
  platform?: PlatformId | 'general'
  metadata?: Record<string, unknown>
  importance_score: number
  similarity?: number
  created_at: string
}

export interface SearchResult extends MemoryItem {
  similarity: number
}

export interface ConversationMessage {
  id: string
  context_type: 'post_creation' | 'post_editing' | 'learning' | 'general' | 'analysis'
  context_id?: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  similarity?: number
}

// API Configuration
const API_ENDPOINT = '/api/eugene-embed'

async function callEugeneAPI(body: Record<string, unknown>) {
  // Try Vercel API first
  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    if (response.ok) {
      return await response.json()
    }
    
    // If not 404, throw the error
    if (response.status !== 404) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || `API error: ${response.status}`)
    }
  } catch (err) {
    // If fetch failed entirely (CORS, network), try Supabase
    console.log('Vercel API not available, trying Supabase...')
  }
  
  // Try Supabase Edge Function
  const { data, error } = await supabase.functions.invoke('eugene-embed', { body })
  
  if (error) {
    throw new Error(error.message)
  }
  
  return data
}

/**
 * Store content in Eugene's memory with embedding
 */
export async function storeMemory(params: {
  content: string
  content_type: ContentType
  content_id?: string
  title?: string
  platform?: PlatformId | 'general'
  metadata?: Record<string, unknown>
  importance_score?: number
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const result = await callEugeneAPI({
      action: 'embed_and_store',
      ...params
    })
    
    return { success: true, id: result.id }
  } catch (error) {
    console.error('Failed to store memory:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Search Eugene's memory semantically
 */
export async function searchMemory(params: {
  query: string
  match_count?: number
  filter_type?: ContentType
  filter_platform?: PlatformId | 'general'
  min_importance?: number
}): Promise<SearchResult[]> {
  try {
    const result = await callEugeneAPI({
      action: 'search',
      ...params
    })
    
    return result.results || []
  } catch (error) {
    console.error('Failed to search memory:', error)
    return []
  }
}

/**
 * Store a post in Eugene's memory
 */
export async function storePostMemory(post: Post): Promise<boolean> {
  // Build content string from post
  let content = ''
  let title = ''
  
  if (post.platform === 'linkedin') {
    const linkedInPost = post as any
    title = linkedInPost.content?.hook?.slice(0, 100) || linkedInPost.title || 'LinkedIn Post'
    content = [
      linkedInPost.content?.hook,
      linkedInPost.content?.text,
      linkedInPost.content?.cta,
      linkedInPost.content?.bulletPoints?.join('\n')
    ].filter(Boolean).join('\n\n')
  } else if (post.platform === 'youtube') {
    const ytPost = post as any
    title = ytPost.content?.title || 'YouTube Video'
    content = [
      ytPost.content?.title,
      ytPost.content?.description,
      ytPost.content?.tags?.join(', ')
    ].filter(Boolean).join('\n\n')
  } else if (post.platform === 'instagram') {
    const igPost = post as any
    title = igPost.content?.caption?.slice(0, 100) || 'Instagram Post'
    content = igPost.content?.caption || ''
  } else if (post.platform === 'skool') {
    const skoolPost = post as any
    title = skoolPost.content?.title || 'Skool Post'
    content = [
      skoolPost.content?.title,
      skoolPost.content?.body
    ].filter(Boolean).join('\n\n')
  }
  
  if (!content || content.length < 10) {
    return false
  }
  
  // Calculate importance based on performance
  let importance = 0.5
  if (post.metrics) {
    const metrics = post.metrics as any
    const engagement = (metrics.likes || 0) + (metrics.comments || 0) * 2 + (metrics.shares || 0) * 3
    const impressions = metrics.impressions || metrics.views || 1
    const engagementRate = engagement / impressions
    
    // Higher engagement = higher importance (0.5 - 1.0)
    importance = Math.min(1.0, 0.5 + engagementRate * 10)
  }
  
  // Winner posts get high importance
  if ((post as any).performanceRating === 'winner') {
    importance = Math.max(importance, 0.9)
  }
  
  const result = await storeMemory({
    content,
    content_type: 'post',
    content_id: post.id,
    title,
    platform: post.platform,
    metadata: {
      status: post.status,
      metrics: post.metrics,
      performanceRating: (post as any).performanceRating,
      publishedAt: post.publishedAt
    },
    importance_score: importance
  })
  
  return result.success
}

/**
 * Store a learning in Eugene's memory
 */
export async function storeLearningMemory(learning: {
  id: string
  postId?: string
  platform: PlatformId
  keyInsight: string
  whatWorked?: string
  whatDidntWork?: string
  applyToFuture?: string
  outcome?: 'exceeded' | 'met' | 'missed'
}): Promise<boolean> {
  const content = [
    `Key Insight: ${learning.keyInsight}`,
    learning.whatWorked && `What Worked: ${learning.whatWorked}`,
    learning.whatDidntWork && `What Didn't Work: ${learning.whatDidntWork}`,
    learning.applyToFuture && `Apply to Future: ${learning.applyToFuture}`
  ].filter(Boolean).join('\n\n')
  
  // Learnings with clear outcomes and future applications are more important
  let importance = 0.6
  if (learning.outcome === 'exceeded') importance = 0.9
  if (learning.applyToFuture) importance = Math.min(1.0, importance + 0.1)
  
  const result = await storeMemory({
    content,
    content_type: 'learning',
    content_id: learning.id,
    title: learning.keyInsight.slice(0, 100),
    platform: learning.platform,
    metadata: {
      postId: learning.postId,
      outcome: learning.outcome
    },
    importance_score: importance
  })
  
  return result.success
}

/**
 * Store a conversation message
 */
export async function storeConversationMemory(params: {
  context_type: 'post_creation' | 'post_editing' | 'learning' | 'general' | 'analysis'
  context_id?: string
  role: 'user' | 'assistant'
  content: string
}): Promise<boolean> {
  try {
    // Generate embedding
    const embedResult = await callEugeneAPI({
      action: 'embed_content',
      content: params.content
    })
    
    if (!embedResult.success) {
      throw new Error('Failed to generate embedding')
    }
    
    // Store in database
    const { error } = await supabase
      .from('eugene_conversations')
      .insert({
        user_id: SINGLE_USER_ID,
        ...params,
        embedding: embedResult.embedding
      })
    
    if (error) throw error
    return true
  } catch (error) {
    console.error('Failed to store conversation:', error)
    return false
  }
}

/**
 * Search through past conversations
 */
export async function searchConversations(params: {
  query: string
  match_count?: number
  context_type?: string
}): Promise<ConversationMessage[]> {
  try {
    // Generate query embedding
    const embedResult = await callEugeneAPI({
      action: 'embed_content',
      content: params.query
    })
    
    if (!embedResult.success) {
      return []
    }
    
    // Search conversations
    const { data, error } = await supabase.rpc('search_eugene_conversations', {
      query_embedding: embedResult.embedding,
      match_count: params.match_count || 10,
      filter_context_type: params.context_type || null
    })
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Failed to search conversations:', error)
    return []
  }
}

/**
 * Get relevant context for Eugene based on current task
 * This is the "Smart Context Builder" that selects the most relevant memories
 */
export async function getRelevantContext(params: {
  currentIdea?: string
  currentContent?: string
  platform: PlatformId
  contextType: 'writing' | 'editing' | 'learning' | 'general'
  maxTokens?: number
}): Promise<{
  relevantPosts: SearchResult[]
  relevantLearnings: SearchResult[]
  relevantConversations: ConversationMessage[]
}> {
  const { currentIdea, currentContent, platform, maxTokens: _maxTokens = 4000 } = params
  void _maxTokens // Reserved for future token budget management
  
  // Build search query from current context
  const searchQuery = [currentIdea, currentContent].filter(Boolean).join('\n').slice(0, 500)
  
  if (!searchQuery) {
    // No context, return recent important memories
    const recentPosts = await searchMemory({
      query: `Best performing ${platform} posts`,
      match_count: 5,
      filter_type: 'post',
      filter_platform: platform,
      min_importance: 0.6
    })
    
    const recentLearnings = await searchMemory({
      query: `Important ${platform} learnings and insights`,
      match_count: 5,
      filter_type: 'learning',
      filter_platform: platform,
      min_importance: 0.6
    })
    
    return {
      relevantPosts: recentPosts,
      relevantLearnings: recentLearnings,
      relevantConversations: []
    }
  }
  
  // Search for relevant content
  const [posts, learnings, conversations] = await Promise.all([
    searchMemory({
      query: searchQuery,
      match_count: 5,
      filter_type: 'post',
      filter_platform: platform
    }),
    searchMemory({
      query: searchQuery,
      match_count: 5,
      filter_type: 'learning',
      filter_platform: platform
    }),
    searchConversations({
      query: searchQuery,
      match_count: 3
    })
  ])
  
  return {
    relevantPosts: posts,
    relevantLearnings: learnings,
    relevantConversations: conversations
  }
}

/**
 * Sync all local posts to Eugene's memory (for migration/backfill)
 */
export async function syncPostsToMemory(posts: Post[]): Promise<{
  total: number
  synced: number
  failed: number
}> {
  let synced = 0
  let failed = 0
  
  for (const post of posts) {
    // Only sync published posts with content
    if (post.status !== 'published') continue
    
    const success = await storePostMemory(post)
    if (success) {
      synced++
    } else {
      failed++
    }
    
    // Rate limit - don't overwhelm the API
    await new Promise(resolve => setTimeout(resolve, 200))
  }
  
  return {
    total: posts.length,
    synced,
    failed
  }
}

/**
 * Check if Eugene's memory system is available
 */
export async function isMemorySystemAvailable(): Promise<boolean> {
  try {
    // Try a simple operation
    const { error } = await supabase
      .from('eugene_memory')
      .select('id')
      .limit(1)
    
    return !error
  } catch {
    return false
  }
}
