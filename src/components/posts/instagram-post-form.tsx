import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { PostSidebar } from './post-sidebar'
import { CopyTextButton } from '@/components/shared/copy-button'
import { usePostsStore } from '@/lib/store'
import type { InstagramPost, WorkflowStatusId, ContentTagId } from '@/lib/types'

const POST_TYPES = [
  { id: 'post', name: 'Feed Post' },
  { id: 'reel', name: 'Reel' },
  { id: 'story', name: 'Story' },
  { id: 'carousel', name: 'Carousel' },
] as const

export function InstagramPostForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromCalendar = searchParams.get('from') === 'calendar'
  const [post, setPost] = useState<InstagramPost | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const storePost = usePostsStore((state) => state.posts.find(p => p.id === id)) as InstagramPost | undefined
  const updateStorePost = usePostsStore((state) => state.updatePost)
  const deleteStorePost = usePostsStore((state) => state.deletePost)
  
  const handleBack = () => {
    if (fromCalendar) {
      navigate('/calendar')
    } else {
      navigate('/boards?platform=instagram')
    }
  }

  useEffect(() => {
    if (storePost) {
      setPost(storePost)
    } else {
      setPost({
        id: id || `ig-new-${Date.now()}`,
        platform: 'instagram',
        status: 'idea',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: {
          caption: '',
          type: 'post',
          hashtags: [],
          location: ''
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

  const updateContent = (field: string, value: string | string[]) => {
    setPost({
      ...post,
      content: { ...post.content, [field]: value },
      updatedAt: new Date().toISOString()
    })
  }

  const getFullCaption = () => {
    let caption = post.content.caption || ''
    if (post.content.hashtags?.length) {
      caption += '\n\n' + post.content.hashtags.map(h => `#${h}`).join(' ')
    }
    return caption
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
              {post.content.caption ? 'Post bearbeiten' : 'Neuer Post'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <CopyTextButton text={getFullCaption()} label="Kopieren" />
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

        {/* Post Type */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label className="text-[13px]">Post-Typ:</Label>
              <div className="flex gap-2 flex-wrap">
                {POST_TYPES.map(type => (
                  <Button
                    key={type.id}
                    variant={post.content.type === type.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateContent('type', type.id)}
                  >
                    {type.name}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Caption */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Caption</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              value={post.content.caption || ''}
              onChange={(e) => updateContent('caption', e.target.value)}
              placeholder="Caption eingeben..."
              className="min-h-[200px]"
            />
            <p className="text-[11px] text-gray-400 mt-2">
              {post.content.caption?.length || 0}/2200 Zeichen
            </p>
          </CardContent>
        </Card>

        {/* Hashtags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Hashtags</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              value={post.content.hashtags?.join(' ') || ''}
              onChange={(e) => updateContent('hashtags', e.target.value.split(/[\s,]+/).map(h => h.replace('#', '').trim()).filter(Boolean))}
              placeholder="Hashtags eingeben (mit oder ohne #)..."
              className="min-h-[80px]"
            />
            <p className="text-[11px] text-gray-400 mt-2">
              {post.content.hashtags?.length || 0}/30 Hashtags (max. 30 erlaubt)
            </p>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Standort</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Input
              value={post.content.location || ''}
              onChange={(e) => updateContent('location', e.target.value)}
              placeholder="Standort eingeben (optional)..."
            />
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-[14px]">Vorschau</CardTitle>
              <CopyTextButton text={getFullCaption()} label="Kopieren" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-[13px] text-gray-700 leading-relaxed">
              {getFullCaption() || 'Beginne mit dem Schreiben...'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <PostSidebar
        platform="instagram"
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
