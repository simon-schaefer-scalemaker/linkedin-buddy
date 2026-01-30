import type { 
  Post, 
  LinkedInPost, 
  YouTubePost, 
  InstagramPost, 
  SkoolPost,
  PlatformId 
} from './types'

// Structure analysis for different post types
interface LinkedInStructure {
  hookLength: number
  hasQuestion: boolean
  hasCTA: boolean
  bulletPointCount: number
  hashtagCount: number
  totalLength: number
  hasEmojis: boolean
}

interface YouTubeStructure {
  titleLength: number
  descriptionLength: number
  tagCount: number
  hasCategory: boolean
  isShort: boolean
}

interface InstagramStructure {
  captionLength: number
  hashtagCount: number
  hasLocation: boolean
  type: string
}

interface SkoolStructure {
  titleLength: number
  bodyLength: number
  hasCategory: boolean
  isPinned: boolean
}

// Analyze LinkedIn post structure
function analyzeLinkedInPost(post: LinkedInPost): LinkedInStructure {
  const content = post.content
  const fullText = [content.hook, content.text, content.cta].filter(Boolean).join(' ')
  
  return {
    hookLength: content.hook?.length || 0,
    hasQuestion: /\?/.test(content.hook || '') || /\?/.test(content.text || ''),
    hasCTA: !!content.cta && content.cta.length > 0,
    bulletPointCount: content.bulletPoints?.length || 0,
    hashtagCount: content.hashtags?.length || 0,
    totalLength: fullText.length,
    hasEmojis: /[\u{1F300}-\u{1F9FF}]/u.test(fullText)
  }
}

// Analyze YouTube post structure
function analyzeYouTubePost(post: YouTubePost): YouTubeStructure {
  return {
    titleLength: post.content.title?.length || 0,
    descriptionLength: post.content.description?.length || 0,
    tagCount: post.content.tags?.length || 0,
    hasCategory: !!post.content.category,
    isShort: post.content.isShort
  }
}

// Analyze Instagram post structure
function analyzeInstagramPost(post: InstagramPost): InstagramStructure {
  return {
    captionLength: post.content.caption?.length || 0,
    hashtagCount: post.content.hashtags?.length || 0,
    hasLocation: !!post.content.location,
    type: post.content.type
  }
}

// Analyze Skool post structure
function analyzeSkoolPost(post: SkoolPost): SkoolStructure {
  return {
    titleLength: post.content.title?.length || 0,
    bodyLength: post.content.body?.length || 0,
    hasCategory: !!post.content.category,
    isPinned: post.content.isPinned || false
  }
}

// Get engagement score for sorting
function getEngagementScore(post: Post): number {
  if (!post.metrics) return 0
  
  switch (post.platform) {
    case 'linkedin':
      const liMetrics = (post as LinkedInPost).metrics!
      return (liMetrics.likes || 0) + (liMetrics.comments || 0) * 3 + (liMetrics.shares || 0) * 5
    case 'youtube':
      const ytMetrics = (post as YouTubePost).metrics!
      return (ytMetrics.views || 0) / 100 + (ytMetrics.likes || 0) + (ytMetrics.comments || 0) * 3
    case 'instagram':
      const igMetrics = (post as InstagramPost).metrics!
      return (igMetrics.likes || 0) + (igMetrics.comments || 0) * 3 + (igMetrics.saves || 0) * 5
    case 'skool':
      const skMetrics = (post as SkoolPost).metrics!
      return (skMetrics.likes || 0) + (skMetrics.comments || 0) * 3
    default:
      return 0
  }
}

// Format LinkedIn post for context
function formatLinkedInPostForContext(post: LinkedInPost, rank: number): string {
  const structure = analyzeLinkedInPost(post)
  const metrics = post.metrics
  
  let output = `### Post ${rank}`
  if (metrics) {
    output += ` (${metrics.impressions?.toLocaleString() || '?'} Impressionen, ${metrics.likes || 0} Likes, ${metrics.comments || 0} Kommentare)`
  }
  output += '\n'
  
  if (post.content.hook) {
    output += `**Hook:** "${post.content.hook.slice(0, 150)}${post.content.hook.length > 150 ? '...' : ''}"\n`
  }
  if (post.content.text) {
    output += `**Haupttext:** "${post.content.text.slice(0, 200)}${post.content.text.length > 200 ? '...' : ''}"\n`
  }
  if (post.content.bulletPoints?.length) {
    output += `**Bullet Points:** ${post.content.bulletPoints.length} Punkte\n`
  }
  if (post.content.cta) {
    output += `**CTA:** "${post.content.cta}"\n`
  }
  
  output += `**Struktur:** ${structure.totalLength} Zeichen, ${structure.hashtagCount} Hashtags`
  if (structure.hasQuestion) output += ', enthält Frage'
  if (structure.hasEmojis) output += ', mit Emojis'
  
  return output
}

// Format YouTube post for context
function formatYouTubePostForContext(post: YouTubePost, rank: number): string {
  const metrics = post.metrics
  
  let output = `### Video ${rank}`
  if (metrics) {
    output += ` (${metrics.views?.toLocaleString() || '?'} Views, ${metrics.likes || 0} Likes)`
  }
  output += '\n'
  
  output += `**Titel:** "${post.content.title}"\n`
  output += `**Typ:** ${post.content.isShort ? 'Short' : 'Long-Form'}\n`
  if (post.content.description) {
    output += `**Beschreibung:** "${post.content.description.slice(0, 150)}..."\n`
  }
  if (post.content.tags?.length) {
    output += `**Tags:** ${post.content.tags.slice(0, 5).join(', ')}${post.content.tags.length > 5 ? '...' : ''}\n`
  }
  
  return output
}

// Format Instagram post for context
function formatInstagramPostForContext(post: InstagramPost, rank: number): string {
  const metrics = post.metrics
  
  let output = `### Post ${rank}`
  if (metrics) {
    output += ` (${metrics.reach?.toLocaleString() || '?'} Reach, ${metrics.likes || 0} Likes, ${metrics.saves || 0} Saves)`
  }
  output += '\n'
  
  output += `**Typ:** ${post.content.type}\n`
  output += `**Caption:** "${post.content.caption?.slice(0, 200)}${(post.content.caption?.length || 0) > 200 ? '...' : ''}"\n`
  output += `**Hashtags:** ${post.content.hashtags?.length || 0}\n`
  
  return output
}

// Format Skool post for context
function formatSkoolPostForContext(post: SkoolPost, rank: number): string {
  const metrics = post.metrics
  
  let output = `### Post ${rank}`
  if (metrics) {
    output += ` (${metrics.views?.toLocaleString() || '?'} Views, ${metrics.comments || 0} Kommentare)`
  }
  output += '\n'
  
  output += `**Titel:** "${post.content.title}"\n`
  if (post.content.category) {
    output += `**Kategorie:** ${post.content.category}\n`
  }
  output += `**Inhalt:** "${post.content.body?.slice(0, 200)}${(post.content.body?.length || 0) > 200 ? '...' : ''}"\n`
  
  return output
}

// Calculate engagement rate for a post
function calculateEngagementRate(post: Post): number | null {
  if (!post.metrics) return null
  
  switch (post.platform) {
    case 'linkedin': {
      const m = (post as LinkedInPost).metrics!
      if (!m.impressions || m.impressions === 0) return null
      const engagements = (m.likes || 0) + (m.comments || 0) + (m.shares || 0)
      return (engagements / m.impressions) * 100
    }
    case 'youtube': {
      const m = (post as YouTubePost).metrics!
      if (!m.views || m.views === 0) return null
      const engagements = (m.likes || 0) + (m.comments || 0)
      return (engagements / m.views) * 100
    }
    case 'instagram': {
      const m = (post as InstagramPost).metrics!
      const reach = m.reach || m.impressions || 0
      if (reach === 0) return null
      const engagements = (m.likes || 0) + (m.comments || 0) + (m.saves || 0)
      return (engagements / reach) * 100
    }
    case 'skool': {
      const m = (post as SkoolPost).metrics!
      if (!m.views || m.views === 0) return null
      const engagements = (m.likes || 0) + (m.comments || 0)
      return (engagements / m.views) * 100
    }
    default:
      return null
  }
}

// Extract patterns from posts with detailed analysis
function extractPatterns(posts: Post[], platform: PlatformId): string[] {
  const patterns: string[] = []
  const postsWithMetrics = posts.filter(p => p.metrics)
  
  if (postsWithMetrics.length < 2) {
    return ['Noch nicht genügend Posts mit Metriken für Musteranalyse (min. 2 benötigt)']
  }
  
  // Sort by engagement
  const sortedPosts = [...postsWithMetrics].sort((a, b) => getEngagementScore(b) - getEngagementScore(a))
  const topCount = Math.max(1, Math.ceil(postsWithMetrics.length * 0.3))
  const topPosts = sortedPosts.slice(0, topCount)
  const bottomPosts = sortedPosts.slice(-topCount)
  
  // Calculate average metrics
  const avgEngagementRate = postsWithMetrics
    .map(p => calculateEngagementRate(p))
    .filter((r): r is number => r !== null)
  
  const overallAvgEngagement = avgEngagementRate.length > 0 
    ? avgEngagementRate.reduce((a, b) => a + b, 0) / avgEngagementRate.length 
    : 0
  
  if (overallAvgEngagement > 0) {
    patterns.push(`Durchschnittliche Engagement-Rate: ${overallAvgEngagement.toFixed(2)}%`)
  }
  
  if (platform === 'linkedin') {
    const topLinkedIn = topPosts as LinkedInPost[]
    const bottomLinkedIn = bottomPosts as LinkedInPost[]
    const allLinkedIn = postsWithMetrics as LinkedInPost[]
    
    // Hook analysis - questions
    const topHooksWithQuestions = topLinkedIn.filter(p => /\?/.test(p.content.hook || '')).length
    const bottomHooksWithQuestions = bottomLinkedIn.filter(p => /\?/.test(p.content.hook || '')).length
    
    if (topHooksWithQuestions > bottomHooksWithQuestions) {
      const topRate = (topHooksWithQuestions / topLinkedIn.length * 100).toFixed(0)
      patterns.push(`Hooks mit Fragen: ${topRate}% der Top-Posts vs. weniger bei schlechteren Posts`)
    }
    
    // Hook analysis - numbers
    const topHooksWithNumbers = topLinkedIn.filter(p => /\d+/.test(p.content.hook || '')).length
    if (topHooksWithNumbers / topLinkedIn.length > 0.4) {
      patterns.push('Zahlen im Hook erhöhen die Aufmerksamkeit')
    }
    
    // Bullet points
    const avgTopBullets = topLinkedIn.reduce((sum, p) => sum + (p.content.bulletPoints?.length || 0), 0) / topLinkedIn.length
    const avgAllBullets = allLinkedIn.reduce((sum, p) => sum + (p.content.bulletPoints?.length || 0), 0) / allLinkedIn.length
    
    if (avgTopBullets > avgAllBullets + 0.5) {
      patterns.push(`Top-Posts haben Ø ${avgTopBullets.toFixed(1)} Bullet Points (Gesamt: ${avgAllBullets.toFixed(1)})`)
    }
    
    // CTAs
    const topWithCTA = topLinkedIn.filter(p => p.content.cta && p.content.cta.length > 5).length
    const bottomWithCTA = bottomLinkedIn.filter(p => p.content.cta && p.content.cta.length > 5).length
    
    if (topWithCTA > bottomWithCTA) {
      patterns.push('Posts mit CTA performen besser')
    }
    
    // Length analysis
    const avgTopLength = topLinkedIn.reduce((sum, p) => {
      const total = (p.content.hook?.length || 0) + (p.content.text?.length || 0)
      return sum + total
    }, 0) / topLinkedIn.length
    
    const avgAllLength = allLinkedIn.reduce((sum, p) => {
      const total = (p.content.hook?.length || 0) + (p.content.text?.length || 0)
      return sum + total
    }, 0) / allLinkedIn.length
    
    if (avgTopLength > avgAllLength * 1.2) {
      patterns.push(`Längere Posts (Ø ${Math.round(avgTopLength)} Zeichen) performen besser`)
    } else if (avgTopLength < avgAllLength * 0.8) {
      patterns.push(`Kürzere Posts (Ø ${Math.round(avgTopLength)} Zeichen) performen besser`)
    }
    
    // Hashtag analysis
    const avgTopHashtags = topLinkedIn.reduce((sum, p) => sum + (p.content.hashtags?.length || 0), 0) / topLinkedIn.length
    if (avgTopHashtags > 0) {
      patterns.push(`Optimale Hashtag-Anzahl: ${Math.round(avgTopHashtags)}`)
    }
    
    // Emoji analysis
    const topWithEmojis = topLinkedIn.filter(p => {
      const text = (p.content.hook || '') + (p.content.text || '')
      return /[\u{1F300}-\u{1F9FF}]/u.test(text)
    }).length
    
    if (topWithEmojis / topLinkedIn.length > 0.6) {
      patterns.push('Posts mit Emojis haben höheres Engagement')
    }
  }
  
  if (platform === 'youtube') {
    const topYT = topPosts as YouTubePost[]
    const allYT = postsWithMetrics as YouTubePost[]
    
    // Title length
    const avgTopTitleLength = topYT.reduce((sum, p) => sum + (p.content.title?.length || 0), 0) / topYT.length
    patterns.push(`Optimale Titellänge: ~${Math.round(avgTopTitleLength)} Zeichen`)
    
    // Shorts vs Long-form
    const topShorts = topYT.filter(p => p.content.isShort).length
    const allShorts = allYT.filter(p => p.content.isShort).length
    
    if (topShorts / topYT.length > allShorts / allYT.length + 0.1) {
      patterns.push('Shorts performen überdurchschnittlich')
    } else if (topShorts / topYT.length < allShorts / allYT.length - 0.1) {
      patterns.push('Long-Form Videos performen besser als Shorts')
    }
    
    // Title patterns
    const topWithNumbers = topYT.filter(p => /\d+/.test(p.content.title || '')).length
    if (topWithNumbers / topYT.length > 0.5) {
      patterns.push('Zahlen im Titel erhöhen Klicks')
    }
    
    const topWithHowTo = topYT.filter(p => /how to|wie|anleitung|tutorial/i.test(p.content.title || '')).length
    if (topWithHowTo / topYT.length > 0.3) {
      patterns.push('How-To/Tutorial Titel performen gut')
    }
  }
  
  if (platform === 'instagram') {
    const topIG = topPosts as InstagramPost[]
    const allIG = postsWithMetrics as InstagramPost[]
    
    // Content type analysis
    const typePerformance: Record<string, number[]> = {}
    allIG.forEach(p => {
      const rate = calculateEngagementRate(p)
      if (rate !== null) {
        if (!typePerformance[p.content.type]) typePerformance[p.content.type] = []
        typePerformance[p.content.type].push(rate)
      }
    })
    
    const typeAvgs = Object.entries(typePerformance).map(([type, rates]) => ({
      type,
      avg: rates.reduce((a, b) => a + b, 0) / rates.length,
      count: rates.length
    })).sort((a, b) => b.avg - a.avg)
    
    if (typeAvgs.length > 0) {
      const bestType = typeAvgs[0]
      patterns.push(`Bester Content-Typ: ${bestType.type} (${bestType.avg.toFixed(1)}% Engagement)`)
    }
    
    // Hashtag analysis
    const avgTopHashtags = topIG.reduce((sum, p) => sum + (p.content.hashtags?.length || 0), 0) / topIG.length
    patterns.push(`Optimale Hashtag-Anzahl: ~${Math.round(avgTopHashtags)}`)
    
    // Caption length
    const avgTopCaptionLength = topIG.reduce((sum, p) => sum + (p.content.caption?.length || 0), 0) / topIG.length
    if (avgTopCaptionLength > 500) {
      patterns.push('Längere Captions (Storytelling) performen besser')
    } else if (avgTopCaptionLength < 200) {
      patterns.push('Kurze, prägnante Captions funktionieren gut')
    }
  }
  
  if (platform === 'skool') {
    const topSK = topPosts as SkoolPost[]
    
    // Category analysis
    const categories = topSK.map(p => p.content.category).filter(Boolean)
    if (categories.length > 0) {
      const categoryCount: Record<string, number> = {}
      categories.forEach(c => {
        if (c) categoryCount[c] = (categoryCount[c] || 0) + 1
      })
      const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]
      if (topCategory) {
        patterns.push(`Beste Kategorie: ${topCategory[0]}`)
      }
    }
    
    // Title length
    const avgTitleLength = topSK.reduce((sum, p) => sum + (p.content.title?.length || 0), 0) / topSK.length
    patterns.push(`Optimale Titellänge: ~${Math.round(avgTitleLength)} Zeichen`)
  }
  
  if (patterns.length === 0) {
    patterns.push('Mehr Posts mit Metriken benötigt für detaillierte Analyse')
  }
  
  return patterns
}

// Main function to build context for a platform
export function buildContextForPlatform(
  posts: Post[],
  platform: PlatformId
): string {
  // Filter posts by platform and status (only published posts with potential data)
  const platformPosts = posts.filter(p => 
    p.platform === platform && 
    (p.status === 'published' || p.metrics)
  )
  
  if (platformPosts.length === 0) {
    return `Noch keine veröffentlichten Posts für diese Plattform vorhanden. Importiere historische Posts über den "Import" Button um AI-Learnings zu aktivieren.`
  }
  
  const postsWithMetrics = platformPosts.filter(p => p.metrics)
  
  // Sort by engagement/performance
  const sortedPosts = [...platformPosts].sort((a, b) => getEngagementScore(b) - getEngagementScore(a))
  const topPosts = sortedPosts.slice(0, 5) // Top 5 posts
  
  let context = `## Deine Top-Performing Posts (${platform})\n\n`
  
  if (postsWithMetrics.length === 0) {
    context += `⚠️ Keine Posts mit Performance-Metriken vorhanden. Trage Metriken bei veröffentlichten Posts ein für bessere Empfehlungen.\n\n`
  }
  
  topPosts.forEach((post, index) => {
    switch (platform) {
      case 'linkedin':
        context += formatLinkedInPostForContext(post as LinkedInPost, index + 1) + '\n\n'
        break
      case 'youtube':
        context += formatYouTubePostForContext(post as YouTubePost, index + 1) + '\n\n'
        break
      case 'instagram':
        context += formatInstagramPostForContext(post as InstagramPost, index + 1) + '\n\n'
        break
      case 'skool':
        context += formatSkoolPostForContext(post as SkoolPost, index + 1) + '\n\n'
        break
    }
  })
  
  // Add pattern analysis
  const patterns = extractPatterns(platformPosts, platform)
  context += `## Erkannte Muster & Learnings\n\n`
  patterns.forEach(pattern => {
    context += `- ${pattern}\n`
  })
  
  // Add detailed statistics
  context += `\n## Statistik\n`
  context += `- Gesamte Posts: ${platformPosts.length}\n`
  context += `- Mit Metriken: ${postsWithMetrics.length}\n`
  
  // Calculate aggregate metrics if available
  if (postsWithMetrics.length > 0) {
    const engagementRates = postsWithMetrics
      .map(p => calculateEngagementRate(p))
      .filter((r): r is number => r !== null)
    
    if (engagementRates.length > 0) {
      const avgRate = engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length
      const maxRate = Math.max(...engagementRates)
      const minRate = Math.min(...engagementRates)
      
      context += `- Durchschnittliche Engagement-Rate: ${avgRate.toFixed(2)}%\n`
      context += `- Beste Engagement-Rate: ${maxRate.toFixed(2)}%\n`
      context += `- Niedrigste Engagement-Rate: ${minRate.toFixed(2)}%\n`
    }
    
    // Platform-specific aggregate metrics
    if (platform === 'linkedin') {
      const liPosts = postsWithMetrics as LinkedInPost[]
      const totalImpressions = liPosts.reduce((sum, p) => sum + (p.metrics?.impressions || 0), 0)
      const avgImpressions = totalImpressions / liPosts.length
      context += `- Durchschnittliche Impressionen: ${Math.round(avgImpressions).toLocaleString()}\n`
    }
    
    if (platform === 'youtube') {
      const ytPosts = postsWithMetrics as YouTubePost[]
      const totalViews = ytPosts.reduce((sum, p) => sum + (p.metrics?.views || 0), 0)
      const avgViews = totalViews / ytPosts.length
      context += `- Durchschnittliche Views: ${Math.round(avgViews).toLocaleString()}\n`
    }
    
    if (platform === 'instagram') {
      const igPosts = postsWithMetrics as InstagramPost[]
      const totalReach = igPosts.reduce((sum, p) => sum + (p.metrics?.reach || 0), 0)
      const avgReach = totalReach / igPosts.length
      const totalSaves = igPosts.reduce((sum, p) => sum + (p.metrics?.saves || 0), 0)
      context += `- Durchschnittliche Reichweite: ${Math.round(avgReach).toLocaleString()}\n`
      context += `- Gesamte Saves: ${totalSaves.toLocaleString()}\n`
    }
  }
  
  return context
}

// Build context for the current post being edited
export function buildCurrentPostContext(post: Post): string {
  let context = `## Aktueller Post-Entwurf\n\n`
  
  switch (post.platform) {
    case 'linkedin': {
      const liPost = post as LinkedInPost
      if (liPost.content.hook) context += `**Hook:** "${liPost.content.hook}"\n`
      if (liPost.content.text) context += `**Haupttext:** "${liPost.content.text}"\n`
      if (liPost.content.bulletPoints?.length) {
        context += `**Bullet Points:**\n`
        liPost.content.bulletPoints.forEach(bp => context += `- ${bp}\n`)
      }
      if (liPost.content.cta) context += `**CTA:** "${liPost.content.cta}"\n`
      if (liPost.content.hashtags?.length) {
        context += `**Hashtags:** ${liPost.content.hashtags.map(h => `#${h}`).join(' ')}\n`
      }
      break
    }
    case 'youtube': {
      const ytPost = post as YouTubePost
      context += `**Typ:** ${ytPost.content.isShort ? 'Short' : 'Long-Form Video'}\n`
      if (ytPost.content.title) context += `**Titel:** "${ytPost.content.title}"\n`
      if (ytPost.content.description) context += `**Beschreibung:** "${ytPost.content.description}"\n`
      if (ytPost.content.tags?.length) {
        context += `**Tags:** ${ytPost.content.tags.join(', ')}\n`
      }
      break
    }
    case 'instagram': {
      const igPost = post as InstagramPost
      context += `**Typ:** ${igPost.content.type}\n`
      if (igPost.content.caption) context += `**Caption:** "${igPost.content.caption}"\n`
      if (igPost.content.hashtags?.length) {
        context += `**Hashtags:** ${igPost.content.hashtags.map(h => `#${h}`).join(' ')}\n`
      }
      break
    }
    case 'skool': {
      const skPost = post as SkoolPost
      if (skPost.content.title) context += `**Titel:** "${skPost.content.title}"\n`
      if (skPost.content.body) context += `**Inhalt:** "${skPost.content.body}"\n`
      if (skPost.content.category) context += `**Kategorie:** ${skPost.content.category}\n`
      break
    }
  }
  
  if (!context.includes('**')) {
    context += `(Noch leer - beginne mit dem Schreiben)\n`
  }
  
  return context
}
