import { Linkedin, Youtube, Instagram, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlatformId } from '@/lib/types'
import { PLATFORMS } from '@/lib/constants'

interface PlatformIconProps {
  platform: PlatformId
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showBackground?: boolean
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6'
}

const bgSizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-10 w-10'
}

const iconComponents = {
  linkedin: Linkedin,
  youtube: Youtube,
  instagram: Instagram,
  skool: GraduationCap
}

export function PlatformIcon({ platform, size = 'md', className, showBackground = false }: PlatformIconProps) {
  const Icon = iconComponents[platform]
  const platformData = PLATFORMS[platform]
  
  if (showBackground) {
    return (
      <div 
        className={cn(
          "rounded-lg flex items-center justify-center",
          bgSizeClasses[size],
          className
        )}
        style={{ backgroundColor: platformData.color }}
      >
        <Icon className={cn(sizeClasses[size], "text-white")} />
      </div>
    )
  }
  
  // Only apply platform color if no custom color class is provided
  const hasCustomColor = className?.includes('text-')
  
  return (
    <Icon 
      className={cn(sizeClasses[size], className)} 
      style={hasCustomColor ? undefined : { color: platformData.color }}
    />
  )
}

interface PlatformBadgeProps {
  platform: PlatformId
  className?: string
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  const platformData = PLATFORMS[platform]
  
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium text-white",
        className
      )}
      style={{ backgroundColor: platformData.color }}
    >
      <PlatformIcon platform={platform} size="sm" className="text-white" />
      {platformData.name}
    </span>
  )
}
