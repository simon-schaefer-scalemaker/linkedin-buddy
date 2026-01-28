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
      <div className="space-y-4 animate-fade-in">
        {/* Header Row - Compact */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-[22px] font-semibold text-gray-900">Wochenziele</h1>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 hover:bg-white"
                onClick={goToPreviousWeek}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-[13px] text-gray-700 font-medium px-2 min-w-[160px] text-center">
                {format(weekDays[0], "d. MMM", { locale: de })} – {format(weekDays[6], "d. MMM", { locale: de })}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 hover:bg-white"
                onClick={goToNextWeek}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {!isCurrentWeek && (
              <>
                <span className={cn(
                  "text-[11px] px-2 py-0.5 rounded-full",
                  weeksFromNow < 0 ? "bg-gray-100 text-gray-500" : "bg-blue-50 text-blue-600"
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
                  className="text-[11px] h-6 text-gray-500"
                >
                  Heute
                </Button>
              </>
            )}
          </div>
          <Button 
            variant={editingGoals ? "default" : "outline"}
            size="sm" 
            onClick={() => setEditingGoals(!editingGoals)}
            className="gap-1.5 h-8"
          >
            <Settings2 className="h-3.5 w-3.5" />
            {editingGoals ? 'Fertig' : 'Ziele'}
          </Button>
        </div>

        {/* Stats Bar - Single Row */}
        <div className="flex items-stretch gap-3">
          {/* Main Progress */}
          <Card className={cn(
            "flex-1 border-2",
            overallProgress.percentage >= 100 ? "border-green-500 bg-green-50/30" : "border-gray-900"
          )}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                overallProgress.percentage >= 100 ? "bg-green-500" : "bg-gray-900"
              )}>
                {overallProgress.percentage >= 100 ? (
                  <Award className="h-5 w-5 text-white" />
                ) : (
                  <Target className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[12px] text-gray-500">Wochenziel</span>
                  <span className={cn(
                    "text-[20px] font-semibold leading-none",
                    overallProgress.percentage >= 100 ? "text-green-600" : "text-gray-900"
                  )}>
                    {overallProgress.current}/{overallProgress.target}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      overallProgress.percentage >= 100 ? "bg-green-500" : "bg-gray-900"
                    )}
                    style={{ width: `${Math.min(100, overallProgress.percentage)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Streak */}
          <Card className={cn("w-32", streak > 0 && "bg-orange-50/50 border-orange-200")}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                streak > 0 ? "bg-orange-500" : "bg-gray-100"
              )}>
                <Flame className={cn("h-5 w-5", streak > 0 ? "text-white" : "text-gray-400")} />
              </div>
              <div>
                <p className={cn(
                  "text-[20px] font-semibold leading-none",
                  streak > 0 ? "text-orange-500" : "text-gray-300"
                )}>
                  {streak}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Streak</p>
              </div>
            </CardContent>
          </Card>

          {/* Week Comparison */}
          <Card className="w-32">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                weekComparison > 0 ? "bg-green-500" : weekComparison < 0 ? "bg-red-100" : "bg-gray-100"
              )}>
                {weekComparison >= 0 ? (
                  <TrendingUp className={cn("h-5 w-5", weekComparison > 0 ? "text-white" : "text-gray-400")} />
                ) : (
                  <TrendingDown className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div>
                <p className={cn(
                  "text-[20px] font-semibold leading-none",
                  weekComparison > 0 ? "text-green-500" : weekComparison < 0 ? "text-red-500" : "text-gray-400"
                )}>
                  {weekComparison > 0 ? '+' : ''}{weekComparison}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">vs Vorw.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Combined Tracker Table */}
        <Card>
          <CardContent className="p-0">
            {/* Header Row */}
            <div className="flex items-center px-5 py-3 border-b bg-gray-50/80">
              <div className="w-44" />
              {weekDays.map((day, idx) => {
                const isTodayDate = isToday(day)
                return (
                  <div key={idx} className="flex-1 text-center">
                    <div className={cn(
                      "text-[12px] font-medium",
                      isTodayDate ? "text-gray-900" : "text-gray-400"
                    )}>
                      {format(day, 'EEE', { locale: de })}
                    </div>
                    <div className={cn(
                      "text-[11px]",
                      isTodayDate ? "text-gray-900 font-semibold" : "text-gray-400"
                    )}>
                      {format(day, 'd.M.')}
                    </div>
                  </div>
                )
              })}
              <div className="w-28 text-right text-[12px] text-gray-400 font-medium pr-1">
                Fortschritt
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
                    "flex items-center px-5 py-3.5 transition-colors group",
                    !isLast && "border-b",
                    isComplete ? "bg-green-50/30 hover:bg-green-50/50" : "hover:bg-gray-50"
                  )}
                >
                  {/* Platform Info */}
                  <div className="w-44 flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: platformData.color }}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-gray-900 truncate group-hover:text-gray-700">{platformData.name}</p>
                      <p className="text-[11px] text-gray-400">
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
                                "w-11 h-11 rounded-xl flex items-center justify-center transition-all cursor-default text-[13px] font-medium",
                                postCount > 0 
                                  ? "bg-green-500 text-white" 
                                  : isPast && !isTodayDate
                                    ? "bg-gray-100 text-gray-300"
                                    : isTodayDate
                                      ? "bg-gray-900 text-white"
                                      : "border border-dashed border-gray-200 text-gray-300"
                              )}
                            >
                              {postCount > 1 ? postCount : postCount === 1 ? (
                                <Check className="h-5 w-5" />
                              ) : isPast && !isTodayDate ? (
                                <Minus className="h-4 w-4" />
                              ) : isTodayDate ? '•' : ''}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{format(day, 'EEEE, d. MMMM', { locale: de })}</p>
                            <p className="text-gray-400">
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
                  <div className="w-28 flex items-center justify-end gap-2">
                    {editingGoals ? (
                      <div className="flex items-center gap-0.5" onClick={(e) => e.preventDefault()}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
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
                          className="w-10 h-6 text-center text-[11px] px-1"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
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
                          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium",
                          isComplete ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                        )}>
                          {progress.percentage}%
                          {isComplete && <Check className="h-3 w-3" />}
                        </div>
                        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
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
