import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

interface EmbedRequest {
  action: 'embed_content' | 'embed_and_store' | 'search'
  content?: string
  content_type?: 'post' | 'learning' | 'pattern' | 'conversation' | 'style_rule' | 'consolidated'
  content_id?: string
  title?: string
  platform?: 'linkedin' | 'youtube' | 'instagram' | 'skool' | 'general'
  metadata?: Record<string, unknown>
  importance_score?: number
  query?: string
  match_count?: number
  filter_type?: string
  filter_platform?: string
  min_importance?: number
}

// Generate embedding using Voyage AI voyage-3
// Best-in-class for retrieval and German language
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'voyage-3',
      input: text.slice(0, 32000), // voyage-3 supports 32K tokens
      input_type: 'document',
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Voyage API error: ${error.detail || response.statusText}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const voyageKey = process.env.VOYAGE_API_KEY
    if (!voyageKey) {
      return res.status(500).json({ error: 'VOYAGE_API_KEY not configured' })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ error: 'Supabase credentials not configured' })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const {
      action,
      content,
      content_type,
      content_id,
      title,
      platform,
      metadata,
      importance_score,
      query,
      match_count = 10,
      filter_type,
      filter_platform,
      min_importance = 0
    } = req.body as EmbedRequest

    // Action: Just return embedding
    if (action === 'embed_content') {
      if (!content) {
        return res.status(400).json({ error: 'content is required' })
      }
      
      const embedding = await generateEmbedding(content, voyageKey)
      return res.status(200).json({ success: true, embedding })
    }

    // Action: Generate embedding and store
    if (action === 'embed_and_store') {
      if (!content || !content_type) {
        return res.status(400).json({ error: 'content and content_type are required' })
      }

      const embedding = await generateEmbedding(content, voyageKey)

      // Check if exists
      if (content_id) {
        const { data: existing } = await supabase
          .from('eugene_memory')
          .select('id')
          .eq('content_id', content_id)
          .eq('content_type', content_type)
          .single()

        if (existing) {
          const { error } = await supabase
            .from('eugene_memory')
            .update({
              title,
              content,
              platform,
              metadata,
              embedding,
              importance_score: importance_score || 0.5,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)

          if (error) throw error
          return res.status(200).json({ success: true, action: 'updated', id: existing.id })
        }
      }

      // Insert new
      const { data, error } = await supabase
        .from('eugene_memory')
        .insert({
          content_type,
          content_id,
          title,
          content,
          platform,
          metadata,
          embedding,
          importance_score: importance_score || 0.5
        })
        .select('id')
        .single()

      if (error) throw error
      return res.status(200).json({ success: true, action: 'inserted', id: data.id })
    }

    // Action: Search
    if (action === 'search') {
      if (!query) {
        return res.status(400).json({ error: 'query is required' })
      }

      const queryEmbedding = await generateEmbedding(query, voyageKey)

      const { data, error } = await supabase.rpc('search_eugene_memory', {
        query_embedding: queryEmbedding,
        match_count,
        filter_type: filter_type || null,
        filter_platform: filter_platform || null,
        min_importance
      })

      if (error) throw error

      // Touch accessed memories
      for (const item of data || []) {
        await supabase.rpc('touch_eugene_memory', { memory_id: item.id })
      }

      return res.status(200).json({ success: true, results: data })
    }

    return res.status(400).json({ error: `Unknown action: ${action}` })

  } catch (error) {
    console.error('Eugene Embed Error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
