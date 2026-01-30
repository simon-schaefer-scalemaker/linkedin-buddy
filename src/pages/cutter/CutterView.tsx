import { useState, useRef } from 'react'
import { 
  Video, 
  Upload, 
  Check, 
  Lock, 
  ExternalLink, 
  Loader2,
  CheckCircle2,
  Clock,
  FileText,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCutterSharesStore, CutterShare } from '@/lib/store'
import { uploadVideo, validateVideoFile, formatFileSize, isSupabaseConfigured } from '@/lib/video-upload'
import { sendCutterCompletionNotification } from '@/lib/slack-notifications'
import { cn } from '@/lib/utils'

export function CutterView() {
  const [password, setPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authError, setAuthError] = useState('')
  
  const { getSharesByPassword, updateShareStatus, setFinalVideo, updateShare } = useCutterSharesStore()
  
  const handleLogin = () => {
    const shares = getSharesByPassword(password.trim())
    if (shares.length > 0) {
      setIsAuthenticated(true)
      setAuthError('')
    } else {
      setAuthError('Ungültiges Passwort oder keine Aufgaben vorhanden')
    }
  }
  
  const shares = isAuthenticated ? getSharesByPassword(password) : []
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-6 w-6 text-orange-600" />
            </div>
            <CardTitle className="text-xl">Cutter-Bereich</CardTitle>
            <p className="text-[13px] text-gray-500 mt-2">
              Gib das Passwort ein, um deine Aufgaben zu sehen
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Passwort eingeben..."
              className="text-center"
            />
            {authError && (
              <p className="text-[12px] text-red-600 text-center">{authError}</p>
            )}
            <Button 
              onClick={handleLogin}
              disabled={!password.trim()}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              Einloggen
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Meine Aufgaben</h1>
          <p className="text-[14px] text-gray-500 mt-1">
            {shares.length} {shares.length === 1 ? 'Video' : 'Videos'} zu bearbeiten
          </p>
        </div>
        
        {/* Task List */}
        <div className="space-y-4">
          {shares.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-[15px] font-medium text-gray-700">Keine offenen Aufgaben</p>
                <p className="text-[13px] text-gray-500 mt-1">Alle Videos wurden bearbeitet</p>
              </CardContent>
            </Card>
          ) : (
            shares.map((share) => (
              <CutterTaskCard 
                key={share.id} 
                share={share}
                onStatusChange={(status) => updateShareStatus(share.id, status)}
                onFinalVideoUpload={(url, notes) => setFinalVideo(share.id, url, notes)}
                onUpdateShare={(updates) => updateShare(share.id, updates)}
              />
            ))
          )}
        </div>
        
        {/* Logout */}
        <div className="mt-8 text-center">
          <Button 
            variant="ghost" 
            onClick={() => {
              setIsAuthenticated(false)
              setPassword('')
            }}
            className="text-gray-500"
          >
            Ausloggen
          </Button>
        </div>
      </div>
    </div>
  )
}

// Individual Task Card
interface CutterTaskCardProps {
  share: CutterShare
  onStatusChange: (status: 'pending' | 'in_progress' | 'completed') => void
  onFinalVideoUpload: (url: string, notes: string) => void
  onUpdateShare: (updates: Partial<CutterShare>) => void
}

function CutterTaskCard({ share, onStatusChange, onFinalVideoUpload, onUpdateShare }: CutterTaskCardProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [cutterNotes, setCutterNotes] = useState(share.cutterNotes || '')
  const [manualUrl, setManualUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Send Slack notification when video is completed
  const notifyCreator = async (videoUrl: string, notes: string) => {
    try {
      await sendCutterCompletionNotification({
        postTitle: share.postTitle,
        postId: share.postId,
        finalVideoUrl: videoUrl,
        cutterNotes: notes
      }, window.location.origin)
    } catch (err) {
      console.error('Failed to send Slack notification:', err)
    }
  }
  
  const handleVideoSelect = async (file: File) => {
    setUploadError(null)
    
    const validation = validateVideoFile(file)
    if (!validation.valid) {
      setUploadError(validation.error || 'Ungültige Datei')
      return
    }
    
    if (!isSupabaseConfigured()) {
      setUploadError('Upload nicht verfügbar. Bitte manuellen Link eingeben.')
      return
    }
    
    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 200)
      
      const result = await uploadVideo(file, 'final', share.postId)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      if (result.success && result.url) {
        onFinalVideoUpload(result.url, cutterNotes)
        // Notify creator via Slack
        notifyCreator(result.url, cutterNotes)
      } else {
        setUploadError(result.error || 'Upload fehlgeschlagen')
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload fehlgeschlagen')
    } finally {
      setIsUploading(false)
    }
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('video/')) {
      handleVideoSelect(file)
    }
  }
  
  const handleManualSubmit = () => {
    if (manualUrl.trim()) {
      onFinalVideoUpload(manualUrl.trim(), cutterNotes)
      // Notify creator via Slack
      notifyCreator(manualUrl.trim(), cutterNotes)
    }
  }
  
  const startWorking = () => {
    onStatusChange('in_progress')
  }
  
  return (
    <Card className={cn(
      "overflow-hidden",
      share.status === 'completed' && "opacity-60"
    )}>
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-[15px]">{share.postTitle || 'Unbenannter Post'}</CardTitle>
            <p className="text-[12px] text-gray-500 mt-1">
              Erstellt am {new Date(share.createdAt).toLocaleDateString('de-DE')}
            </p>
          </div>
          <div className={cn(
            "px-2.5 py-1 rounded-full text-[11px] font-medium",
            share.status === 'completed' 
              ? "bg-green-100 text-green-700"
              : share.status === 'in_progress'
              ? "bg-yellow-100 text-yellow-700"
              : "bg-blue-100 text-blue-700"
          )}>
            {share.status === 'completed' 
              ? 'Fertig' 
              : share.status === 'in_progress'
              ? 'In Bearbeitung'
              : 'Neu'}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Instructions */}
        {share.instructions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[12px] font-medium text-blue-700 mb-1">Anweisungen</p>
                <p className="text-[13px] text-blue-800 whitespace-pre-wrap">{share.instructions}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Raw Video */}
        <div>
          <label className="text-[12px] font-medium text-gray-700 mb-2 block">
            Rohmaterial
          </label>
          <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
            <Video className="h-8 w-8 text-orange-500" />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-gray-700 truncate">{share.rawVideoUrl}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open(share.rawVideoUrl || '', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Öffnen
            </Button>
          </div>
        </div>
        
        {share.status !== 'completed' && (
          <>
            {/* Start Working Button */}
            {share.status === 'pending' && (
              <Button 
                onClick={startWorking}
                className="w-full"
                variant="outline"
              >
                <Clock className="h-4 w-4 mr-2" />
                Bearbeitung starten
              </Button>
            )}
            
            {/* Upload Final Video */}
            {share.status === 'in_progress' && (
              <div className="space-y-4">
                <label className="text-[12px] font-medium text-gray-700 block">
                  Finales Video hochladen
                </label>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                    isDragging 
                      ? "border-green-400 bg-green-50" 
                      : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  )}
                >
                  {isUploading ? (
                    <div className="space-y-3">
                      <Loader2 className="h-8 w-8 mx-auto animate-spin text-green-500" />
                      <p className="text-[13px] text-gray-600">Wird hochgeladen... {uploadProgress}%</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all" 
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 mx-auto text-gray-400 mb-3" />
                      <p className="text-[13px] text-gray-600 mb-1">
                        Fertiges Video hier ablegen oder klicken
                      </p>
                      <p className="text-[11px] text-gray-400">
                        MP4, MOV, WebM bis 500MB
                      </p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleVideoSelect(file)
                    }}
                  />
                </div>
                
                {uploadError && (
                  <p className="text-[12px] text-red-600">{uploadError}</p>
                )}
                
                {/* Manual URL Input (Fallback) */}
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-[11px] text-gray-500 mb-2">Oder Link zum Video einfügen:</p>
                  <div className="flex gap-2">
                    <Input
                      value={manualUrl}
                      onChange={(e) => setManualUrl(e.target.value)}
                      placeholder="https://..."
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleManualSubmit}
                      disabled={!manualUrl.trim()}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Notes */}
                <div>
                  <label className="text-[12px] font-medium text-gray-700 mb-1.5 block">
                    Notizen (optional)
                  </label>
                  <Textarea
                    value={cutterNotes}
                    onChange={(e) => setCutterNotes(e.target.value)}
                    placeholder="z.B. Änderungen, Anmerkungen..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>
            )}
          </>
        )}
        
        {/* Completed State */}
        {share.status === 'completed' && share.finalVideoUrl && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div className="flex-1">
                <p className="text-[13px] font-medium text-green-700">Fertig!</p>
                <p className="text-[11px] text-green-600 truncate">{share.finalVideoUrl}</p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open(share.finalVideoUrl || '', '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
