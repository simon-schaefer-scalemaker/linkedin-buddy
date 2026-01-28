import { useEffect, useState } from 'react'
import {
  Plus,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Loader2,
  Trash2,
  BarChart2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { usePostsStore } from '@/stores/postsStore'
import { formatDate, formatEngagementRate, truncateText, formatNumber } from '@/lib/utils'
import type { Post } from '@/types/database'

export function Posts() {
  const { posts, loading, fetchPosts, addPost, updatePostMetrics, deletePost } = usePostsStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showMetricsModal, setShowMetricsModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const postsNeedingMetrics = posts.filter(p => p.status === 'metrics_needed')
  const completePosts = posts.filter(p => p.status === 'complete')

  const handleAddPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const body = formData.get('body') as string
    const publishedAt = formData.get('published_at') as string
    const url = formData.get('url') as string

    const { error } = await addPost(body, publishedAt || new Date().toISOString(), url || undefined)
    
    if (!error) {
      setShowAddModal(false)
    }
    setIsSubmitting(false)
  }

  const handleUpdateMetrics = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedPost) return

    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    
    const { error } = await updatePostMetrics(selectedPost.id, {
      impressions: parseInt(formData.get('impressions') as string) || 0,
      engagements: parseInt(formData.get('engagements') as string) || 0,
      comments: parseInt(formData.get('comments') as string) || undefined,
      reposts: parseInt(formData.get('reposts') as string) || undefined,
    })

    if (!error) {
      setShowMetricsModal(false)
      setSelectedPost(null)
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (postId: string) => {
    if (!confirm('Post wirklich löschen?')) return
    await deletePost(postId)
  }

  const openMetricsModal = (post: Post) => {
    setSelectedPost(post)
    setShowMetricsModal(true)
  }

  const getPerformanceBadge = (tier: string | null) => {
    switch (tier) {
      case 'high':
        return (
          <Badge variant="success" className="gap-1">
            <TrendingUp className="h-3 w-3" />
            Top
          </Badge>
        )
      case 'low':
        return (
          <Badge variant="destructive" className="gap-1">
            <TrendingDown className="h-3 w-3" />
            Low
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            <Minus className="h-3 w-3" />
            Avg
          </Badge>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
      case 'analyzing':
        return <Badge variant="secondary">Analysiere...</Badge>
      case 'metrics_needed':
        return (
          <Badge variant="warning" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Metriken fehlen
          </Badge>
        )
      case 'complete':
        return <Badge variant="success">Vollständig</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-5xl text-white font-light">
            Posts
          </h1>
          <p className="text-neutral-400 mt-2">Verwalte und analysiere deine LinkedIn Posts</p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Post hinzufügen
        </Button>
      </div>

      {/* Metrics Needed Alert */}
      {postsNeedingMetrics.length > 0 && (
        <Card  className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="py-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <AlertCircle className="h-5 w-5 text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-white">
                  {postsNeedingMetrics.length} Post{postsNeedingMetrics.length > 1 ? 's' : ''} brauchen Metriken
                </p>
                <p className="text-sm text-neutral-400">
                  Trage die Performance-Daten ein für bessere Analyse
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Tabs */}
      <Tabs defaultValue="all">
        <TabsList className="bg-white/5 border border-white/10 p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-white/10">
            Alle ({posts.length})
          </TabsTrigger>
          <TabsTrigger value="needs_metrics" className="data-[state=active]:bg-white/10">
            Metriken fehlen ({postsNeedingMetrics.length})
          </TabsTrigger>
          <TabsTrigger value="complete" className="data-[state=active]:bg-white/10">
            Vollständig ({completePosts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <PostsList
            posts={posts}
            loading={loading}
            onAddMetrics={openMetricsModal}
            onDelete={handleDelete}
            getPerformanceBadge={getPerformanceBadge}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="needs_metrics" className="mt-6">
          <PostsList
            posts={postsNeedingMetrics}
            loading={loading}
            onAddMetrics={openMetricsModal}
            onDelete={handleDelete}
            getPerformanceBadge={getPerformanceBadge}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>

        <TabsContent value="complete" className="mt-6">
          <PostsList
            posts={completePosts}
            loading={loading}
            onAddMetrics={openMetricsModal}
            onDelete={handleDelete}
            getPerformanceBadge={getPerformanceBadge}
            getStatusBadge={getStatusBadge}
          />
        </TabsContent>
      </Tabs>

      {/* Add Post Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg bg-[#0a0a0a] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Post hinzufügen</DialogTitle>
            <DialogDescription>
              Füge einen neuen LinkedIn Post zur Analyse hinzu
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddPost}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="body" className="text-neutral-300">Post-Text *</Label>
                <Textarea
                  id="body"
                  name="body"
                  placeholder="Füge den vollständigen Post-Text ein..."
                  className="min-h-[150px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="published_at" className="text-neutral-300">Veröffentlicht am</Label>
                <Input
                  id="published_at"
                  name="published_at"
                  type="datetime-local"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url" className="text-neutral-300">LinkedIn URL (optional)</Label>
                <Input
                  id="url"
                  name="url"
                  type="url"
                  placeholder="https://linkedin.com/posts/..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Hinzufügen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Metrics Modal */}
      <Dialog open={showMetricsModal} onOpenChange={setShowMetricsModal}>
        <DialogContent className="bg-[#0a0a0a] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Metriken eintragen</DialogTitle>
            <DialogDescription>
              {selectedPost && truncateText(selectedPost.body, 100)}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateMetrics}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="impressions" className="text-neutral-300">Impressions *</Label>
                  <Input
                    id="impressions"
                    name="impressions"
                    type="number"
                    placeholder="z.B. 5000"
                    defaultValue={selectedPost?.impressions || ''}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="engagements" className="text-neutral-300">Engagements *</Label>
                  <Input
                    id="engagements"
                    name="engagements"
                    type="number"
                    placeholder="Likes + Kommentare"
                    defaultValue={selectedPost?.engagements || ''}
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="comments" className="text-neutral-300">Kommentare (optional)</Label>
                  <Input
                    id="comments"
                    name="comments"
                    type="number"
                    placeholder="z.B. 25"
                    defaultValue={selectedPost?.comments || ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reposts" className="text-neutral-300">Reposts (optional)</Label>
                  <Input
                    id="reposts"
                    name="reposts"
                    type="number"
                    placeholder="z.B. 10"
                    defaultValue={selectedPost?.reposts || ''}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowMetricsModal(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PostsList({
  posts,
  loading,
  onAddMetrics,
  onDelete,
  getPerformanceBadge,
  getStatusBadge,
}: {
  posts: Post[]
  loading: boolean
  onAddMetrics: (post: Post) => void
  onDelete: (id: string) => void
  getPerformanceBadge: (tier: string | null) => React.ReactNode
  getStatusBadge: (status: string) => React.ReactNode
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <Card >
        <CardContent className="py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
            <FileText className="h-8 w-8 text-neutral-600" />
          </div>
          <h3 className="font-medium text-white mb-2">Keine Posts</h3>
          <p className="text-neutral-400">
            Füge deinen ersten Post hinzu, um mit der Analyse zu beginnen.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <Card key={post.id}  className="hover:border-white/20 transition-colors">
          <CardContent className="py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-white mb-3 leading-relaxed">
                  {truncateText(post.body, 200)}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
                  <span>{formatDate(post.published_at)}</span>
                  {post.status === 'complete' && (
                    <>
                      <span className="w-1 h-1 rounded-full bg-neutral-600" />
                      <span>{formatNumber(post.impressions || 0)} Impressions</span>
                      <span className="w-1 h-1 rounded-full bg-neutral-600" />
                      <span>{formatNumber(post.engagements || 0)} Engagements</span>
                      <span className="w-1 h-1 rounded-full bg-neutral-600" />
                      <span className="font-medium text-indigo-400">
                        {formatEngagementRate(post.engagement_rate)}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {post.status === 'complete' && getPerformanceBadge(post.performance_tier)}
                {getStatusBadge(post.status)}
                {post.status === 'metrics_needed' && (
                  <Button size="sm" variant="secondary" onClick={() => onAddMetrics(post)}>
                    <BarChart2 className="mr-1.5 h-4 w-4" />
                    Metriken
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-neutral-500 hover:text-red-400"
                  onClick={() => onDelete(post.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
