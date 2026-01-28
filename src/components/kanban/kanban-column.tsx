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
  onDuplicatePost
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const statusData = WORKFLOW_STATUSES[status]

  return (
    <div 
      className={cn(
        "flex flex-col flex-1 min-w-0 bg-gray-50/50 rounded-xl border border-gray-100",
        isOver && "border-gray-300 bg-gray-100/50"
      )}
    >
      {/* Column Header */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base">{statusData.emoji}</span>
            <h3 className="text-[13px] font-medium text-gray-900">{statusData.name}</h3>
            <span className="text-[11px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              {posts.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-gray-400 hover:text-gray-600"
            onClick={() => onNewPost(status)}
          >
            <Plus className="h-4 w-4" />
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
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-[12px] text-gray-400 mb-2">Keine Posts</p>
              <Button
                variant="ghost"
                size="sm"
                className="text-[12px] text-gray-500"
                onClick={() => onNewPost(status)}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Hinzufügen
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
