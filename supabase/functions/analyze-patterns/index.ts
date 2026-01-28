// supabase/functions/analyze-patterns/index.ts
// Calculates patterns based on all user posts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FEATURE_DIMENSIONS = [
  { name: "topics", isArray: true },
  { name: "format", isArray: false },
  { name: "hook_type", isArray: false },
  { name: "has_personal_story", isArray: false },
  { name: "has_call_to_action", isArray: false },
  { name: "has_numbers_in_title", isArray: false },
  { name: "has_list", isArray: false },
  { name: "day_of_week", isArray: false },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all complete posts
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", user_id)
      .eq("status", "complete")
      .not("engagement_rate", "is", null);

    if (postsError) throw postsError;
    
    if (!posts || posts.length < 5) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Need at least 5 posts with metrics",
          patterns: [] 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate average engagement
    const avgEngagement = posts.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / posts.length;

    const patterns: any[] = [];

    // Analyze each feature dimension
    for (const dimension of FEATURE_DIMENSIONS) {
      const groups: Record<string, typeof posts> = {};

      for (const post of posts) {
        const featureValue = post.features?.[dimension.name];
        if (featureValue === undefined || featureValue === null) continue;

        const values = dimension.isArray && Array.isArray(featureValue) 
          ? featureValue 
          : [String(featureValue)];

        for (const value of values) {
          if (!groups[value]) groups[value] = [];
          groups[value].push(post);
        }
      }

      // Calculate performance delta for each group
      for (const [value, groupPosts] of Object.entries(groups)) {
        if (groupPosts.length < 3) continue;

        const groupAvg = groupPosts.reduce((sum, p) => sum + (p.engagement_rate || 0), 0) / groupPosts.length;
        const delta = avgEngagement > 0 ? (groupAvg - avgEngagement) / avgEngagement : 0;

        // Only significant patterns (>20% difference)
        if (Math.abs(delta) > 0.2) {
          const confidence = Math.min(0.95, 0.5 + (groupPosts.length / posts.length) * 0.3 + Math.abs(delta) * 0.2);
          
          const topExamples = groupPosts
            .sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0))
            .slice(0, 3)
            .map(p => p.id);

          patterns.push({
            user_id,
            feature_name: dimension.name,
            feature_value: value,
            pattern_type: delta > 0 ? 'positive' : 'negative',
            performance_delta: Math.round(delta * 100) / 100,
            sample_size: groupPosts.length,
            confidence: Math.round(confidence * 100) / 100,
            example_post_ids: topExamples,
            calculated_at: new Date().toISOString()
          });
        }
      }
    }

    // Upsert patterns
    if (patterns.length > 0) {
      const { error: upsertError } = await supabase
        .from("patterns")
        .upsert(patterns, {
          onConflict: "user_id,feature_name,feature_value"
        });

      if (upsertError) throw upsertError;
    }

    // Update model confidence
    const modelConfidence = Math.min(
      0.95, 
      0.3 + (posts.length / 100) * 0.3 + (patterns.length / 20) * 0.2
    );

    await supabase
      .from("profiles")
      .update({ 
        model_confidence: Math.round(modelConfidence * 100) / 100,
        updated_at: new Date().toISOString()
      })
      .eq("id", user_id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        patterns_count: patterns.length,
        positive: patterns.filter(p => p.pattern_type === 'positive').length,
        negative: patterns.filter(p => p.pattern_type === 'negative').length
      }),
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
