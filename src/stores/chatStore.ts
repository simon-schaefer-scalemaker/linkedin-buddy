import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatState {
  // Chat history per post (postId -> messages)
  chats: Record<string, ChatMessage[]>
  
  // Actions
  addMessage: (postId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  getChat: (postId: string) => ChatMessage[]
  clearChat: (postId: string) => void
  
  // For streaming - update the last assistant message
  updateLastAssistantMessage: (postId: string, content: string) => void
  
  // Start a new assistant message (for streaming)
  startAssistantMessage: (postId: string) => string // returns message id
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: {},
      
      addMessage: (postId, message) => {
        const newMessage: ChatMessage = {
          ...message,
          id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          timestamp: new Date().toISOString()
        }
        
        set((state) => ({
          chats: {
            ...state.chats,
            [postId]: [...(state.chats[postId] || []), newMessage]
          }
        }))
      },
      
      getChat: (postId) => {
        return get().chats[postId] || []
      },
      
      clearChat: (postId) => {
        set((state) => {
          const { [postId]: _, ...rest } = state.chats
          return { chats: rest }
        })
      },
      
      startAssistantMessage: (postId) => {
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const newMessage: ChatMessage = {
          id: messageId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString()
        }
        
        set((state) => ({
          chats: {
            ...state.chats,
            [postId]: [...(state.chats[postId] || []), newMessage]
          }
        }))
        
        return messageId
      },
      
      updateLastAssistantMessage: (postId, content) => {
        set((state) => {
          const messages = state.chats[postId] || []
          const lastIndex = messages.length - 1
          
          if (lastIndex < 0 || messages[lastIndex].role !== 'assistant') {
            return state
          }
          
          const updatedMessages = [...messages]
          updatedMessages[lastIndex] = {
            ...updatedMessages[lastIndex],
            content
          }
          
          return {
            chats: {
              ...state.chats,
              [postId]: updatedMessages
            }
          }
        })
      }
    }),
    {
      name: 'ai-chat-storage',
      version: 1
    }
  )
)
