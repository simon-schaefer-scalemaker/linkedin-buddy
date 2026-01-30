import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Filter, Linkedin, Youtube, Instagram, GraduationCap, BarChart3, Upload, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { KanbanBoard } from '@/components/kanban/kanban-board'
import { ImportPostWizard } from '@/components/posts/import-post-wizard'
import { PostLearningDialog } from '@/components/posts/post-learning-dialog'
import { LearningReminderBadge } from '@/components/posts/learning-reminder-badge'
import { QuickPostGenerator } from '@/components/posts/quick-post-generator'
import { usePostsStore } from '@/lib/store'
import { PLATFORMS, PLATFORM_ORDER } from '@/lib/constants'
import type { Post, WorkflowStatusId, PlatformId, LinkedInPost, YouTubePost, InstagramPost, SkoolPost } from '@/lib/types'
import { cn } from '@/lib/utils'
import { differenceInDays } from 'date-fns'
import { sendSlackNotification, getSlackWebhookUrl } from '@/lib/slack-notifications'

const platformIcons = {
  linkedin: Linkedin,
  youtube: Youtube,
  instagram: Instagram,
  skool: GraduationCap
}

const platformLabels = {
  linkedin: { singular: 'Post', plural: 'Posts' },
  youtube: { singular: 'Video', plural: 'Videos' },
  instagram: { singular: 'Post', plural: 'Posts' },
  skool: { singular: 'Post', plural: 'Posts' }
}

export function BoardsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentPlatform = (searchParams.get('platform') as PlatformId) || 'linkedin'
  const [importWizardOpen, setImportWizardOpen] = useState(false)
  const [learningDialogOpen, setLearningDialogOpen] = useState(false)
  const [selectedPostForLearning, setSelectedPostForLearning] = useState<Post | null>(null)
  const [quickGeneratorOpen, setQuickGeneratorOpen] = useState(false)
  
  // Get posts from global store
  const allPosts = usePostsStore((state) => state.posts)
  const updatePost = usePostsStore((state) => state.updatePost)
  const addPost = usePostsStore((state) => state.addPost)
  const deletePost = usePostsStore((state) => state.deletePost)
  
  // Filter posts by current platform
  const posts = allPosts.filter(p => p.platform === currentPlatform)

  // Check for posts needing metrics and send Slack notification
  useEffect(() => {
    const checkAndNotify = async () => {
      // Only run if Slack is configured
      if (!getSlackWebhookUrl()) return
      
      // Find all posts needing metrics (across all platforms)
      const postsNeedingMetrics = allPosts
        .filter(post => {
          if (post.status !== 'published' || !post.publishedAt) return false
          const daysSincePublished = differenceInDays(new Date(), new Date(post.publishedAt))
          const hasMetrics = post.metrics && Object.values(post.metrics).some(v => v && v > 0)
          return daysSincePublished >= 7 && !hasMetrics
        })
        .map(post => {
          // Extract title based on platform
          let title = ''
          if (post.platform === 'linkedin') {
            title = (post as LinkedInPost).content.hook?.slice(0, 50) || 'LinkedIn Post'
          } else if (post.platform === 'youtube') {
            title = (post as YouTubePost).content.title || 'YouTube Video'
          } else if (post.platform === 'instagram') {
            title = (post as InstagramPost).content.caption?.slice(0, 50) || 'Instagram Post'
          } else {
            title = (post as SkoolPost).content.title || 'Skool Post'
          }
          
          return {
            id: post.id,
            platform: post.platform,
            title,
            publishedAt: post.publishedAt!,
            daysAgo: differenceInDays(new Date(), new Date(post.publishedAt!))
          }
        })
      
      if (postsNeedingMetrics.length > 0) {
        await sendSlackNotification(postsNeedingMetrics, window.location.origin + '/boards')
      }
    }
    
    checkAndNotify()
  }, [allPosts])

  const handlePlatformChange = (platform: PlatformId) => {
    setSearchParams({ platform })
  }

  const handlePostClick = (post: Post) => {
    navigate(`/boards/${post.platform}/${post.id}`)
  }

  const handlePostsChange = (updatedPosts: Post[]) => {
    // Find which posts changed and update them in the store
    updatedPosts.forEach(updatedPost => {
      const originalPost = allPosts.find(p => p.id === updatedPost.id)
      if (!originalPost || JSON.stringify(originalPost) !== JSON.stringify(updatedPost)) {
        updatePost(updatedPost.id, updatedPost)
      }
    })
    
    // Check for new posts (duplicates)
    updatedPosts.forEach(post => {
      if (!allPosts.find(p => p.id === post.id)) {
        addPost(post)
      }
    })
  }

  const handleNewPost = (status: WorkflowStatusId) => {
    const id = `${currentPlatform.slice(0, 2)}-new-${Date.now()}`
    let newPost: Post
    
    switch (currentPlatform) {
      case 'linkedin':
        newPost = {
          id,
          platform: 'linkedin',
          status,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          content: { text: '' }
        } as LinkedInPost
        break
      case 'youtube':
        newPost = {
          id,
          platform: 'youtube',
          status,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          content: { title: '', description: '', isShort: false }
        } as YouTubePost
        break
      case 'instagram':
        newPost = {
          id,
          platform: 'instagram',
          status,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          content: { caption: '', type: 'post' }
        } as InstagramPost
        break
      case 'skool':
        newPost = {
          id,
          platform: 'skool',
          status,
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          content: { title: '', body: '' }
        } as SkoolPost
        break
      default:
        return
    }
    
    addPost(newPost)
    navigate(`/boards/${currentPlatform}/${id}`)
  }

  const handleDeletePost = (postId: string) => {
    deletePost(postId)
  }
  const platformData = PLATFORMS[currentPlatform]
  const Icon = platformIcons[currentPlatform]
  const labels = platformLabels[currentPlatform]

  // Find posts that need metrics (published > 7 days ago, no metrics)
  const postsNeedingMetrics = posts.filter(post => {
    if (post.status !== 'published' || !post.publishedAt) return false
    const daysSincePublished = differenceInDays(new Date(), new Date(post.publishedAt))
    const hasMetrics = post.metrics && Object.values(post.metrics).some(v => v && v > 0)
    return daysSincePublished >= 7 && !hasMetrics
  })

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] -my-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
        <div className="flex items-center gap-3 sm:gap-4">
          <div 
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shadow-lg shrink-0"
            style={{ backgroundColor: platformData.color }}
          >
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight">Content Boards</h1>
            <p className="text-xs sm:text-sm text-neutral-500">{posts.length} {labels.plural}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setImportWizardOpen(true)} className="hidden sm:inline-flex">
            <Upload className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Import</span>
          </Button>
          <Button variant="outline" size="sm" className="hidden sm:inline-flex">
            <Filter className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Filter</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setQuickGeneratorOpen(true)}
            className="gap-2 bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100 dark:bg-purple-500/10 dark:border-purple-500/30 dark:text-purple-400 dark:hover:bg-purple-500/20"
          >
            <Wand2 className="h-4 w-4" />
            <span className="hidden sm:inline">AI Generieren</span>
          </Button>
          <Button size="sm" onClick={() => handleNewPost('idea')}>
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{labels.singular} erstellen</span>
            <span className="sm:hidden">Neu</span>
          </Button>
        </div>
      </div>

      {/* Platform Selector */}
      <div className="flex gap-1.5 sm:gap-2 mb-4 shrink-0 overflow-x-auto pb-1 -mx-1 px-1">
        {PLATFORM_ORDER.map((platform) => {
          const PlatformIcon = platformIcons[platform]
          const isActive = platform === currentPlatform
          const pData = PLATFORMS[platform]
          
          return (
            <button
              key={platform}
              onClick={() => handlePlatformChange(platform)}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 shrink-0",
                isActive 
                  ? "text-white shadow-lg" 
                  : cn(
                    "border text-neutral-600 hover:text-neutral-900",
                    "bg-white border-neutral-200 hover:border-neutral-300",
                    "dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white"
                  )
              )}
              style={isActive ? { backgroundColor: pData.color } : undefined}
            >
              <PlatformIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{pData.name}</span>
            </button>
          )
        })}
      </div>

      {/* Metrics Reminder Alert */}
      {postsNeedingMetrics.length > 0 && (
        <div className={cn(
          "mb-4 shrink-0 rounded-xl p-4 flex items-center justify-between",
          "bg-amber-50 border border-amber-200",
          "dark:bg-amber-500/10 dark:border-amber-500/30"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              "bg-amber-100 dark:bg-amber-500/20"
            )}>
              <BarChart3 className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                {postsNeedingMetrics.length} {postsNeedingMetrics.length === 1 ? 'Post braucht' : 'Posts brauchen'} Performance-Daten
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500/80">
                Trage die Metriken ein um von der AI zu lernen
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "border-amber-300 text-amber-700 hover:bg-amber-100",
              "dark:border-amber-500/50 dark:text-amber-400 dark:hover:bg-amber-500/20 dark:hover:text-amber-300"
            )}
            onClick={() => navigate(`/boards/${currentPlatform}/${postsNeedingMetrics[0].id}`)}
          >
            Jetzt eintragen
          </Button>
        </div>
      )}

      {/* Learning Reminder */}
      <LearningReminderBadge
        platform={currentPlatform}
        onOpenLearning={(post) => {
          setSelectedPostForLearning(post)
          setLearningDialogOpen(true)
        }}
        className="mb-4 shrink-0"
      />

      {/* Kanban Board */}
      <div className="flex-1 min-h-0">
        <TooltipProvider>
          <KanbanBoard
            posts={posts}
            platform={currentPlatform}
            onPostsChange={handlePostsChange}
            onPostClick={handlePostClick}
            onNewPost={handleNewPost}
            onDeletePost={handleDeletePost}
          />
        </TooltipProvider>
      </div>

      {/* Import Wizard */}
      <ImportPostWizard 
        open={importWizardOpen} 
        onOpenChange={setImportWizardOpen} 
      />
      
      {/* Learning Dialog */}
      {selectedPostForLearning && (
        <PostLearningDialog
          open={learningDialogOpen}
          onOpenChange={(open) => {
            setLearningDialogOpen(open)
            if (!open) setSelectedPostForLearning(null)
          }}
          post={selectedPostForLearning}
        />
      )}
      
      {/* Quick Post Generator */}
      <QuickPostGenerator
        open={quickGeneratorOpen}
        onOpenChange={setQuickGeneratorOpen}
        platform={currentPlatform}
        onPostGenerated={(content, hookType, topic) => {
          // Create new post with generated content
          const newId = `${currentPlatform}-${Date.now()}`
          const now = new Date().toISOString()
          
          let newPost: Post
          
          switch (currentPlatform) {
            case 'linkedin':
              newPost = {
                id: newId,
                platform: 'linkedin',
                status: 'draft',
                tags: [],
                createdAt: now,
                updatedAt: now,
                hookType,
                topic,
                content: {
                  text: content,
                  hook: content.split('\n')[0] || ''
                }
              } as LinkedInPost
              break
            case 'youtube':
              newPost = {
                id: newId,
                platform: 'youtube',
                status: 'draft',
                tags: [],
                createdAt: now,
                updatedAt: now,
                hookType,
                topic,
                content: {
                  title: content.split('\n')[0] || '',
                  description: content,
                  isShort: false
                }
              } as YouTubePost
              break
            case 'instagram':
              newPost = {
                id: newId,
                platform: 'instagram',
                status: 'draft',
                tags: [],
                createdAt: now,
                updatedAt: now,
                hookType,
                topic,
                content: {
                  caption: content,
                  type: 'post'
                }
              } as InstagramPost
              break
            case 'skool':
              newPost = {
                id: newId,
                platform: 'skool',
                status: 'draft',
                tags: [],
                createdAt: now,
                updatedAt: now,
                hookType,
                topic,
                content: {
                  title: content.split('\n')[0] || '',
                  body: content
                }
              } as SkoolPost
              break
          }
          
          addPost(newPost)
          
          // Navigate to the new post for editing
          navigate(`/boards/${currentPlatform}/${newId}`)
        }}
      />
    </div>
  )
}
