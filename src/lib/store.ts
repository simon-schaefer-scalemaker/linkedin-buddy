import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Post, PlatformId, WorkflowStatusId } from './types'
import { MOCK_POSTS } from './mock-data'

interface PostsStore {
  posts: Post[]
  
  // Actions
  updatePost: (id: string, updates: Partial<Post>) => void
  updatePostStatus: (id: string, status: WorkflowStatusId) => void
  addPost: (post: Post) => void
  deletePost: (id: string) => void
  getPostsByPlatform: (platform: PlatformId) => Post[]
  getPostById: (id: string) => Post | undefined
}

// Goals/OKR Store
export interface PlatformGoal {
  platform: PlatformId
  weeklyTarget: number
  enabled: boolean
}

interface GoalsStore {
  goals: PlatformGoal[]
  updateGoal: (platform: PlatformId, updates: Partial<PlatformGoal>) => void
  getGoal: (platform: PlatformId) => PlatformGoal | undefined
}

export const useGoalsStore = create<GoalsStore>()(
  persist(
    (set, get) => ({
      goals: [
        { platform: 'linkedin', weeklyTarget: 3, enabled: true },
        { platform: 'youtube', weeklyTarget: 1, enabled: true },
        { platform: 'instagram', weeklyTarget: 5, enabled: true },
        { platform: 'skool', weeklyTarget: 2, enabled: true },
      ],
      
      updateGoal: (platform, updates) => {
        set((state) => ({
          goals: state.goals.map((goal) =>
            goal.platform === platform ? { ...goal, ...updates } : goal
          )
        }))
      },
      
      getGoal: (platform) => {
        return get().goals.find((goal) => goal.platform === platform)
      }
    }),
    {
      name: 'content-os-goals'
    }
  )
)

export const usePostsStore = create<PostsStore>((set, get) => ({
  posts: [...MOCK_POSTS],
  
  updatePost: (id, updates) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === id ? { ...post, ...updates, updatedAt: new Date().toISOString() } : post
      ) as Post[]
    }))
  },
  
  updatePostStatus: (id, status) => {
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id !== id) return post
        
        const updates: Partial<Post> = { 
          status, 
          updatedAt: new Date().toISOString() 
        }
        
        // Set publishedAt when moving to published
        if (status === 'published' && !post.publishedAt) {
          updates.publishedAt = new Date().toISOString()
        }
        
        // Set scheduledFor when moving to scheduled (if not already set)
        if (status === 'scheduled' && !post.scheduledFor) {
          updates.scheduledFor = new Date().toISOString()
        }
        
        // Clear publishedAt if moving away from published
        if (status !== 'published' && post.publishedAt) {
          updates.publishedAt = undefined
        }
        
        return { ...post, ...updates }
      }) as Post[]
    }))
  },
  
  addPost: (post) => {
    set((state) => ({
      posts: [...state.posts, post]
    }))
  },
  
  deletePost: (id) => {
    set((state) => ({
      posts: state.posts.filter((post) => post.id !== id)
    }))
  },
  
  getPostsByPlatform: (platform) => {
    return get().posts.filter((post) => post.platform === platform)
  },
  
  getPostById: (id) => {
    return get().posts.find((post) => post.id === id)
  }
}))
