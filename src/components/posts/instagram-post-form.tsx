import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, Sparkles, Loader2, Image, MapPin, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { PostSidebar } from './post-sidebar'
import { AiChatPanel } from './ai-chat-panel'
import { CopyTextButton } from '@/components/shared/copy-button'
import { usePostsStore } from '@/lib/store'
import type { InstagramPost, WorkflowStatusId, ContentTagId } from '@/lib/types'
import { cn } from '@/lib/utils'

const POST_TYPES = [
  { id: 'post', name: 'Feed Post' },
  { id: 'reel', name: 'Reel' },
  { id: 'story', name: 'Story' },
  { id: 'carousel', name: 'Carousel' },
] as const

// Workflow Step IDs
type StepId = 'content' | 'details'

// Workflow Steps Configuration
const WORKFLOW_STEPS: { id: StepId; title: string; icon: React.ElementType }[] = [
  { id: 'content', title: 'Content', icon: Image },
  { id: 'details', title: 'Details', icon: MapPin },
]

// Workflow Section Component (Collapsible Accordion)
function WorkflowSection({ 
  id,
  title, 
  icon: Icon, 
  isOpen,
  isComplete,
  preview,
  onToggle,
  onNext,
  nextLabel,
  children
}: { 
  id: string
  title: string
  icon: React.ElementType
  isOpen: boolean
  isComplete: boolean
  preview?: string
  onToggle: () => void
  onNext?: () => void
  nextLabel?: string
  children: React.ReactNode
}) {
  return (
    <div 
      id={`section-${id}`}
      className={cn(
        "border rounded-xl transition-all duration-200 overflow-hidden",
        isOpen ? "border-gray-200 bg-white shadow-sm" : "border-gray-100 bg-gray-50/30",
        isComplete && !isOpen && "border-pink-200 bg-pink-50/20"
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-gray-50/50",
          isOpen && "border-b border-gray-100 hover:bg-transparent"
        )}
      >
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
          isOpen && "bg-gradient-to-br from-pink-500 to-purple-600 text-white",
          !isOpen && isComplete && "bg-gradient-to-br from-pink-500 to-purple-600 text-white",
          !isOpen && !isComplete && "bg-gray-200 text-gray-500"
        )}>
          {isComplete && !isOpen ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-semibold text-[13px] uppercase tracking-wide",
              isOpen ? "text-gray-900" : isComplete ? "text-pink-700" : "text-gray-500"
            )}>
              {title}
            </span>
          </div>
          {!isOpen && (
            <p className={cn(
              "text-[11px] mt-1 truncate max-w-[500px]",
              isComplete ? "text-pink-600" : "text-gray-400 italic"
            )}>
              {preview || (isComplete ? "Ausgefüllt" : "Noch nicht ausgefüllt")}
            </p>
          )}
        </div>
        
        <div className={cn("shrink-0 transition-transform", isOpen && "rotate-180")}>
          <ChevronDown className={cn("h-5 w-5", isOpen ? "text-gray-600" : "text-gray-400")} />
        </div>
      </button>
      
      {isOpen && (
        <div className="p-5 space-y-5">
          {children}
          {onNext && nextLabel && (
            <div className="flex justify-end pt-3 border-t border-gray-100">
              <Button onClick={onNext} className="gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
                {nextLabel}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Helper to create default post
function createDefaultPost(id?: string): InstagramPost {
  return {
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
  }
}

export function InstagramPostForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromCalendar = searchParams.get('from') === 'calendar'
  
  const [post, setPost] = useState<InstagramPost>(() => createDefaultPost(id))
  const [isSaving, setIsSaving] = useState(false)
  const [isAiChatOpen, setIsAiChatOpen] = useState(false)
  const [activeStep, setActiveStep] = useState<StepId>('content')
  
  const storePost = usePostsStore((state) => state.posts.find(p => p.id === id)) as InstagramPost | undefined
  const updateStorePost = usePostsStore((state) => state.updatePost)
  const deleteStorePost = usePostsStore((state) => state.deletePost)
  
  // Workflow Step Helpers
  const isStepComplete = (stepId: StepId): boolean => {
    switch (stepId) {
      case 'content':
        return (post.content?.caption?.trim().length || 0) > 0
      case 'details':
        return true // Optional
      default:
        return false
    }
  }
  
  const getStepPreview = (stepId: StepId): string => {
    switch (stepId) {
      case 'content':
        const caption = post.content?.caption?.trim()
        return caption ? `${caption.slice(0, 50)}...` : ''
      case 'details':
        return post.content?.location || ''
      default:
        return ''
    }
  }
  
  const goToNextStep = () => {
    const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === activeStep)
    if (currentIndex < WORKFLOW_STEPS.length - 1) {
      const nextStep = WORKFLOW_STEPS[currentIndex + 1].id
      setActiveStep(nextStep)
      setTimeout(() => {
        document.getElementById(`section-${nextStep}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }
  
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
    }
  }, [id, storePost])

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
    return post.content.caption || ''
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)] -my-4">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 pb-4 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Input
              value={(post as any).title || ''}
              onChange={(e) => setPost({ ...post, title: e.target.value } as any)}
              placeholder="Post-Titel eingeben..."
              className="text-lg font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0 bg-transparent w-[300px]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAiChatOpen(true)}
              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              AI Assistent
            </Button>
            <Button variant="ghost" size="icon" className="text-red-500" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-pink-500 to-purple-600">
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Speichert...' : 'Speichern'}
            </Button>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center gap-2 pb-4 border-b border-gray-100 mb-4 shrink-0">
          {WORKFLOW_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-[11px] font-medium",
                  activeStep === step.id && "bg-gradient-to-r from-pink-500 to-purple-600 text-white",
                  activeStep !== step.id && isStepComplete(step.id) && "bg-pink-100 text-pink-700 hover:bg-pink-200",
                  activeStep !== step.id && !isStepComplete(step.id) && "bg-gray-100 text-gray-500 hover:bg-gray-200"
                )}
              >
                {isStepComplete(step.id) && activeStep !== step.id ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <step.icon className="h-3.5 w-3.5" />
                )}
                {step.title}
              </button>
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className={cn(
                  "w-8 h-[2px] mx-1",
                  isStepComplete(step.id) ? "bg-pink-300" : "bg-gray-200"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* STEP 1: CONTENT */}
          <WorkflowSection
            id="content"
            title="Content"
            icon={Image}
            isOpen={activeStep === 'content'}
            isComplete={isStepComplete('content')}
            preview={getStepPreview('content')}
            onToggle={() => setActiveStep('content')}
            onNext={goToNextStep}
            nextLabel="Weiter: Details"
          >
            {/* Post Type */}
            <div className="space-y-3">
              <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Post-Typ</Label>
              <div className="flex gap-2 flex-wrap">
                {POST_TYPES.map(type => (
                  <Button
                    key={type.id}
                    variant={post.content.type === type.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateContent('type', type.id)}
                    className={post.content.type === type.id ? 'bg-gradient-to-r from-pink-500 to-purple-600' : ''}
                  >
                    {type.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Caption</Label>
              <Textarea
                value={post.content.caption || ''}
                onChange={(e) => updateContent('caption', e.target.value)}
                placeholder="Caption eingeben..."
                className="min-h-[200px] text-[13px]"
              />
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-gray-400">
                  {post.content.caption?.length || 0}/2200 Zeichen
                </p>
                <CopyTextButton text={getFullCaption()} label="Kopieren" />
              </div>
            </div>
          </WorkflowSection>

          {/* STEP 2: DETAILS */}
          <WorkflowSection
            id="details"
            title="Details"
            icon={MapPin}
            isOpen={activeStep === 'details'}
            isComplete={isStepComplete('details')}
            preview={getStepPreview('details')}
            onToggle={() => setActiveStep('details')}
          >
            {/* Location */}
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Standort (optional)</Label>
              <Input
                value={post.content.location || ''}
                onChange={(e) => updateContent('location', e.target.value)}
                placeholder="Standort eingeben..."
              />
            </div>

            {/* Preview */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Vorschau</Label>
                <CopyTextButton text={getFullCaption()} label="Kopieren" />
              </div>
              <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap text-[13px] text-gray-700 leading-relaxed min-h-[100px]">
                {getFullCaption() || 'Beginne mit dem Schreiben...'}
              </div>
            </div>
          </WorkflowSection>
        </div>
      </div>

      {/* Sidebar */}
      <PostSidebar
        platform="instagram"
        status={post.status}
        tags={post.tags}
        scheduledFor={post.scheduledFor}
        createdAt={post.createdAt}
        updatedAt={post.updatedAt}
        publishedAt={post.publishedAt}
        post={post}
        onStatusChange={(status: WorkflowStatusId) => {
          const updated = { 
            ...post, 
            status,
            publishedAt: status === 'published' && !post.publishedAt ? new Date().toISOString() : post.publishedAt
          }
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
        onMetricsChange={(metrics, measuredAt, measurementPeriod) => {
          const updated = { 
            ...post, 
            metrics: { ...post.metrics, ...metrics },
            metricsCollectedAt: measuredAt,
            metricsPeriodDays: measurementPeriod
          }
          setPost(updated as InstagramPost)
          updateStorePost(post.id, updated)
        }}
      />

      {/* AI Chat Panel */}
      <AiChatPanel
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        postId={post.id}
        platform="instagram"
        currentPost={post}
      />
    </div>
  )
}
