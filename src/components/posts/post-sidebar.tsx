import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { StatusSelect } from '@/components/shared/status-select'
import { TagSelect } from '@/components/shared/tag-select'
import { DateTimePicker } from '@/components/shared/date-picker'
import { PlatformIcon } from '@/components/shared/platform-icon'
import type { WorkflowStatusId, ContentTagId, PlatformId } from '@/lib/types'
import { PLATFORMS } from '@/lib/constants'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

interface PostSidebarProps {
  platform: PlatformId
  status: WorkflowStatusId
  tags: ContentTagId[]
  scheduledFor?: string
  createdAt: string
  updatedAt: string
  onStatusChange: (status: WorkflowStatusId) => void
  onTagsChange: (tags: ContentTagId[]) => void
  onScheduledForChange: (date: Date | undefined) => void
}

export function PostSidebar({
  platform,
  status,
  tags,
  scheduledFor,
  createdAt,
  updatedAt,
  onStatusChange,
  onTagsChange,
  onScheduledForChange,
}: PostSidebarProps) {
  const platformData = PLATFORMS[platform]

  return (
    <div className="w-80 space-y-4">
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
