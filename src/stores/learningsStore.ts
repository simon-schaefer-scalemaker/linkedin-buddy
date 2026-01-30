import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PostLearning, PerformancePattern, PlatformId } from '@/lib/types'
import { storeLearningMemory } from '@/lib/eugene-memory'

interface LearningsState {
  learnings: PostLearning[]
  patterns: PerformancePattern[]
  
  // Actions
  addLearning: (learning: Omit<PostLearning, 'id' | 'createdAt'>) => string
  updateLearning: (id: string, updates: Partial<PostLearning>) => void
  deleteLearning: (id: string) => void
  getLearningForPost: (postId: string) => PostLearning | undefined
  getLearningsForPlatform: (platform: PlatformId) => PostLearning[]
  
  // Pattern Actions
  addPattern: (pattern: Omit<PerformancePattern, 'id' | 'createdAt'>) => void
  updatePattern: (id: string, updates: Partial<PerformancePattern>) => void
  deletePattern: (id: string) => void
  getPatternsForPlatform: (platform: PlatformId) => PerformancePattern[]
  
  // Analytics
  getTopInsights: (platform?: PlatformId, limit?: number) => PostLearning[]
  getSuccessRate: (platform?: PlatformId) => { exceeded: number; met: number; missed: number; total: number }
}

export const useLearningsStore = create<LearningsState>()(
  persist(
    (set, get) => ({
      learnings: [],
      patterns: [],
      
      addLearning: (learning) => {
        const id = `learning-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
        const newLearning: PostLearning = {
          ...learning,
          id,
          createdAt: new Date().toISOString()
        }
        set((state) => ({
          learnings: [...state.learnings, newLearning]
        }))
        
        // Store in Eugene's memory (async, don't block)
        if (newLearning.keyInsight) {
          storeLearningMemory({
            id: newLearning.id,
            postId: newLearning.postId,
            platform: newLearning.platform,
            keyInsight: newLearning.keyInsight,
            whatWorked: newLearning.whatWorked,
            whatDidntWork: newLearning.whatDidntWork,
            applyToFuture: newLearning.applyToFuture,
            outcome: newLearning.outcome
          }).catch(() => {}) // Silent fail
        }
        
        return id
      },
      
      updateLearning: (id, updates) => {
        set((state) => ({
          learnings: state.learnings.map((l) =>
            l.id === id ? { ...l, ...updates } : l
          )
        }))
      },
      
      deleteLearning: (id) => {
        set((state) => ({
          learnings: state.learnings.filter((l) => l.id !== id)
        }))
      },
      
      getLearningForPost: (postId) => {
        return get().learnings.find((l) => l.postId === postId)
      },
      
      getLearningsForPlatform: (platform) => {
        return get().learnings.filter((l) => l.platform === platform)
      },
      
      addPattern: (pattern) => {
        const newPattern: PerformancePattern = {
          ...pattern,
          id: `pattern-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          createdAt: new Date().toISOString()
        }
        set((state) => ({
          patterns: [...state.patterns, newPattern]
        }))
      },
      
      updatePattern: (id, updates) => {
        set((state) => ({
          patterns: state.patterns.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          )
        }))
      },
      
      deletePattern: (id) => {
        set((state) => ({
          patterns: state.patterns.filter((p) => p.id !== id)
        }))
      },
      
      getPatternsForPlatform: (platform) => {
        return get().patterns.filter((p) => p.platform === platform)
      },
      
      getTopInsights: (platform, limit = 10) => {
        let learnings = get().learnings
          .filter((l) => l.keyInsight) // Nur Learnings mit Insights
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        
        if (platform) {
          learnings = learnings.filter((l) => l.platform === platform)
        }
        
        return learnings.slice(0, limit)
      },
      
      getSuccessRate: (platform) => {
        let learnings = get().learnings.filter((l) => l.outcome)
        
        if (platform) {
          learnings = learnings.filter((l) => l.platform === platform)
        }
        
        return {
          exceeded: learnings.filter((l) => l.outcome === 'exceeded').length,
          met: learnings.filter((l) => l.outcome === 'met').length,
          missed: learnings.filter((l) => l.outcome === 'missed').length,
          total: learnings.length
        }
      }
    }),
    {
      name: 'learnings-storage',
      version: 1
    }
  )
)

// Helper function to build AI context from learnings
export function buildLearningsContext(platform: PlatformId): string {
  const store = useLearningsStore.getState()
  const learnings = store.getLearningsForPlatform(platform)
  const patterns = store.getPatternsForPlatform(platform)
  const successRate = store.getSuccessRate(platform)
  
  if (learnings.length === 0 && patterns.length === 0) {
    return ''
  }
  
  let context = `\n## Performance Learnings für ${platform.toUpperCase()}\n\n`
  
  // Success Rate
  if (successRate.total > 0) {
    const successPercent = Math.round(((successRate.exceeded + successRate.met) / successRate.total) * 100)
    context += `### Hypothesen-Erfolgsrate: ${successPercent}%\n`
    context += `- Übertroffen: ${successRate.exceeded}\n`
    context += `- Erreicht: ${successRate.met}\n`
    context += `- Verfehlt: ${successRate.missed}\n\n`
  }
  
  // Top Insights (letzte 5)
  const topInsights = learnings
    .filter((l) => l.keyInsight)
    .slice(0, 5)
  
  if (topInsights.length > 0) {
    context += `### Wichtigste Erkenntnisse:\n`
    topInsights.forEach((l, i) => {
      context += `${i + 1}. ${l.keyInsight}\n`
      if (l.applyToFuture) {
        context += `   → Anwenden: ${l.applyToFuture}\n`
      }
    })
    context += '\n'
  }
  
  // What Works / Doesn't Work
  const whatWorked = learnings
    .filter((l) => l.whatWorked && l.outcome === 'exceeded')
    .map((l) => l.whatWorked)
    .slice(0, 3)
  
  const whatDidntWork = learnings
    .filter((l) => l.whatDidntWork && l.outcome === 'missed')
    .map((l) => l.whatDidntWork)
    .slice(0, 3)
  
  if (whatWorked.length > 0) {
    context += `### Was gut funktioniert:\n`
    whatWorked.forEach((w) => context += `- ${w}\n`)
    context += '\n'
  }
  
  if (whatDidntWork.length > 0) {
    context += `### Was NICHT funktioniert:\n`
    whatDidntWork.forEach((w) => context += `- ${w}\n`)
    context += '\n'
  }
  
  // Erkannte Patterns
  if (patterns.length > 0) {
    context += `### Erkannte Muster:\n`
    patterns
      .filter((p) => p.confidence !== 'low')
      .forEach((p) => {
        const perf = p.avgPerformanceMultiplier > 1 
          ? `+${Math.round((p.avgPerformanceMultiplier - 1) * 100)}%` 
          : `${Math.round((p.avgPerformanceMultiplier - 1) * 100)}%`
        context += `- [${p.patternType}] ${p.description} (${perf} Performance)\n`
      })
    context += '\n'
  }
  
  return context
}
