import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Sparkles,
  Lightbulb,
  Video,
  Scissors,
  Copy,
  Check,
  Plus,
  X,
  ExternalLink,
  Loader2,
  Target,
  TrendingUp,
  Minus,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

// Workflow Step IDs
type StepId = 'strategy' | 'concept' | 'production' | 'cutting'

// Workflow Steps Configuration
const WORKFLOW_STEPS: { id: StepId; title: string; icon: React.ElementType }[] = [
  { id: 'strategy', title: 'Strategie', icon: Target },
  { id: 'concept', title: 'Konzept', icon: Lightbulb },
  { id: 'production', title: 'Produktion', icon: Video },
  { id: 'cutting', title: 'Cutting', icon: Scissors },
]
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PostSidebar } from './post-sidebar'
import { AiChatPanel } from './ai-chat-panel'
import { usePostsStore, useGlobalSettingsStore } from '@/lib/store'
import type { YouTubePost, WorkflowStatusId, ContentTagId } from '@/lib/types'
import { cn } from '@/lib/utils'
import { sendMessage, isApiConfigured } from '@/lib/claude-api'
import { buildHypothesisPrompt, buildLearningPrompt } from '@/lib/ai-prompts'

// Workflow Section Component (Collapsible Accordion)
function WorkflowSection({ 
  id,
  title, 
  icon: Icon, 
  isOpen,
  isComplete,
  preview,
  required,
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
  required?: boolean
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
        isOpen ? "border-neutral-600 bg-neutral-800 shadow-lg" : "border-neutral-800 bg-neutral-800/30",
        isComplete && !isOpen && "border-red-200 bg-red-50/20"
      )}
    >
      {/* Clickable Header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-neutral-800/50/50",
          isOpen && "border-b border-neutral-800 hover:bg-transparent"
        )}
      >
        {/* Status Icon */}
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
          isOpen && "bg-red-500 text-white",
          !isOpen && isComplete && "bg-red-500 text-white",
          !isOpen && !isComplete && "bg-neutral-700 text-neutral-500"
        )}>
          {isComplete && !isOpen ? (
            <Check className="h-4 w-4" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </div>
        
        {/* Title & Preview */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-semibold text-[13px] uppercase tracking-wide",
              isOpen ? "text-white" : isComplete ? "text-red-700" : "text-neutral-500"
            )}>
              {title}
            </span>
            {required && !isComplete && (
              <span className="text-[9px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                Pflicht
              </span>
            )}
          </div>
          
          {/* Preview when collapsed */}
          {!isOpen && (
            <p className={cn(
              "text-[11px] mt-1 truncate max-w-[500px]",
              isComplete ? "text-red-600" : "text-neutral-500 italic"
            )}>
              {preview || (isComplete ? "Ausgefüllt" : "Noch nicht ausgefüllt")}
            </p>
          )}
        </div>
        
        {/* Chevron */}
        <div className={cn("shrink-0 transition-transform", isOpen && "rotate-180")}>
          <ChevronDown className={cn(
            "h-5 w-5",
            isOpen ? "text-neutral-400" : "text-neutral-500"
          )} />
        </div>
      </button>
      
      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-5 space-y-5">
          {children}
          
          {/* Next Step Button */}
          {onNext && nextLabel && (
            <div className="flex justify-end pt-3 border-t border-neutral-800">
              <Button onClick={onNext} className="gap-2 bg-red-500 hover:bg-red-600">
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

// Copy Button Component
function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={handleCopy}
      className={cn(
        "transition-all",
        copied && "bg-green-50 border-green-200 text-green-700",
        className
      )}
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 mr-2" />
          Kopiert
        </>
      ) : (
        <>
          <Copy className="h-3.5 w-3.5 mr-2" />
          Kopieren
        </>
      )}
    </Button>
  )
}

// Labeled Input Component
function LabeledInput({ 
  label, 
  value, 
  onChange, 
  placeholder,
  type = 'text'
}: { 
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'url'
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
        {label}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-11 text-[13px] bg-neutral-800/50/50 border-neutral-700 focus:bg-neutral-700 transition-colors"
      />
    </div>
  )
}

// Default YouTube Description Template
const DEFAULT_DESCRIPTION_TEMPLATE = `🎁 Alle Workflows aus diesem Video:
[DRIVE_LINK]

💎 Exklusive Premium Inhalte & Community:
[PREMIUM_LINK]

📞 Buche eine 1:1 Beratung:
[CALENDLY_LINK]

---

📝 ZUSAMMENFASSUNG:
[SUMMARY]

---

🛠️ TOOLS & LINKS:
[TOOLS]

---

📱 SOCIAL MEDIA:
• LinkedIn: https://linkedin.com/in/simonschaefer
• Instagram: @simonschaefer

---

💡 WARUM ZUSCHAUEN?
[BIO]

---

📑 KAPITEL:
[CHAPTERS]`

// Helper to create default post
function createDefaultPost(id?: string): YouTubePost {
  return {
    id: id || `yt-new-${Date.now()}`,
    platform: 'youtube',
    status: 'idea',
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    content: {
      title: '',
      description: DEFAULT_DESCRIPTION_TEMPLATE,
      tags: [],
      category: 'Science & Technology',
      isShort: false
    }
  }
}

export function YouTubePostForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromCalendar = searchParams.get('from') === 'calendar'
  
  // Use lazy initialization to prevent recreation on every render
  const [post, setPost] = useState<YouTubePost>(() => createDefaultPost(id))
  const [isSaving, setIsSaving] = useState(false)
  const [isAiChatOpen, setIsAiChatOpen] = useState(false)
  
  // Extended fields (stored in content or as separate fields)
  const [idea, setIdea] = useState('')
  const [workflow, setWorkflow] = useState('')
  const [thumbnailDescription, setThumbnailDescription] = useState('')
  const [thumbnailLink, setThumbnailLink] = useState('')
  const [hook, setHook] = useState('')
  const [bulletpoints, setBulletpoints] = useState<string[]>([])
  const [videoLinks, setVideoLinks] = useState<string[]>([])
  const [description, setDescription] = useState(DEFAULT_DESCRIPTION_TEMPLATE)
  const [finalVideoUrl, setFinalVideoUrl] = useState('')
  
  // Affiliate links from global store
  const affiliateLinks = useGlobalSettingsStore((state) => state.affiliateLinks)
  
  // Strategy section (Hypothesis-First System)
  const [hypothesis, setHypothesis] = useState('')
  const [expectedPerformance, setExpectedPerformance] = useState<'above' | 'average' | 'test'>('average')
  const [referencePostId, setReferencePostId] = useState('')
  const [isGeneratingHypothesis, setIsGeneratingHypothesis] = useState(false)
  
  // Post Analysis (Winner/Loser)
  const [performanceRating, setPerformanceRating] = useState<'winner' | 'loser' | 'average' | null>(null)
  const [learning, setLearning] = useState('')
  const [isGeneratingLearning, setIsGeneratingLearning] = useState(false)
  
  // Workflow Step Navigation
  const [activeStep, setActiveStep] = useState<StepId>('strategy')
  
  const allPosts = usePostsStore((state) => state.posts)
  const storePost = usePostsStore((state) => state.posts.find(p => p.id === id)) as YouTubePost | undefined
  const updateStorePost = usePostsStore((state) => state.updatePost)
  const addStorePost = usePostsStore((state) => state.addPost)
  const deleteStorePost = usePostsStore((state) => state.deletePost)
  const [isNewPost, setIsNewPost] = useState(false)
  
  // Workflow Step Helpers
  const isStepComplete = (stepId: StepId): boolean => {
    switch (stepId) {
      case 'strategy':
        return hypothesis.trim().length > 0
      case 'concept':
        return idea.trim().length > 0 || (post.content?.title?.trim().length || 0) > 0
      case 'production':
        return videoLinks.length > 0 || description !== DEFAULT_DESCRIPTION_TEMPLATE
      case 'cutting':
        return !!finalVideoUrl
      default:
        return false
    }
  }
  
  const getStepPreview = (stepId: StepId): string => {
    switch (stepId) {
      case 'strategy':
        return hypothesis.trim() ? `"${hypothesis.slice(0, 50)}..."` : ''
      case 'concept':
        return post.content?.title || idea.slice(0, 50) || ''
      case 'production':
        return videoLinks.length > 0 ? `${videoLinks.length} Video(s)` : ''
      case 'cutting':
        return finalVideoUrl ? 'Finales Video vorhanden' : ''
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
      navigate('/boards?platform=youtube')
    }
  }

  useEffect(() => {
    if (storePost) {
      setPost(storePost)
      setIsNewPost(false)
      // Load extended fields from post
      // @ts-expect-error - extended fields
      setIdea(storePost.idea || '')
      // @ts-expect-error - extended fields
      setWorkflow(storePost.workflow || '')
      // @ts-expect-error - extended fields
      setThumbnailDescription(storePost.thumbnailDescription || '')
      // @ts-expect-error - extended fields
      setThumbnailLink(storePost.thumbnailLink || '')
      // @ts-expect-error - extended fields
      setHook(storePost.hook || '')
      // @ts-expect-error - extended fields
      setBulletpoints(storePost.bulletpoints || [])
      // @ts-expect-error - extended fields
      setVideoLinks(storePost.videoLinks || [])
      setDescription(storePost.content.description || DEFAULT_DESCRIPTION_TEMPLATE)
      // @ts-expect-error - extended fields
      setFinalVideoUrl(storePost.finalVideoUrl || '')
      // Load strategy data
      if ((storePost as any).hypothesis) setHypothesis((storePost as any).hypothesis)
      // @ts-expect-error - extended fields
      if (storePost.expectedPerformance) setExpectedPerformance(storePost.expectedPerformance)
      // @ts-expect-error - extended fields
      if (storePost.referencePostId) setReferencePostId(storePost.referencePostId)
      // Load post analysis data
      // @ts-expect-error - extended fields
      if (storePost.performanceRating) setPerformanceRating(storePost.performanceRating)
      // @ts-expect-error - extended fields
      if (storePost.learning) setLearning(storePost.learning)
    } else {
      setIsNewPost(true)
    }
  }, [id, storePost])

  const handleSave = async () => {
    // Validate hypothesis (required field)
    if (!hypothesis.trim()) {
      alert('Bitte gib eine Hypothese ein: Warum wird dieses Video funktionieren?')
      return
    }
    
    setIsSaving(true)
    const updatedPost = {
      ...post,
      content: {
        ...post.content,
        description
      },
      idea,
      workflow,
      thumbnailDescription,
      thumbnailLink,
      hook,
      bulletpoints,
      videoLinks,
      finalVideoUrl,
      // Strategy data
      hypothesis,
      expectedPerformance,
      referencePostId: referencePostId || null,
      // Post analysis data
      performanceRating,
      learning,
      updatedAt: new Date().toISOString()
    }
    
    if (isNewPost) {
      addStorePost(updatedPost as YouTubePost)
      setIsNewPost(false)
      console.log('✅ New YouTube post added:', updatedPost.id)
    } else {
      updateStorePost(post.id, updatedPost)
      console.log('✅ YouTube post updated:', post.id)
    }
    
    await new Promise(resolve => setTimeout(resolve, 300))
    setIsSaving(false)
  }
  
  const handleDelete = () => {
    if (confirm('Video wirklich löschen?')) {
      deleteStorePost(post.id)
      handleBack()
    }
  }

  const handleGenerateLearning = async () => {
    if (!performanceRating) {
      alert('Bitte wähle erst eine Performance-Bewertung (Winner/Normal/Loser)')
      return
    }
    
    if (!isApiConfigured()) {
      alert('Bitte konfiguriere erst deinen Anthropic API Key in den Einstellungen (⚙️ Icon oben rechts)')
      return
    }
    
    setIsGeneratingLearning(true)
    try {
      const { systemPrompt, userPrompt } = buildLearningPrompt(
        'youtube',
        post,
        performanceRating,
        allPosts
      )
      
      let generatedLearning = ''
      await sendMessage({
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        onChunk: (chunk) => {
          generatedLearning = chunk
          setLearning(generatedLearning)
        }
      })
      
      // Save the generated learning
      const updated = { ...post, learning: generatedLearning }
      updateStorePost(post.id, updated)
    } catch (error) {
      console.error('Failed to generate learning:', error)
      alert('Fehler beim Generieren: ' + (error as Error).message)
    } finally {
      setIsGeneratingLearning(false)
    }
  }

  const updateContent = (field: string, value: string | string[] | boolean) => {
    setPost({
      ...post,
      content: { ...post.content, [field]: value },
      updatedAt: new Date().toISOString()
    })
  }

  // Bulletpoint handlers
  const addBulletpoint = () => {
    setBulletpoints([...bulletpoints, ''])
  }
  
  const updateBulletpoint = (index: number, value: string) => {
    const updated = [...bulletpoints]
    updated[index] = value
    setBulletpoints(updated)
  }
  
  const removeBulletpoint = (index: number) => {
    setBulletpoints(bulletpoints.filter((_, i) => i !== index))
  }

  // Video link handlers
  const addVideoLink = () => {
    setVideoLinks([...videoLinks, ''])
  }
  
  const updateVideoLink = (index: number, value: string) => {
    const updated = [...videoLinks]
    updated[index] = value
    setVideoLinks(updated)
  }
  
  const removeVideoLink = (index: number) => {
    setVideoLinks(videoLinks.filter((_, i) => i !== index))
  }

  // Format bulletpoints for copy
  const formatBulletpointsForCopy = () => {
    return bulletpoints.filter(b => b.trim()).map(b => `• ${b}`).join('\n')
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)] -my-4">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between shrink-0 pb-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Input
              value={post.content.title || ''}
              onChange={(e) => updateContent('title', e.target.value)}
              placeholder="Video-Titel..."
              className="text-[18px] font-medium border-none shadow-none px-3 py-2 h-auto focus-visible:ring-0 bg-transparent w-[400px]"
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

        {/* Progress Stepper */}
        <div className="flex items-center gap-2 pb-4 border-b border-neutral-800 mb-4 shrink-0">
          {WORKFLOW_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-[11px] font-medium",
                  activeStep === step.id && "bg-red-500 text-white",
                  activeStep !== step.id && isStepComplete(step.id) && "bg-red-100 text-red-700 hover:bg-red-200",
                  activeStep !== step.id && !isStepComplete(step.id) && "bg-neutral-800 text-neutral-500 hover:bg-neutral-700"
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
                  isStepComplete(step.id) ? "bg-red-300" : "bg-neutral-700"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-6">
          
          {/* STEP 1: STRATEGIE */}
          <WorkflowSection
            id="strategy"
            title="Strategie"
            icon={Target}
            isOpen={activeStep === 'strategy'}
            isComplete={isStepComplete('strategy')}
            preview={getStepPreview('strategy')}
            required={true}
            onToggle={() => setActiveStep(activeStep === 'strategy' ? activeStep : 'strategy')}
            onNext={goToNextStep}
            nextLabel="Weiter: Konzept"
          >
            {/* Video Type Toggle */}
            <div className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg mb-4">
              <Label className="text-[12px] text-neutral-400">Video-Typ:</Label>
              <div className="flex gap-2">
                <Button
                  variant={!post.content.isShort ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateContent('isShort', false)}
                  className="h-8"
                >
                  Long-Form
                </Button>
                <Button
                  variant={post.content.isShort ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateContent('isShort', true)}
                  className="h-8"
                >
                  YouTube Short
                </Button>
              </div>
            </div>
            
            {/* Hypothesis */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                    Hypothese: Warum wird dieses Video funktionieren?
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!isApiConfigured()) {
                        alert('Bitte konfiguriere deinen API-Key in den Einstellungen.')
                        return
                      }
                      setIsGeneratingHypothesis(true)
                      try {
                        const currentContent = post.content?.title || idea || ''
                        const { systemPrompt, userPrompt } = buildHypothesisPrompt('youtube', allPosts, currentContent)
                        let generated = ''
                        await sendMessage({
                          systemPrompt,
                          messages: [{ role: 'user', content: userPrompt }],
                          onChunk: (chunk) => {
                            generated = chunk
                            setHypothesis(generated)
                          }
                        })
                      } catch (err) {
                        console.error('Failed to generate hypothesis:', err)
                      } finally {
                        setIsGeneratingHypothesis(false)
                      }
                    }}
                    disabled={isGeneratingHypothesis}
                    className="h-7 text-[11px] gap-1.5"
                  >
                    {isGeneratingHypothesis ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    AI Vorschlag
                  </Button>
                </div>
                <Textarea
                  value={hypothesis}
                  onChange={(e) => setHypothesis(e.target.value)}
                  placeholder="z.B. 'Tutorial-Videos unter 10 Min haben 60% höhere Watch-Time, weil...'"
                  className={cn(
                    "min-h-[80px] text-[13px] resize-none transition-colors",
                    hypothesis.trim() ? "bg-green-50/50 border-green-200" : "bg-amber-50/50 border-amber-200"
                  )}
                />
                {!hypothesis.trim() && (
                  <p className="text-[11px] text-amber-600">⚠️ Ohne Hypothese kannst du nicht speichern</p>
                )}
              </div>
              
              {/* Expected Performance */}
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                  Erwartete Performance
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'above', label: 'Überdurchschnittlich', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
                    { id: 'average', label: 'Durchschnitt', icon: Minus, color: 'text-neutral-400', bgColor: 'bg-neutral-800/50', borderColor: 'border-neutral-700' },
                    { id: 'test', label: 'Test/Experiment', icon: Target, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setExpectedPerformance(option.id as 'above' | 'average' | 'test')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 transition-all text-[11px] font-medium",
                        expectedPerformance === option.id
                          ? `${option.bgColor} ${option.borderColor} ${option.color}`
                          : "bg-neutral-800 border-neutral-700 text-neutral-500 hover:border-neutral-600"
                      )}
                    >
                      <option.icon className="h-3.5 w-3.5" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </WorkflowSection>

          {/* STEP 2: KONZEPT */}
          <WorkflowSection
            id="concept"
            title="Konzept"
            icon={Lightbulb}
            isOpen={activeStep === 'concept'}
            isComplete={isStepComplete('concept')}
            preview={getStepPreview('concept')}
            onToggle={() => setActiveStep(activeStep === 'concept' ? activeStep : 'concept')}
            onNext={goToNextStep}
            nextLabel="Weiter: Produktion"
          >
            {/* Idea */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                  Was ist meine Idee?
                </label>
                <Textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Beschreibe deine Video-Idee..."
                  className="min-h-[100px] text-[13px] bg-neutral-800/50/50 border-neutral-700 focus:bg-neutral-700 transition-colors resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                  Workflow / Prozess
                </label>
                <Textarea
                  value={workflow}
                  onChange={(e) => setWorkflow(e.target.value)}
                  placeholder="Beschreibe den Ablauf / Workflow..."
                  className="min-h-[100px] text-[13px] font-mono bg-neutral-800/50 text-white border-neutral-700 focus:bg-neutral-700 transition-colors resize-none"
                />
              </div>
            </div>
            
            {/* Titel & Hook */}
            <div className="pt-4 border-t border-neutral-800 space-y-4">
              <LabeledInput
                label="Video-Titel"
                value={post.content.title || ''}
                onChange={(v) => updateContent('title', v)}
                placeholder="Wie soll das Video heißen?"
              />
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                    Thumbnail Beschreibung
                  </label>
                  <Textarea
                    value={thumbnailDescription}
                    onChange={(e) => setThumbnailDescription(e.target.value)}
                    placeholder="Beschreibe das gewünschte Thumbnail..."
                    className="min-h-[80px] text-[13px] bg-neutral-800/50/50 border-neutral-700 focus:bg-neutral-700 transition-colors resize-none"
                  />
                </div>
                <LabeledInput
                  label="Thumbnail Link (Google Drive)"
                  value={thumbnailLink}
                  onChange={setThumbnailLink}
                  placeholder="https://drive.google.com/..."
                  type="url"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                  Hook (erste 30 Sekunden)
                </label>
                <Textarea
                  value={hook}
                  onChange={(e) => setHook(e.target.value)}
                  placeholder="Script für die ersten 30 Sekunden..."
                  className="min-h-[100px] text-[13px] bg-neutral-800/50/50 border-neutral-700 focus:bg-neutral-700 transition-colors resize-none"
                />
                <CopyBtn text={hook} className="w-full h-9" />
              </div>
            </div>

            {/* Bulletpoints */}
            <div className="pt-4 border-t border-neutral-800 space-y-4">
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                Grober Aufbau des Videos
              </label>
              
              <div className="space-y-2">
                {bulletpoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-neutral-500 text-[13px] w-6">{index + 1}.</span>
                    <Input
                      value={point}
                      onChange={(e) => updateBulletpoint(index, e.target.value)}
                      placeholder={`Punkt ${index + 1}...`}
                      className="flex-1 h-10 text-[13px] bg-neutral-800/50/50 border-neutral-700 focus:bg-neutral-700"
                    />
                    <button
                      onClick={() => removeBulletpoint(index)}
                      className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={addBulletpoint}
                className="w-full h-9 border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Punkt hinzufügen
              </Button>
              
              {bulletpoints.length > 0 && (
                <CopyBtn text={formatBulletpointsForCopy()} className="w-full h-9" />
              )}
            </div>
          </WorkflowSection>

          {/* STEP 3: PRODUKTION */}
          <WorkflowSection
            id="production"
            title="Produktion"
            icon={Video}
            isOpen={activeStep === 'production'}
            isComplete={isStepComplete('production')}
            preview={getStepPreview('production')}
            onToggle={() => setActiveStep(activeStep === 'production' ? activeStep : 'production')}
            onNext={goToNextStep}
            nextLabel="Weiter: Cutting"
          >
            {/* Videos */}
            <div className="space-y-4">
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                Aufgenommene Video-Links
              </label>
              
              <div className="space-y-2">
                {videoLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-neutral-500 text-[12px] w-8">Clip {index + 1}</span>
                    <Input
                      value={link}
                      onChange={(e) => updateVideoLink(index, e.target.value)}
                      placeholder="https://loom.com/... oder Drive-Link"
                      className="flex-1 h-10 text-[13px] bg-neutral-800/50/50 border-neutral-700 focus:bg-neutral-700"
                    />
                    {link && (
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-neutral-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                    <button
                      onClick={() => removeVideoLink(index)}
                      className="p-2 text-neutral-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={addVideoLink}
                className="w-full h-9 border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Video-Link hinzufügen
              </Button>
            </div>

            {/* Beschreibung */}
            <div className="pt-4 border-t border-neutral-800 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                    YouTube Beschreibung
                  </label>
                  <span className="text-[11px] text-neutral-500">
                    {description.length} Zeichen
                  </span>
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[400px] text-[12px] font-mono bg-neutral-800/50/50 border-neutral-700 focus:bg-neutral-700 transition-colors resize-none leading-relaxed"
                />
              </div>
              
              {/* Affiliate Links Quick Insert */}
              {affiliateLinks.length > 0 && (
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                    Affiliate Links einfügen
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {affiliateLinks.map((link) => (
                      <Button
                        key={link.id}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(`${link.name}: ${link.url}`)
                        }}
                        className="h-8 text-[12px]"
                      >
                        <Copy className="h-3 w-3 mr-1.5" />
                        {link.name}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              
              <CopyBtn text={description} className="w-full h-10" />
            </div>
          </WorkflowSection>

          {/* STEP 4: CUTTING */}
          <WorkflowSection
            id="cutting"
            title="Cutting"
            icon={Scissors}
            isOpen={activeStep === 'cutting'}
            isComplete={isStepComplete('cutting')}
            preview={getStepPreview('cutting')}
            onToggle={() => setActiveStep(activeStep === 'cutting' ? activeStep : 'cutting')}
          >
            <div className="space-y-4">
              <LabeledInput
                label="Finales Video"
                value={finalVideoUrl}
                onChange={setFinalVideoUrl}
                placeholder="Link zum fertig geschnittenen Video..."
                type="url"
              />
              
              {finalVideoUrl && (
                <a
                  href={finalVideoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 p-4 rounded-lg bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 transition-colors"
                >
                  <Video className="h-5 w-5" />
                  <span className="font-medium">Finales Video öffnen</span>
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </WorkflowSection>

        </div>
      </div>

      {/* Sidebar */}
      <PostSidebar
        platform="youtube"
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
            status: date ? 'planned' as WorkflowStatusId : post.status
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
          } as YouTubePost
          setPost(updated)
          updateStorePost(post.id, updated)
        }}
        performanceRating={performanceRating}
        learning={learning}
        isGeneratingLearning={isGeneratingLearning}
        onPerformanceRatingChange={(rating) => {
          setPerformanceRating(rating)
          const updated = { ...post, performanceRating: rating }
          updateStorePost(post.id, updated)
        }}
        onLearningChange={(newLearning) => {
          setLearning(newLearning)
          const updated = { ...post, learning: newLearning }
          updateStorePost(post.id, updated)
        }}
        onGenerateLearning={handleGenerateLearning}
      />

      {/* AI Chat Panel */}
      <AiChatPanel
        isOpen={isAiChatOpen}
        onClose={() => setIsAiChatOpen(false)}
        postId={post.id}
        platform="youtube"
        currentPost={post}
      />
    </div>
  )
}
