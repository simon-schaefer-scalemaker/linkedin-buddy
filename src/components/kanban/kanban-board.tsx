import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { KANBAN_COLUMNS } from '@/lib/constants'
import type { Post, WorkflowStatusId, PlatformId } from '@/lib/types'

interface KanbanBoardProps {
  posts: Post[]
  platform: PlatformId
  onPostsChange: (posts: Post[]) => void
  onPostClick: (post: Post) => void
  onNewPost: (status: WorkflowStatusId) => void
  onDeletePost?: (postId: string) => void
}

export function KanbanBoard({
  posts,
  platform: _platform,
  onPostsChange,
  onPostClick,
  onNewPost,
  onDeletePost,
}: KanbanBoardProps) {
  // Platform is available for future platform-specific filtering
  void _platform
  const [activePost, setActivePost] = useState<Post | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const getPostsByStatus = (status: WorkflowStatusId): Post[] => {
    return posts.filter(post => post.status === status)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const post = posts.find(p => p.id === active.id)
    if (post) {
      setActivePost(post)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActivePost(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the active post
    const activePost = posts.find(p => p.id === activeId)
    if (!activePost) return

    // Helper to update post with status-specific fields
    const updatePostStatus = (post: Post, newStatus: WorkflowStatusId): Post => {
      const updates: Partial<Post> = { status: newStatus }
      
      // Set publishedAt when moving to published
      if (newStatus === 'published' && !post.publishedAt) {
        updates.publishedAt = new Date().toISOString()
      }
      
      // Set scheduledFor when moving to scheduled (if not already set)
      if (newStatus === 'scheduled' && !post.scheduledFor) {
        updates.scheduledFor = new Date().toISOString()
      }
      
      // Clear publishedAt if moving away from published
      if (newStatus !== 'published' && post.publishedAt) {
        updates.publishedAt = undefined
      }
      
      return { ...post, ...updates } as Post
    }

    // Check if dropped on a column (status)
    if (KANBAN_COLUMNS.includes(overId as WorkflowStatusId)) {
      // Update the post's status
      const updatedPosts = posts.map(post =>
        post.id === activeId
          ? updatePostStatus(post, overId as WorkflowStatusId)
          : post
      )
      onPostsChange(updatedPosts)
      return
    }

    // Check if dropped on another post
    const overPost = posts.find(p => p.id === overId)
    if (overPost) {
      // If same status, reorder
      if (activePost.status === overPost.status) {
        const statusPosts = getPostsByStatus(activePost.status)
        const oldIndex = statusPosts.findIndex(p => p.id === activeId)
        const newIndex = statusPosts.findIndex(p => p.id === overId)
        
        if (oldIndex !== newIndex) {
          const reorderedStatusPosts = arrayMove(statusPosts, oldIndex, newIndex)
          const otherPosts = posts.filter(p => p.status !== activePost.status)
          onPostsChange([...otherPosts, ...reorderedStatusPosts])
        }
      } else {
        // Different status, move to new status
        const updatedPosts = posts.map(post =>
          post.id === activeId
            ? updatePostStatus(post, overPost.status)
            : post
        )
        onPostsChange(updatedPosts)
      }
    }
  }

  const handleDuplicate = (post: Post) => {
    const newPost: Post = {
      ...post,
      id: `${post.id}-copy-${Date.now()}`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: undefined,
      scheduledFor: undefined,
      metrics: undefined,
    } as Post
    onPostsChange([...posts, newPost])
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 h-full">
        {KANBAN_COLUMNS.map(status => (
          <KanbanColumn
            key={status}
            status={status}
            posts={getPostsByStatus(status)}
            onPostClick={onPostClick}
            onNewPost={onNewPost}
            onDeletePost={onDeletePost}
            onDuplicatePost={handleDuplicate}
          />
        ))}
      </div>

      <DragOverlay>
        {activePost && (
          <div className="w-[260px]">
            <KanbanCard post={activePost} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
