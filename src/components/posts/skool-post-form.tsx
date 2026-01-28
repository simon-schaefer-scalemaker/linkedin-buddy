import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, Pin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { PostSidebar } from './post-sidebar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePostsStore } from '@/lib/store'
import type { SkoolPost, WorkflowStatusId, ContentTagId } from '@/lib/types'
import { cn } from '@/lib/utils'

const SKOOL_CATEGORIES = [
  'Announcements',
  'General',
  'Questions',
  'Training',
  'Resources',
  'Wins',
  'Introductions',
]

export function SkoolPostForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromCalendar = searchParams.get('from') === 'calendar'
  const [post, setPost] = useState<SkoolPost | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const storePost = usePostsStore((state) => state.posts.find(p => p.id === id)) as SkoolPost | undefined
  const updateStorePost = usePostsStore((state) => state.updatePost)
  const deleteStorePost = usePostsStore((state) => state.deletePost)
  
  const handleBack = () => {
    if (fromCalendar) {
      navigate('/calendar')
    } else {
      navigate('/boards?platform=skool')
    }
  }

  useEffect(() => {
    if (storePost) {
      setPost(storePost)
    } else {
      setPost({
        id: id || `sk-new-${Date.now()}`,
        platform: 'skool',
        status: 'idea',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: {
          title: '',
          body: '',
          category: '',
          isPinned: false
        }
      })
    }
  }, [id, storePost])

  if (!post) return null

  const handleSave = async () => {
    setIsSaving(true)
    updateStorePost(post.id, post)
    await new Promise(resolve => setTimeout(resolve, 300))
    setIsSaving(false)
  }
  
  const handleDelete = () => {
    if (confirm('Post wirklich löschen?')) {
      deleteStorePost(post.id)
      handleBack()
    }
  }

  const updateContent = (field: string, value: string | boolean) => {
    setPost({
      ...post,
      content: { ...post.content, [field]: value },
      updatedAt: new Date().toISOString()
    })
  }

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-[18px] font-medium text-gray-900">
              {post.content.title ? 'Post bearbeiten' : 'Neuer Post'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={post.content.isPinned ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateContent('isPinned', !post.content.isPinned)}
            >
              <Pin className={cn("h-4 w-4 mr-2", post.content.isPinned && "fill-current")} />
              {post.content.isPinned ? 'Angepinnt' : 'Anpinnen'}
            </Button>
            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Speichert...' : 'Speichern'}
            </Button>
          </div>
        </div>

        {/* Category */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Kategorie</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Select
              value={post.content.category || ''}
              onValueChange={(value) => updateContent('category', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategorie wählen..." />
              </SelectTrigger>
              <SelectContent>
                {SKOOL_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Title */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Titel</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Input
              value={post.content.title || ''}
              onChange={(e) => updateContent('title', e.target.value)}
              placeholder="Post-Titel eingeben..."
            />
          </CardContent>
        </Card>

        {/* Body */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Inhalt</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              value={post.content.body || ''}
              onChange={(e) => updateContent('body', e.target.value)}
              placeholder="Post-Inhalt eingeben..."
              className="min-h-[300px]"
            />
            <p className="text-[11px] text-gray-400 mt-2">
              Markdown wird unterstützt
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <PostSidebar
        platform="skool"
        status={post.status}
        tags={post.tags}
        scheduledFor={post.scheduledFor}
        createdAt={post.createdAt}
        updatedAt={post.updatedAt}
        onStatusChange={(status: WorkflowStatusId) => {
          const updated = { ...post, status }
          setPost(updated)
          updateStorePost(post.id, updated)
        }}
        onTagsChange={(tags: ContentTagId[]) => {
          const updated = { ...post, tags }
          setPost(updated)
          updateStorePost(post.id, updated)
        }}
        onScheduledForChange={(date) => {
          const updated = { 
            ...post, 
            scheduledFor: date?.toISOString(),
            status: date ? 'scheduled' as WorkflowStatusId : post.status
          }
          setPost(updated)
          updateStorePost(post.id, updated)
        }}
      />
    </div>
  )
}
