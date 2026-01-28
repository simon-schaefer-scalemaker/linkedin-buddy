// supabase/functions/chat-completion/index.ts
// Chat interface with full context

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, message, conversation_history = [] } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load context
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user_id)
      .single();

    const { data: patterns } = await supabase
      .from("patterns")
      .select("*")
      .eq("user_id", user_id)
      .order("performance_delta", { ascending: false });

    const { data: recentPosts } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user_id)
      .order("published_at", { ascending: false })
      .limit(5);

    const { data: pendingRecs } = await supabase
      .from("recommendations")
      .select("*")
      .eq("user_id", user_id)
      .eq("status", "pending")
      .limit(3);

    const positivePatterns = patterns?.filter(p => p.pattern_type === 'positive') || [];
    const negativePatterns = patterns?.filter(p => p.pattern_type === 'negative') || [];

    const systemPrompt = `Du bist der persönliche LinkedIn Content Coach für ${profile?.name || 'diesen User'}.

DEIN STIL:
- Freundlich und unterstützend
- Datenbasiert aber nicht robotisch
- Feierst Erfolge, lernst aus Misserfolgen
- Gibst konkrete, actionable Tipps
- Antworte auf Deutsch

USER PROFIL:
- Posts analysiert: ${profile?.total_posts || 0}
- Learning Mode: ${profile?.learning_mode}
- Durchschnittliches Engagement: ${((profile?.avg_engagement_rate || 0) * 100).toFixed(2)}%
- Model Confidence: ${Math.round((profile?.model_confidence || 0.3) * 100)}%

POSITIVE PATTERNS (nutzen):
${positivePatterns.slice(0, 5).map(p => `- ${p.feature_name}: "${p.feature_value}" (+${Math.round(p.performance_delta * 100)}%)`).join('\n') || 'Noch nicht genug Daten'}

NEGATIVE PATTERNS (vermeiden):
${negativePatterns.slice(0, 3).map(p => `- ${p.feature_name}: "${p.feature_value}" (${Math.round(p.performance_delta * 100)}%)`).join('\n') || 'Keine erkannt'}

LETZTE POSTS:
${recentPosts?.map(p => `- "${p.body.substring(0, 60)}..." (${p.engagement_rate ? (p.engagement_rate * 100).toFixed(2) + '%' : 'Metriken fehlen'})`).join('\n') || 'Keine Posts'}

OFFENE EMPFEHLUNGEN:
${pendingRecs?.map(r => `- "${r.title}" (${r.confidence_score}%)`).join('\n') || 'Keine'}

DEINE FÄHIGKEITEN:
1. Post-Ideen basierend auf Patterns generieren
2. Drafts analysieren und verbessern
3. Fragen zu Performance beantworten
4. Patterns erklären
5. Bei Content-Strategie helfen

Sei konkret, nutze die Daten, und hilf dem User besser zu werden.`;

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    // Build messages
    const messages = [
      ...conversation_history.slice(-10).map((m: any) => ({
        role: m.role,
        content: m.content
      })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const claudeResponse = await response.json();
    const assistantMessage = claudeResponse.content[0]?.text || "";

    // Save messages
    await supabase.from("chat_messages").insert([
      { user_id, role: "user", content: message },
      { user_id, role: "assistant", content: assistantMessage }
    ]);

    return new Response(
      JSON.stringify({ success: true, message: assistantMessage }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
