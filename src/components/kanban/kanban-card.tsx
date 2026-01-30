import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Calendar, MoreHorizontal, MessageSquare, Eye, Heart } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TagBadge } from '@/components/shared/tag-select'
import type { Post } from '@/lib/types'
import { cn } from '@/lib/utils'

interface KanbanCardProps {
  post: Post
  onClick?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
}

export function KanbanCard({ post, onClick, onDelete, onDuplicate }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: post.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  // Get post title/content preview
  const getPreview = () => {
    // First check for explicit title field on post itself
    if ('title' in post && (post as any).title) {
      return (post as any).title
    }
    if ('content' in post) {
      if ('title' in post.content && post.content.title) {
        return post.content.title
      }
      if ('text' in post.content && post.content.text) {
        return post.content.text.slice(0, 80)
      }
      if ('caption' in post.content && post.content.caption) {
        return post.content.caption.slice(0, 80)
      }
      if ('body' in post.content && post.content.body) {
        return post.content.body.slice(0, 80)
      }
    }
    return 'Untitled Post'
  }

  // Get metrics if available
  const metrics = 'metrics' in post && post.metrics ? post.metrics : null

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "group cursor-pointer transition-all duration-200 overflow-hidden",
        // Light mode hover
        "hover:border-neutral-300 hover:bg-neutral-50",
        // Dark mode hover
        "dark:hover:border-neutral-700 dark:hover:bg-neutral-800/50",
        isDragging && "opacity-50 shadow-2xl rotate-1 scale-105"
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="p-3.5 overflow-hidden">
        {/* Header with menu */}
        <div className="flex items-start justify-between mb-2 min-w-0">
          <p className="text-sm font-medium text-neutral-900 dark:text-white leading-snug flex-1 pr-2 line-clamp-2 break-all min-w-0">
            {getPreview()}
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className={cn(
              "bg-white border-neutral-200",
              "dark:bg-neutral-900 dark:border-neutral-800"
            )}>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onClick?.() }}
                className={cn(
                  "text-neutral-700 focus:text-neutral-900 focus:bg-neutral-100",
                  "dark:text-neutral-300 dark:focus:text-white dark:focus:bg-neutral-800"
                )}
              >
                Bearbeiten
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDuplicate?.() }}
                className={cn(
                  "text-neutral-700 focus:text-neutral-900 focus:bg-neutral-100",
                  "dark:text-neutral-300 dark:focus:text-white dark:focus:bg-neutral-800"
                )}
              >
                Duplizieren
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-neutral-200 dark:bg-neutral-800" />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete?.() }}
                className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:text-red-400 dark:focus:text-red-300 dark:focus:bg-red-500/10"
              >
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {post.tags.slice(0, 2).map(tag => (
              <TagBadge key={tag} tag={tag} />
            ))}
            {post.tags.length > 2 && (
              <span className="text-[10px] text-neutral-500 px-1">+{post.tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-neutral-500">
          {/* Scheduled Date */}
          {post.scheduledFor ? (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {format(new Date(post.scheduledFor), "d. MMM", { locale: de })}
            </span>
          ) : (
            <span>{format(new Date(post.createdAt), "d. MMM", { locale: de })}</span>
          )}

          {/* Metrics */}
          {metrics && (
            <div className="flex items-center gap-2.5">
              {'views' in metrics && metrics.views !== undefined && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {metrics.views > 1000 ? `${(metrics.views / 1000).toFixed(1)}k` : metrics.views}
                </span>
              )}
              {'impressions' in metrics && metrics.impressions !== undefined && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {metrics.impressions > 1000 ? `${(metrics.impressions / 1000).toFixed(1)}k` : metrics.impressions}
                </span>
              )}
              {'likes' in metrics && metrics.likes !== undefined && (
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {metrics.likes}
                </span>
              )}
              {'comments' in metrics && metrics.comments !== undefined && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {metrics.comments}
                </span>
              )}
            </div>
          )}
        </div>
        
      </div>
    </Card>
  )
}
