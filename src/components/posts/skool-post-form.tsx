import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save, Trash2, Pin, Sparkles, Loader2, FileText, Settings, Check, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PostSidebar } from './post-sidebar'
import { AiChatPanel } from './ai-chat-panel'
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

// Workflow Step IDs
type StepId = 'settings' | 'content'

// Workflow Steps Configuration
const WORKFLOW_STEPS: { id: StepId; title: string; icon: React.ElementType }[] = [
  { id: 'settings', title: 'Einstellungen', icon: Settings },
  { id: 'content', title: 'Content', icon: FileText },
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
        isComplete && !isOpen && "border-yellow-200 bg-yellow-50/20"
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
          isOpen && "bg-yellow-500 text-white",
          !isOpen && isComplete && "bg-yellow-500 text-white",
          !isOpen && !isComplete && "bg-gray-200 text-gray-500"
        )}>
          {isComplete && !isOpen ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-semibold text-[13px] uppercase tracking-wide",
              isOpen ? "text-gray-900" : isComplete ? "text-yellow-700" : "text-gray-500"
            )}>
              {title}
            </span>
          </div>
          {!isOpen && (
            <p className={cn(
              "text-[11px] mt-1 truncate max-w-[500px]",
              isComplete ? "text-yellow-600" : "text-gray-400 italic"
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
              <Button onClick={onNext} className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-black">
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
function createDefaultPost(id?: string): SkoolPost {
  return {
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
  }
}

export function SkoolPostForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromCalendar = searchParams.get('from') === 'calendar'
  
  const [post, setPost] = useState<SkoolPost>(() => createDefaultPost(id))
  const [isSaving, setIsSaving] = useState(false)
  const [isAiChatOpen, setIsAiChatOpen] = useState(false)
  const [activeStep, setActiveStep] = useState<StepId>('settings')
  
  const storePost = usePostsStore((state) => state.posts.find(p => p.id === id)) as SkoolPost | undefined
  const updateStorePost = usePostsStore((state) => state.updatePost)
  const deleteStorePost = usePostsStore((state) => state.deletePost)
  
  // Workflow Step Helpers
  const isStepComplete = (stepId: StepId): boolean => {
    switch (stepId) {
      case 'settings':
        return !!post.content?.category
      case 'content':
        return (post.content?.title?.trim().length || 0) > 0 && (post.content?.body?.trim().length || 0) > 0
      default:
        return false
    }
  }
  
  const getStepPreview = (stepId: StepId): string => {
    switch (stepId) {
      case 'settings':
        const parts = []
        if (post.content?.category) parts.push(post.content.category)
        if (post.content?.isPinned) parts.push('📌 Pinned')
        return parts.join(' • ')
      case 'content':
        return post.content?.title || ''
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
      navigate('/boards?platform=skool')
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

  const updateContent = (field: string, value: string | boolean) => {
    setPost({
      ...post,
      content: { ...post.content, [field]: value },
      updatedAt: new Date().toISOString()
    })
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
              value={(post as any).title || post.content.title || ''}
              onChange={(e) => {
                setPost({ ...post, title: e.target.value } as any)
                updateContent('title', e.target.value)
              }}
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
            <Button
              variant={post.content.isPinned ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateContent('isPinned', !post.content.isPinned)}
              className={post.content.isPinned ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
            >
              <Pin className={cn("h-4 w-4 mr-2", post.content.isPinned && "fill-current")} />
              {post.content.isPinned ? 'Angepinnt' : 'Anpinnen'}
            </Button>
            <Button variant="ghost" size="icon" className="text-red-500" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-yellow-500 hover:bg-yellow-600 text-black">
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
                  activeStep === step.id && "bg-yellow-500 text-black",
                  activeStep !== step.id && isStepComplete(step.id) && "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
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
                  isStepComplete(step.id) ? "bg-yellow-300" : "bg-gray-200"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* STEP 1: SETTINGS */}
          <WorkflowSection
            id="settings"
            title="Einstellungen"
            icon={Settings}
            isOpen={activeStep === 'settings'}
            isComplete={isStepComplete('settings')}
            preview={getStepPreview('settings')}
            onToggle={() => setActiveStep('settings')}
            onNext={goToNextStep}
            nextLabel="Weiter: Content"
          >
            {/* Category */}
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Kategorie</Label>
              <Select
                value={post.content.category || ''}
                onValueChange={(value) => updateContent('category', value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Kategorie wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {SKOOL_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Pin Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-[13px] font-medium text-gray-900">Post anpinnen</p>
                <p className="text-[11px] text-gray-500">Pinned Posts erscheinen oben in der Kategorie</p>
              </div>
              <Button
                variant={post.content.isPinned ? 'default' : 'outline'}
                size="sm"
                onClick={() => updateContent('isPinned', !post.content.isPinned)}
                className={post.content.isPinned ? 'bg-yellow-500 hover:bg-yellow-600 text-black' : ''}
              >
                <Pin className={cn("h-4 w-4", post.content.isPinned && "fill-current")} />
              </Button>
            </div>
          </WorkflowSection>

          {/* STEP 2: CONTENT */}
          <WorkflowSection
            id="content"
            title="Content"
            icon={FileText}
            isOpen={activeStep === 'content'}
            isComplete={isStepComplete('content')}
            preview={getStepPreview('content')}
            onToggle={() => setActiveStep('content')}
          >
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Titel</Label>
              <Input
                value={post.content.title || ''}
                onChange={(e) => updateContent('title', e.target.value)}
                placeholder="Post-Titel eingeben..."
                className="h-11 text-[13px]"
              />
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Inhalt</Label>
              <Textarea
                value={post.content.body || ''}
                onChange={(e) => updateContent('body', e.target.value)}
                placeholder="Post-Inhalt eingeben..."
                className="min-h-[250px] text-[13px]"
              />
              <p className="text-[11px] text-gray-400">
                Markdown wird unterstützt
              </p>
            </div>
          </WorkflowSection>
        </div>
      </div>

      {/* Sidebar */}
      <PostSidebar
        platform="skool"
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
          setPost(updated as SkoolPost)
          updateStorePost(post.id, updated)
        }}
      />

      {/* AI Chat Panel */}
      <AiChatPanel
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        postId={post.id}
        platform="skool"
        currentPost={post}
      />
    </div>
  )
}
