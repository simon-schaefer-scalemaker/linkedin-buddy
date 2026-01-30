/**
 * AI Performance Report / Weekly Digest
 * Zeigt eine AI-generierte Analyse der Content-Performance
 */

import { useState, useEffect } from 'react'
import { 
  Sparkles, 
  TrendingDown, 
  Target,
  Lightbulb,
  Clock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { usePostsStore } from '@/lib/store'
import { useLearningsStore } from '@/stores/learningsStore'
import { analyzePatterns, generateNextPostRecommendations, type PatternAnalysis } from '@/lib/pattern-recognition'
import { HOOK_TYPES, CONTENT_TOPICS, type PlatformId } from '@/lib/types'
import { cn } from '@/lib/utils'
import { startOfWeek, endOfWeek, isWithinInterval, subWeeks } from 'date-fns'

interface AIPerformanceReportProps {
  platform?: PlatformId
  className?: string
}

export function AIPerformanceReport({ platform, className }: AIPerformanceReportProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [analysis, setAnalysis] = useState<PatternAnalysis | null>(null)
  
  const allPosts = usePostsStore((state) => state.posts)
  const { getSuccessRate, getTopInsights } = useLearningsStore()
  
  // Analyze on mount and when posts change
  useEffect(() => {
    const result = analyzePatterns(allPosts, platform)
    setAnalysis(result)
  }, [allPosts, platform])
  
  // Calculate this week's stats
  const thisWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const thisWeekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })
  const lastWeekStart = subWeeks(thisWeekStart, 1)
  const lastWeekEnd = subWeeks(thisWeekEnd, 1)
  
  const thisWeekPosts = allPosts.filter(p => {
    if (platform && p.platform !== platform) return false
    if (p.status !== 'published' || !p.publishedAt) return false
    return isWithinInterval(new Date(p.publishedAt), { start: thisWeekStart, end: thisWeekEnd })
  })
  
  const lastWeekPosts = allPosts.filter(p => {
    if (platform && p.platform !== platform) return false
    if (p.status !== 'published' || !p.publishedAt) return false
    return isWithinInterval(new Date(p.publishedAt), { start: lastWeekStart, end: lastWeekEnd })
  })
  
  const successRate = getSuccessRate(platform)
  const topInsights = getTopInsights(platform, 3)
  // recommendations intentionally unused - kept for future features
  void generateNextPostRecommendations(allPosts, platform || 'linkedin')
  
  if (!analysis || analysis.summary.totalPostsAnalyzed < 3) {
    return (
      <Card className={cn("overflow-hidden", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-500" />
            AI Performance Report
          </CardTitle>
          <CardDescription>
            Noch nicht genug Daten. Veröffentliche mindestens 3 Posts mit Metriken für personalisierte Insights.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }
  
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              AI Performance Report
            </CardTitle>
            <CardDescription className="mt-1">
              Basierend auf {analysis.summary.totalPostsAnalyzed} analysierten Posts
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Weniger' : 'Mehr'}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className={cn(
            "p-3 rounded-lg text-center",
            "bg-neutral-50 dark:bg-neutral-900"
          )}>
            <p className="text-2xl font-semibold text-neutral-900 dark:text-white">
              {thisWeekPosts.length}
            </p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
              Diese Woche
            </p>
          </div>
          <div className={cn(
            "p-3 rounded-lg text-center",
            thisWeekPosts.length > lastWeekPosts.length 
              ? "bg-green-50 dark:bg-green-500/10" 
              : thisWeekPosts.length < lastWeekPosts.length
                ? "bg-red-50 dark:bg-red-500/10"
                : "bg-neutral-50 dark:bg-neutral-900"
          )}>
            <p className={cn(
              "text-2xl font-semibold",
              thisWeekPosts.length > lastWeekPosts.length 
                ? "text-green-600 dark:text-green-400" 
                : thisWeekPosts.length < lastWeekPosts.length
                  ? "text-red-600 dark:text-red-400"
                  : "text-neutral-900 dark:text-white"
            )}>
              {thisWeekPosts.length > lastWeekPosts.length ? '+' : ''}
              {thisWeekPosts.length - lastWeekPosts.length}
            </p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
              vs. Vorwoche
            </p>
          </div>
          <div className={cn(
            "p-3 rounded-lg text-center",
            successRate.total > 0 && ((successRate.exceeded + successRate.met) / successRate.total) >= 0.7
              ? "bg-green-50 dark:bg-green-500/10"
              : "bg-neutral-50 dark:bg-neutral-900"
          )}>
            <p className={cn(
              "text-2xl font-semibold",
              successRate.total > 0 && ((successRate.exceeded + successRate.met) / successRate.total) >= 0.7
                ? "text-green-600 dark:text-green-400"
                : "text-neutral-900 dark:text-white"
            )}>
              {successRate.total > 0 
                ? `${Math.round(((successRate.exceeded + successRate.met) / successRate.total) * 100)}%`
                : '-'}
            </p>
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider">
              Erfolgsrate
            </p>
          </div>
        </div>
        
        {/* Top Recommendation */}
        {analysis.summary.topRecommendation && (
          <div className={cn(
            "p-3 rounded-lg",
            "bg-purple-50 border border-purple-200",
            "dark:bg-purple-500/10 dark:border-purple-500/30"
          )}>
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-purple-800 dark:text-purple-300">
                  Top-Empfehlung
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-400 mt-0.5">
                  {analysis.summary.topRecommendation}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Expanded Content */}
        {isExpanded && (
          <div className="space-y-4 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            {/* Best Performing Patterns */}
            {analysis.hookTypePerformance.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                  Hook-Typen (beste zuerst)
                </h4>
                <div className="space-y-1.5">
                  {analysis.hookTypePerformance.slice(0, 3).map((h, i) => (
                    <div 
                      key={h.hookType}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg",
                        i === 0 && h.multiplier > 1.1 
                          ? "bg-green-50 dark:bg-green-500/10" 
                          : "bg-neutral-50 dark:bg-neutral-900"
                      )}
                    >
                      <span className="text-sm flex items-center gap-2">
                        <span>{HOOK_TYPES[h.hookType].emoji}</span>
                        <span className="text-neutral-700 dark:text-neutral-300">
                          {HOOK_TYPES[h.hookType].name}
                        </span>
                      </span>
                      <span className={cn(
                        "text-xs font-medium",
                        h.multiplier > 1 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-red-600 dark:text-red-400"
                      )}>
                        {h.multiplier > 1 ? '+' : ''}{Math.round((h.multiplier - 1) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Best Topics */}
            {analysis.topicPerformance.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">
                  Themen (beste zuerst)
                </h4>
                <div className="space-y-1.5">
                  {analysis.topicPerformance.slice(0, 3).map((t, i) => (
                    <div 
                      key={t.topic}
                      className={cn(
                        "flex items-center justify-between p-2 rounded-lg",
                        i === 0 && t.multiplier > 1.1 
                          ? "bg-green-50 dark:bg-green-500/10" 
                          : "bg-neutral-50 dark:bg-neutral-900"
                      )}
                    >
                      <span className="text-sm flex items-center gap-2">
                        <span>{CONTENT_TOPICS[t.topic].emoji}</span>
                        <span className="text-neutral-700 dark:text-neutral-300">
                          {CONTENT_TOPICS[t.topic].name}
                        </span>
                      </span>
                      <span className={cn(
                        "text-xs font-medium",
                        t.multiplier > 1 
                          ? "text-green-600 dark:text-green-400" 
                          : "text-red-600 dark:text-red-400"
                      )}>
                        {t.multiplier > 1 ? '+' : ''}{Math.round((t.multiplier - 1) * 100)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Best Timing */}
            {(analysis.bestPostingDays.length > 0 || analysis.bestPostingHours.length > 0) && (
              <div>
                <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Beste Posting-Zeiten
                </h4>
                <div className="flex gap-2">
                  {analysis.bestPostingDays.length > 0 && (
                    <div className="flex-1 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                      <p className="text-[10px] text-neutral-500 uppercase">Bester Tag</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
                        {analysis.bestPostingDays[0].dayName}
                      </p>
                    </div>
                  )}
                  {analysis.bestPostingHours.length > 0 && (
                    <div className="flex-1 p-2 rounded-lg bg-neutral-50 dark:bg-neutral-900">
                      <p className="text-[10px] text-neutral-500 uppercase">Beste Uhrzeit</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-white">
                        {analysis.bestPostingHours[0].hour}:00 Uhr
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Recent Learnings */}
            {topInsights.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Lightbulb className="h-3 w-3" />
                  Letzte Erkenntnisse
                </h4>
                <div className="space-y-2">
                  {topInsights.map((insight) => (
                    <div 
                      key={insight.id}
                      className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30"
                    >
                      <p className="text-xs text-amber-800 dark:text-amber-300">
                        {insight.keyInsight}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Avoid Recommendation */}
            {analysis.summary.avoidRecommendation && (
              <div className={cn(
                "p-3 rounded-lg",
                "bg-red-50 border border-red-200",
                "dark:bg-red-500/10 dark:border-red-500/30"
              )}>
                <div className="flex items-start gap-2">
                  <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-red-800 dark:text-red-300">
                      Vermeiden
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-400 mt-0.5">
                      {analysis.summary.avoidRecommendation}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
