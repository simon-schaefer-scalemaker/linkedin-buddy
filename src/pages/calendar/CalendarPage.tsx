import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Card, CardContent } from '@/components/ui/card'
import { usePostsStore } from '@/lib/store'
import { PLATFORMS, PLATFORM_ORDER } from '@/lib/constants'
import { PlatformIcon } from '@/components/shared/platform-icon'
import type { PlatformId, Post } from '@/lib/types'
import { format, isToday, isTomorrow, addDays, startOfWeek, endOfWeek } from 'date-fns'
import { de } from 'date-fns/locale'
import { CalendarDays, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/stores/themeStore'

export function CalendarPage() {
  const navigate = useNavigate()
  const posts = usePostsStore((state) => state.posts)
  const { theme } = useThemeStore()
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformId[]>([
    'linkedin', 'youtube', 'instagram', 'skool'
  ])

  // Calculate statistics
  const stats = useMemo(() => {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    
    const scheduledPosts = posts.filter(p => p.scheduledFor && new Date(p.scheduledFor) > now)
    const publishedPosts = posts.filter(p => p.publishedAt)
    const thisWeekPosts = posts.filter(p => {
      const date = p.scheduledFor || p.publishedAt
      if (!date) return false
      const d = new Date(date)
      return d >= weekStart && d <= weekEnd
    })
    
    return {
      scheduled: scheduledPosts.length,
      published: publishedPosts.length,
      thisWeek: thisWeekPosts.length
    }
  }, [posts])

  // Get upcoming posts (next 7 days)
  const upcomingPosts = useMemo(() => {
    const now = new Date()
    const nextWeek = addDays(now, 7)
    
    return posts
      .filter(p => p.scheduledFor)
      .filter(p => {
        const date = new Date(p.scheduledFor!)
        return date >= now && date <= nextWeek
      })
      .filter(p => selectedPlatforms.includes(p.platform))
      .sort((a, b) => new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime())
      .slice(0, 5)
  }, [posts, selectedPlatforms])

  // Convert posts to calendar events
  const events = posts
    .filter(post => post.scheduledFor || post.publishedAt)
    .filter(post => selectedPlatforms.includes(post.platform))
    .map(post => {
      const dateStr = post.scheduledFor || post.publishedAt
      const time = dateStr ? format(new Date(dateStr), 'HH:mm') : ''
      return {
        id: post.id,
        title: getPostTitle(post),
        date: dateStr,
        backgroundColor: PLATFORMS[post.platform].color,
        borderColor: PLATFORMS[post.platform].color,
        extendedProps: {
          platform: post.platform,
          status: post.status,
          time: time
        }
      }
    })

  function getPostTitle(post: Post): string {
    if ('content' in post) {
      if ('title' in post.content && post.content.title) {
        return post.content.title
      }
      if ('text' in post.content && post.content.text) {
        return post.content.text.slice(0, 40) + (post.content.text.length > 40 ? '...' : '')
      }
      if ('caption' in post.content && post.content.caption) {
        return post.content.caption.slice(0, 40) + (post.content.caption.length > 40 ? '...' : '')
      }
    }
    return 'Post'
  }

  function getDateLabel(dateStr: string): string {
    const date = new Date(dateStr)
    if (isToday(date)) return 'Heute'
    if (isTomorrow(date)) return 'Morgen'
    return format(date, 'EEEE', { locale: de })
  }

  const togglePlatform = (platform: PlatformId) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }

  const handleEventClick = (info: { event: { id: string; extendedProps: Record<string, unknown> } }) => {
    const platform = info.event.extendedProps.platform as PlatformId
    navigate(`/boards/${platform}/${info.event.id}?from=calendar`)
  }

  const handleDateClick = (info: { dateStr: string }) => {
    // Navigate to boards with the date pre-selected
    console.log('Date clicked:', info.dateStr)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] -my-4">
      {/* Header with Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 dark:text-white tracking-tight">Content Kalender</h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">Plane und verwalte deine Posts</p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="text-center sm:text-right">
            <p className="text-xl sm:text-2xl font-light text-neutral-900 dark:text-white tabular-nums">{stats.thisWeek}</p>
            <p className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-wider">Diese Woche</p>
          </div>
          <div className="w-px h-8 sm:h-10 bg-neutral-200 dark:bg-neutral-800" />
          <div className="text-center sm:text-right">
            <p className="text-xl sm:text-2xl font-light text-neutral-900 dark:text-white tabular-nums">{stats.scheduled}</p>
            <p className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-wider">Geplant</p>
          </div>
          <div className="w-px h-8 sm:h-10 bg-neutral-200 dark:bg-neutral-800" />
          <div className="text-center sm:text-right">
            <p className="text-xl sm:text-2xl font-light text-neutral-900 dark:text-white tabular-nums">{stats.published}</p>
            <p className="text-[10px] sm:text-xs text-neutral-500 uppercase tracking-wider">Veröffentlicht</p>
          </div>
        </div>
      </div>

      {/* Platform Filter Pills */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-4 shrink-0 overflow-x-auto pb-1 -mx-1 px-1">
        {PLATFORM_ORDER.map(platform => {
          const isSelected = selectedPlatforms.includes(platform)
          const platformPosts = posts.filter(p => p.platform === platform && (p.scheduledFor || p.publishedAt)).length
          
          return (
            <button
              key={platform}
              onClick={() => togglePlatform(platform)}
              className={cn(
                "flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0",
                isSelected 
                  ? "text-white shadow-lg" 
                  : cn(
                    "border",
                    "bg-white border-neutral-200 text-neutral-600 hover:border-neutral-300 hover:text-neutral-900",
                    "dark:bg-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-white"
                  )
              )}
              style={isSelected ? { backgroundColor: PLATFORMS[platform].color } : undefined}
            >
              <PlatformIcon platform={platform} size="sm" className={isSelected ? 'text-white' : undefined} />
              <span className="hidden sm:inline">{PLATFORMS[platform].name}</span>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full",
                isSelected 
                  ? "bg-white/20" 
                  : "bg-neutral-100 dark:bg-neutral-800"
              )}>
                {platformPosts}
              </span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 flex-1 min-h-0 overflow-hidden">
        {/* Calendar - Main Content */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <Card className="overflow-hidden flex-1 flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              <div className={cn(
                "calendar-wrapper p-4 flex-1 flex flex-col min-h-0",
                theme === 'light' ? 'calendar-light' : 'calendar-dark'
              )}>
                <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  events={events}
                  eventClick={handleEventClick}
                  dateClick={handleDateClick}
                  headerToolbar={{
                    left: 'prev,next',
                    center: 'title',
                    right: 'today'
                  }}
                  buttonText={{
                    today: 'Heute'
                  }}
                  locale="de"
                  firstDay={1}
                  height="100%"
                  eventDisplay="block"
                  dayMaxEvents={3}
                  moreLinkText={(n) => `+${n} mehr`}
                  eventContent={(eventInfo) => (
                    <div 
                      className="flex items-center gap-1.5 px-2 py-1 rounded-md overflow-hidden cursor-pointer transition-opacity hover:opacity-90"
                      style={{ backgroundColor: eventInfo.event.backgroundColor }}
                    >
                      <PlatformIcon 
                        platform={eventInfo.event.extendedProps.platform as PlatformId} 
                        size="sm" 
                        className="text-white shrink-0 opacity-90" 
                      />
                      {eventInfo.event.extendedProps.time && (
                        <span className="text-[10px] text-white/70 shrink-0">
                          {eventInfo.event.extendedProps.time as string}
                        </span>
                      )}
                      <span className="text-[11px] text-white truncate font-medium">
                        {eventInfo.event.title}
                      </span>
                    </div>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Upcoming Posts */}
        <div className="lg:col-span-1 flex flex-col gap-3 min-h-0 overflow-hidden">
          {/* Upcoming Posts Card */}
          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <CardContent className="p-4 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center gap-2 mb-3 shrink-0">
                <Clock className="h-4 w-4 text-neutral-500" />
                <h3 className="text-sm font-medium text-neutral-900 dark:text-white">Nächste Posts</h3>
              </div>
              
              {upcomingPosts.length > 0 ? (
                <div className="space-y-2 overflow-y-auto flex-1 min-h-0">
                  {upcomingPosts.slice(0, 4).map(post => (
                    <button
                      key={post.id}
                      onClick={() => navigate(`/boards/${post.platform}/${post.id}`)}
                      className="w-full text-left group"
                    >
                      <div className={cn(
                        "flex items-center gap-3 p-2 -mx-2 rounded-lg transition-colors",
                        "hover:bg-neutral-100 dark:hover:bg-neutral-800/50"
                      )}>
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: PLATFORMS[post.platform].color + '30' }}
                        >
                          <PlatformIcon 
                            platform={post.platform} 
                            size="sm"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-neutral-900 dark:text-white truncate">
                            {getPostTitle(post)}
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            {getDateLabel(post.scheduledFor!)} • {format(new Date(post.scheduledFor!), 'HH:mm', { locale: de })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 flex-1 flex flex-col items-center justify-center">
                  <CalendarDays className="h-8 w-8 text-neutral-300 dark:text-neutral-700 mb-2" />
                  <p className="text-xs text-neutral-500">Keine geplanten Posts</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Legend - Compact */}
          <Card className="shrink-0">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {PLATFORM_ORDER.map(platform => {
                  const count = posts.filter(p => p.platform === platform && (p.scheduledFor || p.publishedAt)).length
                  return (
                    <div key={platform} className="flex items-center gap-2">
                      <div 
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: PLATFORMS[platform].color }}
                      />
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">{PLATFORMS[platform].name} ({count})</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom Calendar Styles - Light Mode */}
      <style>{`
        .calendar-wrapper {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
        }
        
        .calendar-wrapper .fc {
          font-family: inherit;
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .calendar-wrapper .fc-view-harness {
          flex: 1;
        }
        
        .calendar-wrapper .fc-toolbar {
          margin-bottom: 1rem !important;
        }
        
        /* Light Mode Styles */
        .calendar-light .fc-toolbar-title {
          font-size: 1.25rem !important;
          font-weight: 500 !important;
          color: #171717 !important;
        }
        
        .calendar-light .fc-button {
          background: #fff !important;
          border: 1px solid #e5e5e5 !important;
          color: #525252 !important;
          font-size: 0.8125rem !important;
          font-weight: 500 !important;
          padding: 0.5rem 1rem !important;
          border-radius: 0.5rem !important;
          box-shadow: none !important;
          transition: all 0.15s ease !important;
        }
        
        .calendar-light .fc-button:hover {
          background: #f5f5f5 !important;
          border-color: #d4d4d4 !important;
          color: #171717 !important;
        }
        
        .calendar-light .fc-button-active,
        .calendar-light .fc-button:active {
          background: #171717 !important;
          border-color: #171717 !important;
          color: #fff !important;
        }
        
        .calendar-light .fc-col-header-cell {
          padding: 0.75rem 0 !important;
          font-size: 0.6875rem !important;
          font-weight: 500 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          color: #737373 !important;
          border: none !important;
          background: transparent !important;
        }
        
        .calendar-light .fc-daygrid-day {
          border-color: #e5e5e5 !important;
          transition: background-color 0.15s ease !important;
        }
        
        .calendar-light .fc-daygrid-day:hover {
          background: #fafafa !important;
        }
        
        .calendar-light .fc-daygrid-day-number {
          font-size: 0.875rem !important;
          font-weight: 400 !important;
          color: #525252 !important;
          padding: 0.5rem !important;
        }
        
        .calendar-light .fc-day-today {
          background: rgba(0, 0, 0, 0.02) !important;
        }
        
        .calendar-light .fc-day-today .fc-daygrid-day-number {
          background: #171717 !important;
          color: #fff !important;
          border-radius: 9999px !important;
          width: 1.75rem !important;
          height: 1.75rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0.25rem !important;
          padding: 0 !important;
        }
        
        .calendar-light .fc-day-other .fc-daygrid-day-number {
          color: #a3a3a3 !important;
        }
        
        .calendar-light .fc-scrollgrid {
          border: none !important;
        }
        
        .calendar-light .fc-scrollgrid td:last-child {
          border-right: none !important;
        }
        
        .calendar-light .fc-scrollgrid tr:last-child td {
          border-bottom: none !important;
        }
        
        /* Dark Mode Styles */
        .calendar-dark .fc-toolbar-title {
          font-size: 1.25rem !important;
          font-weight: 500 !important;
          color: #fff !important;
        }
        
        .calendar-dark .fc-button {
          background: #171717 !important;
          border: 1px solid #262626 !important;
          color: #a3a3a3 !important;
          font-size: 0.8125rem !important;
          font-weight: 500 !important;
          padding: 0.5rem 1rem !important;
          border-radius: 0.5rem !important;
          box-shadow: none !important;
          transition: all 0.15s ease !important;
        }
        
        .calendar-dark .fc-button:hover {
          background: #262626 !important;
          border-color: #404040 !important;
          color: #fff !important;
        }
        
        .calendar-dark .fc-button-active,
        .calendar-dark .fc-button:active {
          background: #fff !important;
          border-color: #fff !important;
          color: #000 !important;
        }
        
        .calendar-dark .fc-col-header-cell {
          padding: 0.75rem 0 !important;
          font-size: 0.6875rem !important;
          font-weight: 500 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          color: #737373 !important;
          border: none !important;
          background: transparent !important;
        }
        
        .calendar-dark .fc-daygrid-day {
          border-color: #262626 !important;
          transition: background-color 0.15s ease !important;
        }
        
        .calendar-dark .fc-daygrid-day:hover {
          background: #171717 !important;
        }
        
        .calendar-dark .fc-daygrid-day-number {
          font-size: 0.875rem !important;
          font-weight: 400 !important;
          color: #a3a3a3 !important;
          padding: 0.5rem !important;
        }
        
        .calendar-dark .fc-day-today {
          background: rgba(255, 255, 255, 0.05) !important;
        }
        
        .calendar-dark .fc-day-today .fc-daygrid-day-number {
          background: #fff !important;
          color: #000 !important;
          border-radius: 9999px !important;
          width: 1.75rem !important;
          height: 1.75rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0.25rem !important;
          padding: 0 !important;
        }
        
        .calendar-dark .fc-day-other .fc-daygrid-day-number {
          color: #525252 !important;
        }
        
        .calendar-dark .fc-scrollgrid {
          border: none !important;
        }
        
        .calendar-dark .fc-scrollgrid td:last-child {
          border-right: none !important;
        }
        
        .calendar-dark .fc-scrollgrid tr:last-child td {
          border-bottom: none !important;
        }
        
        /* Shared Styles */
        .calendar-wrapper .fc-today-button {
          text-transform: none !important;
        }
        
        .calendar-wrapper .fc-prev-button,
        .calendar-wrapper .fc-next-button {
          padding: 0.5rem 0.75rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        .calendar-wrapper .fc-prev-button {
          margin-right: 0.5rem !important;
        }
        
        .calendar-wrapper .fc-button-group {
          gap: 0.5rem !important;
        }
        
        .calendar-wrapper .fc-toolbar-chunk {
          display: flex !important;
          gap: 0.75rem !important;
        }
        
        .calendar-wrapper .fc-icon {
          font-size: 1rem !important;
          line-height: 1 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }
        
        .calendar-wrapper .fc-icon-chevron-left::before,
        .calendar-wrapper .fc-icon-chevron-right::before {
          font-family: inherit !important;
          font-weight: 400 !important;
        }
        
        .calendar-wrapper .fc-icon-chevron-left::before {
          content: '←' !important;
        }
        
        .calendar-wrapper .fc-icon-chevron-right::before {
          content: '→' !important;
        }
        
        .calendar-wrapper .fc-daygrid-event {
          border-radius: 0.375rem !important;
          border: none !important;
          margin: 1px 4px !important;
        }
        
        .calendar-wrapper .fc-daygrid-more-link {
          font-size: 0.6875rem !important;
          font-weight: 500 !important;
          color: #737373 !important;
          padding: 0.125rem 0.5rem !important;
        }
        
        .calendar-wrapper .fc-daygrid-more-link:hover {
          background: rgba(0,0,0,0.05) !important;
          border-radius: 0.25rem !important;
        }
        
        .calendar-dark .fc-daygrid-more-link:hover {
          color: #fff !important;
          background: #262626 !important;
        }
        
        .calendar-wrapper .fc-daygrid-body-unbalanced .fc-daygrid-day-events {
          min-height: 2rem !important;
        }
        
        .calendar-wrapper .fc-daygrid-day-frame {
          min-height: auto !important;
        }
        
        .calendar-wrapper .fc-scroller {
          overflow: hidden !important;
        }
      `}</style>
    </div>
  )
}
