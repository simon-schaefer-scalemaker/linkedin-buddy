import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { usePostsStore } from '@/lib/store'
import { PLATFORMS, PLATFORM_ORDER } from '@/lib/constants'
import { PlatformIcon } from '@/components/shared/platform-icon'
import type { PlatformId, Post } from '@/lib/types'
import { format, isToday, isTomorrow, addDays, startOfWeek, endOfWeek } from 'date-fns'
import { de } from 'date-fns/locale'
import { CalendarDays, Clock, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CalendarPage() {
  const navigate = useNavigate()
  const posts = usePostsStore((state) => state.posts)
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
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h1 className="text-[22px] font-medium text-gray-900">Content Kalender</h1>
          <p className="text-[13px] text-gray-400 mt-0.5">Plane und verwalte deine Posts</p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[20px] font-light text-gray-900">{stats.thisWeek}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Diese Woche</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-right">
            <p className="text-[20px] font-light text-gray-900">{stats.scheduled}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Geplant</p>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="text-right">
            <p className="text-[20px] font-light text-gray-900">{stats.published}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide">Veröffentlicht</p>
          </div>
        </div>
      </div>

      {/* Platform Filter Pills */}
      <div className="flex items-center gap-2 mb-3 shrink-0">
        {PLATFORM_ORDER.map(platform => {
          const isSelected = selectedPlatforms.includes(platform)
          const platformPosts = posts.filter(p => p.platform === platform && (p.scheduledFor || p.publishedAt)).length
          
          return (
            <button
              key={platform}
              onClick={() => togglePlatform(platform)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all",
                isSelected 
                  ? "text-white shadow-sm" 
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              )}
              style={isSelected ? { backgroundColor: PLATFORMS[platform].color } : undefined}
            >
              <PlatformIcon platform={platform} size="sm" className={isSelected ? 'text-white' : undefined} />
              {PLATFORMS[platform].name}
              <span className={cn(
                "text-[9px] px-1 py-0.5 rounded-full",
                isSelected ? "bg-white/20" : "bg-gray-200"
              )}>
                {platformPosts}
              </span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 flex-1 min-h-0">
        {/* Calendar - Main Content */}
        <div className="lg:col-span-3 flex flex-col min-h-0">
          <Card className="overflow-hidden flex-1 flex flex-col">
            <CardContent className="p-0 flex-1 flex flex-col min-h-0">
              <div className="calendar-wrapper p-3 flex-1 flex flex-col min-h-0">
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
        <div className="lg:col-span-1 flex flex-col gap-2 min-h-0 overflow-hidden">
          {/* Upcoming Posts Card */}
          <Card className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <CardContent className="p-3 flex flex-col min-h-0 overflow-hidden">
              <div className="flex items-center gap-2 mb-2 shrink-0">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <h3 className="text-[12px] font-medium text-gray-900">Nächste Posts</h3>
              </div>
              
              {upcomingPosts.length > 0 ? (
                <div className="space-y-1.5 overflow-y-auto flex-1 min-h-0">
                  {upcomingPosts.slice(0, 4).map(post => (
                    <button
                      key={post.id}
                      onClick={() => navigate(`/boards/${post.platform}/${post.id}`)}
                      className="w-full text-left group"
                    >
                      <div className="flex items-center gap-2 p-1.5 -mx-1.5 rounded-md transition-colors hover:bg-gray-50">
                        <div 
                          className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                          style={{ backgroundColor: PLATFORMS[post.platform].color + '15' }}
                        >
                          <PlatformIcon 
                            platform={post.platform} 
                            size="sm"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-gray-900 truncate">
                            {getPostTitle(post)}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {getDateLabel(post.scheduledFor!)} • {format(new Date(post.scheduledFor!), 'HH:mm', { locale: de })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 flex-1 flex flex-col items-center justify-center">
                  <CalendarDays className="h-6 w-6 text-gray-200 mb-1" />
                  <p className="text-[11px] text-gray-400">Keine geplanten Posts</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Platform Legend - Compact */}
          <Card className="shrink-0">
            <CardContent className="p-3">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                {PLATFORM_ORDER.map(platform => {
                  const count = posts.filter(p => p.platform === platform && (p.scheduledFor || p.publishedAt)).length
                  return (
                    <div key={platform} className="flex items-center gap-1.5">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: PLATFORMS[platform].color }}
                      />
                      <span className="text-[10px] text-gray-500">{PLATFORMS[platform].name} ({count})</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom Calendar Styles */}
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
          margin-bottom: 0.75rem !important;
        }
        
        .calendar-wrapper .fc-toolbar-title {
          font-size: 1.125rem !important;
          font-weight: 500 !important;
          color: #111827 !important;
        }
        
        .calendar-wrapper .fc-button {
          background: #f9fafb !important;
          border: 1px solid #e5e7eb !important;
          color: #374151 !important;
          font-size: 0.75rem !important;
          font-weight: 500 !important;
          padding: 0.5rem 0.875rem !important;
          border-radius: 0.5rem !important;
          box-shadow: none !important;
          transition: all 0.15s ease !important;
        }
        
        .calendar-wrapper .fc-button:hover {
          background: #f3f4f6 !important;
          border-color: #d1d5db !important;
        }
        
        .calendar-wrapper .fc-button-active,
        .calendar-wrapper .fc-button:active {
          background: #111827 !important;
          border-color: #111827 !important;
          color: white !important;
        }
        
        .calendar-wrapper .fc-today-button {
          text-transform: none !important;
        }
        
        .calendar-wrapper .fc-prev-button,
        .calendar-wrapper .fc-next-button {
          padding: 0.5rem 0.625rem !important;
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
        
        .calendar-wrapper .fc-col-header-cell {
          padding: 0.75rem 0 !important;
          font-size: 0.6875rem !important;
          font-weight: 500 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          color: #9ca3af !important;
          border: none !important;
          background: transparent !important;
        }
        
        .calendar-wrapper .fc-daygrid-day {
          border-color: #f3f4f6 !important;
          transition: background-color 0.15s ease !important;
        }
        
        .calendar-wrapper .fc-daygrid-day:hover {
          background: #fafafa !important;
        }
        
        .calendar-wrapper .fc-daygrid-day-number {
          font-size: 0.8125rem !important;
          font-weight: 400 !important;
          color: #374151 !important;
          padding: 0.5rem !important;
        }
        
        .calendar-wrapper .fc-day-today {
          background: #f0f9ff !important;
        }
        
        .calendar-wrapper .fc-day-today .fc-daygrid-day-number {
          background: #111827 !important;
          color: white !important;
          border-radius: 9999px !important;
          width: 1.75rem !important;
          height: 1.75rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 0.25rem !important;
          padding: 0 !important;
        }
        
        .calendar-wrapper .fc-day-other .fc-daygrid-day-number {
          color: #d1d5db !important;
        }
        
        .calendar-wrapper .fc-daygrid-event {
          border-radius: 0.375rem !important;
          border: none !important;
          margin: 1px 4px !important;
        }
        
        .calendar-wrapper .fc-daygrid-more-link {
          font-size: 0.6875rem !important;
          font-weight: 500 !important;
          color: #6b7280 !important;
          padding: 0.125rem 0.5rem !important;
        }
        
        .calendar-wrapper .fc-daygrid-more-link:hover {
          color: #374151 !important;
          background: #f3f4f6 !important;
          border-radius: 0.25rem !important;
        }
        
        .calendar-wrapper .fc-scrollgrid {
          border: none !important;
        }
        
        .calendar-wrapper .fc-scrollgrid td:last-child {
          border-right: none !important;
        }
        
        .calendar-wrapper .fc-scrollgrid tr:last-child td {
          border-bottom: none !important;
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
