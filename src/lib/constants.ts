import type { Platform, WorkflowStatus, ContentTag, PlatformId, WorkflowStatusId, ContentTagId } from './types'

// Platforms
export const PLATFORMS: Record<PlatformId, Platform> = {
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    bgColor: 'bg-[#0A66C2]',
    icon: 'linkedin'
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    bgColor: 'bg-[#FF0000]',
    icon: 'youtube'
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    bgColor: 'bg-[#E4405F]',
    icon: 'instagram'
  },
  skool: {
    id: 'skool',
    name: 'Skool',
    color: '#CA8A04',
    bgColor: 'bg-yellow-600',
    icon: 'graduation-cap'
  }
}

// Explicit platform order - use this instead of Object.keys(PLATFORMS)
export const PLATFORM_ORDER: PlatformId[] = ['linkedin', 'youtube', 'instagram', 'skool']

export const PLATFORM_LIST: Platform[] = PLATFORM_ORDER.map(id => PLATFORMS[id])

// Workflow Statuses
export const WORKFLOW_STATUSES: Record<WorkflowStatusId, WorkflowStatus> = {
  idea: {
    id: 'idea',
    name: 'Idee',
    emoji: '💡',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  draft: {
    id: 'draft',
    name: 'Entwurf',
    emoji: '✏️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  review: {
    id: 'review',
    name: 'Review',
    emoji: '👀',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  },
  scheduled: {
    id: 'scheduled',
    name: 'Geplant',
    emoji: '📅',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  published: {
    id: 'published',
    name: 'Veröffentlicht',
    emoji: '✅',
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  archived: {
    id: 'archived',
    name: 'Archiviert',
    emoji: '📦',
    color: 'text-gray-400',
    bgColor: 'bg-gray-50'
  }
}

export const WORKFLOW_STATUS_LIST: WorkflowStatus[] = Object.values(WORKFLOW_STATUSES)

// Kanban Column Order
export const KANBAN_COLUMNS: WorkflowStatusId[] = ['idea', 'draft', 'review', 'scheduled', 'published']

// Content Tags
export const CONTENT_TAGS: Record<ContentTagId, ContentTag> = {
  leadmagnet: {
    id: 'leadmagnet',
    name: 'Leadmagnet',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50'
  },
  video: {
    id: 'video',
    name: 'Video',
    color: 'text-red-700',
    bgColor: 'bg-red-50'
  },
  gif: {
    id: 'gif',
    name: 'GIF',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50'
  },
  carousel: {
    id: 'carousel',
    name: 'Carousel',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50'
  },
  story: {
    id: 'story',
    name: 'Story',
    color: 'text-pink-700',
    bgColor: 'bg-pink-50'
  },
  reel: {
    id: 'reel',
    name: 'Reel',
    color: 'text-orange-700',
    bgColor: 'bg-orange-50'
  },
  short: {
    id: 'short',
    name: 'Short',
    color: 'text-red-700',
    bgColor: 'bg-red-50'
  },
  'long-form': {
    id: 'long-form',
    name: 'Long-Form',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50'
  },
  thread: {
    id: 'thread',
    name: 'Thread',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50'
  },
  poll: {
    id: 'poll',
    name: 'Poll',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50'
  },
  event: {
    id: 'event',
    name: 'Event',
    color: 'text-violet-700',
    bgColor: 'bg-violet-50'
  }
}

export const CONTENT_TAG_LIST: ContentTag[] = Object.values(CONTENT_TAGS)

// Tracked Content Statuses
export const TRACKED_CONTENT_STATUSES = {
  new: { id: 'new', name: 'Neu', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  backlog: { id: 'backlog', name: 'Backlog', color: 'text-gray-600', bgColor: 'bg-gray-50' },
  repurpose: { id: 'repurpose', name: 'Repurpose', color: 'text-purple-600', bgColor: 'bg-purple-50' },
  done: { id: 'done', name: 'Erledigt', color: 'text-green-600', bgColor: 'bg-green-50' },
  skipped: { id: 'skipped', name: 'Übersprungen', color: 'text-gray-400', bgColor: 'bg-gray-50' }
} as const
