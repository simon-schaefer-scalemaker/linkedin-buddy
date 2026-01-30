/**
 * Quick Post Generator - Schnelle Post-Erstellung im eigenen Stil
 * Der User beschreibt seine Idee, die AI generiert einen kompletten Post
 */

import { useState, useEffect, useMemo } from 'react'
import { 
  Sparkles, 
  Loader2, 
  Copy, 
  Check, 
  Wand2, 
  RefreshCw,
  ArrowRight,
  Lightbulb,
  Target,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { usePostsStore } from '@/lib/store'
import { sendMessage, isApiConfigured } from '@/lib/claude-api'
import { analyzeWritingStyle, buildPostGenerationPrompt } from '@/lib/style-analyzer'
import { generateNextPostRecommendations } from '@/lib/pattern-recognition'
import { HOOK_TYPES, CONTENT_TOPICS, type PlatformId, type HookType, type ContentTopic } from '@/lib/types'
import { cn } from '@/lib/utils'

interface QuickPostGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  platform: PlatformId
  onPostGenerated?: (content: string, hookType?: HookType, topic?: ContentTopic) => void
}

export function QuickPostGenerator({ 
  open, 
  onOpenChange, 
  platform,
  onPostGenerated 
}: QuickPostGeneratorProps) {
  const [step, setStep] = useState<'idea' | 'generating' | 'result'>('idea')
  const [idea, setIdea] = useState('')
  const [selectedHookType, setSelectedHookType] = useState<HookType | undefined>()
  const [selectedTopic, setSelectedTopic] = useState<ContentTopic | undefined>()
  const [generatedPost, setGeneratedPost] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const allPosts = usePostsStore((state) => state.posts)
  
  // Analyse Schreibstil
  const styleAnalysis = useMemo(() => 
    analyzeWritingStyle(allPosts, platform), 
    [allPosts, platform]
  )
  
  // Empfehlungen
  const recommendations = useMemo(() => 
    generateNextPostRecommendations(allPosts, platform),
    [allPosts, platform]
  )
  
  // Reset when dialog opens
  useEffect(() => {
    if (open) {
      setStep('idea')
      setIdea('')
      setGeneratedPost('')
      setSelectedHookType(undefined)
      setSelectedTopic(undefined)
    }
  }, [open])
  
  const handleGenerate = async () => {
    if (!idea.trim() || !isApiConfigured()) return
    
    setStep('generating')
    setIsGenerating(true)
    
    try {
      const { systemPrompt, userPrompt } = buildPostGenerationPrompt(
        platform,
        styleAnalysis,
        idea,
        selectedHookType ? HOOK_TYPES[selectedHookType].name : undefined,
        selectedTopic ? CONTENT_TOPICS[selectedTopic].name : undefined
      )
      
      const response = await sendMessage({
        systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
      
      setGeneratedPost(response.trim())
      setStep('result')
    } catch (err) {
      console.error('Failed to generate post:', err)
      setGeneratedPost('Fehler beim Generieren. Bitte versuche es erneut.')
      setStep('result')
    } finally {
      setIsGenerating(false)
    }
  }
  
  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPost)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleUsePost = () => {
    if (onPostGenerated) {
      onPostGenerated(generatedPost, selectedHookType, selectedTopic)
    }
    onOpenChange(false)
  }
  
  const handleRegenerate = () => {
    setStep('idea')
  }
  
  const platformName = {
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    instagram: 'Instagram',
    skool: 'Skool'
  }[platform]
  
  // Quick idea suggestions based on recommendations
  const ideaSuggestions = [
    'Eine kontroverse Meinung zu einem Trend in meiner Branche',
    'Ein Learning aus einem kürzlichen Fehler/Erfolg',
    '3-5 Tipps zu einem Thema aus meiner Expertise',
    'Eine persönliche Geschichte mit Business-Lesson',
  ]
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-500" />
            Post in deinem Stil generieren
          </DialogTitle>
          <DialogDescription>
            {styleAnalysis 
              ? `Ich kenne deinen Schreibstil aus ${styleAnalysis.examplePosts.length} erfolgreichen Posts.`
              : 'Beschreibe deine Idee und ich schreibe den Post für dich.'}
          </DialogDescription>
        </DialogHeader>
        
        {step === 'idea' && (
          <div className="space-y-4 pt-2">
            {/* Idea Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Was möchtest du posten?
              </label>
              <Textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Beschreibe deine Idee in 1-2 Sätzen... z.B. 'Ein Post darüber, warum die meisten LinkedIn-Profile langweilig sind'"
                className="min-h-[100px] text-sm"
                autoFocus
              />
            </div>
            
            {/* Quick Suggestions */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-500 uppercase tracking-wider">
                Schnelle Ideen
              </label>
              <div className="flex flex-wrap gap-2">
                {ideaSuggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setIdea(suggestion)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-full transition-colors",
                      "bg-neutral-100 text-neutral-600 hover:bg-neutral-200",
                      "dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                    )}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Optional: Hook Type & Topic */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-200 dark:border-neutral-800">
              <div className="space-y-2">
                <label className="text-xs text-neutral-500 flex items-center gap-1.5">
                  <Target className="h-3 w-3" />
                  Hook-Typ (optional)
                </label>
                <select
                  value={selectedHookType || ''}
                  onChange={(e) => setSelectedHookType(e.target.value as HookType || undefined)}
                  className="w-full h-9 px-3 rounded-lg border text-xs bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700"
                >
                  <option value="">Auto (basierend auf deinen Daten)</option>
                  {Object.entries(HOOK_TYPES).map(([key, data]) => (
                    <option key={key} value={key}>
                      {data.emoji} {data.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-neutral-500 flex items-center gap-1.5">
                  <Lightbulb className="h-3 w-3" />
                  Thema (optional)
                </label>
                <select
                  value={selectedTopic || ''}
                  onChange={(e) => setSelectedTopic(e.target.value as ContentTopic || undefined)}
                  className="w-full h-9 px-3 rounded-lg border text-xs bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700"
                >
                  <option value="">Auto</option>
                  {Object.entries(CONTENT_TOPICS).map(([key, data]) => (
                    <option key={key} value={key}>
                      {data.emoji} {data.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Recommendations */}
            {recommendations.length > 0 && recommendations[0] !== 'Noch nicht genug Daten.' && (
              <div className={cn(
                "p-3 rounded-lg",
                "bg-purple-50 border border-purple-200",
                "dark:bg-purple-500/10 dark:border-purple-500/30"
              )}>
                <p className="text-xs font-medium text-purple-700 dark:text-purple-400 flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3 w-3" />
                  Basierend auf deinen Daten
                </p>
                <ul className="space-y-1">
                  {recommendations.slice(0, 2).map((rec, i) => (
                    <li key={i} className="text-xs text-purple-600 dark:text-purple-300">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!idea.trim() || !isApiConfigured()}
              className="w-full gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Post generieren
            </Button>
            
            {!isApiConfigured() && (
              <p className="text-xs text-center text-amber-600">
                Bitte konfiguriere deinen API-Key in den Einstellungen.
              </p>
            )}
          </div>
        )}
        
        {step === 'generating' && (
          <div className="py-12 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 text-purple-500 animate-spin" />
              <Sparkles className="h-5 w-5 text-purple-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Generiere Post in deinem Stil...
              </p>
              <p className="text-xs text-neutral-500 mt-1">
                Analysiere deine Winner-Posts und übernehme die Struktur
              </p>
            </div>
          </div>
        )}
        
        {step === 'result' && (
          <div className="space-y-4 pt-2">
            {/* Generated Post */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Dein generierter {platformName}-Post
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 text-xs gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Kopiert
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Kopieren
                    </>
                  )}
                </Button>
              </div>
              <div className={cn(
                "p-4 rounded-lg whitespace-pre-wrap text-sm",
                "bg-neutral-50 border border-neutral-200",
                "dark:bg-neutral-900 dark:border-neutral-800"
              )}>
                {generatedPost}
              </div>
            </div>
            
            {/* Style Info */}
            {styleAnalysis && (
              <div className={cn(
                "p-3 rounded-lg text-xs",
                "bg-green-50 border border-green-200",
                "dark:bg-green-500/10 dark:border-green-500/30"
              )}>
                <p className="text-green-700 dark:text-green-400">
                  <Check className="h-3 w-3 inline mr-1" />
                  Generiert mit deiner Tonalität ({styleAnalysis.tone.description.split('.')[0]}) 
                  und Struktur (~{styleAnalysis.structure.avgParagraphs} Absätze)
                </p>
              </div>
            )}
            
            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleRegenerate}
                className="flex-1 gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Neu generieren
              </Button>
              <Button
                onClick={handleUsePost}
                className="flex-1 gap-2"
              >
                Übernehmen
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
