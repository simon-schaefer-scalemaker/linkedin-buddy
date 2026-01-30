import type { Post, PlatformId } from './types'
import { buildContextForPlatform, buildCurrentPostContext } from './ai-context'
import { buildLearningsContext } from '@/stores/learningsStore'
import { buildPatternContext, generateNextPostRecommendations } from './pattern-recognition'
import { analyzeWritingStyle, buildStylePrompt } from './style-analyzer'
import { getRelevantContext } from './eugene-memory'

// Platform-specific best practices
const PLATFORM_BEST_PRACTICES: Record<PlatformId, string> = {
  linkedin: `## LinkedIn Best Practices

### Hook (erste 2-3 Zeilen)
- Der Hook muss SOFORT Aufmerksamkeit erregen
- Verwende eine provokante Aussage, überraschende Statistik oder persönliche Geschichte
- Vermeide langweilige Einleitungen wie "Ich möchte heute über..."
- Die ersten 150 Zeichen sind entscheidend (vor "mehr anzeigen")

### Struktur
- Nutze Leerzeilen für Lesbarkeit
- Bullet Points (•) für Listen und Aufzählungen
- Halte Absätze kurz (max. 2-3 Zeilen)
- Verwende Emojis sparsam und gezielt

### Call-to-Action
- Beende mit einer klaren Handlungsaufforderung
- Fragen generieren Kommentare
- "Speichern für später" funktioniert gut
- Vermeide plumpe Sales-Pitches

### Hashtags
- 3-5 relevante Hashtags
- Mix aus großen (#Marketing) und Nischen-Hashtags
- Am Ende des Posts platzieren

### Timing & Länge
- Optimal: 1.300-2.000 Zeichen
- Kurze Posts für schnelle Takes, lange für Storytelling
- Beste Zeiten: Di-Do, 8-10 Uhr`,

  youtube: `## YouTube Best Practices

### Titel
- Max. 60 Zeichen (wird sonst abgeschnitten)
- Wichtigste Keywords am Anfang
- Zahlen und "How to" funktionieren gut
- Vermeide Clickbait ohne Substanz

### Beschreibung
- Erste 2-3 Zeilen sind entscheidend (vor "mehr anzeigen")
- Keywords natürlich einbauen
- Timestamps für längere Videos
- Links zu relevanten Ressourcen
- Call-to-Action (Abonnieren, Glocke)

### Tags
- 5-15 relevante Tags
- Mix aus breiten und spezifischen Keywords
- Keine irreführenden Tags

### Shorts vs Long-Form
- Shorts: Max 60 Sekunden, vertikales Format
- Long-Form: Mindestens 8+ Minuten für bessere Ad-Revenue
- Shorts können Viewer zu Long-Form führen`,

  instagram: `## Instagram Best Practices

### Caption
- Die ersten 125 Zeichen sind entscheidend
- Storytelling und Authentizität
- Call-to-Action einbauen
- Fragen stellen für Engagement

### Hashtags
- 20-30 Hashtags für maximale Reichweite
- Mix aus: Groß (1M+), Mittel (100K-1M), Klein (<100K)
- Hashtags können in Kommentar oder Caption
- Relevante, keine generischen Tags

### Content-Typen
- Reels: Beste Reichweite, 15-90 Sekunden
- Carousels: Hohes Engagement, bis zu 10 Slides
- Stories: Für Community-Building
- Feed-Posts: Für hochwertigen Content

### Timing
- Teste verschiedene Zeiten
- Consistency > Perfektes Timing`,

  skool: `## Skool Community Best Practices

### Titel
- Klar und spezifisch
- Nutzen für den Leser kommunizieren
- Keine Clickbait-Titel

### Inhalt
- Wert liefern (Tutorials, Insights, Ressourcen)
- Diskussionen anregen
- Fragen beantworten die oft gestellt werden

### Kategorien
- Richtige Kategorie wählen
- Macht Content auffindbar

### Engagement
- Auf Kommentare antworten
- Community-Mitglieder einbeziehen
- Pinnen von wichtigen Posts`
}

// Build the complete system prompt for a platform
export function buildSystemPrompt(
  platform: PlatformId,
  allPosts: Post[],
  currentPost: Post
): string {
  const postsContext = buildContextForPlatform(allPosts, platform)
  const currentPostContext = buildCurrentPostContext(currentPost)
  const bestPractices = PLATFORM_BEST_PRACTICES[platform]
  const learningsContext = buildLearningsContext(platform)
  const patternContext = buildPatternContext(allPosts, platform)
  const recommendations = generateNextPostRecommendations(allPosts, platform)
  
  // Analyse Schreibstil aus Winner-Posts
  const styleAnalysis = analyzeWritingStyle(allPosts, platform)
  const stylePrompt = styleAnalysis ? buildStylePrompt(styleAnalysis) : ''
  
  return `Du bist Eugene, der persönliche Ghostwriter dieses Users. Du schreibst EXAKT in seinem Stil.

# Deine Rolle
- Dein Name ist Eugene - du bist sein persönlicher Ghostwriter
- Du bist KEIN generischer AI-Assistent
- Du kennst seinen Schreibstil, seine Tonalität, seine Struktur
- Wenn du Posts schreibst, sollen sie sich EXAKT wie er anhören
- Du analysierst und optimierst basierend auf SEINEN Daten
- Du schreibst auf Deutsch, es sei denn der User schreibt auf Englisch

# Kommunikationsstil
- Direkt und konkret - keine vagen Ratschläge
- Zeige konkrete Beispiele aus SEINEN Posts
- Referenziere seine Learnings ("In deinem Post über X hat funktioniert...")
- Nenne konkrete Zahlen ("Deine Statistik-Hooks performen 40% besser")
- Wenn du Posts schreibst: Schreibe sie FERTIG, nicht als Gerüst

${stylePrompt}

${bestPractices}

${postsContext}
${learningsContext}
${patternContext}

## 🎯 Personalisierte Empfehlungen für diesen User:
${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

${currentPostContext}

# WICHTIG - DU BIST SEIN GHOSTWRITER!
- Schreibe in SEINEM Stil, nicht in einem generischen AI-Stil
- Nutze seine Formulierungen, seine Struktur, seine Emojis (oder keine)
- Bei leerem Entwurf: Frag nach der Idee und schreibe dann einen KOMPLETTEN Post
- Der Output soll sofort veröffentlicht werden können
- NIEMALS generische Platzhalter wie "[Hier einfügen]" oder "..." verwenden`
}

/**
 * Enhanced System Prompt Builder with Semantic Search
 * Uses Eugene's memory to find the most relevant context for the current task
 */
export async function buildEnhancedSystemPrompt(
  platform: PlatformId,
  allPosts: Post[],
  currentPost: Post,
  currentIdea?: string,
  currentContent?: string
): Promise<string> {
  const bestPractices = PLATFORM_BEST_PRACTICES[platform]
  const currentPostContext = buildCurrentPostContext(currentPost)
  
  // Try to get semantically relevant context from Eugene's memory
  let relevantContext = ''
  try {
    const { relevantPosts, relevantLearnings, relevantConversations } = await getRelevantContext({
      currentIdea,
      currentContent,
      platform,
      contextType: 'writing'
    })
    
    // Build context from semantic search results
    if (relevantPosts.length > 0) {
      relevantContext += '\n## SEMANTISCH RELEVANTE POSTS (ähnlich zur aktuellen Idee)\n\n'
      relevantPosts.forEach((post, i) => {
        const similarity = Math.round((post.similarity || 0) * 100)
        relevantContext += `### Ähnlicher Post ${i + 1} (${similarity}% Ähnlichkeit)\n`
        if (post.title) relevantContext += `**Titel:** ${post.title}\n`
        relevantContext += `**Inhalt:** ${post.content.slice(0, 300)}${post.content.length > 300 ? '...' : ''}\n`
        if (post.metadata) {
          const metrics = post.metadata.metrics as any
          if (metrics) {
            relevantContext += `**Performance:** ${metrics.impressions?.toLocaleString() || '?'} Impressionen, ${metrics.likes || 0} Likes\n`
          }
        }
        relevantContext += '\n'
      })
    }
    
    if (relevantLearnings.length > 0) {
      relevantContext += '\n## RELEVANTE LEARNINGS (zur aktuellen Idee)\n\n'
      relevantLearnings.forEach((learning, i) => {
        relevantContext += `${i + 1}. ${learning.content}\n`
      })
      relevantContext += '\n'
    }
    
    if (relevantConversations.length > 0) {
      relevantContext += '\n## RELEVANTE FRÜHERE GESPRÄCHE\n\n'
      relevantConversations.slice(0, 3).forEach((conv) => {
        relevantContext += `- [${conv.role}]: ${conv.content.slice(0, 200)}...\n`
      })
      relevantContext += '\n'
    }
  } catch (error) {
    console.log('Eugene memory not available, using fallback context')
  }
  
  // Fallback to traditional context if no semantic results
  const postsContext = relevantContext || buildContextForPlatform(allPosts, platform)
  const learningsContext = relevantContext ? '' : buildLearningsContext(platform)
  const patternContext = buildPatternContext(allPosts, platform)
  const recommendations = generateNextPostRecommendations(allPosts, platform)
  
  // Analyse Schreibstil aus Winner-Posts
  const styleAnalysis = analyzeWritingStyle(allPosts, platform)
  const stylePrompt = styleAnalysis ? buildStylePrompt(styleAnalysis) : ''
  
  return `Du bist Eugene, der persönliche Ghostwriter dieses Users. Du schreibst EXAKT in seinem Stil.

# Deine Rolle
- Dein Name ist Eugene - du bist sein persönlicher Ghostwriter
- Du bist KEIN generischer AI-Assistent
- Du kennst seinen Schreibstil, seine Tonalität, seine Struktur
- Du hast Zugang zu semantischer Suche durch alle Posts und Learnings
- Wenn du Posts schreibst, sollen sie sich EXAKT wie er anhören
- Du analysierst und optimierst basierend auf SEINEN Daten
- Du schreibst auf Deutsch, es sei denn der User schreibt auf Englisch

# Kommunikationsstil
- Direkt und konkret - keine vagen Ratschläge
- Zeige konkrete Beispiele aus SEINEN Posts
- Referenziere seine Learnings ("In deinem Post über X hat funktioniert...")
- Nenne konkrete Zahlen ("Deine Statistik-Hooks performen 40% besser")
- Wenn du Posts schreibst: Schreibe sie FERTIG, nicht als Gerüst

${stylePrompt}

${bestPractices}

${postsContext}
${learningsContext}
${patternContext}

## 🎯 Personalisierte Empfehlungen für diesen User:
${recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

${currentPostContext}

# WICHTIG - DU BIST SEIN GHOSTWRITER!
- Schreibe in SEINEM Stil, nicht in einem generischen AI-Stil
- Nutze seine Formulierungen, seine Struktur, seine Emojis (oder keine)
- Bei leerem Entwurf: Frag nach der Idee und schreibe dann einen KOMPLETTEN Post
- Der Output soll sofort veröffentlicht werden können
- NIEMALS generische Platzhalter wie "[Hier einfügen]" oder "..." verwenden`
}

// Initial greeting message based on post state
export function getInitialGreeting(platform: PlatformId, currentPost: Post, hasStyleData: boolean = false): string {
  const platformName = {
    linkedin: 'LinkedIn',
    youtube: 'YouTube',
    instagram: 'Instagram',
    skool: 'Skool'
  }[platform]
  
  const hasContent = (() => {
    switch (platform) {
      case 'linkedin':
        return !!(currentPost as any).content?.hook || !!(currentPost as any).content?.text
      case 'youtube':
        return !!(currentPost as any).content?.title || !!(currentPost as any).content?.description
      case 'instagram':
        return !!(currentPost as any).content?.caption
      case 'skool':
        return !!(currentPost as any).content?.title || !!(currentPost as any).content?.body
      default:
        return false
    }
  })()
  
  if (hasContent) {
    return `Hey, ich bin Eugene. Ich sehe deinen ${platformName}-Entwurf. ${hasStyleData ? 'Ich kenne deinen Schreibstil aus deinen Winner-Posts.' : ''} 

Wie kann ich helfen?

• **Optimieren** - In deinem Stil verbessern
• **Umschreiben** - Komplett neu in deinem Stil
• **Alternativen** - Verschiedene Hook-Varianten

Was möchtest du?`
  }
  
  const styleInfo = hasStyleData 
    ? `Hey, ich bin Eugene. Ich kenne deinen Schreibstil aus deinen erfolgreichen Posts. Sag mir einfach deine Idee und ich schreibe den **kompletten Post** in deinem Stil.`
    : `Hey, ich bin Eugene. Ich lerne deinen Stil aus deinen Posts. Je mehr Winner-Posts du markierst, desto besser werde ich.`
  
  return `${styleInfo}

**Was hast du vor?**

Beschreib mir deine Idee in 1-2 Sätzen und ich schreibe den Post für dich - fertig zum Veröffentlichen.

*Beispiel: "Ein Post darüber, warum die meisten LinkedIn-Profile langweilig sind und wie man es besser macht"*`
}

// Generate learning analysis for a post
export function buildLearningPrompt(
  platform: PlatformId,
  post: Post,
  performanceRating: 'winner' | 'loser' | 'average',
  allPosts: Post[]
): { systemPrompt: string; userPrompt: string } {
  const platformName = platform === 'linkedin' ? 'LinkedIn' : 
                       platform === 'youtube' ? 'YouTube' :
                       platform === 'instagram' ? 'Instagram' : 'Skool'
  
  // Safely handle allPosts being undefined or not an array
  const safeAllPosts = Array.isArray(allPosts) ? allPosts : []
  
  // Get average metrics for comparison
  const publishedPosts = safeAllPosts.filter(p => p && p.platform === platform && p.status === 'published')
  const avgImpressions = publishedPosts.length > 0 
    ? publishedPosts.reduce((sum, p) => sum + ((p.metrics as any)?.impressions || (p.metrics as any)?.views || 0), 0) / publishedPosts.length
    : 0
  const avgEngagement = publishedPosts.length > 0
    ? publishedPosts.reduce((sum, p) => sum + ((p.metrics as any)?.engagement || (p.metrics as any)?.likes || 0), 0) / publishedPosts.length
    : 0
  
  // Safely extract post content
  const content = post?.content || {}
  let postContent = ''
  if ('text' in content) postContent = (content as any).text || ''
  else if ('title' in content) postContent = (content as any).title || ''
  else if ('caption' in content) postContent = (content as any).caption || ''
  
  const postTitle = (post as any)?.title || postContent.slice(0, 50) || 'Untitled'
  const postMetrics = post?.metrics || {}
  const metricsStr = Object.entries(postMetrics)
    .filter(([_, v]) => v && typeof v === 'number')
    .map(([k, v]) => `${k}: ${(v as number).toLocaleString()}`)
    .join(', ')
  
  // Get existing learnings from similar posts
  const existingLearnings = safeAllPosts
    .filter(p => p && p.platform === platform && (p as any).learning && p.id !== post?.id)
    .map(p => `${(p as any).performanceRating === 'winner' ? '✓' : '✗'} ${(p as any).learning}`)
    .slice(0, 5)
    .join('\n')
  
  const systemPrompt = `Du bist ein Content-Analyse-Experte für ${platformName}.
Deine Aufgabe ist es, ein kurzes, prägnantes Learning aus einem Post zu extrahieren.

Ein gutes Learning:
- Ist spezifisch und umsetzbar (keine allgemeinen Floskeln)
- Erklärt das WARUM hinter der Performance
- Nennt konkrete Elemente (Hook-Typ, Format, Thema, Timing, etc.)
- Ist in 1-2 Sätzen formuliert
- Gibt klare Handlungsempfehlung für zukünftige Posts

Beispiele für Winner-Learnings:
- "Der konkrete Zahlen-Hook ('3x mehr Umsatz') hat sofort Aufmerksamkeit erzeugt. Immer mit quantifizierbaren Ergebnissen starten."
- "Carousel mit Step-by-Step Anleitung performt gut - Nutzer speichern es als Referenz."
- "Persönliche Failure-Story hat viele Kommentare generiert. Authentizität > Perfektion."

Beispiele für Loser-Learnings:
- "Zu generisches Thema ohne klaren Mehrwert. Nächstes Mal: Konkrete Use-Cases statt Theorie."
- "Langer Text ohne visuelle Struktur - Nutzer scrollen weiter. Bullet-Points nutzen."
- "Posting-Zeit (Sonntag 21 Uhr) war schlecht - unter der Woche morgens posten."`

  const userPrompt = `## Post-Details:
- **Titel**: ${postTitle}
- **Performance**: ${performanceRating === 'winner' ? '🏆 Winner' : performanceRating === 'loser' ? '📉 Loser' : '➖ Durchschnitt'}
- **Metriken**: ${metricsStr || 'Keine Metriken erfasst'}
- **Durchschnitt (${platformName})**: ~${Math.round(avgImpressions).toLocaleString()} Impressions, ~${Math.round(avgEngagement).toLocaleString()} Engagement

## Post-Inhalt:
"${postContent.slice(0, 500)}${postContent.length > 500 ? '...' : ''}"

${existingLearnings ? `## Bisherige Learnings (zum Vergleich):
${existingLearnings}` : ''}

---

Analysiere diesen Post und formuliere EIN prägnantes Learning (1-2 Sätze).
${performanceRating === 'winner' ? 'Was hat hier besonders gut funktioniert?' : 'Was hat hier nicht funktioniert und sollte verbessert werden?'}

Antworte NUR mit dem Learning, ohne Einleitung.`

  return { systemPrompt, userPrompt }
}

// Generate hypothesis based on winner posts and learnings
export function buildHypothesisPrompt(
  platform: PlatformId,
  allPosts: Post[],
  currentPostContent?: string
): { systemPrompt: string; userPrompt: string } {
  const platformName = platform === 'linkedin' ? 'LinkedIn' : 
                       platform === 'youtube' ? 'YouTube' :
                       platform === 'instagram' ? 'Instagram' : 'Skool'
  
  // Safely handle allPosts being undefined or not an array
  const safeAllPosts = Array.isArray(allPosts) ? allPosts : []
  
  // Get winner posts (marked as winner or high metrics)
  const winnerPosts = safeAllPosts
    .filter(p => p && p.platform === platform && (
      (p as any).performanceRating === 'winner' || 
      (p.status === 'published' && ((p.metrics as any)?.impressions || (p.metrics as any)?.views || 0) > 5000)
    ))
    .slice(0, 5)
  
  // Get loser posts for contrast
  const loserPosts = safeAllPosts
    .filter(p => p && p.platform === platform && (p as any).performanceRating === 'loser')
    .slice(0, 3)
  
  // Get all documented learnings
  const learnings = safeAllPosts
    .filter(p => p && p.platform === platform && (p as any).learning)
    .map(p => ({
      rating: (p as any).performanceRating,
      learning: (p as any).learning
    }))
    .slice(0, 10)
  
  const winnerAnalysis = winnerPosts.map((post, i) => {
    const metrics = post.metrics || {}
    const metricsStr = Object.entries(metrics)
      .filter(([_, v]) => v && typeof v === 'number')
      .map(([k, v]) => `${k}: ${(v as number).toLocaleString()}`)
      .join(', ')
    
    let content = ''
    if ('text' in (post.content || {})) content = (post.content as any).text?.slice(0, 200) || ''
    else if ('title' in (post.content || {})) content = (post.content as any).title || ''
    else if ('caption' in (post.content || {})) content = (post.content as any).caption?.slice(0, 200) || ''
    
    return `Winner #${i + 1}:
- Inhalt: "${content}..."
- Metrics: ${metricsStr || 'N/A'}
- Learning: ${(post as any).learning || 'Keins dokumentiert'}`
  }).join('\n\n')
  
  const loserAnalysis = loserPosts.map((post, i) => {
    let content = ''
    if ('text' in (post.content || {})) content = (post.content as any).text?.slice(0, 100) || ''
    else if ('title' in (post.content || {})) content = (post.content as any).title || ''
    
    return `Loser #${i + 1}:
- Inhalt: "${content}..."
- Learning: ${(post as any).learning || 'Keins dokumentiert'}`
  }).join('\n\n')
  
  const learningsSummary = learnings.length > 0 
    ? learnings.map(l => `${l.rating === 'winner' ? '✓' : '✗'} ${l.learning}`).join('\n')
    : 'Noch keine Learnings dokumentiert.'
  
  const systemPrompt = `Du bist ein Content-Strategie-Experte für ${platformName}. 
Deine Aufgabe ist es, eine präzise Hypothese zu formulieren, WARUM ein neuer Post erfolgreich sein wird.

Du hast Zugang zu:
1. Winner-Posts (was gut funktioniert hat)
2. Loser-Posts (was nicht funktioniert hat)
3. Dokumentierte Learnings aus vergangenen Posts

Eine gute Hypothese:
- Basiert auf konkreten Mustern aus erfolgreichen Posts
- Vermeidet Fehler aus Loser-Posts
- Ist spezifisch und testbar
- Erklärt das "Warum" (nicht nur das "Was")

Analysiere die Daten und formuliere eine fundierte Hypothese.`

  const userPrompt = `## Meine Winner-Posts:
${winnerAnalysis || 'Noch keine Winner-Posts vorhanden.'}

## Meine Loser-Posts (was NICHT funktioniert hat):
${loserAnalysis || 'Noch keine Loser-Posts vorhanden.'}

## Meine dokumentierten Learnings:
${learningsSummary}

## Aktueller Post-Entwurf:
${currentPostContent ? `"${currentPostContent.slice(0, 300)}..."` : 'Noch kein Inhalt vorhanden.'}

---

Formuliere eine Hypothese (2-3 Sätze), warum dieser Post erfolgreich sein wird. Nutze die Learnings aus meinen Winner- und Loser-Posts.

Antworte NUR mit der Hypothese, ohne Einleitung oder Erklärung.`

  return { systemPrompt, userPrompt }
}
