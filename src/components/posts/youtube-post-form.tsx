import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
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
import type { YouTubePost, WorkflowStatusId, ContentTagId } from '@/lib/types'

const YOUTUBE_CATEGORIES = [
  'Education',
  'Entertainment',
  'Gaming',
  'How-to & Style',
  'Music',
  'News & Politics',
  'People & Blogs',
  'Science & Technology',
  'Sports',
]

export function YouTubePostForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromCalendar = searchParams.get('from') === 'calendar'
  const [post, setPost] = useState<YouTubePost | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const storePost = usePostsStore((state) => state.posts.find(p => p.id === id)) as YouTubePost | undefined
  const updateStorePost = usePostsStore((state) => state.updatePost)
  const deleteStorePost = usePostsStore((state) => state.deletePost)
  
  const handleBack = () => {
    if (fromCalendar) {
      navigate('/calendar')
    } else {
      navigate('/boards?platform=youtube')
    }
  }

  useEffect(() => {
    if (storePost) {
      setPost(storePost)
    } else {
      setPost({
        id: id || `yt-new-${Date.now()}`,
        platform: 'youtube',
        status: 'idea',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: {
          title: '',
          description: '',
          tags: [],
          category: '',
          isShort: false
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
    if (confirm('Video wirklich löschen?')) {
      deleteStorePost(post.id)
      handleBack()
    }
  }

  const updateContent = (field: string, value: string | string[] | boolean) => {
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
              {post.content.title ? 'Video bearbeiten' : 'Neues Video'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
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

        {/* Video Type */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="text-[13px]">Video-Typ:</Label>
              <div className="flex gap-2">
                <Button
                  variant={!post.content.isShort ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateContent('isShort', false)}
                >
                  Long-Form
                </Button>
                <Button
                  variant={post.content.isShort ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateContent('isShort', true)}
                >
                  YouTube Short
                </Button>
              </div>
            </div>
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
              placeholder="Video-Titel eingeben..."
            />
            <p className="text-[11px] text-gray-400 mt-2">
              {post.content.title?.length || 0}/100 Zeichen (max. empfohlen)
            </p>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Beschreibung</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              value={post.content.description || ''}
              onChange={(e) => updateContent('description', e.target.value)}
              placeholder="Video-Beschreibung..."
              className="min-h-[200px]"
            />
          </CardContent>
        </Card>

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
                {YOUTUBE_CATEGORIES.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Video-Tags</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Input
              value={post.content.tags?.join(', ') || ''}
              onChange={(e) => updateContent('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
              placeholder="Tags (kommagetrennt), z.B. Tutorial, How-to"
            />
            <p className="text-[11px] text-gray-400 mt-2">
              5-15 relevante Tags empfohlen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <PostSidebar
        platform="youtube"
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
