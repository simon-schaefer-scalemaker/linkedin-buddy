import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WORKFLOW_STATUSES, WORKFLOW_STATUS_LIST } from '@/lib/constants'
import type { WorkflowStatusId } from '@/lib/types'
import { cn } from '@/lib/utils'

interface StatusSelectProps {
  value: WorkflowStatusId
  onValueChange: (value: WorkflowStatusId) => void
  className?: string
  excludeStatuses?: WorkflowStatusId[]
}

export function StatusSelect({ 
  value, 
  onValueChange, 
  className,
  excludeStatuses = [] 
}: StatusSelectProps) {
  const currentStatus = WORKFLOW_STATUSES[value]
  const availableStatuses = WORKFLOW_STATUS_LIST.filter(
    status => !excludeStatuses.includes(status.id)
  )

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className={cn("w-full", className)}>
        <SelectValue>
          <span className="flex items-center gap-2">
            <span>{currentStatus.emoji}</span>
            <span>{currentStatus.name}</span>
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableStatuses.map((status) => (
          <SelectItem key={status.id} value={status.id}>
            <span className="flex items-center gap-2">
              <span>{status.emoji}</span>
              <span>{status.name}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

interface StatusBadgeProps {
  status: WorkflowStatusId
  className?: string
  showEmoji?: boolean
}

export function StatusBadge({ status, className, showEmoji = true }: StatusBadgeProps) {
  const statusData = WORKFLOW_STATUSES[status]
  
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium",
        statusData.bgColor,
        statusData.color,
        className
      )}
    >
      {showEmoji && <span>{statusData.emoji}</span>}
      {statusData.name}
    </span>
  )
}
