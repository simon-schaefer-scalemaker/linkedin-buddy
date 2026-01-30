import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { 
  ArrowLeft, 
  Trash2, 
  Sparkles,
  FileText,
  MessageCircle,
  Link2,
  Copy,
  Check,
  Plus,
  X,
  ExternalLink,
  Upload,
  Share2,
  Loader2,
  CheckCircle2,
  Settings2,
  Pencil,
  Play,
  ChevronRight,
  ChevronDown,
  Target,
  Package,
  Send,
  Bot,
  User,
  CornerDownLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { PostSidebar } from './post-sidebar'
import { AiChatPanel } from './ai-chat-panel'
import { usePostsStore, useTemplatesStore, useCutterSharesStore, useGlobalSettingsStore, type TemplateCategory, type Template } from '@/lib/store'
import { useChatStore } from '@/stores/chatStore'
import type { LinkedInPost, WorkflowStatusId, ContentTagId, HookType, ContentTopic, ContentFormat } from '@/lib/types'
import { cn } from '@/lib/utils'
import { uploadVideo, validateVideoFile, isSupabaseConfigured } from '@/lib/video-upload'
import { sendMessage, isApiConfigured, chatMessagesToClaudeMessages } from '@/lib/claude-api'
import { buildHypothesisPrompt, buildLearningPrompt, buildSystemPrompt, buildEnhancedSystemPrompt } from '@/lib/ai-prompts'
import { analyzeWritingStyle } from '@/lib/style-analyzer'
import { storePostMemory, storeConversationMemory } from '@/lib/eugene-memory'

// Workflow Step IDs
type StepId = 'strategy' | 'content' | 'assets'

// Workflow Steps Configuration
const WORKFLOW_STEPS: { id: StepId; title: string; icon: React.ElementType }[] = [
  { id: 'strategy', title: 'Strategie', icon: Target },
  { id: 'content', title: 'Content', icon: FileText },
  { id: 'assets', title: 'Assets', icon: Package },
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
  nextDisabled,
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
  nextDisabled?: boolean
  children: React.ReactNode
}) {
  return (
    <div 
      id={`section-${id}`}
      className={cn(
        "border rounded-xl transition-all duration-200 overflow-hidden",
        // Light mode
        isOpen ? "border-neutral-300 bg-white shadow-lg" : "border-neutral-200 bg-neutral-50",
        // Dark mode
        isOpen ? "dark:border-neutral-600 dark:bg-neutral-800" : "dark:border-neutral-700 dark:bg-neutral-800/50"
      )}
    >
      {/* Clickable Header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 p-4 text-left transition-colors",
          "hover:bg-neutral-100 dark:hover:bg-neutral-800/50",
          isOpen && "border-b border-neutral-200 dark:border-neutral-800 hover:bg-transparent dark:hover:bg-transparent"
        )}
      >
        {/* Status Icon */}
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all",
          isOpen && "bg-neutral-900 text-white dark:bg-neutral-600",
          !isOpen && isComplete && "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-500/20",
          !isOpen && !isComplete && "bg-neutral-200 text-neutral-400 dark:bg-neutral-700 dark:text-neutral-500"
        )}>
          {isComplete && !isOpen ? (
            <Check className="h-4 w-4" strokeWidth={2.5} />
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </div>
        
        {/* Title & Preview */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn(
              "font-semibold text-[13px] uppercase tracking-wide",
              isOpen ? "text-neutral-900 dark:text-white" : "text-neutral-600 dark:text-neutral-300"
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
              "text-[11px] mt-1 truncate max-w-[500px] text-neutral-500 dark:text-neutral-400",
              !isComplete && "italic"
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
        <div className="p-5 space-y-5 bg-[#191919] text-neutral-200 rounded-b-xl overflow-hidden">
          {children}
          
          {/* Next Step Button */}
          {nextLabel && (
            <div className="flex justify-end pt-3 border-t border-[#333]">
              <Button 
                onClick={onNext} 
                disabled={nextDisabled || !onNext}
                className="gap-2"
              >
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
            : "hover:bg-neutral-800 text-neutral-500 hover:text-neutral-400",
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
          : "bg-neutral-800/50/80 hover:bg-neutral-800 hover:shadow-sm"
      )}
    >
      <p className="text-[13px] text-neutral-300 font-medium">{text}</p>
      <div className={cn(
        "absolute top-2 right-2 transition-opacity duration-200",
        copied ? "opacity-100" : "opacity-0 group-hover/card:opacity-100"
      )}>
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-600" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-neutral-500" />
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
      <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
        {label}
      </label>
      <div className="flex gap-2">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 h-11 bg-neutral-50 border-neutral-200 focus:bg-white dark:bg-neutral-800/50 dark:border-neutral-700 dark:focus:bg-neutral-700 transition-colors"
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
  
  // Inline Chat for post generation
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  
  // Chat store for inline chat (use post-specific chat)
  const chatId = `content-${post?.id || 'new'}`
  const chatMessages = useChatStore((state) => state.getChat(chatId))
  const addChatMessage = useChatStore((state) => state.addMessage)
  const clearChatMessages = useChatStore((state) => state.clearChat)
  const startAssistantMessage = useChatStore((state) => state.startAssistantMessage)
  const updateLastAssistantMessage = useChatStore((state) => state.updateLastAssistantMessage)
  
  // Scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])
  
  // Build context for AI from current form data
  const buildContentContext = () => {
    let context = ''
    if (idea) context += `**Idee:** ${idea}\n`
    if (hypothesis) context += `**Hypothese:** ${hypothesis}\n`
    if (loomBulletpoints.length > 0) {
      context += `**Loom Bulletpoints:**\n${loomBulletpoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}\n`
    }
    if (hookType) context += `**Hook-Typ:** ${hookType}\n`
    if (topic) context += `**Thema:** ${topic}\n`
    return context
  }
  
  // Send chat message
  const handleChatSend = async () => {
    if (!chatInput.trim() || isChatLoading) return
    
    const userMessage = chatInput.trim()
    setChatInput('')
    setChatError(null)
    
    // Add user message
    addChatMessage(chatId, { role: 'user', content: userMessage })
    
    // Store user message in Eugene's memory (async, don't wait)
    storeConversationMemory({
      context_type: 'post_creation',
      context_id: post?.id,
      role: 'user',
      content: userMessage
    }).catch(() => {}) // Silent fail
    
    setIsChatLoading(true)
    startAssistantMessage(chatId)
    
    try {
      // Build context for current post
      const contentContext = buildContentContext()
      const currentContent = getFullPostText()
      
      // Try enhanced system prompt with semantic search, fallback to basic
      let systemPrompt: string
      try {
        systemPrompt = await buildEnhancedSystemPrompt(
          'linkedin',
          allPosts,
          post,
          idea || hypothesis, // Use idea or hypothesis for semantic search
          currentContent
        )
      } catch {
        // Fallback to basic prompt
        systemPrompt = buildSystemPrompt('linkedin', allPosts, post)
      }
      
      const enhancedSystemPrompt = `${systemPrompt}

# AKTUELLER POST-KONTEXT
Der User arbeitet gerade an folgendem Post:
${contentContext}

# DEINE AUFGABE
- Hilf dem User, einen LinkedIn Post zu schreiben
- Nutze seinen Schreibstil aus den analysierten Winner-Posts
- Berücksichtige die Idee, Hypothese und Loom Bulletpoints
- Wenn du einen Post generierst, schreibe ihn komplett fertig
- Der User kann den Post dann direkt in sein Textfeld übernehmen`
      
      let fullResponse = ''
      await sendMessage({
        systemPrompt: enhancedSystemPrompt,
        messages: chatMessagesToClaudeMessages([...chatMessages, { id: '', role: 'user', content: userMessage, timestamp: '' }]),
        onChunk: (content) => {
          fullResponse = content
          updateLastAssistantMessage(chatId, content)
        },
        onError: (err) => {
          setChatError(err.message)
        }
      })
      
      // Store assistant response in Eugene's memory (async, don't wait)
      if (fullResponse) {
        storeConversationMemory({
          context_type: 'post_creation',
          context_id: post?.id,
          role: 'assistant',
          content: fullResponse
        }).catch(() => {}) // Silent fail
      }
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Fehler bei der Anfrage')
      updateLastAssistantMessage(chatId, '❌ ' + (err instanceof Error ? err.message : 'Fehler'))
    } finally {
      setIsChatLoading(false)
    }
  }
  
  // Handle chat key press
  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleChatSend()
    }
  }
  
  // Insert AI response into post
  const insertIntoPost = (content: string) => {
    // Extract just the post content (remove any explanations)
    const cleanContent = content.trim()
    updateContent('text', cleanContent)
  }
  
  // Local state for new affiliate link
  const [newAffiliateName, setNewAffiliateName] = useState('')
  const [newAffiliateUrl, setNewAffiliateUrl] = useState('')
  
  // Strategy section (Hypothesis-First System)
  const [idea, setIdea] = useState('')
  const [hypothesis, setHypothesis] = useState('')
  const [expectedPerformance, setExpectedPerformance] = useState<'above' | 'average' | 'test'>('average')
  const [referencePostId, setReferencePostId] = useState('')
  const [isGeneratingHypothesis, setIsGeneratingHypothesis] = useState(false)
  
  // Post Metadata for AI Learning
  const [hookType, setHookType] = useState<HookType | undefined>(undefined)
  const [topic, setTopic] = useState<ContentTopic | undefined>(undefined)
  const [format, setFormat] = useState<ContentFormat | undefined>(undefined)
  
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
  
  // Check if we have style data from winner posts
  const hasStyleData = useMemo(() => {
    const styleAnalysis = analyzeWritingStyle(allPosts, 'linkedin')
    return styleAnalysis !== null
  }, [allPosts])
  
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
      if ((storePost as any).idea) setIdea((storePost as any).idea)
      if ((storePost as any).hypothesis) setHypothesis((storePost as any).hypothesis)
      if ((storePost as any).expectedPerformance) setExpectedPerformance((storePost as any).expectedPerformance)
      if ((storePost as any).referencePostId) setReferencePostId((storePost as any).referencePostId)
      // Load post metadata for AI learning
      if ((storePost as any).hookType) setHookType((storePost as any).hookType)
      if ((storePost as any).topic) setTopic((storePost as any).topic)
      if ((storePost as any).format) setFormat((storePost as any).format)
      // Load post analysis data
      if ((storePost as any).performanceRating) setPerformanceRating((storePost as any).performanceRating)
      if ((storePost as any).learning) setLearning((storePost as any).learning)
    } else {
      setIsNewPost(true)
    }
  }, [id, storePost])

  const handleSave = async () => {
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
      idea,
      hypothesis,
      expectedPerformance,
      referencePostId: referencePostId || null,
      // Post metadata for AI learning
      hookType: hookType || undefined,
      topic: topic || undefined,
      format: format || undefined,
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

  // Auto-save when content changes
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    // Skip auto-save on initial load
    if (!post.id) return
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }
    
    // Set new timeout for auto-save (1 second debounce)
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSave()
    }, 1000)
    
    // Cleanup on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [title, idea, hypothesis, expectedPerformance, referencePostId, hookType, topic, format, post.content, performanceRating, learning])
  
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
    <div className="flex gap-6 h-[calc(100vh-140px)] -my-4 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-4 pb-5 shrink-0 mb-5">
          <button 
            onClick={handleBack}
            className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-neutral-400" />
          </button>
          
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post-Titel eingeben..."
            className="flex-1 text-xl font-semibold border-none shadow-none px-3 py-2 h-auto focus-visible:ring-0 bg-transparent text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600"
          />
          
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAiChatOpen(true)}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              AI Assistent
            </Button>
            {isSaving && (
              <span className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Speichert...
              </span>
            )}
            <Button 
              variant="ghost" 
              size="icon"
              className="text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 dark:hover:text-red-400"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Progress Stepper */}
        <div className="flex items-center gap-2 pb-4 border-b border-neutral-200 dark:border-neutral-800 mb-4 shrink-0">
          {WORKFLOW_STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setActiveStep(step.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all text-[11px] font-medium",
                  activeStep === step.id && "bg-neutral-900 text-white dark:bg-white dark:text-black",
                  activeStep !== step.id && isStepComplete(step.id) && "bg-green-100 text-green-700 hover:bg-green-200",
                  activeStep !== step.id && !isStepComplete(step.id) && "bg-neutral-100 text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
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
                  isStepComplete(step.id) ? "bg-green-300" : "bg-neutral-300 dark:bg-neutral-700"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 pr-2 pb-4">
          
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
            onNext={hypothesis.trim() ? goToNextStep : undefined}
            nextLabel="Weiter: Content"
            nextDisabled={!hypothesis.trim()}
          >
            <div className="space-y-4">
              {/* Idea - First Step */}
              <div className="space-y-2">
                <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                  Idee: Worüber möchtest du posten?
                </label>
                <Textarea
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  placeholder="Worum soll es in deinem nächsten Post gehen?"
                  className="min-h-[80px] text-[13px] leading-relaxed resize-none bg-[#252525] border-[#333] text-white placeholder:text-neutral-500 focus:border-neutral-500 focus:ring-0"
                />
              </div>

              {/* Hypothesis */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                    Hypothese: Warum wird dieser Post funktionieren?
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (!idea.trim()) {
                        alert('Bitte gib erst eine Idee ein, damit die AI eine Hypothese generieren kann.')
                        return
                      }
                      
                      setIsGeneratingHypothesis(true)
                      try {
                        const { systemPrompt, userPrompt } = buildHypothesisPrompt('linkedin', allPosts, idea)
                        
                        const response = await sendMessage({
                          systemPrompt,
                          messages: [{ role: 'user', content: userPrompt }]
                        })
                        
                        setHypothesis(response.trim())
                      } catch (err: any) {
                        console.error('Failed to generate hypothesis:', err)
                        alert(err?.message || 'AI-Vorschlag konnte nicht generiert werden.')
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
                    "min-h-[100px] text-[13px] leading-relaxed resize-none transition-colors text-white placeholder:text-neutral-500 focus:ring-0",
                    hypothesis.trim() 
                      ? "bg-[#252525] border-green-600/50 focus:border-green-500" 
                      : "bg-[#252525] border-amber-600/50 focus:border-amber-500"
                  )}
                />
                {!hypothesis.trim() && (
                  <p className="text-[11px] text-amber-500">
                    ⚠️ Ohne Hypothese kannst du nicht zum nächsten Schritt
                  </p>
                )}
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
            <div className="space-y-2 pb-4 border-b border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                  Workflow URL (optional)
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[11px] text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10"
                  onClick={() => window.open('https://weavy.ai', '_blank')}
                >
                  <ExternalLink className="h-3 w-3 mr-1.5" />
                  Workflow Builder öffnen
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  value={workflowUrl}
                  onChange={(e) => setWorkflowUrl(e.target.value)}
                  placeholder="https://weavy.ai/... oder andere URL"
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

            {/* Loom Bulletpoints - Step 2: Video aufnehmen */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-3 block">
                Loom Bulletpoints
              </label>
              <div className="space-y-4">
              {loomBulletpoints.length > 0 && (
                <div className="space-y-2">
                  {loomBulletpoints.map((point, index) => (
                    <div 
                      key={index} 
                      className="group flex items-center gap-3 p-3 rounded-lg bg-neutral-800/50 hover:bg-neutral-800 transition-colors"
                    >
                      <div className="w-6 h-6 rounded-full bg-neutral-700 flex items-center justify-center text-[11px] font-semibold text-neutral-400">
                        {index + 1}
                      </div>
                      <span className="flex-1 text-[13px] text-neutral-300">{point}</span>
                      <button 
                        onClick={() => removeBulletpoint(index)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-100 text-neutral-500 hover:text-red-500 transition-all"
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
                  className="flex-1 h-11"
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

            {/* Upload Area - Step 3: Video hochladen */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
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
                      : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-700 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/50"
                  )}
                >
                  {isUploading ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-100 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                      </div>
                      <div>
                        <p className="text-[14px] font-medium text-neutral-300">Wird hochgeladen...</p>
                        <p className="text-[12px] text-neutral-500 mt-1">{uploadProgress}%</p>
                      </div>
                      <div className="w-48 h-1.5 bg-neutral-700 rounded-full mx-auto overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-300" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-neutral-800 flex items-center justify-center mb-4">
                        <Upload className="h-7 w-7 text-neutral-500" />
                      </div>
                      <p className="text-[14px] font-medium text-neutral-300">
                        Rohmaterial hochladen
                      </p>
                      <p className="text-[12px] text-neutral-500 mt-1">
                        Ziehe ein Video hierher oder klicke zum Auswählen
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-3">
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
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-neutral-800/50 to-neutral-900/50 border border-neutral-700">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-sm">
                      <Play className="h-6 w-6 text-white ml-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white">Rohmaterial</p>
                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">{mediaFile}</p>
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
                <div className="space-y-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
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
            </div>

            {/* LinkedIn Post with AI Chat - Step 4 */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800 space-y-4">
              
              {/* AI Chat Interface */}
              <div className="rounded-xl border border-neutral-700 bg-neutral-900/50 overflow-hidden">
                {/* Chat Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-900/80">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-neutral-700 flex items-center justify-center text-[11px] font-semibold text-white">
                      E
                    </div>
                    <div>
                      <h4 className="text-[13px] font-medium text-white">Eugene</h4>
                      <p className="text-[10px] text-neutral-500">
                        {hasStyleData ? 'Schreibstil geladen' : 'Schreibe Posts für mehr Learnings'}
                      </p>
                    </div>
                  </div>
                  {chatMessages.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[11px] text-neutral-500 hover:text-neutral-300"
                      onClick={() => clearChatMessages(chatId)}
                    >
                      Chat leeren
                    </Button>
                  )}
                </div>
                
                {/* Chat Messages */}
                <div 
                  ref={chatScrollRef}
                  className="h-[280px] overflow-y-auto p-4 space-y-4"
                >
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                      <div className="w-12 h-12 rounded-xl bg-neutral-800 flex items-center justify-center mb-3">
                        <MessageCircle className="h-5 w-5 text-neutral-500" />
                      </div>
                      <p className="text-[13px] text-neutral-400 mb-1">Chatte mit Eugene</p>
                      <p className="text-[11px] text-neutral-600 max-w-xs">
                        Er kennt deinen Schreibstil, deine Learnings und den aktuellen Kontext (Idee, Hypothese, Bulletpoints)
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4 justify-center">
                        <button
                          onClick={() => setChatInput('Schreibe mir einen Post basierend auf meinen Bulletpoints')}
                          className="text-[11px] px-3 py-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                        >
                          Post aus Bulletpoints
                        </button>
                        <button
                          onClick={() => setChatInput('Gib mir 3 Hook-Varianten für meinen Post')}
                          className="text-[11px] px-3 py-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                        >
                          Hook-Varianten
                        </button>
                        <button
                          onClick={() => setChatInput('Verbessere meinen aktuellen Post')}
                          className="text-[11px] px-3 py-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white transition-colors"
                        >
                          Post verbessern
                        </button>
                      </div>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={msg.id || i} className={cn("flex gap-3", msg.role === 'user' && "flex-row-reverse")}>
                        <div className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                          msg.role === 'user' 
                            ? "bg-neutral-700" 
                            : "bg-neutral-600"
                        )}>
                          {msg.role === 'user' ? (
                            <User className="h-3.5 w-3.5 text-neutral-300" />
                          ) : (
                            <Bot className="h-3.5 w-3.5 text-white" />
                          )}
                        </div>
                        <div className={cn(
                          "flex-1 min-w-0",
                          msg.role === 'user' && "text-right"
                        )}>
                          <div className={cn(
                            "inline-block max-w-[90%] rounded-xl px-3 py-2 text-[13px]",
                            msg.role === 'user' 
                              ? "bg-neutral-700 text-white" 
                              : "bg-neutral-800 text-neutral-200"
                          )}>
                            <div className="whitespace-pre-wrap break-words">{msg.content || '...'}</div>
                          </div>
                          {msg.role === 'assistant' && msg.content && msg.content.length > 50 && (
                            <button
                              onClick={() => insertIntoPost(msg.content)}
                              className="mt-2 flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-white transition-colors"
                            >
                              <CornerDownLeft className="h-3 w-3" />
                              In Post übernehmen
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                  {isChatLoading && chatMessages[chatMessages.length - 1]?.content === '' && (
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-lg bg-neutral-600 flex items-center justify-center">
                        <Loader2 className="h-3.5 w-3.5 text-white animate-spin" />
                      </div>
                      <div className="bg-neutral-800 rounded-xl px-3 py-2">
                        <span className="text-[13px] text-neutral-400">Schreibt...</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Chat Input */}
                <div className="p-3 border-t border-neutral-800 bg-neutral-900/80">
                  {chatError && (
                    <p className="text-[11px] text-red-400 mb-2 px-1">{chatError}</p>
                  )}
                  <div className="flex gap-2">
                    <Textarea
                      ref={chatInputRef}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={handleChatKeyDown}
                      placeholder="Frag Eugene..."
                      className="flex-1 min-h-[44px] max-h-[120px] text-[13px] resize-none bg-neutral-800 border-neutral-700 focus:border-neutral-500 text-white placeholder:text-neutral-500"
                      rows={1}
                    />
                    <Button
                      onClick={handleChatSend}
                      disabled={!chatInput.trim() || isChatLoading}
                      className="h-11 px-4 bg-white text-black hover:bg-neutral-200 disabled:opacity-50"
                    >
                      {isChatLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Post Textarea */}
              <div className="space-y-3">
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                  LinkedIn Post
                </label>
                <Textarea
                  value={getFullPostText()}
                  onChange={(e) => updateContent('text', e.target.value)}
                  placeholder="Schreibe deinen LinkedIn Post..."
                  className="min-h-[220px] text-[14px] leading-relaxed resize-none bg-neutral-50 border-neutral-200 focus:bg-white dark:bg-neutral-800/50 dark:border-neutral-700 dark:focus:bg-neutral-700 transition-colors"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "text-[12px] font-medium px-2.5 py-1 rounded-full",
                      charCount > 2800 
                        ? "bg-red-100 text-red-700" 
                        : charCount > 2500 
                          ? "bg-amber-100 text-amber-700" 
                          : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                    )}>
                      {charCount.toLocaleString()} / 3.000
                    </span>
                    {charCount > 0 && charCount <= 2500 && (
                      <span className="text-[11px] text-neutral-500">Gute Länge</span>
                    )}
                  </div>
                  <CopyBtn text={getFullPostText()} />
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
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                    Vorlage
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {['[NAME]', '[LEADMAGNET]', '[VIDEO]', '[SOLUTION]'].map((tag) => (
                      <span key={tag} className="px-1.5 py-0.5 rounded bg-neutral-800 text-[9px] font-mono text-neutral-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <Textarea
                  value={dmReply}
                  onChange={(e) => setDmReply(e.target.value)}
                  className="min-h-[160px] text-[13px] leading-relaxed bg-neutral-50 border-neutral-200 focus:bg-white dark:bg-neutral-800/50 dark:border-neutral-700 dark:focus:bg-neutral-700 transition-colors resize-none"
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
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                    Vorschau
                  </label>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-700 text-[13px] text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {getDmReplyMessage()}
                  </div>
                </div>
              )}
              
              <CopyBtn text={getDmReplyMessage()} className="w-full h-10" />
            </div>

            {/* Quick Comments */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                  Quick Comments
                </label>
                <button 
                  onClick={() => setIsTemplateManagerOpen(true)}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-neutral-500 hover:text-neutral-300 transition-colors"
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
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                  Ressource teilen
                </label>
                <span className="text-[10px] text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded">
                  Global gespeichert
                </span>
              </div>
            <div className="space-y-4">
              {/* Template Text */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                    Vorlage (für alle Karten)
                  </label>
                  <div className="flex gap-1.5">
                    {['[NAME]', '[LINK]'].map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-mono text-neutral-500">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <Textarea
                  value={globalResourceTemplate}
                  onChange={(e) => setGlobalResourceTemplate(e.target.value)}
                  className="min-h-[120px] text-[14px] leading-relaxed bg-neutral-50 border-neutral-200 focus:bg-white dark:bg-neutral-800/50 dark:border-neutral-700 dark:focus:bg-neutral-700 transition-colors resize-none"
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
                  <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                    Vorschau
                  </label>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-800/50 to-neutral-900/50 border border-neutral-700 text-[13px] text-neutral-300 whitespace-pre-wrap leading-relaxed">
                    {getResourceMessage()}
                  </div>
                </div>
              )}
              
              <CopyBtn text={getResourceMessage()} className="w-full h-10" />
            </div>
            </div>

            {/* Affiliate Links */}
            <div className="pt-4 border-t border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">
                  Affiliate Links
                </label>
                <span className="text-[10px] text-neutral-500 bg-neutral-800 px-2 py-0.5 rounded">
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
              <div className="p-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-800/50">
                <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-3">
                  Neuen Link hinzufügen
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newAffiliateName}
                    onChange={(e) => setNewAffiliateName(e.target.value)}
                    placeholder="Name (z.B. Weavy.ai)"
                    className="h-10 flex-1"
                  />
                  <Input
                    value={newAffiliateUrl}
                    onChange={(e) => setNewAffiliateUrl(e.target.value)}
                    placeholder="https://..."
                    className="h-10 flex-[2]"
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
                <p className="text-[12px] text-neutral-500 text-center py-2">
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
          
          // Store in Eugene's memory when published
          if (status === 'published') {
            storePostMemory(updated as any).catch(() => {})
          }
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
          } as LinkedInPost
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
              <p className="text-[16px] font-semibold text-white">Erfolgreich geteilt!</p>
              <p className="text-[13px] text-neutral-500 mt-2">
                Teile den Link mit deinem Cutter
              </p>
            </div>
          ) : (
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-neutral-300">Passwort für Cutter</label>
                <Input
                  value={sharePassword}
                  onChange={(e) => setSharePassword(e.target.value)}
                  placeholder="z.B. cutter2024"
                  className="h-11"
                />
                <p className="text-[11px] text-neutral-500">
                  Der Cutter braucht dieses Passwort
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-[12px] font-medium text-neutral-300">Anweisungen (optional)</label>
                <Textarea
                  value={shareInstructions}
                  onChange={(e) => setShareInstructions(e.target.value)}
                  placeholder="z.B. Bitte mit Untertiteln versehen..."
                  className="min-h-[80px] resize-none"
                />
              </div>
              
              <div className="p-4 rounded-xl bg-neutral-800/50 border border-neutral-700">
                <p className="text-[11px] font-medium text-neutral-500 mb-2">Cutter-Link</p>
                <div className="flex gap-2">
                  <Input
                    value={`${window.location.origin}/cutter`}
                    readOnly
                    className="text-xs h-10"
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
                  className="flex items-center gap-3 p-3 rounded-xl bg-neutral-800/50 hover:bg-neutral-800 group transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-neutral-300">{template.content}</p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditTemplateDialog(template)}
                      className="p-2 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-2 rounded-lg hover:bg-red-100 text-neutral-500 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-[12px] text-neutral-500 py-4 text-center">
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
