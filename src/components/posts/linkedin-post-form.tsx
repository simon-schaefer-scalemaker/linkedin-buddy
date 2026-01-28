import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { PostSidebar } from './post-sidebar'
import { BulletListInput } from '@/components/shared/list-input'
import { CopyTextButton } from '@/components/shared/copy-button'
import { usePostsStore } from '@/lib/store'
import type { LinkedInPost, WorkflowStatusId, ContentTagId } from '@/lib/types'

export function LinkedInPostForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromCalendar = searchParams.get('from') === 'calendar'
  const [post, setPost] = useState<LinkedInPost | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  
  const storePost = usePostsStore((state) => state.posts.find(p => p.id === id)) as LinkedInPost | undefined
  const updateStorePost = usePostsStore((state) => state.updatePost)
  const deleteStorePost = usePostsStore((state) => state.deletePost)
  
  const handleBack = () => {
    if (fromCalendar) {
      navigate('/calendar')
    } else {
      navigate('/boards?platform=linkedin')
    }
  }

  useEffect(() => {
    if (storePost) {
      setPost(storePost)
    } else {
      // Create new post
      setPost({
        id: id || `li-new-${Date.now()}`,
        platform: 'linkedin',
        status: 'idea',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        content: {
          text: '',
          hook: '',
          bulletPoints: [],
          cta: '',
          hashtags: []
        }
      })
    }
  }, [id, storePost])

  if (!post) return null

  const handleSave = async () => {
    setIsSaving(true)
    // Save to store
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

  const getFullPostText = () => {
    const parts: string[] = []
    if (post.content.hook) parts.push(post.content.hook)
    if (post.content.text) parts.push(post.content.text)
    if (post.content.bulletPoints?.length) {
      parts.push(post.content.bulletPoints.map(bp => `• ${bp}`).join('\n'))
    }
    if (post.content.cta) parts.push(post.content.cta)
    if (post.content.hashtags?.length) {
      parts.push(post.content.hashtags.map(h => `#${h}`).join(' '))
    }
    return parts.join('\n\n')
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
              {post.content.text ? 'Post bearbeiten' : 'Neuer Post'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <CopyTextButton text={getFullPostText()} label="Kopieren" />
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

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Hook</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              value={post.content.hook || ''}
              onChange={(e) => updateContent('hook', e.target.value)}
              placeholder="Die ersten Zeilen, die Aufmerksamkeit erregen..."
              className="min-h-[80px]"
            />
            <p className="text-[11px] text-gray-400 mt-2">
              Die ersten 2-3 Zeilen, die vor "mehr anzeigen" sichtbar sind
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Haupttext</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Textarea
              value={post.content.text || ''}
              onChange={(e) => updateContent('text', e.target.value)}
              placeholder="Der Hauptinhalt deines Posts..."
              className="min-h-[200px]"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Bullet Points</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <BulletListInput
              value={post.content.bulletPoints || []}
              onChange={(value) => updateContent('bulletPoints', value)}
              placeholder="Bullet Point hinzufügen..."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Call-to-Action</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Input
              value={post.content.cta || ''}
              onChange={(e) => updateContent('cta', e.target.value)}
              placeholder="Was sollen die Leser tun? z.B. 'Kommentiere unten 👇'"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-[14px]">Hashtags</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Input
              value={post.content.hashtags?.join(', ') || ''}
              onChange={(e) => updateContent('hashtags', e.target.value.split(',').map(h => h.trim()).filter(Boolean))}
              placeholder="Hashtags (kommagetrennt), z.B. ContentMarketing, LinkedIn"
            />
            <p className="text-[11px] text-gray-400 mt-2">
              3-5 relevante Hashtags empfohlen
            </p>
          </CardContent>
        </Card>

        {/* Preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-[14px]">Vorschau</CardTitle>
              <CopyTextButton text={getFullPostText()} label="Kopieren" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-[13px] text-gray-700 leading-relaxed">
              {getFullPostText() || 'Beginne mit dem Schreiben...'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <PostSidebar
        platform="linkedin"
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
