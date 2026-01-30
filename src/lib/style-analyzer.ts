/**
 * Schreibstil-Analyse für AI-gestützte Post-Generierung
 * Extrahiert Tonalität, Struktur und Muster aus erfolgreichen Posts
 */

import type { Post, PlatformId, LinkedInPost, YouTubePost, InstagramPost, SkoolPost } from './types'

export interface StyleAnalysis {
  // Tonalität
  tone: {
    formal: number      // 0-10: 0 = sehr locker, 10 = sehr förmlich
    emotional: number   // 0-10: wie emotional/persönlich
    direct: number      // 0-10: wie direkt/konfrontativ
    description: string // Zusammenfassung der Tonalität
  }
  
  // Struktur
  structure: {
    avgParagraphs: number
    avgSentencesPerParagraph: number
    usesEmojis: boolean
    emojiDensity: 'none' | 'sparse' | 'moderate' | 'heavy'
    usesBulletPoints: boolean
    usesNumberedLists: boolean
    avgLineBreaks: number
    hookStyle: string[]     // Erkannte Hook-Muster
    ctaStyle: string[]      // Erkannte CTA-Muster
  }
  
  // Wörter und Phrasen
  vocabulary: {
    commonWords: string[]       // Häufig verwendete Wörter
    signaturePhrases: string[]  // Charakteristische Phrasen
    avoidedWords: string[]      // Selten verwendete Wörter (im Vergleich zu Durchschnitt)
    avgWordLength: number
    avgSentenceLength: number
  }
  
  // Formatierung
  formatting: {
    usesCapitalization: boolean
    usesSymbols: boolean
    commonSymbols: string[]
    lineSpacing: 'tight' | 'normal' | 'airy'
  }
  
  // Beispiel-Posts
  examplePosts: Array<{
    id: string
    preview: string
    metrics: string
    whyItWorked: string
  }>
}

/**
 * Extrahiere Text-Inhalt aus einem Post
 */
function getPostText(post: Post): string {
  const content = post.content as any
  if (content.text) return content.text
  if (content.hook) return `${content.hook}\n\n${content.text || ''}`
  if (content.caption) return content.caption
  if (content.title) return `${content.title}\n\n${content.description || content.body || ''}`
  return ''
}

/**
 * Zähle Emojis im Text
 */
function countEmojis(text: string): number {
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu
  return (text.match(emojiRegex) || []).length
}

/**
 * Analysiere Tonalität eines Textes
 */
function analyzeTone(texts: string[]): StyleAnalysis['tone'] {
  const allText = texts.join(' ').toLowerCase()
  
  // Indikatoren für formelle Sprache
  const formalIndicators = ['jedoch', 'daher', 'folglich', 'demzufolge', 'diesbezüglich', 'hierbei']
  const informalIndicators = ['hey', 'krass', 'mega', 'geil', 'nice', 'alter', 'ey', 'digga']
  
  // Indikatoren für emotionale Sprache
  const emotionalIndicators = ['ich', 'mein', 'mir', 'gefühl', 'ehrlich', 'persönlich', 'herz', 'liebe', 'hasse']
  
  // Indikatoren für direkte Sprache
  const directIndicators = ['du musst', 'hör auf', 'mach', 'stopp', 'vergiss', 'nie wieder', 'sofort']
  
  const formalScore = formalIndicators.filter(w => allText.includes(w)).length
  const informalScore = informalIndicators.filter(w => allText.includes(w)).length
  const formal = Math.min(10, Math.max(0, 5 + formalScore - informalScore))
  
  const emotionalCount = emotionalIndicators.filter(w => allText.includes(w)).length
  const emotional = Math.min(10, emotionalCount * 1.5)
  
  const directCount = directIndicators.filter(w => allText.includes(w)).length
  const direct = Math.min(10, directCount * 2)
  
  // Beschreibung generieren
  let description = ''
  if (formal >= 7) description += 'Professionell und sachlich. '
  else if (formal <= 3) description += 'Locker und umgangssprachlich. '
  else description += 'Balanced zwischen professionell und zugänglich. '
  
  if (emotional >= 6) description += 'Persönlich und emotional. '
  if (direct >= 6) description += 'Direkt und actionorientiert.'
  
  return { formal, emotional, direct, description: description.trim() }
}

/**
 * Analysiere Struktur von Posts
 */
function analyzeStructure(texts: string[]): StyleAnalysis['structure'] {
  const structures = texts.map(text => {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim())
    const sentences = text.split(/[.!?]+/).filter(s => s.trim())
    const lineBreaks = (text.match(/\n/g) || []).length
    const emojiCount = countEmojis(text)
    const hasBullets = /[•\-\*]\s/.test(text)
    const hasNumbers = /^\d+[.)\]]\s/m.test(text)
    
    return {
      paragraphs: paragraphs.length,
      sentences: sentences.length,
      sentencesPerParagraph: paragraphs.length > 0 ? sentences.length / paragraphs.length : 0,
      lineBreaks,
      emojiCount,
      textLength: text.length,
      hasBullets,
      hasNumbers
    }
  })
  
  const avgParagraphs = structures.reduce((sum, s) => sum + s.paragraphs, 0) / structures.length
  const avgSentencesPerParagraph = structures.reduce((sum, s) => sum + s.sentencesPerParagraph, 0) / structures.length
  const avgLineBreaks = structures.reduce((sum, s) => sum + s.lineBreaks, 0) / structures.length
  const totalEmojis = structures.reduce((sum, s) => sum + s.emojiCount, 0)
  const totalLength = structures.reduce((sum, s) => sum + s.textLength, 0)
  const emojiRatio = totalLength > 0 ? totalEmojis / (totalLength / 100) : 0
  
  // Emoji-Dichte bestimmen
  let emojiDensity: 'none' | 'sparse' | 'moderate' | 'heavy' = 'none'
  if (emojiRatio > 0) emojiDensity = 'sparse'
  if (emojiRatio > 1) emojiDensity = 'moderate'
  if (emojiRatio > 3) emojiDensity = 'heavy'
  
  // Hook-Styles erkennen
  const hookStyles: string[] = []
  const firstLines = texts.map(t => t.split('\n')[0])
  if (firstLines.some(l => l.includes('?'))) hookStyles.push('Fragen')
  if (firstLines.some(l => /\d/.test(l))) hookStyles.push('Zahlen/Statistiken')
  if (firstLines.some(l => l.toLowerCase().includes('ich'))) hookStyles.push('Persönliche Geschichten')
  if (firstLines.some(l => l.includes('!'))) hookStyles.push('Statements')
  
  // CTA-Styles erkennen
  const ctaStyles: string[] = []
  const lastLines = texts.map(t => {
    const lines = t.split('\n').filter(l => l.trim())
    return lines[lines.length - 1] || ''
  })
  if (lastLines.some(l => l.includes('?'))) ctaStyles.push('Frage als CTA')
  if (lastLines.some(l => /folg|like|teile|komment/i.test(l))) ctaStyles.push('Engagement-Aufforderung')
  if (lastLines.some(l => /link|bio|profil/i.test(l))) ctaStyles.push('Link-Verweis')
  
  return {
    avgParagraphs: Math.round(avgParagraphs * 10) / 10,
    avgSentencesPerParagraph: Math.round(avgSentencesPerParagraph * 10) / 10,
    usesEmojis: emojiDensity !== 'none',
    emojiDensity,
    usesBulletPoints: structures.some(s => s.hasBullets),
    usesNumberedLists: structures.some(s => s.hasNumbers),
    avgLineBreaks: Math.round(avgLineBreaks),
    hookStyle: hookStyles,
    ctaStyle: ctaStyles
  }
}

/**
 * Analysiere Vokabular und Phrasen
 */
function analyzeVocabulary(texts: string[]): StyleAnalysis['vocabulary'] {
  const allText = texts.join(' ')
  const words = allText.toLowerCase().match(/[a-zäöüß]+/gi) || []
  
  // Wort-Häufigkeiten
  const wordCounts = new Map<string, number>()
  words.forEach(word => {
    if (word.length > 3) { // Ignoriere kurze Wörter
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
    }
  })
  
  // Top-Wörter (ohne Stop-Words)
  const stopWords = ['dass', 'wird', 'werden', 'haben', 'sind', 'sein', 'kann', 'können', 'auch', 'nicht', 'wenn', 'aber', 'oder', 'und', 'eine', 'einen', 'einem', 'einer', 'für', 'mit', 'von', 'sich', 'als', 'nach', 'noch', 'mehr', 'schon', 'immer', 'diese', 'dieser', 'dieses', 'durch', 'über', 'dann', 'weil', 'hier', 'gibt', 'nur', 'doch', 'sehr', 'andere']
  const sortedWords = Array.from(wordCounts.entries())
    .filter(([word]) => !stopWords.includes(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word)
  
  // Charakteristische Phrasen (2-3 Wort-Kombinationen die mehrfach vorkommen)
  const phrases: string[] = []
  const phrasePattern = /[a-zäöüß]+\s[a-zäöüß]+(\s[a-zäöüß]+)?/gi
  const foundPhrases = allText.match(phrasePattern) || []
  const phraseCounts = new Map<string, number>()
  foundPhrases.forEach(phrase => {
    const normalized = phrase.toLowerCase().trim()
    if (normalized.length > 8) {
      phraseCounts.set(normalized, (phraseCounts.get(normalized) || 0) + 1)
    }
  })
  Array.from(phraseCounts.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([phrase]) => phrases.push(phrase))
  
  // Durchschnittliche Wort- und Satzlänge
  const avgWordLength = words.length > 0 
    ? words.reduce((sum, w) => sum + w.length, 0) / words.length 
    : 0
  const sentences = allText.split(/[.!?]+/).filter(s => s.trim())
  const avgSentenceLength = sentences.length > 0 
    ? words.length / sentences.length 
    : 0
  
  return {
    commonWords: sortedWords.slice(0, 10),
    signaturePhrases: phrases,
    avoidedWords: [], // Könnte später mit Vergleich zu Durchschnitt gefüllt werden
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10
  }
}

/**
 * Analysiere Formatierung
 */
function analyzeFormatting(texts: string[]): StyleAnalysis['formatting'] {
  const allText = texts.join('\n')
  
  // Großschreibung (ALL CAPS)
  const hasCapitalization = /[A-ZÄÖÜ]{3,}/.test(allText)
  
  // Symbole
  const symbolPattern = /[→►▶︎✓✗★☆●○◆◇■□▪︎▫︎⚡️🔥💡🚀📈📉🎯💪🙌👇👆➡️✨]/g
  const symbols = allText.match(symbolPattern) || []
  const uniqueSymbols = [...new Set(symbols)]
  
  // Line-Spacing analysieren
  const avgLineBreaksPerParagraph = texts.reduce((sum, text) => {
    const paragraphs = text.split(/\n\n+/).length
    const lineBreaks = (text.match(/\n/g) || []).length
    return sum + (paragraphs > 0 ? lineBreaks / paragraphs : 0)
  }, 0) / texts.length
  
  let lineSpacing: 'tight' | 'normal' | 'airy' = 'normal'
  if (avgLineBreaksPerParagraph < 2) lineSpacing = 'tight'
  if (avgLineBreaksPerParagraph > 4) lineSpacing = 'airy'
  
  return {
    usesCapitalization: hasCapitalization,
    usesSymbols: uniqueSymbols.length > 0,
    commonSymbols: uniqueSymbols.slice(0, 10),
    lineSpacing
  }
}

/**
 * Hauptfunktion: Analysiere den Schreibstil aus Posts
 */
export function analyzeWritingStyle(posts: Post[], platform: PlatformId): StyleAnalysis | null {
  // Filtere nach Plattform und veröffentlichten Posts mit guter Performance
  const winnerPosts = posts.filter(p => 
    p.platform === platform && 
    p.status === 'published' &&
    ((p as any).performanceRating === 'winner' || 
     (p.metrics && (p.metrics.impressions || p.metrics.views || 0) > 3000))
  ).slice(0, 10)
  
  if (winnerPosts.length < 2) {
    return null // Nicht genug Daten
  }
  
  const texts = winnerPosts.map(getPostText).filter(t => t.length > 50)
  
  if (texts.length < 2) {
    return null
  }
  
  // Beispiel-Posts erstellen
  const examplePosts = winnerPosts.slice(0, 3).map(post => {
    const text = getPostText(post)
    const metrics = post.metrics || {}
    const metricsStr = Object.entries(metrics)
      .filter(([_, v]) => v && typeof v === 'number')
      .map(([k, v]) => `${k}: ${(v as number).toLocaleString()}`)
      .join(', ')
    
    return {
      id: post.id,
      preview: text.slice(0, 200) + (text.length > 200 ? '...' : ''),
      metrics: metricsStr || 'Keine Metriken',
      whyItWorked: (post as any).learning || 'Kein Learning dokumentiert'
    }
  })
  
  return {
    tone: analyzeTone(texts),
    structure: analyzeStructure(texts),
    vocabulary: analyzeVocabulary(texts),
    formatting: analyzeFormatting(texts),
    examplePosts
  }
}

/**
 * Generiere einen AI-Prompt mit Stil-Anweisungen
 */
export function buildStylePrompt(styleAnalysis: StyleAnalysis): string {
  if (!styleAnalysis) return ''
  
  const { tone, structure, vocabulary, formatting, examplePosts } = styleAnalysis
  
  let prompt = `\n## DEIN PERSÖNLICHER SCHREIBSTIL (IMMER NUTZEN!)

### Tonalität
${tone.description}
- Formalität: ${tone.formal}/10
- Emotionalität: ${tone.emotional}/10  
- Direktheit: ${tone.direct}/10

### Struktur
- Durchschnittlich ${structure.avgParagraphs} Absätze pro Post
- ~${structure.avgSentencesPerParagraph} Sätze pro Absatz
- Emojis: ${structure.emojiDensity === 'none' ? 'Keine' : structure.emojiDensity === 'sparse' ? 'Sparsam' : structure.emojiDensity === 'moderate' ? 'Moderat' : 'Häufig'}
- ${structure.usesBulletPoints ? 'Nutzt Bullet-Points (•)' : 'Keine Bullet-Points'}
- ${structure.usesNumberedLists ? 'Nutzt nummerierte Listen' : 'Keine nummerierten Listen'}
- Line-Spacing: ${formatting.lineSpacing === 'airy' ? 'Viel Weißraum' : formatting.lineSpacing === 'tight' ? 'Kompakt' : 'Normal'}

### Hook-Stil
${structure.hookStyle.length > 0 ? structure.hookStyle.map(s => `- ${s}`).join('\n') : '- Variiert'}

### CTA-Stil
${structure.ctaStyle.length > 0 ? structure.ctaStyle.map(s => `- ${s}`).join('\n') : '- Variiert'}

### Charakteristische Wörter & Phrasen
${vocabulary.commonWords.length > 0 ? `Häufig: ${vocabulary.commonWords.slice(0, 8).join(', ')}` : ''}
${vocabulary.signaturePhrases.length > 0 ? `Phrasen: "${vocabulary.signaturePhrases.slice(0, 5).join('", "')}"` : ''}

### Formatierung
${formatting.usesCapitalization ? '- Nutzt GROSSBUCHSTABEN für Betonung' : '- Keine Großbuchstaben für Betonung'}
${formatting.usesSymbols ? `- Nutzt Symbole: ${formatting.commonSymbols.join(' ')}` : '- Keine speziellen Symbole'}
`

  // Füge Beispiel-Posts hinzu
  if (examplePosts.length > 0) {
    prompt += `\n### DEINE TOP-POSTS (ALS REFERENZ):\n\n`
    examplePosts.forEach((post, i) => {
      prompt += `**Winner #${i + 1}** (${post.metrics})
\`\`\`
${post.preview}
\`\`\`
Learning: ${post.whyItWorked}

`
    })
  }
  
  prompt += `### WICHTIG
- Schreibe IMMER in diesem Stil - das ist deine "Stimme"
- Übernimm die Struktur deiner erfolgreichen Posts
- Nutze ähnliche Formulierungen und Phrasen
- Kopiere NICHT 1:1, aber behalte den Charakter bei
`
  
  return prompt
}

/**
 * Generiere einen kompletten Post basierend auf einer Idee
 */
export function buildPostGenerationPrompt(
  platform: PlatformId,
  styleAnalysis: StyleAnalysis | null,
  idea: string,
  hookType?: string,
  topic?: string
): { systemPrompt: string; userPrompt: string } {
  const platformName = {
    linkedin: 'LinkedIn',
    youtube: 'YouTube', 
    instagram: 'Instagram',
    skool: 'Skool'
  }[platform]
  
  let systemPrompt = `Du bist ein Ghostwriter für ${platformName}. Deine Aufgabe ist es, Posts zu schreiben, die sich EXAKT wie der User anhören.

Du hast Zugang zu:
1. Dem persönlichen Schreibstil des Users (aus erfolgreichen Posts)
2. Konkreten Beispielen seiner Winner-Posts
3. Dokumentierten Learnings

DEINE AUFGABE:
- Schreibe den Post komplett fertig (nicht nur ein Gerüst)
- Nutze EXAKT den Stil des Users
- Beachte die Struktur seiner erfolgreichen Posts
- Der Post soll sofort veröffentlicht werden können

`

  if (styleAnalysis) {
    systemPrompt += buildStylePrompt(styleAnalysis)
  }
  
  const userPrompt = `Schreibe einen ${platformName}-Post zu folgender Idee:

**Meine Idee:** ${idea}
${hookType ? `**Gewünschter Hook-Typ:** ${hookType}` : ''}
${topic ? `**Thema/Kategorie:** ${topic}` : ''}

---

Schreibe jetzt den kompletten Post in meinem Stil. Gib nur den Post aus, keine Erklärungen oder Kommentare.`

  return { systemPrompt, userPrompt }
}
