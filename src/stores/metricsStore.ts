import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  LinkedInWeeklyMetrics, 
  YouTubeWeeklyMetrics, 
  InstagramWeeklyMetrics, 
  SkoolWeeklyMetrics,
  WeeklyCheckInData
} from '@/lib/types'
import { getWeekNumber, getWeekStart } from '@/lib/utils'

interface MetricsState {
  // Stored metrics per platform
  linkedinMetrics: LinkedInWeeklyMetrics[]
  youtubeMetrics: YouTubeWeeklyMetrics[]
  instagramMetrics: InstagramWeeklyMetrics[]
  skoolMetrics: SkoolWeeklyMetrics[]
  
  // Actions
  addLinkedInMetrics: (metrics: Omit<LinkedInWeeklyMetrics, 'id' | 'createdAt' | 'updatedAt' | 'platform'>) => void
  addYouTubeMetrics: (metrics: Omit<YouTubeWeeklyMetrics, 'id' | 'createdAt' | 'updatedAt' | 'platform'>) => void
  addInstagramMetrics: (metrics: Omit<InstagramWeeklyMetrics, 'id' | 'createdAt' | 'updatedAt' | 'platform'>) => void
  addSkoolMetrics: (metrics: Omit<SkoolWeeklyMetrics, 'id' | 'createdAt' | 'updatedAt' | 'platform'>) => void
  
  // Bulk save from check-in
  saveWeeklyCheckIn: (data: WeeklyCheckInData) => void
  
  // Getters
  getMetricsForWeek: (year: number, weekNumber: number) => {
    linkedin: LinkedInWeeklyMetrics | undefined
    youtube: YouTubeWeeklyMetrics | undefined
    instagram: InstagramWeeklyMetrics | undefined
    skool: SkoolWeeklyMetrics | undefined
  }
  
  getLatestMetrics: () => {
    linkedin: LinkedInWeeklyMetrics | undefined
    youtube: YouTubeWeeklyMetrics | undefined
    instagram: InstagramWeeklyMetrics | undefined
    skool: SkoolWeeklyMetrics | undefined
  }
  
  hasMetricsForCurrentWeek: () => boolean
}

export const useMetricsStore = create<MetricsState>()(
  persist(
    (set, get) => ({
      linkedinMetrics: [],
      youtubeMetrics: [],
      instagramMetrics: [],
      skoolMetrics: [],
      
      addLinkedInMetrics: (metrics) => {
        const now = new Date().toISOString()
        const newMetrics: LinkedInWeeklyMetrics = {
          ...metrics,
          id: `li-${metrics.year}-${metrics.weekNumber}`,
          platform: 'linkedin',
          createdAt: now,
          updatedAt: now,
        }
        
        set((state) => {
          // Update existing or add new
          const existing = state.linkedinMetrics.findIndex(
            m => m.year === metrics.year && m.weekNumber === metrics.weekNumber
          )
          if (existing >= 0) {
            const updated = [...state.linkedinMetrics]
            updated[existing] = { ...newMetrics, createdAt: state.linkedinMetrics[existing].createdAt }
            return { linkedinMetrics: updated }
          }
          return { linkedinMetrics: [...state.linkedinMetrics, newMetrics] }
        })
      },
      
      addYouTubeMetrics: (metrics) => {
        const now = new Date().toISOString()
        const newMetrics: YouTubeWeeklyMetrics = {
          ...metrics,
          id: `yt-${metrics.year}-${metrics.weekNumber}`,
          platform: 'youtube',
          createdAt: now,
          updatedAt: now,
        }
        
        set((state) => {
          const existing = state.youtubeMetrics.findIndex(
            m => m.year === metrics.year && m.weekNumber === metrics.weekNumber
          )
          if (existing >= 0) {
            const updated = [...state.youtubeMetrics]
            updated[existing] = { ...newMetrics, createdAt: state.youtubeMetrics[existing].createdAt }
            return { youtubeMetrics: updated }
          }
          return { youtubeMetrics: [...state.youtubeMetrics, newMetrics] }
        })
      },
      
      addInstagramMetrics: (metrics) => {
        const now = new Date().toISOString()
        const newMetrics: InstagramWeeklyMetrics = {
          ...metrics,
          id: `ig-${metrics.year}-${metrics.weekNumber}`,
          platform: 'instagram',
          createdAt: now,
          updatedAt: now,
        }
        
        set((state) => {
          const existing = state.instagramMetrics.findIndex(
            m => m.year === metrics.year && m.weekNumber === metrics.weekNumber
          )
          if (existing >= 0) {
            const updated = [...state.instagramMetrics]
            updated[existing] = { ...newMetrics, createdAt: state.instagramMetrics[existing].createdAt }
            return { instagramMetrics: updated }
          }
          return { instagramMetrics: [...state.instagramMetrics, newMetrics] }
        })
      },
      
      addSkoolMetrics: (metrics) => {
        const now = new Date().toISOString()
        const newMetrics: SkoolWeeklyMetrics = {
          ...metrics,
          id: `sk-${metrics.year}-${metrics.weekNumber}`,
          platform: 'skool',
          createdAt: now,
          updatedAt: now,
        }
        
        set((state) => {
          const existing = state.skoolMetrics.findIndex(
            m => m.year === metrics.year && m.weekNumber === metrics.weekNumber
          )
          if (existing >= 0) {
            const updated = [...state.skoolMetrics]
            updated[existing] = { ...newMetrics, createdAt: state.skoolMetrics[existing].createdAt }
            return { skoolMetrics: updated }
          }
          return { skoolMetrics: [...state.skoolMetrics, newMetrics] }
        })
      },
      
      saveWeeklyCheckIn: (data) => {
        const { year, weekNumber, weekStart } = data
        
        // Calculate growth by comparing to previous week
        const prevWeek = get().getMetricsForWeek(
          weekNumber === 1 ? year - 1 : year,
          weekNumber === 1 ? 52 : weekNumber - 1
        )
        
        // LinkedIn
        if (!data.linkedin.skipped) {
          const followerGrowth = prevWeek.linkedin?.followers && data.linkedin.followers
            ? data.linkedin.followers - prevWeek.linkedin.followers
            : undefined
          const engagementRate = data.linkedin.impressions && data.linkedin.engagement
            ? (data.linkedin.engagement / data.linkedin.impressions) * 100
            : undefined
            
          get().addLinkedInMetrics({
            year,
            weekNumber,
            weekStart,
            skipped: false,
            followers: data.linkedin.followers,
            impressions: data.linkedin.impressions,
            engagement: data.linkedin.engagement,
            profileViews: data.linkedin.profileViews,
            followerGrowth,
            engagementRate,
            notes: data.linkedin.notes,
          })
        } else {
          get().addLinkedInMetrics({ year, weekNumber, weekStart, skipped: true })
        }
        
        // YouTube
        if (!data.youtube.skipped) {
          const subscriberGrowth = prevWeek.youtube?.subscribers && data.youtube.subscribers
            ? data.youtube.subscribers - prevWeek.youtube.subscribers
            : undefined
            
          get().addYouTubeMetrics({
            year,
            weekNumber,
            weekStart,
            skipped: false,
            subscribers: data.youtube.subscribers,
            views: data.youtube.views,
            watchTimeHours: data.youtube.watchTimeHours,
            avgViewDurationSeconds: data.youtube.avgViewDurationSeconds,
            subscriberGrowth,
            notes: data.youtube.notes,
          })
        } else {
          get().addYouTubeMetrics({ year, weekNumber, weekStart, skipped: true })
        }
        
        // Instagram
        if (!data.instagram.skipped) {
          const followerGrowth = prevWeek.instagram?.followers && data.instagram.followers
            ? data.instagram.followers - prevWeek.instagram.followers
            : undefined
          const engagementRate = data.instagram.reach && data.instagram.engagement
            ? (data.instagram.engagement / data.instagram.reach) * 100
            : undefined
            
          get().addInstagramMetrics({
            year,
            weekNumber,
            weekStart,
            skipped: false,
            followers: data.instagram.followers,
            reach: data.instagram.reach,
            engagement: data.instagram.engagement,
            saves: data.instagram.saves,
            profileVisits: data.instagram.profileVisits,
            followerGrowth,
            engagementRate,
            notes: data.instagram.notes,
          })
        } else {
          get().addInstagramMetrics({ year, weekNumber, weekStart, skipped: true })
        }
        
        // Skool
        if (!data.skool.skipped) {
          const memberGrowth = prevWeek.skool?.members && data.skool.members
            ? data.skool.members - prevWeek.skool.members
            : undefined
          const activityRate = data.skool.members && data.skool.activeMembers
            ? (data.skool.activeMembers / data.skool.members) * 100
            : undefined
            
          get().addSkoolMetrics({
            year,
            weekNumber,
            weekStart,
            skipped: false,
            members: data.skool.members,
            activeMembers: data.skool.activeMembers,
            postViews: data.skool.postViews,
            comments: data.skool.comments,
            memberGrowth,
            activityRate,
            notes: data.skool.notes,
          })
        } else {
          get().addSkoolMetrics({ year, weekNumber, weekStart, skipped: true })
        }
      },
      
      getMetricsForWeek: (year, weekNumber) => {
        const state = get()
        return {
          linkedin: state.linkedinMetrics.find(m => m.year === year && m.weekNumber === weekNumber),
          youtube: state.youtubeMetrics.find(m => m.year === year && m.weekNumber === weekNumber),
          instagram: state.instagramMetrics.find(m => m.year === year && m.weekNumber === weekNumber),
          skool: state.skoolMetrics.find(m => m.year === year && m.weekNumber === weekNumber),
        }
      },
      
      getLatestMetrics: () => {
        const state = get()
        const sortByWeek = <T extends { year: number; weekNumber: number }>(arr: T[]) =>
          [...arr].sort((a, b) => b.year - a.year || b.weekNumber - a.weekNumber)[0]
        
        return {
          linkedin: sortByWeek(state.linkedinMetrics),
          youtube: sortByWeek(state.youtubeMetrics),
          instagram: sortByWeek(state.instagramMetrics),
          skool: sortByWeek(state.skoolMetrics),
        }
      },
      
      hasMetricsForCurrentWeek: () => {
        const now = new Date()
        const year = now.getFullYear()
        const weekNumber = getWeekNumber(now)
        const metrics = get().getMetricsForWeek(year, weekNumber)
        
        return !!(metrics.linkedin || metrics.youtube || metrics.instagram || metrics.skool)
      },
    }),
    {
      name: 'metrics-storage',
    }
  )
)
