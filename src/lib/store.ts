import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Post, PlatformId, WorkflowStatusId } from './types'
import { MOCK_POSTS } from './mock-data'
import { supabase, SINGLE_USER_ID } from './supabase'

// =============================================
// SUPABASE HELPERS
// =============================================

function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return !!(url && key && !url.includes('placeholder'))
}

// Convert Post to DB format (store full Post as JSON in content field)
function postToDb(post: Post & { title?: string }) {
  // Extract a simple title from the post
  let title = 'Untitled'
  
  // First check for explicit title field
  if ((post as any).title) {
    title = (post as any).title
  } else if ('content' in post && post.content) {
    if (typeof post.content === 'string') {
      title = (post.content as string).slice(0, 100)
    } else if ('text' in post.content) {
      title = post.content.text?.slice(0, 100) || 'Untitled'
    } else if ('title' in post.content) {
      title = post.content.title || 'Untitled'
    } else if ('caption' in post.content) {
      title = post.content.caption?.slice(0, 100) || 'Untitled'
    }
  }
  
  return {
    id: post.id,
    user_id: SINGLE_USER_ID,
    title: title,
    platform: post.platform,
    status: post.status,
    content: JSON.stringify(post), // Store full post as JSON
    tags: post.tags || [],
    scheduled_for: post.scheduledFor || null,
    published_at: post.publishedAt || null,
    created_at: post.createdAt,
    updated_at: post.updatedAt,
  }
}

// Convert DB record to Post
function dbToPost(db: { content: string }): Post | null {
  try {
    return JSON.parse(db.content) as Post
  } catch {
    return null
  }
}

// Sync single post to Supabase
async function syncPostToSupabase(post: Post, action: 'upsert' | 'delete') {
  if (!isSupabaseConfigured()) return
  
  try {
    if (action === 'delete') {
      await supabase.from('content_posts').delete().eq('id', post.id)
    } else {
      const dbPost = postToDb(post)
      const { error } = await supabase
        .from('content_posts')
        .upsert(dbPost, { onConflict: 'id' })
      
      if (error) throw error
    }
  } catch (err) {
    console.error(`Failed to ${action} post in Supabase:`, err)
  }
}

interface PostsStore {
  posts: Post[]
  isSupabaseLoaded: boolean
  
  // Actions
  updatePost: (id: string, updates: Partial<Post>) => void
  updatePostStatus: (id: string, status: WorkflowStatusId) => void
  addPost: (post: Post) => void
  deletePost: (id: string) => void
  getPostsByPlatform: (platform: PlatformId) => Post[]
  getPostById: (id: string) => Post | undefined
  
  // Supabase sync
  loadFromSupabase: () => Promise<void>
  syncAllToSupabase: () => Promise<void>
}

// Goals/OKR Store
export interface PlatformGoal {
  platform: PlatformId
  weeklyTarget: number
  enabled: boolean
}

// Sync goal to Supabase
async function syncGoalToSupabase(goal: PlatformGoal) {
  if (!isSupabaseConfigured()) return
  
  try {
    const { error } = await supabase
      .from('goals')
      .upsert({
        user_id: SINGLE_USER_ID,
        platform: goal.platform,
        weekly_target: goal.weeklyTarget,
        enabled: goal.enabled,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,platform' })
    
    if (error) throw error
  } catch (err) {
    console.error('Failed to sync goal to Supabase:', err)
  }
}

interface GoalsStore {
  goals: PlatformGoal[]
  updateGoal: (platform: PlatformId, updates: Partial<PlatformGoal>) => void
  getGoal: (platform: PlatformId) => PlatformGoal | undefined
  loadFromSupabase: () => Promise<void>
}

const DEFAULT_GOALS: PlatformGoal[] = [
  { platform: 'linkedin', weeklyTarget: 3, enabled: true },
  { platform: 'youtube', weeklyTarget: 1, enabled: true },
  { platform: 'instagram', weeklyTarget: 5, enabled: true },
  { platform: 'skool', weeklyTarget: 2, enabled: true },
]

export const useGoalsStore = create<GoalsStore>()(
  persist(
    (set, get) => ({
      goals: [...DEFAULT_GOALS],
      
      updateGoal: (platform, updates) => {
        let updatedGoal: PlatformGoal | null = null
        set((state) => ({
          goals: state.goals.map((goal) => {
            if (goal.platform === platform) {
              updatedGoal = { ...goal, ...updates }
              return updatedGoal
            }
            return goal
          })
        }))
        if (updatedGoal) syncGoalToSupabase(updatedGoal)
      },
      
      getGoal: (platform) => {
        return get().goals.find((goal) => goal.platform === platform)
      },
      
      loadFromSupabase: async () => {
        if (!isSupabaseConfigured()) return
        
        try {
          const { data, error } = await supabase
            .from('goals')
            .select('*')
            .eq('user_id', SINGLE_USER_ID)
          
          if (error) throw error
          
          if (data && data.length > 0) {
            const goals: PlatformGoal[] = data.map(g => ({
              platform: g.platform as PlatformId,
              weeklyTarget: g.weekly_target,
              enabled: g.enabled,
            }))
            set({ goals })
            console.log(`✅ Loaded ${goals.length} goals from Supabase`)
          } else {
            // Sync defaults to Supabase
            for (const goal of get().goals) {
              await syncGoalToSupabase(goal)
            }
          }
        } catch (err) {
          console.error('Failed to load goals from Supabase:', err)
        }
      }
    }),
    {
      name: 'content-os-goals',
      version: 2,
      onRehydrateStorage: () => (state) => {
        if (state) {
          setTimeout(() => state.loadFromSupabase(), 800)
        }
      }
    }
  )
)

export const usePostsStore = create<PostsStore>()(
  persist(
    (set, get) => ({
      posts: [...MOCK_POSTS],
      isSupabaseLoaded: false,
      
      updatePost: (id, updates) => {
        const updatedPost = { 
          ...get().posts.find(p => p.id === id), 
          ...updates, 
          updatedAt: new Date().toISOString() 
        } as Post
        
        set((state) => ({
          posts: state.posts.map((post) =>
            post.id === id ? updatedPost : post
          ) as Post[]
        }))
        
        // Sync to Supabase in background
        syncPostToSupabase(updatedPost, 'upsert')
      },
      
      updatePostStatus: (id, status) => {
        let updatedPost: Post | null = null
        
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
            
            updatedPost = { ...post, ...updates } as Post
            return updatedPost
          }) as Post[]
        }))
        
        // Sync to Supabase in background
        if (updatedPost) {
          syncPostToSupabase(updatedPost, 'upsert')
        }
      },
      
      addPost: (post) => {
        set((state) => ({
          posts: [...state.posts, post]
        }))
        
        // Sync to Supabase in background
        syncPostToSupabase(post, 'upsert')
      },
      
      deletePost: (id) => {
        const postToDelete = get().posts.find(p => p.id === id)
        
        set((state) => ({
          posts: state.posts.filter((post) => post.id !== id)
        }))
        
        // Sync to Supabase in background
        if (postToDelete) {
          syncPostToSupabase(postToDelete, 'delete')
        }
      },
      
      getPostsByPlatform: (platform) => {
        return get().posts.filter((post) => post.platform === platform)
      },
      
      getPostById: (id) => {
        return get().posts.find((post) => post.id === id)
      },
      
      // Load posts from Supabase
      loadFromSupabase: async () => {
        if (!isSupabaseConfigured()) {
          console.log('📦 Supabase not configured, using local storage')
          return
        }
        
        try {
          const { data, error } = await supabase
            .from('content_posts')
            .select('content')
            .eq('user_id', SINGLE_USER_ID)
            .order('created_at', { ascending: false })
          
          if (error) throw error
          
          if (data && data.length > 0) {
            const posts = data
              .map(dbToPost)
              .filter((p): p is Post => p !== null)
            
            if (posts.length > 0) {
              set({ posts, isSupabaseLoaded: true })
              console.log(`✅ Loaded ${posts.length} posts from Supabase`)
            }
          } else {
            // No posts in Supabase, sync local posts
            console.log('📤 No posts in Supabase, syncing local posts...')
            await get().syncAllToSupabase()
            set({ isSupabaseLoaded: true })
          }
        } catch (err) {
          console.error('Failed to load from Supabase:', err)
        }
      },
      
      // Sync all local posts to Supabase
      syncAllToSupabase: async () => {
        if (!isSupabaseConfigured()) return
        
        const { posts } = get()
        console.log(`📤 Syncing ${posts.length} posts to Supabase...`)
        
        for (const post of posts) {
          await syncPostToSupabase(post, 'upsert')
        }
        
        console.log('✅ All posts synced to Supabase')
      }
    }),
    {
      name: 'content-os-posts',
      version: 2,
      onRehydrateStorage: () => (state) => {
        // After rehydration from localStorage, try to load from Supabase
        if (state) {
          setTimeout(() => {
            state.loadFromSupabase()
          }, 500)
        }
      }
    }
  )
)

// Templates Store
export type TemplateCategory = 'reply' | 'comment' | 'resource' | 'affiliate'

export interface Template {
  id: string
  category: TemplateCategory
  name: string
  content: string
  createdAt: string
  updatedAt: string
}

// Sync template to Supabase
async function syncTemplateToSupabase(template: Template, action: 'upsert' | 'delete') {
  if (!isSupabaseConfigured()) return
  
  try {
    if (action === 'delete') {
      await supabase.from('templates').delete().eq('id', template.id)
    } else {
      const { error } = await supabase
        .from('templates')
        .upsert({
          id: template.id,
          user_id: SINGLE_USER_ID,
          category: template.category,
          name: template.name,
          content: template.content,
          created_at: template.createdAt,
          updated_at: template.updatedAt,
        }, { onConflict: 'id' })
      
      if (error) throw error
    }
  } catch (err) {
    console.error(`Failed to ${action} template in Supabase:`, err)
  }
}

interface TemplatesStore {
  templates: Template[]
  addTemplate: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTemplate: (id: string, updates: Partial<Template>) => void
  deleteTemplate: (id: string) => void
  getTemplatesByCategory: (category: TemplateCategory) => Template[]
  loadFromSupabase: () => Promise<void>
}

const DEFAULT_TEMPLATES: Template[] = [
  // Default Reply Templates
  {
    id: 'reply-1',
    category: 'reply' as TemplateCategory,
    name: 'Leadmagnet Versand',
    content: `Hi [NAME]! :)

du wolltest die Ressource zu dem [LEADMAGNET] Workflow haben.

Here you go:

[VIDEO]

Hast du schonmal [SOLUTION] erstellt?

LG

Simon`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  // Default Comment Templates
  { id: 'comment-1', category: 'comment', name: 'Ist raus', content: 'Ist raus', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'comment-2', category: 'comment', name: 'Check deine Inbox', content: 'Check deine Inbox', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'comment-3', category: 'comment', name: 'Check deine DMs', content: 'Check deine DMs', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'comment-4', category: 'comment', name: 'Habs dir geschickt', content: 'Habs dir geschickt', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'comment-5', category: 'comment', name: 'Done', content: 'Done', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'comment-6', category: 'comment', name: 'Hast du die DM bekommen?', content: 'Hast du die DM bekommen?', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'comment-7', category: 'comment', name: 'Gesendet', content: 'Gesendet', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Default Resource Template
  { id: 'resource-1', category: 'resource', name: 'Workflow teilen', content: 'Hi [NAME], hier ist noch der Workflow kannst ihn einfach duplizieren:', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Default Affiliate Link
  { id: 'affiliate-1', category: 'affiliate', name: 'Weavy.ai', content: 'https://weavy.ai?ref=home', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

export const useTemplatesStore = create<TemplatesStore>()(
  persist(
    (set, get) => ({
      templates: [...DEFAULT_TEMPLATES],
      
      addTemplate: (template) => {
        const newTemplate: Template = {
          ...template,
          id: `template-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          templates: [...state.templates, newTemplate]
        }))
        syncTemplateToSupabase(newTemplate, 'upsert')
      },
      
      updateTemplate: (id, updates) => {
        let updatedTemplate: Template | null = null
        set((state) => ({
          templates: state.templates.map((template) => {
            if (template.id === id) {
              updatedTemplate = { ...template, ...updates, updatedAt: new Date().toISOString() }
              return updatedTemplate
            }
            return template
          })
        }))
        if (updatedTemplate) syncTemplateToSupabase(updatedTemplate, 'upsert')
      },
      
      deleteTemplate: (id) => {
        const templateToDelete = get().templates.find(t => t.id === id)
        set((state) => ({
          templates: state.templates.filter((template) => template.id !== id)
        }))
        if (templateToDelete) syncTemplateToSupabase(templateToDelete, 'delete')
      },
      
      getTemplatesByCategory: (category) => {
        return get().templates.filter((template) => template.category === category)
      },
      
      loadFromSupabase: async () => {
        if (!isSupabaseConfigured()) return
        
        try {
          const { data, error } = await supabase
            .from('templates')
            .select('*')
            .eq('user_id', SINGLE_USER_ID)
          
          if (error) throw error
          
          if (data && data.length > 0) {
            const templates: Template[] = data.map(t => ({
              id: t.id,
              category: t.category as TemplateCategory,
              name: t.name,
              content: t.content,
              createdAt: t.created_at,
              updatedAt: t.updated_at,
            }))
            set({ templates })
            console.log(`✅ Loaded ${templates.length} templates from Supabase`)
          } else {
            // Sync defaults to Supabase
            for (const template of get().templates) {
              await syncTemplateToSupabase(template, 'upsert')
            }
          }
        } catch (err) {
          console.error('Failed to load templates from Supabase:', err)
        }
      }
    }),
    {
      name: 'content-os-templates',
      version: 2,
      onRehydrateStorage: () => (state) => {
        if (state) {
          setTimeout(() => state.loadFromSupabase(), 600)
        }
      }
    }
  )
)

// Cutter Shares Store (Video Collaboration)
export type CutterShareStatus = 'pending' | 'in_progress' | 'completed'

export interface CutterShare {
  id: string
  postId: string
  postTitle: string
  password: string
  rawVideoUrl: string | null
  finalVideoUrl: string | null
  status: CutterShareStatus
  instructions: string
  cutterNotes: string
  createdAt: string
  updatedAt: string
}

interface CutterSharesStore {
  shares: CutterShare[]
  
  // Actions
  shareWithCutter: (postId: string, postTitle: string, password: string, rawVideoUrl: string, instructions?: string) => CutterShare
  updateShare: (id: string, updates: Partial<CutterShare>) => void
  updateShareStatus: (id: string, status: CutterShareStatus) => void
  setFinalVideo: (id: string, finalVideoUrl: string, cutterNotes?: string) => void
  deleteShare: (id: string) => void
  getShareById: (id: string) => CutterShare | undefined
  getShareByPostId: (postId: string) => CutterShare | undefined
  getSharesByPassword: (password: string) => CutterShare[]
  getPendingShares: () => CutterShare[]
}

export const useCutterSharesStore = create<CutterSharesStore>()(
  persist(
    (set, get) => ({
      shares: [],
      
      shareWithCutter: (postId, postTitle, password, rawVideoUrl, instructions = '') => {
        // Check if share already exists for this post
        const existingShare = get().getShareByPostId(postId)
        if (existingShare) {
          // Update existing share
          get().updateShare(existingShare.id, {
            password,
            rawVideoUrl,
            instructions,
            status: 'pending',
            finalVideoUrl: null,
            cutterNotes: ''
          })
          return get().getShareById(existingShare.id)!
        }
        
        const newShare: CutterShare = {
          id: `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          postId,
          postTitle,
          password,
          rawVideoUrl,
          finalVideoUrl: null,
          status: 'pending',
          instructions,
          cutterNotes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        set((state) => ({
          shares: [...state.shares, newShare]
        }))
        
        return newShare
      },
      
      updateShare: (id, updates) => {
        set((state) => ({
          shares: state.shares.map((share) =>
            share.id === id 
              ? { ...share, ...updates, updatedAt: new Date().toISOString() } 
              : share
          )
        }))
      },
      
      updateShareStatus: (id, status) => {
        set((state) => ({
          shares: state.shares.map((share) =>
            share.id === id 
              ? { ...share, status, updatedAt: new Date().toISOString() } 
              : share
          )
        }))
      },
      
      setFinalVideo: (id, finalVideoUrl, cutterNotes = '') => {
        set((state) => ({
          shares: state.shares.map((share) =>
            share.id === id 
              ? { 
                  ...share, 
                  finalVideoUrl, 
                  cutterNotes,
                  status: 'completed' as CutterShareStatus, 
                  updatedAt: new Date().toISOString() 
                } 
              : share
          )
        }))
      },
      
      deleteShare: (id) => {
        set((state) => ({
          shares: state.shares.filter((share) => share.id !== id)
        }))
      },
      
      getShareById: (id) => {
        return get().shares.find((share) => share.id === id)
      },
      
      getShareByPostId: (postId) => {
        return get().shares.find((share) => share.postId === postId)
      },
      
      getSharesByPassword: (password) => {
        return get().shares.filter((share) => share.password === password)
      },
      
      getPendingShares: () => {
        return get().shares.filter((share) => share.status !== 'completed')
      }
    }),
    {
      name: 'content-os-cutter-shares'
    }
  )
)

// Global Settings Store (Affiliate Links, Resource Template, etc.)
export interface AffiliateLink {
  id: string
  name: string
  url: string
  createdAt: string
}

// Sync affiliate link to Supabase
async function syncAffiliateLinkToSupabase(link: AffiliateLink, action: 'upsert' | 'delete') {
  if (!isSupabaseConfigured()) return
  
  try {
    if (action === 'delete') {
      await supabase.from('affiliate_links').delete().eq('id', link.id)
    } else {
      const { error } = await supabase
        .from('affiliate_links')
        .upsert({
          id: link.id,
          user_id: SINGLE_USER_ID,
          name: link.name,
          url: link.url,
          created_at: link.createdAt,
        }, { onConflict: 'id' })
      
      if (error) throw error
    }
  } catch (err) {
    console.error(`Failed to ${action} affiliate link in Supabase:`, err)
  }
}

// Sync resource template to Supabase
async function syncResourceTemplateToSupabase(template: string) {
  if (!isSupabaseConfigured()) return
  
  try {
    const { error } = await supabase
      .from('global_settings')
      .upsert({
        user_id: SINGLE_USER_ID,
        resource_template: template,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
    
    if (error) throw error
  } catch (err) {
    console.error('Failed to sync resource template to Supabase:', err)
  }
}

interface GlobalSettingsStore {
  // Affiliate Links
  affiliateLinks: AffiliateLink[]
  addAffiliateLink: (name: string, url: string) => void
  updateAffiliateLink: (id: string, updates: Partial<AffiliateLink>) => void
  deleteAffiliateLink: (id: string) => void
  
  // Resource Template
  resourceTemplate: string
  setResourceTemplate: (template: string) => void
  
  // Supabase sync
  loadFromSupabase: () => Promise<void>
}

const DEFAULT_RESOURCE_TEMPLATE = `Hey [NAME]! 🙂

Hier ist der Workflow, den du dir gewünscht hast – du kannst ihn direkt duplizieren:

[LINK]

Viel Spaß damit!`

export const useGlobalSettingsStore = create<GlobalSettingsStore>()(
  persist(
    (set, get) => ({
      affiliateLinks: [
        {
          id: 'default-1',
          name: 'Weavy.ai',
          url: 'https://weavy.ai?ref=simon',
          createdAt: new Date().toISOString()
        }
      ],
      
      addAffiliateLink: (name, url) => {
        const newLink: AffiliateLink = {
          id: `aff-${Date.now()}`,
          name,
          url,
          createdAt: new Date().toISOString()
        }
        set((state) => ({
          affiliateLinks: [...state.affiliateLinks, newLink]
        }))
        syncAffiliateLinkToSupabase(newLink, 'upsert')
      },
      
      updateAffiliateLink: (id, updates) => {
        let updatedLink: AffiliateLink | null = null
        set((state) => ({
          affiliateLinks: state.affiliateLinks.map((link) => {
            if (link.id === id) {
              updatedLink = { ...link, ...updates }
              return updatedLink
            }
            return link
          })
        }))
        if (updatedLink) syncAffiliateLinkToSupabase(updatedLink, 'upsert')
      },
      
      deleteAffiliateLink: (id) => {
        const linkToDelete = get().affiliateLinks.find(l => l.id === id)
        set((state) => ({
          affiliateLinks: state.affiliateLinks.filter((link) => link.id !== id)
        }))
        if (linkToDelete) syncAffiliateLinkToSupabase(linkToDelete, 'delete')
      },
      
      resourceTemplate: DEFAULT_RESOURCE_TEMPLATE,
      
      setResourceTemplate: (template) => {
        set({ resourceTemplate: template })
        syncResourceTemplateToSupabase(template)
      },
      
      loadFromSupabase: async () => {
        if (!isSupabaseConfigured()) return
        
        try {
          // Load affiliate links
          const { data: linksData } = await supabase
            .from('affiliate_links')
            .select('*')
            .eq('user_id', SINGLE_USER_ID)
          
          if (linksData && linksData.length > 0) {
            const affiliateLinks: AffiliateLink[] = linksData.map(l => ({
              id: l.id,
              name: l.name,
              url: l.url,
              createdAt: l.created_at,
            }))
            set({ affiliateLinks })
            console.log(`✅ Loaded ${affiliateLinks.length} affiliate links from Supabase`)
          } else {
            // Sync defaults to Supabase
            for (const link of get().affiliateLinks) {
              await syncAffiliateLinkToSupabase(link, 'upsert')
            }
          }
          
          // Load resource template
          const { data: settingsData } = await supabase
            .from('global_settings')
            .select('resource_template')
            .eq('user_id', SINGLE_USER_ID)
            .single()
          
          if (settingsData?.resource_template) {
            set({ resourceTemplate: settingsData.resource_template })
            console.log('✅ Loaded resource template from Supabase')
          } else {
            await syncResourceTemplateToSupabase(get().resourceTemplate)
          }
        } catch (err) {
          console.error('Failed to load global settings from Supabase:', err)
        }
      }
    }),
    {
      name: 'content-os-global-settings',
      version: 2,
      onRehydrateStorage: () => (state) => {
        if (state) {
          setTimeout(() => state.loadFromSupabase(), 700)
        }
      }
    }
  )
)
