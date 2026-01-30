import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Linkedin, 
  Youtube, 
  Instagram, 
  GraduationCap, 
  ChevronRight, 
  ChevronLeft,
  SkipForward,
  Check,
  X
} from 'lucide-react'
import { useMetricsStore } from '@/stores/metricsStore'
import { getWeekNumber, getWeekStart, formatWeek, getWeekRange } from '@/lib/utils'
import type { WeeklyCheckInData } from '@/lib/types'
import { cn } from '@/lib/utils'

interface WeeklyCheckInWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STEPS = ['linkedin', 'youtube', 'instagram', 'skool', 'summary'] as const
type Step = typeof STEPS[number]

const PLATFORM_CONFIG = {
  linkedin: {
    name: 'LinkedIn',
    icon: Linkedin,
    color: '#0A66C2',
    fields: [
      { key: 'followers', label: 'Follower', placeholder: 'z.B. 5.420' },
      { key: 'impressions', label: 'Impressionen', placeholder: 'z.B. 125.000' },
      { key: 'engagement', label: 'Engagement (Reaktionen + Kommentare)', placeholder: 'z.B. 3.500' },
      { key: 'profileViews', label: 'Profilaufrufe', placeholder: 'z.B. 890' },
    ]
  },
  youtube: {
    name: 'YouTube',
    icon: Youtube,
    color: '#FF0000',
    fields: [
      { key: 'subscribers', label: 'Abonnenten', placeholder: 'z.B. 12.500' },
      { key: 'views', label: 'Views', placeholder: 'z.B. 45.000' },
      { key: 'watchTimeHours', label: 'Wiedergabezeit (Stunden)', placeholder: 'z.B. 1.250' },
      { key: 'avgViewDurationSeconds', label: 'Ø Wiedergabedauer (Sekunden)', placeholder: 'z.B. 245' },
    ]
  },
  instagram: {
    name: 'Instagram',
    icon: Instagram,
    color: '#E4405F',
    fields: [
      { key: 'followers', label: 'Follower', placeholder: 'z.B. 8.900' },
      { key: 'reach', label: 'Reach', placeholder: 'z.B. 35.000' },
      { key: 'engagement', label: 'Engagement (Likes + Kommentare)', placeholder: 'z.B. 2.100' },
      { key: 'saves', label: 'Saves', placeholder: 'z.B. 450' },
      { key: 'profileVisits', label: 'Profilbesuche', placeholder: 'z.B. 670' },
    ]
  },
  skool: {
    name: 'Skool',
    icon: GraduationCap,
    color: '#FACC15',
    fields: [
      { key: 'members', label: 'Members', placeholder: 'z.B. 1.250' },
      { key: 'activeMembers', label: 'Aktive Members', placeholder: 'z.B. 340' },
      { key: 'postViews', label: 'Post Views', placeholder: 'z.B. 5.600' },
      { key: 'comments', label: 'Kommentare', placeholder: 'z.B. 89' },
    ]
  }
}

export function WeeklyCheckInWizard({ open, onOpenChange }: WeeklyCheckInWizardProps) {
  const saveWeeklyCheckIn = useMetricsStore((state) => state.saveWeeklyCheckIn)
  
  const now = new Date()
  const year = now.getFullYear()
  const weekNumber = getWeekNumber(now)
  const weekStart = getWeekStart(now)
  
  const [currentStep, setCurrentStep] = useState<Step>('linkedin')
  const [data, setData] = useState<WeeklyCheckInData>({
    year,
    weekNumber,
    weekStart,
    linkedin: { skipped: false },
    youtube: { skipped: false },
    instagram: { skipped: false },
    skool: { skipped: false },
  })
  
  const currentStepIndex = STEPS.indexOf(currentStep)
  const isPlatformStep = currentStep !== 'summary'
  
  const handleFieldChange = (platform: keyof typeof PLATFORM_CONFIG, field: string, value: string) => {
    const numValue = value === '' ? undefined : parseInt(value.replace(/\D/g, ''), 10)
    setData(prev => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: numValue,
        skipped: false,
      }
    }))
  }
  
  const handleSkip = () => {
    if (isPlatformStep) {
      setData(prev => ({
        ...prev,
        [currentStep]: { skipped: true }
      }))
    }
    goNext()
  }
  
  const goNext = () => {
    const nextIndex = currentStepIndex + 1
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex])
    }
  }
  
  const goBack = () => {
    const prevIndex = currentStepIndex - 1
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex])
    }
  }
  
  const handleSave = () => {
    saveWeeklyCheckIn(data)
    onOpenChange(false)
    // Reset for next time
    setCurrentStep('linkedin')
    setData({
      year,
      weekNumber,
      weekStart,
      linkedin: { skipped: false },
      youtube: { skipped: false },
      instagram: { skipped: false },
      skool: { skipped: false },
    })
  }
  
  const formatInputValue = (value: number | undefined): string => {
    if (value === undefined) return ''
    return value.toLocaleString('de-DE')
  }
  
  const renderPlatformForm = (platform: keyof typeof PLATFORM_CONFIG) => {
    const config = PLATFORM_CONFIG[platform]
    const Icon = config.icon
    const platformData = data[platform]
    
    if (platformData.skipped) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div 
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 opacity-30"
            style={{ backgroundColor: config.color }}
          >
            <Icon className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-400 text-[14px]">Diese Plattform wird übersprungen</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-4"
            onClick={() => setData(prev => ({ ...prev, [platform]: { skipped: false } }))}
          >
            Doch eintragen
          </Button>
        </div>
      )
    }
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-6">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: config.color }}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-[16px] font-medium text-gray-900">{config.name}</h3>
            <p className="text-[12px] text-gray-400">Trage deine KPIs für diese Woche ein</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {config.fields.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <Label className="text-[12px] text-gray-600">{field.label}</Label>
              <Input
                type="text"
                placeholder={field.placeholder}
                value={formatInputValue((platformData as Record<string, unknown>)[field.key] as number | undefined)}
                onChange={(e) => handleFieldChange(platform, field.key, e.target.value)}
                className="text-[14px]"
              />
            </div>
          ))}
        </div>
      </div>
    )
  }
  
  const renderSummary = () => {
    const platforms = ['linkedin', 'youtube', 'instagram', 'skool'] as const
    
    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
            <Check className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-[16px] font-medium text-gray-900">Zusammenfassung</h3>
          <p className="text-[12px] text-gray-400">{formatWeek(year, weekNumber)} • {getWeekRange(weekStart)}</p>
        </div>
        
        <div className="space-y-2">
          {platforms.map((platform) => {
            const config = PLATFORM_CONFIG[platform]
            const Icon = config.icon
            const platformData = data[platform]
            const isSkipped = platformData.skipped
            
            return (
              <Card key={platform} className={cn(isSkipped && "opacity-50")}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: config.color }}
                    >
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-[13px] font-medium text-gray-900">{config.name}</span>
                  </div>
                  {isSkipped ? (
                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                      <X className="h-3 w-3" /> Übersprungen
                    </span>
                  ) : (
                    <span className="text-[11px] text-green-600 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Eingetragen
                    </span>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-[18px]">
            Wöchentlicher Check-in
          </DialogTitle>
          <p className="text-[13px] text-gray-400">
            {formatWeek(year, weekNumber)} • {getWeekRange(weekStart)}
          </p>
        </DialogHeader>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 py-4">
          {STEPS.slice(0, 4).map((step, index) => {
            const config = PLATFORM_CONFIG[step as keyof typeof PLATFORM_CONFIG]
            const Icon = config.icon
            const isActive = currentStepIndex === index
            const isComplete = currentStepIndex > index
            const isSkipped = data[step as keyof typeof PLATFORM_CONFIG].skipped
            
            return (
              <div key={step} className="flex items-center">
                <button
                  onClick={() => setCurrentStep(step)}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                    isActive && "ring-2 ring-offset-2",
                    isComplete && !isSkipped && "bg-green-100",
                    isComplete && isSkipped && "bg-gray-100",
                    !isActive && !isComplete && "bg-gray-100"
                  )}
                  style={isActive ? { 
                    backgroundColor: config.color, 
                    ringColor: config.color 
                  } : undefined}
                >
                  {isComplete && !isSkipped ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : isComplete && isSkipped ? (
                    <SkipForward className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Icon className={cn(
                      "h-4 w-4",
                      isActive ? "text-white" : "text-gray-400"
                    )} />
                  )}
                </button>
                {index < 3 && (
                  <div className={cn(
                    "w-8 h-0.5 mx-1",
                    isComplete ? "bg-green-200" : "bg-gray-200"
                  )} />
                )}
              </div>
            )
          })}
        </div>
        
        {/* Content */}
        <div className="min-h-[280px] py-2">
          {isPlatformStep ? renderPlatformForm(currentStep as keyof typeof PLATFORM_CONFIG) : renderSummary()}
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            disabled={currentStepIndex === 0}
            className="text-[13px]"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Zurück
          </Button>
          
          <div className="flex items-center gap-2">
            {isPlatformStep && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="text-[13px] text-gray-500"
              >
                <SkipForward className="h-4 w-4 mr-1" />
                Überspringen
              </Button>
            )}
            
            {currentStep === 'summary' ? (
              <Button size="sm" onClick={handleSave} className="text-[13px]">
                <Check className="h-4 w-4 mr-1" />
                Speichern
              </Button>
            ) : (
              <Button size="sm" onClick={goNext} className="text-[13px]">
                Weiter
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
