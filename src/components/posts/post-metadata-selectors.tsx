/**
 * Selektoren für Post-Metadaten (Hook-Typ, Topic, Format)
 * Diese werden in den Post-Formularen verwendet für bessere AI-Analyse
 */

import { 
  HookType, 
  ContentTopic, 
  ContentFormat,
  HOOK_TYPES,
  CONTENT_TOPICS,
  CONTENT_FORMATS
} from '@/lib/types'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Sparkles } from 'lucide-react'

interface HookTypeSelectorProps {
  value?: HookType
  onChange: (value: HookType) => void
  className?: string
  showRecommendation?: string
}

export function HookTypeSelector({ value, onChange, className, showRecommendation }: HookTypeSelectorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
          Hook-Typ
        </Label>
        {showRecommendation && (
          <span className="text-[10px] text-neutral-500 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {showRecommendation}
          </span>
        )}
      </div>
      <Select value={value} onValueChange={(v) => onChange(v as HookType)}>
        <SelectTrigger className="h-10 text-sm border transition-all bg-[#252525] border-[#333] hover:border-neutral-500 text-neutral-200">
          <SelectValue placeholder="Wählen..." />
        </SelectTrigger>
        <SelectContent className="bg-[#252525] border-[#333]">
          {Object.entries(HOOK_TYPES).map(([key, data]) => (
            <SelectItem key={key} value={key} className="text-sm py-2.5 text-neutral-200 focus:bg-[#333] focus:text-white">
              <span className="flex items-center gap-2.5">
                <span className="text-base">{data.emoji}</span>
                <span className="font-medium">{data.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface ContentTopicSelectorProps {
  value?: ContentTopic
  onChange: (value: ContentTopic) => void
  className?: string
  showRecommendation?: string
}

export function ContentTopicSelector({ value, onChange, className, showRecommendation }: ContentTopicSelectorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
          Thema
        </Label>
        {showRecommendation && (
          <span className="text-[10px] text-neutral-500 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {showRecommendation}
          </span>
        )}
      </div>
      <Select value={value} onValueChange={(v) => onChange(v as ContentTopic)}>
        <SelectTrigger className="h-10 text-sm border transition-all bg-[#252525] border-[#333] hover:border-neutral-500 text-neutral-200">
          <SelectValue placeholder="Wählen..." />
        </SelectTrigger>
        <SelectContent className="bg-[#252525] border-[#333]">
          {Object.entries(CONTENT_TOPICS).map(([key, data]) => (
            <SelectItem key={key} value={key} className="text-sm py-2.5 text-neutral-200 focus:bg-[#333] focus:text-white">
              <span className="flex items-center gap-2.5">
                <span className="text-base">{data.emoji}</span>
                <span className="font-medium">{data.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface ContentFormatSelectorProps {
  value?: ContentFormat
  onChange: (value: ContentFormat) => void
  className?: string
  showRecommendation?: string
}

export function ContentFormatSelector({ value, onChange, className, showRecommendation }: ContentFormatSelectorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-medium text-neutral-400 flex items-center gap-1.5 uppercase tracking-wider">
          Format
        </Label>
        {showRecommendation && (
          <span className="text-[10px] text-neutral-500 flex items-center gap-1">
            <Sparkles className="h-3 w-3" />
            {showRecommendation}
          </span>
        )}
      </div>
      <Select value={value} onValueChange={(v) => onChange(v as ContentFormat)}>
        <SelectTrigger className="h-10 text-sm border transition-all bg-[#252525] border-[#333] hover:border-neutral-500 text-neutral-200">
          <SelectValue placeholder="Wählen..." />
        </SelectTrigger>
        <SelectContent className="bg-[#252525] border-[#333]">
          {Object.entries(CONTENT_FORMATS).map(([key, data]) => (
            <SelectItem key={key} value={key} className="text-sm py-2.5 text-neutral-200 focus:bg-[#333] focus:text-white">
              <span className="flex items-center gap-2.5">
                <span className="text-base">{data.emoji}</span>
                <span className="font-medium">{data.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

// Kompakte Version für alle drei Selektoren in einer Zeile
interface PostMetadataSelectorsProps {
  hookType?: HookType
  topic?: ContentTopic
  format?: ContentFormat
  onHookTypeChange: (value: HookType) => void
  onTopicChange: (value: ContentTopic) => void
  onFormatChange: (value: ContentFormat) => void
  recommendations?: {
    hookType?: string
    topic?: string
    format?: string
  }
  className?: string
}

export function PostMetadataSelectors({
  hookType,
  topic,
  format,
  onHookTypeChange,
  onTopicChange,
  onFormatChange,
  recommendations,
  className
}: PostMetadataSelectorsProps) {
  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      <HookTypeSelector
        value={hookType}
        onChange={onHookTypeChange}
        showRecommendation={recommendations?.hookType}
      />
      <ContentTopicSelector
        value={topic}
        onChange={onTopicChange}
        showRecommendation={recommendations?.topic}
      />
      <ContentFormatSelector
        value={format}
        onChange={onFormatChange}
        showRecommendation={recommendations?.format}
      />
    </div>
  )
}
