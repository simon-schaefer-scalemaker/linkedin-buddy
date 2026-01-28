import { create } from 'zustand'
import { supabase, SINGLE_USER_ID } from '@/lib/supabase'
import type { Profile } from '@/types/database'

interface AuthState {
  profile: Profile | null
  loading: boolean
  initialized: boolean
  initialize: () => Promise<void>
  fetchProfile: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>
}

// Default profile for single-user mode
const defaultProfile: Profile = {
  id: SINGLE_USER_ID,
  email: null,
  name: 'User',
  avatar_url: null,
  content_goals: [],
  preferred_formats: [],
  excluded_topics: [],
  learning_mode: 'bootstrap',
  model_confidence: 0.3,
  prediction_accuracy: 0.5,
  total_posts: 0,
  avg_engagement_rate: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  loading: false,
  initialized: false,

  initialize: async () => {
    await get().fetchProfile()
    set({ initialized: true })
  },

  fetchProfile: async () => {
    set({ loading: true })
    try {
      // Try to get existing profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', SINGLE_USER_ID)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert(defaultProfile)
          .select()
          .single()

        if (insertError) {
          console.error('Failed to create profile:', insertError)
          set({ profile: defaultProfile })
        } else {
          set({ profile: newProfile })
        }
      } else if (error) {
        console.error('Failed to fetch profile:', error)
        set({ profile: defaultProfile })
      } else {
        set({ profile: data })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      set({ profile: defaultProfile })
    } finally {
      set({ loading: false })
    }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', SINGLE_USER_ID)
        .select()
        .single()

      if (error) throw error
      set({ profile: data })
      return { error: null }
    } catch (error) {
      return { error: error as Error }
    }
  }
}))
