import { useState } from 'react'
import { Plus, X, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface ListInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  addLabel?: string
  className?: string
  maxItems?: number
}

export function ListInput({
  value,
  onChange,
  placeholder = "Neuen Eintrag hinzufügen...",
  addLabel = "Hinzufügen",
  className,
  maxItems
}: ListInputProps) {
  const [newItem, setNewItem] = useState('')

  const addItem = () => {
    if (newItem.trim() && (!maxItems || value.length < maxItems)) {
      onChange([...value, newItem.trim()])
      setNewItem('')
    }
  }

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, newValue: string) => {
    const updated = [...value]
    updated[index] = newValue
    onChange(updated)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addItem()
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Existing Items */}
      {value.map((item, index) => (
        <div key={index} className="flex items-center gap-2 group">
          <GripVertical className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
          <Input
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            className="flex-1"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeItem(index)}
            className="h-8 w-8 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {/* Add New Item */}
      {(!maxItems || value.length < maxItems) && (
        <div className="flex items-center gap-2">
          <div className="w-4" /> {/* Spacer for alignment */}
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={addItem}
            disabled={!newItem.trim()}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            {addLabel}
          </Button>
        </div>
      )}

      {/* Max Items Info */}
      {maxItems && (
        <p className="text-[11px] text-gray-400 pl-6">
          {value.length}/{maxItems} Einträge
        </p>
      )}
    </div>
  )
}

interface BulletListInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function BulletListInput({
  value,
  onChange,
  placeholder = "Bullet Point hinzufügen...",
  className
}: BulletListInputProps) {
  const [newItem, setNewItem] = useState('')

  const addItem = () => {
    if (newItem.trim()) {
      onChange([...value, newItem.trim()])
      setNewItem('')
    }
  }

  const removeItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addItem()
    }
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {/* Existing Items */}
      {value.map((item, index) => (
        <div key={index} className="flex items-start gap-2 group">
          <span className="text-gray-400 mt-2">•</span>
          <span className="flex-1 py-1.5 text-[13px] text-gray-700">{item}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeItem(index)}
            className="h-6 w-6 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {/* Add New Item */}
      <div className="flex items-center gap-2">
        <span className="text-gray-300">•</span>
        <Input
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 h-8 text-[13px]"
        />
        <Button
          variant="ghost"
          size="sm"
          onClick={addItem}
          disabled={!newItem.trim()}
          className="h-8 px-2 text-gray-400"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
