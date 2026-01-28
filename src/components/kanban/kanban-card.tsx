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
        "group cursor-pointer hover:border-gray-300 transition-all",
        isDragging && "opacity-50 shadow-lg rotate-2"
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="p-3">
        {/* Header with menu */}
        <div className="flex items-start justify-between mb-2">
          <p className="text-[13px] font-medium text-gray-900 leading-snug flex-1 pr-2">
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onClick?.() }}>
                Bearbeiten
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate?.() }}>
                Duplizieren
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete?.() }}
                className="text-red-600"
              >
                Löschen
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {post.tags.slice(0, 2).map(tag => (
              <TagBadge key={tag} tag={tag} />
            ))}
            {post.tags.length > 2 && (
              <span className="text-[10px] text-gray-400">+{post.tags.length - 2}</span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-gray-400">
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
            <div className="flex items-center gap-2">
              {'views' in metrics && metrics.views !== undefined && (
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />
                  {metrics.views > 1000 ? `${(metrics.views / 1000).toFixed(1)}k` : metrics.views}
                </span>
              )}
              {'impressions' in metrics && metrics.impressions !== undefined && (
                <span className="flex items-center gap-0.5">
                  <Eye className="h-3 w-3" />
                  {metrics.impressions > 1000 ? `${(metrics.impressions / 1000).toFixed(1)}k` : metrics.impressions}
                </span>
              )}
              {'likes' in metrics && metrics.likes !== undefined && (
                <span className="flex items-center gap-0.5">
                  <Heart className="h-3 w-3" />
                  {metrics.likes}
                </span>
              )}
              {'comments' in metrics && metrics.comments !== undefined && (
                <span className="flex items-center gap-0.5">
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
