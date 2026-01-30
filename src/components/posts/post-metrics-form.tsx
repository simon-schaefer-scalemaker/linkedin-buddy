import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { BarChart3, TrendingUp, Eye, Heart, MessageSquare, Share2, Bookmark, Clock, Users } from 'lucide-react'
import type { PlatformId, Post } from '@/lib/types'
import { format, addDays } from 'date-fns'
import { de } from 'date-fns/locale'

// Metric field configurations per platform
const PLATFORM_METRICS: Record<PlatformId, { key: string; label: string; icon: React.ElementType; placeholder: string }[]> = {
  linkedin: [
    { key: 'impressions', label: 'Impressionen', icon: Eye, placeholder: '0' },
    { key: 'likes', label: 'Reaktionen', icon: Heart, placeholder: '0' },
    { key: 'comments', label: 'Kommentare', icon: MessageSquare, placeholder: '0' },
    { key: 'shares', label: 'Reposts', icon: Share2, placeholder: '0' },
  ],
  youtube: [
    { key: 'views', label: 'Views', icon: Eye, placeholder: '0' },
    { key: 'likes', label: 'Likes', icon: Heart, placeholder: '0' },
    { key: 'comments', label: 'Kommentare', icon: MessageSquare, placeholder: '0' },
    { key: 'shares', label: 'Shares', icon: Share2, placeholder: '0' },
    { key: 'watchTime', label: 'Watch Time (min)', icon: Clock, placeholder: '0' },
    { key: 'subscribers', label: 'Neue Abos', icon: Users, placeholder: '0' },
  ],
  instagram: [
    { key: 'impressions', label: 'Impressionen', icon: Eye, placeholder: '0' },
    { key: 'reach', label: 'Reichweite', icon: TrendingUp, placeholder: '0' },
    { key: 'likes', label: 'Likes', icon: Heart, placeholder: '0' },
    { key: 'comments', label: 'Kommentare', icon: MessageSquare, placeholder: '0' },
    { key: 'saves', label: 'Saves', icon: Bookmark, placeholder: '0' },
    { key: 'shares', label: 'Shares', icon: Share2, placeholder: '0' },
  ],
  skool: [
    { key: 'views', label: 'Views', icon: Eye, placeholder: '0' },
    { key: 'likes', label: 'Likes', icon: Heart, placeholder: '0' },
    { key: 'comments', label: 'Kommentare', icon: MessageSquare, placeholder: '0' },
  ],
}

const MEASUREMENT_PERIODS = [
  { value: '1', label: 'Nach 24 Stunden' },
  { value: '2', label: 'Nach 48 Stunden' },
  { value: '7', label: 'Nach 7 Tagen' },
  { value: '14', label: 'Nach 14 Tagen' },
  { value: '30', label: 'Nach 30 Tagen' },
]

interface PostMetricsFormProps {
  platform: PlatformId
  post: Post
  onMetricsChange: (metrics: Record<string, number>, measuredAt: string, measurementPeriod: number) => void
}

export function PostMetricsForm({ platform, post, onMetricsChange }: PostMetricsFormProps) {
  const existingMetrics = (post.metrics || {}) as Record<string, number | undefined>
  const [metrics, setMetrics] = useState<Record<string, string>>(
    Object.fromEntries(
      PLATFORM_METRICS[platform].map(m => [m.key, existingMetrics[m.key]?.toString() || ''])
    )
  )
  const [measurementPeriod, setMeasurementPeriod] = useState('7')
  const [hasChanges, setHasChanges] = useState(false)
  
  const publishedAt = post.publishedAt ? new Date(post.publishedAt) : new Date()
  const measuredAt = addDays(publishedAt, parseInt(measurementPeriod))
  
  const handleMetricChange = (key: string, value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '')
    setMetrics(prev => ({ ...prev, [key]: numericValue }))
    setHasChanges(true)
  }
  
  const handleSave = () => {
    const numericMetrics = Object.fromEntries(
      Object.entries(metrics).map(([k, v]) => [k, parseInt(v) || 0])
    )
    onMetricsChange(numericMetrics, measuredAt.toISOString(), parseInt(measurementPeriod))
    setHasChanges(false)
  }
  
  // Calculate engagement rate
  const calculateEngagementRate = (): string => {
    const impressions = parseInt(metrics.impressions || metrics.views || '0') || 0
    if (impressions === 0) return '—'
    
    let engagements = 0
    if (platform === 'linkedin') {
      engagements = (parseInt(metrics.likes || '0') || 0) + 
                    (parseInt(metrics.comments || '0') || 0) + 
                    (parseInt(metrics.shares || '0') || 0)
    } else if (platform === 'youtube') {
      engagements = (parseInt(metrics.likes || '0') || 0) + 
                    (parseInt(metrics.comments || '0') || 0)
    } else if (platform === 'instagram') {
      engagements = (parseInt(metrics.likes || '0') || 0) + 
                    (parseInt(metrics.comments || '0') || 0) + 
                    (parseInt(metrics.saves || '0') || 0)
    } else {
      engagements = (parseInt(metrics.likes || '0') || 0) + 
                    (parseInt(metrics.comments || '0') || 0)
    }
    
    const rate = (engagements / impressions) * 100
    return `${rate.toFixed(2)}%`
  }
  
  const platformMetrics = PLATFORM_METRICS[platform]
  const hasAnyMetrics = Object.values(metrics).some(v => v && parseInt(v) > 0)

  return (
    <Card className="border-green-200 bg-green-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-green-600" />
          <CardTitle className="text-[13px] text-green-800">Performance</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        {/* Measurement Period */}
        <div>
          <Label className="text-[11px] text-neutral-500 mb-1.5 block">Gemessen</Label>
          <Select value={measurementPeriod} onValueChange={(v) => { setMeasurementPeriod(v); setHasChanges(true); }}>
            <SelectTrigger className="h-8 text-[12px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MEASUREMENT_PERIODS.map(period => (
                <SelectItem key={period.value} value={period.value} className="text-[12px]">
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {post.publishedAt && (
            <p className="text-[10px] text-neutral-500 mt-1">
              = {format(measuredAt, "d. MMM yyyy", { locale: de })}
            </p>
          )}
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2">
          {platformMetrics.map(metric => {
            const Icon = metric.icon
            return (
              <div key={metric.key}>
                <Label className="text-[10px] text-neutral-500 mb-1 flex items-center gap-1">
                  <Icon className="h-3 w-3" />
                  {metric.label}
                </Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={metrics[metric.key] || ''}
                  onChange={(e) => handleMetricChange(metric.key, e.target.value)}
                  placeholder={metric.placeholder}
                  className="h-8 text-[12px]"
                />
              </div>
            )
          })}
        </div>

        {/* Engagement Rate (calculated) */}
        {hasAnyMetrics && (
          <div className="pt-2 border-t border-green-200">
            <div className="flex justify-between items-center">
              <span className="text-[11px] text-neutral-500">Engagement Rate</span>
              <span className="text-[13px] font-medium text-green-700">{calculateEngagementRate()}</span>
            </div>
          </div>
        )}

        {/* Save Button */}
        {hasChanges && (
          <Button size="sm" className="w-full" onClick={handleSave}>
            Metriken speichern
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
