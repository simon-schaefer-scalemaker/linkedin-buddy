import { usePostsStore } from './store'
import type { 
  Post, 
  PlatformId, 
  LinkedInPost, 
  YouTubePost, 
  InstagramPost, 
  SkoolPost,
  WorkflowStatusId 
} from './types'

// Available actions the manager can perform
export type AgentActionType = 
  | 'create_post'
  | 'create_multiple_posts'
  | 'update_post'
  | 'delete_post'  // Requires human review
  | 'analyze_transcript'
  | 'generate_ideas'
  | 'search_posts'
  | 'get_statistics'
  | 'move_posts_to_status'

export interface AgentAction {
  type: AgentActionType
  description: string
  requiresHumanReview: boolean
  parameters: Record<string, unknown>
}

export interface PendingAction {
  id: string
  action: AgentAction
  message: string
  createdAt: string
}

// Action results
export interface ActionResult {
  success: boolean
  message: string
  data?: unknown
  requiresConfirmation?: boolean
  pendingActionId?: string
}

// Store for pending actions that need human review
let pendingActions: PendingAction[] = []

export function getPendingActions(): PendingAction[] {
  return pendingActions
}

export function clearPendingAction(id: string): void {
  pendingActions = pendingActions.filter(a => a.id !== id)
}

export function addPendingAction(action: AgentAction, message: string): string {
  const id = `pending-${Date.now()}`
  pendingActions.push({
    id,
    action,
    message,
    createdAt: new Date().toISOString()
  })
  return id
}

// Helper to create a new post
function createPostObject(
  platform: PlatformId, 
  content: Record<string, unknown>,
  status: WorkflowStatusId = 'idea'
): Post {
  const id = `${platform.slice(0, 2)}-mgr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const basePost = {
    id,
    platform,
    status,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  switch (platform) {
    case 'linkedin':
      return {
        ...basePost,
        platform: 'linkedin',
        content: {
          hook: content.hook as string || '',
          text: content.text as string || '',
          cta: content.cta as string || '',
          bulletPoints: content.bulletPoints as string[] || [],
          hashtags: content.hashtags as string[] || [],
        }
      } as LinkedInPost

    case 'youtube':
      return {
        ...basePost,
        platform: 'youtube',
        content: {
          title: content.title as string || '',
          description: content.description as string || '',
          isShort: content.isShort as boolean || false,
          tags: content.tags as string[] || [],
        }
      } as YouTubePost

    case 'instagram':
      return {
        ...basePost,
        platform: 'instagram',
        content: {
          caption: content.caption as string || '',
          type: (content.type as 'post' | 'reel' | 'story' | 'carousel') || 'post',
          hashtags: content.hashtags as string[] || [],
        }
      } as InstagramPost

    case 'skool':
      return {
        ...basePost,
        platform: 'skool',
        content: {
          title: content.title as string || '',
          body: content.body as string || '',
          category: content.category as string || '',
        }
      } as SkoolPost

    default:
      throw new Error(`Unknown platform: ${platform}`)
  }
}

// Execute an action
export function executeAction(
  action: AgentAction,
  store: ReturnType<typeof usePostsStore.getState>
): ActionResult {
  try {
    switch (action.type) {
      case 'create_post': {
        const { platform, content, status } = action.parameters as {
          platform: PlatformId
          content: Record<string, unknown>
          status?: WorkflowStatusId
        }
        
        const newPost = createPostObject(platform, content, status)
        store.addPost(newPost)
        
        return {
          success: true,
          message: `Post für ${platform} erstellt`,
          data: { postId: newPost.id, platform }
        }
      }

      case 'create_multiple_posts': {
        const { posts } = action.parameters as {
          posts: Array<{
            platform: PlatformId
            content: Record<string, unknown>
            status?: WorkflowStatusId
          }>
        }
        
        const createdPosts: string[] = []
        posts.forEach(postData => {
          const newPost = createPostObject(postData.platform, postData.content, postData.status)
          store.addPost(newPost)
          createdPosts.push(newPost.id)
        })
        
        return {
          success: true,
          message: `${createdPosts.length} Posts erstellt`,
          data: { postIds: createdPosts }
        }
      }

      case 'update_post': {
        const { postId, updates } = action.parameters as {
          postId: string
          updates: Partial<Post>
        }
        
        store.updatePost(postId, updates)
        
        return {
          success: true,
          message: `Post aktualisiert`,
          data: { postId }
        }
      }

      case 'delete_post': {
        // This requires human review - don't execute directly
        const { postId, reason } = action.parameters as {
          postId: string
          reason?: string
        }
        
        const pendingId = addPendingAction(action, `Löschanfrage: ${reason || 'Kein Grund angegeben'}`)
        
        return {
          success: true,
          message: `⚠️ Löschanfrage erstellt. Bitte bestätige das Löschen.`,
          requiresConfirmation: true,
          pendingActionId: pendingId,
          data: { postId }
        }
      }

      case 'search_posts': {
        const { query, platform, status } = action.parameters as {
          query?: string
          platform?: PlatformId
          status?: WorkflowStatusId
        }
        
        let results = store.posts
        
        if (platform) {
          results = results.filter(p => p.platform === platform)
        }
        
        if (status) {
          results = results.filter(p => p.status === status)
        }
        
        if (query) {
          const lowerQuery = query.toLowerCase()
          results = results.filter(p => {
            const content = JSON.stringify(p.content).toLowerCase()
            return content.includes(lowerQuery)
          })
        }
        
        return {
          success: true,
          message: `${results.length} Posts gefunden`,
          data: { posts: results, count: results.length }
        }
      }

      case 'get_statistics': {
        const posts = store.posts
        
        const stats = {
          total: posts.length,
          byPlatform: {
            linkedin: posts.filter(p => p.platform === 'linkedin').length,
            youtube: posts.filter(p => p.platform === 'youtube').length,
            instagram: posts.filter(p => p.platform === 'instagram').length,
            skool: posts.filter(p => p.platform === 'skool').length,
          },
          byStatus: {
            idea: posts.filter(p => p.status === 'idea').length,
            draft: posts.filter(p => p.status === 'draft').length,
            review: posts.filter(p => p.status === 'review').length,
            scheduled: posts.filter(p => p.status === 'scheduled').length,
            published: posts.filter(p => p.status === 'published').length,
          },
          withMetrics: posts.filter(p => p.metrics).length,
        }
        
        return {
          success: true,
          message: `Statistik: ${stats.total} Posts insgesamt`,
          data: stats
        }
      }

      case 'move_posts_to_status': {
        const { postIds, newStatus } = action.parameters as {
          postIds: string[]
          newStatus: WorkflowStatusId
        }
        
        postIds.forEach(id => {
          store.updatePost(id, { status: newStatus })
        })
        
        return {
          success: true,
          message: `${postIds.length} Posts auf "${newStatus}" gesetzt`,
          data: { postIds, newStatus }
        }
      }

      case 'analyze_transcript':
      case 'generate_ideas':
        // These are handled by the AI - just return acknowledgment
        return {
          success: true,
          message: 'Analyse wird durchgeführt...',
          data: {}
        }

      default:
        return {
          success: false,
          message: `Unbekannte Aktion: ${action.type}`,
        }
    }
  } catch (error) {
    return {
      success: false,
      message: `Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
    }
  }
}

// Confirm and execute a pending action (for human review)
export function confirmPendingAction(
  pendingId: string,
  store: ReturnType<typeof usePostsStore.getState>
): ActionResult {
  const pending = pendingActions.find(a => a.id === pendingId)
  
  if (!pending) {
    return {
      success: false,
      message: 'Ausstehende Aktion nicht gefunden'
    }
  }
  
  // For delete actions, actually execute the delete now
  if (pending.action.type === 'delete_post') {
    const { postId } = pending.action.parameters as { postId: string }
    store.deletePost(postId)
    clearPendingAction(pendingId)
    
    return {
      success: true,
      message: 'Post wurde gelöscht'
    }
  }
  
  clearPendingAction(pendingId)
  return {
    success: true,
    message: 'Aktion bestätigt'
  }
}

// Generate the system prompt for the manager agent
export function getManagerSystemPrompt(posts: Post[]): string {
  const stats = {
    total: posts.length,
    byPlatform: {
      linkedin: posts.filter(p => p.platform === 'linkedin').length,
      youtube: posts.filter(p => p.platform === 'youtube').length,
      instagram: posts.filter(p => p.platform === 'instagram').length,
      skool: posts.filter(p => p.platform === 'skool').length,
    },
    byStatus: {
      idea: posts.filter(p => p.status === 'idea').length,
      draft: posts.filter(p => p.status === 'draft').length,
      review: posts.filter(p => p.status === 'review').length,
      scheduled: posts.filter(p => p.status === 'scheduled').length,
      published: posts.filter(p => p.status === 'published').length,
    },
  }

  return `Du bist der Content Manager Assistent für eine Social Media Content Management App.

## Deine Aufgaben
- Hilf dem Nutzer bei der Content-Planung und -Erstellung
- Analysiere Transkripte und generiere Content-Ideen
- Erstelle Posts für verschiedene Plattformen (LinkedIn, YouTube, Instagram, Skool)
- Führe Massenoperationen durch (mehrere Posts erstellen, Status ändern)
- Gib Statistiken und Übersichten

## Aktuelle Statistiken
- Gesamt: ${stats.total} Posts
- LinkedIn: ${stats.byPlatform.linkedin} | YouTube: ${stats.byPlatform.youtube} | Instagram: ${stats.byPlatform.instagram} | Skool: ${stats.byPlatform.skool}
- Ideen: ${stats.byStatus.idea} | Entwürfe: ${stats.byStatus.draft} | Review: ${stats.byStatus.review} | Geplant: ${stats.byStatus.scheduled} | Veröffentlicht: ${stats.byStatus.published}

## Verfügbare Aktionen
Du kannst folgende Aktionen ausführen. Antworte mit einem JSON-Block wenn du eine Aktion ausführen möchtest:

### Post erstellen
\`\`\`json
{"action": "create_post", "platform": "linkedin|youtube|instagram|skool", "content": {...}, "status": "idea"}
\`\`\`

Content-Struktur pro Plattform:
- LinkedIn: {"hook": "...", "text": "...", "cta": "...", "bulletPoints": [...], "hashtags": [...]}
- YouTube: {"title": "...", "description": "...", "isShort": false, "tags": [...]}
- Instagram: {"caption": "...", "type": "post|reel|carousel|story", "hashtags": [...]}
- Skool: {"title": "...", "body": "...", "category": "..."}

### Mehrere Posts erstellen
\`\`\`json
{"action": "create_multiple_posts", "posts": [{"platform": "...", "content": {...}}, ...]}
\`\`\`

### Post suchen
\`\`\`json
{"action": "search_posts", "query": "Suchbegriff", "platform": "linkedin", "status": "draft"}
\`\`\`

### Status ändern (Massenoperation)
\`\`\`json
{"action": "move_posts_to_status", "postIds": ["id1", "id2"], "newStatus": "review"}
\`\`\`

### Statistiken abrufen
\`\`\`json
{"action": "get_statistics"}
\`\`\`

### Post löschen (benötigt Bestätigung)
\`\`\`json
{"action": "delete_post", "postId": "...", "reason": "Warum löschen"}
\`\`\`
⚠️ WICHTIG: Löschaktionen erfordern IMMER eine Bestätigung durch den Nutzer!

## Regeln
1. Sei proaktiv und hilfreich
2. Wenn der Nutzer ein Transkript teilt, analysiere es und schlage konkrete Content-Ideen vor
3. Frage nach, wenn Informationen fehlen
4. Erstelle qualitativ hochwertige, plattform-optimierte Inhalte
5. Bei Löschaktionen: Erkläre warum und warte auf Bestätigung
6. Antworte auf Deutsch

## Beispiel-Interaktion
Nutzer: "Hier ist ein Transkript von meinem Podcast über Zeitmanagement..."
Du: Analysierst das Transkript, identifizierst 3-5 Kernthemen, und schlägst vor:
- 2 LinkedIn Posts (mit Hook, Text, CTA)
- 1 YouTube Short Idee
- 1 Instagram Carousel Konzept
Dann fragst du: "Soll ich diese Posts erstellen?"

Beginne jetzt mit der Unterstützung des Nutzers.`
}

// Parse action from AI response
export function parseActionFromResponse(response: string): AgentAction | null {
  // Look for JSON blocks in the response
  const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/)
  
  if (!jsonMatch) {
    // Try to find raw JSON object
    const rawJsonMatch = response.match(/\{[\s\S]*?"action"\s*:\s*"[^"]+"/);
    if (!rawJsonMatch) return null
    
    try {
      // Find the complete JSON object
      let depth = 0
      let start = response.indexOf(rawJsonMatch[0])
      let end = start
      
      for (let i = start; i < response.length; i++) {
        if (response[i] === '{') depth++
        if (response[i] === '}') depth--
        if (depth === 0) {
          end = i + 1
          break
        }
      }
      
      const jsonStr = response.substring(start, end)
      const parsed = JSON.parse(jsonStr)
      return convertToAgentAction(parsed)
    } catch {
      return null
    }
  }

  try {
    const parsed = JSON.parse(jsonMatch[1])
    return convertToAgentAction(parsed)
  } catch {
    return null
  }
}

function convertToAgentAction(parsed: Record<string, unknown>): AgentAction | null {
  if (!parsed.action) return null
  
  const actionType = parsed.action as AgentActionType
  const requiresReview = actionType === 'delete_post'
  
  // Extract parameters (everything except 'action')
  const { action, ...parameters } = parsed
  
  return {
    type: actionType,
    description: getActionDescription(actionType),
    requiresHumanReview: requiresReview,
    parameters
  }
}

function getActionDescription(type: AgentActionType): string {
  const descriptions: Record<AgentActionType, string> = {
    create_post: 'Neuen Post erstellen',
    create_multiple_posts: 'Mehrere Posts erstellen',
    update_post: 'Post aktualisieren',
    delete_post: 'Post löschen (benötigt Bestätigung)',
    analyze_transcript: 'Transkript analysieren',
    generate_ideas: 'Content-Ideen generieren',
    search_posts: 'Posts durchsuchen',
    get_statistics: 'Statistiken abrufen',
    move_posts_to_status: 'Posts verschieben',
  }
  return descriptions[type] || 'Unbekannte Aktion'
}
