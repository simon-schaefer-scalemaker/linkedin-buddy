import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { KanbanCard } from './kanban-card'
import { WORKFLOW_STATUSES } from '@/lib/constants'
import type { Post, WorkflowStatusId } from '@/lib/types'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
  status: WorkflowStatusId
  posts: Post[]
  onPostClick: (post: Post) => void
  onNewPost: (status: WorkflowStatusId) => void
  onDeletePost?: (postId: string) => void
  onDuplicatePost?: (post: Post) => void
}

export function KanbanColumn({ 
  status, 
  posts, 
  onPostClick, 
  onNewPost,
  onDeletePost,
  onDuplicatePost,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const statusData = WORKFLOW_STATUSES[status]

  return (
    <div 
      className={cn(
        "flex flex-col flex-1 min-w-0 rounded-xl border transition-all duration-200",
        // Light mode
        "bg-neutral-50 border-neutral-200",
        // Dark mode
        "dark:bg-neutral-900/40 dark:border-neutral-800/50",
        // Hover state
        isOver && "border-neutral-400 bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-800/50"
      )}
    >
      {/* Column Header */}
      <div className="p-2.5 border-b border-neutral-200 dark:border-neutral-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">{statusData.emoji}</span>
            <h3 className="text-[13px] font-medium text-neutral-900 dark:text-white">{statusData.name}</h3>
            <span className={cn(
              "text-[11px] px-1.5 py-0.5 rounded-full",
              "text-neutral-600 bg-neutral-200",
              "dark:text-neutral-500 dark:bg-neutral-800"
            )}>
              {posts.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onNewPost(status)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Column Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div 
          ref={setNodeRef}
          className="p-2 space-y-2"
        >
          <SortableContext items={posts.map(p => p.id)} strategy={verticalListSortingStrategy}>
            {posts.map(post => (
              <KanbanCard
                key={post.id}
                post={post}
                onClick={() => onPostClick(post)}
                onDelete={() => onDeletePost?.(post.id)}
                onDuplicate={() => onDuplicatePost?.(post)}
              />
            ))}
          </SortableContext>

          {posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <p className="text-xs text-neutral-500 dark:text-neutral-600 mb-3">Keine Posts</p>
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => onNewPost(status)}
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Hinzufügen
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
