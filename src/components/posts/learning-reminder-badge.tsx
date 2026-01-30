/**
 * Learning Reminder - zeigt Posts an, die ein Learning brauchen
 * Erscheint 7+ Tage nach Veröffentlichung wenn kein Learning erfasst wurde
 */

import { useState } from 'react'
import { differenceInDays } from 'date-fns'
import { Lightbulb, X, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePostsStore } from '@/lib/store'
import { useLearningsStore } from '@/stores/learningsStore'
import type { Post, PlatformId } from '@/lib/types'
import { cn } from '@/lib/utils'

interface LearningReminderBadgeProps {
  platform?: PlatformId
  onOpenLearning: (post: Post) => void
  className?: string
}

export function LearningReminderBadge({ platform, onOpenLearning, className }: LearningReminderBadgeProps) {
  const [dismissed, setDismissed] = useState<string[]>([])
  
  const allPosts = usePostsStore((state) => state.posts)
  const getLearningForPost = useLearningsStore((state) => state.getLearningForPost)
  
  // Finde Posts die ein Learning brauchen
  const postsNeedingLearning = allPosts.filter(post => {
    // Filter by platform if specified
    if (platform && post.platform !== platform) return false
    
    // Must be published
    if (post.status !== 'published' || !post.publishedAt) return false
    
    // Must be at least 7 days old
    const daysSincePublished = differenceInDays(new Date(), new Date(post.publishedAt))
    if (daysSincePublished < 7) return false
    
    // Must not have a learning yet
    const hasLearning = !!getLearningForPost(post.id)
    if (hasLearning) return false
    
    // Must not be dismissed
    if (dismissed.includes(post.id)) return false
    
    // Must have metrics (otherwise not much to learn from)
    const hasMetrics = post.metrics && Object.values(post.metrics).some(v => v && v > 0)
    if (!hasMetrics) return false
    
    return true
  })
  
  if (postsNeedingLearning.length === 0) return null
  
  // Get post preview
  const getPostPreview = (post: Post) => {
    const content = post.content as any
    if (content.hook) return content.hook.slice(0, 50)
    if (content.text) return content.text.slice(0, 50)
    if (content.title) return content.title.slice(0, 50)
    if (content.caption) return content.caption.slice(0, 50)
    return 'Post'
  }
  
  const topPost = postsNeedingLearning[0]
  const remaining = postsNeedingLearning.length - 1
  
  return (
    <div className={cn(
      "rounded-xl p-4 flex items-center justify-between gap-4",
      "bg-amber-50 border border-amber-200",
      "dark:bg-amber-500/10 dark:border-amber-500/30",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
          "bg-amber-100 dark:bg-amber-500/20"
        )}>
          <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {postsNeedingLearning.length} {postsNeedingLearning.length === 1 ? 'Post braucht' : 'Posts brauchen'} ein Learning
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-0.5">
            "{getPostPreview(topPost)}..."
            {remaining > 0 && ` und ${remaining} weitere`}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-500/20"
          onClick={() => setDismissed([...dismissed, topPost.id])}
        >
          <X className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
          onClick={() => onOpenLearning(topPost)}
        >
          Learning erfassen
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Kleine Badge-Version für die Kanban-Karte
interface LearningNeededBadgeProps {
  post: Post
  onClick: () => void
}

export function LearningNeededBadge({ post, onClick }: LearningNeededBadgeProps) {
  const getLearningForPost = useLearningsStore((state) => state.getLearningForPost)
  
  // Check if learning is needed
  if (post.status !== 'published' || !post.publishedAt) return null
  
  const daysSincePublished = differenceInDays(new Date(), new Date(post.publishedAt))
  if (daysSincePublished < 7) return null
  
  const hasLearning = !!getLearningForPost(post.id)
  if (hasLearning) return null
  
  const hasMetrics = post.metrics && Object.values(post.metrics).some(v => v && v > 0)
  if (!hasMetrics) return null
  
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick() }}
      className={cn(
        "absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center",
        "bg-amber-500 text-white shadow-lg",
        "animate-pulse hover:animate-none hover:scale-110 transition-transform"
      )}
    >
      <Lightbulb className="h-3 w-3" />
    </button>
  )
}
