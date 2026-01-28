// supabase/functions/extract-features/index.ts
// Extracts features from post text via Claude API

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
    const { post_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get post
    const { data: post, error: postError } = await supabase
      .from("posts")
      .select("*")
      .eq("id", post_id)
      .single();

    if (postError || !post) {
      throw new Error("Post not found");
    }

    // Update status
    await supabase
      .from("posts")
      .update({ status: "analyzing" })
      .eq("id", post_id);

    // Extract features via Claude
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
          content: `Analysiere diesen LinkedIn-Post und extrahiere Features.

POST:
"""
${post.body}
"""

Extrahiere als JSON:
{
  "topics": ["array von 1-3 hauptthemen, z.B. productivity, pricing, leadership"],
  "format": "list | story | how-to | opinion | question | announcement",
  "hook_type": "number | question | bold_claim | curiosity | personal | pain_point",
  "sentiment": "positive | neutral | negative",
  "has_personal_story": true/false,
  "has_call_to_action": true/false,
  "has_numbers_in_title": true/false,
  "has_question": true/false,
  "has_list": true/false,
  "word_count": number,
  "key_themes": ["2-5 spezifische themen/keywords"]
}

Nur JSON zurückgeben, keine Erklärung.`
        }]
      }),
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.status}`);
    }

    const claudeResponse = await response.json();
    const responseText = claudeResponse.content[0]?.text || "{}";
    
    let features;
    try {
      // Try to parse the JSON, handling potential markdown code blocks
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      features = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      features = {};
    }

    // Add computed features
    const publishedDate = new Date(post.published_at);
    features.day_of_week = publishedDate.getDay();
    features.hour_of_day = publishedDate.getHours();

    // Update post with features
    await supabase
      .from("posts")
      .update({
        features,
        status: post.impressions ? "complete" : "metrics_needed",
        updated_at: new Date().toISOString()
      })
      .eq("id", post_id);

    return new Response(
      JSON.stringify({ success: true, features }),
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
