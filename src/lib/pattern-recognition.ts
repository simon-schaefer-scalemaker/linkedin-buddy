/**
 * Automatische Pattern-Erkennung für Content-Performance
 * Analysiert Posts und erkennt, welche Faktoren zu guter/schlechter Performance führen
 */

import type { 
  Post, 
  PlatformId, 
  HookType, 
  ContentTopic, 
  ContentFormat,
  PerformancePattern,
  LinkedInPost,
  YouTubePost,
  InstagramPost,
  SkoolPost
} from './types'
import { HOOK_TYPES, CONTENT_TOPICS, CONTENT_FORMATS } from './types'

// Performance-Berechnung pro Plattform
function calculatePerformanceScore(post: Post): number {
  if (!post.metrics) return 0
  
  switch (post.platform) {
    case 'linkedin': {
      const m = (post as LinkedInPost).metrics!
      // Gewichtete Formel: Kommentare > Shares > Likes
      return (m.impressions || 0) * 0.01 + (m.likes || 0) + (m.comments || 0) * 5 + (m.shares || 0) * 3
    }
    case 'youtube': {
      const m = (post as YouTubePost).metrics!
      return (m.views || 0) * 0.1 + (m.likes || 0) * 2 + (m.comments || 0) * 5
    }
    case 'instagram': {
      const m = (post as InstagramPost).metrics!
      return (m.reach || 0) * 0.01 + (m.likes || 0) + (m.comments || 0) * 3 + (m.saves || 0) * 5
    }
    case 'skool': {
      const m = (post as SkoolPost).metrics!
      return (m.views || 0) * 0.1 + (m.likes || 0) + (m.comments || 0) * 3
    }
    default:
      return 0
  }
}

// Durchschnittliche Performance berechnen
function calculateAveragePerformance(posts: Post[]): number {
  if (posts.length === 0) return 0
  const scores = posts.map(calculatePerformanceScore)
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

// Posting-Zeit aus Post extrahieren
function getPostingHour(post: Post): number | null {
  const dateStr = post.publishedAt || post.scheduledFor
  if (!dateStr) return null
  const date = new Date(dateStr)
  return date.getHours()
}

function getPostingDay(post: Post): number | null {
  const dateStr = post.publishedAt || post.scheduledFor
  if (!dateStr) return null
  const date = new Date(dateStr)
  return date.getDay() // 0 = Sonntag, 1 = Montag, ...
}

// Pattern-Analyse Ergebnisse
export interface PatternAnalysis {
  // Beste/schlechteste Hook-Typen
  hookTypePerformance: Array<{
    hookType: HookType
    avgPerformance: number
    multiplier: number
    postCount: number
  }>
  
  // Beste/schlechteste Topics
  topicPerformance: Array<{
    topic: ContentTopic
    avgPerformance: number
    multiplier: number
    postCount: number
  }>
  
  // Beste/schlechteste Formate
  formatPerformance: Array<{
    format: ContentFormat
    avgPerformance: number
    multiplier: number
    postCount: number
  }>
  
  // Beste Posting-Zeiten
  bestPostingHours: Array<{
    hour: number
    avgPerformance: number
    multiplier: number
    postCount: number
  }>
  
  // Beste Posting-Tage
  bestPostingDays: Array<{
    day: number
    dayName: string
    avgPerformance: number
    multiplier: number
    postCount: number
  }>
  
  // Erkannte Patterns
  patterns: PerformancePattern[]
  
  // Zusammenfassung
  summary: {
    totalPostsAnalyzed: number
    avgPerformance: number
    topRecommendation: string
    avoidRecommendation: string
  }
}

const DAY_NAMES = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

/**
 * Hauptfunktion: Analysiere alle Posts und erkenne Patterns
 */
export function analyzePatterns(posts: Post[], platform?: PlatformId): PatternAnalysis {
  // Filter nach Plattform wenn angegeben
  let analyzedPosts = posts.filter(p => p.status === 'published' && p.metrics)
  if (platform) {
    analyzedPosts = analyzedPosts.filter(p => p.platform === platform)
  }
  
  const avgPerformance = calculateAveragePerformance(analyzedPosts)
  
  // Hook-Type Performance
  const hookTypeGroups = new Map<HookType, Post[]>()
  analyzedPosts.forEach(post => {
    if (post.hookType) {
      const existing = hookTypeGroups.get(post.hookType) || []
      hookTypeGroups.set(post.hookType, [...existing, post])
    }
  })
  
  const hookTypePerformance = Array.from(hookTypeGroups.entries())
    .map(([hookType, groupPosts]) => {
      const groupAvg = calculateAveragePerformance(groupPosts)
      return {
        hookType,
        avgPerformance: groupAvg,
        multiplier: avgPerformance > 0 ? groupAvg / avgPerformance : 1,
        postCount: groupPosts.length
      }
    })
    .filter(h => h.postCount >= 2) // Mindestens 2 Posts für Relevanz
    .sort((a, b) => b.multiplier - a.multiplier)
  
  // Topic Performance
  const topicGroups = new Map<ContentTopic, Post[]>()
  analyzedPosts.forEach(post => {
    if (post.topic) {
      const existing = topicGroups.get(post.topic) || []
      topicGroups.set(post.topic, [...existing, post])
    }
  })
  
  const topicPerformance = Array.from(topicGroups.entries())
    .map(([topic, groupPosts]) => {
      const groupAvg = calculateAveragePerformance(groupPosts)
      return {
        topic,
        avgPerformance: groupAvg,
        multiplier: avgPerformance > 0 ? groupAvg / avgPerformance : 1,
        postCount: groupPosts.length
      }
    })
    .filter(t => t.postCount >= 2)
    .sort((a, b) => b.multiplier - a.multiplier)
  
  // Format Performance
  const formatGroups = new Map<ContentFormat, Post[]>()
  analyzedPosts.forEach(post => {
    if (post.format) {
      const existing = formatGroups.get(post.format) || []
      formatGroups.set(post.format, [...existing, post])
    }
  })
  
  const formatPerformance = Array.from(formatGroups.entries())
    .map(([format, groupPosts]) => {
      const groupAvg = calculateAveragePerformance(groupPosts)
      return {
        format,
        avgPerformance: groupAvg,
        multiplier: avgPerformance > 0 ? groupAvg / avgPerformance : 1,
        postCount: groupPosts.length
      }
    })
    .filter(f => f.postCount >= 2)
    .sort((a, b) => b.multiplier - a.multiplier)
  
  // Posting Hour Performance
  const hourGroups = new Map<number, Post[]>()
  analyzedPosts.forEach(post => {
    const hour = getPostingHour(post)
    if (hour !== null) {
      const existing = hourGroups.get(hour) || []
      hourGroups.set(hour, [...existing, post])
    }
  })
  
  const bestPostingHours = Array.from(hourGroups.entries())
    .map(([hour, groupPosts]) => {
      const groupAvg = calculateAveragePerformance(groupPosts)
      return {
        hour,
        avgPerformance: groupAvg,
        multiplier: avgPerformance > 0 ? groupAvg / avgPerformance : 1,
        postCount: groupPosts.length
      }
    })
    .filter(h => h.postCount >= 2)
    .sort((a, b) => b.multiplier - a.multiplier)
  
  // Posting Day Performance
  const dayGroups = new Map<number, Post[]>()
  analyzedPosts.forEach(post => {
    const day = getPostingDay(post)
    if (day !== null) {
      const existing = dayGroups.get(day) || []
      dayGroups.set(day, [...existing, post])
    }
  })
  
  const bestPostingDays = Array.from(dayGroups.entries())
    .map(([day, groupPosts]) => {
      const groupAvg = calculateAveragePerformance(groupPosts)
      return {
        day,
        dayName: DAY_NAMES[day],
        avgPerformance: groupAvg,
        multiplier: avgPerformance > 0 ? groupAvg / avgPerformance : 1,
        postCount: groupPosts.length
      }
    })
    .filter(d => d.postCount >= 2)
    .sort((a, b) => b.multiplier - a.multiplier)
  
  // Generate Patterns
  const patterns: PerformancePattern[] = []
  
  // Best Hook Type Pattern
  if (hookTypePerformance.length > 0 && hookTypePerformance[0].multiplier > 1.2) {
    const best = hookTypePerformance[0]
    patterns.push({
      id: `pattern-hook-${best.hookType}`,
      platform: platform || 'linkedin',
      patternType: 'hook',
      description: `${HOOK_TYPES[best.hookType].name}-Hooks (${HOOK_TYPES[best.hookType].emoji}) performen überdurchschnittlich`,
      confidence: best.postCount >= 5 ? 'high' : best.postCount >= 3 ? 'medium' : 'low',
      basedOnPosts: [],
      avgPerformanceMultiplier: best.multiplier,
      createdAt: new Date().toISOString()
    })
  }
  
  // Worst Hook Type Pattern
  if (hookTypePerformance.length > 0) {
    const worst = hookTypePerformance[hookTypePerformance.length - 1]
    if (worst.multiplier < 0.8) {
      patterns.push({
        id: `pattern-hook-avoid-${worst.hookType}`,
        platform: platform || 'linkedin',
        patternType: 'hook',
        description: `${HOOK_TYPES[worst.hookType].name}-Hooks performen unterdurchschnittlich - vermeiden`,
        confidence: worst.postCount >= 5 ? 'high' : worst.postCount >= 3 ? 'medium' : 'low',
        basedOnPosts: [],
        avgPerformanceMultiplier: worst.multiplier,
        createdAt: new Date().toISOString()
      })
    }
  }
  
  // Best Topic Pattern
  if (topicPerformance.length > 0 && topicPerformance[0].multiplier > 1.2) {
    const best = topicPerformance[0]
    patterns.push({
      id: `pattern-topic-${best.topic}`,
      platform: platform || 'linkedin',
      patternType: 'topic',
      description: `Posts über "${CONTENT_TOPICS[best.topic].name}" (${CONTENT_TOPICS[best.topic].emoji}) performen überdurchschnittlich`,
      confidence: best.postCount >= 5 ? 'high' : best.postCount >= 3 ? 'medium' : 'low',
      basedOnPosts: [],
      avgPerformanceMultiplier: best.multiplier,
      createdAt: new Date().toISOString()
    })
  }
  
  // Best Format Pattern
  if (formatPerformance.length > 0 && formatPerformance[0].multiplier > 1.2) {
    const best = formatPerformance[0]
    patterns.push({
      id: `pattern-format-${best.format}`,
      platform: platform || 'linkedin',
      patternType: 'format',
      description: `${CONTENT_FORMATS[best.format].name} (${CONTENT_FORMATS[best.format].emoji}) performt überdurchschnittlich`,
      confidence: best.postCount >= 5 ? 'high' : best.postCount >= 3 ? 'medium' : 'low',
      basedOnPosts: [],
      avgPerformanceMultiplier: best.multiplier,
      createdAt: new Date().toISOString()
    })
  }
  
  // Best Timing Pattern
  if (bestPostingDays.length > 0 && bestPostingDays[0].multiplier > 1.15) {
    const best = bestPostingDays[0]
    const bestHour = bestPostingHours.length > 0 ? bestPostingHours[0] : null
    patterns.push({
      id: `pattern-timing-day`,
      platform: platform || 'linkedin',
      patternType: 'timing',
      description: bestHour 
        ? `Beste Posting-Zeit: ${best.dayName} um ${bestHour.hour}:00 Uhr`
        : `Beste Posting-Tag: ${best.dayName}`,
      confidence: best.postCount >= 5 ? 'high' : best.postCount >= 3 ? 'medium' : 'low',
      basedOnPosts: [],
      avgPerformanceMultiplier: best.multiplier,
      createdAt: new Date().toISOString()
    })
  }
  
  // Generate recommendations
  let topRecommendation = 'Noch nicht genug Daten für Empfehlungen. Füge Hook-Typ, Topic und Format zu deinen Posts hinzu.'
  let avoidRecommendation = ''
  
  if (patterns.length > 0) {
    const bestPattern = patterns.filter(p => p.avgPerformanceMultiplier > 1).sort((a, b) => b.avgPerformanceMultiplier - a.avgPerformanceMultiplier)[0]
    const worstPattern = patterns.filter(p => p.avgPerformanceMultiplier < 1).sort((a, b) => a.avgPerformanceMultiplier - b.avgPerformanceMultiplier)[0]
    
    if (bestPattern) {
      topRecommendation = bestPattern.description
    }
    if (worstPattern) {
      avoidRecommendation = worstPattern.description
    }
  }
  
  return {
    hookTypePerformance,
    topicPerformance,
    formatPerformance,
    bestPostingHours,
    bestPostingDays,
    patterns,
    summary: {
      totalPostsAnalyzed: analyzedPosts.length,
      avgPerformance,
      topRecommendation,
      avoidRecommendation
    }
  }
}

/**
 * Generiere AI-Kontext aus der Pattern-Analyse
 */
export function buildPatternContext(posts: Post[], platform: PlatformId): string {
  const analysis = analyzePatterns(posts, platform)
  
  if (analysis.summary.totalPostsAnalyzed < 3) {
    return '' // Nicht genug Daten
  }
  
  let context = `\n## Automatisch erkannte Performance-Patterns\n\n`
  context += `Basierend auf ${analysis.summary.totalPostsAnalyzed} analysierten Posts:\n\n`
  
  // Top Patterns
  if (analysis.patterns.length > 0) {
    context += `### Erkannte Muster:\n`
    analysis.patterns
      .filter(p => p.confidence !== 'low')
      .slice(0, 5)
      .forEach(p => {
        const perf = p.avgPerformanceMultiplier > 1 
          ? `+${Math.round((p.avgPerformanceMultiplier - 1) * 100)}%`
          : `${Math.round((p.avgPerformanceMultiplier - 1) * 100)}%`
        const confidence = p.confidence === 'high' ? '⭐⭐⭐' : p.confidence === 'medium' ? '⭐⭐' : '⭐'
        context += `- ${p.description} (${perf}) ${confidence}\n`
      })
    context += '\n'
  }
  
  // Best Hook Types
  if (analysis.hookTypePerformance.length > 0) {
    const top3 = analysis.hookTypePerformance.slice(0, 3)
    context += `### Hook-Typen (beste zuerst):\n`
    top3.forEach((h, i) => {
      const perf = h.multiplier > 1 
        ? `+${Math.round((h.multiplier - 1) * 100)}%`
        : `${Math.round((h.multiplier - 1) * 100)}%`
      context += `${i + 1}. ${HOOK_TYPES[h.hookType].emoji} ${HOOK_TYPES[h.hookType].name} (${perf}, ${h.postCount} Posts)\n`
    })
    context += '\n'
  }
  
  // Best Topics
  if (analysis.topicPerformance.length > 0) {
    const top3 = analysis.topicPerformance.slice(0, 3)
    context += `### Topics (beste zuerst):\n`
    top3.forEach((t, i) => {
      const perf = t.multiplier > 1 
        ? `+${Math.round((t.multiplier - 1) * 100)}%`
        : `${Math.round((t.multiplier - 1) * 100)}%`
      context += `${i + 1}. ${CONTENT_TOPICS[t.topic].emoji} ${CONTENT_TOPICS[t.topic].name} (${perf}, ${t.postCount} Posts)\n`
    })
    context += '\n'
  }
  
  // Best Timing
  if (analysis.bestPostingDays.length > 0 || analysis.bestPostingHours.length > 0) {
    context += `### Beste Posting-Zeiten:\n`
    if (analysis.bestPostingDays.length > 0) {
      const best = analysis.bestPostingDays[0]
      context += `- Bester Tag: ${best.dayName}\n`
    }
    if (analysis.bestPostingHours.length > 0) {
      const best = analysis.bestPostingHours[0]
      context += `- Beste Uhrzeit: ${best.hour}:00 Uhr\n`
    }
    context += '\n'
  }
  
  // Recommendation
  if (analysis.summary.topRecommendation) {
    context += `### 🎯 Top-Empfehlung:\n${analysis.summary.topRecommendation}\n\n`
  }
  if (analysis.summary.avoidRecommendation) {
    context += `### ⚠️ Vermeiden:\n${analysis.summary.avoidRecommendation}\n\n`
  }
  
  return context
}

/**
 * Validiere Hypothese gegen tatsächliche Performance
 */
export function validateHypothesis(
  post: Post, 
  allPosts: Post[]
): { 
  isValid: boolean
  confidence: 'high' | 'medium' | 'low'
  reason: string
  suggestion?: string
} {
  if (!post.metrics || !post.hypothesis) {
    return { isValid: false, confidence: 'low', reason: 'Keine Metriken oder Hypothese vorhanden' }
  }
  
  const postScore = calculatePerformanceScore(post)
  const platformPosts = allPosts.filter(p => p.platform === post.platform && p.status === 'published' && p.metrics)
  const avgScore = calculateAveragePerformance(platformPosts)
  
  const performanceRatio = avgScore > 0 ? postScore / avgScore : 1
  
  // Analysiere ob die Hypothese spezifische Elemente enthält
  const hypothesis = post.hypothesis.toLowerCase()
  const mentionsHook = hypothesis.includes('hook') || hypothesis.includes('frage') || hypothesis.includes('statistik')
  const mentionsTopic = hypothesis.includes('thema') || hypothesis.includes('topic') || CONTENT_TOPICS[post.topic || 'other']?.name.toLowerCase()
  const mentionsFormat = hypothesis.includes('format') || hypothesis.includes('carousel') || hypothesis.includes('video')
  
  let reason = ''
  let suggestion = ''
  
  if (performanceRatio >= 1.3) {
    reason = `Post hat ${Math.round((performanceRatio - 1) * 100)}% besser performt als der Durchschnitt.`
    suggestion = 'Diese Strategie weiter verfolgen!'
    return { isValid: true, confidence: 'high', reason, suggestion }
  } else if (performanceRatio >= 0.9) {
    reason = `Post hat durchschnittlich performt (${Math.round(performanceRatio * 100)}% des Durchschnitts).`
    suggestion = 'Hypothese war teilweise korrekt - verfeinern.'
    return { isValid: true, confidence: 'medium', reason, suggestion }
  } else {
    reason = `Post hat ${Math.round((1 - performanceRatio) * 100)}% schlechter performt als der Durchschnitt.`
    suggestion = 'Hypothese überdenken - was war anders als erwartet?'
    return { isValid: false, confidence: 'high', reason, suggestion }
  }
}

/**
 * Generiere Empfehlungen für den nächsten Post
 */
export function generateNextPostRecommendations(
  posts: Post[], 
  platform: PlatformId
): string[] {
  const analysis = analyzePatterns(posts, platform)
  const recommendations: string[] = []
  
  // Hook-Typ Empfehlung
  if (analysis.hookTypePerformance.length > 0) {
    const best = analysis.hookTypePerformance[0]
    if (best.multiplier > 1.1) {
      recommendations.push(
        `Nutze einen ${HOOK_TYPES[best.hookType].emoji} ${HOOK_TYPES[best.hookType].name}-Hook - diese performen bei dir ${Math.round((best.multiplier - 1) * 100)}% besser`
      )
    }
  }
  
  // Topic Empfehlung
  if (analysis.topicPerformance.length > 0) {
    const best = analysis.topicPerformance[0]
    if (best.multiplier > 1.1) {
      recommendations.push(
        `Schreibe über ${CONTENT_TOPICS[best.topic].emoji} ${CONTENT_TOPICS[best.topic].name} - dieses Thema funktioniert bei dir gut`
      )
    }
  }
  
  // Format Empfehlung
  if (analysis.formatPerformance.length > 0) {
    const best = analysis.formatPerformance[0]
    if (best.multiplier > 1.1) {
      recommendations.push(
        `Verwende das Format ${CONTENT_FORMATS[best.format].emoji} ${CONTENT_FORMATS[best.format].name}`
      )
    }
  }
  
  // Timing Empfehlung
  if (analysis.bestPostingDays.length > 0) {
    const best = analysis.bestPostingDays[0]
    const bestHour = analysis.bestPostingHours.length > 0 ? analysis.bestPostingHours[0] : null
    if (best.multiplier > 1.1) {
      recommendations.push(
        bestHour
          ? `Poste am ${best.dayName} um ${bestHour.hour}:00 Uhr für beste Ergebnisse`
          : `Poste am ${best.dayName} für beste Ergebnisse`
      )
    }
  }
  
  // Vermeiden-Empfehlungen
  if (analysis.hookTypePerformance.length > 0) {
    const worst = analysis.hookTypePerformance[analysis.hookTypePerformance.length - 1]
    if (worst.multiplier < 0.8) {
      recommendations.push(
        `⚠️ Vermeide ${HOOK_TYPES[worst.hookType].name}-Hooks - diese performen ${Math.round((1 - worst.multiplier) * 100)}% schlechter`
      )
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push(
      'Noch nicht genug Daten. Füge Hook-Typ, Topic und Format zu deinen Posts hinzu um personalisierte Empfehlungen zu erhalten.'
    )
  }
  
  return recommendations
}
