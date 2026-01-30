import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Bot, 
  Send, 
  Loader2, 
  Sparkles,
  AlertTriangle,
  FileText,
  Trash2,
  Plus,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { usePostsStore } from '@/lib/store'
// AI settings are now handled server-side via Supabase Edge Functions
import { sendMessage, chatMessagesToClaudeMessages, isApiConfigured } from '@/lib/claude-api'
import { 
  getManagerSystemPrompt, 
  parseActionFromResponse, 
  executeAction,
  confirmPendingAction,
  getPendingActions,
  clearPendingAction,
  type PendingAction 
} from '@/lib/manager-agent'
import { cn } from '@/lib/utils'

// Simple markdown renderer
function renderMarkdown(text: string): React.ReactNode {
  // Remove JSON code blocks
  const cleanText = text.replace(/```json[\s\S]*?```/g, '')
  
  // Split by lines for processing
  const lines = cleanText.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let listType: 'ul' | 'ol' | null = null
  
  const processInline = (line: string): React.ReactNode => {
    // Process bold **text** and *text*
    const parts: React.ReactNode[] = []
    let remaining = line
    let key = 0
    
    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(<span key={key++}>{remaining.slice(0, boldMatch.index)}</span>)
        }
        parts.push(<strong key={key++} className="font-semibold">{boldMatch[1]}</strong>)
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length)
        continue
      }
      
      // Code `text`
      const codeMatch = remaining.match(/`([^`]+)`/)
      if (codeMatch && codeMatch.index !== undefined) {
        if (codeMatch.index > 0) {
          parts.push(<span key={key++}>{remaining.slice(0, codeMatch.index)}</span>)
        }
        parts.push(
          <code key={key++} className="px-1 py-0.5 bg-neutral-700 rounded text-xs font-mono">
            {codeMatch[1]}
          </code>
        )
        remaining = remaining.slice(codeMatch.index + codeMatch[0].length)
        continue
      }
      
      // No more matches
      parts.push(<span key={key++}>{remaining}</span>)
      break
    }
    
    return parts.length > 0 ? parts : line
  }
  
  const flushList = () => {
    if (listItems.length > 0 && listType) {
      const ListTag = listType
      elements.push(
        <ListTag key={elements.length} className={cn("my-2 space-y-1", listType === 'ul' ? "list-disc" : "list-decimal", "pl-5")}>
          {listItems.map((item, i) => (
            <li key={i} className="text-[13px]">{processInline(item)}</li>
          ))}
        </ListTag>
      )
      listItems = []
      listType = null
    }
  }
  
  lines.forEach((line, index) => {
    // Bullet list
    if (line.match(/^[•\-\*]\s+/)) {
      if (listType !== 'ul') flushList()
      listType = 'ul'
      listItems.push(line.replace(/^[•\-\*]\s+/, ''))
      return
    }
    
    // Numbered list
    if (line.match(/^\d+\.\s+/)) {
      if (listType !== 'ol') flushList()
      listType = 'ol'
      listItems.push(line.replace(/^\d+\.\s+/, ''))
      return
    }
    
    // Flush any pending list
    flushList()
    
    // Empty line
    if (line.trim() === '') {
      elements.push(<div key={index} className="h-2" />)
      return
    }
    
    // Regular paragraph
    elements.push(
      <p key={index} className="text-[13px] leading-relaxed">
        {processInline(line)}
      </p>
    )
  })
  
  // Flush any remaining list
  flushList()
  
  return <div className="space-y-1">{elements}</div>
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  action?: {
    type: string
    status: 'pending' | 'executed' | 'failed' | 'requires_confirmation'
    result?: string
  }
}

interface ManagerChatProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManagerChat({ open, onOpenChange }: ManagerChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<PendingAction | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  const posts = usePostsStore((state) => state.posts)
  const store = usePostsStore.getState()

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Initialize with greeting
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: `Hallo! Ich bin dein Content Manager Assistent. 👋

Ich kann dir helfen bei:
• **Transkripte analysieren** - Teile mir ein Transkript und ich generiere Content-Ideen
• **Posts erstellen** - Für LinkedIn, YouTube, Instagram und Skool
• **Massenoperationen** - Mehrere Posts auf einmal erstellen oder verschieben
• **Übersicht** - Statistiken und Suche durch deine Posts

Was möchtest du heute machen?`,
        timestamp: new Date().toISOString()
      }])
    }
  }, [open, messages.length])

  const processAction = useCallback((response: string) => {
    const action = parseActionFromResponse(response)
    
    if (action) {
      const result = executeAction(action, store)
      
      // Check if this is a delete action requiring confirmation
      if (result.requiresConfirmation && result.pendingActionId) {
        const pending = getPendingActions().find(p => p.id === result.pendingActionId)
        if (pending) {
          setPendingDelete(pending)
        }
      }
      
      return {
        type: action.type,
        status: result.requiresConfirmation ? 'requires_confirmation' as const : (result.success ? 'executed' as const : 'failed' as const),
        result: result.message
      }
    }
    
    return undefined
  }, [store])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    if (!isApiConfigured()) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: '⚠️ Bitte konfiguriere zuerst deinen Claude API Key in den Einstellungen.',
        timestamp: new Date().toISOString()
      }])
      return
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const systemPrompt = getManagerSystemPrompt(posts)
      
      // Convert messages for API
      const apiMessages = chatMessagesToClaudeMessages(
        messages.filter(m => m.id !== 'greeting').map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        }))
      )
      
      // Add current user message
      apiMessages.push({ role: 'user', content: input })

      const response = await sendMessage({
        systemPrompt,
        messages: apiMessages,
      })

      // Process any actions in the response
      const actionResult = processAction(response)

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        action: actionResult
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        timestamp: new Date().toISOString()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return
    
    const result = confirmPendingAction(pendingDelete.id, store)
    
    setMessages(prev => [...prev, {
      id: `action-${Date.now()}`,
      role: 'assistant',
      content: result.success ? '✅ Post wurde gelöscht.' : `❌ ${result.message}`,
      timestamp: new Date().toISOString(),
      action: {
        type: 'delete_post',
        status: result.success ? 'executed' : 'failed',
        result: result.message
      }
    }])
    
    setPendingDelete(null)
  }

  const handleCancelDelete = () => {
    if (!pendingDelete) return
    
    clearPendingAction(pendingDelete.id)
    
    setMessages(prev => [...prev, {
      id: `action-${Date.now()}`,
      role: 'assistant',
      content: '🚫 Löschung abgebrochen.',
      timestamp: new Date().toISOString()
    }])
    
    setPendingDelete(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'create_post':
      case 'create_multiple_posts':
        return <Plus className="h-3 w-3" />
      case 'delete_post':
        return <Trash2 className="h-3 w-3" />
      case 'get_statistics':
        return <BarChart3 className="h-3 w-3" />
      case 'analyze_transcript':
        return <FileText className="h-3 w-3" />
      default:
        return <Sparkles className="h-3 w-3" />
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-[500px] sm:w-[600px] p-0 flex flex-col">
          <SheetHeader className="p-4 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <SheetTitle className="text-left">Content Manager</SheetTitle>
                <SheetDescription className="text-left">
                  Dein AI-Assistent für Content-Planung
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex",
                    message.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-4 py-3",
                      message.role === 'user'
                        ? "bg-white text-black"
                        : "bg-neutral-800 text-neutral-100"
                    )}
                  >
                    {renderMarkdown(message.content)}
                    
                    {/* Action Badge */}
                    {message.action && (
                      <div className={cn(
                        "mt-2 pt-2 border-t flex items-center gap-2 text-[11px]",
                        message.role === 'user' ? "border-neutral-600" : "border-neutral-700"
                      )}>
                        {getActionIcon(message.action.type)}
                        <span className={cn(
                          "px-2 py-0.5 rounded-full",
                          message.action.status === 'executed' && "bg-green-100 text-green-700",
                          message.action.status === 'failed' && "bg-red-100 text-red-700",
                          message.action.status === 'requires_confirmation' && "bg-amber-100 text-amber-700",
                          message.action.status === 'pending' && "bg-neutral-700 text-neutral-400"
                        )}>
                          {message.action.status === 'executed' && '✓ Ausgeführt'}
                          {message.action.status === 'failed' && '✗ Fehlgeschlagen'}
                          {message.action.status === 'requires_confirmation' && '⚠ Bestätigung nötig'}
                          {message.action.status === 'pending' && '⏳ Ausstehend'}
                        </span>
                        {message.action.result && (
                          <span className="text-neutral-500">{message.action.result}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-neutral-800 rounded-xl px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t shrink-0">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Beschreibe was du tun möchtest..."
                className="min-h-[80px] resize-none"
                disabled={isLoading}
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-neutral-500">
                Shift + Enter für neue Zeile
              </p>
              <Button 
                onClick={handleSend} 
                disabled={!input.trim() || isLoading}
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Senden
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!pendingDelete} onOpenChange={() => setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Löschung bestätigen
            </AlertDialogTitle>
            <AlertDialogDescription>
              Der Content Manager möchte einen Post löschen. Diese Aktion kann nicht rückgängig gemacht werden.
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[13px]">
                {pendingDelete?.message}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelDelete}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Ja, löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
