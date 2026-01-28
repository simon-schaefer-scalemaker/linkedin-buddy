import { create } from 'zustand'
import { supabase, invokeFunction, SINGLE_USER_ID } from '@/lib/supabase'
import type { Post } from '@/types/database'

interface PostsState {
  posts: Post[]
  loading: boolean
  fetchPosts: () => Promise<void>
  addPost: (body: string, publishedAt: string, url?: string) => Promise<{ data: Post | null; error: Error | null }>
  updatePostMetrics: (
    postId: string,
    metrics: { impressions: number; engagements: number; comments?: number; reposts?: number }
  ) => Promise<{ error: Error | null }>
  deletePost: (postId: string) => Promise<{ error: Error | null }>
  importPosts: (posts: Array<{ body: string; published_at: string; impressions?: number; engagements?: number }>) => Promise<{ error: Error | null }>
}

export const usePostsStore = create<PostsState>((set, get) => ({
  posts: [],
  loading: false,

  fetchPosts: async () => {
    set({ loading: true })
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', SINGLE_USER_ID)
        .order('published_at', { ascending: false })

      if (error) throw error
      set({ posts: data || [] })
    } catch (error) {
      console.error('Failed to fetch posts:', error)
    } finally {
      set({ loading: false })
    }
  },

  addPost: async (body: string, publishedAt: string, url?: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: SINGLE_USER_ID,
          body,
          published_at: publishedAt,
          url,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      // Trigger feature extraction
      invokeFunction('extract-features', { post_id: data.id })

      // Update local state
      set(state => ({ posts: [data, ...state.posts] }))
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error as Error }
    }
  },

  updatePostMetrics: async (postId, metrics) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .update({
          impressions: metrics.impressions,
          engagements: metrics.engagements,
          comments: metrics.comments,
          reposts: metrics.reposts,
          status: 'complete',
          updated_at: new Date().toISOString()
        })
        .eq('id', postId)
        .select()
        .single()

      if (error) throw error

      // Update local state
      set(state => ({
        posts: state.posts.map(p => p.id === postId ? data : p)
      }))

      // Trigger pattern analysis
      invokeFunction('analyze-patterns', { user_id: SINGLE_USER_ID })

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  deletePost: async (postId) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error

      set(state => ({
        posts: state.posts.filter(p => p.id !== postId)
      }))

      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  },

  importPosts: async (posts) => {
    try {
      const postsToInsert = posts.map(p => ({
        user_id: SINGLE_USER_ID,
        body: p.body,
        published_at: p.published_at,
        impressions: p.impressions,
        engagements: p.engagements,
        status: p.impressions ? 'pending' : 'metrics_needed'
      }))

      const { data, error } = await supabase
        .from('posts')
        .insert(postsToInsert)
        .select()

      if (error) throw error

      // Trigger feature extraction for each post
      for (const post of data || []) {
        invokeFunction('extract-features', { post_id: post.id })
      }

      await get().fetchPosts()
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }
}))
