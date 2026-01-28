// supabase/functions/analyze-draft/index.ts
// Live analysis of a draft in the workspace

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
    const { user_id, draft_body } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user patterns
    const { data: patterns } = await supabase
      .from("patterns")
      .select("*")
      .eq("user_id", user_id)
      .order("performance_delta", { ascending: false });

    const positivePatterns = patterns?.filter(p => p.pattern_type === 'positive') || [];
    const negativePatterns = patterns?.filter(p => p.pattern_type === 'negative') || [];

    // Get user avg engagement
    const { data: profile } = await supabase
      .from("profiles")
      .select("avg_engagement_rate")
      .eq("id", user_id)
      .single();

    const avgEngagement = profile?.avg_engagement_rate || 0.03;

    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

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
        messages: [{
          role: "user",
          content: `Analysiere diesen LinkedIn Post Draft.

DRAFT:
"""
${draft_body}
"""

USER'S POSITIVE PATTERNS:
${positivePatterns.slice(0, 5).map(p => `- ${p.feature_name}: "${p.feature_value}" (+${Math.round(p.performance_delta * 100)}%)`).join('\n') || 'Keine Patterns'}

USER'S NEGATIVE PATTERNS:
${negativePatterns.slice(0, 3).map(p => `- ${p.feature_name}: "${p.feature_value}" (${Math.round(p.performance_delta * 100)}%)`).join('\n') || 'Keine negativen Patterns'}

Analysiere und gib zurück als JSON:
{
  "overall_score": 0-100,
  "feedback": {
    "hook": {
      "status": "good" | "warning" | "bad",
      "message": "Bewertung",
      "suggestion": "Verbesserung falls nötig"
    },
    "format": {
      "status": "good" | "warning" | "bad",
      "message": "Bewertung"
    },
    "length": {
      "status": "good" | "warning" | "bad",
      "message": "Bewertung",
      "word_count": number
    },
    "cta": {
      "status": "good" | "warning" | "bad",
      "message": "Bewertung"
    }
  },
  "patterns_used": ["liste der genutzten positiven patterns"],
  "patterns_missing": ["liste der nicht genutzten aber empfohlenen"],
  "warnings": ["liste der erkannten negativen patterns"],
  "engagement_multiplier": number (z.B. 1.5 für +50%)
}

Nur JSON.`
        }]
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const claudeResponse = await response.json();
    const responseText = claudeResponse.content[0]?.text || "{}";
    
    let analysis;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      analysis = {
        overall_score: 50,
        feedback: {
          hook: { status: "warning", message: "Konnte nicht analysiert werden" },
          format: { status: "warning", message: "Konnte nicht analysiert werden" },
          length: { status: "warning", message: "Konnte nicht analysiert werden", word_count: draft_body.split(/\s+/).length },
          cta: { status: "warning", message: "Konnte nicht analysiert werden" }
        },
        patterns_used: [],
        patterns_missing: [],
        warnings: [],
        engagement_multiplier: 1
      };
    }

    // Calculate predicted engagement
    const predictedEngagement = avgEngagement * (analysis.engagement_multiplier || 1);
    analysis.predicted_engagement = Math.round(predictedEngagement * 10000) / 100;
    analysis.avg_engagement = Math.round(avgEngagement * 10000) / 100;

    return new Response(
      JSON.stringify({ success: true, analysis }),
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
