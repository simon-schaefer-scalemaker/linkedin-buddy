import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Sparkles,
  Workflow,
  Image,
  FileText,
  ListChecks,
  MessageSquare,
  MessageCircle,
  Gem,
  Link2,
  Copy,
  Check,
  Plus,
  X,
  ExternalLink,
  Upload,
  Share2,
  Video,
  Loader2,
  Clock,
  CheckCircle2,
  Settings2,
  Pencil,
  Play,
  ChevronRight,
  ChevronDown,
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Package
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { PostSidebar } from './post-sidebar'
import { AiChatPanel } from './ai-chat-panel'
import { usePostsStore, useTemplatesStore, useCutterSharesStore, useGlobalSettingsStore, type TemplateCategory, type Template } from '@/lib/store'
import type { LinkedInPost, WorkflowStatusId, ContentTagId } from '@/lib/types'
import { cn } from '@/lib/utils'
import { uploadVideo, validateVideoFile, formatFileSize, isSupabaseConfigured } from '@/lib/video-upload'
import { sendMessage, isApiConfigured } from '@/lib/claude-api'
import { buildHypothesisPrompt, buildLearningPrompt } from '@/lib/ai-prompts'

// Workflow Step IDs
type StepId = 'strategy' | 'content' | 'assets'

// Workflow Steps Configuration
const WORKFLOW_STEPS: { id: StepId; title: string; icon: React.ElementType }[] = [
  { id: 'strategy', title: 'Strategie', icon: Target },
  { id: 'content', title: 'Content', icon: FileText },
  { id: 'assets', title: 'Assets', icon: Package },
]

// Template Categories Config
const TEMPLATE_CATEGORIES: { id: TemplateCategory; name: string; icon: React.ElementType; color: string; bgColor: string }[] = [
  { id: 'reply', name: 'Reply', icon: MessageSquare, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { id: 'comment', name: 'Comments', icon: MessageCircle, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { id: 'resource', name: 'Ressource', icon: Gem, color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  { id: 'affiliate', name: 'Affiliate Link', icon: Link2, color: 'text-rose-600', bgColor: 'bg-rose-100' },
]

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
        isOpen ? "border-gray-200 bg-white shadow-sm" : "border-gray-100 bg-gray-50/30",
        isComplete && !isOpen && "border-green-200 bg-green-50/20"
      )}
    >
      {/* Clickable Header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 p-4 text-left transition-colors hover:bg-gray-50/50",
          isOpen && "border-b border-gray-100 hover:bg-transparent"
        )}
      >
        {/* Status Icon */}
        <div className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
          isOpen && "bg-gray-900 text-white",
          !isOpen && isComplete && "bg-green-500 text-white",
          !isOpen && !isComplete && "bg-gray-200 text-gray-500"
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
              isOpen ? "text-gray-900" : isComplete ? "text-green-700" : "text-gray-500"
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
              isComplete ? "text-green-600" : "text-gray-400 italic"
            )}>
              {preview || (isComplete ? "Ausgefüllt" : "Noch nicht ausgefüllt")}
            </p>
          )}
        </div>
        
        {/* Chevron */}
        <div className={cn("shrink-0 transition-transform", isOpen && "rotate-180")}>
          <ChevronDown className={cn(
            "h-5 w-5",
            isOpen ? "text-gray-600" : "text-gray-400"
          )} />
        </div>
      </button>
      
      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-5 space-y-5">
          {children}
          
          {/* Next Step Button */}
          {onNext && nextLabel && (
            <div className="flex justify-end pt-3 border-t border-gray-100">
              <Button onClick={onNext} className="gap-2">
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

// Legacy Section (for non-workflow sections)
function Section({ 
  title, 
  icon: Icon, 
  children,
  action
}: { 
  title: string
  icon: React.ElementType
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-sm">
            <Icon className="h-4 w-4 text-white" />
          </div>
          <h3 className="text-[13px] font-semibold text-gray-900 uppercase tracking-wide">{title}</h3>
        </div>
        {action}
      </div>
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
        <div className="p-5">
          {children}
        </div>
      </div>
    </div>
  )
}

// Premium Copy Button
function CopyBtn({ text, className, variant = 'default' }: { text: string; className?: string; variant?: 'default' | 'minimal' }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    if (!text) return
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  if (variant === 'minimal') {
    return (
      <button
        onClick={handleCopy}
        className={cn(
          "p-2 rounded-lg transition-all",
          copied 
            ? "bg-green-100 text-green-600" 
            : "hover:bg-gray-100 text-gray-400 hover:text-gray-600",
          className
        )}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    )
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

// Premium Quick Comment Card
function QuickCommentCard({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  
  return (
    <button
      onClick={handleCopy}
      className={cn(
        "group/card relative p-3 rounded-xl text-left transition-all duration-200",
        copied 
          ? "bg-green-50 ring-2 ring-green-200" 
          : "bg-gray-50/80 hover:bg-gray-100 hover:shadow-sm"
      )}
    >
      <p className="text-[13px] text-gray-700 font-medium">{text}</p>
      <div className={cn(
        "absolute top-2 right-2 transition-opacity duration-200",
        copied ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"
      )}>
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-gray-400" />
        )}
      </div>
    </button>
  )
}

// Premium Input with Label
function LabeledInput({ 
  label, 
  value, 
  onChange, 
  placeholder,
  type = 'text',
  action
}: { 
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'url'
  action?: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex gap-2">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-11 bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
        />
        {action}
      </div>
    </div>
  )
}

// Helper to create default post
function createDefaultPost(id?: string): LinkedInPost {
  return {
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
      cta: ''
    }
  }
}

export function LinkedInPostForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fromCalendar = searchParams.get('from') === 'calendar'
  
  // Use lazy initialization to prevent recreation on every render
  const [post, setPost] = useState<LinkedInPost>(() => createDefaultPost(id))
  const [isSaving, setIsSaving] = useState(false)
  const [isAiChatOpen, setIsAiChatOpen] = useState(false)
  
  // Video upload states
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Share dialog states
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [sharePassword, setSharePassword] = useState('')
  const [shareInstructions, setShareInstructions] = useState('')
  const [shareSuccess, setShareSuccess] = useState(false)
  
  // Template manager states
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [templateDialogCategory, setTemplateDialogCategory] = useState<TemplateCategory>('comment')
  const [templateFormData, setTemplateFormData] = useState({ name: '', content: '' })
  
  // Template store
  const allTemplates = useTemplatesStore((state) => state.templates)
  const addTemplate = useTemplatesStore((state) => state.addTemplate)
  const updateTemplate = useTemplatesStore((state) => state.updateTemplate)
  const deleteTemplate = useTemplatesStore((state) => state.deleteTemplate)
  
  // Cutter share store
  const { shareWithCutter, getShareByPostId } = useCutterSharesStore()
  
  // Extended fields for template
  const [title, setTitle] = useState('')
  const [workflowUrl, setWorkflowUrl] = useState('')
  const [mediaFile, setMediaFile] = useState<string | null>(null)
  const [finalVideoUrl, setFinalVideoUrl] = useState('')
  const [loomBulletpoints, setLoomBulletpoints] = useState<string[]>([])
  const [newBulletpoint, setNewBulletpoint] = useState('')
  const [dmReply, setDmReply] = useState(`Hi [NAME]! :)

du wolltest die Ressource zu dem [LEADMAGNET] Workflow haben.

Here you go:

[VIDEO]

Hast du schonmal [SOLUTION] erstellt?

LG

Simon`)
  // DM Reply variables
  const [dmName, setDmName] = useState('')
  const [dmLeadmagnet, setDmLeadmagnet] = useState('')
  const [dmVideo, setDmVideo] = useState('')
  const [dmSolution, setDmSolution] = useState('')
  
  const [resourceName, setResourceName] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')
  const [affiliateUrl, setAffiliateUrl] = useState('')
  
  // Global settings store
  const { 
    affiliateLinks, 
    addAffiliateLink, 
    deleteAffiliateLink,
    resourceTemplate: globalResourceTemplate,
    setResourceTemplate: setGlobalResourceTemplate
  } = useGlobalSettingsStore()
  
  // Local state for new affiliate link
  const [newAffiliateName, setNewAffiliateName] = useState('')
  const [newAffiliateUrl, setNewAffiliateUrl] = useState('')
  
  // Strategy section (Hypothesis-First System)
  const [hypothesis, setHypothesis] = useState('')
  const [expectedPerformance, setExpectedPerformance] = useState<'above' | 'average' | 'test'>('average')
  const [referencePostId, setReferencePostId] = useState('')
  const [isGeneratingHypothesis, setIsGeneratingHypothesis] = useState(false)
  
  // Workflow Step Navigation
  const [activeStep, setActiveStep] = useState<StepId>('strategy')
  
  // Post Analysis (Winner/Loser)
  const [performanceRating, setPerformanceRating] = useState<'winner' | 'loser' | 'average' | null>(null)
  const [learning, setLearning] = useState('')
  const [isGeneratingLearning, setIsGeneratingLearning] = useState(false)
  
  // Workflow Step Helpers
  const isStepComplete = (stepId: StepId): boolean => {
    switch (stepId) {
      case 'strategy':
        return hypothesis.trim().length > 0
      case 'content':
        return (post.content?.text?.trim().length || 0) > 0
      case 'assets':
        return true // Assets are optional
      default:
        return false
    }
  }
  
  const getStepPreview = (stepId: StepId): string => {
    switch (stepId) {
      case 'strategy':
        return hypothesis.trim() ? `"${hypothesis.slice(0, 60)}${hypothesis.length > 60 ? '...' : ''}"` : ''
      case 'content':
        const text = post.content?.text?.trim()
        return text ? `${text.slice(0, 60)}${text.length > 60 ? '...' : ''}` : ''
      case 'assets':
        const parts = []
        if (mediaFile) parts.push('Video')
        if (dmReply) parts.push('DM')
        if (resourceUrl) parts.push('Ressource')
        return parts.length > 0 ? parts.join(' • ') : ''
      default:
        return ''
    }
  }
  
  const goToNextStep = () => {
    const currentIndex = WORKFLOW_STEPS.findIndex(s => s.id === activeStep)
    if (currentIndex < WORKFLOW_STEPS.length - 1) {
      const nextStep = WORKFLOW_STEPS[currentIndex + 1].id
      setActiveStep(nextStep)
      // Smooth scroll to the section
      setTimeout(() => {
        document.getElementById(`section-${nextStep}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  }
  
  // Generate DM reply with replaced placeholders
  const getDmReplyMessage = () => {
    let message = dmReply
    if (dmName.trim()) {
      message = message.replace(/\[NAME\]/g, dmName.trim())
    }
    if (dmLeadmagnet.trim()) {
      message = message.replace(/\[LEADMAGNET\]/g, dmLeadmagnet.trim())
    }
    if (dmVideo.trim()) {
      message = message.replace(/\[VIDEO\]/g, dmVideo.trim())
    }
    if (dmSolution.trim()) {
      message = message.replace(/\[SOLUTION\]/g, dmSolution.trim())
    }
    return message
  }
  
  // Generate resource message with replaced placeholders
  const getResourceMessage = () => {
    let message = globalResourceTemplate
    if (resourceName.trim()) {
      message = message.replace(/\[NAME\]/g, resourceName.trim())
    }
    if (resourceUrl.trim()) {
      message = message.replace(/\[LINK\]/g, resourceUrl.trim())
    }
    return message
  }
  
  // Add new affiliate link
  const handleAddAffiliateLink = () => {
    if (newAffiliateName.trim() && newAffiliateUrl.trim()) {
      addAffiliateLink(newAffiliateName.trim(), newAffiliateUrl.trim())
      setNewAffiliateName('')
      setNewAffiliateUrl('')
    }
  }
  
  // Get quick comments from templates store
  const commentTemplates = useTemplatesStore((state) => 
    state.templates.filter(t => t.category === 'comment')
  )
  
  const allPosts = usePostsStore((state) => state.posts)
  const storePost = usePostsStore((state) => state.posts.find(p => p.id === id)) as LinkedInPost | undefined
  const updateStorePost = usePostsStore((state) => state.updatePost)
  const addStorePost = usePostsStore((state) => state.addPost)
  const deleteStorePost = usePostsStore((state) => state.deletePost)
  const [isNewPost, setIsNewPost] = useState(false)
  
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
      setIsNewPost(false)
      if ((storePost as any).title) setTitle((storePost as any).title)
      if ((storePost as any).workflowUrl) setWorkflowUrl((storePost as any).workflowUrl)
      if ((storePost as any).mediaFile) setMediaFile((storePost as any).mediaFile)
      if ((storePost as any).finalVideoUrl) setFinalVideoUrl((storePost as any).finalVideoUrl)
      if ((storePost as any).resourceUrl) setResourceUrl((storePost as any).resourceUrl)
      if ((storePost as any).affiliateUrl) setAffiliateUrl((storePost as any).affiliateUrl)
      if ((storePost as any).loomBulletpoints) setLoomBulletpoints((storePost as any).loomBulletpoints)
      // Load strategy data
      if ((storePost as any).hypothesis) setHypothesis((storePost as any).hypothesis)
      if ((storePost as any).expectedPerformance) setExpectedPerformance((storePost as any).expectedPerformance)
      if ((storePost as any).referencePostId) setReferencePostId((storePost as any).referencePostId)
      // Load post analysis data
      if ((storePost as any).performanceRating) setPerformanceRating((storePost as any).performanceRating)
      if ((storePost as any).learning) setLearning((storePost as any).learning)
    } else {
      setIsNewPost(true)
    }
  }, [id, storePost])

  const handleSave = async () => {
    // Validate hypothesis (required field)
    if (!hypothesis.trim()) {
      alert('Bitte gib eine Hypothese ein: Warum wird dieser Post funktionieren?')
      return
    }
    
    setIsSaving(true)
    const extendedPost = {
      ...post,
      title,
      workflowUrl,
      mediaFile,
      finalVideoUrl,
      resourceUrl,
      affiliateUrl,
      loomBulletpoints,
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
      // Add new post to store
      addStorePost(extendedPost as LinkedInPost)
      setIsNewPost(false)
      console.log('✅ New post added:', extendedPost.id)
    } else {
      // Update existing post
      updateStorePost(post.id, extendedPost)
      console.log('✅ Post updated:', post.id)
    }
    
    await new Promise(resolve => setTimeout(resolve, 300))
    setIsSaving(false)
  }
  
  const handleDelete = () => {
    if (confirm('Post wirklich löschen?')) {
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
        'linkedin',
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
    if (post.content.cta) parts.push(post.content.cta)
    return parts.join('\n\n')
  }
  
  const addBulletpoint = () => {
    if (newBulletpoint.trim()) {
      setLoomBulletpoints([...loomBulletpoints, newBulletpoint.trim()])
      setNewBulletpoint('')
    }
  }
  
  const removeBulletpoint = (index: number) => {
    setLoomBulletpoints(loomBulletpoints.filter((_, i) => i !== index))
  }
  
  const charCount = getFullPostText().length
  const currentShare = post?.id ? getShareByPostId(post.id) : undefined
  
  // Handle video file selection
  const handleVideoSelect = async (file: File) => {
    setUploadError(null)
    const validation = validateVideoFile(file)
    if (!validation.valid) {
      setUploadError(validation.error || 'Ungültige Datei')
      return
    }
    
    if (!isSupabaseConfigured()) {
      setUploadError('Supabase ist nicht konfiguriert.')
      return
    }
    
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)
      
      const result = await uploadVideo(file, 'raw', post!.id)
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      if (result.success && result.url) {
        setMediaFile(result.url)
        updateStorePost(post!.id, { ...post, mediaFile: result.url } as any)
      } else {
        setUploadError(result.error || 'Upload fehlgeschlagen')
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload fehlgeschlagen')
    } finally {
      setIsUploading(false)
    }
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      handleVideoSelect(file)
    }
  }
  
  const handleShareWithCutter = () => {
    if (!post || !mediaFile || !sharePassword.trim()) return
    
    const share = shareWithCutter(
      post.id,
      post.content.text?.slice(0, 50) || 'LinkedIn Post',
      sharePassword.trim(),
      mediaFile,
      shareInstructions
    )
    
    if (share) {
      setShareSuccess(true)
      setTimeout(() => {
        setIsShareDialogOpen(false)
        setShareSuccess(false)
        setSharePassword('')
        setShareInstructions('')
      }, 2000)
    }
  }
  
  const copyCutterLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/cutter`)
  }
  
  // Template manager functions
  const openNewTemplateDialog = (category: TemplateCategory) => {
    setEditingTemplate(null)
    setTemplateDialogCategory(category)
    setTemplateFormData({ name: '', content: '' })
    setIsTemplateDialogOpen(true)
  }
  
  const openEditTemplateDialog = (template: Template) => {
    setEditingTemplate(template)
    setTemplateDialogCategory('comment')
    setTemplateFormData({ name: template.content, content: template.content })
    setIsTemplateDialogOpen(true)
  }
  
  const handleSaveTemplate = () => {
    if (!templateFormData.name.trim() || !templateFormData.content.trim()) return
    
    if (editingTemplate) {
      updateTemplate(editingTemplate.id, templateFormData)
    } else {
      addTemplate({
        category: templateDialogCategory,
        name: templateFormData.name,
        content: templateFormData.content,
      })
    }
    setIsTemplateDialogOpen(false)
  }
  
  const handleDeleteTemplate = (templateId: string) => {
    if (confirm('Template wirklich löschen?')) {
      deleteTemplate(templateId)
    }
  }

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)] -my-4">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between pb-5 shrink-0 border-b border-gray-100 mb-5">
          <div className="flex items-center gap-4">
            <button 
              onClick={handleBack}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post-Titel eingeben..."
              className="text-lg font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0 bg-transparent w-[350px] text-gray-900"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAiChatOpen(true)}
              className="gap-2 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200 hover:border-orange-300 text-orange-700"
            >
              <Sparkles className="h-4 w-4" />
              AI Assistent
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              className="text-gray-400 hover:text-red-600 hover:bg-red-50" 
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button 
              size="sm" 
              onClick={handleSave} 
              disabled={isSaving}
              className="gap-2 bg-gray-900 hover:bg-gray-800"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Speichern
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
                  activeStep === step.id && "bg-gray-900 text-white",
                  activeStep !== step.id && isStepComplete(step.id) && "bg-green-100 text-green-700 hover:bg-green-200",
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
                  isStepComplete(step.id) ? "bg-green-300" : "bg-gray-200"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4">
          
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
            nextLabel="Weiter: Content"
          >
            <div className="space-y-4">
              {/* Hypothesis */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Hypothese: Warum wird dieser Post funktionieren?
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
                        const currentContent = post.content?.text || ''
                        const { systemPrompt, userPrompt } = buildHypothesisPrompt('linkedin', allPosts, currentContent)
                        
                        const response = await sendMessage({
                          systemPrompt,
                          messages: [{ role: 'user', content: userPrompt }]
                        })
                        
                        setHypothesis(response.trim())
                      } catch (err) {
                        console.error('Failed to generate hypothesis:', err)
                        setHypothesis('Dieser Post wird funktionieren, weil er [Muster aus deinen Winner-Posts] nutzt.')
                      } finally {
                        setIsGeneratingHypothesis(false)
                      }
                    }}
                    disabled={isGeneratingHypothesis}
                    className="h-7 text-[11px] gap-1.5"
                  >
                    {isGeneratingHypothesis ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    AI Vorschlag
                  </Button>
                </div>
                <Textarea
                  value={hypothesis}
                  onChange={(e) => setHypothesis(e.target.value)}
                  placeholder="z.B. 'Carousel-Posts mit konkreten Zahlen performen 40% besser. Dieser Post nutzt 5 konkrete Statistiken im Slider-Format.'"
                  className={cn(
                    "min-h-[100px] text-[13px] leading-relaxed resize-none transition-colors",
                    hypothesis.trim() 
                      ? "bg-green-50/50 border-green-200 focus:bg-white" 
                      : "bg-amber-50/50 border-amber-200 focus:bg-white"
                  )}
                />
                {!hypothesis.trim() && (
                  <p className="text-[11px] text-amber-600">
                    ⚠️ Ohne Hypothese kannst du den Post nicht speichern
                  </p>
                )}
              </div>
              
              {/* Expected Performance */}
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                  Erwartete Performance
                </label>
                <div className="flex gap-2">
                  {[
                    { id: 'above', label: 'Überdurchschnittlich', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
                    { id: 'average', label: 'Durchschnitt', icon: Minus, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
                    { id: 'test', label: 'Test/Experiment', icon: Target, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => setExpectedPerformance(option.id as 'above' | 'average' | 'test')}
                      className={cn(
                        "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 transition-all text-[12px] font-medium",
                        expectedPerformance === option.id
                          ? `${option.bgColor} ${option.borderColor} ${option.color}`
                          : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                      )}
                    >
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Reference Post */}
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                  Referenz-Post (Optional)
                </label>
                <select
                  value={referencePostId}
                  onChange={(e) => setReferencePostId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-gray-50/50 text-[13px] text-gray-700 focus:bg-white focus:border-gray-300 transition-colors"
                >
                  <option value="">Kein Referenz-Post</option>
                  {allPosts
                    .filter(p => p.platform === 'linkedin' && p.status === 'published' && p.id !== post.id)
                    .slice(0, 10)
                    .map(p => (
                      <option key={p.id} value={p.id}>
                        {(p as any).title || p.content?.text?.slice(0, 50) || 'Untitled'} 
                        {p.metrics?.impressions ? ` (${p.metrics.impressions.toLocaleString()} Impressions)` : ''}
                      </option>
                    ))
                  }
                </select>
                <p className="text-[11px] text-gray-400">
                  Wähle einen erfolgreichen Post als Vorlage/Inspiration
                </p>
              </div>
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
            onToggle={() => setActiveStep(activeStep === 'content' ? activeStep : 'content')}
            onNext={goToNextStep}
            nextLabel="Weiter: Assets"
          >
            {/* Workflow URL - compact */}
            <div className="space-y-2 pb-4 border-b border-gray-100">
              <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                Workflow URL (optional)
              </label>
              <div className="flex gap-2">
                <Input
                  value={workflowUrl}
                  onChange={(e) => setWorkflowUrl(e.target.value)}
                  placeholder="https://notion.so/... oder andere URL"
                  className="text-[13px]"
                />
                <div className="flex gap-1">
                  {workflowUrl && (
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-11 w-11"
                      onClick={() => window.open(workflowUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <CopyBtn text={workflowUrl} variant="minimal" className="h-11 w-11" />
                </div>
              </div>
            </div>
              {/* Upload Area */}
              {!mediaFile ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-200",
                    isDragging 
                      ? "border-orange-400 bg-orange-50" 
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                  )}
                >
                  {isUploading ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-100 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-gray-700">Wird hochgeladen...</p>
                        <p className="text-[12px] text-gray-500 mt-1">{uploadProgress}%</p>
                      </div>
                      <div className="w-48 h-1.5 bg-gray-200 rounded-full mx-auto overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                        <Upload className="h-7 w-7 text-gray-400" />
                      </div>
                      <p className="text-[14px] font-medium text-gray-700">
                        Rohmaterial hochladen
                      </p>
                      <p className="text-[12px] text-gray-400 mt-1">
                        Ziehe ein Video hierher oder klicke zum Auswählen
                      </p>
                      <p className="text-[11px] text-gray-400 mt-3">
                        MP4, MOV, WebM • Max. 500MB
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleVideoSelect(file)
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Video Preview Card */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-sm">
                      <Play className="h-6 w-6 text-white ml-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900">Rohmaterial</p>
                      <p className="text-[11px] text-gray-500 truncate mt-0.5">{mediaFile}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => window.open(mediaFile, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => setMediaFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Share Button */}
                  {!currentShare ? (
                    <Button 
                      onClick={() => setIsShareDialogOpen(true)}
                      className="w-full h-11 gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-sm"
                    >
                      <Share2 className="h-4 w-4" />
                      An Cutter senden
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      onClick={copyCutterLink}
                      className="w-full h-11 gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Cutter-Link kopieren
                    </Button>
                  )}
                </div>
              )}
              
              {uploadError && (
                <p className="text-[12px] text-red-600 bg-red-50 px-3 py-2 rounded-lg">{uploadError}</p>
              )}
              
              {/* Final Video */}
              {(currentShare?.finalVideoUrl || finalVideoUrl) && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-green-800">Finales Video</p>
                    <p className="text-[11px] text-green-600 truncate mt-0.5">Vom Cutter fertiggestellt</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                    onClick={() => window.open(currentShare?.finalVideoUrl || finalVideoUrl, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Öffnen
                  </Button>
                </div>
              )}
              
              {/* Manual Mode Warning */}
              {!isSupabaseConfigured() && !mediaFile && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <p className="text-[11px] text-amber-600 font-medium">
                    ⚠️ Manueller Modus (Supabase nicht konfiguriert)
                  </p>
                  <Input
                    value={mediaFile || ''}
                    onChange={(e) => setMediaFile(e.target.value)}
                    placeholder="Video-Link einfügen (Google Drive, Dropbox...)"
                    className="h-11"
                  />
                </div>
              )}

            {/* LinkedIn Post Text */}
            <div className="pt-4 border-t border-gray-100 space-y-4">
              <Textarea
                value={getFullPostText()}
                onChange={(e) => updateContent('text', e.target.value)}
                placeholder="Schreibe deinen LinkedIn Post..."
                className="min-h-[220px] text-[14px] leading-relaxed resize-none bg-gray-50/50 border-gray-200 focus:bg-white transition-colors"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "text-[12px] font-medium px-2.5 py-1 rounded-full",
                    charCount > 2800 
                      ? "bg-red-100 text-red-700" 
                      : charCount > 2500 
                        ? "bg-amber-100 text-amber-700" 
                        : "bg-gray-100 text-gray-600"
                  )}>
                    {charCount.toLocaleString()} / 3.000
                  </span>
                  {charCount > 0 && charCount <= 2500 && (
                    <span className="text-[11px] text-gray-400">Gute Länge</span>
                  )}
                </div>
                <CopyBtn text={getFullPostText()} />
              </div>
            </div>

            {/* Loom Bulletpoints */}
            <div className="pt-4 border-t border-gray-100">
              <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3 block">
                Loom Bulletpoints
              </label>
              <div className="space-y-4">
              {loomBulletpoints.length > 0 && (
                <div className="space-y-2">
                  {loomBulletpoints.map((point, index) => (
                    <div 
                      key={index} 
                      className="group flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[11px] font-semibold text-gray-600">
                        {index + 1}
                      </div>
                      <span className="flex-1 text-[13px] text-gray-700">{point}</span>
                      <button 
                        onClick={() => removeBulletpoint(index)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  value={newBulletpoint}
                  onChange={(e) => setNewBulletpoint(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addBulletpoint()}
                  placeholder="Neuen Punkt hinzufügen..."
                  className="flex-1 h-11 bg-gray-50/50"
                />
                <Button 
                  variant="outline"
                  onClick={addBulletpoint}
                  disabled={!newBulletpoint.trim()}
                  className="h-11 px-4"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              </div>
            </div>
          </WorkflowSection>

          {/* STEP 3: ASSETS */}
          <WorkflowSection
            id="assets"
            title="Assets & Templates"
            icon={Package}
            isOpen={activeStep === 'assets'}
            isComplete={isStepComplete('assets')}
            preview={getStepPreview('assets')}
            onToggle={() => setActiveStep(activeStep === 'assets' ? activeStep : 'assets')}
          >
            {/* DM Reply */}
            <div className="space-y-4">
              {/* Template */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Vorlage
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {['[NAME]', '[LEADMAGNET]', '[VIDEO]', '[SOLUTION]'].map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 rounded bg-gray-100 text-[9px] font-mono text-gray-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <Textarea
                  value={dmReply}
                  onChange={(e) => setDmReply(e.target.value)}
                  className="min-h-[160px] text-[13px] leading-relaxed bg-gray-50/50 border-gray-200 focus:bg-white transition-colors resize-none"
                />
              </div>
              
              {/* Variables */}
              <div className="grid grid-cols-2 gap-3">
                <LabeledInput
                  label="[NAME]"
                  value={dmName}
                  onChange={setDmName}
                  placeholder="Name des Empfängers"
                />
                <LabeledInput
                  label="[LEADMAGNET]"
                  value={dmLeadmagnet}
                  onChange={setDmLeadmagnet}
                  placeholder="z.B. Notion Template"
                />
                <LabeledInput
                  label="[VIDEO]"
                  value={dmVideo}
                  onChange={setDmVideo}
                  placeholder="Video-Link"
                />
                <LabeledInput
                  label="[SOLUTION]"
                  value={dmSolution}
                  onChange={setDmSolution}
                  placeholder="z.B. Automationen"
                />
              </div>
              
              {/* Preview */}
              {(dmName || dmLeadmagnet || dmVideo || dmSolution) && (
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Vorschau
                  </label>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {getDmReplyMessage()}
                  </div>
                </div>
              )}
              
              <CopyBtn text={getDmReplyMessage()} className="w-full h-10" />
            </div>

            {/* Quick Comments */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                  Quick Comments
                </label>
                <button 
                  onClick={() => setIsTemplateManagerOpen(true)}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Verwalten
                </button>
              </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {commentTemplates.map((template) => (
                <QuickCommentCard key={template.id} text={template.content} />
              ))}
              {commentTemplates.length === 0 && (
                <>
                  <QuickCommentCard text="Ist raus" />
                  <QuickCommentCard text="Check deine Inbox" />
                  <QuickCommentCard text="Check deine DMs" />
                  <QuickCommentCard text="Habs dir geschickt" />
                  <QuickCommentCard text="Done" />
                  <QuickCommentCard text="Gesendet" />
                </>
              )}
            </div>
            </div>

            {/* Resource */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                  Ressource teilen
                </label>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  Global gespeichert
                </span>
              </div>
            <div className="space-y-4">
              {/* Template Text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Vorlage (für alle Karten)
                  </label>
                  <div className="flex gap-1.5">
                    {['[NAME]', '[LINK]'].map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded bg-gray-100 text-[10px] font-mono text-gray-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <Textarea
                  value={globalResourceTemplate}
                  onChange={(e) => setGlobalResourceTemplate(e.target.value)}
                  className="min-h-[120px] text-[14px] leading-relaxed bg-gray-50/50 border-gray-200 focus:bg-white transition-colors resize-none"
                />
              </div>
              
              {/* Name & Link Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <LabeledInput
                  label="Empfänger [NAME]"
                  value={resourceName}
                  onChange={setResourceName}
                  placeholder="Name eingeben..."
                />
                <LabeledInput
                  label="Ressourcen [LINK]"
                  value={resourceUrl}
                  onChange={setResourceUrl}
                  placeholder="https://..."
                />
              </div>
              
              {/* Preview */}
              {(resourceName || resourceUrl) && (
                <div className="space-y-2">
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                    Vorschau
                  </label>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 text-[13px] text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {getResourceMessage()}
                  </div>
                </div>
              )}
              
              <CopyBtn text={getResourceMessage()} className="w-full h-10" />
            </div>
            </div>

            {/* Affiliate Links */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                  Affiliate Links
                </label>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  Global gespeichert
                </span>
              </div>
            <div className="space-y-4">
              {/* Existing Links */}
              {affiliateLinks.length > 0 && (
                <div className="space-y-2">
                  {affiliateLinks.map((link) => (
                    <div 
                      key={link.id}
                      className="group flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 hover:border-rose-300 transition-colors"
                    >
                      <Link2 className="h-5 w-5 text-rose-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-rose-700 truncate">{link.name}</p>
                        <p className="text-[11px] text-rose-500 truncate">{link.url}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <CopyBtn text={link.url} variant="minimal" />
                        <button
                          onClick={() => window.open(link.url, '_blank')}
                          className="p-2 rounded-lg hover:bg-rose-100 text-rose-400 hover:text-rose-600 transition-colors"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => deleteAffiliateLink(link.id)}
                          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-rose-100 text-rose-400 hover:text-rose-600 transition-all"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Add New Link */}
              <div className="p-4 rounded-xl border border-dashed border-gray-300 bg-gray-50/50">
                <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Neuen Link hinzufügen
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newAffiliateName}
                    onChange={(e) => setNewAffiliateName(e.target.value)}
                    placeholder="Name (z.B. Weavy.ai)"
                    className="h-10 flex-1 bg-white"
                  />
                  <Input
                    value={newAffiliateUrl}
                    onChange={(e) => setNewAffiliateUrl(e.target.value)}
                    placeholder="https://..."
                    className="h-10 flex-[2] bg-white"
                  />
                  <Button
                    onClick={handleAddAffiliateLink}
                    disabled={!newAffiliateName.trim() || !newAffiliateUrl.trim()}
                    className="h-10 px-4"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {affiliateLinks.length === 0 && (
                <p className="text-[12px] text-gray-400 text-center py-2">
                  Noch keine Affiliate Links gespeichert
                </p>
              )}
            </div>
            </div>
          </WorkflowSection>

        </div>
      </div>

      {/* Sidebar */}
      <PostSidebar
        platform="linkedin"
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
          setPost(updated as LinkedInPost)
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
        platform="linkedin"
        currentPost={post}
      />
      
      {/* Share with Cutter Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-orange-500" />
              An Cutter senden
            </DialogTitle>
          </DialogHeader>
          
          {shareSuccess ? (
            <div className="py-10 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-[16px] font-semibold text-gray-900">Erfolgreich geteilt!</p>
              <p className="text-[13px] text-gray-500 mt-2">
                Teile den Link mit deinem Cutter
              </p>
            </div>
          ) : (
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-700">Passwort für Cutter</label>
                <Input
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  placeholder="z.B. cutter2024"
                  className="h-11"
                />
                <p className="text-[11px] text-gray-500">
                  Der Cutter braucht dieses Passwort
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-gray-700">Anweisungen (optional)</label>
                <Textarea
                  value={shareInstructions}
                  onChange={(e) => setShareInstructions(e.target.value)}
                  placeholder="z.B. Bitte mit Untertiteln versehen..."
                  className="min-h-[80px] resize-none"
                />
              </div>
              
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
                <p className="text-[11px] font-medium text-gray-500 mb-2">Cutter-Link</p>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/cutter`}
                    readOnly
                    className="text-[12px] bg-white h-10"
                  />
                  <Button variant="outline" size="sm" onClick={copyCutterLink} className="h-10 px-3">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {!shareSuccess && (
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button 
                onClick={handleShareWithCutter}
                disabled={!sharePassword.trim()}
                className="gap-2 bg-orange-500 hover:bg-orange-600"
              >
                <Share2 className="h-4 w-4" />
                Senden
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Quick Comments Manager Dialog */}
      <Dialog open={isTemplateManagerOpen} onOpenChange={setIsTemplateManagerOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-500" />
              Quick Comments verwalten
            </DialogTitle>
            <DialogDescription>
              Schnelle Antworten für Kommentare (global gespeichert)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4 max-h-[50vh] overflow-y-auto">
            {commentTemplates.length > 0 ? (
              commentTemplates.map((template) => (
                <div 
                  key={template.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 group transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-gray-700">{template.content}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditTemplateDialog(template)}
                      className="p-2 rounded-lg hover:bg-white text-gray-400 hover:text-gray-600"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[12px] text-gray-400 py-4 text-center">
                Noch keine Quick Comments
              </p>
            )}
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => openNewTemplateDialog('comment')}
            >
              <Plus className="h-4 w-4 mr-2" />
              Neuer Comment
            </Button>
            <Button variant="outline" onClick={() => setIsTemplateManagerOpen(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Quick Comment Add/Edit Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'Comment bearbeiten' : 'Neuer Quick Comment'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              value={templateFormData.content}
              onChange={(e) => setTemplateFormData(d => ({ ...d, name: e.target.value, content: e.target.value }))}
              placeholder="z.B. Ist raus, Check deine DMs..."
              className="h-11"
              autoFocus
            />
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSaveTemplate} 
              disabled={!templateFormData.content.trim()}
            >
              {editingTemplate ? 'Speichern' : 'Hinzufügen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
