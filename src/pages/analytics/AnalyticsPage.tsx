import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown,
  Eye, 
  Users, 
  Calendar,
  Linkedin, 
  Youtube, 
  Instagram, 
  GraduationCap,
  Plus,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Target,
  CheckCircle2,
  XCircle,
  Minus,
  Trophy
} from 'lucide-react'
import { PLATFORMS } from '@/lib/constants'
import { useMetricsStore } from '@/stores/metricsStore'
import { usePostsStore } from '@/lib/store'
import { WeeklyCheckInWizard } from '@/components/analytics/WeeklyCheckInWizard'
import { AIPerformanceReport } from '@/components/analytics/ai-performance-report'
import { formatNumber, getWeekNumber, formatWeek } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { PlatformId } from '@/lib/types'

const platformIcons = {
  linkedin: Linkedin,
  youtube: Youtube,
  instagram: Instagram,
  skool: GraduationCap
}

const PLATFORM_COLORS = {
  linkedin: '#0A66C2',
  youtube: '#FF0000',
  instagram: '#E4405F',
  skool: '#FACC15'
}

export function AnalyticsPage() {
  const [checkInOpen, setCheckInOpen] = useState(false)
  
  const linkedinMetrics = useMetricsStore((state) => state.linkedinMetrics)
  const youtubeMetrics = useMetricsStore((state) => state.youtubeMetrics)
  const instagramMetrics = useMetricsStore((state) => state.instagramMetrics)
  const skoolMetrics = useMetricsStore((state) => state.skoolMetrics)
  const hasMetricsForCurrentWeek = useMetricsStore((state) => state.hasMetricsForCurrentWeek)
  const getLatestMetrics = useMetricsStore((state) => state.getLatestMetrics)
  
  const latest = getLatestMetrics()
  const hasCurrentWeekData = hasMetricsForCurrentWeek()
  const now = new Date()
  const currentWeek = getWeekNumber(now)
  const currentYear = now.getFullYear()
  
  // Platform breakdown data for pie charts
  const audienceBreakdown = useMemo(() => {
    const data = [
      { name: 'LinkedIn', value: latest.linkedin?.followers || 0, platform: 'linkedin' as PlatformId },
      { name: 'YouTube', value: latest.youtube?.subscribers || 0, platform: 'youtube' as PlatformId },
      { name: 'Instagram', value: latest.instagram?.followers || 0, platform: 'instagram' as PlatformId },
      { name: 'Skool', value: latest.skool?.members || 0, platform: 'skool' as PlatformId },
    ].filter(d => d.value > 0)
    
    const total = data.reduce((sum, d) => sum + d.value, 0)
    return { data, total }
  }, [latest])
  
  const reachBreakdown = useMemo(() => {
    const data = [
      { name: 'LinkedIn', value: latest.linkedin?.impressions || 0, platform: 'linkedin' as PlatformId },
      { name: 'YouTube', value: latest.youtube?.views || 0, platform: 'youtube' as PlatformId },
      { name: 'Instagram', value: latest.instagram?.reach || 0, platform: 'instagram' as PlatformId },
      { name: 'Skool', value: latest.skool?.postViews || 0, platform: 'skool' as PlatformId },
    ].filter(d => d.value > 0)
    
    const total = data.reduce((sum, d) => sum + d.value, 0)
    return { data, total }
  }, [latest])
  
  // Calculate totals and growth
  const totals = useMemo(() => {
    const totalFollowers = audienceBreakdown.total
    const totalReach = reachBreakdown.total
    
    const totalGrowth = 
      (latest.linkedin?.followerGrowth || 0) + 
      (latest.youtube?.subscriberGrowth || 0) + 
      (latest.instagram?.followerGrowth || 0) + 
      (latest.skool?.memberGrowth || 0)
    
    const totalEngagement = 
      (latest.linkedin?.engagement || 0) + 
      (latest.instagram?.engagement || 0) + 
      (latest.skool?.comments || 0)
    
    return { totalFollowers, totalReach, totalGrowth, totalEngagement }
  }, [audienceBreakdown, reachBreakdown, latest])
  
  // Build stacked area chart data for trends
  const trendData = useMemo(() => {
    const weeks: Array<{
      week: string
      linkedin: number
      youtube: number
      instagram: number
      skool: number
    }> = []
    
    for (let i = 7; i >= 0; i--) {
      const weekNum = currentWeek - i
      const year = weekNum <= 0 ? currentYear - 1 : currentYear
      const adjustedWeek = weekNum <= 0 ? 52 + weekNum : weekNum
      
      const li = linkedinMetrics.find(m => m.year === year && m.weekNumber === adjustedWeek)
      const yt = youtubeMetrics.find(m => m.year === year && m.weekNumber === adjustedWeek)
      const ig = instagramMetrics.find(m => m.year === year && m.weekNumber === adjustedWeek)
      const sk = skoolMetrics.find(m => m.year === year && m.weekNumber === adjustedWeek)
      
      weeks.push({
        week: `KW ${adjustedWeek}`,
        linkedin: li?.impressions || 0,
        youtube: yt?.views || 0,
        instagram: ig?.reach || 0,
        skool: sk?.postViews || 0
      })
    }
    
    return weeks
  }, [linkedinMetrics, youtubeMetrics, instagramMetrics, skoolMetrics, currentWeek, currentYear])
  
  // Generate insights
  const insights = useMemo(() => {
    const list: Array<{ type: 'success' | 'warning' | 'info'; text: string; platform?: PlatformId }> = []
    
    // Find best performing platform by growth
    const growthData = [
      { platform: 'linkedin' as PlatformId, growth: latest.linkedin?.followerGrowth || 0, name: 'LinkedIn' },
      { platform: 'youtube' as PlatformId, growth: latest.youtube?.subscriberGrowth || 0, name: 'YouTube' },
      { platform: 'instagram' as PlatformId, growth: latest.instagram?.followerGrowth || 0, name: 'Instagram' },
      { platform: 'skool' as PlatformId, growth: latest.skool?.memberGrowth || 0, name: 'Skool' },
    ].filter(d => d.growth !== 0)
    
    if (growthData.length > 0) {
      const best = growthData.reduce((a, b) => a.growth > b.growth ? a : b)
      const worst = growthData.reduce((a, b) => a.growth < b.growth ? a : b)
      
      if (best.growth > 0) {
        list.push({
          type: 'success',
          text: `${best.name} wächst am stärksten mit +${best.growth} diese Woche`,
          platform: best.platform
        })
      }
      
      if (worst.growth < 0) {
        list.push({
          type: 'warning',
          text: `${worst.name} verliert ${Math.abs(worst.growth)} Follower - Content-Strategie prüfen`,
          platform: worst.platform
        })
      }
    }
    
    // Engagement insights
    if (latest.linkedin?.engagementRate) {
      if (latest.linkedin.engagementRate > 3) {
        list.push({ type: 'success', text: `LinkedIn Engagement Rate bei ${latest.linkedin.engagementRate.toFixed(1)}% - sehr gut!`, platform: 'linkedin' })
      } else if (latest.linkedin.engagementRate < 1) {
        list.push({ type: 'warning', text: `LinkedIn Engagement Rate unter 1% - Hooks und CTAs optimieren`, platform: 'linkedin' })
      }
    }
    
    if (latest.instagram?.saves && latest.instagram.reach) {
      const saveRate = (latest.instagram.saves / latest.instagram.reach) * 100
      if (saveRate > 2) {
        list.push({ type: 'success', text: `Instagram Save Rate bei ${saveRate.toFixed(1)}% - Content wird gespeichert!`, platform: 'instagram' })
      }
    }
    
    if (latest.skool?.activityRate) {
      if (latest.skool.activityRate > 30) {
        list.push({ type: 'success', text: `Skool Community sehr aktiv mit ${latest.skool.activityRate.toFixed(0)}% aktiven Members`, platform: 'skool' })
      } else if (latest.skool.activityRate < 10) {
        list.push({ type: 'warning', text: `Nur ${latest.skool.activityRate.toFixed(0)}% aktive Skool Members - Community aktivieren`, platform: 'skool' })
      }
    }
    
    // Reach distribution insight
    if (reachBreakdown.data.length > 1 && reachBreakdown.total > 0) {
      const sorted = [...reachBreakdown.data].sort((a, b) => b.value - a.value)
      const topPlatform = sorted[0]
      const percentage = ((topPlatform.value / reachBreakdown.total) * 100).toFixed(0)
      list.push({
        type: 'info',
        text: `${percentage}% deiner Reichweite kommt von ${topPlatform.name}`,
        platform: topPlatform.platform
      })
    }
    
    return list.slice(0, 3) // Max 3 insights
  }, [latest, reachBreakdown])
  
  const hasAnyData = linkedinMetrics.length > 0 || youtubeMetrics.length > 0 || 
                     instagramMetrics.length > 0 || skoolMetrics.length > 0

  // Custom tooltip for pie charts
  const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { platform: PlatformId } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className="bg-white dark:bg-neutral-800 px-3 py-2 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 text-xs">
          <p className="font-medium text-neutral-900 dark:text-white">{data.name}</p>
          <p className="text-neutral-500 dark:text-neutral-400">{formatNumber(data.value)}</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] -my-4">
      {/* Header */}
      <div className="shrink-0 mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight">Analytics</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Überblick über deine Content-Performance</p>
        </div>
        <Button 
          size="sm" 
          onClick={() => setCheckInOpen(true)}
          className={cn(!hasCurrentWeekData && hasAnyData && "animate-pulse")}
        >
          <Plus className="h-4 w-4 mr-1" />
          KPIs eintragen
        </Button>
      </div>
      
      {/* Alert if no data for current week */}
      {!hasCurrentWeekData && hasAnyData && (
        <div className="shrink-0 mb-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-3">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-400 flex-1">
            Keine KPIs für {formatWeek(currentYear, currentWeek)} eingetragen
          </p>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-xs h-7 text-amber-400 hover:bg-amber-500/20 px-3"
            onClick={() => setCheckInOpen(true)}
          >
            Eintragen
          </Button>
        </div>
      )}
      
      {/* Empty State */}
      {!hasAnyData && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-neutral-500" />
            </div>
            <h2 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">Starte dein wöchentliches Tracking</h2>
            <p className="text-sm text-neutral-500 mb-6">
              Trage jede Woche deine KPIs ein, um dein Wachstum über alle Plattformen zu verfolgen.
            </p>
            <Button onClick={() => setCheckInOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Ersten Check-in starten
            </Button>
          </div>
        </div>
      )}
      
      {hasAnyData && (
        <>
          {/* Main Grid: 3 columns */}
          <div className="flex-1 grid grid-cols-12 gap-3 min-h-0">
            
            {/* Left Column: Pie Charts */}
            <div className="col-span-3 flex flex-col gap-2 min-h-0">
              {/* Audience Breakdown */}
              <Card className="flex-1 flex flex-col min-h-0">
                <CardHeader className="pb-0 pt-2 px-3 shrink-0">
                  <CardTitle className="text-[11px] flex items-center justify-between">
                    <span>Audience</span>
                    <span className="text-[14px] font-semibold text-neutral-900 dark:text-white">{formatNumber(totals.totalFollowers)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 flex-1 min-h-0">
                  {audienceBreakdown.data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={audienceBreakdown.data}
                          cx="50%"
                          cy="50%"
                          innerRadius="50%"
                          outerRadius="80%"
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {audienceBreakdown.data.map((entry) => (
                            <Cell key={entry.platform} fill={PLATFORM_COLORS[entry.platform]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-neutral-600">
                      Keine Daten
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Reach Breakdown */}
              <Card className="flex-1 flex flex-col min-h-0">
                <CardHeader className="pb-0 pt-2 px-3 shrink-0">
                  <CardTitle className="text-[11px] flex items-center justify-between">
                    <span>Reichweite</span>
                    <span className="text-[14px] font-semibold text-neutral-900 dark:text-white">{formatNumber(totals.totalReach)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 flex-1 min-h-0">
                  {reachBreakdown.data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reachBreakdown.data}
                          cx="50%"
                          cy="50%"
                          innerRadius="50%"
                          outerRadius="80%"
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {reachBreakdown.data.map((entry) => (
                            <Cell key={entry.platform} fill={PLATFORM_COLORS[entry.platform]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-neutral-600">
                      Keine Daten
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Legend */}
              <div className="shrink-0 flex flex-wrap gap-x-3 gap-y-1 px-1">
                {(['linkedin', 'youtube', 'instagram', 'skool'] as const).map(platform => {
                  const Icon = platformIcons[platform]
                  return (
                    <div key={platform} className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: PLATFORM_COLORS[platform] }}
                      />
                      <Icon className="h-3 w-3 text-neutral-500" />
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Center Column: Stacked Area Chart */}
            <div className="col-span-6 flex flex-col min-h-0">
              <Card className="flex-1 flex flex-col min-h-0">
                <CardHeader className="pb-1 pt-2 px-3 shrink-0">
                  <CardTitle className="text-[11px]">Reichweite nach Plattform (8 Wochen)</CardTitle>
                </CardHeader>
                <CardContent className="px-3 pb-2 flex-1 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="week" tick={{ fontSize: 9 }} />
                      <YAxis tick={{ fontSize: 9 }} width={35} tickFormatter={(v) => formatNumber(v)} />
                      <Tooltip 
                        contentStyle={{ fontSize: 10 }}
                        formatter={(value: number | undefined, name: string | undefined) => [formatNumber(value ?? 0), name ?? '']}
                      />
                      <Area type="monotone" dataKey="linkedin" stackId="1" stroke={PLATFORM_COLORS.linkedin} fill={PLATFORM_COLORS.linkedin} fillOpacity={0.8} name="LinkedIn" />
                      <Area type="monotone" dataKey="youtube" stackId="1" stroke={PLATFORM_COLORS.youtube} fill={PLATFORM_COLORS.youtube} fillOpacity={0.8} name="YouTube" />
                      <Area type="monotone" dataKey="instagram" stackId="1" stroke={PLATFORM_COLORS.instagram} fill={PLATFORM_COLORS.instagram} fillOpacity={0.8} name="Instagram" />
                      <Area type="monotone" dataKey="skool" stackId="1" stroke={PLATFORM_COLORS.skool} fill={PLATFORM_COLORS.skool} fillOpacity={0.8} name="Skool" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              {/* Key Metrics Row */}
              <div className="shrink-0 grid grid-cols-4 gap-2 mt-2">
                <Card>
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-neutral-500 uppercase">Wachstum</p>
                        <p className={cn(
                          "text-[16px] font-semibold leading-tight",
                          totals.totalGrowth > 0 ? "text-green-600" : totals.totalGrowth < 0 ? "text-red-600" : "text-neutral-900 dark:text-white"
                        )}>
                          {totals.totalGrowth > 0 ? '+' : ''}{formatNumber(totals.totalGrowth)}
                        </p>
                      </div>
                      {totals.totalGrowth >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-neutral-500 uppercase">Engagement</p>
                        <p className="text-[16px] font-semibold text-neutral-900 dark:text-white leading-tight">
                          {formatNumber(totals.totalEngagement)}
                        </p>
                      </div>
                      <Users className="h-4 w-4 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-neutral-500 uppercase">Ø Eng. Rate</p>
                        <p className="text-[16px] font-semibold text-neutral-900 dark:text-white leading-tight">
                          {latest.linkedin?.engagementRate?.toFixed(1) || '-'}%
                        </p>
                      </div>
                      <Eye className="h-4 w-4 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[9px] text-neutral-500 uppercase">IG Saves</p>
                        <p className="text-[16px] font-semibold text-neutral-900 dark:text-white leading-tight">
                          {latest.instagram?.saves ? formatNumber(latest.instagram.saves) : '-'}
                        </p>
                      </div>
                      <Instagram className="h-4 w-4 text-pink-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Right Column: Platform Cards + Insights */}
            <div className="col-span-3 flex flex-col gap-2 min-h-0">
              {/* Platform Performance Cards */}
              <div className="flex-1 flex flex-col gap-1.5 min-h-0 overflow-y-auto">
                {(['linkedin', 'youtube', 'instagram', 'skool'] as const).map(platform => {
                  const Icon = platformIcons[platform]
                  const platformData = PLATFORMS[platform]
                  const metrics = platform === 'linkedin' ? latest.linkedin :
                                  platform === 'youtube' ? latest.youtube :
                                  platform === 'instagram' ? latest.instagram : latest.skool
                  
                  const hasData = !!metrics && !metrics.skipped
                  const followers = platform === 'youtube' ? (metrics as typeof latest.youtube)?.subscribers :
                                    platform === 'skool' ? (metrics as typeof latest.skool)?.members :
                                    (metrics as typeof latest.linkedin)?.followers
                  const growth = platform === 'youtube' ? (metrics as typeof latest.youtube)?.subscriberGrowth :
                                 platform === 'skool' ? (metrics as typeof latest.skool)?.memberGrowth :
                                 (metrics as typeof latest.linkedin)?.followerGrowth
                  
                  return (
                    <Link key={platform} to={`/analytics/${platform}`}>
                      <Card className={cn(
                        "hover:shadow-md transition-shadow cursor-pointer",
                        !hasData && "opacity-40"
                      )}>
                        <CardContent className="p-2">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: platformData.color }}
                            >
                              <Icon className="h-3.5 w-3.5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium text-neutral-900 dark:text-white">{platformData.name}</span>
                                {growth !== undefined && growth !== 0 && (
                                  <span className={cn(
                                    "text-[10px] font-medium flex items-center gap-0.5",
                                    growth > 0 ? "text-green-600" : "text-red-600"
                                  )}>
                                    {growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                    {growth > 0 ? '+' : ''}{growth}
                                  </span>
                                )}
                              </div>
                              <p className="text-[13px] font-semibold text-neutral-600 dark:text-neutral-300">
                                {hasData && followers ? formatNumber(followers) : '-'}
                              </p>
                            </div>
                            <ArrowRight className="h-3.5 w-3.5 text-neutral-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
              
              {/* Insights */}
              {insights.length > 0 && (
                <Card className="shrink-0">
                  <CardHeader className="pb-1 pt-2 px-3">
                    <CardTitle className="text-[11px] flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                      Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-2">
                    <div className="space-y-1.5">
                      {insights.map((insight, i) => (
                        <div 
                          key={i}
                          className={cn(
                            "text-[10px] p-1.5 rounded",
                            insight.type === 'success' && "bg-green-500/10 text-green-400",
                            insight.type === 'warning' && "bg-amber-500/10 text-amber-400",
                            insight.type === 'info' && "bg-blue-500/10 text-blue-400"
                          )}
                        >
                          {insight.text}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </>
      )}
      
      {/* AI Performance Report */}
      <div className="shrink-0 mt-4">
        <AIPerformanceReport />
      </div>
      
      {/* Winner/Loser Dashboard */}
      <WinnerLoserDashboard />
      
      {/* Hypothesen-Validierung */}
      <HypothesisValidation />
      
      {/* Weekly Check-in Wizard */}
      <WeeklyCheckInWizard open={checkInOpen} onOpenChange={setCheckInOpen} />
    </div>
  )
}

// Hypothesis Validation Component
function HypothesisValidation() {
  const allPosts = usePostsStore((state) => state.posts)
  
  // Get published posts with hypotheses
  const postsWithHypotheses = allPosts
    .filter(p => p.status === 'published' && (p as any).hypothesis)
    .sort((a, b) => new Date(b.publishedAt || b.updatedAt).getTime() - new Date(a.publishedAt || a.updatedAt).getTime())
    .slice(0, 10)
  
  if (postsWithHypotheses.length === 0) return null
  
  const getPerformanceIcon = (expected: string, actual: 'winner' | 'average' | 'loser') => {
    if (expected === 'above' && actual === 'winner') return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (expected === 'above' && actual !== 'winner') return <XCircle className="h-4 w-4 text-red-500" />
    if (expected === 'average' && actual === 'average') return <CheckCircle2 className="h-4 w-4 text-green-500" />
    if (expected === 'test') return <Minus className="h-4 w-4 text-purple-500" />
    return <Minus className="h-4 w-4 text-neutral-500" />
  }
  
  const getActualPerformance = (post: any): 'winner' | 'average' | 'loser' => {
    // Simple heuristic: compare to average metrics
    const impressions = post.metrics?.impressions || post.metrics?.views || 0
    if (impressions > 10000) return 'winner'
    if (impressions > 1000) return 'average'
    return 'loser'
  }
  
  const getTitle = (post: any) => {
    return (post as any).title || 
           post.content?.title || 
           post.content?.text?.slice(0, 50) || 
           post.content?.caption?.slice(0, 50) || 
           'Untitled'
  }
  
  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-500" />
          <CardTitle className="text-[14px]">Hypothesen-Validierung</CardTitle>
        </div>
        <p className="text-[12px] text-neutral-500 mt-1">
          Vergleich: Erwartete vs. tatsächliche Performance deiner Posts
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {postsWithHypotheses.map(post => {
            const expected = (post as any).expectedPerformance || 'average'
            const actual = getActualPerformance(post)
            const hypothesis = (post as any).hypothesis || ''
            
            return (
              <div key={post.id} className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-800">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {post.platform === 'linkedin' && <Linkedin className="h-3.5 w-3.5 text-[#0A66C2]" />}
                      {post.platform === 'youtube' && <Youtube className="h-3.5 w-3.5 text-[#FF0000]" />}
                      {post.platform === 'instagram' && <Instagram className="h-3.5 w-3.5 text-[#E4405F]" />}
                      {post.platform === 'skool' && <GraduationCap className="h-3.5 w-3.5 text-[#FACC15]" />}
                      <span className="text-[12px] font-medium text-white truncate">
                        {getTitle(post)}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 line-clamp-2">
                      <span className="font-medium">Hypothese:</span> {hypothesis.slice(0, 100)}{hypothesis.length > 100 ? '...' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-center">
                      <p className="text-[9px] text-neutral-500 uppercase">Erwartet</p>
                      <span className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded",
                        expected === 'above' && "bg-green-500/20 text-green-400",
                        expected === 'average' && "bg-neutral-800 text-neutral-400",
                        expected === 'test' && "bg-purple-500/20 text-purple-400"
                      )}>
                        {expected === 'above' ? '↑ Hoch' : expected === 'test' ? '🧪 Test' : '→ Normal'}
                      </span>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] text-neutral-500 uppercase">Tatsächlich</p>
                      <span className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded",
                        actual === 'winner' && "bg-green-500/20 text-green-400",
                        actual === 'average' && "bg-neutral-800 text-neutral-400",
                        actual === 'loser' && "bg-red-500/20 text-red-400"
                      )}>
                        {actual === 'winner' ? '↑ Winner' : actual === 'loser' ? '↓ Low' : '→ Normal'}
                      </span>
                    </div>
                    {getPerformanceIcon(expected, actual)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        
        {postsWithHypotheses.length > 0 && (
          <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
            <p className="text-xs text-purple-400">
              <span className="font-medium">💡 Tipp:</span> Analysiere regelmäßig, welche Hypothesen zutreffen. 
              So lernst du, was bei deiner Audience funktioniert.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Winner/Loser Dashboard Component
function WinnerLoserDashboard() {
  const allPosts = usePostsStore((state) => state.posts)
  
  // Get posts with performance ratings
  const ratedPosts = allPosts.filter(p => (p as any).performanceRating)
  const winners = ratedPosts.filter(p => (p as any).performanceRating === 'winner')
  const losers = ratedPosts.filter(p => (p as any).performanceRating === 'loser')
  const postsWithLearnings = ratedPosts.filter(p => (p as any).learning)
  
  if (ratedPosts.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-[14px]">Winner & Loser Analyse</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Trophy className="h-10 w-10 text-neutral-600 mx-auto mb-3" />
            <p className="text-[13px] text-neutral-500 mb-2">
              Noch keine Posts analysiert
            </p>
            <p className="text-[11px] text-neutral-500">
              Öffne einen veröffentlichten Post und bewerte ihn als Winner oder Loser, um Learnings zu dokumentieren.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }
  
  const getTitle = (post: any) => {
    return (post as any).title || 
           post.content?.title || 
           post.content?.text?.slice(0, 40) || 
           post.content?.caption?.slice(0, 40) || 
           'Untitled'
  }
  
  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-[14px]">Winner & Loser Analyse</CardTitle>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-green-400">
              <Trophy className="h-3.5 w-3.5" />
              {winners.length} Winner
            </span>
            <span className="flex items-center gap-1.5 text-red-400">
              <TrendingDown className="h-3.5 w-3.5" />
              {losers.length} Loser
            </span>
            <span className="flex items-center gap-1.5 text-neutral-500">
              <Lightbulb className="h-3.5 w-3.5" />
              {postsWithLearnings.length} Learnings
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Winners Column */}
          <div>
            <h4 className="text-xs font-semibold text-green-400 mb-3 flex items-center gap-1.5">
              <Trophy className="h-4 w-4" />
              Winners
            </h4>
            <div className="space-y-2">
              {winners.length === 0 ? (
                <p className="text-[11px] text-neutral-500 italic">Noch keine Winner markiert</p>
              ) : (
                winners.slice(0, 5).map(post => (
                  <div key={post.id} className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex items-start gap-2">
                      {post.platform === 'linkedin' && <Linkedin className="h-3.5 w-3.5 text-[#0A66C2] shrink-0 mt-0.5" />}
                      {post.platform === 'youtube' && <Youtube className="h-3.5 w-3.5 text-[#FF0000] shrink-0 mt-0.5" />}
                      {post.platform === 'instagram' && <Instagram className="h-3.5 w-3.5 text-[#E4405F] shrink-0 mt-0.5" />}
                      {post.platform === 'skool' && <GraduationCap className="h-3.5 w-3.5 text-[#FACC15] shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-white truncate">{getTitle(post)}</p>
                        {(post as any).learning && (
                          <p className="text-[10px] text-green-400 mt-1 line-clamp-2">
                            💡 {(post as any).learning}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          {/* Losers Column */}
          <div>
            <h4 className="text-xs font-semibold text-red-400 mb-3 flex items-center gap-1.5">
              <TrendingDown className="h-4 w-4" />
              Losers
            </h4>
            <div className="space-y-2">
              {losers.length === 0 ? (
                <p className="text-[11px] text-neutral-500 italic">Noch keine Loser markiert</p>
              ) : (
                losers.slice(0, 5).map(post => (
                  <div key={post.id} className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                    <div className="flex items-start gap-2">
                      {post.platform === 'linkedin' && <Linkedin className="h-3.5 w-3.5 text-[#0A66C2] shrink-0 mt-0.5" />}
                      {post.platform === 'youtube' && <Youtube className="h-3.5 w-3.5 text-[#FF0000] shrink-0 mt-0.5" />}
                      {post.platform === 'instagram' && <Instagram className="h-3.5 w-3.5 text-[#E4405F] shrink-0 mt-0.5" />}
                      {post.platform === 'skool' && <GraduationCap className="h-3.5 w-3.5 text-[#FACC15] shrink-0 mt-0.5" />}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-white truncate">{getTitle(post)}</p>
                        {(post as any).learning && (
                          <p className="text-[10px] text-red-400 mt-1 line-clamp-2">
                            ⚠️ {(post as any).learning}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Key Learnings Summary */}
        {postsWithLearnings.length > 0 && (
          <div className="mt-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <h4 className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-4 w-4" />
              Zusammenfassung: Deine wichtigsten Learnings
            </h4>
            <ul className="space-y-1.5">
              {postsWithLearnings.slice(0, 3).map(post => (
                <li key={post.id} className="text-xs text-amber-400 flex items-start gap-2">
                  <span className={cn(
                    "shrink-0 w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold",
                    (post as any).performanceRating === 'winner' ? "bg-green-500/30 text-green-400" : "bg-red-500/30 text-red-400"
                  )}>
                    {(post as any).performanceRating === 'winner' ? '✓' : '✗'}
                  </span>
                  <span>{(post as any).learning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
