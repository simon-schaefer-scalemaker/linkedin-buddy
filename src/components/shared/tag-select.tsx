import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { CONTENT_TAGS, CONTENT_TAG_LIST } from '@/lib/constants'
import type { ContentTagId } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TagSelectProps {
  value: ContentTagId[]
  onValueChange: (value: ContentTagId[]) => void
  className?: string
}

export function TagSelect({ value, onValueChange, className }: TagSelectProps) {
  const [open, setOpen] = useState(false)

  const toggleTag = (tagId: ContentTagId) => {
    if (value.includes(tagId)) {
      onValueChange(value.filter(id => id !== tagId))
    } else {
      onValueChange([...value, tagId])
    }
  }

  const removeTag = (tagId: ContentTagId) => {
    onValueChange(value.filter(id => id !== tagId))
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-1.5">
        {value.map(tagId => {
          const tag = CONTENT_TAGS[tagId]
          return (
            <span
              key={tagId}
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium",
                tag.bgColor,
                tag.color
              )}
            >
              {tag.name}
              <button
                onClick={() => removeTag(tagId)}
                className="hover:opacity-70 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )
        })}
        
        {/* Add Tag Button */}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[11px] text-gray-500"
            >
              <Plus className="h-3 w-3 mr-1" />
              Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="space-y-1">
              {CONTENT_TAG_LIST.map(tag => {
                const isSelected = value.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[12px] transition-colors",
                      isSelected 
                        ? cn(tag.bgColor, tag.color) 
                        : "hover:bg-gray-100 text-gray-700"
                    )}
                  >
                    {tag.name}
                    {isSelected && <X className="h-3 w-3" />}
                  </button>
                )
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}

interface TagBadgeProps {
  tag: ContentTagId
  className?: string
  onRemove?: () => void
}

export function TagBadge({ tag, className, onRemove }: TagBadgeProps) {
  const tagData = CONTENT_TAGS[tag]
  
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium",
        tagData.bgColor,
        tagData.color,
        className
      )}
    >
      {tagData.name}
      {onRemove && (
        <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}
