import { useState, useEffect } from 'react'
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Loader2,
  Lightbulb,
  Target
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { useLearningsStore } from '@/stores/learningsStore'
import { usePostsStore } from '@/lib/store'
import { sendMessage, isApiConfigured } from '@/lib/claude-api'
import { buildLearningPrompt } from '@/lib/ai-prompts'
import type { Post, PostLearning } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PostLearningDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  post: Post
}

type OutcomeType = 'exceeded' | 'met' | 'missed'

export function PostLearningDialog({ open, onOpenChange, post }: PostLearningDialogProps) {
  const allPosts = usePostsStore((state) => state.posts)
  const { addLearning, updateLearning, getLearningForPost } = useLearningsStore()
  
  const [outcome, setOutcome] = useState<OutcomeType | null>(null)
  const [whatWorked, setWhatWorked] = useState('')
  const [whatDidntWork, setWhatDidntWork] = useState('')
  const [keyInsight, setKeyInsight] = useState('')
  const [applyToFuture, setApplyToFuture] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [existingLearningId, setExistingLearningId] = useState<string | null>(null)
  
  // Load existing learning if any
  useEffect(() => {
    if (open && post) {
      const existing = getLearningForPost(post.id)
      if (existing) {
        setExistingLearningId(existing.id)
        setOutcome(existing.outcome || null)
        setWhatWorked(existing.whatWorked || '')
        setWhatDidntWork(existing.whatDidntWork || '')
        setKeyInsight(existing.keyInsight || '')
        setApplyToFuture(existing.applyToFuture || '')
      } else {
        // Reset form
        setExistingLearningId(null)
        setOutcome(null)
        setWhatWorked('')
        setWhatDidntWork('')
        setKeyInsight('')
        setApplyToFuture('')
      }
    }
  }, [open, post, getLearningForPost])
  
  // Determine performance rating based on outcome
  const getPerformanceRating = (): 'winner' | 'loser' | 'average' => {
    if (outcome === 'exceeded') return 'winner'
    if (outcome === 'missed') return 'loser'
    return 'average'
  }
  
  // Generate AI insight
  const handleGenerateInsight = async () => {
    if (!isApiConfigured()) {
      alert('Bitte konfiguriere deinen API-Key in den Einstellungen.')
      return
    }
    
    if (!outcome) {
      alert('Bitte wähle zuerst aus, wie der Post performt hat.')
      return
    }
    
    setIsGenerating(true)
    
    try {
      const { systemPrompt, userPrompt } = buildLearningPrompt(
        post.platform,
        post,
        getPerformanceRating(),
        allPosts
      )
      
      const response = await sendMessage({
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
      
      if (response) {
        setKeyInsight(response.trim())
        
        // Also generate apply to future suggestion
        const followUpResponse = await sendMessage({
          systemPrompt,
          messages: [
            { role: 'user', content: userPrompt },
            { role: 'assistant', content: response },
            { role: 'user', content: 'Basierend auf diesem Learning: Was genau sollte ich bei meinem nächsten Post anders/gleich machen? Antworte in einem Satz.' }
          ]
        })
        
        if (followUpResponse) {
          setApplyToFuture(followUpResponse.trim())
        }
      }
    } catch (error) {
      console.error('Error generating insight:', error)
    } finally {
      setIsGenerating(false)
    }
  }
  
  // Save learning
  const handleSave = () => {
    // Get metrics snapshot
    const metricsSnapshot: PostLearning['metricsSnapshot'] = {}
    if (post.metrics) {
      Object.entries(post.metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          metricsSnapshot[key] = value
        }
      })
    }
    
    // Get hypothesis from post if available
    const hypothesis = (post as any).hypothesis || ''
    
    if (existingLearningId) {
      updateLearning(existingLearningId, {
        outcome: outcome || undefined,
        whatWorked: whatWorked || undefined,
        whatDidntWork: whatDidntWork || undefined,
        keyInsight: keyInsight || undefined,
        applyToFuture: applyToFuture || undefined,
        metricsSnapshot: Object.keys(metricsSnapshot).length > 0 ? metricsSnapshot : undefined
      })
    } else {
      addLearning({
        postId: post.id,
        platform: post.platform,
        hypothesis,
        targetMetric: undefined,
        outcome: outcome || undefined,
        whatWorked: whatWorked || undefined,
        whatDidntWork: whatDidntWork || undefined,
        keyInsight: keyInsight || undefined,
        applyToFuture: applyToFuture || undefined,
        metricsSnapshot: Object.keys(metricsSnapshot).length > 0 ? metricsSnapshot : undefined
      })
    }
    
    onOpenChange(false)
  }
  
  // Get post preview
  const getPostPreview = () => {
    const content = post.content as any
    if (content.text) return content.text.slice(0, 100)
    if (content.title) return content.title
    if (content.caption) return content.caption.slice(0, 100)
    if (content.body) return content.body.slice(0, 100)
    return 'Post'
  }
  
  // Get metrics display
  const getMetricsDisplay = () => {
    if (!post.metrics) return null
    const entries = Object.entries(post.metrics)
      .filter(([_, v]) => typeof v === 'number' && v > 0)
      .slice(0, 4)
    
    if (entries.length === 0) return null
    
    return (
      <div className="flex flex-wrap gap-2">
        {entries.map(([key, value]) => (
          <span 
            key={key} 
            className="text-xs px-2 py-1 rounded-md bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
          >
            {key}: {(value as number).toLocaleString()}
          </span>
        ))}
      </div>
    )
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Post-Learning erfassen
          </DialogTitle>
          <DialogDescription>
            Was hast du aus diesem Post gelernt? Diese Erkenntnisse helfen der AI, bessere Empfehlungen zu geben.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-5 py-4">
          {/* Post Preview */}
          <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2">
              "{getPostPreview()}..."
            </p>
            <div className="mt-2">
              {getMetricsDisplay()}
            </div>
          </div>
          
          {/* Outcome Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-900 dark:text-white">
              Wie hat der Post performt?
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setOutcome('exceeded')}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all",
                  outcome === 'exceeded'
                    ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/50"
                    : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
                )}
              >
                <TrendingUp className={cn("h-5 w-5", outcome === 'exceeded' ? "text-green-500" : "text-neutral-400")} />
                <span className="text-xs font-medium">Übertroffen</span>
              </button>
              <button
                onClick={() => setOutcome('met')}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all",
                  outcome === 'met'
                    ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/50"
                    : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
                )}
              >
                <Minus className={cn("h-5 w-5", outcome === 'met' ? "text-blue-500" : "text-neutral-400")} />
                <span className="text-xs font-medium">Wie erwartet</span>
              </button>
              <button
                onClick={() => setOutcome('missed')}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-all",
                  outcome === 'missed'
                    ? "border-red-500 bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/50"
                    : "border-neutral-200 hover:border-neutral-300 dark:border-neutral-800 dark:hover:border-neutral-700"
                )}
              >
                <TrendingDown className={cn("h-5 w-5", outcome === 'missed' ? "text-red-500" : "text-neutral-400")} />
                <span className="text-xs font-medium">Verfehlt</span>
              </button>
            </div>
          </div>
          
          {/* What Worked / Didn't Work */}
          {outcome && (
            <>
              {(outcome === 'exceeded' || outcome === 'met') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-900 dark:text-white">
                    Was hat funktioniert?
                  </label>
                  <Textarea
                    value={whatWorked}
                    onChange={(e) => setWhatWorked(e.target.value)}
                    placeholder="z.B. Der Hook mit der Zahl hat sofort Aufmerksamkeit erregt..."
                    className="min-h-[80px]"
                  />
                </div>
              )}
              
              {(outcome === 'missed' || outcome === 'met') && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-neutral-900 dark:text-white">
                    Was hat nicht funktioniert?
                  </label>
                  <Textarea
                    value={whatDidntWork}
                    onChange={(e) => setWhatDidntWork(e.target.value)}
                    placeholder="z.B. Zu viel Text, kein klarer CTA..."
                    className="min-h-[80px]"
                  />
                </div>
              )}
            </>
          )}
          
          {/* Key Insight */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-neutral-900 dark:text-white">
                Wichtigste Erkenntnis
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateInsight}
                disabled={isGenerating || !outcome}
                className="gap-1.5"
              >
                {isGenerating ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                AI Vorschlag
              </Button>
            </div>
            <Textarea
              value={keyInsight}
              onChange={(e) => setKeyInsight(e.target.value)}
              placeholder="Das wichtigste Learning aus diesem Post..."
              className="min-h-[80px]"
            />
          </div>
          
          {/* Apply to Future */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-900 dark:text-white flex items-center gap-2">
              <Target className="h-4 w-4 text-neutral-400" />
              Für zukünftige Posts anwenden
            </label>
            <Textarea
              value={applyToFuture}
              onChange={(e) => setApplyToFuture(e.target.value)}
              placeholder="Was werde ich beim nächsten Post anders/gleich machen?"
              className="min-h-[60px]"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={!outcome}>
            Learning speichern
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
