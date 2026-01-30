import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Linkedin,
  Youtube,
  Instagram,
  GraduationCap,
  Target,
  Check,
  Minus,
  Plus,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Flame,
  TrendingUp,
  TrendingDown,
  Award
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PLATFORMS, PLATFORM_ORDER } from '@/lib/constants'
import { usePostsStore, useGoalsStore } from '@/lib/store'
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameDay, 
  isToday,
  addWeeks,
  subWeeks,
  isSameWeek,
  startOfDay,
  differenceInWeeks
} from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { PlatformId } from '@/lib/types'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const platformIcons = {
  linkedin: Linkedin,
  youtube: Youtube,
  instagram: Instagram,
  skool: GraduationCap
}

export function Dashboard() {
  const posts = usePostsStore((state) => state.posts)
  const goals = useGoalsStore((state) => state.goals)
  const updateGoal = useGoalsStore((state) => state.updateGoal)
  const [editingGoals, setEditingGoals] = useState(false)
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )
  
  const isCurrentWeek = isSameWeek(selectedWeekStart, new Date(), { weekStartsOn: 1 })
  const weeksFromNow = differenceInWeeks(selectedWeekStart, startOfWeek(new Date(), { weekStartsOn: 1 }))

  // Navigate weeks
  const goToPreviousWeek = () => setSelectedWeekStart(subWeeks(selectedWeekStart, 1))
  const goToNextWeek = () => setSelectedWeekStart(addWeeks(selectedWeekStart, 1))
  const goToCurrentWeek = () => setSelectedWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))

  // Get selected week days
  const weekDays = useMemo(() => {
    const weekEnd = endOfWeek(selectedWeekStart, { weekStartsOn: 1 })
    return eachDayOfInterval({ start: selectedWeekStart, end: weekEnd })
  }, [selectedWeekStart])

  // Get posts per platform per day (only published posts count)
  const getPostsForDay = (platform: PlatformId, day: Date) => {
    return posts.filter(p => {
      if (p.platform !== platform) return false
      if (p.status !== 'published') return false
      const postDate = p.publishedAt
      if (!postDate) return false
      return isSameDay(new Date(postDate), day)
    })
  }

  // Calculate weekly progress per platform (only published posts count)
  const weeklyProgress = useMemo(() => {
    return PLATFORM_ORDER.map(platform => {
      const goal = goals.find(g => g.platform === platform)
      const postsThisWeek = posts.filter(p => {
        if (p.platform !== platform) return false
        if (p.status !== 'published') return false
        const postDate = p.publishedAt
        if (!postDate) return false
        const date = new Date(postDate)
        return date >= weekDays[0] && date <= weekDays[6]
      }).length
      
      return {
        platform,
        current: postsThisWeek,
        target: goal?.weeklyTarget || 0,
        enabled: goal?.enabled ?? true,
        percentage: goal?.weeklyTarget ? Math.min(100, Math.round((postsThisWeek / goal.weeklyTarget) * 100)) : 0
      }
    })
  }, [posts, goals, weekDays])

  // Previous week progress for comparison (only published posts count)
  const previousWeekProgress = useMemo(() => {
    const prevWeekStart = subWeeks(selectedWeekStart, 1)
    const prevWeekEnd = endOfWeek(prevWeekStart, { weekStartsOn: 1 })
    
    const totalPosts = posts.filter(p => {
      if (p.status !== 'published') return false
      const postDate = p.publishedAt
      if (!postDate) return false
      const date = new Date(postDate)
      return date >= prevWeekStart && date <= prevWeekEnd
    }).length
    
    return totalPosts
  }, [posts, selectedWeekStart])

  // Overall progress
  const overallProgress = useMemo(() => {
    const enabledGoals = weeklyProgress.filter(p => p.enabled && p.target > 0)
    if (enabledGoals.length === 0) return { current: 0, target: 0, percentage: 0 }
    
    const totalCurrent = enabledGoals.reduce((sum, p) => sum + p.current, 0)
    const totalTarget = enabledGoals.reduce((sum, p) => sum + p.target, 0)
    
    return {
      current: totalCurrent,
      target: totalTarget,
      percentage: totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0
    }
  }, [weeklyProgress])

  // Calculate streak (consecutive weeks of hitting all goals - only published posts count)
  const streak = useMemo(() => {
    let currentStreak = 0
    let checkWeek = startOfWeek(new Date(), { weekStartsOn: 1 })
    
    // If current week is not complete, start from last week
    if (isCurrentWeek && overallProgress.percentage < 100) {
      checkWeek = subWeeks(checkWeek, 1)
    }
    
    for (let i = 0; i < 52; i++) {
      const weekStart = subWeeks(checkWeek, i)
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 })
      
      let weekTotal = 0
      let weekTarget = 0
      
      PLATFORM_ORDER.forEach(platform => {
        const goal = goals.find(g => g.platform === platform)
        if (!goal?.enabled || !goal.weeklyTarget) return
        
        weekTarget += goal.weeklyTarget
        weekTotal += posts.filter(p => {
          if (p.platform !== platform) return false
          if (p.status !== 'published') return false
          const postDate = p.publishedAt
          if (!postDate) return false
          const date = new Date(postDate)
          return date >= weekStart && date <= weekEnd
        }).length
      })
      
      if (weekTarget > 0 && weekTotal >= weekTarget) {
        currentStreak++
      } else {
        break
      }
    }
    
    return currentStreak
  }, [posts, goals, isCurrentWeek, overallProgress.percentage])

  // Week comparison
  const weekComparison = overallProgress.current - previousWeekProgress

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fade-in">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight">Wochenziele</h1>
            <div className={cn(
              "flex items-center gap-1 rounded-full p-1 self-start sm:self-auto",
              "bg-neutral-100 border border-neutral-200",
              "dark:bg-neutral-900 dark:border-neutral-800"
            )}>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-8 w-8 rounded-full",
                  "hover:bg-neutral-200 dark:hover:bg-neutral-800"
                )}
                onClick={goToPreviousWeek}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className={cn(
                "text-xs sm:text-sm font-medium px-2 sm:px-3 min-w-[120px] sm:min-w-[160px] text-center",
                "text-neutral-700 dark:text-neutral-300"
              )}>
                {format(weekDays[0], "d. MMM", { locale: de })} – {format(weekDays[6], "d. MMM", { locale: de })}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-8 w-8 rounded-full",
                  "hover:bg-neutral-200 dark:hover:bg-neutral-800"
                )}
                onClick={goToNextWeek}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {!isCurrentWeek && (
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs px-2.5 py-1 rounded-full font-medium",
                  weeksFromNow < 0 
                    ? "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400" 
                    : "bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30"
                )}>
                  {weeksFromNow < 0 
                    ? `vor ${Math.abs(weeksFromNow)} Woche${Math.abs(weeksFromNow) > 1 ? 'n' : ''}`
                    : `in ${weeksFromNow} Woche${weeksFromNow > 1 ? 'n' : ''}`
                  }
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={goToCurrentWeek}
                  className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                >
                  Heute
                </Button>
              </div>
            )}
          </div>
          <Button 
            variant={editingGoals ? "default" : "outline"}
            size="sm" 
            onClick={() => setEditingGoals(!editingGoals)}
            className="gap-1.5 self-start sm:self-auto"
          >
            <Settings2 className="h-3.5 w-3.5" />
            {editingGoals ? 'Fertig' : 'Ziele'}
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Main Progress */}
          <Card className={cn(
            "md:col-span-2 relative overflow-hidden",
            overallProgress.percentage >= 100 && "border-green-500/50 bg-green-50 dark:bg-green-500/5"
          )}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                overallProgress.percentage >= 100 
                  ? "bg-green-500" 
                  : "bg-neutral-900 dark:bg-white"
              )}>
                {overallProgress.percentage >= 100 ? (
                  <Award className="h-6 w-6 text-white" />
                ) : (
                  <Target className="h-6 w-6 text-white dark:text-black" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-neutral-500 font-medium uppercase tracking-wider">Wochenziel</span>
                  <span className={cn(
                    "text-2xl font-semibold tabular-nums",
                    overallProgress.percentage >= 100 
                      ? "text-green-600 dark:text-green-500" 
                      : "text-neutral-900 dark:text-white"
                  )}>
                    {overallProgress.current}/{overallProgress.target}
                  </span>
                </div>
                <div className="h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      overallProgress.percentage >= 100 
                        ? "bg-green-500" 
                        : "bg-neutral-900 dark:bg-white"
                    )}
                    style={{ width: `${Math.min(100, overallProgress.percentage)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Streak */}
          <Card className={cn(
            "relative overflow-hidden",
            streak > 0 && "border-orange-500/30 bg-orange-50 dark:bg-orange-500/5"
          )}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                streak > 0 
                  ? "bg-orange-500" 
                  : "bg-neutral-100 dark:bg-neutral-800"
              )}>
                <Flame className={cn(
                  "h-6 w-6", 
                  streak > 0 ? "text-white" : "text-neutral-400 dark:text-neutral-600"
                )} />
              </div>
              <div>
                <p className={cn(
                  "text-2xl font-semibold tabular-nums",
                  streak > 0 
                    ? "text-orange-600 dark:text-orange-500" 
                    : "text-neutral-400 dark:text-neutral-600"
                )}>
                  {streak}
                </p>
                <p className="text-xs text-neutral-500">Streak</p>
              </div>
            </CardContent>
          </Card>

          {/* Week Comparison */}
          <Card className={cn(
            "relative overflow-hidden",
            weekComparison > 0 && "border-green-500/30 bg-green-50 dark:bg-green-500/5"
          )}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
                weekComparison > 0 
                  ? "bg-green-500" 
                  : weekComparison < 0 
                    ? "bg-red-100 dark:bg-red-500/20" 
                    : "bg-neutral-100 dark:bg-neutral-800"
              )}>
                {weekComparison >= 0 ? (
                  <TrendingUp className={cn(
                    "h-6 w-6", 
                    weekComparison > 0 ? "text-white" : "text-neutral-400 dark:text-neutral-600"
                  )} />
                ) : (
                  <TrendingDown className="h-6 w-6 text-red-500" />
                )}
              </div>
              <div>
                <p className={cn(
                  "text-2xl font-semibold tabular-nums",
                  weekComparison > 0 
                    ? "text-green-600 dark:text-green-500" 
                    : weekComparison < 0 
                      ? "text-red-600 dark:text-red-500" 
                      : "text-neutral-400 dark:text-neutral-600"
                )}>
                  {weekComparison > 0 ? '+' : ''}{weekComparison}
                </p>
                <p className="text-xs text-neutral-500">vs Vorw.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Combined Tracker Table */}
        <Card className="overflow-hidden">
          <CardContent className="p-0 overflow-x-auto">
            {/* Header Row */}
            <div className={cn(
              "flex items-center px-3 sm:px-5 py-4 min-w-[640px]",
              "border-b border-neutral-200 bg-neutral-50",
              "dark:border-neutral-800 dark:bg-neutral-900/50"
            )}>
              <div className="w-32 sm:w-44 shrink-0" />
              {weekDays.map((day, idx) => {
                const isTodayDate = isToday(day)
                return (
                  <div key={idx} className="flex-1 text-center">
                    <div className={cn(
                      "text-xs font-medium uppercase tracking-wider",
                      isTodayDate 
                        ? "text-neutral-900 dark:text-white" 
                        : "text-neutral-400 dark:text-neutral-600"
                    )}>
                      {format(day, 'EEE', { locale: de })}
                    </div>
                    <div className={cn(
                      "text-xs mt-0.5 tabular-nums",
                      isTodayDate 
                        ? "text-neutral-900 dark:text-white font-semibold" 
                        : "text-neutral-500"
                    )}>
                      {format(day, 'd.M.')}
                    </div>
                  </div>
                )
              })}
              <div className="w-20 sm:w-28 shrink-0 text-right text-xs text-neutral-500 font-medium uppercase tracking-wider pr-1">
                <span className="hidden sm:inline">Fortschritt</span>
                <span className="sm:hidden">%</span>
              </div>
            </div>

            {/* Platform Rows */}
            {PLATFORM_ORDER.map((platform, platformIdx) => {
              const progress = weeklyProgress.find(p => p.platform === platform)!
              const goal = goals.find(g => g.platform === platform)
              const Icon = platformIcons[platform]
              const platformData = PLATFORMS[platform]
              const isComplete = progress.percentage >= 100
              const isLast = platformIdx === PLATFORM_ORDER.length - 1
              
              return (
                <Link 
                  key={platform}
                  to={`/boards?platform=${platform}`}
                  className={cn(
                    "flex items-center px-3 sm:px-5 py-3 sm:py-4 transition-all duration-200 group min-w-[640px]",
                    !isLast && "border-b border-neutral-100 dark:border-neutral-800/50",
                    isComplete 
                      ? "bg-green-50/50 hover:bg-green-50 dark:bg-green-500/5 dark:hover:bg-green-500/10" 
                      : "hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                  )}
                >
                  {/* Platform Info */}
                  <div className="w-32 sm:w-44 shrink-0 flex items-center gap-2 sm:gap-3">
                    <div 
                      className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                      style={{ backgroundColor: platformData.color }}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-neutral-900 dark:text-white truncate">{platformData.name}</p>
                      <p className="text-[10px] sm:text-xs text-neutral-500">
                        {progress.current}/{progress.target} Posts
                      </p>
                    </div>
                  </div>

                  {/* Week Grid */}
                  {weekDays.map((day, idx) => {
                    const dayPosts = getPostsForDay(platform, day)
                    const postCount = dayPosts.length
                    const isPast = startOfDay(day) < startOfDay(new Date())
                    const isTodayDate = isToday(day)
                    
                    return (
                      <div key={idx} className="flex-1 flex justify-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div 
                              className={cn(
                                "w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center transition-all cursor-default text-xs sm:text-sm font-medium",
                                postCount > 0 
                                  ? "bg-green-500 text-white shadow-[0_0_20px_-5px_rgba(34,197,94,0.5)]" 
                                  : isPast && !isTodayDate
                                    ? "bg-neutral-100 text-neutral-400 dark:bg-neutral-800/50 dark:text-neutral-600"
                                    : isTodayDate
                                      ? "bg-neutral-900 text-white dark:bg-white dark:text-black"
                                      : "border border-dashed border-neutral-300 text-neutral-400 dark:border-neutral-700 dark:text-neutral-600"
                              )}
                            >
                              {postCount > 1 ? postCount : postCount === 1 ? (
                                <Check className="h-5 w-5" />
                              ) : isPast && !isTodayDate ? (
                                <Minus className="h-4 w-4" />
                              ) : isTodayDate ? '•' : ''}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className={cn(
                            "bg-white border-neutral-200 text-neutral-900",
                            "dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
                          )}>
                            <p className="font-medium">{format(day, 'EEEE, d. MMMM', { locale: de })}</p>
                            <p className="text-neutral-500 dark:text-neutral-400 text-xs">
                              {postCount > 0 
                                ? `${postCount} ${platformData.name} Post${postCount > 1 ? 's' : ''}`
                                : `Kein ${platformData.name} Post`
                              }
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )
                  })}

                  {/* Progress */}
                  <div className="w-20 sm:w-28 shrink-0 flex items-center justify-end gap-1 sm:gap-2">
                    {editingGoals ? (
                      <div className="flex items-center gap-0.5" onClick={(e) => e.preventDefault()}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.preventDefault()
                            updateGoal(platform, { 
                              weeklyTarget: Math.max(0, (goal?.weeklyTarget || 0) - 1) 
                            })
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Input 
                          type="number" 
                          value={goal?.weeklyTarget || 0}
                          onClick={(e) => e.preventDefault()}
                          onChange={(e) => updateGoal(platform, { 
                            weeklyTarget: Math.max(0, parseInt(e.target.value) || 0) 
                          })}
                          className="w-12 h-7 text-center text-xs px-1"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.preventDefault()
                            updateGoal(platform, { 
                              weeklyTarget: (goal?.weeklyTarget || 0) + 1 
                            })
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                          isComplete 
                            ? "bg-green-100 text-green-700 border border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30" 
                            : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                        )}>
                          {progress.percentage}%
                          {isComplete && <Check className="h-3 w-3" />}
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-400 dark:text-neutral-600 group-hover:text-neutral-600 dark:group-hover:text-neutral-400 transition-colors" />
                      </>
                    )}
                  </div>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
