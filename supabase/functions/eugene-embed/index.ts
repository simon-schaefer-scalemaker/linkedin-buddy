import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmbedRequest {
  action: 'embed_content' | 'embed_and_store' | 'search'
  
  // For embed_content / embed_and_store
  content?: string
  content_type?: 'post' | 'learning' | 'pattern' | 'conversation' | 'style_rule' | 'consolidated'
  content_id?: string
  title?: string
  platform?: 'linkedin' | 'youtube' | 'instagram' | 'skool' | 'general'
  metadata?: Record<string, unknown>
  importance_score?: number
  
  // For search
  query?: string
  match_count?: number
  filter_type?: string
  filter_platform?: string
  min_importance?: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const voyageKey = Deno.env.get('VOYAGE_API_KEY')
    if (!voyageKey) {
      throw new Error('VOYAGE_API_KEY not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
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
    } = await req.json() as EmbedRequest

    // Generate embedding using Voyage AI voyage-3
    // Best-in-class for retrieval and German language
    async function generateEmbedding(text: string): Promise<number[]> {
      const response = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${voyageKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'voyage-3',
          input: text.slice(0, 32000), // voyage-3 supports 32K tokens
          input_type: 'document', // Optimized for storage
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Voyage API error: ${error.detail || response.statusText}`)
      }

      const data = await response.json()
      return data.data[0].embedding
    }

    // Action: Just return embedding
    if (action === 'embed_content') {
      if (!content) {
        throw new Error('content is required for embed_content action')
      }
      
      const embedding = await generateEmbedding(content)
      
      return new Response(
        JSON.stringify({ success: true, embedding }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Action: Generate embedding and store in eugene_memory
    if (action === 'embed_and_store') {
      if (!content || !content_type) {
        throw new Error('content and content_type are required for embed_and_store action')
      }

      const embedding = await generateEmbedding(content)

      // Check if content already exists (update) or is new (insert)
      if (content_id) {
        const { data: existing } = await supabase
          .from('eugene_memory')
          .select('id')
          .eq('content_id', content_id)
          .eq('content_type', content_type)
          .single()

        if (existing) {
          // Update existing
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

          return new Response(
            JSON.stringify({ success: true, action: 'updated', id: existing.id }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
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

      return new Response(
        JSON.stringify({ success: true, action: 'inserted', id: data.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Action: Search similar content
    if (action === 'search') {
      if (!query) {
        throw new Error('query is required for search action')
      }

      const queryEmbedding = await generateEmbedding(query)

      const { data, error } = await supabase.rpc('search_eugene_memory', {
        query_embedding: queryEmbedding,
        match_count,
        filter_type: filter_type || null,
        filter_platform: filter_platform || null,
        min_importance
      })

      if (error) throw error

      // Touch accessed memories to increase importance
      for (const item of data || []) {
        await supabase.rpc('touch_eugene_memory', { memory_id: item.id })
      }

      return new Response(
        JSON.stringify({ success: true, results: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error(`Unknown action: ${action}`)

  } catch (error) {
    console.error('Eugene Embed Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
