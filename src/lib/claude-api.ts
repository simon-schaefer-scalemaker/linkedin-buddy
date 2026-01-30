import { supabase } from './supabase'
import type { ChatMessage } from '@/stores/chatStore'

export interface ClaudeMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface SendMessageOptions {
  systemPrompt: string
  messages: ClaudeMessage[]
  onChunk?: (chunk: string) => void
  onComplete?: (fullResponse: string) => void
  onError?: (error: Error) => void
}

export class ClaudeApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ClaudeApiError'
  }
}

// Check if Supabase is configured
function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return !!(url && key && !url.includes('placeholder'))
}

/**
 * Send message via Supabase Edge Function (API Key stored server-side)
 */
export async function sendMessage(options: SendMessageOptions): Promise<string> {
  const { systemPrompt, messages, onChunk, onComplete, onError } = options
  
  if (!isSupabaseConfigured()) {
    const error = new ClaudeApiError('Supabase nicht konfiguriert. Bitte .env.local prüfen.')
    onError?.(error)
    throw error
  }

  try {
    // Call Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: {
        system_prompt: systemPrompt,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content
        }))
      }
    })

    if (error) {
      let errorMessage = 'AI-Fehler'
      
      if (error.message?.includes('ANTHROPIC_API_KEY')) {
        errorMessage = 'Anthropic API Key nicht in Supabase konfiguriert. Bitte in Supabase → Settings → Edge Functions → Secrets hinzufügen.'
      } else if (error.message?.includes('401')) {
        errorMessage = 'Ungültiger API-Key in Supabase.'
      } else if (error.message?.includes('429')) {
        errorMessage = 'Zu viele Anfragen. Bitte warte einen Moment.'
      } else {
        errorMessage = error.message || 'Unbekannter Fehler'
      }
      
      const apiError = new ClaudeApiError(errorMessage)
      onError?.(apiError)
      throw apiError
    }

    const response = data?.message || data?.response || ''
    
    // Simulate streaming for UI consistency
    if (onChunk) {
      onChunk(response)
    }
    
    onComplete?.(response)
    return response

  } catch (error) {
    if (error instanceof ClaudeApiError) {
      throw error
    }
    
    const apiError = new ClaudeApiError(
      error instanceof Error ? error.message : 'Unbekannter Fehler'
    )
    onError?.(apiError)
    throw apiError
  }
}

// Helper to convert ChatMessage[] to ClaudeMessage[]
export function chatMessagesToClaudeMessages(messages: ChatMessage[]): ClaudeMessage[] {
  return messages.map(m => ({
    role: m.role,
    content: m.content
  }))
}

// Check if API is configured (via Supabase)
export function isApiConfigured(): boolean {
  return isSupabaseConfigured()
}
