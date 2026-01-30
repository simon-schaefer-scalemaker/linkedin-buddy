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
 * Send message via Vercel API Route or Supabase Edge Function
 * API Key is stored server-side (never in browser)
 */
export async function sendMessage(options: SendMessageOptions): Promise<string> {
  const { systemPrompt, messages, onChunk, onComplete, onError } = options
  
  try {
    let data: { success?: boolean; message?: string; error?: string } | null = null
    let errorMsg: string | null = null

    // Try Vercel API Route first (works when deployed to Vercel)
    const vercelApiUrl = '/api/ai-chat'
    
    try {
      const vercelResponse = await fetch(vercelApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_prompt: systemPrompt,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })
      
      if (vercelResponse.ok) {
        data = await vercelResponse.json()
      } else if (vercelResponse.status !== 404) {
        // If not 404 (route exists but errored), use this error
        const errData = await vercelResponse.json().catch(() => ({}))
        errorMsg = errData.error || `API error: ${vercelResponse.status}`
      }
    } catch (vercelErr) {
      // Vercel API not available (local dev or not deployed), try Supabase
      console.log('Vercel API not available, trying Supabase Edge Function...')
    }

    // If Vercel didn't work, try Supabase Edge Function
    if (!data && !errorMsg && isSupabaseConfigured()) {
      try {
        const { data: sbData, error: sbError } = await supabase.functions.invoke('ai-chat', {
          body: {
            system_prompt: systemPrompt,
            messages: messages.map(m => ({
              role: m.role,
              content: m.content
            }))
          }
        })
        
        if (sbError) {
          errorMsg = sbError.message
        } else {
          data = sbData
        }
      } catch (sbErr) {
        errorMsg = sbErr instanceof Error ? sbErr.message : 'Supabase Edge Function error'
      }
    }

    // Handle errors
    if (errorMsg || !data) {
      let finalError = errorMsg || 'AI service not available'
      
      if (finalError.includes('ANTHROPIC_API_KEY')) {
        finalError = 'API Key nicht konfiguriert. Bitte in Vercel/Supabase Settings hinzufügen.'
      } else if (finalError.includes('Failed to send a request')) {
        finalError = 'AI Service nicht erreichbar. Bitte deploye die App auf Vercel oder konfiguriere Supabase Edge Functions.'
      }
      
      const apiError = new ClaudeApiError(finalError)
      onError?.(apiError)
      throw apiError
    }

    if (!data.success && data.error) {
      const apiError = new ClaudeApiError(data.error)
      onError?.(apiError)
      throw apiError
    }

    const response = data.message || ''
    
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

// Check if API is configured (via Vercel or Supabase)
export function isApiConfigured(): boolean {
  // In production (Vercel), the API route will be available
  // In development, we check Supabase
  return isSupabaseConfigured() || import.meta.env.PROD
}
