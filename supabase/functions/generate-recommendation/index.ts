// supabase/functions/generate-recommendation/index.ts
// Generates personalized recommendations based on patterns

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
    const { user_id, count = 3 } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user_id)
      .single();

    // Get patterns
    const { data: patterns } = await supabase
      .from("patterns")
      .select("*")
      .eq("user_id", user_id)
      .order("performance_delta", { ascending: false });

    const positivePatterns = patterns?.filter(p => p.pattern_type === 'positive') || [];
    const negativePatterns = patterns?.filter(p => p.pattern_type === 'negative') || [];

    // Get top posts
    const { data: topPosts } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user_id)
      .eq("performance_tier", "high")
      .limit(5);

    // Get recent posts (to avoid repetition)
    const { data: recentPosts } = await supabase
      .from("posts")
      .select("body, features")
      .eq("user_id", user_id)
      .order("published_at", { ascending: false })
      .limit(5);

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const prompt = `Du bist ein LinkedIn Content Stratege. Generiere ${count} Post-Ideen für diesen Creator.

## PATTERNS DIE FUNKTIONIEREN:
${positivePatterns.slice(0, 5).map(p => 
  `- ${p.feature_name}: "${p.feature_value}" (+${Math.round(p.performance_delta * 100)}%, Confidence: ${Math.round(p.confidence * 100)}%)`
).join('\n') || 'Noch keine Patterns'}

## PATTERNS DIE NICHT FUNKTIONIEREN:
${negativePatterns.slice(0, 3).map(p => 
  `- ${p.feature_name}: "${p.feature_value}" (${Math.round(p.performance_delta * 100)}%)`
).join('\n') || 'Keine negativen Patterns'}

## TOP PERFORMER BEISPIELE:
${topPosts?.slice(0, 3).map(p => 
  `- "${p.body.substring(0, 100)}..." (${(p.engagement_rate * 100).toFixed(2)}%)`
).join('\n') || 'Keine Daten'}

## LETZTE POSTS (nicht wiederholen):
${recentPosts?.map(p => p.features?.topics?.join(', ')).filter(Boolean).join('; ') || 'Keine'}

## AUFGABE:
Generiere ${count} Post-Ideen die die positiven Patterns nutzen und negative vermeiden.

Für jede Idee:
{
  "title": "Kurze, prägnante Überschrift",
  "description": "1-2 Sätze was der Post behandelt",
  "suggested_hook": "Der erste Satz/Hook des Posts",
  "suggested_outline": ["Punkt 1", "Punkt 2", "Punkt 3"],
  "confidence_score": 0-100,
  "reasoning": {
    "primary_patterns": ["genutzte patterns"],
    "expected_delta": "+X%",
    "why_it_works": "Kurze Begründung"
  }
}

Nur JSON Array zurückgeben, keine Erklärung.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }]
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const claudeResponse = await response.json();
    const responseText = claudeResponse.content[0]?.text || "[]";
    
    let recommendations;
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      recommendations = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } catch {
      recommendations = [];
    }

    // Save recommendations
    const toInsert = recommendations.map((r: any) => ({
      user_id,
      title: r.title,
      description: r.description,
      suggested_hook: r.suggested_hook,
      suggested_outline: r.suggested_outline,
      confidence_score: r.confidence_score,
      reasoning: r.reasoning,
      status: 'pending'
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("recommendations")
      .insert(toInsert)
      .select();

    if (insertError) throw insertError;

    return new Response(
      JSON.stringify({ success: true, recommendations: inserted }),
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
