import { useState, useEffect, useRef, useMemo } from 'react'
import { X, Send, Loader2, Trash2, Bot, User, Sparkles, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useChatStore, type ChatMessage } from '@/stores/chatStore'
import { usePostsStore } from '@/lib/store'
import { sendMessage, chatMessagesToClaudeMessages, isApiConfigured, ClaudeApiError } from '@/lib/claude-api'
import { buildSystemPrompt, getInitialGreeting } from '@/lib/ai-prompts'
import { analyzeWritingStyle } from '@/lib/style-analyzer'
import type { Post, PlatformId } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'

interface AiChatPanelProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  platform: PlatformId
  currentPost: Post
}

export function AiChatPanel({ isOpen, onClose, postId, platform, currentPost }: AiChatPanelProps) {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  
  const messages = useChatStore((state) => state.getChat(postId))
  const addMessage = useChatStore((state) => state.addMessage)
  const clearChat = useChatStore((state) => state.clearChat)
  const startAssistantMessage = useChatStore((state) => state.startAssistantMessage)
  const updateLastAssistantMessage = useChatStore((state) => state.updateLastAssistantMessage)
  
  const allPosts = usePostsStore((state) => state.posts)
  
  const apiConfigured = isApiConfigured()
  
  // Check if we have style data from winner posts
  const hasStyleData = useMemo(() => {
    const styleAnalysis = analyzeWritingStyle(allPosts, platform)
    return styleAnalysis !== null
  }, [allPosts, platform])
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])
  
  // Focus input when panel opens
  useEffect(() => {
    if (isOpen && inputRef.current && apiConfigured) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, apiConfigured])
  
  // Show initial greeting if no messages
  useEffect(() => {
    if (isOpen && messages.length === 0 && apiConfigured) {
      const greeting = getInitialGreeting(platform, currentPost, hasStyleData)
      addMessage(postId, { role: 'assistant', content: greeting })
    }
  }, [isOpen, postId, platform, currentPost, messages.length, apiConfigured, addMessage, hasStyleData])
  
  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage = input.trim()
    setInput('')
    setError(null)
    
    // Add user message
    addMessage(postId, { role: 'user', content: userMessage })
    
    setIsLoading(true)
    
    // Start assistant message for streaming
    startAssistantMessage(postId)
    
    try {
      const systemPrompt = buildSystemPrompt(platform, allPosts, currentPost)
      const allMessages = [...messages, { id: '', role: 'user' as const, content: userMessage, timestamp: '' }]
      
      await sendMessage({
        systemPrompt,
        messages: chatMessagesToClaudeMessages(allMessages),
        onChunk: (content) => {
          updateLastAssistantMessage(postId, content)
        },
        onError: (err) => {
          setError(err.message)
        }
      })
    } catch (err) {
      if (err instanceof ClaudeApiError) {
        setError(err.message)
      } else {
        setError('Ein unerwarteter Fehler ist aufgetreten')
      }
      // Remove the empty assistant message on error
      const currentMessages = useChatStore.getState().getChat(postId)
      if (currentMessages.length > 0 && currentMessages[currentMessages.length - 1].content === '') {
        // We can't easily remove it, so just update it with error info
        updateLastAssistantMessage(postId, '❌ ' + (err instanceof Error ? err.message : 'Fehler bei der Anfrage'))
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  const handleClearChat = () => {
    clearChat(postId)
    // Add greeting again
    const greeting = getInitialGreeting(platform, currentPost)
    addMessage(postId, { role: 'assistant', content: greeting })
  }
  
  const platformName = {
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    instagram: 'Instagram',
    skool: 'Skool'
  }[platform]

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/20 z-40 transition-opacity duration-200",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div 
        className={cn(
          "fixed top-0 right-0 h-full w-[420px] bg-neutral-900 border-l border-neutral-800 shadow-2xl z-50 flex flex-col transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <h3 className="text-[14px] font-medium text-white">AI Assistent</h3>
              <p className="text-[11px] text-neutral-500">{platformName} Content</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-neutral-500 hover:text-neutral-400"
              onClick={handleClearChat}
              title="Chat leeren"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-neutral-500 hover:text-neutral-400"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Messages */}
        {!apiConfigured ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <h4 className="text-[14px] font-medium text-white mb-2">API-Key erforderlich</h4>
            <p className="text-[13px] text-neutral-500 mb-4">
              Um den AI-Assistenten zu nutzen, hinterlege deinen Claude API-Key in den Einstellungen.
            </p>
            <Button asChild size="sm">
              <Link to="/settings">Zu den Einstellungen</Link>
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <MessageBubble key={message.id} message={message} />
                ))}
                {isLoading && messages[messages.length - 1]?.content === '' && (
                  <div className="flex items-center gap-2 text-[13px] text-neutral-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Denkt nach...
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Error */}
            {error && (
              <div className="px-4 py-2 bg-red-50 border-t border-red-100">
                <p className="text-[12px] text-red-600">{error}</p>
              </div>
            )}
            
            {/* Input */}
            <div className="p-4 border-t shrink-0">
              <div className="flex gap-2">
                <Textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Frag mich etwas..."
                  className="min-h-[80px] resize-none text-[13px]"
                  disabled={isLoading}
                />
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-[11px] text-neutral-500">
                  Enter zum Senden, Shift+Enter für neue Zeile
                </p>
                <Button 
                  size="sm" 
                  onClick={handleSend} 
                  disabled={!input.trim() || isLoading}
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
          </>
        )}
      </div>
    </>
  )
}

// Message bubble component
function MessageBubble({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === 'assistant'
  
  return (
    <div className={cn("flex gap-3", !isAssistant && "flex-row-reverse")}>
      <div className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
        isAssistant ? "bg-purple-100" : "bg-neutral-800"
      )}>
        {isAssistant ? (
          <Bot className="h-4 w-4 text-purple-600" />
        ) : (
          <User className="h-4 w-4 text-neutral-400" />
        )}
      </div>
      <div className={cn(
        "flex-1 rounded-lg px-3 py-2 text-[13px]",
        isAssistant 
          ? "bg-neutral-800/50 text-neutral-300" 
          : "bg-purple-600 text-white"
      )}>
        <div className={cn(
          "whitespace-pre-wrap",
          isAssistant && "prose prose-sm prose-gray max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
        )}>
          {message.content || (
            <span className="text-neutral-500 italic">...</span>
          )}
        </div>
      </div>
    </div>
  )
}
