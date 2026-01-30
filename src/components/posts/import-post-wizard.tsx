import { useState } from 'react'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  Linkedin, 
  Youtube, 
  Instagram, 
  GraduationCap,
  CalendarIcon,
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  MousePointer,
  Clock,
  Users,
  Bookmark,
  TrendingUp
} from 'lucide-react'
import { usePostsStore } from '@/lib/store'
import { PLATFORMS } from '@/lib/constants'
import type { PlatformId, LinkedInPost, YouTubePost, InstagramPost, SkoolPost, Post } from '@/lib/types'
import { cn } from '@/lib/utils'

const platformIcons = {
  linkedin: Linkedin,
  youtube: Youtube,
  instagram: Instagram,
  skool: GraduationCap
}

type Step = 'platform' | 'content' | 'metrics' | 'done'

interface ImportPostWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportPostWizard({ open, onOpenChange }: ImportPostWizardProps) {
  const addPost = usePostsStore((state) => state.addPost)
  
  const [step, setStep] = useState<Step>('platform')
  const [platform, setPlatform] = useState<PlatformId | null>(null)
  const [publishedAt, setPublishedAt] = useState<Date>(new Date())
  
  // LinkedIn content
  const [linkedInData, setLinkedInData] = useState({
    hook: '',
    text: '',
    cta: ''
  })
  
  // YouTube content
  const [youtubeData, setYoutubeData] = useState({
    title: '',
    description: '',
    isShort: false
  })
  
  // Instagram content
  const [instagramData, setInstagramData] = useState({
    caption: '',
    type: 'post' as 'post' | 'reel' | 'story' | 'carousel'
  })
  
  // Skool content
  const [skoolData, setSkoolData] = useState({
    title: '',
    body: '',
    category: ''
  })
  
  // Metrics
  const [metrics, setMetrics] = useState<Record<string, string>>({})
  
  const handleReset = () => {
    setStep('platform')
    setPlatform(null)
    setPublishedAt(new Date())
    setLinkedInData({ hook: '', text: '', cta: '' })
    setYoutubeData({ title: '', description: '', isShort: false })
    setInstagramData({ caption: '', type: 'post' })
    setSkoolData({ title: '', body: '', category: '' })
    setMetrics({})
  }
  
  const handleClose = () => {
    onOpenChange(false)
    setTimeout(handleReset, 300)
  }
  
  const handleSave = () => {
    if (!platform) return
    
    const id = `${platform.slice(0, 2)}-import-${Date.now()}`
    const basePost = {
      id,
      platform,
      status: 'published' as const,
      tags: [],
      createdAt: publishedAt.toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: publishedAt.toISOString(),
    }
    
    // Parse metrics
    const parsedMetrics: Record<string, number> = {}
    Object.entries(metrics).forEach(([key, value]) => {
      const num = parseInt(value)
      if (!isNaN(num)) parsedMetrics[key] = num
    })
    
    let newPost: Post
    
    switch (platform) {
      case 'linkedin':
        newPost = {
          ...basePost,
          platform: 'linkedin',
          content: {
            hook: linkedInData.hook,
            text: linkedInData.text,
            cta: linkedInData.cta
          },
          metrics: parsedMetrics as LinkedInPost['metrics']
        } as LinkedInPost
        break
      case 'youtube':
        newPost = {
          ...basePost,
          platform: 'youtube',
          content: {
            title: youtubeData.title,
            description: youtubeData.description,
            isShort: youtubeData.isShort
          },
          metrics: parsedMetrics as YouTubePost['metrics']
        } as YouTubePost
        break
      case 'instagram':
        newPost = {
          ...basePost,
          platform: 'instagram',
          content: {
            caption: instagramData.caption,
            type: instagramData.type
          },
          metrics: parsedMetrics as InstagramPost['metrics']
        } as InstagramPost
        break
      case 'skool':
        newPost = {
          ...basePost,
          platform: 'skool',
          content: {
            title: skoolData.title,
            body: skoolData.body,
            category: skoolData.category
          },
          metrics: parsedMetrics as SkoolPost['metrics']
        } as SkoolPost
        break
      default:
        return
    }
    
    addPost(newPost)
    setStep('done')
  }
  
  const canProceedToMetrics = () => {
    if (!platform) return false
    switch (platform) {
      case 'linkedin':
        return linkedInData.text.length > 0 || linkedInData.hook.length > 0
      case 'youtube':
        return youtubeData.title.length > 0
      case 'instagram':
        return instagramData.caption.length > 0
      case 'skool':
        return skoolData.title.length > 0 || skoolData.body.length > 0
      default:
        return false
    }
  }
  
  const renderPlatformStep = () => (
    <div className="space-y-4">
      <p className="text-[13px] text-neutral-500">
        Wähle die Plattform für den historischen Post
      </p>
      <div className="grid grid-cols-2 gap-3">
        {(['linkedin', 'youtube', 'instagram', 'skool'] as PlatformId[]).map((p) => {
          const Icon = platformIcons[p]
          const pData = PLATFORMS[p]
          const isSelected = platform === p
          
          return (
            <button
              key={p}
              onClick={() => setPlatform(p)}
              className={cn(
                "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                isSelected 
                  ? "border-white bg-neutral-800/50" 
                  : "border-neutral-700 hover:border-neutral-600"
              )}
            >
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: pData.color }}
              >
                <Icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-[14px] font-medium text-white">{pData.name}</p>
              </div>
            </button>
          )
        })}
      </div>
      
      {platform && (
        <div className="pt-4 border-t">
          <Label className="text-[12px]">Veröffentlichungsdatum</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start mt-1.5">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(publishedAt, "d. MMMM yyyy", { locale: de })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={publishedAt}
                onSelect={(date) => date && setPublishedAt(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )
  
  const renderContentStep = () => {
    if (!platform) return null
    
    return (
      <div className="space-y-4">
        <p className="text-[13px] text-neutral-500">
          Gib den Inhalt des Posts ein
        </p>
        
        {platform === 'linkedin' && (
          <>
            <div>
              <Label className="text-[12px]">Hook (erste Zeilen)</Label>
              <Textarea
                value={linkedInData.hook}
                onChange={(e) => setLinkedInData(d => ({ ...d, hook: e.target.value }))}
                placeholder="Die Aufmerksamkeit erregenden ersten Zeilen..."
                className="mt-1.5 min-h-[80px]"
              />
            </div>
            <div>
              <Label className="text-[12px]">Haupttext</Label>
              <Textarea
                value={linkedInData.text}
                onChange={(e) => setLinkedInData(d => ({ ...d, text: e.target.value }))}
                placeholder="Der Hauptinhalt des Posts..."
                className="mt-1.5 min-h-[150px]"
              />
            </div>
            <div>
              <Label className="text-[12px]">Call-to-Action</Label>
              <Input
                value={linkedInData.cta}
                onChange={(e) => setLinkedInData(d => ({ ...d, cta: e.target.value }))}
                placeholder="z.B. 'Kommentiere unten 👇'"
                className="mt-1.5"
              />
            </div>
          </>
        )}
        
        {platform === 'youtube' && (
          <>
            <div>
              <Label className="text-[12px]">Video-Typ</Label>
              <div className="flex gap-2 mt-1.5">
                <Button
                  variant={!youtubeData.isShort ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setYoutubeData(d => ({ ...d, isShort: false }))}
                >
                  Long-Form
                </Button>
                <Button
                  variant={youtubeData.isShort ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setYoutubeData(d => ({ ...d, isShort: true }))}
                >
                  Short
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-[12px]">Titel</Label>
              <Input
                value={youtubeData.title}
                onChange={(e) => setYoutubeData(d => ({ ...d, title: e.target.value }))}
                placeholder="Video-Titel..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-[12px]">Beschreibung</Label>
              <Textarea
                value={youtubeData.description}
                onChange={(e) => setYoutubeData(d => ({ ...d, description: e.target.value }))}
                placeholder="Video-Beschreibung..."
                className="mt-1.5 min-h-[150px]"
              />
            </div>
          </>
        )}
        
        {platform === 'instagram' && (
          <>
            <div>
              <Label className="text-[12px]">Post-Typ</Label>
              <Select 
                value={instagramData.type} 
                onValueChange={(v) => setInstagramData(d => ({ ...d, type: v as any }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">Feed Post</SelectItem>
                  <SelectItem value="reel">Reel</SelectItem>
                  <SelectItem value="carousel">Carousel</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px]">Caption</Label>
              <Textarea
                value={instagramData.caption}
                onChange={(e) => setInstagramData(d => ({ ...d, caption: e.target.value }))}
                placeholder="Caption..."
                className="mt-1.5 min-h-[150px]"
              />
            </div>
          </>
        )}
        
        {platform === 'skool' && (
          <>
            <div>
              <Label className="text-[12px]">Titel</Label>
              <Input
                value={skoolData.title}
                onChange={(e) => setSkoolData(d => ({ ...d, title: e.target.value }))}
                placeholder="Post-Titel..."
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-[12px]">Kategorie</Label>
              <Select 
                value={skoolData.category} 
                onValueChange={(v) => setSkoolData(d => ({ ...d, category: v }))}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Kategorie wählen..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Announcements">Announcements</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Questions">Questions</SelectItem>
                  <SelectItem value="Training">Training</SelectItem>
                  <SelectItem value="Resources">Resources</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[12px]">Inhalt</Label>
              <Textarea
                value={skoolData.body}
                onChange={(e) => setSkoolData(d => ({ ...d, body: e.target.value }))}
                placeholder="Post-Inhalt..."
                className="mt-1.5 min-h-[150px]"
              />
            </div>
          </>
        )}
      </div>
    )
  }
  
  const renderMetricsStep = () => {
    if (!platform) return null
    
    const metricFields = {
      linkedin: [
        { key: 'impressions', label: 'Impressionen', icon: Eye },
        { key: 'likes', label: 'Likes', icon: Heart },
        { key: 'comments', label: 'Kommentare', icon: MessageSquare },
        { key: 'shares', label: 'Reposts', icon: Share2 },
        { key: 'clicks', label: 'Klicks', icon: MousePointer },
      ],
      youtube: [
        { key: 'views', label: 'Views', icon: Eye },
        { key: 'likes', label: 'Likes', icon: Heart },
        { key: 'comments', label: 'Kommentare', icon: MessageSquare },
        { key: 'watchTime', label: 'Watch Time (min)', icon: Clock },
        { key: 'subscribers', label: 'Neue Abos', icon: Users },
      ],
      instagram: [
        { key: 'impressions', label: 'Impressionen', icon: Eye },
        { key: 'reach', label: 'Reichweite', icon: TrendingUp },
        { key: 'likes', label: 'Likes', icon: Heart },
        { key: 'comments', label: 'Kommentare', icon: MessageSquare },
        { key: 'saves', label: 'Saves', icon: Bookmark },
        { key: 'shares', label: 'Shares', icon: Share2 },
      ],
      skool: [
        { key: 'views', label: 'Views', icon: Eye },
        { key: 'likes', label: 'Likes', icon: Heart },
        { key: 'comments', label: 'Kommentare', icon: MessageSquare },
      ],
    }
    
    const fields = metricFields[platform]
    
    return (
      <div className="space-y-4">
        <p className="text-[13px] text-neutral-500">
          Gib die Performance-Metriken ein (optional, aber empfohlen für AI-Learning)
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          {fields.map(field => {
            const Icon = field.icon
            return (
              <div key={field.key}>
                <Label className="text-[11px] text-neutral-500 flex items-center gap-1">
                  <Icon className="h-3 w-3" />
                  {field.label}
                </Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={metrics[field.key] || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '')
                    setMetrics(m => ({ ...m, [field.key]: val }))
                  }}
                  placeholder="0"
                  className="mt-1"
                />
              </div>
            )
          })}
        </div>
        
        <p className="text-[11px] text-neutral-500 pt-2">
          Tipp: Die Metriken sollten nach 7 Tagen erhoben werden für Vergleichbarkeit
        </p>
      </div>
    )
  }
  
  const renderDoneStep = () => (
    <div className="text-center py-8">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-[16px] font-medium text-white mb-2">Post importiert!</h3>
      <p className="text-[13px] text-neutral-500 mb-6">
        Der historische Post wurde erfolgreich hinzugefügt und steht jetzt für AI-Analyse zur Verfügung.
      </p>
      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={handleClose}>
          Schließen
        </Button>
        <Button onClick={handleReset}>
          Weiteren Post importieren
        </Button>
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Historischen Post importieren</DialogTitle>
          <DialogDescription>
            Importiere einen bereits veröffentlichten Post mit seinen Performance-Daten
          </DialogDescription>
        </DialogHeader>
        
        {/* Progress Indicator */}
        {step !== 'done' && (
          <div className="flex items-center justify-center gap-2 py-2">
            {(['platform', 'content', 'metrics'] as Step[]).map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-medium",
                  step === s 
                    ? "bg-white text-black" 
                    : ['platform', 'content', 'metrics'].indexOf(step) > i
                      ? "bg-green-100 text-green-600"
                      : "bg-neutral-800 text-neutral-500"
                )}>
                  {['platform', 'content', 'metrics'].indexOf(step) > i ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    i + 1
                  )}
                </div>
                {i < 2 && <div className="w-12 h-0.5 bg-neutral-700 mx-1" />}
              </div>
            ))}
          </div>
        )}
        
        {/* Content */}
        <div className="py-4 max-h-[400px] overflow-y-auto">
          {step === 'platform' && renderPlatformStep()}
          {step === 'content' && renderContentStep()}
          {step === 'metrics' && renderMetricsStep()}
          {step === 'done' && renderDoneStep()}
        </div>
        
        {/* Actions */}
        {step !== 'done' && (
          <div className="flex items-center justify-between pt-4 border-t">
            <Button
              variant="ghost"
              onClick={() => {
                if (step === 'content') setStep('platform')
                else if (step === 'metrics') setStep('content')
              }}
              disabled={step === 'platform'}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            
            {step === 'platform' && (
              <Button onClick={() => setStep('content')} disabled={!platform}>
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {step === 'content' && (
              <Button onClick={() => setStep('metrics')} disabled={!canProceedToMetrics()}>
                Weiter
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
            
            {step === 'metrics' && (
              <Button onClick={handleSave}>
                <Check className="h-4 w-4 mr-2" />
                Post importieren
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
