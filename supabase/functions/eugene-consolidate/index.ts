/**
 * Eugene Memory Consolidation
 * 
 * Periodically analyzes learnings and creates consolidated insights.
 * This mimics human memory consolidation during sleep.
 * 
 * Should be called:
 * - Weekly via cron job
 * - Or manually from settings
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SINGLE_USER_ID = '00000000-0000-0000-0000-000000000001'

interface ConsolidationRequest {
  platform?: 'linkedin' | 'youtube' | 'instagram' | 'skool'
  force?: boolean  // Force consolidation even if recently done
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    const voyageKey = Deno.env.get('VOYAGE_API_KEY')
    
    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }
    if (!voyageKey) {
      throw new Error('VOYAGE_API_KEY not configured')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { platform, force = false } = await req.json() as ConsolidationRequest

    // Get all learnings from memory
    const { data: learnings, error: learningsError } = await supabase
      .from('eugene_memory')
      .select('*')
      .eq('user_id', SINGLE_USER_ID)
      .eq('content_type', 'learning')
      .order('created_at', { ascending: false })
      .limit(50)

    if (learningsError) throw learningsError

    if (!learnings || learnings.length < 5) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Not enough learnings to consolidate',
          count: learnings?.length || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get existing insights to avoid duplicates
    const { data: existingInsights } = await supabase
      .from('eugene_insights')
      .select('title')
      .eq('user_id', SINGLE_USER_ID)

    const existingTitles = new Set(existingInsights?.map(i => i.title.toLowerCase()) || [])

    // Build context for Claude
    const learningsContext = learnings.map((l, i) => 
      `${i + 1}. ${l.title || 'Learning'}\n${l.content}\nImportance: ${l.importance_score}`
    ).join('\n\n')

    // Ask Claude to identify patterns and create consolidated insights
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: `Du bist Eugene, ein AI-Assistent der Learnings konsolidiert.
        
Deine Aufgabe ist es, aus vielen einzelnen Learnings übergreifende Muster zu erkennen und als Insights zusammenzufassen.

Antworte NUR mit einem JSON-Array. Keine Erklärungen.

Format:
[
  {
    "category": "hook_pattern" | "content_pattern" | "timing_pattern" | "format_pattern" | "topic_pattern" | "general_learning",
    "platform": "linkedin" | "youtube" | "instagram" | "skool" | "general",
    "title": "Kurzer Titel (max 60 Zeichen)",
    "description": "Detaillierte Beschreibung mit konkreten Beispielen (2-3 Sätze)",
    "confidence": 0.7,  // 0-1, basierend auf Anzahl unterstützender Learnings
    "supporting_count": 3  // Anzahl der Learnings die dieses Pattern unterstützen
  }
]

Regeln:
- Nur Insights mit mindestens 2 unterstützenden Learnings
- Konkrete, actionable Insights
- Keine generischen Tipps
- Max 5 Insights pro Aufruf`,
        messages: [{
          role: 'user',
          content: `Analysiere diese Learnings und finde übergreifende Muster:\n\n${learningsContext}\n\nErstelle consolidated Insights als JSON-Array.`
        }]
      })
    })

    if (!claudeResponse.ok) {
      const error = await claudeResponse.json()
      throw new Error(`Claude API error: ${error.error?.message || claudeResponse.statusText}`)
    }

    const claudeData = await claudeResponse.json()
    const responseText = claudeData.content[0].text

    // Parse JSON from response
    let insights: Array<{
      category: string
      platform: string
      title: string
      description: string
      confidence: number
      supporting_count: number
    }>

    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        throw new Error('No JSON array found in response')
      }
      insights = JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error('Failed to parse Claude response:', responseText)
      throw new Error('Failed to parse insights from Claude')
    }

    // Filter out existing insights
    const newInsights = insights.filter(
      i => !existingTitles.has(i.title.toLowerCase())
    )

    if (newInsights.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No new insights found',
          analyzed: learnings.length
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate embeddings and store insights
    const storedInsights: string[] = []

    for (const insight of newInsights) {
      // Generate embedding using Voyage AI voyage-3
      const embeddingResponse = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${voyageKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'voyage-3',
          input: `${insight.title}\n${insight.description}`,
          input_type: 'document',
        }),
      })

      if (!embeddingResponse.ok) {
        console.error('Failed to generate embedding for insight:', insight.title)
        continue
      }

      const embeddingData = await embeddingResponse.json()
      const embedding = embeddingData.data[0].embedding

      // Store in database
      const { data, error } = await supabase
        .from('eugene_insights')
        .insert({
          user_id: SINGLE_USER_ID,
          category: insight.category,
          platform: insight.platform,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          sample_size: insight.supporting_count,
          embedding
        })
        .select('id')
        .single()

      if (!error && data) {
        storedInsights.push(insight.title)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Created ${storedInsights.length} new insights`,
        insights: storedInsights
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Consolidation error:', error)
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
