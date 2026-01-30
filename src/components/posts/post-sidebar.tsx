import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { StatusSelect } from '@/components/shared/status-select'
import { TagSelect } from '@/components/shared/tag-select'
import { DateTimePicker } from '@/components/shared/date-picker'
import { PlatformIcon } from '@/components/shared/platform-icon'
import { PostMetricsForm } from './post-metrics-form'
import type { WorkflowStatusId, ContentTagId, PlatformId, Post } from '@/lib/types'
import { PLATFORMS } from '@/lib/constants'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Trophy, TrendingDown, Minus, Sparkles, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type PerformanceRating = 'winner' | 'loser' | 'average' | null

interface PostSidebarProps {
  platform: PlatformId
  status: WorkflowStatusId
  tags: ContentTagId[]
  scheduledFor?: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
  post?: Post
  performanceRating?: PerformanceRating
  learning?: string
  isGeneratingLearning?: boolean
  onStatusChange: (status: WorkflowStatusId) => void
  onTagsChange: (tags: ContentTagId[]) => void
  onScheduledForChange: (date: Date | undefined) => void
  onMetricsChange?: (metrics: Record<string, number>, measuredAt: string, measurementPeriod: number) => void
  onPerformanceRatingChange?: (rating: PerformanceRating) => void
  onLearningChange?: (learning: string) => void
  onGenerateLearning?: () => void
}

export function PostSidebar({
  platform,
  status,
  tags,
  scheduledFor,
  createdAt,
  updatedAt,
  publishedAt,
  post,
  performanceRating,
  learning,
  isGeneratingLearning,
  onStatusChange,
  onTagsChange,
  onScheduledForChange,
  onMetricsChange,
  onPerformanceRatingChange,
  onLearningChange,
  onGenerateLearning,
}: PostSidebarProps) {
  const platformData = PLATFORMS[platform]
  const showMetrics = status === 'published' && post && onMetricsChange
  const showAnalysis = status === 'published' && onPerformanceRatingChange

  return (
    <div className="w-80 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)]">
      {/* Platform Info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <PlatformIcon platform={platform} showBackground size="md" />
            <div>
              <p className="text-[14px] font-medium text-gray-900">{platformData.name}</p>
              <p className="text-[12px] text-gray-400">Post Editor</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px]">Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <StatusSelect
            value={status}
            onValueChange={onStatusChange}
          />
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px]">Tags</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <TagSelect
            value={tags}
            onValueChange={onTagsChange}
          />
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px]">Veröffentlichung</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <div>
            <Label className="text-[12px] text-gray-500">Geplant für</Label>
            <DateTimePicker
              date={scheduledFor ? new Date(scheduledFor) : undefined}
              onSelect={onScheduledForChange}
              placeholder="Datum & Zeit wählen"
              className="mt-1.5"
            />
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics - only shown when published */}
      {showMetrics && (
        <PostMetricsForm
          platform={platform}
          post={post}
          onMetricsChange={onMetricsChange}
        />
      )}

      {/* Post Analysis - only shown when published */}
      {showAnalysis && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[13px] flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Post-Analyse
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* Winner/Loser Rating */}
            <div className="space-y-2">
              <Label className="text-[12px] text-gray-500">Performance-Bewertung</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onPerformanceRatingChange?.('winner')}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-all text-[11px] font-medium",
                    performanceRating === 'winner'
                      ? "bg-green-50 border-green-300 text-green-700"
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  <Trophy className="h-4 w-4" />
                  Winner
                </button>
                <button
                  onClick={() => onPerformanceRatingChange?.('average')}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-all text-[11px] font-medium",
                    performanceRating === 'average'
                      ? "bg-gray-100 border-gray-300 text-gray-700"
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  <Minus className="h-4 w-4" />
                  Normal
                </button>
                <button
                  onClick={() => onPerformanceRatingChange?.('loser')}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-all text-[11px] font-medium",
                    performanceRating === 'loser'
                      ? "bg-red-50 border-red-300 text-red-700"
                      : "bg-white border-gray-200 text-gray-500 hover:border-gray-300"
                  )}
                >
                  <TrendingDown className="h-4 w-4" />
                  Loser
                </button>
              </div>
            </div>

            {/* Learning Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[12px] text-gray-500">
                  Learning: Was hat {performanceRating === 'winner' ? 'funktioniert' : performanceRating === 'loser' ? 'nicht funktioniert' : 'du gelernt'}?
                </Label>
                {performanceRating && onGenerateLearning && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onGenerateLearning}
                    disabled={isGeneratingLearning}
                    className="h-6 px-2 text-[10px] text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                  >
                    {isGeneratingLearning ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Analysiere...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 mr-1" />
                        AI analysieren
                      </>
                    )}
                  </Button>
                )}
              </div>
              <Textarea
                value={learning || ''}
                onChange={(e) => onLearningChange?.(e.target.value)}
                placeholder={
                  performanceRating === 'winner' 
                    ? "z.B. 'Der Hook mit konkreten Zahlen hat sofort Aufmerksamkeit erzeugt...'"
                    : performanceRating === 'loser'
                    ? "z.B. 'Zu generisches Thema, keine klare Zielgruppe...'"
                    : "Dokumentiere deine Erkenntnisse..."
                }
                className="min-h-[80px] text-[12px] resize-none"
              />
              {!performanceRating && (
                <p className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded">
                  Wähle erst eine Performance-Bewertung, um AI-Analyse zu aktivieren
                </p>
              )}
            </div>

            {performanceRating && learning && (
              <p className="text-[10px] text-green-600 bg-green-50 p-2 rounded">
                ✓ Learning gespeichert - wird für AI-Hypothesen genutzt
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Meta Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-[13px]">Info</CardTitle>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <div className="flex justify-between text-[12px]">
            <span className="text-gray-400">Erstellt</span>
            <span className="text-gray-600">
              {format(new Date(createdAt), "d. MMM yyyy, HH:mm", { locale: de })}
            </span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-gray-400">Aktualisiert</span>
            <span className="text-gray-600">
              {format(new Date(updatedAt), "d. MMM yyyy, HH:mm", { locale: de })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
